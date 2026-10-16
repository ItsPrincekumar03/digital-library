const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const { encodePng } = require('./pngEncoder');
const {
    resolvePublicImagesDir,
    resolvePublicImagePath,
} = require('./fileStorage');
const logger = require('./logger');

// Module 13.3 — embedded raster-image extraction (no page rendering).
// Uses pdfjs-dist operator lists: image XObjects (OPS 85/88, resolved via
// page.objs) and inline images (OPS 86/87, carried inline in the op args).
// Masks (OPS 83/84/89/90) are never treated as images.

// Operator ids confirmed against pdfjs-dist 6.4.299.
const OP_PAINT_IMAGE_XOBJECT = 85;
const OP_PAINT_INLINE_IMAGE = 86;
const OP_PAINT_INLINE_IMAGE_GROUP = 87;
const OP_PAINT_IMAGE_XOBJECT_REPEAT = 88;

// pdfjs-dist image kinds (see pngEncoder.js).
const SUPPORTED_IMAGE_KINDS = new Set([1, 2, 3]);

const DEFAULT_MAX_IMAGES = 200;
const DEFAULT_MAX_IMAGE_PIXELS = 16000000; // ~16 MP per image
const DEFAULT_MAX_IMAGE_FILE_BYTES = 15 * 1024 * 1024; // per PNG file
const DEFAULT_MAX_TOTAL_IMAGE_BYTES = 150 * 1024 * 1024; // per PDF

// XObject pixel data resolves asynchronously after the operator list is
// ready, so each reference gets a bounded wait instead of failing at once.
const IMAGE_RESOLVE_POLLS = 100;
const IMAGE_RESOLVE_INTERVAL_MS = 10;

function readEnvPositiveInt(name, fallback) {
    const value = Number.parseInt(process.env[name] || '', 10);

    if (Number.isSafeInteger(value) && value > 0) {
        return value;
    }

    return fallback;
}

function getImageLimits() {
    return {
        maxImages: readEnvPositiveInt(
            'PDF_IMAGE_MAX_IMAGES',
            DEFAULT_MAX_IMAGES
        ),
        maxImagePixels: readEnvPositiveInt(
            'PDF_IMAGE_MAX_PIXELS',
            DEFAULT_MAX_IMAGE_PIXELS
        ),
        maxImageFileBytes: readEnvPositiveInt(
            'PDF_IMAGE_MAX_IMAGE_BYTES',
            DEFAULT_MAX_IMAGE_FILE_BYTES
        ),
        maxTotalImageBytes: readEnvPositiveInt(
            'PDF_IMAGE_MAX_TOTAL_BYTES',
            DEFAULT_MAX_TOTAL_IMAGE_BYTES
        ),
    };
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// Resolves an XObject image reference. Returns { data, has, registry }:
// `data` is the decoded image object (or null when it never becomes
// available), `has` is the last observed outcome of the registry's has()
// (true / false / 'error'), and `registry` names the registry that was
// checked ('common' or 'page'). Callers treat null data as skipped, as before.
async function resolveImageObject(page, objId) {
    // pdf.js keeps shared (global) objects — ids starting with 'g_' — in the
    // document-wide commonObjs registry, and all other ids in the
    // page-specific objs registry (see getObject/dependency handling in
    // pdfjs-dist). Route exactly the same way; a 'g_' id is never expected
    // to resolve in the page registry.
    const useCommon = objId.startsWith('g_') && page.commonObjs;
    const pool = useCommon ? page.commonObjs : page.objs;
    const registry = useCommon ? 'common' : 'page';
    let has = false;

    for (let attempt = 0; attempt < IMAGE_RESOLVE_POLLS; attempt++) {
        try {
            if (pool.has(objId)) {
                has = true;

                try {
                    return { data: pool.get(objId), has, registry };
                } catch {
                    return { data: null, has: 'error', registry };
                }
            }
        } catch {
            return { data: null, has: 'error', registry };
        }

        await sleep(IMAGE_RESOLVE_INTERVAL_MS);
    }

    return { data: null, has, registry };
}

// Exact-content fingerprint: only byte-identical images share a file, so
// distinct images are never merged even when they look similar.
function fingerprintImage(imgData) {
    const hash = crypto.createHash('sha256');
    hash.update(`${imgData.width}x${imgData.height}k${imgData.kind}:`);
    hash.update(imgData.data);
    return hash.digest('hex');
}

function validDimensions(imgData, maxPixels) {
    return (
        imgData &&
        Number.isInteger(imgData.width) &&
        Number.isInteger(imgData.height) &&
        imgData.width > 0 &&
        imgData.height > 0 &&
        imgData.width * imgData.height <= maxPixels
    );
}

function validPixelData(imgData) {
    return (
        imgData &&
        SUPPORTED_IMAGE_KINDS.has(imgData.kind) &&
        imgData.data &&
        typeof imgData.data.length === 'number' &&
        imgData.data.length > 0
    );
}

// Extracts embedded images from a PDF into a per-document directory.
// Resolves { imagesDirName, images, status }. Never throws for per-image or
// per-page problems; only a document-level failure (unreadable/encrypted
// PDF) rejects, and the caller keeps any successful text extraction.
async function extractPdfImages(pdfPath, { bookId, imagesDirName }) {
    const limits = getImageLimits();
    const data = await fs.readFile(pdfPath);
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(data),
        verbosity: 0,
    });
    const doc = await loadingTask.promise;

    const images = [];
    const byFingerprint = new Map();
    let dirReady = false;
    let totalBytes = 0;
    let pageReferences = 0;
    let skippedCount = 0;
    let unsupportedCount = 0;
    let pageErrors = 0;
    let limitReached = false;
    let stoppedEarly = false;

    const noteSkipped = () => {
        skippedCount += 1;
    };

    try {
        for (
            let pageNumber = 1;
            pageNumber <= doc.numPages;
            pageNumber++
        ) {
            if (stoppedEarly) {
                break;
            }

            const page = await doc.getPage(pageNumber);

            try {
                let opList;

                try {
                    opList = await page.getOperatorList();
                } catch (err) {
                    // One unreadable page must not sink the whole document.
                    pageErrors += 1;
                    logger.error(
                        `Image scan skipped page ${pageNumber} for book ${bookId}.`,
                        err
                    );
                    continue;
                }

                const seenOnPage = new Set();

                for (let i = 0; i < opList.fnArray.length; i++) {
                    const fn = opList.fnArray[i];
                    const args = opList.argsArray[i] || [];
                    let imgData = null;

                    if (
                        fn === OP_PAINT_IMAGE_XOBJECT ||
                        fn === OP_PAINT_IMAGE_XOBJECT_REPEAT
                    ) {
                        const objId =
                            args.length > 0 ? String(args[0]) : '';

                        if (!objId || seenOnPage.has(`ref:${objId}`)) {
                            continue;
                        }

                        seenOnPage.add(`ref:${objId}`);
                        const resolved = await resolveImageObject(
                            page,
                            objId
                        );
                        imgData = resolved.data;

                        if (!imgData) {
                            // Diagnostic only: records which reference never
                            // resolved so the cause (undecodable content vs.
                            // wait budget) can be established from real logs.
                            // No PDF content, paths, or secrets are logged.
                            logger.error(
                                `Unresolved PDF image for book ${bookId} (page ${pageNumber}, ref ${objId}, reg=${resolved.registry}, objsHas=${resolved.has}).`
                            );
                            noteSkipped();
                            continue;
                        }
                    } else if (
                        fn === OP_PAINT_INLINE_IMAGE ||
                        fn === OP_PAINT_INLINE_IMAGE_GROUP
                    ) {
                        imgData = args[0] || null;

                        if (!imgData) {
                            continue;
                        }
                    } else {
                        continue;
                    }

                    pageReferences += 1;

                    if (!validPixelData(imgData)) {
                        unsupportedCount += 1;
                        continue;
                    }

                    if (!validDimensions(imgData, limits.maxImagePixels)) {
                        noteSkipped();
                        continue;
                    }

                    const fingerprint = fingerprintImage(imgData);
                    const existing = byFingerprint.get(fingerprint);

                    if (existing) {
                        if (!existing.pages.includes(pageNumber)) {
                            existing.pages.push(pageNumber);
                        }

                        continue;
                    }

                    if (images.length >= limits.maxImages) {
                        limitReached = true;
                        stoppedEarly = true;
                        break;
                    }

                    let png;

                    try {
                        png = encodePng(imgData);
                    } catch {
                        unsupportedCount += 1;
                        continue;
                    }

                    if (png.length > limits.maxImageFileBytes) {
                        noteSkipped();
                        continue;
                    }

                    if (totalBytes + png.length > limits.maxTotalImageBytes) {
                        limitReached = true;
                        stoppedEarly = true;
                        break;
                    }

                    if (!dirReady) {
                        await fs.mkdir(
                            resolvePublicImagesDir(imagesDirName),
                            { recursive: true }
                        );
                        dirReady = true;
                    }

                    const fileName = `p${pageNumber}-${images.length + 1}.png`;
                    const filePath = resolvePublicImagePath(
                        imagesDirName,
                        fileName
                    );
                    const tempPath = `${filePath}.tmp`;

                    try {
                        await fs.writeFile(tempPath, png);
                        await fs.rename(tempPath, filePath);
                    } catch (err) {
                        try {
                            await fs.unlink(tempPath);
                        } catch {
                            // Best effort: a failed write must not leave a
                            // partial file behind under the final name.
                        }

                        logger.error(
                            `Image file could not be saved for book ${bookId} (page ${pageNumber}).`,
                            err
                        );
                        noteSkipped();
                        continue;
                    }

                    const stat = await fs.stat(filePath);
                    const entry = {
                        // Relative to uploads/public; never an absolute path.
                        file: `${imagesDirName}/${fileName}`,
                        pages: [pageNumber],
                        width: imgData.width,
                        height: imgData.height,
                        mimeType: 'image/png',
                        sizeBytes: stat.size,
                    };

                    images.push(entry);
                    byFingerprint.set(fingerprint, entry);
                    totalBytes += stat.size;
                }
            } finally {
                page.cleanup();
            }
        }
    } finally {
        if (loadingTask && typeof loadingTask.destroy === 'function') {
            await loadingTask.destroy().catch(() => {});
        }
    }

    const extractedCount = images.length;
    let status;
    let message;

    if (extractedCount > 0 && (skippedCount > 0 || unsupportedCount > 0 || pageErrors > 0 || limitReached)) {
        status = 'partial';
        message = limitReached
            ? 'Image extraction stopped at the configured resource limit; saved images are listed.'
            : 'Image extraction finished, but some images or pages could not be processed; saved images are listed.';
    } else if (extractedCount > 0) {
        status = 'completed';
        message = 'Image extraction finished; all found images were saved.';
    } else if (pageErrors > 0) {
        status = 'partial';
        message = 'Image extraction finished without saved images; some pages could not be read.';
    } else {
        status = 'completed_no_images';
        message = 'Image extraction finished; no supported embedded images were found.';
    }

    return {
        imagesDirName,
        images,
        status: {
            status,
            extractedCount,
            pageReferences,
            skippedCount,
            unsupportedCount,
            pageErrors,
            limitReached,
            totalBytes,
            message,
        },
    };
}

module.exports = { extractPdfImages, getImageLimits };
