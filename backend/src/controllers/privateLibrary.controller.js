const path = require('path');
const privateLibraryService = require('../services/privateLibrary.service');

async function upload(req, res, next) {
    try {
        const privateFile = await privateLibraryService.uploadPrivateFile(
            req.user,
            req.body,
            req.file
        );

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully.',
            data: { privateFile }
        });
    } catch (err) {
        next(err);
    }
}

async function list(req, res, next) {
    try {
        const [privateFiles, savedBooks] = await Promise.all([
            privateLibraryService.listPrivatePdfs(req.user),
            privateLibraryService.listSavedBooks(req.user),
        ]);

        res.status(200).json({
            success: true,
            data: { privateFiles, savedBooks }
        });
    } catch (err) {
        next(err);
    }
}

async function getById(req, res, next) {
    try {
        const privateFile = await privateLibraryService.getPrivatePdf(
            req.user,
            req.params.id
        );

        res.status(200).json({
            success: true,
            data: { privateFile }
        });
    } catch (err) {
        next(err);
    }
}

async function openFile(req, res, next) {
    try {
        const privateFile = await privateLibraryService.getPrivatePdfForStreaming(
            req.user,
            req.params.id
        );

        const safeFileName = path.basename(String(privateFile.fileName || 'book.pdf')).replace(/[\r\n"]/g, '');
        const asciiFileName = safeFileName.replace(/[^\x20-\x7E]/g, '_') || 'book.pdf';

        res.setHeader('Content-Type', privateFile.mimeType);
        res.setHeader(
            'Content-Disposition',
            `inline; filename="${asciiFileName}"; filename*=UTF-8''${encodeURIComponent(safeFileName)}`
        );

        res.sendFile(privateFile.filePath);
    } catch (err) {
        next(err);
    }
}

async function remove(req, res, next) {
    try {
        await privateLibraryService.deletePrivatePdf(
            req.user,
            req.params.id
        );

        res.status(200).json({
            success: true,
            message: 'PDF deleted successfully.'
        });
    } catch (err) {
        next(err);
    }
}

async function getDocument(req, res, next) {
    try {
        const document = await privateLibraryService.getPrivateDocument(
            req.user,
            req.params.id
        );
        res.status(200).json({
            success: true,
            data: { document }
        });
    } catch (err) {
        next(err);
    }
}

async function getCover(req, res, next) {
    try {
        const cover = await privateLibraryService.getPrivateCover(
            req.user,
            req.params.id
        );
        res.status(200);
        res.set('Content-Type', cover.mimeType);
        res.set('Content-Length', String(cover.sizeBytes));
        res.set('Cache-Control', 'private, max-age=3600');
        if (cover.mimeType === 'image/svg+xml') {
            res.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
        }
        res.send(cover.buffer);
    } catch (err) {
        next(err);
    }
}

async function getImage(req, res, next) {
    try {
        const image = await privateLibraryService.getPrivateImage(
            req.user,
            req.params.id,
            req.params.imageName
        );
        res.status(200);
        res.set('Content-Type', image.mimeType);
        res.set('Content-Length', String(image.sizeBytes));
        res.set('Cache-Control', 'private, max-age=86400');
        res.send(image.buffer);
    } catch (err) {
        next(err);
    }
}

async function listSaved(req, res, next) {
    try {
        const savedBooks = await privateLibraryService.listSavedBooks(req.user);
        res.status(200).json({
            success: true,
            data: {
                savedBooks,
                total: savedBooks.length,
            },
        });
    } catch (err) {
        next(err);
    }
}

async function saveBook(req, res, next) {
    try {
        const { savedBook, alreadySaved } = await privateLibraryService.savePublicBook(
            req.user,
            req.params.bookId
        );

        res.status(alreadySaved ? 200 : 201).json({
            success: true,
            message: alreadySaved
                ? 'This book is already in your private library.'
                : 'Book saved to your private library.',
            data: { savedBook, alreadySaved },
        });
    } catch (err) {
        next(err);
    }
}

async function removeSaved(req, res, next) {
    try {
        await privateLibraryService.removeSavedBook(
            req.user,
            req.params.bookId
        );

        res.status(200).json({
            success: true,
            message: 'Book removed from your private library.',
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    upload,
    list,
    listSaved,
    saveBook,
    removeSaved,
    getById,
    openFile,
    remove,
    getDocument,
    getCover,
    getImage,
};
