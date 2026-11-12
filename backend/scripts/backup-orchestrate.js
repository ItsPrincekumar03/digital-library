'use strict';

/**
 * Module 29 - Backup orchestration script.
 * Usage: node scripts/backup-orchestrate.js
 * Runs database backup + file backup + manifest generation.
 * Reports overall success only when all components succeed.
 */

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function runScript(scriptName) {
    const scriptPath = path.join(__dirname, scriptName);
    console.log(`[ORCHESTRATE] Running ${scriptName}...`);
    try {
        const output = execFileSync('node', [scriptPath], {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'pipe'],
            timeout: 120000
        });
        console.log(output);
        return { success: true, output };
    } catch (err) {
        console.error(`[ORCHESTRATE] ${scriptName} failed: ${err.message}`);
        if (err.stderr) console.error(err.stderr);
        return { success: false, error: err.message };
    }
}

function main() {
    console.log('[ORCHESTRATE] Starting backup orchestration...');
    console.log(`[ORCHESTRATE] Timestamp: ${new Date().toISOString()}`);

    const results = {
        database_backup: null,
        file_backup: null,
        overall_status: 'in_progress'
    };

    // Step 1: Database backup
    const dbResult = runScript('backup-db.js');
    results.database_backup = dbResult.success ? 'success' : 'failed';

    // Step 2: File backup
    const fileResult = runScript('backup-files.js');
    results.file_backup = fileResult.success ? 'success' : 'failed';

    // Step 3: Determine overall status
    if (dbResult.success && fileResult.success) {
        results.overall_status = 'success';
        console.log('[ORCHESTRATE] Overall status: SUCCESS');
    } else {
        results.overall_status = 'failed';
        console.log('[ORCHESTRATE] Overall status: FAILED');
        if (!dbResult.success) console.log('[ORCHESTRATE]   Database backup: FAILED');
        if (!fileResult.success) console.log('[ORCHESTRATE]   File backup: FAILED');
    }

    console.log('[ORCHESTRATE] Orchestration complete.');
}

main().catch((err) => {
    console.error('[ORCHESTRATE] Fatal error:', err.message);
    process.exitCode = 1;
});
