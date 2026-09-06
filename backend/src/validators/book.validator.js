const { body, param, validationResult } = require('express-validator');
const { VALID_STATUSES } = require('../repositories/book.repository');

const createBookRules = [
    body('title').trim().notEmpty().withMessage('Title is required')
        .isLength({ max: 255 }).withMessage('Title too long'),
    body('description').optional({ nullable: true }).isString(),
    body('coverPath').optional({ nullable: true }).isString(),
    body('publicationDate').optional({ nullable: true }).isISO8601().withMessage('Invalid publication date'),
];

const updateBookRules = [
    body('title').trim().notEmpty().withMessage('Title is required')
        .isLength({ max: 255 }).withMessage('Title too long'),
    body('description').optional({ nullable: true }).isString(),
    body('coverPath').optional({ nullable: true }).isString(),
    body('publicationDate').optional({ nullable: true }).isISO8601().withMessage('Invalid publication date'),
    body('status').optional().isIn(VALID_STATUSES).withMessage('Invalid book status'),
];

const idParamRule = [param('id').isInt({ min: 1 }).withMessage('Invalid book ID')];
const bookIdParamRule = [param('bookId').isInt({ min: 1 }).withMessage('Invalid book ID')];

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

module.exports = { createBookRules, updateBookRules, idParamRule, bookIdParamRule, handleValidation };