const fs = require('fs/promises');
const path = require('path');

const UPLOADS_DIR = path.resolve(__dirname, '..', '..', '..', 'uploads');

const PUBLIC_UPLOADS = path.join(UPLOADS_DIR, 'public');
const PRIVATE_UPLOADS = path.join(UPLOADS_DIR, 'private');

const PUBLIC_PROCESSED = path.join(PUBLIC_UPLOADS, 'processed');
const PUBLIC_IMAGES = path.join(PUBLIC_UPLOADS, 'images');

const PRIVATE_PROCESSED = path.join(PRIVATE_UPLOADS, 'processed');
const PRIVATE_IMAGES = path.join(PRIVATE_UPLOADS, 'images');

async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}

async function ensurePrivateUploadDirectory() {
    await ensureDir(PRIVATE_UPLOADS);
    await ensureDir(PRIVATE_PROCESSED);
    await ensureDir(PRIVATE_IMAGES);
}

async function ensurePublicUploadDirectory() {
    await ensureDir(PUBLIC_UPLOADS);
    await ensureDir(PUBLIC_PROCESSED);
    await ensureDir(PUBLIC_IMAGES);
}

function getPrivateUploadDirectory() { return PRIVATE_UPLOADS; }
function getPublicUploadDirectory() { return PUBLIC_UPLOADS; }
function getPublicProcessedDirectory() { return PUBLIC_PROCESSED; }
function getPublicImagesDirectory() { return PUBLIC_IMAGES; }
function getPrivateProcessedDirectory() { return PRIVATE_PROCESSED; }
function getPrivateImagesDirectory() { return PRIVATE_IMAGES; }

function resolvePrivatePdfPath(storedFileName) {
    const safeFileName = path.basename(String(storedFileName || ''));
    const resolvedPath = path.resolve(PRIVATE_UPLOADS, safeFileName);
    if (!resolvedPath.startsWith(PRIVATE_UPLOADS + path.sep)) {
        const err = new Error('Invalid private file path.');
        err.status = 400;
        throw err;
    }
    return resolvedPath;
}

function resolvePublicPdfPath(storedFileName) {
    const safeFileName = path.basename(String(storedFileName || ''));
    const resolvedPath = path.resolve(PUBLIC_UPLOADS, safeFileName);
    if (!resolvedPath.startsWith(PUBLIC_UPLOADS + path.sep)) {
        const err = new Error('Invalid public file path.');
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
    ensurePrivateUploadDirectory,
    getPrivateUploadDirectory,
    ensurePublicUploadDirectory,
    getPublicUploadDirectory,
    getPublicProcessedDirectory,
    getPublicImagesDirectory,
    getPrivateProcessedDirectory,
    getPrivateImagesDirectory,
    resolvePrivatePdfPath,
    resolvePublicPdfPath,
    fileExists,
    deleteFileIfExists
};
