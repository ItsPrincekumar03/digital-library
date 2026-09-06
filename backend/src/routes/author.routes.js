const express = require('express');
const router = express.Router();

const authorController = require('../controllers/author.controller');
const requireAuth = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const {
    createAuthorRules, updateAuthorRules, idParamRule, handleValidation,
} = require('../validators/author.validator');

router.post('/', requireAuth, requireRole('ADMIN'), createAuthorRules, handleValidation, authorController.create);
router.get('/', requireAuth, authorController.getAll);
router.get('/:id', requireAuth, idParamRule, handleValidation, authorController.getById);
router.put('/:id', requireAuth, requireRole('ADMIN'), idParamRule, updateAuthorRules, handleValidation, authorController.update);
router.patch('/:id/archive', requireAuth, requireRole('ADMIN'), idParamRule, handleValidation, authorController.archive);

module.exports = router;