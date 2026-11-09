const crypto = require('crypto');
const path = require('path');
const multer = require('multer');
const {
    ensurePrivateUploadDirectory,
    getPrivateUploadDirectory,
    ensurePublicUploadDirectory,
    getPublicUploadDirectory
} = require('../utils/fileStorage');

const PDF_MIME_TYPES = new Set([
    'application/pdf',
    'application/x-pdf'
]);

const EPUB_MIME_TYPES = new Set([
    'application/epub+zip'
]);

const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024;

function getPrivatePdfMaxSize() {
    const configuredSize = Number.parseInt(
        process.env.PRIVATE_LIBRARY_MAX_FILE_SIZE_BYTES || '',
        10
    );

    if (Number.isSafeInteger(configuredSize) && configuredSize > 0) {
        return configuredSize;
    }

    return DEFAULT_MAX_FILE_SIZE;
}

function getPublicPdfMaxSize() {
    const configuredSize = Number.parseInt(
        process.env.PUBLIC_LIBRARY_MAX_FILE_SIZE_BYTES ||
        process.env.PRIVATE_LIBRARY_MAX_FILE_SIZE_BYTES || '',
        10
    );

    if (Number.isSafeInteger(configuredSize) && configuredSize > 0) {
        return configuredSize;
    }

    return DEFAULT_MAX_FILE_SIZE;
}

function isAllowedFile(file) {
    const extension = path.extname(file.originalname || '').toLowerCase();

    if (extension === '.pdf' && PDF_MIME_TYPES.has(file.mimetype)) {
        return true;
    }

    if (extension === '.epub' && EPUB_MIME_TYPES.has(file.mimetype)) {
        return true;
    }

    return false;
}

function handleUploadError(error, res, maxSize) {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size must be ' + maxSize + ' bytes or less.'
            });
        }
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }
    return res.status(400).json({
        success: false,
        message: error.message || 'Upload failed.'
    });
}

function handlePrivatePdfUpload(req, res, next) {
    const maxSize = getPrivatePdfMaxSize();

    const storage = multer.diskStorage({
        async destination(req, file, callback) {
            try {
                await ensurePrivateUploadDirectory();
                callback(null, getPrivateUploadDirectory());
            } catch (error) {
                callback(error);
            }
        },

        filename(req, file, callback) {
            const ext = path.extname(file.originalname || '').toLowerCase();
            const safeExt = (ext === '.pdf' || ext === '.epub') ? ext : '.bin';
            const storedFileName = crypto.randomUUID() + safeExt;
            callback(null, storedFileName);
        }
    });

    const upload = multer({
        storage: storage,
        limits: { fileSize: maxSize },
        fileFilter(req, file, callback) {
            const extension = path.extname(file.originalname || '').toLowerCase();
            const isPdf = extension === '.pdf' && PDF_MIME_TYPES.has(file.mimetype);
            const isEpub = extension === '.epub' && EPUB_MIME_TYPES.has(file.mimetype);

            if (!isPdf && !isEpub) {
                return callback(new Error('Only PDF or EPUB files are allowed.'));
            }

            callback(null, true);
        }
    });

    // Use fields() to accept both 'file' and 'pdf' field names in a single pass
    const uploadFields = upload.fields([
        { name: 'file', maxCount: 1 },
        { name: 'pdf', maxCount: 1 }
    ]);

    uploadFields(req, res, (error) => {
        if (error) {
            return handleUploadError(error, res, maxSize);
        }

        // Normalize: use whichever field was provided
        if (req.files && req.files.file && req.files.file.length > 0) {
            req.file = req.files.file[0];
        } else if (req.files && req.files.pdf && req.files.pdf.length > 0) {
            req.file = req.files.pdf[0];
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'File is required.'
            });
        }

        next();
    });
}

function handlePublicPdfUpload(req, res, next) {
    const maxSize = getPublicPdfMaxSize();

    const storage = multer.diskStorage({
        async destination(req, file, callback) {
            try {
                await ensurePublicUploadDirectory();
                callback(null, getPublicUploadDirectory());
            } catch (error) {
                callback(error);
            }
        },

        filename(req, file, callback) {
            const ext = path.extname(file.originalname || '').toLowerCase();
            const safeExt = (ext === '.pdf' || ext === '.epub') ? ext : '.bin';
            const storedFileName = crypto.randomUUID() + safeExt;
            callback(null, storedFileName);
        }
    });

    const upload = multer({
        storage: storage,
        limits: { fileSize: maxSize },
        fileFilter(req, file, callback) {
            const extension = path.extname(file.originalname || '').toLowerCase();
            const isPdf = extension === '.pdf' && PDF_MIME_TYPES.has(file.mimetype);
            const isEpub = extension === '.epub' && EPUB_MIME_TYPES.has(file.mimetype);

            if (!isPdf && !isEpub) {
                return callback(new Error('Only PDF or EPUB files are allowed.'));
            }

            callback(null, true);
        }
    });

    // Use fields() to accept both 'file' and 'pdf' field names in a single pass
    const uploadFields = upload.fields([
        { name: 'file', maxCount: 1 },
        { name: 'pdf', maxCount: 1 }
    ]);

    uploadFields(req, res, (error) => {
        if (error) {
            return handleUploadError(error, res, maxSize);
        }

        // Normalize: use whichever field was provided
        if (req.files && req.files.file && req.files.file.length > 0) {
            req.file = req.files.file[0];
        } else if (req.files && req.files.pdf && req.files.pdf.length > 0) {
            req.file = req.files.pdf[0];
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'File is required.'
            });
        }

        next();
    });
}

module.exports = {
    handlePrivatePdfUpload,
    handlePublicPdfUpload,
    getPrivatePdfMaxSize,
    getPublicPdfMaxSize
};
