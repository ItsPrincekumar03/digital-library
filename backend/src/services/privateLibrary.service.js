const fs = require('fs/promises');
const path = require('path');
const privateLibraryRepository = require('../repositories/privateLibrary.repository');
const savedBooksRepository = require('../repositories/savedBooks.repository');
const bookRepository = require('../repositories/book.repository');
const bookRelationsRepository = require('../repositories/bookRelations.repository');
const { isBookPubliclyReadable } = require('../utils/bookVisibility');
const {
    deleteFileIfExists,
    deleteDirectoryIfExists,
    fileExists,
    resolvePrivatePdfPath,
    buildPrivateProcessedName,
    resolvePrivateProcessedPath,
    buildPrivateImagesDirName,
    resolvePrivateImagesDir,
    resolvePrivateImagePath,
    buildCoverFileName,
    resolvePrivateCoverPath,
    getPrivateUploadDirectory,
} = require('../utils/fileStorage');
const { validateEpubFile } = require('../utils/epubValidation');
const { validateFormat, validateExtension, validateMimeType } = require('../utils/formatValidation');
const { extractPdfText } = require('../utils/pdfTextExtractor');
const { extractPdfImages } = require('../utils/pdfImageExtractor');
const { processEpubFile } = require('../utils/epubProcessor');
const {
    COVER_EXTENSIONS,
    detectImageFormat,
    saveExtractedCover,
    findExtractedCoverBuffer,
    selectBestPdfCoverImage,
    generateFallbackCoverSvg,
} = require('../utils/coverFallback');
const logger = require('../utils/logger');

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function notFound(message = 'Private file not found.') {
    const err = new Error(message);
    err.status = 404;
    return err;
}

function badRequest(message) {
    const err = new Error(message);
    err.status = 400;
    return err;
}

function inferPrivateFormat(file) {
    if (file.file_format && typeof file.file_format === 'string' && file.file_format.trim()) {
        return file.file_format.trim().toUpperCase();
    }
    if (String(file.original_file_name || file.stored_file_name || '').toLowerCase().endsWith('.epub')) {
        return 'EPUB';
    }
    return 'PDF';
}

function buildTitle(bodyTitle, originalFileName, extractedTitle = '') {
    const title = typeof bodyTitle === 'string' ? bodyTitle.trim() : '';
    if (title) {
        return title.slice(0, 255);
    }

    if (typeof extractedTitle === 'string' && extractedTitle.trim()) {
        return extractedTitle.trim().slice(0, 255);
    }

    return path.basename(
        originalFileName,
        path.extname(originalFileName)
    ).slice(0, 255) || 'Untitled File';
}

function toPublicMetadata(file) {
    const fileFormat = inferPrivateFormat(file);
    const canonicalCover = `/api/private-library/${file.private_file_id}/cover`;
    return {
        private_file_id: file.private_file_id,
        title: file.title,
        description: file.description,
        original_file_name: file.original_file_name,
        mime_type: file.mime_type,
        file_size: file.file_size,
        file_format: fileFormat,
        has_original_file: true,
        cover_image: file.cover_image || null,
        cover_path: file.cover_path || canonicalCover,
        cover_url: canonicalCover,
        created_at: file.created_at,
        updated_at: file.updated_at
    };
}

async function extractAndCachePrivateDocument(privateFile, filePath, onCoverSaved = null) {
    const format = inferPrivateFormat(privateFile);
    const storedName = privateFile.stored_file_name;
    const processedPath = resolvePrivateProcessedPath(buildPrivateProcessedName(storedName));
    const imagesDirName = buildPrivateImagesDirName(storedName);

    let document;

    if (format === 'EPUB') {
        document = await processEpubFile(filePath, {
            bookId: privateFile.private_file_id,
            imagesDirName,
            publicUploadDir: getPrivateUploadDirectory(),
            onCoverExtracted: async (coverBuf) => {
                const saved = await saveExtractedCover(storedName, coverBuf, true);
                if (saved && saved.coverFileName && typeof onCoverSaved === 'function') {
                    await onCoverSaved(saved.coverFileName);
                }
            }
        });
        document = {
            ...document,
            fileFormat: 'EPUB',
            hasOriginalFile: true,
            hasText: Number(document.textChars) > 0,
            isScanned: false,
        };
    } else {
        const extracted = await extractPdfText(filePath);
        let documentImages = [];
        let documentImageStatus = {
            status: 'not_attempted',
            extractedCount: 0,
            pageReferences: 0,
            skippedCount: 0,
            unsupportedCount: 0,
            pageErrors: 0,
            limitReached: false,
            totalBytes: 0,
            message: 'Image extraction was not attempted.'
        };

        try {
            const imgResult = await extractPdfImages(filePath, {
                bookId: privateFile.private_file_id,
                imagesDirName,
                resolveImagesDir: resolvePrivateImagesDir,
                resolveImagePath: resolvePrivateImagePath,
            });
            documentImages = imgResult.images || [];
            documentImageStatus = imgResult.status || documentImageStatus;

            const bestCoverImg = selectBestPdfCoverImage(documentImages);
            if (bestCoverImg && bestCoverImg.file) {
                const firstImgPath = resolvePrivateImagePath(
                    path.dirname(bestCoverImg.file),
                    path.basename(bestCoverImg.file)
                );
                const coverBuf = await fs.readFile(firstImgPath);
                const saved = await saveExtractedCover(storedName, coverBuf, true);
                if (saved && saved.coverFileName && typeof onCoverSaved === 'function') {
                    await onCoverSaved(saved.coverFileName);
                }
            }
        } catch (imgErr) {
            logger.error(`Private PDF image extraction failed for ${privateFile.private_file_id}.`, imgErr);
        }

        document = {
            version: 1,
            bookId: Number(privateFile.private_file_id),
            fileFormat: 'PDF',
            sourceFile: privateFile.original_file_name,
            pageCount: extracted.pageCount,
            textChars: extracted.textChars,
            hasText: extracted.hasText,
            isScanned: extracted.isScanned,
            metadata: extracted.metadata || {},
            hasOriginalFile: true,
            extractedAt: new Date().toISOString(),
            pages: extracted.pages,
            images: documentImages,
            imageStatus: documentImageStatus,
        };
    }

    try {
        await fs.writeFile(processedPath, JSON.stringify(document), 'utf-8');
    } catch (cacheErr) {
        logger.error(`Failed to cache processed private document ${privateFile.private_file_id}.`, cacheErr);
    }

    return document;
}

async function uploadPrivateFile(user, body, file) {
    if (!file) {
        throw badRequest('File is required.');
    }

    let privateFileId;
    let format;
    let extractedDocument = null;

    try {
        const requestedFormat = body?.format === undefined || body?.format === null || String(body.format).trim() === ''
            ? 'PDF'
            : body.format;
        const formatResult = validateFormat(requestedFormat);
        if (!formatResult.valid) {
            throw badRequest(formatResult.error);
        }
        format = formatResult.format;

        const extResult = validateExtension(format, file.originalname);
        if (!extResult.valid) {
            throw badRequest(extResult.error);
        }

        const mimeResult = validateMimeType(format, file.mimetype);
        if (!mimeResult.valid) {
            throw badRequest(mimeResult.error);
        }

        const { validatePdfFile } = require('../utils/pdfValidation');
        await validatePdfFile(file.path);

        // Pre-extract structured reading content & metadata/cover when possible.
        // Failures here never reject an otherwise valid original upload.
        let extractedTitle = '';
        let extractedCoverImage = null;
        try {
            const tempRecord = {
                private_file_id: 0,
                original_file_name: file.originalname,
                stored_file_name: file.filename,
                file_format: format,
            };
            extractedDocument = await extractAndCachePrivateDocument(tempRecord, file.path, async (coverFileName) => {
                extractedCoverImage = coverFileName;
            });
            extractedTitle = extractedDocument?.metadata?.title || '';
        } catch (extractErr) {
            logger.error(`Pre-extraction warning for uploaded private ${format}.`, extractErr);
        }

        const title = buildTitle(body.title, file.originalname, body.title ? '' : extractedTitle);
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
            fileFormat: format,
            coverImage: extractedCoverImage,
            coverPath: null
        });

        await privateLibraryRepository.updateCoverMetadata(privateFileId, user.user_id, {
            coverImage: extractedCoverImage,
            coverPath: `/api/private-library/${privateFileId}/cover`,
        });
    } catch (err) {
        if (file.path) {
            await deleteFileIfExists(file.path).catch(() => {});
        }
        if (file.filename) {
            await deleteFileIfExists(resolvePrivateProcessedPath(buildPrivateProcessedName(file.filename))).catch(() => {});
            await deleteDirectoryIfExists(resolvePrivateImagesDir(buildPrivateImagesDirName(file.filename))).catch(() => {});
            for (const ext of COVER_EXTENSIONS) {
                await deleteFileIfExists(resolvePrivateCoverPath(buildCoverFileName(file.filename, ext))).catch(() => {});
            }
        }
        throw err;
    }

    // Update cached bookId cleanly if pre-extracted
    if (extractedDocument && privateFileId) {
        try {
            extractedDocument.bookId = Number(privateFileId);
            const processedPath = resolvePrivateProcessedPath(buildPrivateProcessedName(file.filename));
            await fs.writeFile(processedPath, JSON.stringify(extractedDocument), 'utf-8');
        } catch (_) {}
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

    const storedName = privateFile.stored_file_name;
    await deleteFileIfExists(resolvePrivatePdfPath(storedName));
    await deleteFileIfExists(resolvePrivateProcessedPath(buildPrivateProcessedName(storedName))).catch(() => {});
    await deleteDirectoryIfExists(resolvePrivateImagesDir(buildPrivateImagesDirName(storedName))).catch(() => {});
    for (const ext of COVER_EXTENSIONS) {
        await deleteFileIfExists(resolvePrivateCoverPath(buildCoverFileName(storedName, ext))).catch(() => {});
    }

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

    const format = inferPrivateFormat(privateFile);
    const processedPath = resolvePrivateProcessedPath(
        buildPrivateProcessedName(privateFile.stored_file_name)
    );

    if (await fileExists(processedPath)) {
        try {
            const cached = JSON.parse(await fs.readFile(processedPath, 'utf-8'));
            const textChars = Number(cached.textChars) || 0;
            return {
                ...cached,
                bookId: Number(privateFileId),
                fileFormat: cached.fileFormat || format,
                hasOriginalFile: true,
                hasText: typeof cached.hasText === 'boolean' ? cached.hasText : textChars > 0,
                isScanned: typeof cached.isScanned === 'boolean' ? cached.isScanned : (format === 'PDF' && textChars === 0),
            };
        } catch (_) {
            // Fall through to re-extract cleanly if cache file is unreadable
        }
    }

    const filePath = resolvePrivatePdfPath(privateFile.stored_file_name);

    if (!(await fileExists(filePath))) {
        const err = new Error('The file is missing from storage.');
        err.status = 404;
        throw err;
    }

    return extractAndCachePrivateDocument(privateFile, filePath);
}

async function getPrivateCover(user, privateFileId) {
    const privateFile = await privateLibraryRepository.findByIdAndOwner(
        privateFileId,
        user.user_id
    );

    if (!privateFile) {
        throw notFound();
    }

    if (privateFile.cover_image) {
        try {
            const coverPath = resolvePrivateCoverPath(path.basename(privateFile.cover_image));
            if (await fileExists(coverPath)) {
                const data = await fs.readFile(coverPath);
                const detected = detectImageFormat(data);
                if (detected) {
                    return { buffer: data, mimeType: detected.mimeType, sizeBytes: data.length };
                }
            }
        } catch (_) {}
    }

    const extractedCover = await findExtractedCoverBuffer(privateFile.stored_file_name, true);
    if (extractedCover) {
        return extractedCover;
    }

    let fallbackSubtitle = 'Private Library';
    try {
        const processedPath = resolvePrivateProcessedPath(buildPrivateProcessedName(privateFile.stored_file_name));
        if (await fileExists(processedPath)) {
            const cached = JSON.parse(await fs.readFile(processedPath, 'utf-8'));
            const author = cached?.metadata?.author || cached?.metadata?.creator || '';
            if (typeof author === 'string' && author.trim()) {
                fallbackSubtitle = author.trim();
            }
        }
    } catch (_) {}

    const format = inferPrivateFormat(privateFile);
    const svgBuffer = generateFallbackCoverSvg({
        id: privateFile.private_file_id,
        title: privateFile.title,
        subtitle: fallbackSubtitle,
        format,
    });

    return {
        buffer: svgBuffer,
        mimeType: 'image/svg+xml',
        sizeBytes: svgBuffer.length,
    };
}

async function getPrivateImage(user, privateFileId, imageName) {
    const privateFile = await privateLibraryRepository.findByIdAndOwner(
        privateFileId,
        user.user_id
    );

    if (!privateFile) {
        throw notFound();
    }

    const dirName = buildPrivateImagesDirName(privateFile.stored_file_name);
    const imagePath = resolvePrivateImagePath(dirName, imageName);

    if (!(await fileExists(imagePath))) {
        throw notFound('Image not found for this private file.');
    }

    const data = await fs.readFile(imagePath);
    if (data.length < PNG_SIGNATURE.length || !data.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
        throw notFound('Image not found for this private file.');
    }

    return {
        buffer: data,
        mimeType: 'image/png',
        sizeBytes: data.length,
    };
}

function inferPublicBookFormat(book) {
    if (book.file_format && typeof book.file_format === 'string' && book.file_format.trim()) {
        return book.file_format.trim().toUpperCase();
    }
    const name = String(book.pdf_original_name || book.pdf_stored_name || '').toLowerCase();
    if (name.endsWith('.epub')) return 'EPUB';
    if (name.endsWith('.pdf') || book.pdf_stored_name) return 'PDF';
    return null;
}

function toSavedBookMetadata(book) {
    const fileFormat = inferPublicBookFormat(book);
    const canonicalCover = `/api/books/${book.book_id}/cover`;
    const rawCoverPath = typeof book.cover_path === 'string' ? book.cover_path.trim() : '';
    const resolvedCoverPath = rawCoverPath && !rawCoverPath.startsWith('/uploads/') ? rawCoverPath : canonicalCover;
    return {
        saved_id: book.saved_id,
        book_id: book.book_id,
        title: book.title,
        description: book.description,
        cover_path: resolvedCoverPath,
        cover_url: canonicalCover,
        publication_date: book.publication_date,
        file_format: fileFormat,
        has_original_file: Boolean(book.pdf_stored_name),
        has_readable_content: Boolean(book.pdf_stored_name || book.processed_content_path),
        saved_at: book.saved_at,
        authors: book.authors || [],
        categories: book.categories || [],
        item_type: 'SAVED_PUBLIC',
    };
}

async function listSavedBooks(user) {
    const rows = await savedBooksRepository.listPublishedSavedBooksByUser(user.user_id);
    const enriched = await bookRelationsRepository.attachRelationsToBooks(rows);
    return enriched.map(toSavedBookMetadata);
}

async function listSavedBookIds(user) {
    return savedBooksRepository.listSavedBookIdsByUser(user.user_id);
}

async function savePublicBook(user, rawBookId) {
    const bookId = Number(rawBookId);
    if (!Number.isSafeInteger(bookId) || bookId < 1) {
        throw badRequest('Invalid public book ID.');
    }

    const book = await bookRepository.findById(bookId);
    if (!book || !isBookPubliclyReadable(book)) {
        throw notFound('This book does not exist or is not published.');
    }

    const { alreadySaved } = await savedBooksRepository.saveBook(user.user_id, bookId);
    const savedList = await listSavedBooks(user);
    const savedBook = savedList.find((item) => Number(item.book_id) === bookId) || null;

    return {
        savedBook,
        alreadySaved,
    };
}

async function removeSavedBook(user, rawBookId) {
    const bookId = Number(rawBookId);
    if (!Number.isSafeInteger(bookId) || bookId < 1) {
        throw badRequest('Invalid public book ID.');
    }

    const removed = await savedBooksRepository.removeBook(user.user_id, bookId);
    if (!removed) {
        throw notFound('This book is not in your private library.');
    }

    return { removed: true };
}

module.exports = {
    uploadPrivatePdf,
    uploadPrivateFile,
    listPrivatePdfs,
    getPrivatePdf,
    getPrivatePdfForStreaming,
    deletePrivatePdf,
    getPrivateDocument,
    getPrivateCover,
    getPrivateImage,
    listSavedBooks,
    listSavedBookIds,
    savePublicBook,
    removeSavedBook,
};
