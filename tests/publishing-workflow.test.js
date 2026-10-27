if (process.env.TEST_DB_NAME !== 'digital_library_test') {
    console.error(
        'Test blocked: TEST_DB_NAME must equal digital_library_test.'
    );
    process.exit(1);
}

process.env.DB_NAME = process.env.TEST_DB_NAME;
const { pool } = require('../backend/src/config/database');
const fs = require('fs/promises');
const path = require('path');

const {
    resolvePublicPdfPath,
    resolvePublicProcessedPath,
    buildPublicImagesDirName,
    resolvePublicImagesDir,
} = require('../backend/src/utils/fileStorage');

const BASE_URL = process.env.BASE_URL;

if (BASE_URL !== 'http://localhost:5001') {
    console.error(
        'Test blocked: BASE_URL must be http://localhost:5001.'
    );
    process.exit(1);
}

async function request(method, urlPath, { cookie = '', body = null, formData = null } = {}) {
    const headers = {};
    if (cookie) headers['Cookie'] = cookie;
    let reqBody = null;

    if (formData) {
        reqBody = formData;
    } else if (body) {
        headers['Content-Type'] = 'application/json';
        reqBody = JSON.stringify(body);
    }

    const res = await fetch(`${BASE_URL}${urlPath}`, {
        method,
        headers,
        body: reqBody,
    });

    const setCookie = res.headers.get('set-cookie');
    let newCookie = cookie;
    if (setCookie && setCookie.startsWith('token=')) {
        newCookie = setCookie.split(';')[0];
    }

    let json = null;
    try {
        json = await res.json();
    } catch {
        json = null;
    }

    return { status: res.status, json, cookie: newCookie };
}

let passed = 0;
let failed = 0;
let cleanupFailed = false;

function assert(description, condition, actual) {
    if (condition) {
        console.log(`[PASS] ${description}`);
        passed++;
    } else {
        console.error(`[FAIL] ${description} -> got:`, actual);
        failed++;
    }
}

async function cleanupStep(label, action) {
    try {
        await action();
    } catch (err) {
        if (err.code === 'ENOENT') {
            console.log(`[CLEANUP] Already absent: ${label}`);
            return;
        }

        cleanupFailed = true;
        console.error(`[CLEANUP] ${label} failed:`, err.message);
    }
}

async function run() {
    console.log(
        '=== Step 6: Full End-to-End Publishing Workflow Verification ===\n'
    );

    const stamp = Date.now();

    let userEmail = null;
    let adminCookie = '';
    let userCookie = '';

    let bookAId;
    let bookBId;
    let draftBookId;
    let regBookId;

    try {
        // Setup: Admin and User sessions
        const adminLogin = await request('POST', '/api/auth/login', {
            body: {
                email: 'demoadmin@example.com',
                password: 'Demoadmin@123',
            },
        });

        assert('Admin login (200)', adminLogin.status === 200, adminLogin.status);
        adminCookie = adminLogin.cookie;

        userEmail = `workflow_user_${stamp}@example.com`;

        const userReg = await request('POST', '/api/auth/register', {
            body: {
                fullName: 'Workflow User',
                email: userEmail,
                password: 'Passw0rd!Workflow',
            },
        });

        assert('User register (201)', userReg.status === 201, userReg.status);

        const userLogin = await request('POST', '/api/auth/login', {
            body: {
                email: userEmail,
                password: 'Passw0rd!Workflow',
            },
        });

        assert('User login (200)', userLogin.status === 200, userLogin.status);
        userCookie = userLogin.cookie;

        // Keep your existing PART A, PART B, PART C and PART D
        // test code here, unchanged.
    // -------------------------------------------------------------
    // PART A: Workflow with Chapter-based book
    // -------------------------------------------------------------
    console.log('\n--- Part A: Chapter-based Book Publishing Workflow ---');

    // 1. Admin creates a new book
    const createBookRes = await request('POST', '/api/books', {
        cookie: adminCookie,
        body: {
            title: `The Great Chronicles ${stamp}`,
            description: 'An epic tale written in chapters.',
        },
    });
    assert('1. Admin creates book (201)', createBookRes.status === 201, createBookRes.status);
    bookAId = createBookRes.json?.data?.book?.book_id;
    assert('Book A has valid ID', Number.isInteger(bookAId) && bookAId > 0, bookAId);

    // Add chapter to book A
    const createChRes = await request('POST', `/api/books/${bookAId}/chapters`, {
        cookie: adminCookie,
        body: {
            chapterNumber: 1,
            title: 'Departure',
            content: 'The journey began at first dawn.\n\nThey packed their provisions and set out.',
        },
    });
    assert('Add Chapter 1 (201)', createChRes.status === 201, createChRes.status);
    const chA1Id = createChRes.json?.data?.chapter?.chapter_id;

    // Publish chapter 1
    const pubChRes = await request('PATCH', `/api/chapters/${chA1Id}/publish`, {
        cookie: adminCookie,
    });
    assert('Publish Chapter 1 (200)', pubChRes.status === 200, pubChRes.status);

    // 3. Admin publishes the book
    const pubBookRes = await request('PATCH', `/api/books/${bookAId}/publish`, {
        cookie: adminCookie,
    });
    assert('3. Admin publishes book (200)', pubBookRes.status === 200, pubBookRes.status);

    // 4. Confirm publication status in MySQL
    const [dbRowsA] = await pool.query('SELECT book_id, status FROM books WHERE book_id = ?', [bookAId]);
    assert('4. Confirm status in MySQL is PUBLISHED', dbRowsA?.[0]?.status === 'PUBLISHED', dbRowsA?.[0]?.status);

    // 5. Confirm book appears on public listing
    const listingRes = await request('GET', '/api/books', { cookie: userCookie });
    assert('5. Public listing succeeds (200)', listingRes.status === 200, listingRes.status);
    const foundInListing = listingRes.json?.data?.books?.some((b) => b.book_id === bookAId);
    assert('Book A is present in public listing', foundInListing === true, foundInListing);

    // 6. Open its detail page (GET /api/books/:id)
    const detailRes = await request('GET', `/api/books/${bookAId}`, { cookie: userCookie });
    assert('6. Book detail endpoint returns 200', detailRes.status === 200, detailRes.status);
    assert('Detail returns title and status PUBLISHED', detailRes.json?.data?.book?.status === 'PUBLISHED', detailRes.json?.data?.book?.status);

    // 7. Confirm reader loads the correct content (GET /api/books/:id/document)
    const readerRes = await request('GET', `/api/books/${bookAId}/document`, { cookie: userCookie });
    assert('7. Reader loads document successfully (200)', readerRes.status === 200, readerRes.status);
    const docA = readerRes.json?.data?.document;
    assert('Document source is chapters', docA?.source === 'chapters', docA?.source);
    assert('Document page count is 1', docA?.pageCount === 1, docA?.pageCount);
    assert('Page 1 has heading block: Chapter 1: Departure', docA?.pages?.[0]?.blocks?.[0]?.text === 'Chapter 1: Departure', docA?.pages?.[0]?.blocks?.[0]?.text);
    assert('Page 1 has 2 content paragraphs', docA?.pages?.[0]?.paragraphs?.length === 2, docA?.pages?.[0]?.paragraphs?.length);

    // 8. Reload the page and confirm the book remains available
    const reloadRes = await request('GET', `/api/books/${bookAId}/document`, { cookie: userCookie });
    assert('8. Reloading reader document returns 200', reloadRes.status === 200, reloadRes.status);
    assert('Reloaded document matches original page count', reloadRes.json?.data?.document?.pageCount === 1, reloadRes.json?.data?.document?.pageCount);

    // -------------------------------------------------------------
    // PART B: PDF Upload Publishing Workflow
    // -------------------------------------------------------------
    console.log('\n--- Part B: PDF-based Book Publishing Workflow ---');

    // 1. Admin creates another book for PDF upload
    const createPdfBook = await request('POST', '/api/books', {
        cookie: adminCookie,
        body: {
            title: `PDF Documentation Guide ${stamp}`,
            description: 'A comprehensive manual uploaded as PDF.',
        },
    });
    assert('Admin creates PDF book (201)', createPdfBook.status === 201, createPdfBook.status);
    bookBId = createPdfBook.json?.data?.book?.book_id;

    // Build a minimal valid PDF 1.4 binary
    const minimalPdf = Buffer.from(
        '%PDF-1.4\n' +
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n' +
        '4 0 obj\n<< /Length 58 >>\nstream\nBT\n/F1 18 Tf\n50 720 Td\n(Welcome to Digital Library PDF) Tj\nET\nendstream\nendobj\n' +
        '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n' +
        'xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000234 00000 n \n0000000342 00000 n \n' +
        'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n419\n%%EOF\n',
        'latin1'
    );

    // 2. Upload PDF
    const formData = new FormData();
    const blob = new Blob([minimalPdf], { type: 'application/pdf' });
    formData.append('pdf', blob, 'guide.pdf');

    const uploadRes = await request('POST', `/api/books/${bookBId}/pdf`, {
        cookie: adminCookie,
        formData,
    });
    assert('2. Admin uploads PDF (200)', uploadRes.status === 200, uploadRes.status);
    assert('PDF upload confirms has_processed_text', uploadRes.json?.data?.book?.has_processed_text === true, uploadRes.json?.data?.book);

    // 3. Publish PDF book
    const pubBRes = await request('PATCH', `/api/books/${bookBId}/publish`, { cookie: adminCookie });
    assert('3. Admin publishes PDF book (200)', pubBRes.status === 200, pubBRes.status);

    // 4. Confirm in MySQL
    const [dbRowsB] = await pool.query('SELECT status, pdf_original_name, processed_content_path FROM books WHERE book_id = ?', [bookBId]);
    assert('4. Confirm PDF book is PUBLISHED in DB', dbRowsB?.[0]?.status === 'PUBLISHED', dbRowsB?.[0]?.status);
    assert('PDF original name saved in DB', dbRowsB?.[0]?.pdf_original_name === 'guide.pdf', dbRowsB?.[0]?.pdf_original_name);
    assert('Processed content path populated in DB', !!dbRowsB?.[0]?.processed_content_path, dbRowsB?.[0]?.processed_content_path);

    // 5. Appears in public listing
    const listingBRes = await request('GET', '/api/books', { cookie: userCookie });
    const foundB = listingBRes.json?.data?.books?.some((b) => b.book_id === bookBId);
    assert('5. PDF book appears on public listing', foundB === true, foundB);

    // 6. Open detail page
    const detailBRes = await request('GET', `/api/books/${bookBId}`, { cookie: userCookie });
    assert('6. PDF book detail returns 200', detailBRes.status === 200, detailBRes.status);

    // 7. Reader loads extracted text from PDF
    const readerBRes = await request('GET', `/api/books/${bookBId}/document`, { cookie: userCookie });
    assert('7. PDF book document loads in reader (200)', readerBRes.status === 200, readerBRes.status);
    const docB = readerBRes.json?.data?.document;
    assert('Document page count is 1', docB?.pageCount === 1, docB?.pageCount);
    const pageText = docB?.pages?.[0]?.text || '';
    assert('Extracted text contains PDF content', pageText.includes('Welcome to Digital Library PDF'), pageText);

    // 8. Reload confirms still available
    const reloadBRes = await request('GET', `/api/books/${bookBId}/document`, { cookie: userCookie });
    assert('8. PDF reader reload returns 200', reloadBRes.status === 200, reloadBRes.status);

    // -------------------------------------------------------------
    // PART C: Access Control & Security Tests
    // -------------------------------------------------------------
    console.log('\n--- Part C: Access Control & Security Checks ---');

    // 9. Drafts and archived books remain inaccessible to unauthorized users
    const draftBookRes = await request('POST', '/api/books', {
        cookie: adminCookie,
        body: { title: `Draft Book ${stamp}`, description: 'Must stay private' },
    });
    draftBookId = draftBookRes.json?.data?.book?.book_id;

    // Normal user attempts to access draft
    const userDraftGet = await request('GET', `/api/books/${draftBookId}`, { cookie: userCookie });
    assert('9a. Normal user cannot view draft book detail (404)', userDraftGet.status === 404, userDraftGet.status);
    assert('Draft detail returns code BOOK_NOT_PUBLISHED', userDraftGet.json?.code === 'BOOK_NOT_PUBLISHED', userDraftGet.json?.code);

    const userDraftDoc = await request('GET', `/api/books/${draftBookId}/document`, { cookie: userCookie });
    assert('9b. Normal user cannot read draft document (404)', userDraftDoc.status === 404, userDraftDoc.status);
    assert('Draft document returns code BOOK_NOT_PUBLISHED', userDraftDoc.json?.code === 'BOOK_NOT_PUBLISHED', userDraftDoc.json?.code);

    // Archive book A and verify it becomes inaccessible to normal user
    await request('PATCH', `/api/books/${bookAId}/archive`, { cookie: adminCookie });
    const userArchGet = await request('GET', `/api/books/${bookAId}`, { cookie: userCookie });
    assert('9c. Normal user cannot view archived book detail (404)', userArchGet.status === 404, userArchGet.status);
    assert('Archived book detail returns code BOOK_NOT_PUBLISHED', userArchGet.json?.code === 'BOOK_NOT_PUBLISHED', userArchGet.json?.code);

    const userArchDoc = await request('GET', `/api/books/${bookAId}/document`, { cookie: userCookie });
    assert('9d. Normal user cannot read archived book document (404)', userArchDoc.status === 404, userArchDoc.status);
    assert('Archived document returns code BOOK_NOT_PUBLISHED', userArchDoc.json?.code === 'BOOK_NOT_PUBLISHED', userArchDoc.json?.code);

    // 10. Self-contained regression test (dedicated test book, not relying on Book 2)
    console.log('\n--- Part D: Self-Contained Regression Test ---');
    const createRegBookRes = await request('POST', '/api/books', {
        cookie: adminCookie,
        body: {
            title: 'Regression Test Book ' + stamp,
            description: 'Self-contained regression test book with published chapter.',
        },
    });
    assert('10a. Admin creates regression book (201)', createRegBookRes.status === 201, createRegBookRes.status);
    regBookId = createRegBookRes.json?.data?.book?.book_id;
    assert('Regression book has valid ID', Number.isInteger(regBookId) && regBookId > 0, regBookId);

    // Add a chapter
    const regChRes = await request('POST', '/api/books/' + regBookId + '/chapters', {
        cookie: adminCookie,
        body: {
            chapterNumber: 1,
            title: 'Regression Chapter',
            content: 'This is regression test content.\n\nIt should be readable after publishing.',
        },
    });
    assert('Add regression chapter (201)', regChRes.status === 201, regChRes.status);
    const regChId = regChRes.json?.data?.chapter?.chapter_id;

    // Publish the chapter
    const regPubChRes = await request('PATCH', '/api/chapters/' + regChId + '/publish', {
        cookie: adminCookie,
    });
    assert('Publish regression chapter (200)', regPubChRes.status === 200, regPubChRes.status);

    // Publish the book
    const regPubBookRes = await request('PATCH', '/api/books/' + regBookId + '/publish', {
        cookie: adminCookie,
    });
    assert('Publish regression book (200)', regPubBookRes.status === 200, regPubBookRes.status);

    // Verify normal user can read the document
    const regDetailRes = await request('GET', '/api/books/' + regBookId, { cookie: userCookie });
    assert('10b. Regression book detail loads (200)', regDetailRes.status === 200, regDetailRes.status);

    const regDocRes = await request('GET', '/api/books/' + regBookId + '/document', { cookie: userCookie });
    assert('10c. Regression book document loads (200)', regDocRes.status === 200, regDocRes.status);
    const regDoc = regDocRes.json?.data?.document;
    assert('Regression document has pages', regDoc?.pages?.length > 0, regDoc?.pages?.length);
    assert('Regression document page 1 has heading', regDoc?.pages?.[0]?.blocks?.[0]?.kind === 'heading', regDoc?.pages?.[0]?.blocks?.[0]);
    assert('Regression document page 1 has paragraph', regDoc?.pages?.[0]?.blocks?.[1]?.kind === 'paragraph', regDoc?.pages?.[0]?.blocks?.[1]);

    // Verify unpublished chapter is not readable by regular user
    const regDraftChRes = await request('POST', '/api/books/' + regBookId + '/chapters', {
        cookie: adminCookie,
        body: {
            chapterNumber: 2,
            title: 'Draft Regression Chapter',
            content: 'This draft chapter should not be visible to users.',
        },
    });
    const regDraftChId = regDraftChRes.json?.data?.chapter?.chapter_id;

    const regDraftDocRes = await request('GET', '/api/books/' + regBookId + '/document', { cookie: userCookie });
    assert('Unpublished chapter not visible to user (1 page only)', regDraftDocRes.json?.data?.document?.pages?.length === 1, regDraftDocRes.json?.data?.document?.pages?.length);

    // Admin can see both chapters
    const regAdminDocRes = await request('GET', '/api/books/' + regBookId + '/document', { cookie: adminCookie });
    assert('Admin sees both chapters (2 pages)', regAdminDocRes.json?.data?.document?.pages?.length === 2, regAdminDocRes.json?.data?.document?.pages?.length);

    } finally {
        const bookIds = [
            bookAId,
            bookBId,
            draftBookId,
            regBookId,
        ].filter(Number.isInteger);

        let pdfRows = [];

        // A metadata lookup failure must not prevent database cleanup.
        if (bookIds.length > 0) {
            await cleanupStep('read test book file metadata', async () => {
                const [rows] = await pool.query(
                    `SELECT pdf_stored_name, processed_content_path
                     FROM books
                     WHERE book_id IN (${bookIds.map(() => '?').join(',')})`,
                    bookIds
                );

                pdfRows = rows;
            });
        }

        // Use the backend's canonical file-path helpers.
        // pdfRows must contain records belonging only to this test's book IDs.

        for (const row of pdfRows) {
            if (row.pdf_stored_name) {
                await cleanupStep(
                    `PDF ${row.pdf_stored_name}`,
                    async () => {
                        await fs.unlink(
                            resolvePublicPdfPath(row.pdf_stored_name)
                        );
                    }
                );
            }

            if (row.processed_content_path) {
                const processedName = path.basename(
                    row.processed_content_path
                );

                await cleanupStep(
                    `processed content ${processedName}`,
                    async () => {
                        await fs.unlink(
                            resolvePublicProcessedPath(processedName)
                        );
                    }
                );
            }

            if (row.pdf_stored_name) {
                const imagesDirName = buildPublicImagesDirName(
                    row.pdf_stored_name
                );

                await cleanupStep(
                    `images directory ${imagesDirName}`,
                    async () => {
                        await fs.rm(
                            resolvePublicImagesDir(imagesDirName),
                            {
                                recursive: true,
                                force: true,
                            }
                        );
                    }
                );
            }
        }

        // Independent operations: failure in one must not skip the next.
        await cleanupStep('test user', async () => {
            if (userEmail) {
                await pool.query(
                    'DELETE FROM users WHERE email = ?',
                    [userEmail]
                );
            }
        });

        await cleanupStep('test books', async () => {
            if (bookIds.length > 0) {
                await pool.query(
                    `DELETE FROM books
                     WHERE book_id IN (${bookIds.map(() => '?').join(',')})`,
                    bookIds
                );
            }
        });

        await cleanupStep('database pool close', async () => {
            await pool.end();
        });
    }

    console.log(`\n=== All Workflow Tests Finished: ${passed} passed, ${failed} failed ===`);
    process.exitCode = (failed > 0 || cleanupFailed) ? 1 : 0;
}

run().catch((err) => {
    console.error('Workflow test failed:', err);
    process.exitCode = 1;
});
