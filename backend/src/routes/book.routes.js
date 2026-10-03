const express = require('express');
const router = express.Router();

const bookController = require('../controllers/book.controller');
const bookRelationsController = require('../controllers/bookRelations.controller');
const chapterController = require('../controllers/chapter.controller');
const requireAuth = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
  createBookRules, updateBookRules, idParamRule, bookIdParamRule, handleValidation,
} = require('../validators/book.validator');
const {
  addAuthorRules, addCategoryRules, handleValidation: handleRelationValidation,
} = require('../validators/bookRelations.validator');
const {
  createChapterRules, updateChapterRules, reorderChaptersRules, handleValidation: handleChapterValidation,
} = require('../validators/chapter.validator');

router.post('/', requireAuth, requireRole('ADMIN'), createBookRules, handleValidation, bookController.create);
router.get('/', requireAuth, bookController.getAll);
router.get('/:id', requireAuth, idParamRule, handleValidation, bookController.getById);
router.put('/:id', requireAuth, requireRole('ADMIN'), idParamRule, updateBookRules, handleValidation, bookController.update);
router.patch('/:id/publish', requireAuth, requireRole('ADMIN'), idParamRule, handleValidation, bookController.publish);
router.patch('/:id/archive', requireAuth, requireRole('ADMIN'), idParamRule, handleValidation, bookController.archive);

router.post('/:bookId/authors', requireAuth, requireRole('ADMIN'), bookIdParamRule, addAuthorRules, handleRelationValidation, bookRelationsController.addAuthor);
router.get('/:bookId/authors', requireAuth, bookIdParamRule, handleRelationValidation, bookRelationsController.getAuthors);
router.delete('/:bookId/authors/:authorId', requireAuth, requireRole('ADMIN'), bookRelationsController.removeAuthor);

router.post('/:bookId/categories', requireAuth, requireRole('ADMIN'), bookIdParamRule, addCategoryRules, handleRelationValidation, bookRelationsController.addCategory);
router.get('/:bookId/categories', requireAuth, bookIdParamRule, handleRelationValidation, bookRelationsController.getCategories);
router.delete('/:bookId/categories/:categoryId', requireAuth, requireRole('ADMIN'), bookRelationsController.removeCategory);

router.post('/:bookId/chapters', requireAuth, requireRole('ADMIN'), bookIdParamRule, createChapterRules, handleChapterValidation, chapterController.create);
router.get('/:bookId/chapters', requireAuth, bookIdParamRule, handleChapterValidation, chapterController.getForBook);
router.patch('/:bookId/chapters/reorder', requireAuth, requireRole('ADMIN'), bookIdParamRule, reorderChaptersRules, handleChapterValidation, chapterController.reorder);

module.exports = router;