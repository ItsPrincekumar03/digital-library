const fs = require('fs/promises');

// Module 13.2/13.5 — text-only PDF extraction (no image rendering, no canvas).
// Uses pdfjs-dist (pure JavaScript). Returns per-page text in reading order.
//
// Pipeline per page:
//   1. pdf.js text items -> lines grouped by baseline (y) bands.
//   2. Within a line, items are ordered left-to-right and joined using the
//      horizontal gap between them (prevents both glued words and split
//      letters from letterspaced/justified runs).
//   3. Two-column pages are detected from a shared gutter and read
//      top-to-bottom per column instead of across the spread.
//   4. Lines become blocks: a new block starts on blank-line evidence or a
//      genuine size change (relative, not the old absolute >2pt rule that
//      shattered title pages into one-word paragraphs).
//   5. Blocks are classified (heading / subheading / paragraph / list-item /
//      toc-entry / caption / pagenum) from size, weight, and text patterns.
//
// Backward compatibility: every page still exposes { pageNumber, text,
// paragraphs }. New optional field `blocks` carries [{ kind, text }]; the
// reader prefers `blocks` and falls back to `paragraphs` for documents
// extracted before this change.

async function extractPdfText(pdfPath) {
    const data = await fs.readFile(pdfPath);
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(data),
        verbosity: 0,
    });
    const doc = await loadingTask.promise;

    try {
        const pages = [];

        for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
            const page = await doc.getPage(pageNumber);

            try {
                pages.push({
                    pageNumber,
                    ...pageText(await page.getTextContent()),
                });
            } finally {
                page.cleanup();
            }
        }

        demoteRunningHeads(pages);

        return {
            pageCount: doc.numPages,
            textChars: pages.reduce((sum, p) => sum + p.text.length, 0),
            pages,
        };
    } finally {
        // Release the worker/transport. Cleanup must never discard an
        // otherwise successful extraction, so failures here are ignored.
        if (loadingTask && typeof loadingTask.destroy === 'function') {
            await loadingTask.destroy().catch(() => {});
        }
    }
}

function itemFontSize(item) {
    const t = (item && item.transform) || [0, 0, 0, 0, 0, 0];
    const horizontal = Math.sqrt(t[0] * t[0] + t[1] * t[1]);
    const vertical = Math.sqrt(t[2] * t[2] + t[3] * t[3]);
    return Math.max(horizontal, vertical) || 0;
}

// Conservative bold signal from the PDF font name. Bold alone never makes a
// heading; it is only supporting evidence alongside size or text patterns.
function itemIsBold(item) {
    const name =
        item && typeof item.fontName === 'string' ? item.fontName : '';

    if (!name) {
        return false;
    }

    if (/blackadder|blackletter/i.test(name)) {
        return false;
    }

    return /bold|demi|heavy|black/i.test(name);
}

function estimatedWidth(item, fontSize) {
    if (item && Number.isFinite(item.width) && item.width > 0) {
        return item.width;
    }

    const length = item && typeof item.str === 'string' ? item.str.length : 0;
    return length * fontSize * 0.5;
}

// Step 1+2: group raw items into lines and join each line's text.
function buildLines(textContent) {
    const raw = Array.isArray(textContent.items) ? textContent.items : [];
    const items = [];

    for (const item of raw) {
        if (!item || typeof item.str !== 'string') {
            continue;
        }

        const fontSize = itemFontSize(item);

        if (!(fontSize > 0)) {
            continue;
        }

        const t = item.transform || [0, 0, 0, 0, 0, 0];
        items.push({
            x: t[4] || 0,
            y: t[5] || 0,
            endX: (t[4] || 0) + estimatedWidth(item, fontSize),
            fontSize,
            bold: itemIsBold(item),
            chars: item.str.length,
            str: item.str,
            forceBreak: item.hasEOL === true,
        });
    }

    // Top-to-bottom, then left-to-right (stable for equal keys).
    items.sort((a, b) => {
        if (a.y !== b.y) {
            return b.y - a.y;
        }
        return a.x - b.x;
    });

    const lines = [];
    let current = null;

    function closeLine() {
        if (current && current.items.length > 0) {
            current.items.sort((a, b) => a.x - b.x);
            lines.push(finishLine(current));
        }

        current = null;
    }

    for (const item of items) {
        const tolerance = current
            ? Math.max(2.5, 0.35 * Math.max(item.fontSize, current.maxFs))
            : 0;

        if (
            !current ||
            Math.abs(item.y - current.y) > tolerance ||
            current.breakAfter
        ) {
            closeLine();
            current = {
                y: item.y,
                items: [],
                maxFs: 0,
                breakAfter: false,
            };
        }

        current.items.push(item);

        if (item.fontSize > current.maxFs) {
            current.maxFs = item.fontSize;
        }

        if (item.forceBreak) {
            current.breakAfter = true;
        }
    }

    closeLine();
    return lines;
}

function finishLine(line) {
    let text = '';
    let pendingSpace = false;
    let prevEnd = null;
    let prevFs = line.maxFs;
    let boldChars = 0;
    let totalChars = 0;
    const sizes = [];

    for (const item of line.items) {
        const core = item.str.trim();
        const leading = /^\s/.test(item.str);
        const trailing = /\s$/.test(item.str);

        if (!core) {
            if (leading || trailing) {
                pendingSpace = true;
            }

            continue;
        }

        sizes.push(item.fontSize);
        totalChars += core.length;

        if (item.bold) {
            boldChars += core.length;
        }

        if (text === '') {
            text = core;
        } else {
            const gap = prevEnd === null ? 0 : item.x - prevEnd;
            // A real word gap (or an explicit space in the content) earns a
            // space; kerned fragments with ~zero gap are joined directly.
            const needSpace =
                leading || pendingSpace || gap > 0.25 * prevFs;
            text += (needSpace ? ' ' : '') + core;
        }

        prevEnd = item.endX;
        prevFs = item.fontSize;
        pendingSpace = trailing;
    }

    sizes.sort((a, b) => a - b);
    const fontSize = sizes.length > 0
        ? sizes[Math.floor(sizes.length / 2)]
        : line.maxFs;

    let minX = Infinity;
    let maxX = -Infinity;

    for (const item of line.items) {
        if (item.x < minX) {
            minX = item.x;
        }

        if (item.endX > maxX) {
            maxX = item.endX;
        }
    }

    return {
        y: line.y,
        xStart: minX === Infinity ? 0 : minX,
        xEnd: maxX === -Infinity ? 0 : maxX,
        fontSize,
        bold: totalChars > 0 && boldChars / totalChars >= 0.4,
        text: text.replace(/\s+/g, ' ').trim(),
    };
}

// Step 3: order lines for reading. Single-column pages keep y-order.
// Two-column pages (a gutter x shared by several bands) read top-to-bottom
// per column; full-width bands (headings) stay in flow position.
function orderLines(lines) {
    const content = lines.filter((line) => line.text);

    if (content.length < 4) {
        return content;
    }

    const sizes = content
        .map((line) => line.fontSize)
        .sort((a, b) => a - b);
    const medianFs = sizes[Math.floor(sizes.length / 2)] || 10;

    const pageLeft = Math.min(...content.map((line) => line.xStart));
    const pageRight = Math.max(...content.map((line) => line.xEnd));
    const pageWidth = pageRight - pageLeft;

    if (!(pageWidth > 0)) {
        return content;
    }

    const narrow = content.filter(
        (line) => line.xEnd - line.xStart <= 0.6 * pageWidth
    );

    if (narrow.length < 3) {
        return content;
    }

    // A gutter candidate: the widest internal gap between narrow-line starts.
    const starts = [...new Set(narrow.map((line) => line.xStart))].sort(
        (a, b) => a - b
    );
    let gutter = 0;
    let gutterSize = 0;

    for (let i = 1; i < starts.length; i++) {
        const gap = starts[i] - starts[i - 1];

        if (gap > gutterSize) {
            gutterSize = gap;
            gutter = (starts[i] + starts[i - 1]) / 2;
        }
    }

    const gutterNeeded = Math.max(72, 4 * medianFs);

    if (!(gutterSize >= gutterNeeded)) {
        return content;
    }

    const left = narrow.filter((line) => line.xStart < gutter);
    const right = narrow.filter((line) => line.xStart >= gutter);

    if (left.length < 2 || right.length < 2) {
        return content;
    }

    // Both clusters must actually interleave vertically; otherwise this is
    // not a column layout (e.g. an indented block under a wide paragraph).
    const top = (group) => Math.max(...group.map((line) => line.y));
    const bottom = (group) => Math.min(...group.map((line) => line.y));

    if (top(left) < bottom(right) || top(right) < bottom(left)) {
        return content;
    }

    const ordered = [];
    const leftBuffer = [];
    const rightBuffer = [];

    function flushColumns() {
        // Documents are read left-to-right, so the left column's lines come
        // before the right column's lines at each flush point.
        ordered.push(...leftBuffer, ...rightBuffer);
        leftBuffer.length = 0;
        rightBuffer.length = 0;
    }

    for (const line of content) {
        const wide = line.xEnd - line.xStart > 0.6 * pageWidth;

        if (wide) {
            flushColumns();
            ordered.push(line);
        } else if (line.xStart < gutter) {
            leftBuffer.push(line);
        } else {
            rightBuffer.push(line);
        }
    }

    flushColumns();
    return ordered;
}

const CHAPTER_PATTERN = /^(chapter|part|section|book|volume|act|scene|canto)\b/i;
const NUMBERED_PATTERN = /^\d+(\.\d+)*\s+\S/;
const LIST_PATTERN = /^(\d+[.)]|[•\-–—*]|[ivxlcdm]{2,}[.)])\s+\S/i;
const TOC_LEADER_PATTERN = /([.…]{3,}|…{2,})\s*\d*\s*$/;
const CAPTION_PATTERN = /^(figure|fig\.|table|plate|image|photo|chart)\s+\d+/i;
const PAGE_NUMBER_PATTERN = /^\d{1,4}$/;

// Step 4+5: group ordered lines into blocks and classify each block.
function buildBlocks(orderedLines, medianFs) {
    const blocks = [];
    let current = null;

    function closeBlock() {
        if (current && current.lines.length > 0) {
            blocks.push(finishBlock(current, medianFs));
        }

        current = null;
    }

    for (const line of orderedLines) {
        let startNew = !current;

        if (current) {
            const dy = current.lastY - line.y;
            const refFs = Math.max(current.lastFs, line.fontSize);
            const ratio = line.fontSize / (current.lastFs || line.fontSize);

            if (
                dy > 1.55 * refFs ||
                ratio >= 1.28 ||
                ratio <= 0.78
            ) {
                startNew = true;
            }
        }

        if (startNew) {
            closeBlock();
            current = { lines: [], lastY: 0, lastFs: 0 };
        }

        current.lines.push(line);
        current.lastY = line.y;
        current.lastFs = line.fontSize;
    }

    closeBlock();
    return blocks;
}

function finishBlock(block, medianFs) {
    const lines = block.lines;
    const pieces = [];
    let text = '';

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const previous = i > 0 ? lines[i - 1] : null;
        const continuing =
            previous &&
            Math.abs(line.xStart - previous.xStart) <= line.fontSize &&
            Math.abs(
                line.xEnd - line.xStart - (previous.xEnd - previous.xStart)
            ) <= 2 * line.fontSize;

        if (i === 0) {
            text = line.text;
        } else if (continuing) {
            // Soft-wrapped body text: rejoin with a space.
            text += ` ${line.text}`;
        } else {
            pieces.push(text);
            text = line.text;
        }
    }

    pieces.push(text);

    const fullText = pieces.join('\n');
    const maxFs = Math.max(...lines.map((line) => line.fontSize));
    const boldLines = lines.filter((line) => line.bold).length;
    const bold = boldLines >= Math.max(1, Math.ceil(lines.length / 2));
    const ratio = medianFs > 0 ? maxFs / medianFs : 1;
    const single = lines.length === 1;
    const totalLength = fullText.replace(/\n/g, ' ').trim().length;
    const firstPiece = (pieces[0] || '').trim();

    let kind = 'paragraph';

    if (single && PAGE_NUMBER_PATTERN.test(firstPiece)) {
        kind = 'pagenum';
    } else if (single && TOC_LEADER_PATTERN.test(firstPiece)) {
        kind = 'toc-entry';
    } else if (single && LIST_PATTERN.test(firstPiece)) {
        kind = 'list-item';
    } else if (
        single &&
        firstPiece.length <= 160 &&
        CHAPTER_PATTERN.test(firstPiece) &&
        (ratio >= 1.0 || bold)
    ) {
        kind = 'heading';
    } else if (lines.length <= 2 && totalLength <= 150 && ratio >= 1.32) {
        kind = 'heading';
    } else if (
        single &&
        firstPiece.length <= 120 &&
        (ratio >= 1.14 ||
            (bold && ratio >= 1.04) ||
            (NUMBERED_PATTERN.test(firstPiece) &&
                (ratio >= 1.04 || bold)) ||
            (CHAPTER_PATTERN.test(firstPiece) && ratio >= 0.95))
    ) {
        kind = 'subheading';
    } else if (single && firstPiece.length <= 140 && CAPTION_PATTERN.test(firstPiece)) {
        kind = 'caption';
    }

    // An isolated 1–2 character line is never a heading on its own (drop
    // caps, initials, ornaments). It stays plain text here; the merge pass
    // below may reattach it to the paragraph it belongs to.
    if (single && firstPiece.length <= 2 && kind !== 'pagenum') {
        kind = 'paragraph';
    }

    return { kind, text: fullText };
}

function pageMedianFontSize(lines) {
    const sizes = lines
        .filter((line) => line.text)
        .map((line) => line.fontSize)
        .sort((a, b) => a - b);

    if (sizes.length === 0) {
        return 0;
    }

    return sizes[Math.floor(sizes.length / 2)];
}

function pageText(textContent) {
    const lines = buildLines(textContent);
    const ordered = orderLines(lines);
    let blocks = buildBlocks(ordered, pageMedianFontSize(lines));
    blocks = reattachFragments(blocks);

    // 'pagenum' blocks are layout furniture: the reader already labels every
    // page, so they are excluded from text/paragraphs but never deleted from
    // the source PDF.
    const readable = blocks.filter((block) => block.kind !== 'pagenum');
    const paragraphs = readable.map((block) => block.text);

    return {
        text: paragraphs.join('\n\n'),
        paragraphs,
        blocks: blocks.map((block) => ({ kind: block.kind, text: block.text })),
    };
}

// Reattaches isolated 1–2 character fragments (drop caps, initials) to the
// paragraph that follows them instead of leaving them as stray one-letter
// paragraphs. Only merges into a plain paragraph, and never across a page;
// nothing is invented — the fragment text is kept verbatim with a space.
function reattachFragments(blocks) {
    const merged = [];

    for (let i = 0; i < blocks.length; i++) {
        const block = blocks[i];
        const text = typeof block.text === 'string' ? block.text.trim() : '';
        const next = blocks[i + 1];
        const singleLine = !text.includes('\n') && !block.text.includes('\n');

        if (
            block.kind === 'paragraph' &&
            singleLine &&
            text.length > 0 &&
            text.length <= 2 &&
            next &&
            next.kind === 'paragraph' &&
            typeof next.text === 'string' &&
            next.text.trim()
        ) {
            next.text = `${text} ${next.text.trim()}`;
            continue;
        }

        merged.push(block);
    }

    return merged;
}

// Repeated identical single-line headings across pages are running
// headers/footers, not real structure: demote them to plain paragraphs.
function demoteRunningHeads(pages) {
    const counts = new Map();

    for (const page of pages) {
        if (!page || !Array.isArray(page.blocks)) {
            continue;
        }

        for (const block of page.blocks) {
            if (
                block &&
                (block.kind === 'heading' || block.kind === 'subheading') &&
                typeof block.text === 'string' &&
                !block.text.includes('\n')
            ) {
                const key = block.text.toLowerCase().replace(/\s+/g, ' ').trim();
                counts.set(key, (counts.get(key) || 0) + 1);
            }
        }
    }

    for (const page of pages) {
        if (!page || !Array.isArray(page.blocks)) {
            continue;
        }

        for (const block of page.blocks) {
            if (
                block &&
                (block.kind === 'heading' || block.kind === 'subheading') &&
                typeof block.text === 'string' &&
                !block.text.includes('\n')
            ) {
                const key = block.text.toLowerCase().replace(/\s+/g, ' ').trim();

                if ((counts.get(key) || 0) >= 3) {
                    block.kind = 'paragraph';
                }
            }
        }
    }

    // Keep paragraphs/text consistent with any demotion above.
    for (const page of pages) {
        if (!page || !Array.isArray(page.blocks)) {
            continue;
        }

        const readable = page.blocks.filter((block) => block.kind !== 'pagenum');
        page.paragraphs = readable.map((block) => block.text);
        page.text = page.paragraphs.join('\n\n');
    }
}

module.exports = { extractPdfText };
