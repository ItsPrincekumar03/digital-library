const bookRepository = require('../repositories/book.repository');
const {
    deleteFileIfExists,
    deleteDirectoryIfExists,
    resolvePublicPdfPath,
    buildPublicProcessedName,
    resolvePublicProcessedPath,
    buildPublicImagesDirName,
    resolvePublicImagesDir,
    resolvePublicImagePath,
} = require('../utils/fileStorage');
const { validatePdfFile } = require('../utils/pdfValidation');
const { extractPdfText } = require('../utils/pdfTextExtractor');
const { extractPdfImages } = require('../utils/pdfImageExtractor');
const logger = require('../utils/logger');
const fs = require('fs/promises');
const path = require('path');
const {
    parsePagination,
    parseSort,
    buildPaginationMeta
} = require('../utils/pagination');
const {
    PUBLIC_BOOK_STATUS,
    isAdmin,
    isBookPubliclyReadable
} = require('../utils/bookVisibility');

// Module 8.5 — PUBLIC LIBRARY RULES
//   * Public books are managed by ADMIN only (create / edit / publish / archive).
//   * Normal users can only READ books whose status is PUBLISHED.
//   * Lifecycle used by the API: DRAFT -> PUBLISHED -> ARCHIVED.
//   * Old statuses (PENDING_REVIEW, APPROVED, REJECTED) stay in the DB ENUM for
//     compatibility but are never written and never visible to normal users.
//   * Private user PDFs (Module 12) will use their own table (user_pdf_books),
//     NOT this books table.

function notFound() {
    const err = new Error('Book not found.');
    err.status = 404;
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

// Admin-only. New public books always start as DRAFT.
// owner_id records which admin created the book.
async function createBook(
    requestingUser,
    { title, description, coverPath, publicationDate }
) {
    assertAdmin(requestingUser);

    const bookId = await bookRepository.create({
        ownerUserId: requestingUser.user_id,
        title,
        description,
        coverPath,
        publicationDate
    });

    return bookRepository.findById(bookId);
}

async function getAllBooks(requestingUser) {
    return bookRepository.findAll(statusFilterFor(requestingUser));
}

async function getAllBooksPaginated(requestingUser, query) {
    const { page, limit, offset } = parsePagination(query);

    const { column, direction } = parseSort(
        query,
        BOOK_SORT_COLUMNS,
        'created_at'
    );

    const status = statusFilterFor(requestingUser);

    const [books, totalItems] = await Promise.all([
        bookRepository.findAllPaginated({
            limit,
            offset,
            sortColumn: column,
            sortDirection: direction,
            status
        }),
        bookRepository.countAll(status)
    ]);

    return {
        books,
        meta: buildPaginationMeta({
            page,
            limit,
            totalItems
        })
    };
}

// Hidden books (draft / archived / legacy) look like "not found" to normal users.
async function getBookById(bookId, requestingUser) {
    const book = await bookRepository.findById(bookId);

    if (!book) {
        throw notFound();
    }

    if (!isAdmin(requestingUser) && !isBookPubliclyReadable(book)) {
        throw notFound();
    }

    return book;
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

    const fields = {
        title,
        description: description ?? null,
        cover_path: coverPath ?? null,
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
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i;

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
async function importBookPdf(bookId, requestingUser, file) {
    assertAdmin(requestingUser);

    if (!file || !file.path || !file.filename) {
        const err = new Error('PDF file is required.');
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

    try {
        await validatePdfFile(file.path);
    } catch (err) {
        await deleteFileIfExists(file.path);
        throw err;
    }

    let updateResult;
    try {
        updateResult = await bookRepository.updatePdfMetadata(bookId, {
            originalName: file.originalname,
            storedName: file.filename,
            size: file.size
        });
    } catch (err) {
        await deleteFileIfExists(file.path);
        throw err;
    }

    // Confirm the update hit exactly this book. A zero-row update means the
    // record vanished between the read and the write: drop the new file and
    // keep the previous PDF and its metadata untouched.
    if (!updateResult || updateResult.affectedRows !== 1) {
        await deleteFileIfExists(file.path);
        const err = new Error('Book no longer exists. PDF import was not saved.');
        err.status = 404;
        throw err;
    }

    // Module 13.2 — extract text into '<uuid>.processed.json' next to the PDF
    // and point processed_content_path at it. Extraction failure never fails
    // the import and never invents text: the book keeps its PDF while the
    // processed content simply stays unavailable (NULL).
    const processedName = buildPublicProcessedName(file.filename);
    let processedAvailable = false;

    // Module 13.3 — extract embedded images into '<uuid>.images/' and record
    // them in the same processed document. Image failure never fails the
    // import and never discards successful text extraction.
    const imagesDirName = buildPublicImagesDirName(file.filename);
    let documentImages = [];
    let documentImageStatus = {
        status: 'not_attempted',
        extractedCount: 0,
        pageReferences: 0,
        skippedCount: 0,
        unsupportedCount: 0,
        pageErrors: 0,
        limitReached: false,
        totalBytes: 0,
        message: 'Image extraction was not attempted.',
    };

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
            sourceFile: file.originalname,
            pageCount: extracted.pageCount,
            textChars: extracted.textChars,
            extractedAt: new Date().toISOString(),
            pages: extracted.pages,
            images: documentImages,
            imageStatus: documentImageStatus,
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
        }
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

// Module 13.2 — reads the book's processed-text JSON. Reuses the book
// visibility rule, so drafts stay hidden from normal users (404, not 403).
async function getProcessedDocument(bookId, requestingUser) {
    const book = await getBookById(bookId, requestingUser);

    if (!book.processed_content_path) {
        const err = new Error('Processed text is not available for this book.');
        err.status = 404;
        throw err;
    }

    const filePath = resolvePublicProcessedPath(
        path.basename(book.processed_content_path)
    );

    try {
        return JSON.parse(await fs.readFile(filePath, 'utf-8'));
    } catch (err) {
        logger.error(`Processed text file missing for book ${bookId}.`, err);
        const notFound = new Error('Processed text is not available for this book.');
        notFound.status = 404;
        throw notFound;
    }
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

module.exports = {
    createBook,
    getAllBooks,
    getAllBooksPaginated,
    getBookById,
    updateBook,
    publishBook,
    archiveBook,
    importBookPdf,
    getProcessedDocument,
    getProcessedImage
};