const path = require('path');
const privateLibraryService = require('../services/privateLibrary.service');

async function upload(req, res, next) {
    try {
        const privateFile = await privateLibraryService.uploadPrivatePdf(
            req.user,
            req.body,
            req.file
        );

        res.status(201).json({
            success: true,
            message: 'PDF uploaded successfully.',
            data: { privateFile }
        });
    } catch (err) {
        next(err);
    }
}

async function list(req, res, next) {
    try {
        const privateFiles = await privateLibraryService.listPrivatePdfs(req.user);

        res.status(200).json({
            success: true,
            data: { privateFiles }
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

        const safeFileName = path.basename(privateFile.fileName);

        res.setHeader('Content-Type', privateFile.mimeType);
        res.setHeader(
            'Content-Disposition',
            `inline; filename="${safeFileName.replace(/"/g, '')}"`
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

module.exports = {
    upload,
    list,
    getById,
    openFile,
    remove
};
