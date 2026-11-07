'use strict';

/**
 * Isolated end-to-end publishing workflow test.
 *
 * Safety requirements:
 * - Requires TEST_DB_NAME=digital_library_test before loading the DB module.
 * - Requires a separately provisioned test admin via TEST_ADMIN_EMAIL and
 *   TEST_ADMIN_PASSWORD; no demo or production credentials are embedded.
 * - Starts the Express app in-process on an ephemeral 127.0.0.1 port so API
 *   requests and direct SQL cleanup share the exact same configured pool.
 * - Creates only uniquely named test records and never modifies existing books.
 * - Cleans up its own books, generated public PDF artifacts, and test user in
 *   finally; cleanup failures are reported as test failures.
 */

const crypto = require('crypto');

function validateTestEnvironment() {
    const expectedDatabase = process.env.TEST_DB_NAME;
    if (expectedDatabase !== 'digital_library_test') {
        throw new Error(
            'Blocked: set TEST_DB_NAME exactly to digital_library_test before running this test.'
        );
    }

    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
        throw new Error(
            'TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD must be supplied for a fresh local test-admin account.'
        );
    }

    // This must happen before importing database.js, app.js, or any repository.
    process.env.DB_NAME = expectedDatabase;
    return { expectedDatabase, adminEmail, adminPassword };
}

const testConfig = validateTestEnvironment();
const dbConfig = require('../backend/src/config/db.config');
if (dbConfig.database !== testConfig.expectedDatabase) {
    throw new Error('Blocked: configured DB_NAME does not match TEST_DB_NAME.');
}

const { pool } = require('../backend/src/config/database');
const app = require('../backend/src/app');
const {
    resolvePublicPdfPath,
    resolvePublicProcessedPath,
    resolvePublicImagesDir,
    buildPublicImagesDirName,
    deleteFileIfExists,
    deleteDirectoryIfExists,
} = require('../backend/src/utils/fileStorage');

const UUID_PDF_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$/i;
const UUID_PROCESSED_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.processed\.json$/i;

let passed = 0;
let failed = 0;
let server;
let baseUrl;
let adminUserId = null;
let testUserId = null;
const createdBookIds = new Set();
const createdBookTitles = [];
let testUserEmail = null;

function assert(description, condition, actual) {
    if (condition) {
        console.log(`[PASS] ${description}`);
        passed += 1;
    } else {
        console.error(`[FAIL] ${description} -> got:`, actual);
        failed += 1;
    }
}

function requireValue(description, value) {
    if (value === undefined || value === null || value === '') {
        throw new Error(`Setup failed: ${description} was not returned by the API.`);
    }
    return value;
}

function startServer() {
    return new Promise((resolve, reject) => {
        const instance = app.listen(0, '127.0.0.1');
        instance.once('error', reject);
        instance.once('listening', () => {
            const address = instance.address();
            if (!address || typeof address === 'string') {
                instance.close();
                reject(new Error('Could not determine the ephemeral test-server port.'));
                return;
            }
            resolve({ instance, url: `http://127.0.0.1:${address.port}` });
        });
    });
}

function closeServer(instance) {
    if (!instance || !instance.listening) return Promise.resolve();
    return new Promise((resolve, reject) => {
        instance.close((error) => (error ? reject(error) : resolve()));
    });
}

async function request(method, urlPath, { token = '', body = null, formData = null } = {}) {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    let requestBody = null;
    if (formData) {
        requestBody = formData;
    } else if (body !== null) {
        headers['Content-Type'] = 'application/json';
        requestBody = JSON.stringify(body);
    }

    const response = await fetch(`${baseUrl}${urlPath}`, {
        method,
        headers,
        body: requestBody,
    });

    let json = null;
    try {
        json = await response.json();
    } catch {
        // Preserve the HTTP status so the assertion reports a useful failure.
    }

    return { status: response.status, json };
}

async function verifyDatabaseTarget() {
    const [rows] = await pool.query('SELECT DATABASE() AS current_db');
    const actualDatabase = rows[0]?.current_db;
    if (actualDatabase !== testConfig.expectedDatabase) {
        throw new Error(
            `Database isolation failure: expected ${testConfig.expectedDatabase}, got ${actualDatabase}.`
        );
    }
    console.log(`[SAFETY] Verified database target: ${actualDatabase}`);
}

async function createBook(adminToken, title, description) {
    createdBookTitles.push(title);
    const response = await request('POST', '/api/books', {
        token: adminToken,
        body: { title, description },
    });
    assert(`Admin creates book "${title}" (201)`, response.status === 201, response.status);
    const bookId = response.json?.data?.book?.book_id;
    if (bookId !== undefined && bookId !== null) createdBookIds.add(Number(bookId));
    return requireValue(`book ID for ${title}`, bookId);
}
async function cleanupGeneratedPdfArtifacts(bookRows) {
    for (const book of bookRows) {
        const storedPdfName = book.pdf_stored_name;
        if (typeof storedPdfName === 'string' && UUID_PDF_PATTERN.test(storedPdfName)) {
            await deleteFileIfExists(resolvePublicPdfPath(storedPdfName));
            await deleteDirectoryIfExists(
                resolvePublicImagesDir(buildPublicImagesDirName(storedPdfName))
            );
        }

        const processedName = book.processed_content_path;
        if (typeof processedName === 'string' && UUID_PROCESSED_PATTERN.test(processedName)) {
            await deleteFileIfExists(resolvePublicProcessedPath(processedName));
        }
    }
}

async function cleanupTestRecords() {
    // Discover by both captured IDs and unique owner/title pairs. This covers
    // a request that inserted a row but returned an incomplete response.
    const ids = new Set([...createdBookIds].filter(Number.isSafeInteger));

    if (adminUserId && createdBookTitles.length > 0) {
        const placeholders = createdBookTitles.map(() => '?').join(', ');
        const [rows] = await pool.query(
            `SELECT book_id FROM books WHERE owner_id = ? AND title IN (${placeholders})`,
            [adminUserId, ...createdBookTitles]
        );
        for (const row of rows) ids.add(Number(row.book_id));
    }

    const bookIds = [...ids];
    if (bookIds.length > 0) {
        const placeholders = bookIds.map(() => '?').join(', ');
        const [bookRows] = await pool.query(
            `SELECT book_id, pdf_stored_name, processed_content_path
               FROM books
              WHERE book_id IN (${placeholders})`,
            bookIds
        );

        // Remove only files with the application's generated UUID names.
        // If file cleanup fails, retain the DB rows and report the failure.
        await cleanupGeneratedPdfArtifacts(bookRows);
        await pool.query(`DELETE FROM books WHERE book_id IN (${placeholders})`, bookIds);
        console.log(`[CLEANUP] Removed ${bookIds.length} test-owned book record(s).`);
    }

    // The registration endpoint may commit the user but return an incomplete
    // response (or the HTTP connection may fail after the commit). In that
    // case testUserId is unavailable, so recover the row by its unique,
    // per-run generated email before cleanup.
    if (testUserEmail) {
        let cleanupUserId = Number.isSafeInteger(testUserId) && testUserId > 0
            ? testUserId
            : null;

        if (!cleanupUserId) {
            const [userRows] = await pool.query(
                'SELECT user_id FROM users WHERE email = ? LIMIT 1',
                [testUserEmail]
            );
            cleanupUserId = userRows[0] ? Number(userRows[0].user_id) : null;
        }

        if (Number.isSafeInteger(cleanupUserId) && cleanupUserId > 0) {
            await pool.query(
                'DELETE FROM users WHERE user_id = ? AND email = ?',
                [cleanupUserId, testUserEmail]
            );
            console.log('[CLEANUP] Removed the test-created user when present.');
        }
    }
}

function createMinimalPdf() {
    const contentStream =
        'BT\n' +
        '/F1 18 Tf\n' +
        '50 720 Td\n' +
        '(Welcome to Digital Library PDF) Tj\n' +
        'ET\n';

    const streamLength = Buffer.byteLength(contentStream, 'latin1');
    const objects = [
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ' +
        '/Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
        `4 0 obj\n<< /Length ${streamLength} >>\nstream\n${contentStream}endstream\nendobj\n`,
        '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
    ];

    let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const objectOffsets = [0];

    for (const object of objects) {
        objectOffsets.push(Buffer.byteLength(pdf, 'latin1'));
        pdf += object;
    }

    const crossReferenceOffset = Buffer.byteLength(pdf, 'latin1');
    const crossReferenceEntries = [
        '0000000000 65535 f \n',
        ...objectOffsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`),
    ];

    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += crossReferenceEntries.join('');
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
    pdf += `startxref\n${crossReferenceOffset}\n%%EOF\n`;

    return Buffer.from(pdf, 'latin1');
}

async function runWorkflow() {
    console.log('=== Isolated Publishing Workflow Verification ===');
    await verifyDatabaseTarget();

    const started = await startServer();
    server = started.instance;
    baseUrl = started.url;
    console.log(`[SAFETY] Express test app listening on ${baseUrl}`);

    const adminLogin = await request('POST', '/api/auth/login', {
        body: {
            email: testConfig.adminEmail,
            password: testConfig.adminPassword,
        },
    });
    assert('Configured test admin login succeeds (200)', adminLogin.status === 200, adminLogin.status);
    const adminToken = requireValue('admin access token', adminLogin.json?.data?.token);
    assert('Configured account has ADMIN role', adminLogin.json?.data?.user?.role_name === 'ADMIN', adminLogin.json?.data?.user?.role_name);
    adminUserId = Number(requireValue('admin user ID', adminLogin.json?.data?.user?.user_id));

    const stamp = `${Date.now()}_${crypto.randomUUID()}`;
    const userPassword = `Workflow!${crypto.randomUUID()}aA1`;
    testUserEmail = `workflow_${stamp}@example.test`;

    const registerResponse = await request('POST', '/api/auth/register', {
        body: { fullName: 'Module 17 Workflow User', email: testUserEmail, password: userPassword },
    });
    assert('Test user registration succeeds (201)', registerResponse.status === 201, registerResponse.status);
    const returnedTestUserId = Number(requireValue('registered test user ID', registerResponse.json?.data?.user?.user_id));
    testUserId = Number.isSafeInteger(returnedTestUserId) && returnedTestUserId > 0
        ? returnedTestUserId
        : null;

    const userLogin = await request('POST', '/api/auth/login', {
        body: { email: testUserEmail, password: userPassword },
    });
    assert('Test user login succeeds (200)', userLogin.status === 200, userLogin.status);
    const userToken = requireValue('test user access token', userLogin.json?.data?.token);

    // Part A: chapter-based public book workflow.
    const bookATitle = `Module 17 Chapter Workflow ${stamp}`;
    const bookAId = await createBook(adminToken, bookATitle, 'Isolated chapter publishing test.');

    const chapterResponse = await request('POST', `/api/books/${bookAId}/chapters`, {
        token: adminToken,
        body: {
            chapterNumber: 1,
            title: 'Test Chapter',
            content: 'The first paragraph of the isolated workflow.\n\nThe second paragraph.',
        },
    });
    assert('Admin creates chapter (201)', chapterResponse.status === 201, chapterResponse.status);
    const chapterId = requireValue('created chapter ID', chapterResponse.json?.data?.chapter?.chapter_id);

    const publishChapter = await request('PATCH', `/api/chapters/${chapterId}/publish`, { token: adminToken });
    assert('Admin publishes chapter (200)', publishChapter.status === 200, publishChapter.status);

    const publishBook = await request('PATCH', `/api/books/${bookAId}/publish`, { token: adminToken });
    assert('Admin publishes chapter-based book (200)', publishBook.status === 200, publishBook.status);

    const [bookARows] = await pool.query('SELECT status FROM books WHERE book_id = ?', [bookAId]);
    assert('Chapter-based book is PUBLISHED in the test database', bookARows[0]?.status === 'PUBLISHED', bookARows[0]?.status);

    const listingA = await request('GET', '/api/books', { token: userToken });
    assert('User can load public catalogue (200)', listingA.status === 200, listingA.status);
    assert('Published chapter book appears in catalogue', listingA.json?.data?.books?.some((book) => Number(book.book_id) === Number(bookAId)) === true, listingA.json?.data?.books?.length);

    const detailA = await request('GET', `/api/books/${bookAId}`, { token: userToken });
    assert('User can load published book details (200)', detailA.status === 200, detailA.status);
    assert('Book details report PUBLISHED status', detailA.json?.data?.book?.status === 'PUBLISHED', detailA.json?.data?.book?.status);

    const documentA = await request('GET', `/api/books/${bookAId}/document`, { token: userToken });
    assert('Reader can load chapter document (200)', documentA.status === 200, documentA.status);
    const chapterDocument = documentA.json?.data?.document;
    assert('Reader document source is chapters', chapterDocument?.source === 'chapters', chapterDocument?.source);
    assert('Reader document contains one page', chapterDocument?.pageCount === 1, chapterDocument?.pageCount);
    // Part B: PDF import and publishing workflow.
    const bookBTitle = `Module 17 PDF Workflow ${stamp}`;
    const bookBId = await createBook(adminToken, bookBTitle, 'Isolated PDF publishing test.');

    const minimalPdf = createMinimalPdf();

    const formData = new FormData();
    formData.append('pdf', new Blob([minimalPdf], { type: 'application/pdf' }), 'module17-guide.pdf');

    const uploadResponse = await request('POST', `/api/books/${bookBId}/pdf`, {
        token: adminToken,
        formData,
    });
    assert('Admin uploads PDF (200)', uploadResponse.status === 200, uploadResponse.status);
    assert('PDF upload reports processed text', uploadResponse.json?.data?.book?.has_processed_text === true, uploadResponse.json?.data?.book?.has_processed_text);

    const publishPdfBook = await request('PATCH', `/api/books/${bookBId}/publish`, { token: adminToken });
    assert('Admin publishes PDF book (200)', publishPdfBook.status === 200, publishPdfBook.status);

    const [bookBRows] = await pool.query(
        'SELECT status, pdf_original_name, pdf_stored_name, processed_content_path FROM books WHERE book_id = ?',
        [bookBId]
    );
    assert('PDF book is PUBLISHED in the test database', bookBRows[0]?.status === 'PUBLISHED', bookBRows[0]?.status);
    assert('Original PDF filename is stored', bookBRows[0]?.pdf_original_name === 'module17-guide.pdf', bookBRows[0]?.pdf_original_name);
    assert('Generated PDF filename follows UUID format', UUID_PDF_PATTERN.test(bookBRows[0]?.pdf_stored_name || ''), bookBRows[0]?.pdf_stored_name);

    const documentB = await request('GET', `/api/books/${bookBId}/document`, { token: userToken });
    assert('Reader can load imported PDF document (200)', documentB.status === 200, documentB.status);
    const pdfText = documentB.json?.data?.document?.pages?.[0]?.text || '';
    assert('Extracted PDF text contains expected phrase', pdfText.includes('Welcome to Digital Library PDF'), pdfText);

    // Part C: draft and archived book access control.
    const draftTitle = `Module 17 Draft Workflow ${stamp}`;
    const draftBookId = await createBook(adminToken, draftTitle, 'Must remain private to non-admin users.');

    const draftDetail = await request('GET', `/api/books/${draftBookId}`, { token: userToken });
    assert('Normal user cannot view a draft book (404)', draftDetail.status === 404, draftDetail.status);
    assert('Draft response uses BOOK_NOT_PUBLISHED', draftDetail.json?.code === 'BOOK_NOT_PUBLISHED', draftDetail.json?.code);

    const draftDocument = await request('GET', `/api/books/${draftBookId}/document`, { token: userToken });
    assert('Normal user cannot read a draft document (404)', draftDocument.status === 404, draftDocument.status);

    const archiveResponse = await request('PATCH', `/api/books/${bookAId}/archive`, { token: adminToken });
    assert('Admin archives the test-created book (200)', archiveResponse.status === 200, archiveResponse.status);

    const archivedDetail = await request('GET', `/api/books/${bookAId}`, { token: userToken });
    assert('Normal user cannot view an archived book (404)', archivedDetail.status === 404, archivedDetail.status);
    assert('Archived response uses BOOK_NOT_PUBLISHED', archivedDetail.json?.code === 'BOOK_NOT_PUBLISHED', archivedDetail.json?.code);

    const archivedDocument = await request('GET', `/api/books/${bookAId}/document`, { token: userToken });
    assert('Normal user cannot read an archived document (404)', archivedDocument.status === 404, archivedDocument.status);
}

async function main() {
    let fatalError = null;

    try {
        await runWorkflow();
    } catch (error) {
        fatalError = error;
        console.error('[ERROR] Publishing workflow stopped:', error.message);
    } finally {
        try {
            await closeServer(server);
        } catch (error) {
            fatalError = fatalError || error;
            console.error('[CLEANUP ERROR] Could not close the in-process test server:', error.message);
        }

        try {
            // Cleanup only runs after the DB target was independently verified.
            if (adminUserId || createdBookIds.size > 0 || testUserId || testUserEmail) {
                await verifyDatabaseTarget();
                await cleanupTestRecords();
            }
        } catch (error) {
            fatalError = fatalError || error;
            console.error('[CLEANUP ERROR] Test-owned data cleanup failed:', error.message);
        }

        try {
            await pool.end();
        } catch (error) {
            fatalError = fatalError || error;
            console.error('[CLEANUP ERROR] Could not close the database pool:', error.message);
        }
    }

    console.log(`\n=== Publishing Workflow Result: ${passed} passed, ${failed} failed ===`);
    if (fatalError || failed > 0) {
        process.exitCode = 1;
    } else {
        process.exitCode = 0;
    }
}

main().catch((error) => {
    // Last-resort handler; main's finally normally handles all resource cleanup.
    console.error('[FATAL] Unexpected test runner error:', error.message);
    process.exitCode = 1;
});