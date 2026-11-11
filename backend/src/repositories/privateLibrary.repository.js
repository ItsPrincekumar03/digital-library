const { pool } = require('../config/database');

async function create({
    ownerId,
    title,
    description,
    originalFileName,
    storedFileName,
    storagePath,
    mimeType,
    fileSize,
    fileFormat,
    coverImage,
    coverPath
}) {
    const [result] = await pool.query(
        `INSERT INTO private_library_files
            (owner_id, title, description, original_file_name, stored_file_name, storage_path, mime_type, file_size, file_format, cover_image, cover_path)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            ownerId,
            title,
            description || null,
            originalFileName,
            storedFileName,
            storagePath,
            mimeType,
            fileSize,
            fileFormat || null,
            coverImage || null,
            coverPath || null
        ]
    );

    return result.insertId;
}

async function updateCoverMetadata(privateFileId, ownerId, { coverImage, coverPath }) {
    const [result] = await pool.query(
        `UPDATE private_library_files
         SET cover_image = ?, cover_path = ?, updated_at = CURRENT_TIMESTAMP
         WHERE private_file_id = ? AND owner_id = ?`,
        [coverImage || null, coverPath || null, privateFileId, ownerId]
    );
    return result.affectedRows > 0;
}

async function findAllByOwner(ownerId) {
    const [rows] = await pool.query(
        `SELECT *
         FROM private_library_files
         WHERE owner_id = ?
         ORDER BY created_at DESC`,
        [ownerId]
    );

    return rows;
}

async function findByIdAndOwner(privateFileId, ownerId) {
    const [rows] = await pool.query(
        `SELECT *
         FROM private_library_files
         WHERE private_file_id = ? AND owner_id = ?
         LIMIT 1`,
        [privateFileId, ownerId]
    );

    return rows[0] || null;
}

async function deleteByIdAndOwner(privateFileId, ownerId) {
    const [result] = await pool.query(
        `DELETE FROM private_library_files
         WHERE private_file_id = ? AND owner_id = ?`,
        [privateFileId, ownerId]
    );

    return result.affectedRows;
}

module.exports = {
    create,
    updateCoverMetadata,
    findAllByOwner,
    findByIdAndOwner,
    deleteByIdAndOwner
};
