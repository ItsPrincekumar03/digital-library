const privateLibraryService = require('../services/privateLibrary.service');
const path = require('path');
const fs = require('fs/promises');
const { getPrivateImagesDirectory } = require('../utils/fileStorage');

async function uploadFile(req, res, next) {
    try {
        const privateFile = await privateLibraryService.uploadPrivatePdf(
            req.user,
            req.body,
            req.file
        );
        res.status(201).json({ success: true, message: 'PDF uploaded.', data: { privateFile } });
    } catch (err) { next(err); }
}

async function listFiles(req, res, next) {
    try {
        const privateFiles = await privateLibraryService.listPrivatePdfs(req.user);
        res.status(200).json({ success: true, data: { privateFiles } });
    } catch (err) { next(err); }
}

async function getFile(req, res, next) {
    try {
        const privateFile = await privateLibraryService.getPrivatePdf(req.user, req.params.id);
        res.status(200).json({ success: true, data: { privateFile } });
    } catch (err) { next(err); }
}

async function streamFile(req, res, next) {
    try {
        const { filePath, mimeType, fileName } = await privateLibraryService.getPrivatePdfForStreaming(req.user, req.params.id);
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
        res.sendFile(filePath);
    } catch (err) { next(err); }
}

async function getDocument(req, res, next) {
    try {
        const content = await privateLibraryService.getPrivateProcessedContent(req.user, req.params.id);
        res.status(200).json({ success: true, data: { content } });
    } catch (err) { next(err); }
}

async function getExtractedImage(req, res, next) {
    try {
        // Simple security: check if private file exists and belongs to user by matching the prefix
        // Prefix is private_{id}_img_...
        const { imageName } = req.params;
        const match = imageName.match(/^private_(\d+)_/);
        if (!match) return res.status(403).json({ success: false });
        
        const privateFileId = parseInt(match[1], 10);
        await privateLibraryService.getPrivatePdf(req.user, privateFileId); // will throw 404/403 if unowned

        const safeFileName = path.basename(imageName);
        const filePath = path.join(getPrivateImagesDirectory(), safeFileName);
        
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }
        
        res.sendFile(filePath);
    } catch (err) { next(err); }
}

async function deleteFile(req, res, next) {
    try {
        await privateLibraryService.deletePrivatePdf(req.user, req.params.id);
        res.status(200).json({ success: true, message: 'PDF deleted.' });
    } catch (err) { next(err); }
}

module.exports = {
    uploadFile, listFiles, getFile, streamFile, deleteFile, getDocument, getExtractedImage
};
