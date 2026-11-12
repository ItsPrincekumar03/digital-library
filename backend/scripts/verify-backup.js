'use strict';

/**
 * Module 29 - Backup verification script.
 * Usage: node scripts/verify-backup.js <backup-directory>
 * Verifies manifest integrity using SHA-256 checksums.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function main() {
    const backupDir = process.argv[2];

    if (!backupDir) {
        console.error('[VERIFY-BACKUP] ERROR: Backup directory path required.');
        console.error('Usage: node scripts/verify-backup.js <backup-directory>');
        process.exitCode = 1;
        return;
    }

    const resolvedDir = path.resolve(backupDir);
    const manifestPath = path.join(resolvedDir, 'manifest.json');

    if (!fs.existsSync(manifestPath)) {
        console.error(`[VERIFY-BACKUP] ERROR: Manifest not found at ${manifestPath}`);
        process.exitCode = 1;
        return;
    }

    let manifest;
    try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    } catch (err) {
        console.error(`[VERIFY-BACKUP] ERROR: Invalid manifest JSON: ${err.message}`);
        process.exitCode = 1;
        return;
    }

    // Validate manifest structure
    const requiredFields = ['backup_id', 'created_at', 'files', 'total_files', 'total_size', 'status'];
    for (const field of requiredFields) {
        if (!(field in manifest)) {
            console.error(`[VERIFY-BACKUP] ERROR: Missing required field "${field}" in manifest.`);
            process.exitCode = 1;
            return;
        }
    }

    if (manifest.status !== 'completed') {
        console.error(`[VERIFY-BACKUP] ERROR: Backup status is "${manifest.status}", expected "completed".`);
        process.exitCode = 1;
        return;
    }

    console.log(`[VERIFY-BACKUP] Verifying backup: ${manifest.backup_id}`);
    console.log(`[VERIFY-BACKUP] Created: ${manifest.created_at}`);
    console.log(`[VERIFY-BACKUP] Expected files: ${manifest.total_files}`);
    console.log(`[VERIFY-BACKUP] Expected size: ${manifest.total_size} bytes`);

    let verified = 0;
    let mismatches = 0;
    let missing = 0;

    for (const entry of manifest.files) {
        // Path traversal protection
        const relativePath = entry.path.replace(/\\/g, '/');
        if (relativePath.includes('..') || relativePath.startsWith('/') || relativePath.includes('\\')) {
            console.error(`[VERIFY-BACKUP] PATH TRAVERSAL DETECTED: ${entry.path}`);
            mismatches++;
            continue;
        }

        const filePath = path.resolve(resolvedDir, relativePath);

        // Ensure resolved path is within backup directory
        if (!filePath.startsWith(resolvedDir + path.sep)) {
            console.error(`[VERIFY-BACKUP] PATH ESCAPE DETECTED: ${entry.path}`);
            mismatches++;
            continue;
        }

        if (!fs.existsSync(filePath)) {
            console.error(`[VERIFY-BACKUP] MISSING: ${entry.path}`);
            missing++;
            continue;
        }

        const stat = fs.statSync(filePath);
        if (stat.size !== entry.size) {
            console.error(`[VERIFY-BACKUP] SIZE MISMATCH: ${entry.path} (expected ${entry.size}, got ${stat.size})`);
            mismatches++;
            continue;
        }

        const actualHash = crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
        if (actualHash !== entry.sha256) {
            console.error(`[VERIFY-BACKUP] CHECKSUM MISMATCH: ${entry.path}`);
            mismatches++;
            continue;
        }

        verified++;
    }

    console.log(`[VERIFY-BACKUP] Verified: ${verified}`);
    console.log(`[VERIFY-BACKUP] Mismatches: ${mismatches}`);
    console.log(`[VERIFY-BACKUP] Missing: ${missing}`);

    if (mismatches > 0 || missing > 0) {
        console.error('[VERIFY-BACKUP] FAILED: Backup integrity verification failed.');
        process.exitCode = 1;
    } else {
        console.log('[VERIFY-BACKUP] SUCCESS: All files verified.');
    }
}

main();
