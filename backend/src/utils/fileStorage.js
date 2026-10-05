const fs = require('fs/promises');
const path = require('path');

const privateUploadDirectory = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'uploads',
    'private'
);

function getPrivateUploadDirectory() {
    return privateUploadDirectory;
}

async function ensurePrivateUploadDirectory() {
    await fs.mkdir(privateUploadDirectory, { recursive: true });
}

function resolvePrivatePdfPath(storedFileName) {
    const safeFileName = path.basename(String(storedFileName || ''));
    const resolvedPath = path.resolve(privateUploadDirectory, safeFileName);

    if (!resolvedPath.startsWith(privateUploadDirectory + path.sep)) {
        const err = new Error('Invalid private file path.');
        err.status = 400;
        throw err;
    }

    return resolvedPath;
}

async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}

async function deleteFileIfExists(filePath) {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
}

module.exports = {
    getPrivateUploadDirectory,
    ensurePrivateUploadDirectory,
    resolvePrivatePdfPath,
    fileExists,
    deleteFileIfExists
};
