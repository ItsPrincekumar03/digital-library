const path = require('path');

// Module 27.5 — PDF-only upload format validation.
// New uploads accept PDF files only; existing EPUB records remain readable.

const SUPPORTED_FORMATS = new Set(['PDF']);

const FORMAT_CONFIG = {
    PDF: {
        extensions: ['.pdf'],
        mimeTypes: new Set(['application/pdf', 'application/x-pdf']),
        label: 'PDF'
    }
};

function validateFormat(format) {
    if (!format || typeof format !== 'string') {
        return { valid: false, error: 'Format field is required. Only PDF uploads are supported.' };
    }
    const normalized = format.toUpperCase().trim();
    if (!SUPPORTED_FORMATS.has(normalized)) {
        return { valid: false, error: 'Only PDF uploads are supported. Format must be "PDF".' };
    }
    return { valid: true, format: normalized };
}

function validateExtension(format, originalname) {
    const normalized = typeof format === 'string' ? format.toUpperCase().trim() : '';
    const config = FORMAT_CONFIG[normalized];
    if (!config) {
        return { valid: false, error: 'Only PDF uploads are supported.' };
    }
    const ext = path.extname(originalname || '').toLowerCase();
    if (!config.extensions.includes(ext)) {
        return { valid: false, error: 'Only PDF files (.pdf) are allowed.' };
    }
    return { valid: true };
}

function validateMimeType(format, mimetype) {
    const normalized = typeof format === 'string' ? format.toUpperCase().trim() : '';
    const config = FORMAT_CONFIG[normalized];
    if (!config) {
        return { valid: false, error: 'Only PDF uploads are supported.' };
    }
    const normalizedMime = String(mimetype || '').toLowerCase().trim();
    if (!config.mimeTypes.has(normalizedMime)) {
        return { valid: false, error: 'Unsupported MIME type "' + mimetype + '". Only PDF files (application/pdf) are allowed.' };
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
