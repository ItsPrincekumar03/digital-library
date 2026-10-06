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

function isPdfFile(file) {
    const extension = path.extname(file.originalname || '').toLowerCase();

    return extension === '.pdf' && PDF_MIME_TYPES.has(file.mimetype);
}

const privatePdfStorage = multer.diskStorage({
    async destination(req, file, callback) {
        try {
            await ensurePrivateUploadDirectory();
            callback(null, getPrivateUploadDirectory());
        } catch (error) {
            callback(error);
        }
    },

    filename(req, file, callback) {
        const storedFileName = `${crypto.randomUUID()}.pdf`;
        callback(null, storedFileName);
    }
});

const privatePdfUpload = multer({
    storage: privatePdfStorage,
    limits: {
        fileSize: getPrivatePdfMaxSize()
    },
    fileFilter(req, file, callback) {
        if (!isPdfFile(file)) {
            return callback(new Error('Only PDF files are allowed.'));
        }

        callback(null, true);
    }
});

const publicPdfStorage = multer.diskStorage({
    async destination(req, file, callback) {
        try {
            await ensurePublicUploadDirectory();
            callback(null, getPublicUploadDirectory());
        } catch (error) {
            callback(error);
        }
    },
    filename(req, file, callback) {
        const storedFileName = `${crypto.randomUUID()}.pdf`;
        callback(null, storedFileName);
    }
});

const publicPdfUpload = multer({
    storage: publicPdfStorage,
    limits: {
        fileSize: getPrivatePdfMaxSize() // Same limit for public PDFs per instruction
    },
    fileFilter(req, file, callback) {
        if (!isPdfFile(file)) {
            return callback(new Error('Only PDF files are allowed.'));
        }
        callback(null, true);
    }
});

function handlePrivatePdfUpload(req, res, next) {
    const uploadSinglePdf = privatePdfUpload.single('pdf');

    uploadSinglePdf(req, res, (error) => {
        if (!error) {
            return next();
        }

        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: `PDF file size must be ${getPrivatePdfMaxSize()} bytes or less.`
                });
            }

            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(400).json({
            success: false,
            message: error.message || 'PDF upload failed.'
        });
    });
}

function handlePublicPdfUpload(req, res, next) {
    const uploadSinglePdf = publicPdfUpload.single('pdf');

    uploadSinglePdf(req, res, (error) => {
        if (!error) {
            return next();
        }

        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: `PDF file size must be ${getPrivatePdfMaxSize()} bytes or less.`
                });
            }
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
        return res.status(400).json({
            success: false,
            message: error.message || 'PDF upload failed.'
        });
    });
}

module.exports = {
    handlePrivatePdfUpload,
    handlePublicPdfUpload,
    getPrivatePdfMaxSize
};
