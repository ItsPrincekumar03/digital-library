const fs = require('fs/promises');

// Module 13.1 / 27.5 — server-side PDF content signature validation.
// Verifies actual %PDF-1.x / %PDF-2.x header and %%EOF trailer bytes rather
// than trusting filenames or client-supplied MIME types.

async function validatePdfFile(filePath) {
    const handle = await fs.open(filePath, 'r');
    try {
        const stat = await handle.stat();
        if (!stat || stat.size === 0) {
            const err = new Error('Uploaded file is empty.');
            err.status = 400;
            throw err;
        }

        const headerLen = Math.min(stat.size, 8);
        const header = Buffer.alloc(headerLen);
        await handle.read(header, 0, headerLen, 0);
        const headerStr = header.toString('ascii');

        if (!/^%PDF-[12]\.\d/.test(headerStr)) {
            const err = new Error('Uploaded file is not a valid PDF.');
            err.status = 400;
            throw err;
        }

        const tailLen = Math.min(stat.size, 4096);
        const tail = Buffer.alloc(tailLen);
        await handle.read(tail, 0, tailLen, stat.size - tailLen);
        if (!tail.toString('latin1').includes('%%EOF')) {
            const err = new Error('Uploaded file is not a valid PDF.');
            err.status = 400;
            throw err;
        }
    } finally {
        await handle.close();
    }
}

module.exports = { validatePdfFile };
