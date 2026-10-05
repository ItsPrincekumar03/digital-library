const { body, param, validationResult } = require('express-validator');

const idParamRule = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Invalid private PDF ID')
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
        .withMessage('Description must be 1000 characters or less')
];

function handleValidation(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
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
    uploadRules,
    handleValidation
};
