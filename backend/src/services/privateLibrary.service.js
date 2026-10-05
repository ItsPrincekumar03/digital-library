const path = require('path');
const privateLibraryRepository = require('../repositories/privateLibrary.repository');
const {
    deleteFileIfExists,
    fileExists,
    resolvePrivatePdfPath
} = require('../utils/fileStorage');

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

    if (title) {
        return title;
    }

    return path.basename(
        originalFileName,
        path.extname(originalFileName)
    ).slice(0, 255) || 'Untitled PDF';
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
    if (!file) {
        throw badRequest('PDF file is required.');
    }

    const title = buildTitle(body.title, file.originalname);

    const description = typeof body.description === 'string'
        ? body.description.trim()
        : '';

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

    const privateFile = await privateLibraryRepository.findByIdAndOwner(
        privateFileId,
        user.user_id
    );

    return toPublicMetadata(privateFile);
}

async function listPrivatePdfs(user) {
    const files = await privateLibraryRepository.findAllByOwner(user.user_id);
    return files.map(toPublicMetadata);
}

async function getPrivatePdf(user, privateFileId) {
    const privateFile = await privateLibraryRepository.findByIdAndOwner(
        privateFileId,
        user.user_id
    );

    if (!privateFile) {
        throw notFound();
    }

    return toPublicMetadata(privateFile);
}

async function getPrivatePdfForStreaming(user, privateFileId) {
    const privateFile = await privateLibraryRepository.findByIdAndOwner(
        privateFileId,
        user.user_id
    );

    if (!privateFile) {
        throw notFound();
    }

    const filePath = resolvePrivatePdfPath(privateFile.stored_file_name);

    if (!(await fileExists(filePath))) {
        const err = new Error('The PDF file is missing from storage.');
        err.status = 404;
        throw err;
    }

    return {
        filePath,
        fileName: privateFile.original_file_name,
        mimeType: privateFile.mime_type
    };
}

async function deletePrivatePdf(user, privateFileId) {
    const privateFile = await privateLibraryRepository.findByIdAndOwner(
        privateFileId,
        user.user_id
    );

    if (!privateFile) {
        throw notFound();
    }

    const filePath = resolvePrivatePdfPath(privateFile.stored_file_name);

    await deleteFileIfExists(filePath);

    await privateLibraryRepository.deleteByIdAndOwner(
        privateFileId,
        user.user_id
    );
}

module.exports = {
    uploadPrivatePdf,
    listPrivatePdfs,
    getPrivatePdf,
    getPrivatePdfForStreaming,
    deletePrivatePdf
};
