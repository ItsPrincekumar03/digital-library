// backend/src/utils/epubProcessor.js
// EPUB processing and reader compatibility utility (Module 21)
// Uses "unzipper" for secure archive handling, "htmlparser2" for standard XML parsing,
// and "sanitize-html" for strict HTML/CSS sanitisation.
// Enforces limits:
//   - Max 100 MB compressed
//   - Max 1,000 entries
//   - Max 500 MB uncompressed (checked on actual decompressed byte streams)
//   - Max 50 MB per single entry decompressed
// Supports EPUB 2 and EPUB 3 formats, spine reading order, hierarchical TOCs,
// safe internal images, and builds a reader document matching the continuous reader contract.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const unzipper = require('unzipper');
const sanitizeHtml = require('sanitize-html');
const { parseDocument, DomUtils } = require('htmlparser2');

// PNG signature magic bytes
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

// CRC-32 Lookup Table and implementation
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Limits (Module 20 & 21 security specification)
const MAX_COMPRESSED_SIZE = 100 * 1024 * 1024;    // 100 MB
const MAX_UNCOMPRESSED_SIZE = 500 * 1024 * 1024;  // 500 MB total
const MAX_ENTRY_UNCOMPRESSED_SIZE = 50 * 1024 * 1024; // 50 MB per entry
const MAX_ENTRY_COUNT = 1000;

// Strict whitelist for sanitize-html
const SANITIZE_OPTIONS = {
  allowedTags: [
    'a', 'abbr', 'b', 'bdi', 'bdo', 'blockquote', 'br', 'cite', 'code',
    'dd', 'div', 'dl', 'dt', 'em', 'figcaption', 'figure',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'img', 'li', 'mark',
    'ol', 'p', 'pre', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'small',
    'span', 'strike', 'strong', 'sub', 'sup', 'table', 'tbody', 'td',
    'tfoot', 'th', 'thead', 'tr', 'u', 'ul'
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height'],
    '*': ['class', 'id', 'title', 'style']
  },
  // Only safe web URL schemes; rejects javascript:, data:, vbscript:
  allowedSchemes: ['http', 'https', 'mailto'],
  // Strict allowed CSS properties to prevent reader UI overlay / spoofing attacks
  allowedStyles: {
    '*': {
      'color': [/^\#(0x)?[0-9a-f]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i, /^[a-z]+$/i],
      'text-align': [/^(left|right|center|justify)$/i],
      'font-size': [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/i],
      'font-style': [/^(normal|italic|oblique)$/i],
      'font-weight': [/^(normal|bold|bolder|lighter|[1-9]00)$/i],
      'text-decoration': [/^(none|underline|line-through)$/i],
      'line-height': [/^\d+(?:\.\d+)?(?:px|em|rem|%)?$/i],
      'margin-top': [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/i],
      'margin-bottom': [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/i],
      'margin-left': [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/i],
      'margin-right': [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/i],
      'padding-top': [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/i],
      'padding-bottom': [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/i],
      'padding-left': [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/i],
      'padding-right': [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/i],
    }
  },
  transformTags: {
    // Strip scripts completely including any embedded content
    'script': () => ({ tagName: 'removed', text: '' }),
    'style': () => ({ tagName: 'removed', text: '' })
  }
};

/**
 * Checks for ZIP64 format markers and throws if found.
 */
async function assertNotZip64(filePath) {
  const stat = await fs.promises.stat(filePath);
  const fd = await fs.promises.open(filePath, 'r');
  try {
    // Read the last 1024 bytes (or full file if smaller) to check for ZIP64 EOCD and locator
    const readSize = Math.min(stat.size, 1024);
    const buffer = Buffer.alloc(readSize);
    await fd.read(buffer, 0, readSize, stat.size - readSize);

    // ZIP64 End of Central Directory Locator signature: 0x07064b50 (PK\x06\x07)
    // ZIP64 End of Central Directory Record signature:  0x06064b50 (PK\x06\x06)
    const sigLocator = Buffer.from([0x50, 0x4b, 0x06, 0x07]);
    const sigEocd64 = Buffer.from([0x50, 0x4b, 0x06, 0x06]);

    if (buffer.includes(sigLocator) || buffer.includes(sigEocd64)) {
      const err = new Error('ZIP64 archives are not supported for security reasons');
      err.status = 400;
      throw err;
    }
  } finally {
    await fd.close();
  }
}

/**
 * Decompresses an unzipper entry stream while strictly counting emitted bytes.
 * Enforces per-entry limits, total decompressed archive limits, and verifies CRC-32.
 */
function decompressEntryWithLimits(entry, maxEntryBytes, totalTracker, maxTotalBytes) {
  return new Promise((resolve, reject) => {
    let entryBytes = 0;
    const chunks = [];
    let finished = false;
    const stream = entry.stream();

    function abort(err) {
      if (!finished) {
        finished = true;
        try { stream.destroy(); } catch (_) {}
        reject(err);
      }
    }

    stream.on('data', (chunk) => {
      if (finished) return;
      entryBytes += chunk.length;
      totalTracker.bytes += chunk.length;

      if (entryBytes > maxEntryBytes) {
        const err = new Error(`Entry exceeds maximum decompressed size (${maxEntryBytes} bytes)`);
        err.status = 400;
        return abort(err);
      }

      if (totalTracker.bytes > maxTotalBytes) {
        const err = new Error(`EPUB exceeds maximum uncompressed size (${maxTotalBytes} bytes)`);
        err.status = 400;
        return abort(err);
      }

      chunks.push(chunk);
    });

    stream.on('end', () => {
      if (finished) return;
      finished = true;
      const fullBuffer = Buffer.concat(chunks);

      // Verify CRC-32 if declared on entry
      if (typeof entry.crc32 === 'number' && entry.crc32 !== 0) {
        const computed = crc32(fullBuffer);
        if (computed !== (entry.crc32 >>> 0)) {
          const err = new Error(`CRC-32 verification failed for entry: ${entry.path}`);
          err.status = 400;
          return reject(err);
        }
      }

      resolve(fullBuffer);
    });

    stream.on('error', (err) => {
      abort(err);
    });
  });
}

/**
 * Parses XML/XHTML content into a DOM tree using htmlparser2.
 */
function parseXmlDocument(contentString) {
  try {
    return parseDocument(contentString, {
      xmlMode: true,
      lowerCaseTags: false,
      lowerCaseAttributeNames: false
    });
  } catch (err) {
    const error = new Error(`Failed to parse XML document: ${err.message}`);
    error.status = 400;
    throw error;
  }
}

/**
 * Extracts EPUB 3 navigation items preserving hierarchical levels.
 */
function extractEpub3Toc(navDoc) {
  const navElements = DomUtils.getElementsByTagName('nav', navDoc);
  let tocNav = navElements.find(n => {
    const type = n.attribs['epub:type'] || n.attribs['type'] || '';
    return type.toLowerCase().includes('toc');
  }) || navElements[0];

  if (!tocNav) return [];

  function parseOl(olElement, level = 1) {
    const items = [];
    const liElements = olElement.children.filter(c => c.name && c.name.toLowerCase() === 'li');
    for (const li of liElements) {
      let title = '';
      let href = '';
      const a = DomUtils.getElementsByTagName('a', li)[0];
      if (a) {
        title = DomUtils.textContent(a).trim();
        href = a.attribs['href'] || '';
      } else {
        const span = DomUtils.getElementsByTagName('span', li)[0];
        title = span ? DomUtils.textContent(span).trim() : DomUtils.textContent(li).trim();
      }

      const nestedOl = li.children.find(c => c.name && c.name.toLowerCase() === 'ol');
      const subitems = nestedOl ? parseOl(nestedOl, level + 1) : [];

      if (title || href) {
        items.push({
          title: title || 'Untitled Section',
          href,
          level,
          subitems
        });
      }
    }
    return items;
  }

  const ol = DomUtils.getElementsByTagName('ol', tocNav)[0];
  return ol ? parseOl(ol, 1) : [];
}

/**
 * Extracts EPUB 2 NCX items preserving hierarchical levels.
 */
function extractEpub2Toc(ncxDoc) {
  const navMap = DomUtils.getElementsByTagName('navMap', ncxDoc)[0];
  if (!navMap) return [];

  function parseNavPoints(parent, level = 1) {
    const items = [];
    const navPoints = parent.children.filter(c => c.name && c.name.toLowerCase() === 'navpoint');
    for (const np of navPoints) {
      const labelText = DomUtils.getElementsByTagName('text', np)[0];
      const title = labelText ? DomUtils.textContent(labelText).trim() : '';
      const content = DomUtils.getElementsByTagName('content', np)[0];
      const href = content ? (content.attribs['src'] || '') : '';

      const subitems = parseNavPoints(np, level + 1);

      items.push({
        title: title || 'Untitled Section',
        href,
        level,
        subitems
      });
    }
    return items;
  }

  return parseNavPoints(navMap, 1);
}

/**
 * Extracts structured blocks ({ kind, text }) from sanitized HTML content.
 */
function extractContentBlocks(sanitizedHtml) {
  const doc = parseDocument(sanitizedHtml);
  const blocks = [];

  function walk(node) {
    if (!node) return;
    const name = node.name ? node.name.toLowerCase() : '';

    if (name === 'h1' || name === 'h2') {
      const text = DomUtils.textContent(node).replace(/\s+/g, ' ').trim();
      if (text) blocks.push({ kind: 'heading', text });
    } else if (name === 'h3' || name === 'h4' || name === 'h5' || name === 'h6') {
      const text = DomUtils.textContent(node).replace(/\s+/g, ' ').trim();
      if (text) blocks.push({ kind: 'subheading', text });
    } else if (name === 'p' || name === 'blockquote') {
      const text = DomUtils.textContent(node).replace(/\s+/g, ' ').trim();
      if (text) blocks.push({ kind: 'paragraph', text });
    } else if (name === 'li') {
      const text = DomUtils.textContent(node).replace(/\s+/g, ' ').trim();
      if (text) blocks.push({ kind: 'list-item', text });
    } else if (name === 'figcaption') {
      const text = DomUtils.textContent(node).replace(/\s+/g, ' ').trim();
      if (text) blocks.push({ kind: 'caption', text });
    } else if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        walk(child);
      }
    }
  }

  walk(doc);

  // If no structured block was identified (e.g. bare text), fall back to non-empty text
  if (blocks.length === 0) {
    const rawText = DomUtils.textContent(doc).replace(/\s+/g, ' ').trim();
    if (rawText) {
      blocks.push({ kind: 'paragraph', text: rawText });
    }
  }

  return blocks;
}

/**
 * Sanitises an XHTML chapter string and returns safe HTML.
 */
function sanitiseChapter(html) {
  return sanitizeHtml(html, SANITIZE_OPTIONS);
}

/**
 * Extracts and processes EPUB archive components safely.
 */
async function extractEpubComponents(epubPath) {
  // 1. Check compressed size limit
  const stat = await fs.promises.stat(epubPath);
  if (stat.size > MAX_COMPRESSED_SIZE) {
    const err = new Error('EPUB exceeds maximum compressed size of 100 MB');
    err.status = 400;
    throw err;
  }

  // 2. Reject ZIP64 format
  await assertNotZip64(epubPath);

  // 3. Open directory and validate entry constraints
  const directory = await unzipper.Open.file(epubPath);

  if (directory.files.length > MAX_ENTRY_COUNT) {
    const err = new Error('EPUB contains more than 1,000 entries');
    err.status = 400;
    throw err;
  }

  const seenPaths = new Set();
  const fileMap = new Map(); // normalized path -> entry

  for (const file of directory.files) {
    const entryPath = file.path.replace(/\\/g, '/');

    // Reject duplicate normalized entry names (case-insensitive)
    const lower = entryPath.toLowerCase();
    if (seenPaths.has(lower)) {
      const err = new Error('EPUB contains duplicate entry paths');
      err.status = 400;
      throw err;
    }
    seenPaths.add(lower);

    // Path traversal and absolute path protection
    if (
      entryPath.includes('..') ||
      path.isAbsolute(entryPath) ||
      entryPath.startsWith('/') ||
      /^[A-Za-z]:/.test(entryPath)
    ) {
      const err = new Error('EPUB contains unsafe entry path');
      err.status = 400;
      throw err;
    }

    fileMap.set(entryPath, file);
  }

  const totalTracker = { bytes: 0 };

  // Helper to read an entry by normalized path
  async function readEntryBuffer(entryPath) {
    const entry = fileMap.get(entryPath);
    if (!entry) return null;
    return decompressEntryWithLimits(entry, MAX_ENTRY_UNCOMPRESSED_SIZE, totalTracker, MAX_UNCOMPRESSED_SIZE);
  }

  // 4. Read META-INF/container.xml
  const containerBuffer = await readEntryBuffer('META-INF/container.xml');
  if (!containerBuffer) {
    const err = new Error('EPUB missing META-INF/container.xml');
    err.status = 400;
    throw err;
  }

  const containerDoc = parseXmlDocument(containerBuffer.toString('utf-8'));
  const rootfiles = DomUtils.getElementsByTagName('rootfile', containerDoc);
  if (!rootfiles.length) {
    const err = new Error('EPUB missing rootfile in container.xml');
    err.status = 400;
    throw err;
  }

  const opfPath = rootfiles[0].attribs['full-path'] || rootfiles[0].attribs['fullPath'];
  if (!opfPath) {
    const err = new Error('Cannot locate OPF path in container.xml');
    err.status = 400;
    throw err;
  }

  const normalizedOpfPath = opfPath.replace(/\\/g, '/');
  const opfBuffer = await readEntryBuffer(normalizedOpfPath);
  if (!opfBuffer) {
    const err = new Error(`OPF file referenced in container.xml not found: ${normalizedOpfPath}`);
    err.status = 400;
    throw err;
  }

  // 5. Parse OPF package document
  const opfDoc = parseXmlDocument(opfBuffer.toString('utf-8'));
  const opfDir = path.posix.dirname(normalizedOpfPath);

  // Metadata
  const metadata = {};
  const metaElement = DomUtils.getElementsByTagName('metadata', opfDoc)[0];
  if (metaElement) {
    for (const child of metaElement.children) {
      if (!child.name) continue;
      const tagName = child.name.toLowerCase();
      const text = DomUtils.textContent(child).trim();
      if (tagName.includes('title') && !metadata.title) metadata.title = text;
      else if (tagName.includes('creator') && !metadata.creator) metadata.creator = text;
      else if (tagName.includes('language') && !metadata.language) metadata.language = text;
      else if (tagName.includes('identifier') && !metadata.identifier) metadata.identifier = text;
      else if (tagName.includes('description') && !metadata.description) metadata.description = text;
      else if (tagName.includes('publisher') && !metadata.publisher) metadata.publisher = text;
      else if (tagName.includes('date') && !metadata.date) metadata.date = text;
    }
  }

  // Manifest: id -> { id, href, mediaType, properties, fullPath }
  const manifestMap = new Map();
  const itemElements = DomUtils.getElementsByTagName('item', opfDoc);
  for (const item of itemElements) {
    const id = item.attribs['id'];
    const href = item.attribs['href'];
    const mediaType = item.attribs['media-type'] || item.attribs['mediaType'] || '';
    const properties = item.attribs['properties'] || '';
    if (id && href) {
      const fullPath = path.posix.normalize(path.posix.join(opfDir, href));
      manifestMap.set(id, { id, href, mediaType, properties, fullPath });
    }
  }

  // Spine: ordered itemrefs
  const spineItems = [];
  const itemrefElements = DomUtils.getElementsByTagName('itemref', opfDoc);
  for (const itemref of itemrefElements) {
    const idref = itemref.attribs['idref'];
    if (!idref) continue;
    const manifestItem = manifestMap.get(idref);
    if (!manifestItem) {
      const err = new Error(`Spine itemref references missing manifest item: ${idref}`);
      err.status = 400;
      throw err;
    }

    if (
      manifestItem.mediaType.includes('html') ||
      manifestItem.mediaType.includes('xhtml') ||
      manifestItem.mediaType.includes('xml')
    ) {
      if (!fileMap.has(manifestItem.fullPath)) {
        const err = new Error(`Chapter document file missing from EPUB archive: ${manifestItem.fullPath}`);
        err.status = 400;
        throw err;
      }
      spineItems.push(manifestItem);
    }
  }

  // Navigation document: EPUB 3 nav vs EPUB 2 NCX
  let navXhtml = null;
  let tocNcx = null;

  // EPUB 3: item with properties="nav" or xhtml file containing "nav"
  const epub3NavItem = Array.from(manifestMap.values()).find(
    i => i.properties.split(/\s+/).includes('nav') ||
         (i.mediaType.includes('xhtml') && i.href.toLowerCase().includes('nav'))
  );
  if (epub3NavItem && fileMap.has(epub3NavItem.fullPath)) {
    const buf = await readEntryBuffer(epub3NavItem.fullPath);
    if (buf) navXhtml = buf.toString('utf-8');
  }

  // EPUB 2: item with media-type="application/x-dtbncx+xml" or .ncx href
  const epub2NcxItem = Array.from(manifestMap.values()).find(
    i => i.mediaType === 'application/x-dtbncx+xml' || i.href.toLowerCase().endsWith('.ncx')
  );
  if (epub2NcxItem && fileMap.has(epub2NcxItem.fullPath)) {
    const buf = await readEntryBuffer(epub2NcxItem.fullPath);
    if (buf) tocNcx = buf.toString('utf-8');
  }

  return {
    metadata,
    manifestMap,
    spineItems,
    navXhtml,
    tocNcx,
    fileMap,
    readEntryBuffer,
    totalDecompressedBytes: totalTracker.bytes
  };
}

/**
 * Main processing function: processes an EPUB file and outputs the reader JSON payload.
 * Also safely extracts valid chapter images into imagesDir if provided.
 */
async function processEpubFile(epubPath, options = {}) {
  const {
    bookId = null,
    imagesDirName = null,
    publicUploadDir = null
  } = options;

  const {
    metadata,
    manifestMap,
    spineItems,
    navXhtml,
    tocNcx,
    readEntryBuffer
  } = await extractEpubComponents(epubPath);

  // Parse Table of Contents
  let toc = [];
  if (navXhtml) {
    try {
      const navDoc = parseXmlDocument(navXhtml);
      toc = extractEpub3Toc(navDoc);
    } catch (_) {}
  }
  if ((!toc || toc.length === 0) && tocNcx) {
    try {
      const ncxDoc = parseXmlDocument(tocNcx);
      toc = extractEpub2Toc(ncxDoc);
    } catch (_) {}
  }

  // Extract chapters in spine order
  const pages = [];
  let totalTextChars = 0;
  const extractedImages = [];
  let imageSeq = 1;

  for (let idx = 0; idx < spineItems.length; idx++) {
    const item = spineItems[idx];
    const rawBuffer = await readEntryBuffer(item.fullPath);
    if (!rawBuffer) continue;

    const rawHtml = rawBuffer.toString('utf-8');
    const safeHtml = sanitiseChapter(rawHtml);
    const blocks = extractContentBlocks(safeHtml);

    const paragraphs = blocks
      .filter(b => b.kind === 'paragraph' || b.kind === 'list-item')
      .map(b => b.text);

    const pageText = blocks.map(b => b.text).join('\n\n');
    totalTextChars += pageText.length;

    const pageNumber = idx + 1;

    // Check for referenced images in this chapter
    if (imagesDirName && publicUploadDir) {
      const chapterDoc = parseDocument(safeHtml);
      const imgElements = DomUtils.getElementsByTagName('img', chapterDoc);

      for (const img of imgElements) {
        const src = img.attribs['src'];
        if (!src || src.startsWith('http:') || src.startsWith('https:')) continue;

        // Resolve relative to chapter path
        const chapterDir = path.posix.dirname(item.fullPath);
        const resolvedImagePath = path.posix.normalize(path.posix.join(chapterDir, src));

        const imageBuffer = await readEntryBuffer(resolvedImagePath);
        if (
          imageBuffer &&
          imageBuffer.length >= PNG_SIGNATURE.length &&
          imageBuffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
        ) {
          const fileName = `p${pageNumber}-${imageSeq++}.png`;
          const targetDir = path.resolve(publicUploadDir, imagesDirName);
          await fs.promises.mkdir(targetDir, { recursive: true });
          const targetFile = path.resolve(targetDir, fileName);

          // Path traversal safety check
          if (targetFile.startsWith(targetDir + path.sep)) {
            await fs.promises.writeFile(targetFile, imageBuffer);
            extractedImages.push({
              file: `${imagesDirName}/${fileName}`,
              pages: [pageNumber],
              mimeType: 'image/png'
            });
          }
        }
      }
    }

    pages.push({
      pageNumber,
      chapterId: item.id,
      chapterTitle: metadata.title || `Chapter ${pageNumber}`,
      text: pageText,
      paragraphs,
      blocks,
      html: safeHtml
    });
  }

  const imageStatus = {
    status: extractedImages.length > 0 ? 'completed' : 'not_attempted',
    extractedCount: extractedImages.length,
    pageReferences: extractedImages.length,
    skippedCount: 0,
    unsupportedCount: 0,
    pageErrors: 0,
    limitReached: false,
    totalBytes: 0,
    message: extractedImages.length > 0
      ? `Successfully extracted ${extractedImages.length} image(s).`
      : 'No PNG images extracted.'
  };

  return {
    version: 1,
    bookId: Number(bookId) || null,
    fileFormat: 'EPUB',
    metadata,
    sourceFile: metadata.title || 'EPUB Document',
    pageCount: pages.length,
    textChars: totalTextChars,
    extractedAt: new Date().toISOString(),
    pages,
    toc,
    images: extractedImages,
    imageStatus
  };
}

module.exports = {
  processEpubFile,
  extractEpubComponents,
  sanitiseChapter,
  extractContentBlocks,
  crc32,
  assertNotZip64,
  SANITIZE_OPTIONS
};
