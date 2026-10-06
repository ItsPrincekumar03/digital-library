const express = require('express');
const router = express.Router();
const bookController = require('../controllers/book.controller');
const getExtractedImage = require('../controllers/bookImage.controller');
const requireAuth = require('../middleware/auth.middleware');
const { handlePublicPdfUpload } = require('../middleware/upload.middleware');

router.get('/images/:imageName', getExtractedImage);
router.get('/', bookController.getAll);
router.post('/', requireAuth, bookController.create);
router.post('/import-pdf', requireAuth, handlePublicPdfUpload, bookController.importPdf);

router.get('/:id', bookController.getById);
router.put('/:id', requireAuth, bookController.update);
router.get('/:id/pdf', bookController.readPdf);
router.get('/:id/document', bookController.getProcessedDocument);

router.put('/:id/publish', requireAuth, bookController.publish);
router.put('/:id/archive', requireAuth, bookController.archive);

module.exports = router;
