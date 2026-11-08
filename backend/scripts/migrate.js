'use strict';

/**
 * Incremental schema checks/migrations for the isolated test database only.
 *
 * test-init.js calls applyMigrations(connection, expectedDatabase) using its
 * already-verified direct connection. Running this file directly is also
 * restricted to TEST_DB_NAME=DB_NAME=digital_library_test.
 */

const ALLOWED_TEST_DB = 'digital_library_test';

async function assertDatabase(connection, expectedDatabase) {
    if (expectedDatabase !== ALLOWED_TEST_DB) {
        throw new Error(`[MIGRATE] Only ${ALLOWED_TEST_DB} is permitted by this test migration.`);
    }

    const [rows] = await connection.query('SELECT DATABASE() AS current_db');
    const actualDatabase = rows[0]?.current_db;
    if (actualDatabase !== expectedDatabase) {
        throw new Error(
            `[MIGRATE] Database isolation check failed: expected "${expectedDatabase}", got "${actualDatabase}".`
        );
    }
}

async function tableExists(connection, expectedDatabase, tableName) {
    await assertDatabase(connection, expectedDatabase);
    const [rows] = await connection.query(
        `SELECT TABLE_NAME
           FROM information_schema.TABLES
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?`,
        [tableName]
    );
    return rows.length > 0;
}

async function requireTable(connection, expectedDatabase, tableName) {
    if (!(await tableExists(connection, expectedDatabase, tableName))) {
        throw new Error(`[MIGRATE] Required table "${tableName}" is missing.`);
    }
}

async function readColumnDefinition(connection, expectedDatabase, tableName, columnName) {
    await assertDatabase(connection, expectedDatabase);
    const [rows] = await connection.query(
        `SELECT COLUMN_NAME, COLUMN_TYPE, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
           FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
            AND COLUMN_NAME = ?`,
        [tableName, columnName]
    );
    return rows[0] || null;
}

function verifyColumnDefinition(actual, expected, tableName, columnName) {
    if (!actual) {
        throw new Error(`[MIGRATE] ${tableName}.${columnName} is missing after migration.`);
    }

    const actualType = String(actual.COLUMN_TYPE || '').toLowerCase().replace(/^bigint\(\d+\)/, 'bigint');
    const expectedType = String(expected.columnType).toLowerCase().replace(/^bigint\(\d+\)/, 'bigint');
    const actualNullable = String(actual.IS_NULLABLE).toUpperCase();

    if (actualType !== expectedType || actualNullable !== expected.nullable) {
        throw new Error(
            `[MIGRATE] Schema mismatch for ${tableName}.${columnName}: expected ` +
            `${expected.columnType} NULLABLE=${expected.nullable}, got ` +
            `${actual.COLUMN_TYPE} NULLABLE=${actualNullable}.`
        );
    }

    if (Object.prototype.hasOwnProperty.call(expected, 'defaultValue')) {
        const actualDefault = actual.COLUMN_DEFAULT === null ? null : String(actual.COLUMN_DEFAULT);
        const expectedDefault = expected.defaultValue === null ? null : String(expected.defaultValue);
        if (actualDefault !== expectedDefault) {
            throw new Error(
                `[MIGRATE] Default mismatch for ${tableName}.${columnName}: expected ` +
                `${expectedDefault}, got ${actualDefault}.`
            );
        }
    }
}

async function ensureColumn(connection, expectedDatabase, tableName, columnName, expected, alterSql) {
    let actual = await readColumnDefinition(connection, expectedDatabase, tableName, columnName);

    if (!actual) {
        await assertDatabase(connection, expectedDatabase);
        await connection.query(alterSql);
        actual = await readColumnDefinition(connection, expectedDatabase, tableName, columnName);
        console.log(`[MIGRATE] Added ${tableName}.${columnName}.`);
    } else {
        console.log(`[MIGRATE] ${tableName}.${columnName} already exists; validating definition.`);
    }

    verifyColumnDefinition(actual, expected, tableName, columnName);
}

async function readIndexDefinition(connection, expectedDatabase, tableName, indexName) {
    await assertDatabase(connection, expectedDatabase);
    const [rows] = await connection.query(
        `SELECT INDEX_NAME, SEQ_IN_INDEX, COLUMN_NAME, NON_UNIQUE, SUB_PART
           FROM information_schema.STATISTICS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?
            AND INDEX_NAME = ?
          ORDER BY SEQ_IN_INDEX`,
        [tableName, indexName]
    );

    if (!rows.length) return null;
    return {
        columns: rows.map((row) => row.COLUMN_NAME),
        unique: Number(rows[0].NON_UNIQUE) === 0,
        fullColumns: rows.every((row) => row.SUB_PART === null),
    };
}

function assertIndexDefinition(actual, expectedColumns, expectedUnique, tableName, indexName) {
    const matchesColumns = actual.columns.length === expectedColumns.length &&
        actual.columns.every((column, index) => column === expectedColumns[index]);

    if (!actual.fullColumns || !matchesColumns || actual.unique !== expectedUnique) {
        throw new Error(
            `[MIGRATE] Index mismatch for ${tableName}.${indexName}: expected ` +
            `${expectedUnique ? 'UNIQUE ' : ''}(${expectedColumns.join(', ')}), got ` +
            `${actual.unique ? 'UNIQUE ' : ''}(${actual.columns.join(', ')}).`
        );
    }
}

async function ensureIndex(
    connection,
    expectedDatabase,
    tableName,
    indexName,
    expectedColumns,
    expectedUnique,
    createSql
) {
    const actual = await readIndexDefinition(connection, expectedDatabase, tableName, indexName);

    if (actual) {
        assertIndexDefinition(actual, expectedColumns, expectedUnique, tableName, indexName);
        console.log(`[MIGRATE] ${tableName}.${indexName} already exists and matches.`);
        return;
    }

    await assertDatabase(connection, expectedDatabase);
    await connection.query(createSql);

    const created = await readIndexDefinition(connection, expectedDatabase, tableName, indexName);
    if (!created) {
        throw new Error(`[MIGRATE] Index ${tableName}.${indexName} was not created.`);
    }
    assertIndexDefinition(created, expectedColumns, expectedUnique, tableName, indexName);
    console.log(`[MIGRATE] Created ${tableName}.${indexName}.`);
}

async function verifyPrivateLibraryForeignKey(connection, expectedDatabase) {
    await assertDatabase(connection, expectedDatabase);
    const [rows] = await connection.query(
        `SELECT k.COLUMN_NAME, k.REFERENCED_TABLE_SCHEMA, k.REFERENCED_TABLE_NAME,
                k.REFERENCED_COLUMN_NAME, r.DELETE_RULE, r.UPDATE_RULE
           FROM information_schema.KEY_COLUMN_USAGE k
           JOIN information_schema.REFERENTIAL_CONSTRAINTS r
             ON r.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
            AND r.TABLE_NAME = k.TABLE_NAME
            AND r.CONSTRAINT_NAME = k.CONSTRAINT_NAME
          WHERE k.TABLE_SCHEMA = DATABASE()
            AND k.TABLE_NAME = 'private_library_files'
            AND k.CONSTRAINT_NAME = 'fk_private_library_files_owner'`
    );

    const match = rows.some((row) =>
        row.COLUMN_NAME === 'owner_id' &&
        row.REFERENCED_TABLE_SCHEMA === expectedDatabase &&
        row.DELETE_RULE === 'CASCADE' && row.UPDATE_RULE === 'CASCADE' &&
        row.REFERENCED_TABLE_NAME === 'users' &&
        row.REFERENCED_COLUMN_NAME === 'user_id'
    );

    if (!match) {
        throw new Error(
            '[MIGRATE] private_library_files.fk_private_library_files_owner is missing or does not reference users(user_id).'
        );
    }
}

async function verifyPrivateLibraryTable(connection, expectedDatabase) {
    const requiredColumns = [
        ['private_file_id', { columnType: 'bigint unsigned', nullable: 'NO' }],
        ['owner_id', { columnType: 'bigint unsigned', nullable: 'NO' }],
        ['title', { columnType: 'varchar(255)', nullable: 'NO' }],
        ['description', { columnType: 'varchar(1000)', nullable: 'YES' }],
        ['original_file_name', { columnType: 'varchar(255)', nullable: 'NO' }],
        ['stored_file_name', { columnType: 'varchar(255)', nullable: 'NO' }],
        ['storage_path', { columnType: 'varchar(500)', nullable: 'NO' }],
        ['mime_type', { columnType: 'varchar(100)', nullable: 'NO' }],
        ['file_size', { columnType: 'bigint unsigned', nullable: 'NO' }],
        ['created_at', { columnType: 'datetime', nullable: 'NO' }],
        ['updated_at', { columnType: 'datetime', nullable: 'NO' }],
    ];

    for (const [columnName, expected] of requiredColumns) {
        const actual = await readColumnDefinition(
            connection,
            expectedDatabase,
            'private_library_files',
            columnName
        );
        verifyColumnDefinition(actual, expected, 'private_library_files', columnName);
    }

    await ensureIndex(
        connection, expectedDatabase, 'private_library_files',
        'uq_private_library_files_stored_name', ['stored_file_name'], true,
        'CREATE UNIQUE INDEX uq_private_library_files_stored_name ON private_library_files (stored_file_name)'
    );
    await ensureIndex(
        connection, expectedDatabase, 'private_library_files',
        'idx_private_library_files_owner_id', ['owner_id'], false,
        'CREATE INDEX idx_private_library_files_owner_id ON private_library_files (owner_id)'
    );
    await ensureIndex(
        connection, expectedDatabase, 'private_library_files',
        'idx_private_library_files_created_at', ['created_at'], false,
        'CREATE INDEX idx_private_library_files_created_at ON private_library_files (created_at)'
    );

    await verifyPrivateLibraryForeignKey(connection, expectedDatabase);
}

async function applyMigrations(connection, expectedDatabase) {
    await assertDatabase(connection, expectedDatabase);
    console.log(`[MIGRATE] Applying incremental schema changes to "${expectedDatabase}"...`);

    for (const tableName of ['roles', 'users', 'authors', 'categories', 'books']) {
        await requireTable(connection, expectedDatabase, tableName);
    }

    const archivedColumn = {
        columnType: 'tinyint(1)',
        nullable: 'NO',
        defaultValue: '0',
    };

    await ensureColumn(
        connection, expectedDatabase, 'authors', 'is_archived', archivedColumn,
        'ALTER TABLE authors ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0'
    );
    await ensureIndex(
        connection, expectedDatabase, 'authors', 'idx_authors_is_archived',
        ['is_archived'], false,
        'CREATE INDEX idx_authors_is_archived ON authors (is_archived)'
    );

    await ensureColumn(
        connection, expectedDatabase, 'categories', 'is_archived', archivedColumn,
        'ALTER TABLE categories ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0'
    );
    await ensureIndex(
        connection, expectedDatabase, 'categories', 'idx_categories_is_archived',
        ['is_archived'], false,
        'CREATE INDEX idx_categories_is_archived ON categories (is_archived)'
    );

    const bookColumns = [
        ['cover_path', { columnType: 'varchar(255)', nullable: 'YES' }, 'ALTER TABLE books ADD COLUMN cover_path VARCHAR(255) NULL'],
        ['publication_date', { columnType: 'date', nullable: 'YES' }, 'ALTER TABLE books ADD COLUMN publication_date DATE NULL'],
        ['pdf_original_name', { columnType: 'varchar(255)', nullable: 'YES' }, 'ALTER TABLE books ADD COLUMN pdf_original_name VARCHAR(255) NULL'],
        ['pdf_stored_name', { columnType: 'varchar(255)', nullable: 'YES' }, 'ALTER TABLE books ADD COLUMN pdf_stored_name VARCHAR(255) NULL'],
        ['pdf_size', { columnType: 'bigint unsigned', nullable: 'YES' }, 'ALTER TABLE books ADD COLUMN pdf_size BIGINT UNSIGNED NULL'],
        ['pdf_uploaded_at', { columnType: 'datetime', nullable: 'YES' }, 'ALTER TABLE books ADD COLUMN pdf_uploaded_at DATETIME NULL'],
        ['pdf_path', { columnType: 'varchar(500)', nullable: 'YES' }, 'ALTER TABLE books ADD COLUMN pdf_path VARCHAR(500) NULL'],
        ['processed_content_path', { columnType: 'varchar(255)', nullable: 'YES' }, 'ALTER TABLE books ADD COLUMN processed_content_path VARCHAR(255) NULL'],
    ];

    for (const [columnName, expected, alterSql] of bookColumns) {
        await ensureColumn(connection, expectedDatabase, 'books', columnName, expected, alterSql);
    }

    await ensureIndex(
        connection, expectedDatabase, 'books', 'idx_books_pdf_stored_name',
        ['pdf_stored_name'], false,
        'CREATE INDEX idx_books_pdf_stored_name ON books (pdf_stored_name)'
    );

    const privateLibraryExists = await tableExists(connection, expectedDatabase, 'private_library_files');
    if (!privateLibraryExists) {
        await assertDatabase(connection, expectedDatabase);
        await connection.query(`
            CREATE TABLE private_library_files (
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
                CONSTRAINT fk_private_library_files_owner
                    FOREIGN KEY (owner_id) REFERENCES users(user_id)
                    ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT uq_private_library_files_stored_name UNIQUE (stored_file_name),
                INDEX idx_private_library_files_owner_id (owner_id),
                INDEX idx_private_library_files_created_at (created_at)
            ) ENGINE=InnoDB
        `);
        console.log('[MIGRATE] Created private_library_files.');
    }

    await verifyPrivateLibraryTable(connection, expectedDatabase);

    // The role is required by auth.service.register(). Existing role names are
    // protected by the unique constraint, so INSERT IGNORE is intentional here.
    await assertDatabase(connection, expectedDatabase);
    await connection.query(
        `INSERT IGNORE INTO roles (role_name, description)
         VALUES ('USER', 'Registered user with standard access')`
    );

    await assertDatabase(connection, expectedDatabase);
    const [roleRows] = await connection.query(
        `SELECT role_name FROM roles WHERE role_name = 'USER' LIMIT 1`
    );
    if (roleRows.length !== 1) {
        throw new Error('[MIGRATE] USER role could not be verified after insertion.');
    }

    console.log(`[MIGRATE] Incremental migrations completed for "${expectedDatabase}".`);
}

async function main() {
    // db.config loads backend/.env through env.js. Validate before creating
    // the application pool, and refuse every database except the test DB.
    const dbConfig = require('../src/config/db.config');
    if (process.env.TEST_DB_NAME !== ALLOWED_TEST_DB || dbConfig.database !== ALLOWED_TEST_DB) {
        throw new Error(
            `[MIGRATE] Blocked. Both TEST_DB_NAME and DB_NAME must equal ${ALLOWED_TEST_DB}.`
        );
    }

    const { pool } = require('../src/config/database');
    try {
        await applyMigrations(pool, ALLOWED_TEST_DB);
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    main().catch((error) => {
        console.error('[MIGRATE] Migration failed:', error.message);
        process.exitCode = 1;
    });
}

module.exports = { applyMigrations };
