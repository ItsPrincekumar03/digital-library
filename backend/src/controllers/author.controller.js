const authorService = require('../services/author.service');

async function create(req, res, next) {
  try {
    const author = await authorService.createAuthor(req.body);
    res.status(201).json({ success: true, message: 'Author created.', data: { author } });
  } catch (err) { next(err); }
}

async function getAll(req, res, next) {
  try {
    const authors = await authorService.getAllAuthors();
    res.status(200).json({ success: true, data: { authors } });
  } catch (err) { next(err); }
}

async function getById(req, res, next) {
  try {
    const author = await authorService.getAuthorById(req.params.id);
    res.status(200).json({ success: true, data: { author } });
  } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const author = await authorService.updateAuthor(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Author updated.', data: { author } });
  } catch (err) { next(err); }
}

async function archive(req, res, next) {
  try {
    const author = await authorService.archiveAuthor(req.params.id);
    res.status(200).json({ success: true, message: 'Author archived.', data: { author } });
  } catch (err) { next(err); }
}

module.exports = { create, getAll, getById, update, archive };