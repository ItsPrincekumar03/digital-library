'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');

// Expose private validators in an isolated module without creating a pool or server.
function load(relative, exports, mocks = {}, suffix = '', env = {}) {
    const filename = path.resolve(__dirname, relative);
    const realRequire = createRequire(filename);
    const context = {
        require: Object.assign((name) => name in mocks ? mocks[name] : realRequire(name), { main: null }),
        module: { exports: {} }, __dirname: path.dirname(filename), process: { env }, console,
    };
    const source = fs.readFileSync(filename, 'utf8');
    vm.runInNewContext(source + '\n' + suffix + '\nmodule.exports = {' + exports + '};', context, { filename });
    return context.module.exports;
}
const init = load('../backend/scripts/test-init.js',
    'verifyDatabase, assertNoPrimarySchemaReferences, parseCreateTableDefinition, verifyCreateTableDefinition, verifyIndexDefinition, applySeed');
const migration = load('../backend/scripts/migrate.js',
    'verifyColumnDefinition, ensureIndex, verifyPrivateLibraryForeignKey');
const target = 'digital_library_test';
function connection(rows) {
    return { query: async (sql) => [sql.includes('SELECT DATABASE()') ? [{ current_db: target }] : rows] };
}

test('database guard rejects unsafe targets before querying', async () => {
    for (const name of ['digital_library', '', undefined, 'other']) {
        await assert.rejects(init.verifyDatabase({ query() { assert.fail('unsafe query'); } }, name), /Only/);
    }
    await init.verifyDatabase(connection([]), target);
    await assert.rejects(init.verifyDatabase({ query: async () => [[{ current_db: 'digital_library' }]] }, target), /isolation/);
});

test('SQL mode distinguishes identifiers from literals', () => {
    const guard = init.assertNoPrimarySchemaReferences;
    for (const sql of ['INSERT INTO digital_library.books VALUES (1)', 'INSERT INTO `digital_library`.`books` VALUES (1)']) {
        assert.throws(() => guard(sql), /Blocked/);
    }
    assert.throws(() => guard('INSERT INTO "digital_library"."books" VALUES (1)', 'ANSI_QUOTES'), /Blocked/);
    guard('INSERT INTO books VALUES ("digital_library.books")');
    guard("INSERT INTO books VALUES ('digital_library.books')", 'ANSI_QUOTES');
    assert.throws(() => guard("INSERT INTO books SELECT 'x\\', digital_library.books.id", 'NO_BACKSLASH_ESCAPES'), /Blocked/);
});

test('table parser retains named unique constraints and inline primary keys', () => {
    const definition = init.parseCreateTableDefinition('CREATE TABLE roles (role_id BIGINT PRIMARY KEY, role_name VARCHAR(30), CONSTRAINT uq_roles_role_name UNIQUE (role_name), KEY plain_key (role_id), UNIQUE KEY `quoted_key` (`role_name`))');
    assert.equal(definition.indexes.length, 4);
    assert.equal(definition.indexes[0].name, 'PRIMARY');
    assert.equal(definition.indexes[1].name, 'uq_roles_role_name');
    assert.equal(definition.indexes[1].unique, true);
    assert.equal(definition.indexes[2].name, 'plain_key');
    assert.equal(definition.indexes[3].name, 'quoted_key');
});

test('BIGINT display widths are compatible; signedness and nullability remain required', () => {
    const expected = { columnType: 'bigint unsigned', nullable: 'NO' };
    const verify = (type, nullable = 'NO') => migration.verifyColumnDefinition({ COLUMN_TYPE: type, IS_NULLABLE: nullable }, expected, 'files', 'id');
    verify('bigint(20) unsigned');
    verify('bigint unsigned');
    assert.throws(() => verify('bigint(20)'), /mismatch/);
    assert.throws(() => verify('bigint(20) unsigned', 'YES'), /mismatch/);
});

test('both index validators reject prefix indexes and accept full columns', async () => {
    for (const prefix of [null, 10]) {
        const conn = connection([{ COLUMN_NAME: 'name', NON_UNIQUE: 0, SUB_PART: prefix }]);
        const checks = [
            () => init.verifyIndexDefinition(conn, 'roles', { name: 'uq_name', columns: ['name'], unique: true }),
            () => migration.ensureIndex(conn, target, 'roles', 'uq_name', ['name'], true, 'unused'),
        ];
        for (const check of checks) {
            if (prefix === null) await check();
            else await assert.rejects(check(), /mismatch/);
        }
    }
});

test('foreign key requires matching schema and both cascade rules', async () => {
    const valid = { COLUMN_NAME: 'owner_id', REFERENCED_TABLE_SCHEMA: target, REFERENCED_TABLE_NAME: 'users', REFERENCED_COLUMN_NAME: 'user_id', DELETE_RULE: 'CASCADE', UPDATE_RULE: 'CASCADE' };
    await migration.verifyPrivateLibraryForeignKey(connection([valid]), target);
    for (const [key, value] of [['REFERENCED_TABLE_SCHEMA', 'digital_library'], ['DELETE_RULE', 'RESTRICT'], ['UPDATE_RULE', 'NO ACTION'], ['REFERENCED_COLUMN_NAME', 'other']]) {
        await assert.rejects(migration.verifyPrivateLibraryForeignKey(connection([{ ...valid, [key]: value }]), target), /missing|reference/);
    }
});

test('existing books require ARCHIVED enum and missing-column checks remain active', async () => {
    const definition = { tableName: 'books', columns: ['status', 'pdf_size'], indexes: [] };
    for (const type of ["enum('DRAFT','ARCHIVED')", "enum('DRAFT')", 'varchar(30)']) {
        const check = () => init.verifyCreateTableDefinition(connection([{ COLUMN_NAME: 'status', COLUMN_TYPE: type, DATA_TYPE: type.startsWith('enum') ? 'enum' : 'varchar' }]), target, definition);
        if (type.includes('ARCHIVED')) await check();
        else await assert.rejects(check(), /ARCHIVED/);
    }
    await assert.rejects(init.verifyCreateTableDefinition(connection([]), target, definition), /missing required column/);
});

test('connection health follows server case rules and normal startup allows TEST_DB_NAME', async () => {
    for (const mode of [0, 1, 2]) {
        let released = false;
        const conn = { ping: async () => {}, query: async () => [[{ current_db: 'digital_library', lower_case_table_names: mode }]], release() { released = true; } };
        const db = load('../backend/src/config/database.js', 'testConnection', {
            'mysql2/promise': { createPool: () => ({ getConnection: async () => conn }) },
            './db.config': { database: 'Digital_Library' },
        }, '', { TEST_DB_NAME: target });
        assert.equal((await db.testConnection()).success, mode !== 0);
        assert.equal(released, true);
    }
});

test('publishing cleanup deletes chapters first and still deletes the user after artifact failure', async () => {
    const source = fs.readFileSync(path.join(__dirname, 'publishing-workflow.test.js'), 'utf8');
    const cleanupSource = source.slice(source.indexOf('async function cleanupTestRecords()'), source.indexOf('function createMinimalPdf()'));
    for (const artifactFails of [false, true]) {
        const queries = [];
        const artifactError = new Error('artifact deletion failed');
        const cleanup = vm.runInNewContext(cleanupSource + '\ncleanupTestRecords', {
            createdBookIds: new Set([12]), adminUserId: 7, createdBookTitles: [],
            testUserId: 9, testUserEmail: 'unique@example.com', console,
            cleanupGeneratedPdfArtifacts: async () => { if (artifactFails) throw artifactError; },
            pool: { query: async (sql, values) => { queries.push({ sql, values }); return [[{ book_id: 12 }]]; } },
        });
        if (artifactFails) await assert.rejects(cleanup(), (error) => error === artifactError);
        else await cleanup();
        const deletes = queries.filter(({ sql }) => sql.startsWith('DELETE'));
        assert.equal(deletes.length, artifactFails ? 1 : 3);
        assert.match(deletes.at(-1).sql, /DELETE FROM users WHERE user_id = \? AND email = \?/);
        if (!artifactFails) {
            assert.match(deletes[0].sql, /DELETE FROM chapters WHERE book_id IN/);
            assert.match(deletes[1].sql, /DELETE FROM books WHERE book_id IN/);
            assert.equal(deletes[0].values[0], 12);
        }
    }
});

test('missing role unique constraint is rejected during existing-table verification', async () => {
    const definition = init.parseCreateTableDefinition('CREATE TABLE roles (role_name VARCHAR(30), CONSTRAINT uq_roles_role_name UNIQUE (role_name))');
    const conn = { query: async (sql) => [sql.includes('SELECT DATABASE()') ? [{ current_db: target }]
        : sql.includes('information_schema.COLUMNS') ? [{ COLUMN_NAME: 'role_name' }] : []] };
    await assert.rejects(init.verifyCreateTableDefinition(conn, target, definition), /missing required index uq_roles_role_name/);
});

test('seed execution reads the effective ANSI_QUOTES mode before accepting writes', async () => {
    const seeded = load('../backend/scripts/test-init.js', 'applySeed', {
        fs: { existsSync: () => true, readFileSync: () => 'INSERT INTO "digital_library"."books" VALUES (1);' },
    });
    const queries = [];
    const conn = { query: async (sql) => {
        queries.push(sql);
        if (sql.includes('sql_mode')) return [[{ sql_mode: 'ANSI_QUOTES' }]];
        throw new Error('Unsafe query reached the connection');
    } };
    await assert.rejects(seeded.applySeed(conn, target), /Blocked SQL/);
    assert.equal(queries.length, 1);
});

test('publishing loads env then overrides DB_NAME before importing db.config', () => {
    const source = fs.readFileSync(path.join(__dirname, 'publishing-workflow.test.js'), 'utf8');
    const env = {};
    const calls = [];
    vm.runInNewContext(source.slice(0, source.indexOf("const { pool }")), {
        process: { env }, require(name) {
            calls.push(name);
            if (name.endsWith('/env')) Object.assign(env, { TEST_DB_NAME: target, TEST_ADMIN_EMAIL: 'test@example.com', TEST_ADMIN_PASSWORD: 'synthetic', DB_NAME: 'digital_library' });
            if (name.endsWith('/db.config')) {
                assert.equal(env.DB_NAME, target);
                return { database: env.DB_NAME };
            }
            return {};
        },
    });
    assert.ok(calls.indexOf('../backend/src/config/env') < calls.indexOf('../backend/src/config/db.config'));
});
