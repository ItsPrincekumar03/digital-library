const { body, validationResult } = require('express-validator');

const registerRules = [
    body('fullName')
        .trim()
        .notEmpty().withMessage('Full name is required')
        .isLength({ min: 2, max: 150 }).withMessage('Full name must be 2-150 characters'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('A valid email is required')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

const loginRules = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('A valid email is required')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Password is required'),
];

// Runs after the rule chains above; sends a clean 400 if anything failed.
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

module.exports = { registerRules, loginRules, handleValidation };