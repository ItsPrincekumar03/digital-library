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

const publicUploadDirectory = path.resolve(
    __dirname,
    '..',
    '..',
    '..',
    'uploads',
    'public'
);

function getPrivateUploadDirectory() {
    return privateUploadDirectory;
}

function getPublicUploadDirectory() {
    return publicUploadDirectory;
}

async function ensurePrivateUploadDirectory() {
    await fs.mkdir(privateUploadDirectory, { recursive: true });
}

async function ensurePublicUploadDirectory() {
    await fs.mkdir(publicUploadDirectory, { recursive: true });
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

function resolvePublicPdfPath(storedFileName) {
    const safeFileName = path.basename(String(storedFileName || ''));
    const resolvedPath = path.resolve(publicUploadDirectory, safeFileName);

    if (!resolvedPath.startsWith(publicUploadDirectory + path.sep)) {
        const err = new Error('Invalid public file path.');
        err.status = 400;
        throw err;
    }

    return resolvedPath;
}

// Module 13.2 — processed-text files live next to the public PDFs and share
// the same directory guard. The name is derived from the stored PDF name:
// '<uuid>.pdf' -> '<uuid>.processed.json'.
function buildPublicProcessedName(storedPdfName) {
    const base = path.basename(String(storedPdfName || ''), '.pdf');
    return `${base}.processed.json`;
}

function resolvePublicProcessedPath(processedFileName) {
    const safeFileName = path.basename(String(processedFileName || ''));
    const resolvedPath = path.resolve(publicUploadDirectory, safeFileName);

    if (!resolvedPath.startsWith(publicUploadDirectory + path.sep)) {
        const err = new Error('Invalid processed file path.');
        err.status = 400;
        throw err;
    }

    return resolvedPath;
}

// Module 13.3 — extracted image files live in a per-document directory next
// to the public PDFs: '<uuid>.images/'. The directory shares the public
// directory guard, and every resolver below rejects anything that would
// escape the approved storage directory (path traversal safe).
function buildPublicImagesDirName(storedPdfName) {
    const base = path.basename(String(storedPdfName || ''), '.pdf');
    return `${base}.images`;
}

function resolvePublicImagesDir(dirName) {
    const safeDirName = path.basename(String(dirName || ''));
    const resolvedPath = path.resolve(publicUploadDirectory, safeDirName);

    if (!resolvedPath.startsWith(publicUploadDirectory + path.sep)) {
        const err = new Error('Invalid images directory path.');
        err.status = 400;
        throw err;
    }

    return resolvedPath;
}

function resolvePublicImagePath(dirName, fileName) {
    const safeDirName = path.basename(String(dirName || ''));
    const safeFileName = path.basename(String(fileName || ''));
    const resolvedDir = path.resolve(publicUploadDirectory, safeDirName);
    const resolvedPath = path.resolve(resolvedDir, safeFileName);

    if (!resolvedPath.startsWith(resolvedDir + path.sep)) {
        const err = new Error('Invalid image file path.');
        err.status = 400;
        throw err;
    }

    return resolvedPath;
}

async function ensurePublicImagesDir(dirName) {
    await fs.mkdir(resolvePublicImagesDir(dirName), { recursive: true });
}

async function deleteDirectoryIfExists(dirPath) {
    try {
        await fs.rm(String(dirPath), { recursive: true, force: true });
    } catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
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
    getPublicUploadDirectory,
    ensurePrivateUploadDirectory,
    ensurePublicUploadDirectory,
    resolvePrivatePdfPath,
    resolvePublicPdfPath,
    buildPublicProcessedName,
    resolvePublicProcessedPath,
    buildPublicImagesDirName,
    resolvePublicImagesDir,
    resolvePublicImagePath,
    ensurePublicImagesDir,
    deleteDirectoryIfExists,
    fileExists,
    deleteFileIfExists
};
