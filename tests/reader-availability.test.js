const { pool } = require('../backend/src/config/database');
const fs = require('fs/promises');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

async function request(method, urlPath, { cookie = '', body = null } = {}) {
    const headers = {};
    if (cookie) headers['Cookie'] = cookie;
    let reqBody = null;
    if (body) {
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

function assert(description, condition, actual) {
    if (condition) {
        console.log(`[PASS] ${description}`);
        passed++;
    } else {
        console.error(`[FAIL] ${description} -> got:`, actual);
        failed++;
    }
}

async function run() {
    console.log('=== Starting Reader Availability & Error Handling Tests ===\n');

    let draftBookId = null;
    let emptyBookId = null;
    let chBookId = null;
    const stamp = Date.now();
    const userEmail = `reader_test_${stamp}@example.com`;

    try {
        // 1. Log in admin
        const adminLogin = await request('POST', '/api/auth/login', {
            body: {
                email: 'demoadmin@example.com',
                password: 'Demoadmin@123',
            },
        });
        assert('Admin login succeeds (200)', adminLogin.status === 200, adminLogin.status);
        const adminCookie = adminLogin.cookie;

        // 2. Register / login test user
        const userReg = await request('POST', '/api/auth/register', {
            body: {
                fullName: 'Reader Tester',
                email: userEmail,
                password: 'Passw0rd!Tester',
            },
        });
        assert('Test user register succeeds (201)', userReg.status === 201, userReg.status);

        const userLogin = await request('POST', '/api/auth/login', {
            body: {
                email: userEmail,
                password: 'Passw0rd!Tester',
            },
        });
        assert('Test user login succeeds (200)', userLogin.status === 200, userLogin.status);
        const userCookie = userLogin.cookie;

        // 3. Test Condition 1: Book does not exist (BOOK_NOT_FOUND)
        const notFoundRes = await request('GET', '/api/books/99999999/document', { cookie: userCookie });
        assert('Book does not exist returns 404', notFoundRes.status === 404, notFoundRes.status);
        assert('Book does not exist has code BOOK_NOT_FOUND', notFoundRes.json?.code === 'BOOK_NOT_FOUND', notFoundRes.json?.code);
        assert('Book does not exist message is accurate', notFoundRes.json?.message === 'This book does not exist.', notFoundRes.json?.message);

        // 4. Test Condition 2: Book is not published (BOOK_NOT_PUBLISHED)
        const createDraft = await request('POST', '/api/books', {
            cookie: adminCookie,
            body: { title: `Draft Book ${stamp}`, description: 'Draft description' },
        });
        draftBookId = createDraft.json?.data?.book?.book_id;
        const draftRes = await request('GET', `/api/books/${draftBookId}/document`, { cookie: userCookie });
        assert('Draft book returns 404 for normal user', draftRes.status === 404, draftRes.status);
        assert('Draft book has code BOOK_NOT_PUBLISHED', draftRes.json?.code === 'BOOK_NOT_PUBLISHED', draftRes.json?.code);
        assert('Draft book message is accurate', draftRes.json?.message === 'This book is not published.', draftRes.json?.message);

        // 5. Test Condition 3: Book has no readable content (NO_READABLE_CONTENT)
        // Create a book, publish it, but add NO chapters and NO PDF
        const createEmpty = await request('POST', '/api/books', {
            cookie: adminCookie,
            body: { title: `Empty Book ${stamp}`, description: 'No content' },
        });
        emptyBookId = createEmpty.json?.data?.book?.book_id;
        assert('Admin created empty book', !!emptyBookId, createEmpty.json);
        await request('PATCH', `/api/books/${emptyBookId}/publish`, { cookie: adminCookie });

        const emptyDocRes = await request('GET', `/api/books/${emptyBookId}/document`, { cookie: userCookie });
        assert('Empty published book returns 404', emptyDocRes.status === 404, emptyDocRes.status);
        assert('Empty published book has code NO_READABLE_CONTENT', emptyDocRes.json?.code === 'NO_READABLE_CONTENT', emptyDocRes.json?.code);
        assert('Empty published book message is accurate', emptyDocRes.json?.message === 'This book has no readable content yet.', emptyDocRes.json?.message);

        // 6. Test Condition 4: PDF or content file is missing (CONTENT_FILE_MISSING)
        // Set a non-existent processed_content_path on the empty book
        await pool.query('UPDATE books SET processed_content_path = ? WHERE book_id = ?', [
            'missing-file-test-12345.processed.json',
            emptyBookId,
        ]);
        const missingFileRes = await request('GET', `/api/books/${emptyBookId}/document`, { cookie: userCookie });
        assert('Missing content file returns 404', missingFileRes.status === 404, missingFileRes.status);
        assert('Missing content file has code CONTENT_FILE_MISSING', missingFileRes.json?.code === 'CONTENT_FILE_MISSING', missingFileRes.json?.code);
        assert('Missing content file message is accurate', missingFileRes.json?.message === 'The book content file is missing.', missingFileRes.json?.message);

        // 7. Test Condition 5: Content-processing failed (CONTENT_PROCESSING_FAILED)
        // Create a corrupted JSON file in uploads/public/
        const publicDir = path.join(__dirname, '..', 'uploads', 'public');
        await fs.mkdir(publicDir, { recursive: true });
        const corruptFileName = `corrupted-${stamp}.processed.json`;
        const corruptFilePath = path.join(publicDir, corruptFileName);
        await fs.writeFile(corruptFilePath, '{ invalid json content !!!', 'utf-8');

        await pool.query('UPDATE books SET processed_content_path = ? WHERE book_id = ?', [
            corruptFileName,
            emptyBookId,
        ]);
        const corruptRes = await request('GET', `/api/books/${emptyBookId}/document`, { cookie: userCookie });
        assert('Corrupted content file returns 500', corruptRes.status === 500, corruptRes.status);
        assert('Corrupted content file has code CONTENT_PROCESSING_FAILED', corruptRes.json?.code === 'CONTENT_PROCESSING_FAILED', corruptRes.json?.code);
        assert('Corrupted content file message is accurate', corruptRes.json?.message === 'Content-processing failed for this book.', corruptRes.json?.message);

        // Cleanup corrupt file
        await fs.unlink(corruptFilePath).catch(() => {});

        // 8. Test Book with chapters (1 published, 1 draft)
        const createChBook = await request('POST', '/api/books', {
            cookie: adminCookie,
            body: { title: `Chapter Book ${stamp}`, description: 'Chapters book' },
        });
        chBookId = createChBook.json?.data?.book?.book_id;

        // Add Chapter 1 and publish it
        const ch1Res = await request('POST', `/api/books/${chBookId}/chapters`, {
            cookie: adminCookie,
            body: {
                chapterNumber: 1,
                title: 'Ch1',
                content: 'public text',
            },
        });
        const ch1Id = ch1Res.json?.data?.chapter?.chapter_id;
        await request('PATCH', `/api/chapters/${ch1Id}/publish`, { cookie: adminCookie });

        // Add Chapter 2 (draft)
        await request('POST', `/api/books/${chBookId}/chapters`, {
            cookie: adminCookie,
            body: {
                chapterNumber: 2,
                title: 'Ch2 draft',
                content: 'draft text',
            },
        });

        // Publish the book
        await request('PATCH', `/api/books/${chBookId}/publish`, { cookie: adminCookie });

        const book2DocRes = await request('GET', `/api/books/${chBookId}/document`, { cookie: userCookie });
        assert('Book 2 (chapter-based) document returns 200', book2DocRes.status === 200, book2DocRes.status);
        const doc = book2DocRes.json?.data?.document;
        assert('Document version is 1', doc?.version === 1, doc?.version);
        assert('Document source is chapters', doc?.source === 'chapters', doc?.source);
        assert('Document has 1 readable page (only published chapter 1)', doc?.pages?.length === 1, doc?.pages?.length);
        assert('Page 1 has heading block for Chapter 1', doc?.pages?.[0]?.blocks?.[0]?.kind === 'heading', doc?.pages?.[0]?.blocks?.[0]);
        assert('Page 1 heading text is Chapter 1: Ch1', doc?.pages?.[0]?.blocks?.[0]?.text === 'Chapter 1: Ch1', doc?.pages?.[0]?.blocks?.[0]?.text);
        assert('Page 1 has paragraph block', doc?.pages?.[0]?.blocks?.[1]?.kind === 'paragraph', doc?.pages?.[0]?.blocks?.[1]);
        assert('Page 1 paragraph text matches', doc?.pages?.[0]?.blocks?.[1]?.text === 'public text', doc?.pages?.[0]?.blocks?.[1]?.text);

        // 9. Admin can view draft chapters in synthesized document
        const book2AdminDoc = await request('GET', `/api/books/${chBookId}/document`, { cookie: adminCookie });
        assert('Admin can view book 2 document (200)', book2AdminDoc.status === 200, book2AdminDoc.status);
        assert('Admin sees both chapters (2 pages)', book2AdminDoc.json?.data?.document?.pages?.length === 2, book2AdminDoc.json?.data?.document?.pages?.length);

    } finally {
        // 10. Clean up temporary test books and test user
        const toDeleteBooks = [emptyBookId, draftBookId, chBookId].filter(Boolean);
        if (toDeleteBooks.length > 0) {
            await pool.query(`DELETE FROM books WHERE book_id IN (${toDeleteBooks.map(() => '?').join(',')})`, toDeleteBooks);
        }
        await pool.query('DELETE FROM users WHERE email = ?', [userEmail]);
        await pool.end();
    }

    console.log(`\n=== Tests Completed: ${passed} passed, ${failed} failed ===`);
    process.exit(failed ? 1 : 0);
}

run().catch((err) => {
    console.error('Test execution failed:', err);
    process.exit(1);
});
