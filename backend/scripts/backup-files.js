'use strict';

/**
 * Module 29 - File backup script.
 * Usage: node scripts/backup-files.js
 * Backs up uploads/public/ and uploads/private/ to a timestamped directory.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function main() {
    const projectRoot = path.resolve(__dirname, '..', '..');
    const uploadsDir = path.join(projectRoot, 'uploads');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = process.env.BACKUP_DIR || path.resolve(projectRoot, '..', 'backups');
    const backupPath = path.join(backupDir, `uploads_${timestamp}`);

    if (!fs.existsSync(uploadsDir)) {
        console.error('[BACKUP-FILES] ERROR: uploads directory not found.');
        process.exitCode = 1;
        return;
    }

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    fs.mkdirSync(backupPath, { recursive: true });

    console.log(`[BACKUP-FILES] Starting file backup...`);
    console.log(`[BACKUP-FILES] Source: ${uploadsDir}`);
    console.log(`[BACKUP-FILES] Destination: ${backupPath}`);

    const manifest = {
        backup_id: `files_${timestamp}`,
        created_at: new Date().toISOString(),
        source: uploadsDir,
        destination: backupPath,
        files: [],
        total_files: 0,
        total_size: 0,
        status: 'in_progress'
    };

    function copyDir(src, dest) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }

        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                copyDir(srcPath, destPath);
            } else if (entry.isFile()) {
                fs.copyFileSync(srcPath, destPath);
                const stat = fs.statSync(srcPath);
                const hash = crypto.createHash('sha256').update(fs.readFileSync(srcPath)).digest('hex');
                manifest.files.push({
                    path: path.relative(backupPath, destPath),
                    size: stat.size,
                    sha256: hash
                });
                manifest.total_files++;
                manifest.total_size += stat.size;
            }
        }
    }

    copyDir(uploadsDir, backupPath);

    manifest.status = 'completed';
    manifest.completed_at = new Date().toISOString();

    const manifestPath = path.join(backupPath, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    console.log(`[BACKUP-FILES] SUCCESS: ${manifest.total_files} files, ${manifest.total_size} bytes`);
    console.log(`[BACKUP-FILES] Manifest: ${manifestPath}`);
    console.log(`[BACKUP-FILES] Completed at ${new Date().toISOString()}`);
}

main().catch((err) => {
    console.error('[BACKUP-FILES] Fatal error:', err.message);
    process.exitCode = 1;
});
