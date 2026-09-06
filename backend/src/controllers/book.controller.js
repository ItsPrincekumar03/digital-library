const bookService = require('../services/book.service');

async function create(req, res, next) {
    try {
        const book = await bookService.createBook(req.user.user_id, req.body);
        res.status(201).json({ success: true, message: 'Book created.', data: { book } });
    } catch (err) { next(err); }
}

async function getAll(req, res, next) {
    try {
        const books = await bookService.getAllBooks();
        res.status(200).json({ success: true, data: { books } });
    } catch (err) { next(err); }
}

async function getById(req, res, next) {
    try {
        const book = await bookService.getBookById(req.params.id);
        res.status(200).json({ success: true, data: { book } });
    } catch (err) { next(err); }
}

async function update(req, res, next) {
    try {
        const book = await bookService.updateBook(req.params.id, req.user, req.body);
        res.status(200).json({ success: true, message: 'Book updated.', data: { book } });
    } catch (err) { next(err); }
}

async function archive(req, res, next) {
    try {
        const book = await bookService.archiveBook(req.params.id, req.user);
        res.status(200).json({ success: true, message: 'Book archived.', data: { book } });
    } catch (err) { next(err); }
}

module.exports = { create, getAll, getById, update, archive };