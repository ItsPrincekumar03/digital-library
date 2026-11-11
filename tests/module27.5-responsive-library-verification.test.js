'use strict';

/**
 * Module 27.5 — Responsive Frontend, Saved Public Books, Cover Corrections & Original PDF Verification
 *
 * Strictly isolated to `digital_library_test`. Cleans up all synthetic DB rows
 * and uploaded/extracted/cover files created during the run.
 */

const fs = require('fs');
const fsp = require('fs/promises');
const http = require('http');
const assertNode = require('assert');
const { execFileSync } = require('child_process');

process.env.TEST_DB_NAME = 'digital_library_test';
process.env.DB_NAME = 'digital_library_test';

require('../backend/src/config/env');
const { pool } = require('../backend/src/config/database');
const app = require('../backend/src/app');
const {
    resolvePublicPdfPath,
    resolvePublicProcessedPath,
    resolvePublicImagesDir,
    resolvePublicCoverPath,
    buildPublicProcessedName,
    buildPublicImagesDirName,
    resolvePrivatePdfPath,
    resolvePrivateProcessedPath,
    resolvePrivateImagesDir,
    buildPrivateProcessedName,
    buildPrivateImagesDirName,
    buildCoverFileName,
    deleteFileIfExists,
    deleteDirectoryIfExists,
} = require('../backend/src/utils/fileStorage');
const { COVER_EXTENSIONS, generateFallbackCoverSvg } = require('../backend/src/utils/coverFallback');

let passed = 0;
let failed = 0;

function check(name, condition, extra = '') {
    if (condition) {
        passed += 1;
        console.log(`[PASS] ${name}`);
    } else {
        failed += 1;
        console.error(`[FAIL] ${name}${extra ? ` -> ${typeof extra === 'object' ? JSON.stringify(extra) : extra}` : ''}`);
    }
}

class CookieJar {
    constructor() {
        this.cookies = new Map();
    }
    absorb(res) {
        const setCookies = typeof res.headers.getSetCookie === 'function'
            ? res.headers.getSetCookie()
            : [];
        for (const raw of setCookies) {
            const pair = String(raw).split(';')[0];
            const eq = pair.indexOf('=');
            if (eq <= 0) continue;
            const k = pair.slice(0, eq).trim();
            const v = pair.slice(eq + 1).trim();
            if (!v || raw.toLowerCase().includes('max-age=0')) {
                this.cookies.delete(k);
            } else {
                this.cookies.set(k, v);
            }
        }
    }
    header() {
        return Array.from(this.cookies.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
    }
    get(name) {
        return this.cookies.get(name) || '';
    }
}

async function apiFetch(baseUrl, method, urlPath, { jar, body, formData } = {}) {
    const headers = {};
    if (jar) {
        const cookieHeader = jar.header();
        if (cookieHeader) headers.Cookie = cookieHeader;
        if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
            const csrf = jar.get('csrf_token');
            if (csrf) headers['X-CSRF-Token'] = csrf;
        }
    }
    let fetchBody;
    if (formData) {
        fetchBody = formData;
    } else if (body !== undefined) {
        headers['Content-Type'] = 'application/json';
        fetchBody = JSON.stringify(body);
    }

    const res = await fetch(`${baseUrl}${urlPath}`, { method, headers, body: fetchBody });
    if (jar) jar.absorb(res);
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') || '';
    let json = null;
    if (contentType.includes('application/json')) {
        try { json = JSON.parse(buf.toString('utf8')); } catch (_) {}
    }
    return { status: res.status, headers: res.headers, contentType, buf, json };
}

function buildMinimalTextPdf(text = 'Module 27.5 PDF') {
    const content = `BT\n/F1 14 Tf\n50 740 Td\n(${text}) Tj\nET\n`;
    const objects = [
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
        '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
        `5 0 obj\n<< /Length ${Buffer.byteLength(content, 'utf8')} >>\nstream\n${content}endstream\nendobj\n`,
    ];
    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (const obj of objects) {
        offsets.push(Buffer.byteLength(pdf, 'utf8'));
        pdf += obj;
    }
    const xrefPos = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i += 1) {
        pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF\n`;
    return Buffer.from(pdf, 'utf8');
}

async function run() {
    console.log('=== Module 27.5 Comprehensive Verification ===\n');

    const [dbRows] = await pool.query('SELECT DATABASE() AS db');
    assertNode.strictEqual(dbRows[0]?.db, 'digital_library_test', 'Must run on digital_library_test');
    check('Database isolation verified: digital_library_test', dbRows[0]?.db === 'digital_library_test');

    // Run schema migration idempotency check in test DB
    const { applyMigrations } = require('../backend/scripts/migrate');
    await applyMigrations(pool, 'digital_library_test');
    const [tblRows] = await pool.query(
        "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'digital_library_test' AND TABLE_NAME = 'private_saved_books'"
    );
    check('private_saved_books table present in digital_library_test', tblRows.length === 1);

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    const stamp = Date.now();
    const createdBookIds = [];
    const createdUserIds = [];
    const createdAuthorIds = [];
    const createdCategoryIds = [];
    const createdPrivateFileIds = [];

    const adminEmail = `m175_admin_${stamp}@example.com`;
    const userAEmail = `m175_usera_${stamp}@example.com`;
    const userBEmail = `m175_userb_${stamp}@example.com`;
    const pass = 'StrongPass!175';

    try {
        // Setup accounts
        const jarAdmin = new CookieJar();
        const jarA = new CookieJar();
        const jarB = new CookieJar();
        const jarAnon = new CookieJar();

        for (const [idx, email] of [adminEmail, userAEmail, userBEmail].entries()) {
            const reg = await apiFetch(baseUrl, 'POST', '/api/auth/register', {
                body: { fullName: `M175 Test User ${idx}`, email, password: pass },
            });
            assertNode.strictEqual(reg.status, 201, JSON.stringify(reg.json));
            createdUserIds.push(reg.json.data.user.user_id);
        }
        await pool.query(
            "UPDATE users SET role_id = (SELECT role_id FROM roles WHERE role_name = 'ADMIN' LIMIT 1) WHERE email = ?",
            [adminEmail]
        );

        await apiFetch(baseUrl, 'POST', '/api/auth/login', { jar: jarAdmin, body: { email: adminEmail, password: pass } });
        await apiFetch(baseUrl, 'POST', '/api/auth/login', { jar: jarA, body: { email: userAEmail, password: pass } });
        await apiFetch(baseUrl, 'POST', '/api/auth/login', { jar: jarB, body: { email: userBEmail, password: pass } });

        // Create author + category + published PDF book + draft book
        const authorRes = await apiFetch(baseUrl, 'POST', '/api/authors', { jar: jarAdmin, body: { name: `Jane Austen ${stamp}` } });
        const authorId = authorRes.json.data.author.author_id;
        createdAuthorIds.push(authorId);

        const catRes = await apiFetch(baseUrl, 'POST', '/api/categories', { jar: jarAdmin, body: { name: `Classic ${stamp}` } });
        const categoryId = catRes.json.data.category.category_id;
        createdCategoryIds.push(categoryId);

        const pubCreate = await apiFetch(baseUrl, 'POST', '/api/books', {
            jar: jarAdmin,
            body: { title: `Pride and Prejudice ${stamp}`, description: 'Public PDF edition', publication_date: '2020-01-15' },
        });
        const pubBookId = pubCreate.json.data.book.book_id;
        createdBookIds.push(pubBookId);

        await apiFetch(baseUrl, 'POST', `/api/books/${pubBookId}/authors`, { jar: jarAdmin, body: { authorId } });
        await apiFetch(baseUrl, 'POST', `/api/books/${pubBookId}/categories`, { jar: jarAdmin, body: { categoryId } });

        const pdfBytes = buildMinimalTextPdf('Pride and Prejudice PDF Page 1');
        const fdPdf = new FormData();
        fdPdf.append('file', new Blob([pdfBytes], { type: 'application/pdf' }), 'pride.pdf');
        const importRes = await apiFetch(baseUrl, 'POST', `/api/books/${pubBookId}/pdf`, { jar: jarAdmin, formData: fdPdf });
        check('Admin imports original PDF onto public book (200)', importRes.status === 200);

        const publishRes = await apiFetch(baseUrl, 'PATCH', `/api/books/${pubBookId}/publish`, { jar: jarAdmin });
        check('Admin publishes public book (200)', publishRes.status === 200);

        // Simulate legacy null file_format row in DB for pubBookId check, then restore
        await pool.query('UPDATE books SET file_format = NULL WHERE book_id = ?', [pubBookId]);
        const listBooksRes = await apiFetch(baseUrl, 'GET', '/api/books?page=1&limit=20', { jar: jarA });
        const foundBook = listBooksRes.json?.data?.books?.find((b) => b.book_id === pubBookId);
        check('GET /api/books enriches authors, categories & infers PDF file_format when NULL',
            Boolean(foundBook) &&
            Array.isArray(foundBook.authors) && foundBook.authors.some((a) => a.author_id === authorId) &&
            Array.isArray(foundBook.categories) && foundBook.categories.some((c) => c.category_id === categoryId) &&
            foundBook.file_format === 'PDF' &&
            foundBook.has_original_file === true,
            foundBook);

        // SVG Fallback cover sanitization + author subtitle
        const svgCoverRes = await apiFetch(baseUrl, 'GET', `/api/books/${pubBookId}/cover`, { jar: jarA });
        const svgBody = svgCoverRes.buf.toString('utf8');
        check('SVG fallback cover strips raw epoch timestamp and displays clean author subtitle',
            svgCoverRes.status === 200 &&
            svgCoverRes.contentType.includes('image/svg+xml') &&
            !svgBody.includes(String(stamp)) &&
            svgBody.includes('Jane Austen'),
            svgBody.slice(0, 500));

        const legacyCleanSvg = generateFallbackCoverSvg({ id: 9, title: 'M85 Arch 1792237325156', subtitle: 'Digital Library', format: 'BOOK' }).toString('utf8');
        check('generateFallbackCoverSvg strips legacy timestamp suffix from title',
            !legacyCleanSvg.includes('1792237325156') && legacyCleanSvg.includes('M85 Arch'));

        // Draft book cannot be saved
        const draftCreate = await apiFetch(baseUrl, 'POST', '/api/books', {
            jar: jarAdmin,
            body: { title: 'Unpublished Draft Book', description: 'Secret' },
        });
        const draftId = draftCreate.json.data.book.book_id;
        createdBookIds.push(draftId);

        // Auth & Validation checks on /api/private-library/saved
        const anonSave = await apiFetch(baseUrl, 'POST', `/api/private-library/saved/${pubBookId}`, { jar: jarAnon, body: {} });
        const anonList = await apiFetch(baseUrl, 'GET', '/api/private-library/saved', { jar: jarAnon });
        check('Unauthenticated access to /api/private-library/saved blocked (401)', anonSave.status === 401 && anonList.status === 401);

        const badIdSave = await apiFetch(baseUrl, 'POST', '/api/private-library/saved/abc', { jar: jarA, body: {} });
        const zeroIdDel = await apiFetch(baseUrl, 'DELETE', '/api/private-library/saved/0', { jar: jarA });
        check('Invalid book IDs rejected with 400 on save and remove endpoints', badIdSave.status === 400 && zeroIdDel.status === 400);

        const saveDraftUser = await apiFetch(baseUrl, 'POST', `/api/private-library/saved/${draftId}`, { jar: jarA, body: {} });
        const saveDraftAdmin = await apiFetch(baseUrl, 'POST', `/api/private-library/saved/${draftId}`, { jar: jarAdmin, body: {} });
        check('Draft/unpublished books rejected when saving to personal library (404)', saveDraftUser.status === 404 && saveDraftAdmin.status === 404);

        // Save published book (User A) + idempotency
        const saveA1 = await apiFetch(baseUrl, 'POST', `/api/private-library/saved/${pubBookId}`, { jar: jarA, body: {} });
        check('User A saves published public book (201)', saveA1.status === 201 && saveA1.json?.data?.alreadySaved === false && saveA1.json?.data?.savedBook?.book_id === pubBookId);

        const saveA2 = await apiFetch(baseUrl, 'POST', `/api/private-library/saved/${pubBookId}`, { jar: jarA, body: {} });
        check('Duplicate save by same user is idempotent (200, alreadySaved=true)', saveA2.status === 200 && saveA2.json?.data?.alreadySaved === true);

        // User B also saves same book
        const saveB = await apiFetch(baseUrl, 'POST', `/api/private-library/saved/${pubBookId}`, { jar: jarB, body: {} });
        check('User B can independently save same published book (201)', saveB.status === 201);

        // Cross-user isolation & logout/login persistence
        await apiFetch(baseUrl, 'POST', '/api/auth/logout', { jar: jarA, body: {} });
        const jarAFresh = new CookieJar();
        await apiFetch(baseUrl, 'POST', '/api/auth/login', { jar: jarAFresh, body: { email: userAEmail, password: pass } });
        const privResA = await apiFetch(baseUrl, 'GET', '/api/private-library', { jar: jarAFresh });
        check('Saved public book persists across logout/login in GET /api/private-library',
            privResA.status === 200 &&
            Array.isArray(privResA.json?.data?.privateFiles) &&
            Array.isArray(privResA.json?.data?.savedBooks) &&
            privResA.json.data.savedBooks.length === 1 &&
            privResA.json.data.savedBooks[0].book_id === pubBookId &&
            privResA.json.data.savedBooks[0].authors?.some((a) => a.author_id === authorId));

        // Private upload remains clearly distinct from savedBooks
        const fdPriv = new FormData();
        fdPriv.append('title', 'My Uploaded Study Notes');
        fdPriv.append('format', 'PDF');
        fdPriv.append('file', new Blob([buildMinimalTextPdf('Private Study Notes')], { type: 'application/pdf' }), 'notes.pdf');
        const privUp = await apiFetch(baseUrl, 'POST', '/api/private-library/upload', { jar: jarAFresh, formData: fdPriv });
        check('Private PDF upload succeeds cleanly alongside saved public books (201)', privUp.status === 201);
        const privUploadId = privUp.json.data.privateFile.private_file_id;
        createdPrivateFileIds.push(privUploadId);

        const privBothA = await apiFetch(baseUrl, 'GET', '/api/private-library', { jar: jarAFresh });
        check('Private Library returns separate privateFiles (1) and savedBooks (1) arrays',
            privBothA.json?.data?.privateFiles?.length === 1 && privBothA.json?.data?.savedBooks?.length === 1);

        // Remove saved book for User A -> User B's save + Public Book + Public PDF stay untouched
        const delA = await apiFetch(baseUrl, 'DELETE', `/api/private-library/saved/${pubBookId}`, { jar: jarAFresh });
        check('User A removes saved public book from private library (200)', delA.status === 200);

        const delA2 = await apiFetch(baseUrl, 'DELETE', `/api/private-library/saved/${pubBookId}`, { jar: jarAFresh });
        check('Removing non-saved book returns 404 cleanly', delA2.status === 404);

        const listB = await apiFetch(baseUrl, 'GET', '/api/private-library/saved', { jar: jarB });
        const publicFileGet = await apiFetch(baseUrl, 'GET', `/api/books/${pubBookId}/file`, { jar: jarAFresh });
        const publicMetaGet = await apiFetch(baseUrl, 'GET', `/api/books/${pubBookId}`, { jar: jarAFresh });
        check("Removing User A's save preserves User B's save, public book metadata, and original PDF",
            listB.json?.data?.savedBooks?.length === 1 &&
            publicMetaGet.status === 200 &&
            publicFileGet.status === 200 &&
            publicFileGet.buf.equals(pdfBytes));

        // Private PDF original file check
        const privOrigGet = await apiFetch(baseUrl, 'GET', `/api/private-library/${privUploadId}/file`, { jar: jarAFresh });
        check('Private PDF original file streams with application/pdf MIME type',
            privOrigGet.status === 200 && privOrigGet.contentType.includes('application/pdf'));

        // Frontend syntax & responsive code/CSS assertions
        for (const rel of [
            'frontend/js/layout.js',
            'frontend/js/pages/library.js',
            'frontend/js/pages/book.js',
            'frontend/js/pages/private-library.js',
            'frontend/js/pages/read.js',
        ]) {
            execFileSync('node', ['--check', rel], { stdio: 'pipe' });
        }
        check('All updated frontend JS modules pass node --check syntax verification', true);

        const layoutJs = fs.readFileSync('frontend/js/layout.js', 'utf8');
        const layoutCss = fs.readFileSync('frontend/css/layout.css', 'utf8');
        const libraryCss = fs.readFileSync('frontend/css/library.css', 'utf8');
        const readJs = fs.readFileSync('frontend/js/pages/read.js', 'utf8');
        const readHtml = fs.readFileSync('frontend/read.html', 'utf8');

        check('Collapsible mobile navigation toggle present with ARIA & responsive breakpoints',
            layoutJs.includes('className = "nav-toggle"') &&
            layoutJs.includes('aria-expanded') &&
            layoutCss.includes('@media (max-width: 767px)') &&
            layoutCss.includes('.navbar.is-menu-open .nav-links'));

        check('Book covers enforce 2:3 portrait aspect-ratio and object-fit: contain without stretching',
            libraryCss.includes('aspect-ratio: 2 / 3;') &&
            libraryCss.includes('object-fit: contain;') &&
            !libraryCss.includes('object-fit: cover;'));

        check('Original PDF reader opens PDF mode by default, provides full-screen toggle, and omits Download PDF button',
            readJs.includes('modeParam === "reflow"') &&
            readJs.includes('hasOriginalPdf && (requestedMode !== "reflow" || !hasReadablePages)') &&
            readHtml.includes('id="read-pdf-fullscreen"') &&
            !readHtml.includes('id="read-pdf-download"'));

    } finally {
        for (const id of createdPrivateFileIds) {
            const [rows] = await pool.query('SELECT stored_file_name FROM private_library_files WHERE private_file_id = ?', [id]);
            if (rows[0]?.stored_file_name) {
                const s = rows[0].stored_file_name;
                await deleteFileIfExists(resolvePrivatePdfPath(s)).catch(() => {});
                await deleteFileIfExists(resolvePrivateProcessedPath(buildPrivateProcessedName(s))).catch(() => {});
                await deleteDirectoryIfExists(resolvePrivateImagesDir(buildPrivateImagesDirName(s))).catch(() => {});
                for (const ext of COVER_EXTENSIONS) {
                    await deleteFileIfExists(resolvePublicCoverPath(buildCoverFileName(s, ext))).catch(() => {});
                }
            }
            await pool.query('DELETE FROM private_library_files WHERE private_file_id = ?', [id]).catch(() => {});
        }
        for (const id of createdBookIds) {
            const [rows] = await pool.query('SELECT pdf_stored_name, cover_image FROM books WHERE book_id = ?', [id]);
            if (rows[0]?.pdf_stored_name) {
                const s = rows[0].pdf_stored_name;
                await deleteFileIfExists(resolvePublicPdfPath(s)).catch(() => {});
                await deleteFileIfExists(resolvePublicProcessedPath(buildPublicProcessedName(s))).catch(() => {});
                await deleteDirectoryIfExists(resolvePublicImagesDir(buildPublicImagesDirName(s))).catch(() => {});
                for (const ext of COVER_EXTENSIONS) {
                    await deleteFileIfExists(resolvePublicCoverPath(buildCoverFileName(s, ext))).catch(() => {});
                }
            }
            if (rows[0]?.cover_image) {
                await deleteFileIfExists(resolvePublicCoverPath(rows[0].cover_image)).catch(() => {});
            }
            await pool.query('DELETE FROM books WHERE book_id = ?', [id]).catch(() => {});
        }
        if (createdAuthorIds.length) await pool.query('DELETE FROM authors WHERE author_id IN (?)', [createdAuthorIds]).catch(() => {});
        if (createdCategoryIds.length) await pool.query('DELETE FROM categories WHERE category_id IN (?)', [createdCategoryIds]).catch(() => {});
        if (createdUserIds.length) {
            await pool.query('DELETE FROM auth_events WHERE user_id IN (?)', [createdUserIds]).catch(() => {});
            await pool.query('DELETE FROM users WHERE user_id IN (?)', [createdUserIds]).catch(() => {});
        }
        await fsp.mkdir('uploads', { recursive: true }).catch(() => {});
        await new Promise((resolve) => server.close(resolve));
        await pool.end();
    }

    console.log(`\n=== Module 27.5 Verification Summary: ${passed} passed, ${failed} failed ===`);
    if (failed > 0) process.exitCode = 1;
}

run().catch((err) => {
    console.error('[FATAL]', err);
    process.exitCode = 1;
});
