const path = require('path');
const privateLibraryRepository = require('../repositories/privateLibrary.repository');
const {
    deleteFileIfExists,
    fileExists,
    resolvePrivatePdfPath
} = require('../utils/fileStorage');
const { validateEpubFile } = require('../utils/epubValidation');
const { validateFormat, validateExtension, validateMimeType } = require('../utils/formatValidation');

function notFound() {
    const err = new Error('Private file not found.');
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
    ).slice(0, 255) || 'Untitled File';
}

function toPublicMetadata(file) {
    return {
        private_file_id: file.private_file_id,
        title: file.title,
        description: file.description,
        original_file_name: file.original_file_name,
        mime_type: file.mime_type,
        file_size: file.file_size,
        file_format: file.file_format || null,
        created_at: file.created_at,
        updated_at: file.updated_at
    };
}

async function uploadPrivateFile(user, body, file) {
    if (!file) {
        throw badRequest('File is required.');
    }

    let privateFileId;
    try {
        // Validate format
        if (!body.format) {
            body.format = 'PDF';
        }
        const formatResult = validateFormat(body.format);
        if (!formatResult.valid) {
            throw badRequest(formatResult.error);
        }
        const format = formatResult.format;

        // Validate extension
        const extResult = validateExtension(format, file.originalname);
        if (!extResult.valid) {
            throw badRequest(extResult.error);
        }

        // Validate MIME type
        const mimeResult = validateMimeType(format, file.mimetype);
        if (!mimeResult.valid) {
            throw badRequest(mimeResult.error);
        }

        // Format-specific content validation
        if (format === 'PDF') {
            const { validatePdfFile } = require('../utils/pdfValidation');
            await validatePdfFile(file.path);
        } else if (format === 'EPUB') {
            await validateEpubFile(file.path);
        }

        const title = buildTitle(body.title, file.originalname);

        const description = typeof body.description === 'string'
            ? body.description.trim()
            : '';

        privateFileId = await privateLibraryRepository.create({
            ownerId: user.user_id,
            title,
            description: description || null,
            originalFileName: file.originalname,
            storedFileName: file.filename,
            storagePath: 'private/' + file.filename,
            mimeType: file.mimetype,
            fileSize: file.size,
            fileFormat: format
        });
    } catch (err) {
        if (file.path) {
            await deleteFileIfExists(file.path).catch(() => {});
        }
        throw err;
    }

    const privateFile = await privateLibraryRepository.findByIdAndOwner(
        privateFileId,
        user.user_id
    );

    return toPublicMetadata(privateFile);
}

// Backward-compatible alias
async function uploadPrivatePdf(user, body, file) {
    if (!body.format) {
        body.format = 'PDF';
    }
    return uploadPrivateFile(user, body, file);
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
        const err = new Error('The file is missing from storage.');
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

async function getPrivateDocument(user, privateFileId) {
    const privateFile = await privateLibraryRepository.findByIdAndOwner(
        privateFileId,
        user.user_id
    );

    if (!privateFile) {
        throw notFound();
    }

    const filePath = resolvePrivatePdfPath(privateFile.stored_file_name);

    if (!(await fileExists(filePath))) {
        const err = new Error('The file is missing from storage.');
        err.status = 404;
        throw err;
    }

    if (privateFile.file_format === 'EPUB') {
        const { processEpubFile } = require('../utils/epubProcessor');
        const document = await processEpubFile(filePath, {
            bookId: privateFileId
        });
        return document;
    }

    const { extractPdfText } = require('../utils/pdfTextExtractor');
    const extracted = await extractPdfText(filePath);
    return {
        version: 1,
        bookId: privateFileId,
        fileFormat: 'PDF',
        sourceFile: privateFile.original_file_name,
        pageCount: extracted.pageCount,
        textChars: extracted.textChars,
        extractedAt: new Date().toISOString(),
        pages: extracted.pages,
        images: [],
        imageStatus: { status: 'not_attempted', extractedCount: 0, message: 'Image extraction not enabled for private files.' }
    };
}

module.exports = {
    uploadPrivatePdf,
    uploadPrivateFile,
    listPrivatePdfs,
    getPrivatePdf,
    getPrivatePdfForStreaming,
    deletePrivatePdf,
    getPrivateDocument
};
