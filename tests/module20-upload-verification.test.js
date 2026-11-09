// Module 20 — PDF/EPUB upload and format validation tests.
// Requires TEST_DB_NAME=digital_library_test and backend on port 5001.
// Run from project root: node tests/module20-upload-verification.test.js

if (process.env.TEST_DB_NAME !== 'digital_library_test') {
    console.error(
        'Test blocked: TEST_DB_NAME must equal digital_library_test.'
    );
    process.exit(1);
}

process.env.DB_NAME = process.env.TEST_DB_NAME;

const fs = require('fs/promises');
const path = require('path');
const { pool } = require('../backend/src/config/database');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5001';

let passed = 0;
let failed = 0;

function assert(description, condition, actual) {
    if (condition) {
        console.log(`[PASS] ${description}`);
        passed++;
    } else {
        console.error(`[FAIL] ${description} -> got:`, actual);
        failed++;
    }
}

async function verifyDbTarget() {
    const [rows] = await pool.query('SELECT DATABASE() AS current_db');
    if (rows[0].current_db !== 'digital_library_test') {
        throw new Error(`Isolation failure: expected digital_library_test, got ${rows[0].current_db}`);
    }
}

async function run() {
    console.log('=== Module 20 — Upload Format Validation Tests ===\n');

    await verifyDbTarget();

    // 1. Format validation (unit-level checks)
    const {
        validateFormat,
        validateExtension,
        validateMimeType,
    } = require('../backend/src/utils/formatValidation');

    let result = validateFormat('PDF');
    assert('PDF format accepted', result.valid === true, result);

    result = validateFormat('EPUB');
    assert('EPUB format accepted', result.valid === true, result);

    result = validateFormat('pdf');
    assert('Lowercase PDF accepted (case insensitive)', result.valid === true, result);

    result = validateFormat('EP');
    assert('Unsupported format rejected', result.valid === false, result);

    result = validateFormat('');
    assert('Empty format rejected', result.valid === false, result);

    result = validateExtension('PDF', 'test.pdf');
    assert('PDF extension matches', result.valid === true, result);

    result = validateExtension('EPUB', 'test.epub');
    assert('EPUB extension matches', result.valid === true, result);

    result = validateExtension('PDF', 'test.epub');
    assert('EPUB extension rejected for PDF format', result.valid === false, result);

    result = validateMimeType('PDF', 'application/pdf');
    assert('PDF MIME accepted', result.valid === true, result);

    result = validateMimeType('EPUB', 'application/epub+zip');
    assert('EPUB MIME accepted', result.valid === true, result);

    result = validateMimeType('PDF', 'application/epub+zip');
    assert('EPUB MIME rejected for PDF format', result.valid === false, result);

    // 2. EPUB validation (unit-level checks)
    const { validateEpubFile } = require('../backend/src/utils/epubValidation');

    // Check test files exist
    let pdfTestExists = true;
    let epubTestExists = true;
    try {
        await fs.access(path.resolve('scratch/test.pdf'));
    } catch { pdfTestExists = false; }
    try {
        await fs.access(path.resolve('scratch/test.epub'));
    } catch { epubTestExists = false; }

    if (epubTestExists) {
        try {
            await validateEpubFile(path.resolve('scratch/test.epub'));
            assert('Valid EPUB passes validation', true);
        } catch (err) {
            assert('Valid EPUB passes validation', false, err.message);
        }
    } else {
        console.log('[SKIP] test.epub not found');
    }

    console.log(`\n${passed} passed, ${failed} failed`);

    await pool.end();
    process.exitCode = failed > 0 ? 1 : 0;
}

run().catch(async (err) => {
    console.error('Test failed:', err);
    try { await pool.end(); } catch {}
    process.exitCode = 1;
});
