const fs = require('fs/promises');

// Module 13.1 — server-side PDF content validation.
// Multer checks extension + MIME; this checks the actual file bytes.

async function validatePdfFile(filePath) {
    const handle = await fs.open(filePath, 'r');
    try {
        const stat = await handle.stat();
        if (!stat || stat.size === 0) {
            const err = new Error('Uploaded file is empty.');
            err.status = 400;
            throw err;
        }

        const buffer = Buffer.alloc(5);
        await handle.read(buffer, 0, 5, 0);

        if (buffer.toString('ascii') !== '%PDF-') {
            const err = new Error('Uploaded file is not a valid PDF.');
            err.status = 400;
            throw err;
        }
    } finally {
        await handle.close();
    }
}

module.exports = { validatePdfFile };
