const path = require('path');
const fs = require('fs/promises');
const { getPublicImagesDirectory } = require('../utils/fileStorage');

async function getExtractedImage(req, res, next) {
    try {
        const { imageName } = req.params;
        const safeFileName = path.basename(imageName);
        const filePath = path.join(getPublicImagesDirectory(), safeFileName);
        
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ success: false, message: 'Image not found' });
        }
        
        res.sendFile(filePath);
    } catch (err) { next(err); }
}

module.exports = getExtractedImage;
