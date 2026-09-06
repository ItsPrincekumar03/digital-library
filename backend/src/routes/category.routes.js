const express = require('express');
const router = express.Router();

const categoryController = require('../controllers/category.controller');
const requireAuth = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
    createCategoryRules, updateCategoryRules, idParamRule, handleValidation,
} = require('../validators/category.validator');

router.post('/', requireAuth, requireRole('ADMIN'), createCategoryRules, handleValidation, categoryController.create);
router.get('/', requireAuth, categoryController.getAll);
router.get('/:id', requireAuth, idParamRule, handleValidation, categoryController.getById);
router.put('/:id', requireAuth, requireRole('ADMIN'), idParamRule, updateCategoryRules, handleValidation, categoryController.update);
router.patch('/:id/archive', requireAuth, requireRole('ADMIN'), idParamRule, handleValidation, categoryController.archive);

module.exports = router;