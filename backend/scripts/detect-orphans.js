'use strict';

/**
 * Module 29 - Orphan file detection script (report-only, no deletion).
 * Usage: node scripts/detect-orphans.js
 * Scans uploads/ directory and compares against database references.
 * Reports orphan candidates but does NOT delete anything.
 */

const fs = require('fs');
const path = require('path');

async function main() {
    // This script requires database access. In a real implementation,
    // it would connect to the database and compare file references.
    // For now, it provides the framework and report structure.

    const projectRoot = path.resolve(__dirname, '..', '..');
    const uploadsDir = path.join(projectRoot, 'uploads');

    console.log('[ORPHAN-DETECT] Starting orphan file detection (report-only)...');
    console.log('[ORPHAN-DETECT] Scanning: ' + uploadsDir);

    if (!fs.existsSync(uploadsDir)) {
        console.error('[ORPHAN-DETECT] ERROR: uploads directory not found.');
        process.exitCode = 1;
        return;
    }

    const report = {
        scan_time: new Date().toISOString(),
        scan_root: uploadsDir,
        orphan_candidates: [],
        total_files_scanned: 0,
        total_orphans_found: 0,
        note: 'This is a report-only tool. No files were deleted.'
    };

    // Walk the uploads directory
    function walkDir(dir, relativePath) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            const relPath = path.join(relativePath, entry.name);

            if (entry.isDirectory()) {
                walkDir(fullPath, relPath);
            } else if (entry.isFile()) {
                report.total_files_scanned++;
                // In a full implementation, each file would be checked
                // against the database. For now, report all files as candidates
                // (the actual DB comparison requires a live connection).
                const stat = fs.statSync(fullPath);
                report.orphan_candidates.push({
                    path: relPath,
                    size: stat.size,
                    modified: stat.mtime.toISOString(),
                    classification: 'unverified',
                    reason: 'Database comparison not performed (requires DB connection)',
                    recommended_action: 'Verify against database references before any cleanup'
                });
            }
        }
    }

    walkDir(uploadsDir, '');

    report.total_orphans_found = report.orphan_candidates.length;

    const reportPath = path.join(uploadsDir, '..', 'orphan-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`[ORPHAN-DETECT] Scanned: ${report.total_files_scanned} files`);
    console.log(`[ORPHAN-DETECT] Candidates: ${report.total_orphans_found}`);
    console.log(`[ORPHAN-DETECT] Report: ${reportPath}`);
    console.log('[ORPHAN-DETECT] No files were deleted (report-only mode).');
}

main().catch((err) => {
    console.error('[ORPHAN-DETECT] Fatal error:', err.message);
    process.exitCode = 1;
});
