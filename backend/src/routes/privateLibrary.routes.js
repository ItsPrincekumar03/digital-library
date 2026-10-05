const express = require('express');
const router = express.Router();

const privateLibraryController = require('../controllers/privateLibrary.controller');
const requireAuth = require('../middleware/auth.middleware');
const { handlePrivatePdfUpload } = require('../middleware/upload.middleware');
const {
    idParamRule,
    uploadRules,
    handleValidation
} = require('../validators/privateLibrary.validator');

router.get('/', requireAuth, privateLibraryController.list);

router.post(
    '/upload',
    requireAuth,
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
