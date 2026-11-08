'use strict';

/**
 * Initialize only the existing, isolated Digital Library test database.
 *
 * Safety rules:
 * - TEST_DB_NAME must be exactly digital_library_test.
 * - Connects directly to that named database; it does not use DB_NAME as a fallback.
 * - Never creates, drops, truncates, resets, or switches databases.
 * - Ignores CREATE DATABASE / USE / SET statements in the reusable SQL files.
 * - Rejects explicit references to the primary digital_library schema.
 * - Validates existing table columns and declared indexes before accepting them.
 * - Executes seed INSERT statements as authored; it does not blanket-convert them
 *   to INSERT IGNORE.
 */

const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

require(path.resolve(__dirname, '..', 'src', 'config', 'env'));

const ALLOWED_TEST_DB = 'digital_library_test';
const FORBIDDEN_DB = 'digital_library';

function validateTarget(dbName) {
    if (typeof dbName !== 'string' || dbName.trim() === '') {
        throw new Error('TEST_DB_NAME is required. Set it to digital_library_test.');
    }

    const target = dbName.trim();
    if (target.toLowerCase() === FORBIDDEN_DB || target !== ALLOWED_TEST_DB) {
        throw new Error(`Blocked database target "${target}". Only "${ALLOWED_TEST_DB}" is permitted.`);
    }

    return target;
}

/** Split SQL on semicolons outside quoted values and identifiers. */
function splitSqlStatements(sql, sqlMode = '') {
    const backslashEscapes = !sqlMode.toUpperCase().split(',').includes('NO_BACKSLASH_ESCAPES');
    const statements = [];
    let current = '';
    let quote = null;
    let lineComment = false;
    let blockComment = false;

    for (let index = 0; index < sql.length; index += 1) {
        const char = sql[index];
        const next = sql[index + 1];

        if (lineComment) {
            if (char === '\n') {
                lineComment = false;
                current += '\n';
            }
            continue;
        }

        if (blockComment) {
            if (char === '*' && next === '/') {
                blockComment = false;
                index += 1;
                current += ' ';
            }
            continue;
        }

        if (quote) {
            current += char;
            if (backslashEscapes && quote !== '`' &&
                !(quote === '"' && sqlMode.toUpperCase().split(',').includes('ANSI_QUOTES')) &&
                char === '\\' && index + 1 < sql.length) {
                current += sql[index + 1];
                index += 1;
            } else if (char === quote) {
                if (next === quote) {
                    current += next;
                    index += 1;
                } else {
                    quote = null;
                }
            }
            continue;
        }

        if (char === '-' && next === '-' &&
            (index + 2 >= sql.length || /\s/.test(sql[index + 2]))) {
            lineComment = true;
            index += 1;
            continue;
        }

        if (char === '#') {
            lineComment = true;
            continue;
        }

        if (char === '/' && next === '*') {
            blockComment = true;
            index += 1;
            continue;
        }

        if (char === "'" || char === '"' || char === '`') {
            quote = char;
            current += char;
            continue;
        }

        if (char === ';') {
            const statement = current.trim();
            if (statement) statements.push(statement);
            current = '';
            continue;
        }

        current += char;
    }

    if (quote || blockComment) {
        throw new Error(
            'SQL file contains an unterminated quoted value or block comment.'
        );
    }

    const finalStatement = current.trim();
    if (finalStatement) statements.push(finalStatement);

    return statements;
}

function readStatements(filePath, sqlMode = '') {
    if (!fs.existsSync(filePath)) {
        throw new Error(`Required SQL file was not found: ${filePath}`);
    }

    return splitSqlStatements(fs.readFileSync(filePath, 'utf8'), sqlMode);
}

/** Mask string literals using the session SQL mode, retaining identifiers. */
function maskSqlStringLiterals(sql, sqlMode = '') {
    const modes = new Set(sqlMode.toUpperCase().split(',').map((mode) => mode.trim()));
    const ansiQuotes = modes.has('ANSI_QUOTES');
    const backslashEscapes = !modes.has('NO_BACKSLASH_ESCAPES');
    let identifierQuote = null;
    let output = '';
    let quote = null;

    for (let index = 0; index < sql.length; index += 1) {
        const char = sql[index];
        const next = sql[index + 1];

        if (identifierQuote) {
            output += char;
            if (char === identifierQuote) {
                if (next === identifierQuote) {
                    output += next;
                    index += 1;
                } else identifierQuote = null;
            }
            continue;
        }
        if (!quote && (char === '`' || (ansiQuotes && char === '"'))) {
            identifierQuote = char;
            output += char;
            continue;
        }
        if (quote) {
            output += ' ';

            if (backslashEscapes && char === '\\' && index + 1 < sql.length) {
                output += ' ';
                index += 1;
            } else if (char === quote) {
                if (next === quote) {
                    output += ' ';
                    index += 1;
                } else {
                    quote = null;
                }
            }

            continue;
        }

        if (char === "'" || char === '"') {
            quote = char;
            output += ' ';
            continue;
        }

        // Backticks delimit identifiers, not string values.
        output += char;
    }

    return output;
}

function assertNoPrimarySchemaReferences(statement, sqlMode = '') {
    const searchable = maskSqlStringLiterals(statement, sqlMode);

    const primarySchemaQualifier =
        /(?:^|[^A-Za-z0-9_$])(?:`digital_library`|"digital_library"|digital_library)\s*\.\s*(?:`[^`]+`|"[^"]+"|[A-Za-z_][A-Za-z0-9_$]*)/i;

    if (primarySchemaQualifier.test(searchable)) {
        throw new Error(
            'Blocked SQL statement: explicit reference to the primary digital_library schema detected.'
        );
    }
}

async function verifyDatabase(connection, expectedDatabase) {
    if (expectedDatabase !== ALLOWED_TEST_DB) {
        throw new Error(`Only ${ALLOWED_TEST_DB} is permitted.`);
    }
    const [rows] = await connection.query(
        'SELECT DATABASE() AS current_db'
    );

    const actualDatabase = rows[0]?.current_db;

    if (actualDatabase !== expectedDatabase) {
        throw new Error(
            `Database isolation failure: expected "${expectedDatabase}", got "${actualDatabase}".`
        );
    }

    return actualDatabase;
}

function splitTopLevelDefinitions(body) {
    const parts = [];
    let current = '';
    let depth = 0;
    let quote = null;

    for (let index = 0; index < body.length; index += 1) {
        const char = body[index];
        const next = body[index + 1];

        if (quote) {
            current += char;

            if (char === '\\' && index + 1 < body.length) {
                current += body[index + 1];
                index += 1;
            } else if (char === quote) {
                if (next === quote) {
                    current += next;
                    index += 1;
                } else {
                    quote = null;
                }
            }

            continue;
        }

        if (char === "'" || char === '"' || char === '`') {
            quote = char;
            current += char;
            continue;
        }

        if (char === '(') depth += 1;
        if (char === ')') depth -= 1;

        if (char === ',' && depth === 0) {
            if (current.trim()) parts.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    if (current.trim()) parts.push(current.trim());

    return parts;
}

function unquoteIdentifier(identifier) {
    const trimmed = identifier.trim();

    if (trimmed.startsWith('`') && trimmed.endsWith('`')) {
        return trimmed.slice(1, -1).replace(/``/g, '`');
    }

    return trimmed;
}

function parseColumnList(value) {
    return value
        .split(',')
        .map((column) =>
            unquoteIdentifier(column.trim().split(/\s+/)[0])
        );
}

function parseCreateTableDefinition(statement) {
    const header =
        /^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(`(?:``|[^`])+`|[A-Za-z_][A-Za-z0-9_$]*)\s*\(/i.exec(statement);

    if (!header) {
        throw new Error(
            'Could not safely parse CREATE TABLE statement; refusing to execute it.'
        );
    }

    const openIndex = header[0].lastIndexOf('(');
    const closeIndex = statement.lastIndexOf(')');

    if (closeIndex <= openIndex) {
        throw new Error(`Malformed CREATE TABLE statement for ${header[1]}.`);
    }

    const tableName = unquoteIdentifier(header[1]);

    if (tableName.includes('.')) {
        throw new Error(
            'Qualified table names are not permitted in test schema SQL.'
        );
    }

    const body = statement.slice(openIndex + 1, closeIndex);
    const definitions = splitTopLevelDefinitions(body);

    const columns = [];
    const indexes = [];

    for (const definition of definitions) {
        const columnMatch =
            /^(`(?:``|[^`])+`|[A-Za-z_][A-Za-z0-9_$]*)\s+/i.exec(definition);

        if (columnMatch &&
            !/^(PRIMARY|UNIQUE|KEY|INDEX|CONSTRAINT|FOREIGN|CHECK)\b/i.test(definition)) {
            const columnName = unquoteIdentifier(columnMatch[1]);
            columns.push(columnName);
            if (/\bPRIMARY\s+KEY\b/i.test(definition.slice(columnMatch[0].length))) {
                indexes.push({ name: 'PRIMARY', columns: [columnName], unique: true });
            }
            continue;
        }

        const indexMatch =
            /^(?:CONSTRAINT\s+(?:`[^`]+`|[A-Za-z_][A-Za-z0-9_$]*)\s+)?(PRIMARY\s+KEY|UNIQUE(?:\s+(?:KEY|INDEX))?|KEY|INDEX)\s*(`[^`]+`|[A-Za-z_][A-Za-z0-9_$]*)?\s*\(([^)]+)\)/i.exec(definition);

        if (indexMatch) {
            const kind = indexMatch[1].toUpperCase();
            const constraintName = /^CONSTRAINT\s+(`[^`]+`|[A-Za-z_][A-Za-z0-9_$]*)\s+/i.exec(definition);
            const name = kind.startsWith('PRIMARY')
                ? 'PRIMARY'
                : indexMatch[2] ? unquoteIdentifier(indexMatch[2])
                    : constraintName ? unquoteIdentifier(constraintName[1]) : parseColumnList(indexMatch[3])[0];

            indexes.push({
                name,
                columns: parseColumnList(indexMatch[3]),
                unique: kind.startsWith('UNIQUE') || kind.startsWith('PRIMARY')
            });
        }
    }

    return { tableName, columns, indexes };
}
async function readIndexDefinition(connection, tableName, indexName) {
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

async function verifyIndexDefinition(connection, tableName, expectedIndex) {
    const actual = await readIndexDefinition(connection, tableName, expectedIndex.name);
    if (!actual) {
        throw new Error(`Existing table ${tableName} is missing required index ${expectedIndex.name}.`);
    }

    const columnsMatch = actual.columns.length === expectedIndex.columns.length &&
        actual.columns.every((column, index) => column === expectedIndex.columns[index]);
    if (!actual.fullColumns || !columnsMatch || actual.unique !== expectedIndex.unique) {
        throw new Error(
            `Schema mismatch for ${tableName}.${expectedIndex.name}: expected ` +
            `${expectedIndex.unique ? 'UNIQUE ' : ''}(${expectedIndex.columns.join(', ')}), got ` +
            `${actual.unique ? 'UNIQUE ' : ''}(${actual.columns.join(', ')}).`
        );
    }
}

const MIGRATION_MANAGED_COLUMNS = new Set([
    'authors.is_archived',
    'categories.is_archived',
    'books.cover_path',
    'books.publication_date',
    'books.pdf_original_name',
    'books.pdf_stored_name',
    'books.pdf_size',
    'books.pdf_uploaded_at',
    'books.pdf_path',
    'books.processed_content_path',
]);

const MIGRATION_MANAGED_INDEXES = new Set([
    'authors.idx_authors_is_archived',
    'categories.idx_categories_is_archived',
    'books.idx_books_pdf_stored_name',
    'private_library_files.uq_private_library_files_stored_name',
    'private_library_files.idx_private_library_files_owner_id',
    'private_library_files.idx_private_library_files_created_at',
]);

async function verifyCreateTableDefinition(connection, targetDatabase, definition) {
    await verifyDatabase(connection, targetDatabase);

    const [rows] = await connection.query(
        `SELECT COLUMN_NAME, COLUMN_TYPE, DATA_TYPE, IS_NULLABLE
           FROM information_schema.COLUMNS
          WHERE TABLE_SCHEMA = DATABASE()
            AND TABLE_NAME = ?`,
        [definition.tableName]
    );
    const actualColumns = new Set(rows.map((row) => row.COLUMN_NAME));
    const missingColumns = definition.columns.filter((column) =>
        !actualColumns.has(column) &&
        !MIGRATION_MANAGED_COLUMNS.has(`${definition.tableName}.${column}`)
    );

    if (missingColumns.length) {
        throw new Error(
            `Existing table ${definition.tableName} is missing required column(s): ${missingColumns.join(', ')}.`
        );
    }

    if (definition.tableName === 'books') {
        const status = rows.find((row) => row.COLUMN_NAME === 'status');
        if (status && (status.DATA_TYPE !== 'enum' ||
            !/'ARCHIVED'/.test(status.COLUMN_TYPE))) {
            throw new Error('Schema mismatch for books.status: enum must include ARCHIVED.');
        }
    }

    // These indexes are explicitly created/validated by migrate.js after all
    // schema and seed statements have been processed. Other declared indexes
    // must already match the schema definition.
    for (const index of definition.indexes) {
        const managedKey = `${definition.tableName}.${index.name}`;
        if (MIGRATION_MANAGED_INDEXES.has(managedKey)) continue;
        await verifyIndexDefinition(connection, definition.tableName, index);
    }
}

function makeCreateTableIdempotent(statement) {
    return statement.replace(
        /^CREATE\s+TABLE\s+(?!IF\s+NOT\s+EXISTS\b)/i,
        'CREATE TABLE IF NOT EXISTS '
    );
}

function parseCreateIndexDefinition(statement) {
    const match = /^CREATE\s+(UNIQUE\s+)?INDEX\s+(`(?:``|[^`])+`|[A-Za-z_][A-Za-z0-9_$]*)\s+ON\s+(`(?:``|[^`])+`|[A-Za-z_][A-Za-z0-9_$]*)\s*\(([^)]+)\)/i.exec(statement);
    if (!match) {
        throw new Error('Could not safely parse CREATE INDEX statement; refusing to execute it.');
    }

    const indexName = unquoteIdentifier(match[2]);
    const tableName = unquoteIdentifier(match[3]);
    if (indexName.includes('.') || tableName.includes('.')) {
        throw new Error('Qualified index or table names are not permitted in test schema SQL.');
    }

    return {
        indexName,
        tableName,
        columns: parseColumnList(match[4]),
        unique: Boolean(match[1]),
    };
}

async function applySchema(connection, targetDatabase) {
    console.log('\n[TEST-INIT] Applying schema definitions...');
    const schemaPath = path.resolve(__dirname, '..', '..', 'database', 'schema.sql');
    const [[{ sql_mode: sqlMode }]] = await connection.query('SELECT @@SESSION.sql_mode AS sql_mode');
    const statements = readStatements(schemaPath, sqlMode);
    let created = 0;
    let alreadyPresent = 0;

    for (const statement of statements) {
        const upper = statement.trim().toUpperCase();

        // These directives are deliberately ignored. This connection was
        // already opened directly against digital_library_test.
        if (upper.startsWith('CREATE DATABASE') || upper.startsWith('USE ') || upper.startsWith('SET ')) {
            continue;
        }

        assertNoPrimarySchemaReferences(statement, sqlMode);

        if (/^CREATE\s+TABLE\b/i.test(statement)) {
            const definition = parseCreateTableDefinition(statement);
            await verifyDatabase(connection, targetDatabase);
            const [result] = await connection.query(makeCreateTableIdempotent(statement));
            if (result.warningStatus) alreadyPresent += 1;
            else created += 1;
            await verifyCreateTableDefinition(connection, targetDatabase, definition);
            continue;
        }

        if (/^CREATE\s+(?:UNIQUE\s+)?INDEX\b/i.test(statement)) {
            const definition = parseCreateIndexDefinition(statement);
            const existing = await readIndexDefinition(connection, definition.tableName, definition.indexName);
            if (existing) {
                const matches = existing.fullColumns && existing.columns.length === definition.columns.length &&
                    existing.columns.every((column, index) => column === definition.columns[index]) &&
                    existing.unique === definition.unique;
                if (!matches) {
                    throw new Error(`Existing index ${definition.tableName}.${definition.indexName} has a different definition.`);
                }
                alreadyPresent += 1;
                continue;
            }

            await verifyDatabase(connection, targetDatabase);
            await connection.query(statement);
            const verified = await readIndexDefinition(connection, definition.tableName, definition.indexName);
            if (!verified || !verified.fullColumns || verified.columns.length !== definition.columns.length ||
                !verified.columns.every((column, index) => column === definition.columns[index]) ||
                verified.unique !== definition.unique) {
                throw new Error(`Created index ${definition.tableName}.${definition.indexName} did not match its declared definition.`);
            }
            created += 1;
            continue;
        }

        throw new Error(`Unexpected statement in schema.sql; refusing to execute: ${statement.slice(0, 100)}`);
    }

    await verifyDatabase(connection, targetDatabase);
    console.log(`[TEST-INIT] Schema complete: ${created} created, ${alreadyPresent} already present and verified.`);
}
async function applySeed(connection, targetDatabase) {
    console.log('\n[TEST-INIT] Applying seed records using the SQL file as authored...');
    const seedPath = path.resolve(__dirname, '..', '..', 'database', 'seed.sql');
    const [[{ sql_mode: sqlMode }]] = await connection.query('SELECT @@SESSION.sql_mode AS sql_mode');
    const statements = readStatements(seedPath, sqlMode);
    let executed = 0;

    for (const statement of statements) {
        const upper = statement.trim().toUpperCase();
        if (upper.startsWith('USE ') || upper.startsWith('SET ')) continue;

        if (!upper.startsWith('INSERT INTO ') && !upper.startsWith('INSERT IGNORE INTO ')) {
            throw new Error(`Unexpected statement in seed.sql; refusing to execute: ${statement.slice(0, 100)}`);
        }

        assertNoPrimarySchemaReferences(statement, sqlMode);
        await verifyDatabase(connection, targetDatabase);
        await connection.query(statement);
        executed += 1;
    }

    await verifyDatabase(connection, targetDatabase);
    console.log(`[TEST-INIT] Seed complete: ${executed} INSERT statements processed.`);
}

async function main() {
    const targetDatabase = validateTarget(process.env.TEST_DB_NAME);
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
            database: targetDatabase,
        });

        await verifyDatabase(connection, targetDatabase);
        console.log(`[TEST-INIT] Confirmed isolated target: ${targetDatabase}`);

        await applySchema(connection, targetDatabase);
        await applySeed(connection, targetDatabase);

        const { applyMigrations } = require('./migrate');
        await applyMigrations(connection, targetDatabase);

        await verifyDatabase(connection, targetDatabase);
        const [tables] = await connection.query('SHOW TABLES');
        const [roles] = await connection.query('SELECT role_name FROM roles ORDER BY role_id');

        console.log('\n[TEST-INIT] Initialization completed successfully.');
        console.log(`  Database: ${targetDatabase}`);
        console.log(`  Tables: ${tables.length}`);
        console.log(`  Roles: ${roles.map((row) => row.role_name).join(', ')}`);
        console.log('[TEST-INIT] No database creation, drop, truncate, reset, or database-switch statement was executed.');
    } finally {
        if (connection) {
            await connection.end();
            console.log('[TEST-INIT] Database connection closed.');
        }
    }
}

if (require.main === module) {
    main().catch((error) => {
        console.error('[TEST-INIT] Initialization failed:', error.message);
        process.exitCode = 1;
    });
}

module.exports = {
    validateTarget,
    splitSqlStatements,
    assertNoPrimarySchemaReferences,
    verifyDatabase,
    parseCreateTableDefinition,
    applySchema,
    applySeed,
};