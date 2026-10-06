const express = require('express');
const router = express.Router();
const privateLibraryController = require('../controllers/privateLibrary.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { handlePrivatePdfUpload } = require('../middleware/upload.middleware');

router.use(requireAuth);

router.get('/', privateLibraryController.listFiles);
router.post('/upload', handlePrivatePdfUpload, privateLibraryController.uploadFile);
router.get('/images/:imageName', privateLibraryController.getExtractedImage);

router.get('/:id', privateLibraryController.getFile);
router.delete('/:id', privateLibraryController.deleteFile);
router.get('/:id/file', privateLibraryController.streamFile);
router.get('/:id/document', privateLibraryController.getDocument);

module.exports = router;
