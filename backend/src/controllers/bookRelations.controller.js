const relationsService = require('../services/bookRelations.service');

async function addAuthor(req, res, next) {
    try {
        const authors = await relationsService.addAuthorToBook(req.params.bookId, req.body.authorId, req.user);
        res.status(201).json({ success: true, message: 'Author linked to book.', data: { authors } });
    } catch (err) { next(err); }
}

async function removeAuthor(req, res, next) {
    try {
        const authors = await relationsService.removeAuthorFromBook(req.params.bookId, req.params.authorId, req.user);
        res.status(200).json({ success: true, message: 'Author removed from book.', data: { authors } });
    } catch (err) { next(err); }
}

async function getAuthors(req, res, next) {
    try {
        const authors = await relationsService.getAuthorsOfBook(req.params.bookId);
        res.status(200).json({ success: true, data: { authors } });
    } catch (err) { next(err); }
}

async function addCategory(req, res, next) {
    try {
        const categories = await relationsService.addCategoryToBook(req.params.bookId, req.body.categoryId, req.user);
        res.status(201).json({ success: true, message: 'Category linked to book.', data: { categories } });
    } catch (err) { next(err); }
}

async function removeCategory(req, res, next) {
    try {
        const categories = await relationsService.removeCategoryFromBook(req.params.bookId, req.params.categoryId, req.user);
        res.status(200).json({ success: true, message: 'Category removed from book.', data: { categories } });
    } catch (err) { next(err); }
}

async function getCategories(req, res, next) {
    try {
        const categories = await relationsService.getCategoriesOfBook(req.params.bookId);
        res.status(200).json({ success: true, data: { categories } });
    } catch (err) { next(err); }
}

module.exports = { addAuthor, removeAuthor, getAuthors, addCategory, removeCategory, getCategories };