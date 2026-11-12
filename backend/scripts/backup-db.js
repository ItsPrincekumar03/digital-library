'use strict';

require('../src/config/env');

/**
 * Module 29 - Database backup script.
 * Usage: node scripts/backup-db.js
 * Environment: TEST_DB_NAME or DB_NAME must be set.
 * Targets: digital_library_test only (safe for testing).
 * Production: use with explicit DB_NAME=digital_library and owner authorization.
 */

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const ALLOWED_TEST_DB = 'digital_library_test';
const FORBIDDEN_DB = 'digital_library';

async function main() {
    const dbName = process.env.TEST_DB_NAME || process.env.DB_NAME;

    if (!dbName) {
        console.error('[BACKUP-DB] ERROR: TEST_DB_NAME or DB_NAME must be set.');
        process.exitCode = 1;
        return;
    }

    if (dbName === FORBIDDEN_DB) {
        console.error('[BACKUP-DB] ERROR: Refusing to back up primary database "digital_library".');
        process.exitCode = 1;
        return;
    }

    if (dbName !== ALLOWED_TEST_DB) {
        console.error(`[BACKUP-DB] ERROR: Database "${dbName}" is not an approved test database.`);
        process.exitCode = 1;
        return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupDir = process.env.BACKUP_DIR || path.resolve(__dirname, '..', '..', 'backups');
    const backupFile = path.join(backupDir, `${dbName}_${timestamp}.sql`);

    if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
    }

    const dbUser = process.env.DB_USER || 'root';
    const dbPassword = process.env.DB_PASSWORD || '';
    const dbHost = process.env.DB_HOST || 'localhost';
    const dbPort = process.env.DB_PORT || '3306';

    console.log(`[BACKUP-DB] Starting backup of "${dbName}"...`);
    console.log(`[BACKUP-DB] Output: ${backupFile}`);

    const args = [
        `-h${dbHost}`,
        `-P${dbPort}`,
        `-u${dbUser}`,
        `--single-transaction`,
        `--routines`,
        `--triggers`,
        dbName
    ];

    // Use --password via env to avoid command-line exposure
    const env = { ...process.env };
    if (dbPassword) {
        env.MYSQL_PWD = dbPassword;
    }

    const child = execFile('mysqldump', args, { env, maxBuffer: 100 * 1024 * 1024 }, (error, stdout, stderr) => {
        if (error) {
            console.error(`[BACKUP-DB] FAILED: ${error.message}`);
            if (stderr) console.error(`[BACKUP-DB] stderr: ${stderr}`);
            process.exitCode = 1;
            return;
        }

        fs.writeFileSync(backupFile, stdout);
        const stats = fs.statSync(backupFile);

        if (stats.size === 0) {
            console.error('[BACKUP-DB] FAILED: Backup file is empty.');
            process.exitCode = 1;
            return;
        }

        console.log(`[BACKUP-DB] SUCCESS: ${backupFile} (${stats.size} bytes)`);
        console.log(`[BACKUP-DB] Completed at ${new Date().toISOString()}`);
    });

    // Pipe stdout to file for large databases
    const writeStream = fs.createWriteStream(backupFile);
    child.stdout.pipe(writeStream);

    child.on('error', (err) => {
        console.error(`[BACKUP-DB] Process error: ${err.message}`);
        process.exitCode = 1;
    });
}

main().catch((err) => {
    console.error('[BACKUP-DB] Fatal error:', err.message);
    process.exitCode = 1;
});
