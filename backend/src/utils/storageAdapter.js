'use strict';

/**
 * Module 29 - Local filesystem storage adapter.
 *
 * Provides a small, provider-independent storage interface used by the
 * existing upload and retrieval services. The local adapter preserves
 * the current development workflow. A production adapter (e.g. S3-compatible
 * object storage) can be implemented by following the same interface.
 *
 * Interface:
 *   save(filePath, data)          - Save a file
 *   read(filePath)                - Read a file buffer
 *   exists(filePath)              - Check if file exists
 *   delete(filePath)              - Delete a file (safe, ENOENT ignored)
 *   metadata(filePath)            - Get file size and mtime
 *   list(directory)               - List files in directory
 */

const fs = require('fs/promises');
const path = require('path');

class LocalStorageAdapter {
    constructor(baseDirectory) {
        this.baseDirectory = path.resolve(baseDirectory);
    }

    _resolve(safeRelativePath) {
        const safe = path.basename(String(safeRelativePath || ''));
        const resolved = path.resolve(this.baseDirectory, safe);
        if (!resolved.startsWith(this.baseDirectory + path.sep) && resolved !== this.baseDirectory) {
            const err = new Error('Path escapes storage directory.');
            err.status = 400;
            throw err;
        }
        return resolved;
    }

    async save(relativePath, data) {
        const fullPath = this._resolve(relativePath);
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, data);
        return fullPath;
    }

    async read(relativePath) {
        const fullPath = this._resolve(relativePath);
        return fs.readFile(fullPath);
    }

    async exists(relativePath) {
        const fullPath = this._resolve(relativePath);
        try {
            await fs.access(fullPath);
            return true;
        } catch {
            return false;
        }
    }

    async delete(relativePath) {
        const fullPath = this._resolve(relativePath);
        try {
            await fs.unlink(fullPath);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }
    }

    async metadata(relativePath) {
        const fullPath = this._resolve(relativePath);
        const stat = await fs.stat(fullPath);
        return { size: stat.size, mtime: stat.mtime };
    }

    async list(directory) {
        const fullPath = this._resolve(directory || '');
        const entries = await fs.readdir(fullPath, { withFileTypes: true });
        return entries.map((e) => ({
            name: e.name,
            isDirectory: e.isDirectory(),
            isFile: e.isFile(),
        }));
    }
}

module.exports = { LocalStorageAdapter };
