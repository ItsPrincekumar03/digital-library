const express = require('express');
const router = express.Router();

const privateLibraryController = require('../controllers/privateLibrary.controller');
const requireAuth = require('../middleware/auth.middleware');
const { handlePrivatePdfUpload } = require('../middleware/upload.middleware');
const { uploadLimiter } = require('../middleware/rateLimiter');
const { imageNameParamRule } = require('../validators/book.validator');
const {
    idParamRule,
    bookIdParamRule,
    uploadRules,
    handleValidation
} = require('../validators/privateLibrary.validator');

router.get('/', requireAuth, privateLibraryController.list);

router.get('/saved', requireAuth, privateLibraryController.listSaved);

router.post(
    '/saved/:bookId',
    requireAuth,
    bookIdParamRule,
    handleValidation,
    privateLibraryController.saveBook
);

router.delete(
    '/saved/:bookId',
    requireAuth,
    bookIdParamRule,
    handleValidation,
    privateLibraryController.removeSaved
);

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
    '/:id/cover',
    requireAuth,
    idParamRule,
    handleValidation,
    privateLibraryController.getCover
);

router.get(
    '/:id/images/:imageName',
    requireAuth,
    idParamRule,
    imageNameParamRule,
    handleValidation,
    privateLibraryController.getImage
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
