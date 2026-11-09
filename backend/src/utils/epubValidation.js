const fs = require('fs/promises');

// Module 20 - EPUB container validation.
// EPUB is a ZIP-based publication format. This module validates the
// container structure without extracting or processing the publication
// content. Full EPUB processing is deferred to Module 21.

const ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50;
const ZIP_END_OF_CENTRAL_DIR_SIGNATURE = 0x06054b50;
const MAX_ZIP_ENTRIES = 1000;
const MAX_UNCOMPRESSED_SIZE = 100 * 1024 * 1024;
const EXPECTED_MIMETYPE = 'application/epub+zip';

async function validateEpubFile(filePath) {
    const handle = await fs.open(filePath, 'r');
    try {
        const stat = await handle.stat();
        if (!stat || stat.size === 0) {
            const err = new Error('Uploaded file is empty.');
            err.status = 400;
            throw err;
        }

        const sigBuffer = Buffer.alloc(4);
        await handle.read(sigBuffer, 0, 4, 0);

        const signature = sigBuffer.readUInt32LE(0);
        if (signature !== ZIP_LOCAL_FILE_HEADER_SIGNATURE) {
            const err = new Error('Uploaded file is not a valid EPUB container.');
            err.status = 400;
            throw err;
        }

        const headerBuffer = Buffer.alloc(30);
        await handle.read(headerBuffer, 0, 30, 0);

        const compressionMethod = headerBuffer.readUInt16LE(8);
        const fileNameLength = headerBuffer.readUInt16LE(26);
        const extraFieldLength = headerBuffer.readUInt16LE(28);
        const uncompressedSize = headerBuffer.readUInt32LE(22);

        if (compressionMethod !== 0) {
            const err = new Error('EPUB mimetype entry must be stored (uncompressed).');
            err.status = 400;
            throw err;
        }

        if (uncompressedSize > MAX_UNCOMPRESSED_SIZE) {
            const err = new Error('EPUB file exceeds maximum allowed size.');
            err.status = 400;
            throw err;
        }

        const nameBuffer = Buffer.alloc(fileNameLength);
        await handle.read(nameBuffer, 0, fileNameLength, 30);
        const fileName = nameBuffer.toString('utf-8');

        if (fileName !== 'mimetype') {
            const err = new Error('EPUB container is invalid: first entry must be "mimetype".');
            err.status = 400;
            throw err;
        }

        const dataOffset = 30 + fileNameLength + extraFieldLength;
        const mimetypeBuffer = Buffer.alloc(uncompressedSize);
        await handle.read(mimetypeBuffer, 0, uncompressedSize, dataOffset);
        const mimetype = mimetypeBuffer.toString('ascii');

        if (mimetype !== EXPECTED_MIMETYPE) {
            const err = new Error('Invalid EPUB mimetype. Expected "' + EXPECTED_MIMETYPE + '", got "' + mimetype + '".');
            err.status = 400;
            throw err;
        }

        const tailSize = Math.min(stat.size, 65557);
        const tailBuffer = Buffer.alloc(tailSize);
        await handle.read(tailBuffer, 0, tailSize, stat.size - tailSize);

        let eocdFound = false;
        for (let i = tailBuffer.length - 22; i >= 0; i--) {
            if (tailBuffer.readUInt32LE(i) === ZIP_END_OF_CENTRAL_DIR_SIGNATURE) {
                eocdFound = true;
                const totalEntries = tailBuffer.readUInt16LE(i + 10);
                if (totalEntries > MAX_ZIP_ENTRIES) {
                    const err = new Error('EPUB archive exceeds maximum entry count.');
                    err.status = 400;
                    throw err;
                }
                break;
            }
        }

        if (!eocdFound) {
            const err = new Error('EPUB archive is missing end-of-central-directory record.');
            err.status = 400;
            throw err;
        }

    } finally {
        await handle.close();
    }
}

module.exports = { validateEpubFile };
