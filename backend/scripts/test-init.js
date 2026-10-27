/**
 * Safe Test Database Initialization Script
 *
 * Purpose: Prepare and validate an isolated test database (digital_library_test)
 *          without risking writes to the primary digital_library database.
 *
 * Usage:
 *   TEST_DB_NAME=digital_library_test NODE_ENV=development node backend/scripts/test-init.js
 *
 * Safety guarantees:
 *   1. Requires TEST_DB_NAME env var (rejects if missing or empty)
 *   2. Rejects 'digital_library' as a target (primary database)
 *   3. Only accepts 'digital_library_test' as a valid target
 *   4. Connects directly to the specified database (no .env DB_NAME fallback)
 *   5. Verifies SELECT DATABASE() before every write operation
 *   6. Filters out CREATE DATABASE and USE statements from SQL files
 *   7. Uses CREATE TABLE IF NOT EXISTS and INSERT IGNORE for idempotency
 *   8. Does NOT drop, truncate, or recreate any tables
 *   9. Does NOT delete or modify existing data
 *   10. Aborts immediately if any isolation check fails
 *
 * This script does NOT modify application code, security config, or SQL files.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// Load .env (does not override existing env vars)
require(path.resolve(__dirname, '..', 'src', 'config', 'env'));

// ── Safety constants ────────────────────────────────────────────────────────
const ALLOWED_TEST_DB = 'digital_library_test';
const FORBIDDEN_DB = 'digital_library';

// ── Safety validation ───────────────────────────────────────────────────────
function validateTarget(dbName) {
    if (!dbName || typeof dbName !== 'string' || dbName.trim() === '') {
        throw new Error(
            '[TEST-INIT] BLOCKED: TEST_DB_NAME is not set or empty.'
        );
    }

    const trimmed = dbName.trim();

    if (trimmed === FORBIDDEN_DB) {
        throw new Error(
            '[TEST-INIT] BLOCKED: Target database is the primary digital_library database.'
        );
    }

    if (trimmed !== ALLOWED_TEST_DB) {
        throw new Error(
            `[TEST-INIT] BLOCKED: Target database "${trimmed}" is not approved.`
        );
    }

    return trimmed;
}

//
function assertNoPrimarySchemaReferences(sql) {
    // Fail closed if a statement explicitly references
    // the primary database, including backtick-quoted names.
    const primarySchemaReference =
        /\b`?digital_library`?\s*\.\s*`?[A-Za-z_][A-Za-z0-9_$]*`?/i;

    if (primarySchemaReference.test(sql)) {
        throw new Error(
            '[TEST-INIT] BLOCKED: SQL references the primary ' +
            'digital_library schema explicitly.'
        );
    }
}

// ── SQL filtering ───────────────────────────────────────────────────────────
function filterSql(sql) {
    assertNoPrimarySchemaReferences(sql);

    const lines = sql.split('\n');
    const filtered = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('--')) continue;
        if (trimmed === '') continue;
        const upper = trimmed.toUpperCase();
        if (upper.startsWith('CREATE DATABASE')) {
            console.log('[TEST-INIT]   Filtered: CREATE DATABASE directive');
            continue;
        }
        if (upper.startsWith('USE ')) {
            console.log('[TEST-INIT]   Filtered: USE directive');
            continue;
        }
        if (upper.startsWith('DROP ')) {
            throw new Error(
                '[TEST-INIT] BLOCKED: DROP statement found in SQL file.'
            );
        }

        if (upper.startsWith('TRUNCATE ')) {
            throw new Error(
                '[TEST-INIT] BLOCKED: TRUNCATE statement found in SQL file.'
            );
        }
        if (upper.startsWith('SET FOREIGN_KEY_CHECKS') || upper.startsWith('SET NAMES')) {
            continue;
        }
        filtered.push(line);
    }
    return filtered.join('\n');
}

async function verifyDatabase(conn, expectedDb) {
    const [result] = await conn.query(
        'SELECT DATABASE() AS current_db'
    );

    const actualDb = result[0]?.current_db;

    if (actualDb !== expectedDb) {
        throw new Error(
            `[TEST-INIT] ISOLATION FAILURE: Expected "${expectedDb}", got "${actualDb}".`
        );
    }

    console.log(`[TEST-INIT] Verified: Connected to "${actualDb}".`);
    return actualDb;
}
async function safeWrite(conn, expectedDb, sql, params = []) {
    // Verify the active connection immediately before the write.
    await verifyDatabase(conn, expectedDb);

    // Check again at the individual statement level.
    assertNoPrimarySchemaReferences(sql);

    return conn.query(sql, params);
}
async function ensureIndex(conn, targetDb, table, index, column) {
    // These identifiers must come from the fixed list below,
    // never from external user input.
    const allowedIndexes = {
        authors: {
            idx_authors_is_archived: 'is_archived',
        },
        categories: {
            idx_categories_is_archived: 'is_archived',
        },
        books: {
            idx_books_pdf_stored_name: 'pdf_stored_name',
        },
    };

    if (allowedIndexes[table]?.[index] !== column) {
        throw new Error(
            `[TEST-INIT] BLOCKED: Unapproved index definition: ${table}.${index}`
        );
    }

    await verifyDatabase(conn, targetDb);

    const [rows] = await conn.query(
        `SELECT GROUP_CONCAT(
                    COLUMN_NAME ORDER BY SEQ_IN_INDEX
                ) AS indexed_columns
         FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND INDEX_NAME = ?
         GROUP BY INDEX_NAME`,
        [table, index]
    );

    if (rows.length > 0) {
        if (rows[0].indexed_columns !== column) {
            throw new Error(
                `[TEST-INIT] Index ${index} exists with unexpected columns. ` +
                'Manual review required; no changes made to that index.'
            );
        }

        console.log(`[TEST-INIT] Index verified: ${index}`);
        return;
    }

    const sql =
        'CREATE INDEX `' + index + '` ON `' + table + '` (`' + column + '`)';

    await safeWrite(conn, targetDb, sql);

    console.log(`[TEST-INIT] Index created: ${index}`);
}



async function applySchema(conn, targetDb) {
    console.log('\n[TEST-INIT] Applying schema (CREATE TABLE IF NOT EXISTS)...');
    await verifyDatabase(conn, targetDb);

    const schemaPath = path.resolve(__dirname, '..', '..', 'database', 'schema.sql');
    const rawSql = fs.readFileSync(schemaPath, 'utf8');
    const filteredSql = filterSql(rawSql);

    // Split into individual statements
    const statements = filteredSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    let applied = 0;
    for (const stmt of statements) {
        // Only execute CREATE TABLE and CREATE INDEX statements
        const upper = stmt.toUpperCase();
        if (upper.startsWith('CREATE TABLE') || upper.startsWith('CREATE INDEX') ||
            upper.startsWith('SET FOREIGN_KEY_CHECKS') || upper.startsWith('SET NAMES') ||
            upper.startsWith('--')) {
            try {
                await safeWrite(conn, targetDb, stmt);
                applied++;
            } catch (err) {
                if (err.code === 'ER_DUP_KEYNAME') {
                    console.log('[TEST-INIT] Existing index skipped.');
                    continue;
                }
                if (err.code === 'ER_TABLE_EXISTS_ERROR') {
                    console.log('[TEST-INIT] Table already exists; skipping.');
                    continue;
                }
                console.error(`[TEST-INIT] Schema error: ${err.message}`);
                console.error(`[TEST-INIT] Statement: ${stmt.substring(0, 100)}...`);
                throw err;
            }
        }
    }

    await verifyDatabase(conn, targetDb);
    console.log(`[TEST-INIT] Schema applied: ${applied} statements processed.`);
}

async function applySeed(conn, targetDb) {
    console.log('\n[TEST-INIT] Applying seed data (INSERT IGNORE)...');
    await verifyDatabase(conn, targetDb);

    const seedPath = path.resolve(__dirname, '..', '..', 'database', 'seed.sql');
    const rawSql = fs.readFileSync(seedPath, 'utf8');
    const filteredSql = filterSql(rawSql);

    const statements = filteredSql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

    let applied = 0;
    for (const stmt of statements) {
        const upper = stmt.toUpperCase();
        if (upper.startsWith('INSERT')) {
            try {
                await safeWrite(conn, targetDb, stmt);
                applied++;
            } catch (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    console.log('[TEST-INIT] Duplicate seed entry skipped.');
                    continue;
                }
                console.error(`[TEST-INIT] Seed error: ${err.message}`);
                console.error(`[TEST-INIT] Statement: ${stmt.substring(0, 100)}...`);
                throw err;
            }
        }
    }

    await verifyDatabase(conn, targetDb);
    console.log(`[TEST-INIT] Seed applied: ${applied} statements processed.`);
}

async function applyMigrations(conn, targetDb) {
    console.log('\n[TEST-INIT] Applying migration compatibility checks (016-019)...');
    await verifyDatabase(conn, targetDb);

    // Migration 016: Add USER role
    try {
        await safeWrite(conn, targetDb, "INSERT IGNORE INTO roles (role_name, description) VALUES ('USER', 'Standard authenticated user')");
        console.log('[TEST-INIT] Migration 016: USER role ensured.');
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            console.log('[TEST-INIT] Role already exists; skipping.');
        } else {
            console.error('[TEST-INIT] Migration 016 error:', err.message);
            throw err;
        }
    }

    // Migration 017: Archiving columns
    try {
        const [cols] = await conn.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'authors' AND COLUMN_NAME = 'is_archived'");
        if (cols.length === 0) {
            await safeWrite(conn, targetDb, 'ALTER TABLE authors ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0');
            console.log('[TEST-INIT] Migration 017: authors.is_archived added.');
        } else {
            console.log('[TEST-INIT] Migration 017: authors.is_archived already exists.');
        }
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('[TEST-INIT] Column already exists; skipping.');
        } else {
            console.error('[TEST-INIT] Migration 017 error:', err.message);
            throw err;
        }
    }

    try {
        const [cols] = await conn.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'categories' AND COLUMN_NAME = 'is_archived'");
        if (cols.length === 0) {
            await safeWrite(conn, targetDb, 'ALTER TABLE categories ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0');
            console.log('[TEST-INIT] Migration 017: categories.is_archived added.');
        } else {
            console.log('[TEST-INIT] Migration 017: categories.is_archived already exists.');
        }
    } catch (err) {
        if (err.code === 'ER_DUP_FIELDNAME') {
            console.log('[TEST-INIT] Column already exists; skipping.');
        } else {
            console.error('[TEST-INIT] Migration 017 error:', err.message);
            throw err;
        }
    }

    // Migration 018: Private library files table
    try {
        const [tables] = await conn.query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'private_library_files'");
        if (tables.length === 0) {
            await safeWrite(conn, targetDb, `CREATE TABLE IF NOT EXISTS private_library_files (
                private_file_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                owner_id BIGINT UNSIGNED NOT NULL,
                title VARCHAR(255) NOT NULL,
                description VARCHAR(1000) NULL,
                original_file_name VARCHAR(255) NOT NULL,
                stored_file_name VARCHAR(255) NOT NULL,
                storage_path VARCHAR(500) NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                file_size BIGINT UNSIGNED NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                CONSTRAINT fk_private_library_files_owner FOREIGN KEY (owner_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT uq_private_library_files_stored_name UNIQUE (stored_file_name),
                INDEX idx_private_library_files_owner_id (owner_id),
                INDEX idx_private_library_files_created_at (created_at)
            ) ENGINE=InnoDB`);
            console.log('[TEST-INIT] Migration 018: private_library_files table created.');
        } else {
            console.log('[TEST-INIT] Migration 018: private_library_files table already exists.');
        }
    } catch (err) {
        if (err.code === 'ER_TABLE_EXISTS_ERROR') {
            console.log('[TEST-INIT] Table already exists; skipping.');
        } else {
            console.error('[TEST-INIT] Migration 018 error:', err.message);
            throw err;
        }
    }

    // Migration 019: Book PDF columns
    const pdfColumns = ['pdf_original_name', 'pdf_stored_name', 'pdf_size', 'pdf_uploaded_at', 'pdf_path', 'processed_content_path', 'cover_path', 'publication_date'];
    for (const col of pdfColumns) {
        try {
            const [cols] = await conn.query(`SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'books' AND COLUMN_NAME = '${col}'`);
            if (cols.length === 0) {
                let sql = '';
                switch (col) {
                    case 'pdf_original_name': sql = "ALTER TABLE books ADD COLUMN pdf_original_name VARCHAR(255) NULL"; break;
                    case 'pdf_stored_name': sql = "ALTER TABLE books ADD COLUMN pdf_stored_name VARCHAR(255) NULL"; break;
                    case 'pdf_size': sql = "ALTER TABLE books ADD COLUMN pdf_size BIGINT UNSIGNED NULL"; break;
                    case 'pdf_uploaded_at': sql = "ALTER TABLE books ADD COLUMN pdf_uploaded_at DATETIME NULL"; break;
                    case 'pdf_path': sql = "ALTER TABLE books ADD COLUMN pdf_path VARCHAR(500) NULL"; break;
                    case 'processed_content_path': sql = "ALTER TABLE books ADD COLUMN processed_content_path VARCHAR(255) NULL"; break;
                    case 'cover_path': sql = "ALTER TABLE books ADD COLUMN cover_path VARCHAR(255) NULL"; break;
                    case 'publication_date': sql = "ALTER TABLE books ADD COLUMN publication_date DATE NULL"; break;
                }
                if (sql) {
                    await safeWrite(conn, targetDb, sql);
                    console.log(`[TEST-INIT] Migration 019: books.${col} added.`);
                }
            }
        } catch (err) {
            if (err.code === 'ER_DUP_FIELDNAME') {
                console.log('[TEST-INIT] Column already exists; skipping.');
            } else {
                console.error(`[TEST-INIT] Migration 019 error (${col}):`, err.message);
                throw err;
            }
        }
    }
    const requiredIndexes = [
        {
            table: 'authors',
            index: 'idx_authors_is_archived',
            column: 'is_archived',
        },
        {
            table: 'categories',
            index: 'idx_categories_is_archived',
            column: 'is_archived',
        },
        {
            table: 'books',
            index: 'idx_books_pdf_stored_name',
            column: 'pdf_stored_name',
        },
    ];

    for (const item of requiredIndexes) {
        await ensureIndex(
            conn,
            targetDb,
            item.table,
            item.index,
            item.column
        );
    }


    await verifyDatabase(conn, targetDb);
    console.log('[TEST-INIT] Migration compatibility checks (016-019) completed.');
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
    let conn = null;
    let initializationError = null;

    try {
        console.log(
            '=== Digital Library � Safe Test Database Initialization ===\n'
        );

        const targetDb = validateTarget(process.env.TEST_DB_NAME);

        console.log(`[TEST-INIT] Target database: ${targetDb}`);
        console.log(`[TEST-INIT] Forbidden database: ${FORBIDDEN_DB}`);

        conn = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: targetDb,
        });

        await verifyDatabase(conn, targetDb);

        const [tables] = await conn.query('SHOW TABLES');
        console.log(`[TEST-INIT] Current tables: ${tables.length}`);

        const wasEmptyAtStart = tables.length === 0;

        await applySchema(conn, targetDb);

        if (wasEmptyAtStart) {
            console.log(
                '[TEST-INIT] Database was empty; applying initial seed data.'
            );
            await applySeed(conn, targetDb);
        } else {
            console.log(
                '[TEST-INIT] Seed skipped because the database already contained tables.'
            );
        }

        await applyMigrations(conn, targetDb);

        await verifyDatabase(conn, targetDb);

        const [finalTables] = await conn.query('SHOW TABLES');
        const [roles] = await conn.query(
            'SELECT role_name FROM roles ORDER BY role_id'
        );

        console.log('\n[TEST-INIT] Final state:');
        console.log(`  Database: ${targetDb}`);
        console.log(`  Tables: ${finalTables.length}`);
        console.log(`  Roles: ${roles.map((r) => r.role_name).join(', ')}`);
    } catch (err) {
        initializationError = err;
    } finally {
        if (conn) {
            try {
                await conn.end();
            } catch (closeErr) {
                console.error(
                    '[TEST-INIT] Failed to close database connection:',
                    closeErr.message
                );

                if (!initializationError) {
                    initializationError = closeErr;
                }
            }
        }
    }

    if (initializationError) {
        throw initializationError;
    }

    console.log('\n[TEST-INIT] Initialization complete.');
    console.log(
        '[TEST-INIT] The configured test database was used; primary database writes were not requested.'
    );
}

main().catch((err) => {
    console.error('[TEST-INIT] Fatal error:', err.message);
    process.exitCode = 1;
});