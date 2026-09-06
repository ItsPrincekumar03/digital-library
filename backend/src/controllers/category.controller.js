const categoryService = require('../services/category.service');

async function create(req, res, next) {
    try {
        const category = await categoryService.createCategory(req.body);
        res.status(201).json({ success: true, message: 'Category created.', data: { category } });
    } catch (err) { next(err); }
}

async function getAll(req, res, next) {
    try {
        const categories = await categoryService.getAllCategories();
        res.status(200).json({ success: true, data: { categories } });
    } catch (err) { next(err); }
}

async function getById(req, res, next) {
    try {
        const category = await categoryService.getCategoryById(req.params.id);
        res.status(200).json({ success: true, data: { category } });
    } catch (err) { next(err); }
}

async function update(req, res, next) {
    try {
        const category = await categoryService.updateCategory(req.params.id, req.body);
        res.status(200).json({ success: true, message: 'Category updated.', data: { category } });
    } catch (err) { next(err); }
}

async function archive(req, res, next) {
    try {
        const category = await categoryService.archiveCategory(req.params.id);
        res.status(200).json({ success: true, message: 'Category archived.', data: { category } });
    } catch (err) { next(err); }
}

module.exports = { create, getAll, getById, update, archive };