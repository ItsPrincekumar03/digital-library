const express = require('express');
const router = express.Router();

const chapterController = require('../controllers/chapter.controller');
const requireAuth = require('../middleware/auth.middleware');
const {
  updateChapterRules, chapterIdParamRule, handleValidation,
} = require('../validators/chapter.validator');

router.get('/:id', requireAuth, chapterIdParamRule, handleValidation, chapterController.getById);
router.put('/:id', requireAuth, chapterIdParamRule, updateChapterRules, handleValidation, chapterController.update);
router.patch('/:id/publish', requireAuth, chapterIdParamRule, handleValidation, chapterController.publish);
router.patch('/:id/archive', requireAuth, chapterIdParamRule, handleValidation, chapterController.archive);

module.exports = router;