const { body, param, validationResult } = require('express-validator');

const createAuthorRules = [
  body('name').trim().notEmpty().withMessage('Author name is required')
    .isLength({ max: 150 }).withMessage('Author name too long'),
  body('bio').optional({ nullable: true }).isString().isLength({ max: 2000 }).withMessage('Bio too long'),
];

const updateAuthorRules = createAuthorRules;

const idParamRule = [
  param('id').isInt({ min: 1 }).withMessage('Invalid author ID'),
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

module.exports = { createAuthorRules, updateAuthorRules, idParamRule, handleValidation };