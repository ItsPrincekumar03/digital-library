const bookRepository = require('../repositories/book.repository');
const bookRelationsRepository = require('../repositories/bookRelations.repository');
const chapterRepository = require('../repositories/chapter.repository');
const {
    deleteFileIfExists,
    deleteDirectoryIfExists,
    resolvePublicPdfPath,
    buildPublicProcessedName,
    resolvePublicProcessedPath,
    buildPublicImagesDirName,
    resolvePublicImagesDir,
    resolvePublicImagePath,
    getPublicUploadDirectory,
} = require('../utils/fileStorage');
const { validatePdfFile } = require('../utils/pdfValidation');
const {
    COVER_EXTENSIONS,
    detectImageFormat,
    saveExtractedCover,
    findExtractedCoverBuffer,
    selectBestPdfCoverImage,
    generateFallbackCoverSvg,
} = require('../utils/coverFallback');
const {
    buildCoverFileName,
    resolvePublicCoverPath,
    fileExists,
} = require('../utils/fileStorage');
const { extractPdfText } = require('../utils/pdfTextExtractor');
const { extractPdfImages } = require('../utils/pdfImageExtractor');
const logger = require('../utils/logger');
const fs = require('fs/promises');
const path = require('path');
const { processEpubFile } = require('../utils/epubProcessor');
const {
    parsePagination,
    parseSort,
    buildPaginationMeta
} = require('../utils/pagination');
const {
    PUBLIC_BOOK_STATUS,
    isAdmin,
    isBookPubliclyReadable,
    isChapterPubliclyReadable,
} = require('../utils/bookVisibility');

// Module 8.5 — PUBLIC LIBRARY RULES
//   * Public books are managed by ADMIN only (create / edit / publish / archive).
//   * Normal users can only READ books whose status is PUBLISHED.
//   * Lifecycle used by the API: DRAFT -> PUBLISHED -> ARCHIVED.
//   * Old statuses (PENDING_REVIEW, APPROVED, REJECTED) stay in the DB ENUM for
//     compatibility but are never written and never visible to normal users.
//   * Private user PDFs (Module 12) will use their own table (user_pdf_books),
//     NOT this books table.

function notFound(message = 'This book does not exist.', code = 'BOOK_NOT_FOUND') {
    const err = new Error(message);
    err.status = 404;
    err.code = code;
    return err;
}

function forbidden(message) {
    const err = new Error(
        message || 'Only an admin can manage public library books.'
    );
    err.status = 403;
    return err;
}

// Defense in depth: routes already use requireRole('ADMIN'),
// but the service refuses non-admins too.
function assertAdmin(requestingUser) {
    if (!isAdmin(requestingUser)) {
        throw forbidden();
    }
}

const BOOK_SORT_COLUMNS = [
    'created_at',
    'title',
    'status',
    'publication_date'
];

// Admin sees every status. Everyone else only sees PUBLISHED.
function statusFilterFor(requestingUser) {
    return isAdmin(requestingUser) ? undefined : PUBLIC_BOOK_STATUS;
}

function isOsAbsolutePath(value) {
    if (typeof value !== 'string') return false;
    const trimmed = value.trim();
    return /^[A-Za-z]:[\\/]/.test(trimmed) ||
        /^\\\\/.test(trimmed) ||
        /^\/(Users|home|var|etc|tmp|mnt|root)\//.test(trimmed);
}

function normalizeInputCoverPath(coverPath) {
    if (coverPath === undefined || coverPath === null) {
        return null;
    }
    const trimmed = String(coverPath).trim();
    if (!trimmed) {
        return null;
    }
    if (isOsAbsolutePath(trimmed)) {
        const err = new Error('Cover path must be a relative API path or valid URL, not a local filesystem path.');
        err.status = 400;
        throw err;
    }
    return trimmed;
}

function resolveCanonicalCoverPath(book) {
    const raw = typeof book?.cover_path === 'string' ? book.cover_path.trim() : '';
    if (raw && !raw.startsWith('/uploads/') && !isOsAbsolutePath(raw)) {
        return raw;
    }
    return `/api/books/${book.book_id}/cover`;
}

// Admin-only. New public books always start as DRAFT.
// owner_id records which admin created the book.
async function createBook(
    requestingUser,
    { title, description, coverPath, publicationDate }
) {
    assertAdmin(requestingUser);

    const safeCoverPath = normalizeInputCoverPath(coverPath);

    const bookId = await bookRepository.create({
        ownerUserId: requestingUser.user_id,
        title,
        description,
        coverPath: safeCoverPath,
        publicationDate
    });

    if (!safeCoverPath) {
        await bookRepository.updateFields(bookId, {
            cover_path: `/api/books/${bookId}/cover`
        });
    }

    return bookRepository.findById(bookId);
}

function inferBookFileFormat(book) {
    if (book.file_format && typeof book.file_format === 'string' && book.file_format.trim()) {
        return book.file_format.trim().toUpperCase();
    }
    const name = String(book.pdf_original_name || book.pdf_stored_name || '').toLowerCase();
    if (name.endsWith('.epub')) return 'EPUB';
    if (name.endsWith('.pdf') || book.pdf_stored_name) return 'PDF';
    return null;
}

async function enrichBooksMetadata(books) {
    if (!Array.isArray(books) || books.length === 0) {
        return books;
    }
    const withRelations = await bookRelationsRepository.attachRelationsToBooks(books);
    return withRelations.map((book) => ({
        ...book,
        cover_path: resolveCanonicalCoverPath(book),
        cover_url: `/api/books/${book.book_id}/cover`,
        file_format: inferBookFileFormat(book),
        has_original_file: Boolean(book.pdf_stored_name),
    }));
}

async function getAllBooks(requestingUser) {

    return enrichBooksMetadata(await bookRepository.findAll(statusFilterFor(requestingUser)));
}

function parseCategoryFilter(query) {
    const raw = query?.category ?? query?.categoryId;
    if (raw === undefined || raw === null || String(raw).trim() === '') {
        return null;
    }
    const trimmed = String(raw).trim();
    if (!/^[1-9]\d*$/.test(trimmed)) {
        const err = new Error('Invalid category filter.');
        err.status = 400;
        throw err;
    }
    return Number.parseInt(trimmed, 10);
}

function parseSearchFilter(query) {
    if (typeof query?.search !== 'string') {
        return null;
    }
    const trimmed = query.search.trim().slice(0, 200);
    return trimmed || null;
}

function parseAdminStatusFilter(query) {
    const raw = query?.status;
    if (raw === undefined || raw === null) {
        return undefined;
    }
    const normalized = String(raw).trim().toUpperCase();
    if (!normalized || normalized === 'ALL') {
        return undefined;
    }
    if (!bookRepository.WRITABLE_STATUSES.includes(normalized)) {
        const err = new Error('Invalid status filter. Allowed: ALL, DRAFT, PUBLISHED, ARCHIVED.');
        err.status = 400;
        throw err;
    }
    return normalized;
}

async function getBooksFiltered(requestingUser, query = {}, { requireAdminAccess = false } = {}) {
    if (requireAdminAccess) {
        assertAdmin(requestingUser);
    }

    const { page, limit, offset } = parsePagination(query);
    const { column, direction } = parseSort(
        query,
        BOOK_SORT_COLUMNS,
        'created_at'
    );

    const categoryId = parseCategoryFilter(query);
    const search = parseSearchFilter(query);
    const status = isAdmin(requestingUser)
        ? parseAdminStatusFilter(query)
        : PUBLIC_BOOK_STATUS;

    const filterArgs = { status, categoryId, search };

    const [books, totalItems] = await Promise.all([
        bookRepository.findAllPaginated({
            limit,
            offset,
            sortColumn: column,
            sortDirection: direction,
            ...filterArgs,
        }),
        bookRepository.countAll(filterArgs),
    ]);

    return {
        books: await enrichBooksMetadata(books),
        meta: buildPaginationMeta({
            page,
            limit,
            totalItems,
        }),
    };
}

async function getAllBooksPaginated(requestingUser, query) {
    return getBooksFiltered(requestingUser, query, { requireAdminAccess: false });
}

async function getAdminBooks(requestingUser, query) {
    return getBooksFiltered(requestingUser, query, { requireAdminAccess: true });
}

// Hidden books (draft / archived / legacy) look like "not found" to normal users.
async function getBookById(bookId, requestingUser) {
    const book = await bookRepository.findById(bookId);

    if (!book) {
        throw notFound('This book does not exist.', 'BOOK_NOT_FOUND');
    }

    if (!isAdmin(requestingUser) && !isBookPubliclyReadable(book)) {
        throw notFound('This book is not published.', 'BOOK_NOT_PUBLISHED');
    }

    const [enriched] = await enrichBooksMetadata([book]);
    return enriched;
}

async function updateBook(
    bookId,
    requestingUser,
    { title, description, coverPath, publicationDate, status }
) {
    assertAdmin(requestingUser);

    const book = await bookRepository.findById(bookId);

    if (!book) {
        throw notFound();
    }

    const safeCoverPath = normalizeInputCoverPath(coverPath);
    const preservedCoverPath = safeCoverPath || resolveCanonicalCoverPath(book);

    const fields = {
        title,
        description: description ?? null,
        cover_path: preservedCoverPath,
        publication_date: publicationDate ?? null
    };

    // The validator only allows DRAFT / PUBLISHED / ARCHIVED here.
    if (status !== undefined) {
        fields.status = status;
    }

    await bookRepository.updateFields(bookId, fields);

    return bookRepository.findById(bookId);
}

async function publishBook(bookId, requestingUser) {
    assertAdmin(requestingUser);

    const book = await bookRepository.findById(bookId);

    if (!book) {
        throw notFound();
    }

    await bookRepository.setStatus(bookId, PUBLIC_BOOK_STATUS);

    return bookRepository.findById(bookId);
}

async function archiveBook(bookId, requestingUser) {
    assertAdmin(requestingUser);

    const book = await bookRepository.findById(bookId);

    if (!book) {
        throw notFound();
    }

    await bookRepository.archive(bookId);

    return bookRepository.findById(bookId);
}

// New public PDFs are stored as crypto.randomUUID() + '.pdf' by the upload
// middleware. Only that exact server-generated format may be auto-deleted.
const PUBLIC_PDF_STORED_NAME_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|epub)$/i;

function isManagedPublicPdfName(storedName) {
    return (
        typeof storedName === 'string' &&
        PUBLIC_PDF_STORED_NAME_PATTERN.test(storedName)
    );
}

// New processed-text files are '<uuid>.processed.json', derived from the
// stored PDF name. Only that exact server-generated format may be auto-deleted.
const PUBLIC_PROCESSED_NAME_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.processed\.json$/i;

function isManagedProcessedName(processedName) {
    return (
        typeof processedName === 'string' &&
        PUBLIC_PROCESSED_NAME_PATTERN.test(processedName)
    );
}

// Module 13.3 — extracted images live in '<uuid>.images/' with server-made
// 'p<page>-<seq>.png' files. Only those exact formats may be auto-deleted,
// so cleanup can never touch another book's assets.
const PUBLIC_IMAGES_DIR_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.images$/i;

function isManagedImagesDirName(dirName) {
    return (
        typeof dirName === 'string' &&
        PUBLIC_IMAGES_DIR_PATTERN.test(dirName)
    );
}

// Module 13.1 — administrative original-PDF import.
// Associates an uploaded PDF with an existing book without changing its status.
async function importBookPdf(bookId, requestingUser, file, format) {
    assertAdmin(requestingUser);

    // Module 27.5: Enforce PDF-only uploads (existing EPUB records remain readable).
    const { validateFormat, validateExtension, validateMimeType } = require('../utils/formatValidation');
    const requestedFormat = format === undefined || format === null || String(format).trim() === ''
        ? 'PDF'
        : format;
    const formatResult = validateFormat(requestedFormat);
    if (!formatResult.valid) {
        if (file && file.path) {
            await deleteFileIfExists(file.path).catch(() => {});
        }
        const err = new Error(formatResult.error);
        err.status = 400;
        throw err;
    }
    const normalizedFormat = formatResult.format;

    if (!file || !file.path || !file.filename) {
        const err = new Error('File is required.');
        err.status = 400;
        throw err;
    }

    const book = await bookRepository.findById(bookId);

    if (!book) {
        await deleteFileIfExists(file.path);
        throw notFound();
    }

    if (!file.size || file.size === 0) {
        await deleteFileIfExists(file.path);
        const err = new Error('Uploaded file is empty.');
        err.status = 400;
        throw err;
    }

    // PDF content signature validation (never trust filename or MIME type alone)
    try {
        await validatePdfFile(file.path);
    } catch (err) {
        await deleteFileIfExists(file.path);
        throw err;
    }

    // Validate extension and MIME type match format
    const extResult = validateExtension(normalizedFormat, file.originalname);
    if (!extResult.valid) {
        await deleteFileIfExists(file.path);
        const err = new Error(extResult.error);
        err.status = 400;
        throw err;
    }

    const mimeResult = validateMimeType(normalizedFormat, file.mimetype);
    if (!mimeResult.valid) {
        await deleteFileIfExists(file.path);
        const err = new Error(mimeResult.error);
        err.status = 400;
        throw err;
    }

    let updateResult;
    try {
        updateResult = await bookRepository.updatePdfMetadata(bookId, {
            originalName: file.originalname,
            storedName: file.filename,
            size: file.size,
            fileFormat: normalizedFormat
        });
    } catch (err) {
        await deleteFileIfExists(file.path);
        throw err;
    }

    // Confirm the update hit exactly this book.
    if (!updateResult || updateResult.affectedRows !== 1) {
        await deleteFileIfExists(file.path);
        const err = new Error('Book no longer exists. File import was not saved.');
        err.status = 404;
        throw err;
    }

    let processedAvailable = false;
    let extractedCoverName = null;
    let documentImages = [];
    let documentImageStatus = { status: 'not_attempted', extractedCount: 0, pageReferences: 0, skippedCount: 0, unsupportedCount: 0, pageErrors: 0, limitReached: false, totalBytes: 0, message: 'Image extraction was not attempted.' };

    const processedName = buildPublicProcessedName(file.filename);
    const imagesDirName = buildPublicImagesDirName(file.filename);

    if (normalizedFormat === 'PDF') {

        try {
            const extracted = await extractPdfText(file.path);

            try {
                const imageResult = await extractPdfImages(file.path, {
                    bookId: Number(bookId),
                    imagesDirName,
                });
                documentImages = imageResult.images;
                documentImageStatus = imageResult.status;
            } catch (err) {
                // The text above is still good: report the image failure
                // honestly and remove anything the failed pass may have left.
                logger.error(
                    `Image extraction failed for book ${bookId}; kept the extracted text without images.`,
                    err
                );
                documentImages = [];
                documentImageStatus = {
                    status: 'failed',
                    extractedCount: 0,
                    pageReferences: 0,
                    skippedCount: 0,
                    unsupportedCount: 0,
                    pageErrors: 0,
                    limitReached: false,
                    totalBytes: 0,
                    message: 'Image extraction failed; text extraction was preserved.',
                };

                try {
                    await deleteDirectoryIfExists(
                        resolvePublicImagesDir(imagesDirName)
                    );
                } catch (cleanupErr) {
                    logger.error(
                        `Failed to clean up images after failed extraction for book ${bookId}.`,
                        cleanupErr
                    );
                }
            }

            const document = {
                version: 1,
                bookId: Number(bookId),
                fileFormat: 'PDF',
                sourceFile: file.originalname,
                pageCount: extracted.pageCount,
                textChars: extracted.textChars,
                hasText: extracted.hasText,
                isScanned: extracted.isScanned,
                metadata: extracted.metadata || {},
                extractedAt: new Date().toISOString(),
                pages: extracted.pages,
                images: documentImages,
                imageStatus: documentImageStatus,
            };

            // Module 27.5: Persist best extracted image as book cover when available.
            const bestCoverImg = selectBestPdfCoverImage(documentImages);
            if (bestCoverImg && bestCoverImg.file) {
                try {
                    const firstImgPath = resolvePublicImagePath(
                        path.dirname(bestCoverImg.file),
                        path.basename(bestCoverImg.file)
                    );
                    const imgBuf = await fs.readFile(firstImgPath);
                    const savedCover = await saveExtractedCover(file.filename, imgBuf, false);
                    if (savedCover && savedCover.coverFileName) {
                        extractedCoverName = savedCover.coverFileName;
                    }
                } catch (coverErr) {
                    logger.error(`Cover extraction failed for book ${bookId}.`, coverErr);
                }
            }
            await fs.writeFile(
                resolvePublicProcessedPath(processedName),
                JSON.stringify(document),
                'utf-8'
            );
            const processedResult = await bookRepository.updateProcessedPath(
                bookId,
                processedName
            );
            processedAvailable =
                !!processedResult && processedResult.affectedRows === 1;
            if (!processedAvailable) {
                await deleteFileIfExists(
                    resolvePublicProcessedPath(processedName)
                );

                // The new images would otherwise be orphaned without a document
                // pointing at them, so remove this document's image directory too.
                try {
                    await deleteDirectoryIfExists(
                        resolvePublicImagesDir(imagesDirName)
                    );
                } catch (cleanupErr) {
                    logger.error(
                        `Failed to clean up unlinked images for book ${bookId}.`,
                        cleanupErr
                    );
                }

                logger.error(
                    `Processed text for book ${bookId} was extracted but could not be linked; kept the PDF only.`
                );
            }
        } catch (err) {
            logger.error(
                `Text extraction failed for book ${bookId}; kept the PDF without processed content.`,
                err
            );
        }
    } else if (normalizedFormat === 'EPUB') {
        try {
            const document = await processEpubFile(file.path, {
                bookId: Number(bookId),
                imagesDirName,
                publicUploadDir: getPublicUploadDirectory(),
                onCoverExtracted: async (coverBuf) => {
                    const savedCover = await saveExtractedCover(file.filename, coverBuf, false);
                    if (savedCover && savedCover.coverFileName) {
                        extractedCoverName = savedCover.coverFileName;
                    }
                }
            });
            documentImages = Array.isArray(document.images) ? document.images : [];
            documentImageStatus = document.imageStatus || {
                status: 'completed',
                extractedCount: documentImages.length,
                pageReferences: documentImages.length,
                totalBytes: 0,
                message: 'EPUB processed successfully.'
            };
            await fs.writeFile(
                resolvePublicProcessedPath(processedName),
                JSON.stringify(document),
                'utf-8'
            );
            const processedResult = await bookRepository.updateProcessedPath(
                bookId,
                processedName
            );
            processedAvailable = !!processedResult && processedResult.affectedRows === 1;
            if (!processedAvailable) {
                await deleteFileIfExists(resolvePublicProcessedPath(processedName));
                try {
                    await deleteDirectoryIfExists(resolvePublicImagesDir(imagesDirName));
                } catch (cleanupErr) {
                    logger.error(`Failed to clean up unlinked images for book ${bookId}.`, cleanupErr);
                }
                logger.error(`Processed content for EPUB book ${bookId} was extracted but could not be linked; kept the EPUB only.`);
            }
        } catch (err) {
            logger.error(`EPUB extraction failed for book ${bookId}; kept the file without processed content.`, err);
        }
    }


    // Replacement cleanup: remove the previous public PDF (and its processed
    // text and extracted images, if any) only after the database update
    // succeeded. Never touches private files or anything outside the public
    // directory, and never another document's assets.
    const previousStoredName = book.pdf_stored_name || null;

    if (previousStoredName && previousStoredName !== file.filename) {
        if (!isManagedPublicPdfName(previousStoredName)) {
            // Favor preserving data: legacy or unexpected names (e.g. old
            // pdf_path-era files) are never auto-deleted.
            logger.error(
                `Skipped cleanup of previous PDF for book ${bookId}: unexpected stored filename format.`
            );
        } else {
            try {
                const previousPath = resolvePublicPdfPath(previousStoredName);
                await deleteFileIfExists(previousPath);
            } catch (err) {
                // Missing old files are safe to ignore; anything else is logged
                // without failing the already-successful import.
                logger.error(`Failed to clean up replaced PDF for book ${bookId}.`, err);
            }

            const previousProcessed = book.processed_content_path || null;
            if (
                previousProcessed &&
                previousProcessed !== processedName &&
                isManagedProcessedName(previousProcessed)
            ) {
                try {
                    await deleteFileIfExists(
                        resolvePublicProcessedPath(previousProcessed)
                    );
                } catch (err) {
                    logger.error(
                        `Failed to clean up replaced processed text for book ${bookId}.`,
                        err
                    );
                }
            }

            // Module 13.3 — the previous document's image directory is named
            // after its own stored PDF, so only that exact directory can be
            // removed here. Missing directories are safe to ignore.
            const previousImagesDir =
                buildPublicImagesDirName(previousStoredName);
            if (
                previousImagesDir !== imagesDirName &&
                isManagedImagesDirName(previousImagesDir)
            ) {
                try {
                    await deleteDirectoryIfExists(
                        resolvePublicImagesDir(previousImagesDir)
                    );
                } catch (err) {
                    logger.error(
                        `Failed to clean up replaced images for book ${bookId}.`,
                        err
                    );
                }
            }

            for (const ext of COVER_EXTENSIONS) {
                try {
                    await deleteFileIfExists(
                        resolvePublicCoverPath(buildCoverFileName(previousStoredName, ext))
                    );
                } catch (_) {}
            }
        }
    }

    // Module 27.5: Record saved cover filename and canonical /api/books/:id/cover path.
    const coverUpdates = {};
    const hasCustomUploadedCover = Boolean(
        book.cover_image &&
        CUSTOM_UPLOADED_COVER_PATTERN.test(book.cover_image) &&
        await fileExists(resolvePublicCoverPath(book.cover_image)).catch(() => false)
    );
    if (extractedCoverName && !hasCustomUploadedCover) {
        coverUpdates.cover_image = extractedCoverName;
    } else if (!hasCustomUploadedCover && book.cover_image && !extractedCoverName) {
        // Previous extracted cover was replaced by a file without an extracted cover
        coverUpdates.cover_image = null;
    }
    if (!book.cover_path || !String(book.cover_path).trim() || String(book.cover_path).trim().startsWith('/uploads/')) {
        coverUpdates.cover_path = `/api/books/${bookId}/cover`;
    }
    if (Object.keys(coverUpdates).length > 0) {
        try {
            await bookRepository.updateFields(bookId, coverUpdates);
        } catch (_) {}
    }

    if (!processedAvailable) {
        // Bookkeeping only: never fail an otherwise successful import here.
        // On a replace this clears a stale pointer so the old text is not
        // served for the new PDF; on a first import it is already NULL.
        try {
            await bookRepository.updateProcessedPath(bookId, null);
        } catch (err) {
            logger.error(
                `Could not reset processed text link for book ${bookId}.`,
                err
            );
        }
    }

    return {
        book: await bookRepository.findById(bookId),
        imageStatus: documentImageStatus.status,
        imageCount: documentImages.length,
    };
}

// Module 13.2 — reads the book's processed-text JSON, or synthesizes one from
// published chapters if the book has chapter content. Reuses the book
// visibility rule, so drafts stay hidden from normal users (404, not 403).
async function getProcessedDocument(bookId, requestingUser) {
    const book = await getBookById(bookId, requestingUser);

    // 1. Processed PDF text exists
    if (book.processed_content_path) {
        const filePath = resolvePublicProcessedPath(
            path.basename(book.processed_content_path)
        );

        let fileContent;
        try {
            fileContent = await fs.readFile(filePath, 'utf-8');
        } catch (err) {
            logger.error(`Processed content file missing for book ${bookId}: ${filePath}`, err);
            const notFoundErr = new Error('The book content file is missing.');
            notFoundErr.status = 404;
            notFoundErr.code = 'CONTENT_FILE_MISSING';
            throw notFoundErr;
        }

        try {
            const parsed = JSON.parse(fileContent);
            const inferredFormat = book.file_format || (book.pdf_stored_name && book.pdf_stored_name.toLowerCase().endsWith('.epub') ? 'EPUB' : 'PDF');
            const textChars = Number(parsed.textChars) || 0;
            return {
                ...parsed,
                fileFormat: parsed.fileFormat || inferredFormat,
                hasOriginalFile: Boolean(book.pdf_stored_name),
                hasText: typeof parsed.hasText === 'boolean' ? parsed.hasText : textChars > 0,
                isScanned: typeof parsed.isScanned === 'boolean' ? parsed.isScanned : (inferredFormat === 'PDF' && textChars === 0),
            };
        } catch (parseErr) {
            logger.error(`Content processing failed for book ${bookId}: invalid JSON in ${filePath}`, parseErr);
            const corruptErr = new Error('Content-processing failed for this book.');
            corruptErr.status = 500;
            corruptErr.expose = true;
            corruptErr.code = 'CONTENT_PROCESSING_FAILED';
            throw corruptErr;
        }
    }

    // 2. A PDF was uploaded, but text extraction was not completed / processed_content_path is null
    if (book.pdf_stored_name) {
        const pdfPath = resolvePublicPdfPath(book.pdf_stored_name);
        let pdfExists = false;
        try {
            await fs.access(pdfPath);
            pdfExists = true;
        } catch {
            pdfExists = false;
        }

        if (!pdfExists) {
            logger.error(`PDF content file missing for book ${bookId}: ${pdfPath}`);
            const missingErr = new Error('The book content file is missing.');
            missingErr.status = 404;
            missingErr.code = 'CONTENT_FILE_MISSING';
            throw missingErr;
        }

        logger.error(`Content processing failed for book ${bookId}: PDF uploaded (${book.pdf_stored_name}) but text extraction was not completed.`);
        const procErr = new Error('Content-processing failed for this book.');
        procErr.status = 500;
        procErr.expose = true;
        procErr.code = 'CONTENT_PROCESSING_FAILED';
        throw procErr;
    }

    // 3. Chapter-based content
    const allChapters = await chapterRepository.findByBook(bookId);
    const readableChapters = isAdmin(requestingUser)
        ? allChapters
        : allChapters.filter(isChapterPubliclyReadable);

    if (!readableChapters || readableChapters.length === 0) {
        const noContentErr = new Error('This book has no readable content yet.');
        noContentErr.status = 404;
        noContentErr.code = 'NO_READABLE_CONTENT';
        throw noContentErr;
    }

    let totalChars = 0;
    const pages = readableChapters.map((ch, idx) => {
        const pageNumber = idx + 1;
        const chapterHeading = ch.title
            ? `Chapter ${ch.chapter_number}: ${ch.title}`
            : `Chapter ${ch.chapter_number}`;

        const rawParagraphs = typeof ch.content === 'string'
            ? ch.content
                  .split(/\r?\n\r?\n|\r?\n/)
                  .map((p) => p.trim())
                  .filter(Boolean)
            : [];

        const blocks = [
            { kind: 'heading', text: chapterHeading },
            ...rawParagraphs.map((text) => ({ kind: 'paragraph', text }))
        ];

        const text = blocks.map((b) => b.text).join('\n\n');
        totalChars += text.length;

        return {
            pageNumber,
            chapterNumber: ch.chapter_number,
            chapterTitle: ch.title || `Chapter ${ch.chapter_number}`,
            text,
            paragraphs: rawParagraphs,
            blocks
        };
    });

    return {
        version: 1,
        bookId: Number(bookId),
        source: 'chapters',
        sourceFile: book.title,
        pageCount: pages.length,
        textChars: totalChars,
        extractedAt: new Date().toISOString(),
        pages,
        images: [],
        imageStatus: {
            status: 'not_attempted',
            extractedCount: 0,
            pageReferences: 0,
            skippedCount: 0,
            unsupportedCount: 0,
            pageErrors: 0,
            limitReached: false,
            totalBytes: 0,
            message: 'Image extraction was not attempted for chapter-based books.'
        }
    };
}

// PNG magic bytes. Served files are re-checked against this so a stored
// file can never be served with a mismatched image content type.
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function imageNotFound() {
    const err = new Error('Image not found for this book.');
    err.status = 404;
    return err;
}

// Module 13.4 — serves one extracted image belonging to a book.
// The image is identified by book ID plus the server-generated file name
// from that book's own processed-document metadata (e.g. 'p1-1.png').
// Visibility, processed-content linkage, and error shape match the document
// API: hidden books look like "not found" to normal users, and no server
// paths or internal details are ever exposed.
async function getProcessedImage(bookId, imageName, requestingUser) {
    const book = await getBookById(bookId, requestingUser);

    if (!book.processed_content_path) {
        const err = new Error('Processed text is not available for this book.');
        err.status = 404;
        throw err;
    }

    const document = await getProcessedDocument(bookId, requestingUser);
    const images = Array.isArray(document.images) ? document.images : [];
    const entry = images.find(
        (candidate) =>
            candidate &&
            typeof candidate.file === 'string' &&
            path.basename(candidate.file) === imageName
    );

    if (!entry) {
        throw imageNotFound();
    }

    // Defense in depth: the metadata is server-written, but a reference is
    // only served when it has the exact managed '<uuid>.images/<name>.png'
    // shape. Anything else is treated as not found, never as a path.
    const dirPart = path.dirname(entry.file);
    const basePart = path.basename(entry.file);

    if (
        basePart !== imageName ||
        !isManagedImagesDirName(dirPart) ||
        (entry.mimeType && entry.mimeType !== 'image/png')
    ) {
        throw imageNotFound();
    }

    let filePath;

    try {
        filePath = resolvePublicImagePath(dirPart, basePart);
    } catch (err) {
        logger.error(`Rejected image path for book ${bookId}.`, err);
        throw imageNotFound();
    }

    try {
        const data = await fs.readFile(filePath);

        if (
            data.length < PNG_SIGNATURE.length ||
            !data.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)
        ) {
            logger.error(
                `Stored image failed validation for book ${bookId}.`
            );
            throw imageNotFound();
        }

        return { buffer: data, mimeType: 'image/png', sizeBytes: data.length };
    } catch (err) {
        if (err && err.status === 404) {
            throw err;
        }

        logger.error(`Processed image file missing for book ${bookId}.`, err);
        throw imageNotFound();
    }
}

async function getBookToc(bookId, requestingUser) {
    const document = await getProcessedDocument(bookId, requestingUser);
    return document.toc || [];
}

async function getBookChapterPage(bookId, chapterIndex, requestingUser) {
    const document = await getProcessedDocument(bookId, requestingUser);
    const pages = Array.isArray(document.pages) ? document.pages : [];
    const index = parseInt(chapterIndex, 10);
    const page = pages.find((p) => Number(p.pageNumber) === index);
    if (!page) {
        const err = new Error('Chapter not found in readable document.');
        err.status = 404;
        err.code = 'CHAPTER_NOT_FOUND';
        throw err;
    }
    return page;
}

async function getPublicFileForStreaming(bookId, requestingUser) {
    const book = await getBookById(bookId, requestingUser);

    if (!book.pdf_stored_name) {
        const err = new Error('No original book file is attached to this book.');
        err.status = 404;
        err.code = 'CONTENT_FILE_MISSING';
        throw err;
    }

    const filePath = resolvePublicPdfPath(book.pdf_stored_name);
    if (!(await fileExists(filePath))) {
        const err = new Error('The book file is missing from storage.');
        err.status = 404;
        err.code = 'CONTENT_FILE_MISSING';
        throw err;
    }

    const isEpub =
        String(book.file_format || '').toUpperCase() === 'EPUB' ||
        String(book.pdf_stored_name || "").toLowerCase().endsWith(".epub");

    return {
        filePath,
        fileName: book.pdf_original_name || book.pdf_stored_name || `book-${bookId}.${isEpub ? 'epub' : 'pdf'}`,
        mimeType: isEpub ? 'application/epub+zip' : 'application/pdf',
    };
}

const CUSTOM_UPLOADED_COVER_PATTERN = /^cover-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg|jpeg|webp|gif)$/i;
const EXTRACTED_COVER_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.cover\.(png|jpg|jpeg|webp|gif)$/i;
const MANAGED_COVER_NAME_PATTERN = /^(cover-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.cover)\.(png|jpg|jpeg|webp|gif)$/i;

async function uploadBookCover(bookId, requestingUser, file) {
    assertAdmin(requestingUser);

    if (!file || !file.path || !file.filename) {
        const err = new Error('Cover image file is required.');
        err.status = 400;
        throw err;
    }

    const book = await bookRepository.findById(bookId);
    if (!book) {
        await deleteFileIfExists(file.path).catch(() => {});
        throw notFound();
    }

    let finalFilename = file.filename;
    let finalPath = file.path;

    try {
        const buf = await fs.readFile(file.path);
        const detected = detectImageFormat(buf);
        if (!detected) {
            const err = new Error('Uploaded file is not a valid JPG, PNG, WEBP, or GIF image.');
            err.status = 400;
            throw err;
        }

        // Ensure physical file extension always matches actual image format.
        const currentExt = path.extname(file.filename).toLowerCase();
        if (currentExt !== detected.ext) {
            finalFilename = path.basename(file.filename, currentExt) + detected.ext;
            finalPath = resolvePublicCoverPath(finalFilename);
            await fs.rename(file.path, finalPath);
        }

        const coverPath = `/api/books/${bookId}/cover`;
        await bookRepository.updateFields(bookId, {
            cover_image: finalFilename,
            cover_path: coverPath,
        });
    } catch (err) {
        await deleteFileIfExists(file.path).catch(() => {});
        if (finalPath !== file.path) {
            await deleteFileIfExists(finalPath).catch(() => {});
        }
        throw err;
    }

    const previousCover = book.cover_image;
    if (previousCover && previousCover !== finalFilename && CUSTOM_UPLOADED_COVER_PATTERN.test(previousCover)) {
        try {
            await deleteFileIfExists(resolvePublicCoverPath(previousCover));
        } catch (_) {}
    }

    return bookRepository.findById(bookId);
}

async function getBookCover(bookId, requestingUser) {
    const book = await getBookById(bookId, requestingUser);

    if (book.cover_image && MANAGED_COVER_NAME_PATTERN.test(book.cover_image)) {
        try {
            const customPath = resolvePublicCoverPath(book.cover_image);
            if (await fileExists(customPath)) {
                const data = await fs.readFile(customPath);
                const detected = detectImageFormat(data);
                if (detected) {
                    return { buffer: data, mimeType: detected.mimeType, sizeBytes: data.length };
                }
            }
        } catch (_) {}
    }

    if (book.pdf_stored_name) {
        const extractedCover = await findExtractedCoverBuffer(book.pdf_stored_name, false);
        if (extractedCover) {
            return extractedCover;
        }
    }

    if (book.processed_content_path) {
        try {
            const doc = await getProcessedDocument(bookId, requestingUser);
            const images = Array.isArray(doc.images) ? doc.images : [];
            const bestImage = selectBestPdfCoverImage(images);
            if (bestImage && typeof bestImage.file === 'string') {
                const firstImage = await getProcessedImage(bookId, path.basename(bestImage.file), requestingUser);
                if (firstImage) {
                    if (book.pdf_stored_name) {
                        try {
                            const saved = await saveExtractedCover(book.pdf_stored_name, firstImage.buffer, false);
                            if (saved && saved.coverFileName && !book.cover_image) {
                                await bookRepository.updateFields(bookId, {
                                    cover_image: saved.coverFileName,
                                    cover_path: resolveCanonicalCoverPath(book),
                                });
                            }
                        } catch (_) {}
                    }
                    return firstImage;
                }
            }
        } catch (_) {}
    }

    const formatLabel = inferBookFileFormat(book) || 'BOOK';
    let fallbackSubtitle = 'Public Library';
    const bookAuthors = Array.isArray(book.authors) ? book.authors : await bookRelationsRepository.getAuthorsForBook(book.book_id);
    const authorNames = bookAuthors.map((a) => a.name).filter(Boolean).join(', ');
    if (authorNames) {
        fallbackSubtitle = authorNames;
    } else if (book.publication_date) {
        fallbackSubtitle = String(book.publication_date).slice(0, 10);
    }
    const svgBuffer = generateFallbackCoverSvg({
        id: book.book_id,
        title: book.title,
        subtitle: fallbackSubtitle,
        format: formatLabel,
    });
    return {
        buffer: svgBuffer,
        mimeType: 'image/svg+xml',
        sizeBytes: svgBuffer.length,
    };
}

module.exports = {
    createBook,
    getAllBooks,
    getAllBooksPaginated,
    getAdminBooks,
    getBookById,
    updateBook,
    publishBook,
    archiveBook,
    importBookPdf,
    getProcessedDocument,
    getProcessedImage,
    getBookToc,
    getBookChapterPage,
    getPublicFileForStreaming,
    getBookCover,
    uploadBookCover,
};