const { body, param, validationResult } = require('express-validator');
const { deleteFileIfExists } = require('../utils/fileStorage');

const idParamRule = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid private PDF ID')
];

const bookIdParamRule = [
    param('bookId')
        .isInt({ min: 1 })
        .withMessage('Invalid public book ID')
];

const uploadRules = [
    body('title')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 255 })
        .withMessage('Title must be 255 characters or less'),

    body('description')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must be 1000 characters or less'),

    body('format')
        .optional({ nullable: true })
        .trim()
        .toUpperCase()
        .isIn(['PDF'])
        .withMessage('Only PDF uploads are supported. Format must be "PDF".')
];

function handleValidation(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        if (req.file && req.file.path) {
            deleteFileIfExists(req.file.path).catch(() => {});
        }
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map((e) => ({
                field: e.path,
                message: e.msg
            }))
        });
    }

    next();
}

module.exports = {
    idParamRule,
    bookIdParamRule,
    uploadRules,
    handleValidation
};
