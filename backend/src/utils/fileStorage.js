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

function resolveInsideDir(baseDir, fileName, errorMessage) {
    const safeFileName = path.basename(String(fileName || ''));
    const resolvedPath = path.resolve(baseDir, safeFileName);

    if (!resolvedPath.startsWith(baseDir + path.sep)) {
        const err = new Error(errorMessage);
        err.status = 400;
        throw err;
    }

    return resolvedPath;
}

function resolvePrivatePdfPath(storedFileName) {
    return resolveInsideDir(privateUploadDirectory, storedFileName, 'Invalid private file path.');
}

function resolvePublicPdfPath(storedFileName) {
    return resolveInsideDir(publicUploadDirectory, storedFileName, 'Invalid public file path.');
}

// Module 13.2 — processed-text files live next to the public PDFs and share
// the same directory guard. The name is derived from the stored PDF name:
// '<uuid>.pdf' -> '<uuid>.processed.json'.
function buildPublicProcessedName(storedPdfName) {
    const ext = path.extname(String(storedPdfName || ''));
    const base = path.basename(String(storedPdfName || ''), ext);
    return `${base}.processed.json`;
}

function resolvePublicProcessedPath(processedFileName) {
    return resolveInsideDir(publicUploadDirectory, processedFileName, 'Invalid processed file path.');
}

// Module 27.5 — private processed-text files share the same strict guard inside uploads/private.
function buildPrivateProcessedName(storedFileName) {
    const ext = path.extname(String(storedFileName || ''));
    const base = path.basename(String(storedFileName || ''), ext);
    return `${base}.processed.json`;
}

function resolvePrivateProcessedPath(processedFileName) {
    return resolveInsideDir(privateUploadDirectory, processedFileName, 'Invalid private processed file path.');
}

// Module 27.5 — cover files live next to the stored book file ('<uuid>.cover.<ext>').
function buildCoverFileName(storedFileName, ext = '.png') {
    const fileExt = path.extname(String(storedFileName || ''));
    const base = path.basename(String(storedFileName || ''), fileExt);
    const safeExt = String(ext || '.png').startsWith('.') ? ext : `.${ext}`;
    return `${base}.cover${safeExt}`;
}

function resolvePublicCoverPath(coverFileName) {
    return resolveInsideDir(publicUploadDirectory, coverFileName, 'Invalid public cover path.');
}

function resolvePrivateCoverPath(coverFileName) {
    return resolveInsideDir(privateUploadDirectory, coverFileName, 'Invalid private cover path.');
}

// Module 13.3 — extracted image files live in a per-document directory next
// to the public PDFs: '<uuid>.images/'. The directory shares the public
// directory guard, and every resolver below rejects anything that would
// escape the approved storage directory (path traversal safe).
function buildPublicImagesDirName(storedPdfName) {
    const ext = path.extname(String(storedPdfName || ''));
    const base = path.basename(String(storedPdfName || ''), ext);
    return `${base}.images`;
}

function resolvePublicImagesDir(dirName) {
    return resolveInsideDir(publicUploadDirectory, dirName, 'Invalid images directory path.');
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

function buildPrivateImagesDirName(storedFileName) {
    return buildPublicImagesDirName(storedFileName);
}

function resolvePrivateImagesDir(dirName) {
    return resolveInsideDir(privateUploadDirectory, dirName, 'Invalid private images directory path.');
}

function resolvePrivateImagePath(dirName, fileName) {
    const safeDirName = path.basename(String(dirName || ''));
    const safeFileName = path.basename(String(fileName || ''));
    const resolvedDir = path.resolve(privateUploadDirectory, safeDirName);
    const resolvedPath = path.resolve(resolvedDir, safeFileName);

    if (!resolvedPath.startsWith(resolvedDir + path.sep)) {
        const err = new Error('Invalid private image file path.');
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
    buildPrivateProcessedName,
    resolvePrivateProcessedPath,
    buildCoverFileName,
    resolvePublicCoverPath,
    resolvePrivateCoverPath,
    buildPublicImagesDirName,
    resolvePublicImagesDir,
    resolvePublicImagePath,
    buildPrivateImagesDirName,
    resolvePrivateImagesDir,
    resolvePrivateImagePath,
    ensurePublicImagesDir,
    deleteDirectoryIfExists,
    fileExists,
    deleteFileIfExists
};
