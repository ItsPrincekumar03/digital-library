'use strict';

// Module 27.5 — Safe book cover detection, extraction storage, and SVG fallback.
//
// Security rules:
//   - Only verified raster magic bytes (PNG, JPEG, GIF, WEBP) are accepted for
//     extracted cover files on disk.
//   - SVG fallback covers are generated server-side from escaped metadata with
//     strict XML escaping and zero <script> or external URLs.

const fs = require('fs/promises');
const path = require('path');
const {
    buildCoverFileName,
    resolvePublicCoverPath,
    resolvePrivateCoverPath,
    fileExists,
} = require('./fileStorage');

const COVER_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
const MAX_COVER_BYTES = 10 * 1024 * 1024;

const PNG_SIG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const GIF87_SIG = Buffer.from('GIF87a', 'ascii');
const GIF89_SIG = Buffer.from('GIF89a', 'ascii');

function detectImageFormat(buffer) {
    if (!Buffer.isBuffer(buffer) || buffer.length < 12 || buffer.length > MAX_COVER_BYTES) {
        return null;
    }

    if (buffer.subarray(0, 8).equals(PNG_SIG)) {
        return { mimeType: 'image/png', ext: '.png' };
    }

    // JPEG SOI + marker
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return { mimeType: 'image/jpeg', ext: '.jpg' };
    }

    if (buffer.subarray(0, 6).equals(GIF87_SIG) || buffer.subarray(0, 6).equals(GIF89_SIG)) {
        return { mimeType: 'image/gif', ext: '.gif' };
    }

    // RIFF....WEBP
    if (
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
        return { mimeType: 'image/webp', ext: '.webp' };
    }

    return null;
}

function resolveCoverByMode(fileName, isPrivate) {
    return isPrivate
        ? resolvePrivateCoverPath(fileName)
        : resolvePublicCoverPath(fileName);
}

async function saveExtractedCover(storedFileName, buffer, isPrivate = false) {
    const detected = detectImageFormat(buffer);
    if (!detected || !storedFileName) {
        return null;
    }

    const coverFileName = buildCoverFileName(storedFileName, detected.ext);
    const targetPath = resolveCoverByMode(coverFileName, isPrivate);
    const tempPath = `${targetPath}.tmp`;

    await fs.writeFile(tempPath, buffer);
    await fs.rename(tempPath, targetPath);

    return {
        coverFileName,
        targetPath,
        mimeType: detected.mimeType,
        sizeBytes: buffer.length,
    };
}

async function findExtractedCoverBuffer(storedFileName, isPrivate = false) {
    if (!storedFileName) {
        return null;
    }

    for (const ext of COVER_EXTENSIONS) {
        const candidateName = buildCoverFileName(storedFileName, ext);
        let candidatePath;
        try {
            candidatePath = resolveCoverByMode(candidateName, isPrivate);
        } catch {
            continue;
        }

        if (!(await fileExists(candidatePath))) {
            continue;
        }

        try {
            const data = await fs.readFile(candidatePath);
            const detected = detectImageFormat(data);
            if (detected) {
                return {
                    buffer: data,
                    mimeType: detected.mimeType,
                    sizeBytes: data.length,
                };
            }
        } catch {
            // Try next candidate
        }
    }

    return null;
}

function escapeXml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function wrapTitleLines(title, maxChars = 18, maxLines = 4) {
    const clean = String(title || 'Untitled Book').replace(/\s+/g, ' ').trim() || 'Untitled Book';
    const words = clean.split(' ');
    const lines = [];
    let current = '';

    for (const word of words) {
        const next = current ? `${current} ${word}` : word;
        if (next.length <= maxChars) {
            current = next;
        } else {
            if (current) lines.push(current);
            if (word.length > maxChars) {
                current = `${word.slice(0, maxChars - 1)}…`;
            } else {
                current = word;
            }
            if (lines.length >= maxLines - 1) {
                break;
            }
        }
    }

    if (current && lines.length < maxLines) {
        lines.push(current);
    }

    if (!lines.length) {
        lines.push('Untitled Book');
    }

    return lines;
}

const PALETTES = [
    { top: '#1e3a8a', bottom: '#3156a3', accent: '#93c5fd' },
    { top: '#14532d', bottom: '#1e7a47', accent: '#86efac' },
    { top: '#4c1d95', bottom: '#6d28d9', accent: '#c4b5fd' },
    { top: '#7c2d12', bottom: '#b45309', accent: '#fcd34d' },
    { top: '#1f2937', bottom: '#334155', accent: '#cbd5e1' },
];

function sanitizeFallbackDisplayText(value, fallback = 'Untitled Book') {
    let text = String(value || '')
        // Strip UUID tokens and trailing 9+ digit timestamps / run IDs
        .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '')
        .replace(/\s*[-_:\s]\s*\d{9,}(?:[_-]\d+)?$/g, '')
        .replace(/[._]processed\.json$/i, '')
        .replace(/\.(pdf|epub)$/i, '')
        .replace(/\s+/g, ' ')
        .trim();

    return text || fallback;
}

function selectBestPdfCoverImage(images) {
    if (!Array.isArray(images) || images.length === 0) {
        return null;
    }

    const candidates = images.filter((img) => img && typeof img.file === 'string');
    if (candidates.length === 0) {
        return null;
    }

    const area = (img) => (Number(img.width) || 0) * (Number(img.height) || 0);
    const isMeaningful = (img) => (Number(img.width) || 0) >= 50 && (Number(img.height) || 0) >= 50;
    const isOnPageOne = (img) => Array.isArray(img.pages) && img.pages.includes(1);

    const pageOneMeaningful = candidates.filter((img) => isOnPageOne(img) && isMeaningful(img));
    if (pageOneMeaningful.length > 0) {
        return pageOneMeaningful.sort((a, b) => area(b) - area(a))[0];
    }

    const anyMeaningful = candidates.filter(isMeaningful);
    if (anyMeaningful.length > 0) {
        return anyMeaningful[0];
    }

    const anySubstantial = candidates.filter((img) => (Number(img.sizeBytes) || 0) >= 512);
    if (anySubstantial.length > 0) {
        return anySubstantial[0];
    }

    return candidates[0];
}

function generateFallbackCoverSvg({ id = 0, title = 'Untitled Book', subtitle = '', format = 'BOOK' } = {}) {
    const cleanTitle = sanitizeFallbackDisplayText(title, 'Untitled Book');
    const cleanSubtitle = sanitizeFallbackDisplayText(subtitle, 'Digital Library');
    const seedStr = `${id}:${cleanTitle}`;
    let hash = 0;
    for (let i = 0; i < seedStr.length; i += 1) {
        hash = ((hash * 31) + seedStr.charCodeAt(i)) >>> 0;
    }
    const palette = PALETTES[hash % PALETTES.length];
    const lines = wrapTitleLines(cleanTitle, 18, 4);
    const badge = escapeXml(String(format || 'BOOK').toUpperCase().slice(0, 12));
    const safeSubtitle = escapeXml(cleanSubtitle.slice(0, 42));

    const startY = 215 - (lines.length * 16);
    const titleTspans = lines
        .map((line, idx) => `<text x="48" y="${startY + idx * 38}" fill="#ffffff" font-family="Georgia, serif" font-size="28" font-weight="bold">${escapeXml(line)}</text>`)
        .join('\n  ');

    const svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600" role="img" aria-label="Book cover">',
        '  <defs>',
        `    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">`,
        `      <stop offset="0%" stop-color="${palette.top}"/>`,
        `      <stop offset="100%" stop-color="${palette.bottom}"/>`,
        '    </linearGradient>',
        '  </defs>',
        '  <rect width="400" height="600" rx="12" fill="url(#bg)"/>',
        '  <rect x="20" y="20" width="360" height="560" rx="8" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="2"/>',
        '  <rect x="48" y="54" width="84" height="28" rx="14" fill="rgba(255,255,255,0.18)"/>',
        `  <text x="90" y="73" text-anchor="middle" fill="#ffffff" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" letter-spacing="1">${badge}</text>`,
        `  ${titleTspans}`,
        `  <line x1="48" y1="430" x2="140" y2="430" stroke="${palette.accent}" stroke-width="4" stroke-linecap="round"/>`,
        `  <text x="48" y="468" fill="${palette.accent}" font-family="system-ui, sans-serif" font-size="16">${safeSubtitle}</text>`,
        '  <text x="48" y="538" fill="rgba(255,255,255,0.72)" font-family="system-ui, sans-serif" font-size="13">Digital Library</text>',
        '</svg>',
    ].join('\n');

    return Buffer.from(svg, 'utf8');
}

module.exports = {
    COVER_EXTENSIONS,
    detectImageFormat,
    saveExtractedCover,
    findExtractedCoverBuffer,
    selectBestPdfCoverImage,
    sanitizeFallbackDisplayText,
    generateFallbackCoverSvg,
};
