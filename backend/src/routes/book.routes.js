const express = require('express');
const router = express.Router();

const bookController = require('../controllers/book.controller');
const bookRelationsController = require('../controllers/bookRelations.controller');
const chapterController = require('../controllers/chapter.controller');
const requireAuth = require('../middleware/auth.middleware');
const {
    createBookRules, updateBookRules, idParamRule, bookIdParamRule, handleValidation,
} = require('../validators/book.validator');
const {
    addAuthorRules, addCategoryRules, handleValidation: handleRelationValidation,
} = require('../validators/bookRelations.validator');
const {
    createChapterRules, updateChapterRules, reorderChaptersRules, handleValidation: handleChapterValidation,
} = require('../validators/chapter.validator');

// ---- Core book CRUD ----
router.post('/', requireAuth, createBookRules, handleValidation, bookController.create);
router.get('/', requireAuth, bookController.getAll);
router.get('/:id', requireAuth, idParamRule, handleValidation, bookController.getById);
router.put('/:id', requireAuth, idParamRule, updateBookRules, handleValidation, bookController.update);
router.patch('/:id/archive', requireAuth, idParamRule, handleValidation, bookController.archive);

// ---- Book <-> Author relationship ----
router.post('/:bookId/authors', requireAuth, bookIdParamRule, addAuthorRules, handleRelationValidation, bookRelationsController.addAuthor);
router.get('/:bookId/authors', requireAuth, bookIdParamRule, handleRelationValidation, bookRelationsController.getAuthors);
router.delete('/:bookId/authors/:authorId', requireAuth, bookRelationsController.removeAuthor);

// ---- Book <-> Category relationship ----
router.post('/:bookId/categories', requireAuth, bookIdParamRule, addCategoryRules, handleRelationValidation, bookRelationsController.addCategory);
router.get('/:bookId/categories', requireAuth, bookIdParamRule, handleRelationValidation, bookRelationsController.getCategories);
router.delete('/:bookId/categories/:categoryId', requireAuth, bookRelationsController.removeCategory);

// ---- Chapters nested under a book ----
router.post('/:bookId/chapters', requireAuth, bookIdParamRule, createChapterRules, handleChapterValidation, chapterController.create);
router.get('/:bookId/chapters', requireAuth, bookIdParamRule, handleChapterValidation, chapterController.getForBook);
router.patch('/:bookId/chapters/reorder', requireAuth, bookIdParamRule, reorderChaptersRules, handleChapterValidation, chapterController.reorder);

module.exports = router;