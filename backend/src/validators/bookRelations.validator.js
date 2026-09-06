const { body, validationResult } = require('express-validator');

const addAuthorRules = [
    body('authorId').isInt({ min: 1 }).withMessage('Valid authorId is required'),
];

const addCategoryRules = [
    body('categoryId').isInt({ min: 1 }).withMessage('Valid categoryId is required'),
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

module.exports = { addAuthorRules, addCategoryRules, handleValidation };