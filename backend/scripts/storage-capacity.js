'use strict';

/**
 * Module 29 - Storage capacity report script.
 * Usage: node scripts/storage-capacity.js
 * Reports storage usage for uploads/ directory.
 */

const fs = require('fs');
const path = require('path');

function main() {
    const projectRoot = path.resolve(__dirname, '..', '..');
    const uploadsDir = path.join(projectRoot, 'uploads');

    console.log('[STORAGE-CAPACITY] Starting storage capacity assessment...');
    console.log(`[STORAGE-CAPACITY] Target: ${uploadsDir}`);
    console.log(`[STORAGE-CAPACITY] Timestamp: ${new Date().toISOString()}`);

    if (!fs.existsSync(uploadsDir)) {
        console.error('[STORAGE-CAPACITY] ERROR: uploads directory not found.');
        process.exitCode = 1;
        return;
    }

    const report = {
        timestamp: new Date().toISOString(),
        storage_target: uploadsDir,
        categories: {},
        total_files: 0,
        total_size_bytes: 0,
        total_size_mb: 0,
        disk_available: null,
        disk_total: null
    };

    function scanDir(dir) {
        if (!fs.existsSync(dir)) return { files: 0, size: 0 };
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        let files = 0;
        let size = 0;

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                const sub = scanDir(fullPath);
                files += sub.files;
                size += sub.size;
            } else if (entry.isFile()) {
                files++;
                size += fs.statSync(fullPath).size;
            }
        }

        return { files, size };
    }

    const publicStats = scanDir(path.join(uploadsDir, 'public'));
    report.categories['public'] = {
        files: publicStats.files,
        size_bytes: publicStats.size,
        size_mb: (publicStats.size / 1024 / 1024).toFixed(2)
    };
    report.total_files += publicStats.files;
    report.total_size_bytes += publicStats.size;

    const privateStats = scanDir(path.join(uploadsDir, 'private'));
    report.categories['private'] = {
        files: privateStats.files,
        size_bytes: privateStats.size,
        size_mb: (privateStats.size / 1024 / 1024).toFixed(2)
    };
    report.total_files += privateStats.files;
    report.total_size_bytes += privateStats.size;

    // Check root files (such as .gitkeep)
    const rootEntries = fs.readdirSync(uploadsDir, { withFileTypes: true });
    let rootFiles = 0;
    let rootSize = 0;
    for (const re of rootEntries) {
        if (re.isFile()) {
            rootFiles++;
            rootSize += fs.statSync(path.join(uploadsDir, re.name)).size;
        }
    }
    if (rootFiles > 0) {
        report.categories['root'] = {
            files: rootFiles,
            size_bytes: rootSize,
            size_mb: (rootSize / 1024 / 1024).toFixed(2)
        };
        report.total_files += rootFiles;
        report.total_size_bytes += rootSize;
    }

    report.total_size_mb = (report.total_size_bytes / 1024 / 1024).toFixed(2);

    // Try to get disk info (Windows)
    try {
        const { execSync } = require('child_process');
        const output = execSync('wmic logicaldisk get size,freespace,caption', { encoding: 'utf-8' });
        const lines = output.trim().split('\n').filter(l => l.trim());
        for (const line of lines) {
            const parts = line.trim().split(/\s+/);
            if (parts.length >= 3 && parts[0].includes('C:')) {
                report.disk_total = parseInt(parts[1], 10);
                report.disk_available = parseInt(parts[2], 10);
            }
        }
    } catch {
        // Disk info not available
    }

    console.log('[STORAGE-CAPACITY] Category breakdown:');
    for (const [cat, data] of Object.entries(report.categories)) {
        console.log(`  ${cat}: ${data.files} files, ${data.size_mb} MB`);
    }
    console.log(`[STORAGE-CAPACITY] Total: ${report.total_files} files, ${report.total_size_mb} MB`);

    if (report.disk_available !== null) {
        const usedPercent = ((1 - report.disk_available / report.disk_total) * 100).toFixed(1);
        console.log(`[STORAGE-CAPACITY] Disk: ${report.disk_available} bytes available of ${report.disk_total} bytes (${usedPercent}% used)`);
    }

    console.log('[STORAGE-CAPACITY] Assessment complete.');
}

main();
