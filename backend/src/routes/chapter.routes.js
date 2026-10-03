const express = require('express');
const router = express.Router();

const chapterController = require('../controllers/chapter.controller');
const requireAuth = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
  updateChapterRules, chapterIdParamRule, handleValidation,
} = require('../validators/chapter.validator');

router.get('/:id', requireAuth, chapterIdParamRule, handleValidation, chapterController.getById);
router.put('/:id', requireAuth, requireRole('ADMIN'), chapterIdParamRule, updateChapterRules, handleValidation, chapterController.update);
router.patch('/:id/publish', requireAuth, requireRole('ADMIN'), chapterIdParamRule, handleValidation, chapterController.publish);
router.patch('/:id/archive', requireAuth, requireRole('ADMIN'), chapterIdParamRule, handleValidation, chapterController.archive);

module.exports = router;