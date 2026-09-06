const { body, param, validationResult } = require('express-validator');

const createChapterRules = [
    body('chapterNumber').isInt({ min: 1 }).withMessage('chapterNumber must be a positive integer'),
    body('title').trim().notEmpty().withMessage('Title is required')
        .isLength({ max: 255 }).withMessage('Title too long'),
    body('content').optional({ nullable: true }).isString(),
];

const updateChapterRules = [
    body('chapterNumber').isInt({ min: 1 }).withMessage('chapterNumber must be a positive integer'),
    body('title').trim().notEmpty().withMessage('Title is required')
        .isLength({ max: 255 }).withMessage('Title too long'),
    body('content').optional({ nullable: true }).isString(),
];

const reorderChaptersRules = [
    body('order').isArray({ min: 1 }).withMessage('order must be a non-empty array'),
    body('order.*.chapterId').isInt({ min: 1 }).withMessage('Each item needs a valid chapterId'),
    body('order.*.chapterNumber').isInt({ min: 1 }).withMessage('Each item needs a valid chapterNumber'),
];

const chapterIdParamRule = [param('id').isInt({ min: 1 }).withMessage('Invalid chapter ID')];

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

module.exports = {
    createChapterRules, updateChapterRules, reorderChaptersRules, chapterIdParamRule, handleValidation,
};