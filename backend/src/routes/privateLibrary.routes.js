const express = require('express');
const router = express.Router();

const privateLibraryController = require('../controllers/privateLibrary.controller');
const requireAuth = require('../middleware/auth.middleware');
const { handlePrivatePdfUpload } = require('../middleware/upload.middleware');
const { uploadLimiter } = require('../middleware/rateLimiter');
const {
    idParamRule,
    uploadRules,
    handleValidation
} = require('../validators/privateLibrary.validator');

router.get('/', requireAuth, privateLibraryController.list);

router.post(
    '/upload',
    requireAuth,
    uploadLimiter,            // Module 27 SEC-03: rate-limit upload endpoint
    handlePrivatePdfUpload,
    uploadRules,
    handleValidation,
    privateLibraryController.upload
);

router.get(
    '/:id',
    requireAuth,
    idParamRule,
    handleValidation,
    privateLibraryController.getById
);

router.get(
    '/:id/document',
    requireAuth,
    idParamRule,
    handleValidation,
    privateLibraryController.getDocument
);

router.get(
    '/:id/file',
    requireAuth,
    idParamRule,
    handleValidation,
    privateLibraryController.openFile
);

router.delete(
    '/:id',
    requireAuth,
    idParamRule,
    handleValidation,
    privateLibraryController.remove
);

module.exports = router;
