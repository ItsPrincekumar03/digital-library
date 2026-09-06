const authorRepository = require('../repositories/author.repository');

function notFound() {
  const err = new Error('Author not found.');
  err.status = 404;
  return err;
}

async function createAuthor({ name, bio }) {
  const authorId = await authorRepository.create({ name, bio });
  return authorRepository.findById(authorId);
}

async function getAllAuthors() {
  return authorRepository.findAll();
}

async function getAuthorById(authorId) {
  const author = await authorRepository.findById(authorId);
  if (!author) throw notFound();
  return author;
}

async function updateAuthor(authorId, { name, bio }) {
  const existing = await authorRepository.findById(authorId);
  if (!existing) throw notFound();
  await authorRepository.update(authorId, { name, bio });
  return authorRepository.findById(authorId);
}

async function archiveAuthor(authorId) {
  const existing = await authorRepository.findById(authorId);
  if (!existing) throw notFound();
  await authorRepository.archive(authorId);
  return authorRepository.findById(authorId);
}

module.exports = { createAuthor, getAllAuthors, getAuthorById, updateAuthor, archiveAuthor };