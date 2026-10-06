const path = require('path');
const fs = require('fs/promises');
const privateLibraryRepository = require('../repositories/privateLibrary.repository');
const {
    deleteFileIfExists,
    fileExists,
    resolvePrivatePdfPath,
    getPrivateUploadDirectory,
    getPrivateProcessedDirectory,
    getPrivateImagesDirectory
} = require('../utils/fileStorage');
const { extractPdf } = require('../utils/pdfExtractor');

function notFound() {
    const err = new Error('Private PDF not found.');
    err.status = 404;
    return err;
}

function badRequest(message) {
    const err = new Error(message);
    err.status = 400;
    return err;
}

function buildTitle(bodyTitle, originalFileName) {
    const title = typeof bodyTitle === 'string'
        ? bodyTitle.trim()
        : '';
    if (title) return title;
    return path.basename(originalFileName, path.extname(originalFileName)).slice(0, 255) || 'Untitled PDF';
}

function toPublicMetadata(file) {
    return {
        private_file_id: file.private_file_id,
        title: file.title,
        description: file.description,
        original_file_name: file.original_file_name,
        mime_type: file.mime_type,
        file_size: file.file_size,
        created_at: file.created_at,
        updated_at: file.updated_at
    };
}

async function uploadPrivatePdf(user, body, file) {
    if (!file) throw badRequest('PDF file is required.');

    const title = buildTitle(body.title, file.originalname);
    const description = typeof body.description === 'string' ? body.description.trim() : '';

    const privateFileId = await privateLibraryRepository.create({
        ownerId: user.user_id,
        title,
        description: description || null,
        originalFileName: file.originalname,
        storedFileName: file.filename,
        storagePath: `private/${file.filename}`,
        mimeType: file.mimetype,
        fileSize: file.size
    });

    // Run PDF Extraction
    try {
        const fullPdfPath = resolvePrivatePdfPath(file.filename);
        const filePrefix = `private_${privateFileId}`;
        const outputDir = getPrivateImagesDirectory();
        
        const blocks = await extractPdf(fullPdfPath, outputDir, filePrefix);
        
        const jsonPath = `${filePrefix}_processed.json`;
        const fullJsonPath = path.join(getPrivateProcessedDirectory(), jsonPath);
        
        await fs.writeFile(fullJsonPath, JSON.stringify(blocks), 'utf-8');
        
        // We need an update method in repository!
        await privateLibraryRepository.updateProcessedPath(privateFileId, user.user_id, jsonPath);
    } catch (e) {
        console.error("Failed to extract PDF content for private file", privateFileId, e);
    }

    const privateFile = await privateLibraryRepository.findByIdAndOwner(privateFileId, user.user_id);
    return toPublicMetadata(privateFile);
}

async function getPrivateProcessedContent(user, privateFileId) {
    const privateFile = await privateLibraryRepository.findByIdAndOwner(privateFileId, user.user_id);
    if (!privateFile || !privateFile.processed_content_path) throw notFound();

    const filePath = path.join(getPrivateProcessedDirectory(), path.basename(privateFile.processed_content_path));
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(content);
    } catch {
        throw notFound();
    }
}

async function listPrivatePdfs(user) {
    const files = await privateLibraryRepository.findAllByOwner(user.user_id);
    return files.map(toPublicMetadata);
}

async function getPrivatePdf(user, privateFileId) {
    const privateFile = await privateLibraryRepository.findByIdAndOwner(privateFileId, user.user_id);
    if (!privateFile) throw notFound();
    return toPublicMetadata(privateFile);
}

async function getPrivatePdfForStreaming(user, privateFileId) {
    const privateFile = await privateLibraryRepository.findByIdAndOwner(privateFileId, user.user_id);
    if (!privateFile) throw notFound();

    const filePath = resolvePrivatePdfPath(privateFile.stored_file_name);
    if (!(await fileExists(filePath))) {
        const err = new Error('The PDF file is missing from storage.');
        err.status = 404;
        throw err;
    }

    return { filePath, fileName: privateFile.original_file_name, mimeType: privateFile.mime_type };
}

async function deletePrivatePdf(user, privateFileId) {
    const privateFile = await privateLibraryRepository.findByIdAndOwner(privateFileId, user.user_id);
    if (!privateFile) throw notFound();

    const filePath = resolvePrivatePdfPath(privateFile.stored_file_name);
    await deleteFileIfExists(filePath);

    if (privateFile.processed_content_path) {
        await deleteFileIfExists(path.join(getPrivateProcessedDirectory(), path.basename(privateFile.processed_content_path)));
    }

    await privateLibraryRepository.deleteByIdAndOwner(privateFileId, user.user_id);
}

module.exports = {
    uploadPrivatePdf,
    listPrivatePdfs,
    getPrivatePdf,
    getPrivatePdfForStreaming,
    deletePrivatePdf,
    getPrivateProcessedContent
};
