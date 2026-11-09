const path = require('path');

// Module 20 - Unified format validation for PDF and EPUB uploads.
// Validates that the requested format, file extension, MIME type,
// and file content all agree.

const SUPPORTED_FORMATS = new Set(['PDF', 'EPUB']);

const FORMAT_CONFIG = {
    PDF: {
        extensions: ['.pdf'],
        mimeTypes: new Set(['application/pdf', 'application/x-pdf']),
        label: 'PDF'
    },
    EPUB: {
        extensions: ['.epub'],
        mimeTypes: new Set(['application/epub+zip']),
        label: 'EPUB'
    }
};

function validateFormat(format) {
    if (!format || typeof format !== 'string') {
        return { valid: false, error: 'Format field is required. Must be "PDF" or "EPUB".' };
    }
    const normalized = format.toUpperCase().trim();
    if (!SUPPORTED_FORMATS.has(normalized)) {
        return { valid: false, error: 'Unsupported format. Must be "PDF" or "EPUB".' };
    }
    return { valid: true, format: normalized };
}

function validateExtension(format, originalname) {
    const ext = path.extname(originalname || '').toLowerCase();
    const config = FORMAT_CONFIG[format];
    if (!config.extensions.includes(ext)) {
        return { valid: false, error: 'File extension does not match format ' + format + '. Expected ' + config.extensions.join(' or ') + '.' };
    }
    return { valid: true };
}

function validateMimeType(format, mimetype) {
    const config = FORMAT_CONFIG[format];
    if (!config.mimeTypes.has(mimetype)) {
        return { valid: false, error: 'MIME type "' + mimetype + '" does not match format ' + format + '.' };
    }
    return { valid: true };
}

module.exports = {
    SUPPORTED_FORMATS,
    FORMAT_CONFIG,
    validateFormat,
    validateExtension,
    validateMimeType
};
