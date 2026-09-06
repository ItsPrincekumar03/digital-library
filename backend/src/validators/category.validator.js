const { body, param, validationResult } = require('express-validator');

const createCategoryRules = [
    body('name').trim().notEmpty().withMessage('Category name is required')
        .isLength({ max: 100 }).withMessage('Category name too long'),
    body('description').optional({ nullable: true }).isString(),
];

const updateCategoryRules = createCategoryRules;

const idParamRule = [
    param('id').isInt({ min: 1 }).withMessage('Invalid category ID'),
];

function handleValidation(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
        });
    }
    next();
}

module.exports = { createCategoryRules, updateCategoryRules, idParamRule, handleValidation };