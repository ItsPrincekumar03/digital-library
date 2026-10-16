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
            req.query.page ||
            req.query.limit ||
            req.query.sort ||
            req.query.order
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
            req.file
        );
        const book = result && result.book ? result.book : result;

        res.status(200).json({
            success: true,
            message: 'PDF imported successfully.',
            data: {
                book: {
                    book_id: book.book_id,
                    title: book.title,
                    status: book.status,
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

module.exports = {
    create,
    getAll,
    getById,
    update,
    publish,
    archive,
    importPdf,
    getDocument,
    getImage
};