const categoryRepository = require('../repositories/category.repository');

function notFound() {
    const err = new Error('Category not found.');
    err.status = 404;
    return err;
}
function duplicate() {
    const err = new Error('A category with this name already exists.');
    err.status = 409;
    return err;
}

async function createCategory({ name, description }) {
    const existing = await categoryRepository.findByName(name);
    if (existing) throw duplicate();
    const categoryId = await categoryRepository.create({ name, description });
    return categoryRepository.findById(categoryId);
}

async function getAllCategories() {
    return categoryRepository.findAll();
}

async function getCategoryById(categoryId) {
    const category = await categoryRepository.findById(categoryId);
    if (!category) throw notFound();
    return category;
}

async function updateCategory(categoryId, { name, description }) {
    const existing = await categoryRepository.findById(categoryId);
    if (!existing) throw notFound();

    const conflict = await categoryRepository.findByNameExcluding(name, categoryId);
    if (conflict) throw duplicate();

    await categoryRepository.update(categoryId, { name, description });
    return categoryRepository.findById(categoryId);
}

async function archiveCategory(categoryId) {
    const existing = await categoryRepository.findById(categoryId);
    if (!existing) throw notFound();
    await categoryRepository.archive(categoryId);
    return categoryRepository.findById(categoryId);
}

module.exports = { createCategory, getAllCategories, getCategoryById, updateCategory, archiveCategory };