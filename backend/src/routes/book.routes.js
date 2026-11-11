const express = require('express');
const router = express.Router();

const bookController = require('../controllers/book.controller');
const bookRelationsController = require('../controllers/bookRelations.controller');
const chapterController = require('../controllers/chapter.controller');
const requireAuth = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const { handlePublicPdfUpload, handleBookCoverUpload } = require('../middleware/upload.middleware');
const { uploadLimiter } = require('../middleware/rateLimiter');
const {
  createBookRules, updateBookRules, idParamRule, bookIdParamRule, imageNameParamRule, chapterIndexParamRule, handleValidation,
} = require('../validators/book.validator');
const {
  addAuthorRules, addCategoryRules, handleValidation: handleRelationValidation,
} = require('../validators/bookRelations.validator');
const {
  createChapterRules, updateChapterRules, reorderChaptersRules, handleValidation: handleChapterValidation,
} = require('../validators/chapter.validator');

router.post('/', requireAuth, requireRole('ADMIN'), createBookRules, handleValidation, bookController.create);
router.get('/', requireAuth, bookController.getAll);
router.get('/manage', requireAuth, requireRole('ADMIN'), bookController.getManageList);
router.get('/:id', requireAuth, idParamRule, handleValidation, bookController.getById);
router.get('/:id/document', requireAuth, idParamRule, handleValidation, bookController.getDocument);
router.get('/:id/file', requireAuth, idParamRule, handleValidation, bookController.openFile);
router.get('/:id/cover', requireAuth, idParamRule, handleValidation, bookController.getCover);
router.post('/:id/cover', requireAuth, requireRole('ADMIN'), idParamRule, handleValidation, uploadLimiter, handleBookCoverUpload, bookController.uploadCover);
router.get('/:id/images/:imageName', requireAuth, idParamRule, imageNameParamRule, handleValidation, bookController.getImage);
router.get('/:id/toc', requireAuth, idParamRule, handleValidation, bookController.getToc);
router.get('/:id/chapters/:chapterIndex', requireAuth, idParamRule, chapterIndexParamRule, handleValidation, bookController.getChapterPage);
router.put('/:id', requireAuth, requireRole('ADMIN'), idParamRule, updateBookRules, handleValidation, bookController.update);
router.patch('/:id/publish', requireAuth, requireRole('ADMIN'), idParamRule, handleValidation, bookController.publish);
router.patch('/:id/archive', requireAuth, requireRole('ADMIN'), idParamRule, handleValidation, bookController.archive);
// Module 27 SEC-03: upload endpoints are rate-limited to prevent automated bulk uploads
router.post('/:id/pdf', requireAuth, requireRole('ADMIN'), idParamRule, handleValidation, uploadLimiter, handlePublicPdfUpload, bookController.importPdf);

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
