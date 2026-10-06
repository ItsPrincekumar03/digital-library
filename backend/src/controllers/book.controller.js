const bookService = require('../services/book.service');

async function create(req, res, next) {
    try {
        const book = await bookService.createBook(req.user, req.body);
        res.status(201).json({ success: true, message: 'Book created.', data: { book } });
    } catch (err) { next(err); }
}

async function importPdf(req, res, next) {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'PDF file is required.' });
        const { title, description, authorId, categoryId } = req.body;
        if (!title) return res.status(400).json({ success: false, message: 'Title is required.' });
        
        const book = await bookService.importPdfBook(req.user, {
            title, description, authorId, categoryId,
            pdfPath: req.file.filename,
            pdfOriginalName: req.file.originalname,
            pdfSize: req.file.size
        });

        res.status(201).json({ success: true, message: 'PDF imported successfully.', data: { book } });
    } catch (err) { next(err); }
}

async function getAll(req, res, next) {
    try {
        if (req.query.page || req.query.limit || req.query.sort || req.query.order) {
            const { books, meta } = await bookService.getAllBooksPaginated(req.user, req.query);
            return res.status(200).json({ success: true, data: { books, meta } });
        }
        const books = await bookService.getAllBooks(req.user);
        res.status(200).json({ success: true, data: { books } });
    } catch (err) { next(err); }
}

async function getById(req, res, next) {
    try {
        const book = await bookService.getBookById(req.params.id, req.user);
        res.status(200).json({ success: true, data: { book } });
    } catch (err) { next(err); }
}

async function readPdf(req, res, next) {
    try {
        const { filePath, mimeType, safeFileName } = await bookService.getPublicPdfStream(req.params.id, req.user);
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${safeFileName}"`);
        res.sendFile(filePath);
    } catch (err) { next(err); }
}

async function update(req, res, next) {
    try {
        const book = await bookService.updateBook(req.params.id, req.user, req.body);
        res.status(200).json({ success: true, message: 'Book updated.', data: { book } });
    } catch (err) { next(err); }
}

async function publish(req, res, next) {
    try {
        const book = await bookService.publishBook(req.params.id, req.user);
        res.status(200).json({ success: true, message: 'Book published.', data: { book } });
    } catch (err) { next(err); }
}

async function archive(req, res, next) {
    try {
        const book = await bookService.archiveBook(req.params.id, req.user);
        res.status(200).json({ success: true, message: 'Book archived.', data: { book } });
    } catch (err) { next(err); }
}

module.exports = {
    create, importPdf, getAll, getById, readPdf, update, publish, archive
};
