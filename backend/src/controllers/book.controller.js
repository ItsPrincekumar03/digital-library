const path = require('path');
const bookService = require('../services/book.service');

async function create(req, res, next) {
    try {
        const book = await bookService.createBook(
            req.user,
            req.body
        );

        res.status(201).json({
            success: true,
            message: 'Book created.',
            data: { book }
        });
    } catch (err) {
        next(err);
    }
}

async function getAll(req, res, next) {
    try {
        if (
            req.query.page !== undefined ||
            req.query.limit !== undefined ||
            req.query.sort !== undefined ||
            req.query.order !== undefined ||
            req.query.search !== undefined ||
            req.query.category !== undefined ||
            req.query.categoryId !== undefined ||
            req.query.status !== undefined
        ) {
            const { books, meta } =
                await bookService.getAllBooksPaginated(req.user, req.query);

            return res.status(200).json({
                success: true,
                data: {
                    books,
                    meta
                }
            });
        }

        const books = await bookService.getAllBooks(req.user);

        res.status(200).json({
            success: true,
            data: { books }
        });
    } catch (err) {
        next(err);
    }
}

async function getManageList(req, res, next) {
    try {
        const { books, meta } = await bookService.getAdminBooks(req.user, req.query);
        res.status(200).json({
            success: true,
            data: { books, meta }
        });
    } catch (err) {
        next(err);
    }
}

async function getById(req, res, next) {
    try {
        const book = await bookService.getBookById(req.params.id, req.user);

        res.status(200).json({
            success: true,
            data: { book }
        });
    } catch (err) {
        next(err);
    }
}

async function update(req, res, next) {
    try {
        const book = await bookService.updateBook(
            req.params.id,
            req.user,
            req.body
        );

        res.status(200).json({
            success: true,
            message: 'Book updated.',
            data: { book }
        });
    } catch (err) {
        next(err);
    }
}

async function publish(req, res, next) {
    try {
        const book = await bookService.publishBook(
            req.params.id,
            req.user
        );

        res.status(200).json({
            success: true,
            message: 'Book published.',
            data: { book }
        });
    } catch (err) {
        next(err);
    }
}

async function archive(req, res, next) {
    try {
        const book = await bookService.archiveBook(
            req.params.id,
            req.user
        );

        res.status(200).json({
            success: true,
            message: 'Book archived.',
            data: { book }
        });
    } catch (err) {
        next(err);
    }
}

async function importPdf(req, res, next) {
    try {
        const result = await bookService.importBookPdf(
            req.params.id,
            req.user,
            req.file,
            req.body.format
        );
        const book = result && result.book ? result.book : result;

        res.status(200).json({
            success: true,
            message: 'File imported successfully.',
            data: {
                book: {
                    book_id: book.book_id,
                    title: book.title,
                    status: book.status,
                    file_format: book.file_format,
                    pdf_original_name: book.pdf_original_name,
                    pdf_size: book.pdf_size,
                    pdf_uploaded_at: book.pdf_uploaded_at,
                    has_processed_text: !!book.processed_content_path,
                    image_status:
                        result && result.imageStatus
                            ? result.imageStatus
                            : 'not_attempted',
                    image_count:
                        result && Number.isInteger(result.imageCount)
                            ? result.imageCount
                            : 0
                }
            }
        });
    } catch (err) {
        next(err);
    }
}

async function getDocument(req, res, next) {
    try {
        const document = await bookService.getProcessedDocument(
            req.params.id,
            req.user
        );

        res.status(200).json({
            success: true,
            data: { document }
        });
    } catch (err) {
        next(err);
    }
}

async function getImage(req, res, next) {
    try {
        const image = await bookService.getProcessedImage(
            req.params.id,
            req.params.imageName,
            req.user
        );

        res.status(200);
        res.set('Content-Type', image.mimeType);
        res.set('Content-Length', String(image.sizeBytes));
        // Image files are immutable per processed document (a replacement
        // mints a new directory), but delivery is authenticated, so the
        // response stays private to the requesting session.
        res.set('Cache-Control', 'private, max-age=86400');
        res.send(image.buffer);
    } catch (err) {
        next(err);
    }
}

async function getToc(req, res, next) {
    try {
        const toc = await bookService.getBookToc(req.params.id, req.user);
        res.status(200).json({
            success: true,
            data: { toc }
        });
    } catch (err) {
        next(err);
    }
}

async function getChapterPage(req, res, next) {
    try {
        const chapter = await bookService.getBookChapterPage(
            req.params.id,
            req.params.chapterIndex,
            req.user
        );
        res.status(200).json({
            success: true,
            data: { chapter }
        });
    } catch (err) {
        next(err);
    }
}

async function getCover(req, res, next) {
    try {
        const cover = await bookService.getBookCover(req.params.id, req.user);
        res.status(200);
        res.set('Content-Type', cover.mimeType);
        res.set('Content-Length', String(cover.sizeBytes));
        res.set('Cache-Control', 'private, no-cache');
        if (cover.mimeType === 'image/svg+xml') {
            res.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
        }
        res.send(cover.buffer);
    } catch (err) {
        next(err);
    }
}

async function uploadCover(req, res, next) {
    try {
        const book = await bookService.uploadBookCover(
            req.params.id,
            req.user,
            req.file
        );
        res.status(200).json({
            success: true,
            message: 'Cover uploaded successfully.',
            data: { book },
        });
    } catch (err) {
        next(err);
    }
}

async function openFile(req, res, next) {
    try {
        const bookFile = await bookService.getPublicFileForStreaming(
            req.params.id,
            req.user
        );
        const safeFileName = path.basename(String(bookFile.fileName || 'book.pdf')).replace(/[\r\n"]/g, '');
        const asciiFileName = safeFileName.replace(/[^\x20-\x7E]/g, '_') || 'book.pdf';
        res.setHeader('Content-Type', bookFile.mimeType);
        res.setHeader(
            'Content-Disposition',
            `inline; filename="${asciiFileName}"; filename*=UTF-8''${encodeURIComponent(safeFileName)}`
        );
        res.sendFile(bookFile.filePath);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    create,
    getAll,
    getManageList,
    getById,
    update,
    publish,
    archive,
    importPdf,
    getDocument,
    getImage,
    getCover,
    uploadCover,
    openFile,
    getToc,
    getChapterPage
};