'use strict';

/**
 * Module 27.5 — Book Cover, PDF-to-EPUB-Style Compatibility, Reader Format,
 * TTS Speed/Pitch (max 3x) & Pre-Hosting Quality Audit Automated Test Suite.
 *
 * Strictly isolated to digital_library_test. Cleans up all created users,
 * books, private files, auth_events, and disk artifacts in finally.
 *
 * Run:
 *   TEST_DB_NAME=digital_library_test node tests/module27.5-verification.test.js
 */

if (process.env.TEST_DB_NAME !== 'digital_library_test') {
    console.error('Test blocked: TEST_DB_NAME must equal digital_library_test.');
    process.exit(1);
}

process.env.DB_NAME = process.env.TEST_DB_NAME;

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const http = require('http');
const zlib = require('zlib');

const dbConfig = require('../backend/src/config/db.config');
if (dbConfig.database !== 'digital_library_test') {
    throw new Error(`Blocked: expected digital_library_test, got ${dbConfig.database}`);
}

const { pool } = require('../backend/src/config/database');
const app = require('../backend/src/app');
const {
    resolvePrivatePdfPath,
    resolvePrivateProcessedPath,
    resolvePrivateImagesDir,
    resolvePrivateCoverPath,
    buildPrivateProcessedName,
    buildPrivateImagesDirName,
    resolvePublicPdfPath,
    resolvePublicProcessedPath,
    resolvePublicImagesDir,
    resolvePublicCoverPath,
    buildPublicImagesDirName,
    buildCoverFileName,
    deleteFileIfExists,
    deleteDirectoryIfExists,
} = require('../backend/src/utils/fileStorage');
const { COVER_EXTENSIONS, generateFallbackCoverSvg } = require('../backend/src/utils/coverFallback');

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures', 'epub');
const AUTH_ORIGIN = 'http://localhost:3000';

let passed = 0;
let failed = 0;

function assert(description, condition, actual) {
    if (condition) {
        console.log(`[PASS] ${description}`);
        passed += 1;
    } else {
        console.error(`[FAIL] ${description} -> got:`, actual);
        failed += 1;
    }
}

function buildPdfFromObjects(objects, infoObjNum = null) {
    let pdf = '%PDF-1.4\n%\xE2\xE3\xCF\xD3\n';
    const offsets = [0];
    for (const obj of objects) {
        offsets.push(Buffer.byteLength(pdf, 'latin1'));
        pdf += obj;
    }
    const xrefOffset = Buffer.byteLength(pdf, 'latin1');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i += 1) {
        pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    const infoPart = infoObjNum ? ` /Info ${infoObjNum} 0 R` : '';
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R${infoPart} >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    return Buffer.from(pdf, 'latin1');
}

function createTextPdfBuffer({ title = 'Extracted Meta Title', text = 'Module 27.5 Reflowable PDF Text.' } = {}) {
    const contentStream = `BT\n/F1 18 Tf\n50 720 Td\n(${text}) Tj\nET\n`;
    const objects = [
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
        '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
        `5 0 obj\n<< /Length ${Buffer.byteLength(contentStream, 'latin1')} >>\nstream\n${contentStream}endstream\nendobj\n`,
        `6 0 obj\n<< /Title (${title}) /Author (Synthetic Author) >>\nendobj\n`,
    ];
    return buildPdfFromObjects(objects, 6);
}

function createScannedImageOnlyPdfBuffer() {
    // Valid PDF page with zero text operators and a simple filled rectangle graphic
    const contentStream = 'q\n0.2 0.4 0.7 rg\n50 600 200 100 re\nf\nQ\n';
    const objects = [
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n',
        `4 0 obj\n<< /Length ${Buffer.byteLength(contentStream, 'latin1')} >>\nstream\n${contentStream}endstream\nendobj\n`,
    ];
    return buildPdfFromObjects(objects);
}

function createPdfWithEmbeddedImageBuffer() {
    // 2x2 RGB raw image XObject compressed with FlateDecode + painted via /Im1 Do
    const rawRgb = Buffer.from([
        255, 0, 0,   0, 255, 0,
        0, 0, 255,   255, 255, 0,
    ]);
    const compressedImg = zlib.deflateSync(rawRgb).toString('latin1');
    const contentStream = 'BT\n/F1 16 Tf\n50 720 Td\n(Cover Image PDF Page 1) Tj\nET\nq\n100 0 0 100 50 500 cm\n/Im1 Do\nQ\n';

    const objects = [
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> /XObject << /Im1 6 0 R >> >> /Contents 5 0 R >>\nendobj\n',
        '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
        `5 0 obj\n<< /Length ${Buffer.byteLength(contentStream, 'latin1')} >>\nstream\n${contentStream}endstream\nendobj\n`,
        `6 0 obj\n<< /Type /XObject /Subtype /Image /Width 2 /Height 2 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${Buffer.byteLength(compressedImg, 'latin1')} >>\nstream\n${compressedImg}endstream\nendobj\n`,
    ];
    return buildPdfFromObjects(objects);
}

function parseSetCookies(res) {
    const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    const jar = {};
    for (const entry of raw) {
        const pair = entry.split(';')[0];
        const eq = pair.indexOf('=');
        if (eq > 0) {
            jar[pair.slice(0, eq).trim()] = pair.slice(eq + 1).trim();
        }
    }
    return jar;
}

async function apiFetch(baseUrl, method, urlPath, { jar = null, headers = {}, body = null, formData = null } = {}) {
    const reqHeaders = { ...headers };
    if (jar) {
        const str = Object.entries(jar).filter(([, v]) => Boolean(v)).map(([k, v]) => `${k}=${v}`).join('; ');
        if (str) reqHeaders.Cookie = str;
    }

    let reqBody = null;
    if (formData) {
        reqBody = formData;
    } else if (body !== null) {
        reqHeaders['Content-Type'] = 'application/json';
        reqBody = JSON.stringify(body);
    }

    const res = await fetch(`${baseUrl}${urlPath}`, { method, headers: reqHeaders, body: reqBody });
    const setCookies = parseSetCookies(res);
    const contentType = res.headers.get('content-type') || '';
    const buf = Buffer.from(await res.arrayBuffer());
    let json = null;
    if (contentType.includes('application/json')) {
        try { json = JSON.parse(buf.toString('utf8')); } catch (_) {}
    }

    return { status: res.status, headers: res.headers, contentType, buf, json, setCookies };
}

async function verifyDatabaseIsolation() {
    const [rows] = await pool.query('SELECT DATABASE() AS current_db');
    if (rows[0]?.current_db !== 'digital_library_test') {
        throw new Error(`Isolation failure: expected digital_library_test, got ${rows[0]?.current_db}`);
    }
}

async function run() {
    console.log('=== Module 27.5 — Covers, PDF/EPUB Modes, TTS 3x & Pre-Hosting Tests ===\n');
    await verifyDatabaseIsolation();
    assert('Database isolation verified: digital_library_test', true);

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const stamp = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const userAEmail = `m275_a_${stamp}@example.com`;
    const userBEmail = `m275_b_${stamp}@example.com`;
    const adminEmail = `m275_admin_${stamp}@example.com`;
    const password = `M275!Pass#${stamp}`;

    const createdUserIds = [];
    const createdBookIds = [];
    const createdPrivateIds = [];
    const publicFilesToClean = [];
    const privateFilesToClean = [];

    try {
        // -----------------------------------------------------------------
        // 1. Setup synthetic USER A, USER B, ADMIN
        // -----------------------------------------------------------------
        console.log('\n--- 1. Synthetic User Setup ---');
        const regA = await apiFetch(baseUrl, 'POST', '/api/auth/register', {
            headers: { Origin: AUTH_ORIGIN },
            body: { fullName: 'M275 User A', email: userAEmail, password },
        });
        const regB = await apiFetch(baseUrl, 'POST', '/api/auth/register', {
            headers: { Origin: AUTH_ORIGIN },
            body: { fullName: 'M275 User B', email: userBEmail, password },
        });
        const regAdmin = await apiFetch(baseUrl, 'POST', '/api/auth/register', {
            headers: { Origin: AUTH_ORIGIN },
            body: { fullName: 'M275 Admin', email: adminEmail, password },
        });
        assert('Synthetic accounts created (201)', regA.status === 201 && regB.status === 201 && regAdmin.status === 201, [regA.status, regB.status, regAdmin.status]);

        const userAId = regA.json.data.user.user_id;
        const userBId = regB.json.data.user.user_id;
        const adminId = regAdmin.json.data.user.user_id;
        createdUserIds.push(userAId, userBId, adminId);

        await pool.query(
            `UPDATE users SET role_id = (SELECT role_id FROM roles WHERE role_name = 'ADMIN' LIMIT 1) WHERE user_id = ?`,
            [adminId]
        );

        const loginA = await apiFetch(baseUrl, 'POST', '/api/auth/login', {
            headers: { Origin: AUTH_ORIGIN },
            body: { email: userAEmail, password },
        });
        const loginB = await apiFetch(baseUrl, 'POST', '/api/auth/login', {
            headers: { Origin: AUTH_ORIGIN },
            body: { email: userBEmail, password },
        });
        const loginAdmin = await apiFetch(baseUrl, 'POST', '/api/auth/login', {
            headers: { Origin: AUTH_ORIGIN },
            body: { email: adminEmail, password },
        });

        const jarA = loginA.setCookies;
        const csrfA = loginA.json.data.csrfToken;
        const jarB = loginB.setCookies;
        const csrfB = loginB.json.data.csrfToken;
        const jarAdmin = loginAdmin.setCookies;
        const csrfAdmin = loginAdmin.json.data.csrfToken;

        // -----------------------------------------------------------------
        // 2. Public PDF Upload, Cover Extraction, Fallback & Dual Reading Modes
        // -----------------------------------------------------------------
        console.log('\n--- 2. Public Book Covers, Dual PDF/EPUB-Style Modes & Visibility ---');

        // 2a. Public book with embedded PDF image -> extracted PNG cover + both reading modes
        const bookImgRes = await apiFetch(baseUrl, 'POST', '/api/books', {
            jar: jarAdmin,
            headers: { Origin: AUTH_ORIGIN, 'X-CSRF-Token': csrfAdmin },
            body: { title: 'Public Embedded Image Book', description: 'Has embedded PNG cover' },
        });
        assert('Admin creates public book for PDF image/cover test (201)', bookImgRes.status === 201, bookImgRes.status);
        const bookImgId = bookImgRes.json.data.book.book_id;
        createdBookIds.push(bookImgId);

        const imgPdfBuf = createPdfWithEmbeddedImageBuffer();
        const fdPubImgPdf = new FormData();
        fdPubImgPdf.append('format', 'PDF');
        fdPubImgPdf.append('file', new Blob([imgPdfBuf], { type: 'application/pdf' }), 'embedded-cover.pdf');
        const impPubImg = await apiFetch(baseUrl, 'POST', `/api/books/${bookImgId}/pdf`, {
            jar: jarAdmin,
            headers: { Origin: AUTH_ORIGIN, 'X-CSRF-Token': csrfAdmin },
            formData: fdPubImgPdf,
        });
        assert('Admin uploads PDF with embedded image (200)', impPubImg.status === 200, impPubImg.status);
        const [bImgRow] = await pool.query('SELECT pdf_stored_name, cover_path FROM books WHERE book_id = ?', [bookImgId]);
        if (bImgRow[0]?.pdf_stored_name) publicFilesToClean.push(bImgRow[0].pdf_stored_name);
        assert('Public PDF upload auto-populates canonical cover_path', bImgRow[0]?.cover_path === `/api/books/${bookImgId}/cover`, bImgRow[0]?.cover_path);

        // Draft visibility check for cover and original file
        const userDraftCover = await apiFetch(baseUrl, 'GET', `/api/books/${bookImgId}/cover`, { jar: jarA });
        const userDraftFile = await apiFetch(baseUrl, 'GET', `/api/books/${bookImgId}/file`, { jar: jarA });
        assert('Draft book cover and /file hidden from normal USER (404)',
            userDraftCover.status === 404 && userDraftFile.status === 404,
            [userDraftCover.status, userDraftFile.status]);

        const adminDraftCover = await apiFetch(baseUrl, 'GET', `/api/books/${bookImgId}/cover`, { jar: jarAdmin });
        assert('Admin can view draft book extracted PNG cover (200, image/png)',
            adminDraftCover.status === 200 && adminDraftCover.contentType.includes('image/png') &&
            adminDraftCover.buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
            adminDraftCover.contentType);

        // Publish and verify USER access to BOTH Original PDF (/file) and EPUB-style (/document) + Cover
        const pubRes = await apiFetch(baseUrl, 'PATCH', `/api/books/${bookImgId}/publish`, {
            jar: jarAdmin,
            headers: { Origin: AUTH_ORIGIN, 'X-CSRF-Token': csrfAdmin },
        });
        assert('Admin publishes PDF book (200)', pubRes.status === 200, pubRes.status);

        const userCover = await apiFetch(baseUrl, 'GET', `/api/books/${bookImgId}/cover`, { jar: jarA });
        assert('Published book PNG cover loads for USER (200, image/png)',
            userCover.status === 200 && userCover.contentType.includes('image/png'), userCover.status);

        // 2a-extra. Admin uploads custom JPEG cover -> overrides auto-extracted PNG
        const minJpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0xff, 0xd9]);
        const fdCoverOk = new FormData();
        fdCoverOk.append('cover', new Blob([minJpeg], { type: 'image/jpeg' }), 'custom-cover.jpg');
        const upCoverAdmin = await apiFetch(baseUrl, 'POST', `/api/books/${bookImgId}/cover`, {
            jar: jarAdmin,
            headers: { Origin: AUTH_ORIGIN, 'X-CSRF-Token': csrfAdmin },
            formData: fdCoverOk,
        });
        assert('Admin uploads custom JPEG cover via POST /api/books/:id/cover (200)',
            upCoverAdmin.status === 200 && upCoverAdmin.json?.data?.book?.cover_image?.startsWith('cover-'),
            upCoverAdmin.status);
        const uploadedCoverName = upCoverAdmin.json?.data?.book?.cover_image;
        const customCoverGet = await apiFetch(baseUrl, 'GET', `/api/books/${bookImgId}/cover`, { jar: jarA });
        assert('GET /api/books/:id/cover now serves uploaded JPEG (200, image/jpeg)',
            customCoverGet.status === 200 && customCoverGet.contentType.includes('image/jpeg') && customCoverGet.buf.equals(minJpeg),
            customCoverGet.contentType);

        // Clean up custom uploaded cover file in finally
        if (uploadedCoverName) {
            await deleteFileIfExists(resolvePublicCoverPath(uploadedCoverName)).catch(() => {});
        }

        const fdCoverUser = new FormData();
        fdCoverUser.append('cover', new Blob([minJpeg], { type: 'image/jpeg' }), 'unauth.jpg');
        const upCoverUser = await apiFetch(baseUrl, 'POST', `/api/books/${bookImgId}/cover`, {
            jar: jarA,
            headers: { Origin: AUTH_ORIGIN, 'X-CSRF-Token': csrfA },
            formData: fdCoverUser,
        });
        assert('Non-admin USER blocked from POST /api/books/:id/cover (403)', upCoverUser.status === 403, upCoverUser.status);

        const fdCoverFake = new FormData();
        fdCoverFake.append('cover', new Blob(['<html>fake jpg</html>'], { type: 'image/jpeg' }), 'fake.jpg');
        const upCoverFake = await apiFetch(baseUrl, 'POST', `/api/books/${bookImgId}/cover`, {
            jar: jarAdmin,
            headers: { Origin: AUTH_ORIGIN, 'X-CSRF-Token': csrfAdmin },
            formData: fdCoverFake,
        });
        assert('Fake JPEG cover magic bytes rejected (400)', upCoverFake.status === 400, upCoverFake.status);

        const userOrigFile = await apiFetch(baseUrl, 'GET', `/api/books/${bookImgId}/file`, { jar: jarA });
        assert('Original PDF mode (/api/books/:id/file) streams exact unmodified PDF (200)',
            userOrigFile.status === 200 && userOrigFile.contentType.includes('application/pdf') && userOrigFile.buf.equals(imgPdfBuf),
            [userOrigFile.status, userOrigFile.contentType]);

        const userReflowDoc = await apiFetch(baseUrl, 'GET', `/api/books/${bookImgId}/document`, { jar: jarA });
        assert('EPUB-style reflowable mode (/api/books/:id/document) returns structured PDF pages & hasOriginalFile=true',
            userReflowDoc.status === 200 &&
            userReflowDoc.json?.data?.document?.fileFormat === 'PDF' &&
            userReflowDoc.json?.data?.document?.hasOriginalFile === true &&
            userReflowDoc.json?.data?.document?.hasText === true &&
            userReflowDoc.json?.data?.document?.pages?.[0]?.text?.includes('Cover Image PDF Page 1'),
            userReflowDoc.json?.data?.document);

        // 2b. Text-only book (XSS payload in title) -> SVG fallback cover (XML escaped)
        const bookFallbackRes = await apiFetch(baseUrl, 'POST', '/api/books', {
            jar: jarAdmin,
            headers: { Origin: AUTH_ORIGIN, 'X-CSRF-Token': csrfAdmin },
            body: { title: 'Fallback <script>alert(1)</script> Book', description: 'Text only' },
        });
        const bookFallbackId = bookFallbackRes.json.data.book.book_id;
        createdBookIds.push(bookFallbackId);
        await apiFetch(baseUrl, 'PATCH', `/api/books/${bookFallbackId}/publish`, {
            jar: jarAdmin,
            headers: { Origin: AUTH_ORIGIN, 'X-CSRF-Token': csrfAdmin },
        });
        const fallbackCoverRes = await apiFetch(baseUrl, 'GET', `/api/books/${bookFallbackId}/cover`, { jar: jarA });
        const fallbackSvgText = fallbackCoverRes.buf.toString('utf8');
        assert('Text-only book serves safe SVG fallback cover (200, image/svg+xml, XML-escaped)',
            fallbackCoverRes.status === 200 &&
            fallbackCoverRes.contentType.includes('image/svg+xml') &&
            fallbackSvgText.includes('<svg') &&
            !fallbackSvgText.includes('<script>alert(1)</script>') &&
            fallbackSvgText.includes('&lt;script&gt;'),
            fallbackCoverRes.contentType);

        // 2c. Scanned / image-only PDF (no text operators) -> isScanned=true, hasText=false, original /file still works
        const bookScanRes = await apiFetch(baseUrl, 'POST', '/api/books', {
            jar: jarAdmin,
            headers: { Origin: AUTH_ORIGIN, 'X-CSRF-Token': csrfAdmin },
            body: { title: 'Scanned Book Test' },
        });
        const bookScanId = bookScanRes.json.data.book.book_id;
        createdBookIds.push(bookScanId);

        const scannedBuf = createScannedImageOnlyPdfBuffer();
        const fdScan = new FormData();
        fdScan.append('format', 'PDF');
        fdScan.append('file', new Blob([scannedBuf], { type: 'application/pdf' }), 'scanned.pdf');
        await apiFetch(baseUrl, 'POST', `/api/books/${bookScanId}/pdf`, {
            jar: jarAdmin,
            headers: { Origin: AUTH_ORIGIN, 'X-CSRF-Token': csrfAdmin },
            formData: fdScan,
        });
        const [bScanRow] = await pool.query('SELECT pdf_stored_name FROM books WHERE book_id = ?', [bookScanId]);
        if (bScanRow[0]?.pdf_stored_name) publicFilesToClean.push(bScanRow[0].pdf_stored_name);
        await apiFetch(baseUrl, 'PATCH', `/api/books/${bookScanId}/publish`, {
            jar: jarAdmin,
            headers: { Origin: AUTH_ORIGIN, 'X-CSRF-Token': csrfAdmin },
        });

        const scanDoc = await apiFetch(baseUrl, 'GET', `/api/books/${bookScanId}/document`, { jar: jarA });
        const scanFile = await apiFetch(baseUrl, 'GET', `/api/books/${bookScanId}/file`, { jar: jarA });
        assert('Scanned PDF reports hasText=false, isScanned=true while Original PDF (/file) succeeds (200)',
            scanDoc.status === 200 && scanDoc.json?.data?.document?.hasText === false &&
            scanDoc.json?.data?.document?.isScanned === true && scanFile.status === 200,
            [scanDoc.json?.data?.document?.hasText, scanDoc.json?.data?.document?.isScanned, scanFile.status]);

        // -----------------------------------------------------------------
        // 3. Private Library PDF Upload -> Reflow + Original PDF + Cover + Images + Isolation
        // -----------------------------------------------------------------
        console.log('\n--- 3. Private Library Covers, PDF Metadata, Dual Modes & Isolation ---');

        // 3a. Empty & invalid PDF rejections
        const emptyFd = new FormData();
        emptyFd.append('format', 'PDF');
        emptyFd.append('file', new Blob([], { type: 'application/pdf' }), 'empty.pdf');
        const emptyRes = await apiFetch(baseUrl, 'POST', '/api/private-library/upload', {
            jar: jarA,
            headers: { Origin: AUTH_ORIGIN, 'X-CSRF-Token': csrfA },
            formData: emptyFd,
        });
        assert('Empty PDF rejected (400)', emptyRes.status === 400, emptyRes.status);

        const badFd = new FormData();
        badFd.append('format', 'PDF');
        badFd.append('file', new Blob(['NOT A PDF'], { type: 'application/pdf' }), 'bad.pdf');
        const badRes = await apiFetch(baseUrl, 'POST', '/api/private-library/upload', {
            jar: jarA,
            headers: { Origin: AUTH_ORIGIN, 'X-CSRF-Token': csrfA },
            formData: badFd,
        });
        assert('Invalid PDF header rejected (400)', badRes.status === 400, badRes.status);

        // 3b. Upload PDF WITHOUT title -> picks up PDF metadata title!
        const metaPdfBuf = createTextPdfBuffer({ title: 'PDF Embedded Meta Title', text: 'Private PDF paragraph content for TTS and reflow.' });
        const fdPrivText = new FormData();
        fdPrivText.append('format', 'PDF');
        fdPrivText.append('file', new Blob([metaPdfBuf], { type: 'application/pdf' }), 'no-title-upload.pdf');

        const upPrivText = await apiFetch(baseUrl, 'POST', '/api/private-library/upload', {
            jar: jarA,
            headers: { Origin: AUTH_ORIGIN, 'X-CSRF-Token': csrfA },
            formData: fdPrivText,
        });
        assert('Private PDF upload succeeds without requiring EPUB upload (201)', upPrivText.status === 201, upPrivText.status);
        const privTextFile = upPrivText.json?.data?.privateFile;
        if (privTextFile?.private_file_id) createdPrivateIds.push(privTextFile.private_file_id);
        assert('Private upload extracts fallback title from PDF metadata when title omitted',
            privTextFile?.title === 'PDF Embedded Meta Title' && privTextFile?.cover_url === `/api/private-library/${privTextFile.private_file_id}/cover`,
            privTextFile);

        // 3c. Upload private PDF WITH embedded image -> cover + private image endpoint + original file + reflow document
        const fdPrivImg = new FormData();
        fdPrivImg.append('title', 'Private Graphic PDF');
        fdPrivImg.append('format', 'PDF');
        fdPrivImg.append('file', new Blob([imgPdfBuf], { type: 'application/pdf' }), 'priv-img.pdf');
        const upPrivImg = await apiFetch(baseUrl, 'POST', '/api/private-library/upload', {
            jar: jarA,
            headers: { Origin: AUTH_ORIGIN, 'X-CSRF-Token': csrfA },
            formData: fdPrivImg,
        });
        assert('Private PDF with embedded image uploaded (201)', upPrivImg.status === 201, upPrivImg.status);
        const privImgId = upPrivImg.json?.data?.privateFile?.private_file_id;
        if (privImgId) createdPrivateIds.push(privImgId);

        if (createdPrivateIds.length > 0) {
            const [pRows] = await pool.query(
                `SELECT stored_file_name FROM private_library_files WHERE private_file_id IN (${createdPrivateIds.map(() => '?').join(',')})`,
                createdPrivateIds
            );
            for (const r of pRows) privateFilesToClean.push(r.stored_file_name);
        }

        const privCoverOwner = await apiFetch(baseUrl, 'GET', `/api/private-library/${privImgId}/cover`, { jar: jarA });
        const privDocOwner = await apiFetch(baseUrl, 'GET', `/api/private-library/${privImgId}/document`, { jar: jarA });
        const privFileOwner = await apiFetch(baseUrl, 'GET', `/api/private-library/${privImgId}/file`, { jar: jarA });
        const privImgName = path.basename(privDocOwner.json?.data?.document?.images?.[0]?.file || 'missing.png');
        const privImageOwner = await apiFetch(baseUrl, 'GET', `/api/private-library/${privImgId}/images/${privImgName}`, { jar: jarA });

        assert('Owner (USER A) accesses private cover (PNG), reflow document, original PDF, and extracted private image (200)',
            privCoverOwner.status === 200 && privCoverOwner.contentType.includes('image/png') &&
            privDocOwner.status === 200 && privDocOwner.json?.data?.document?.images?.length === 1 &&
            privFileOwner.status === 200 && privFileOwner.buf.equals(imgPdfBuf) &&
            privImageOwner.status === 200 && privImageOwner.contentType.includes('image/png'),
            [privCoverOwner.status, privDocOwner.status, privFileOwner.status, privImageOwner.status]);

        // Private cover, image, document & file authorization against USER B and ADMIN
        for (const [label, intruderJar] of [['USER B', jarB], ['ADMIN', jarAdmin]]) {
            const ic = await apiFetch(baseUrl, 'GET', `/api/private-library/${privImgId}/cover`, { jar: intruderJar });
            const ii = await apiFetch(baseUrl, 'GET', `/api/private-library/${privImgId}/images/${privImgName}`, { jar: intruderJar });
            const idoc = await apiFetch(baseUrl, 'GET', `/api/private-library/${privImgId}/document`, { jar: intruderJar });
            const ifile = await apiFetch(baseUrl, 'GET', `/api/private-library/${privImgId}/file`, { jar: intruderJar });
            assert(`Private Isolation: ${label} blocked from USER A cover/image/document/file (404)`,
                ic.status === 404 && ii.status === 404 && idoc.status === 404 && ifile.status === 404,
                [ic.status, ii.status, idoc.status, ifile.status]);
        }

        // Fallback SVG cover for text-only private PDF
        const privFallbackCover = await apiFetch(baseUrl, 'GET', `/api/private-library/${privTextFile.private_file_id}/cover`, { jar: jarA });
        assert('Text-only private PDF returns SVG fallback cover (200, image/svg+xml)',
            privFallbackCover.status === 200 && privFallbackCover.contentType.includes('image/svg+xml'),
            privFallbackCover.contentType);

        // Path traversal on private image endpoint
        const privTraversal = await apiFetch(baseUrl, 'GET', `/api/private-library/${privImgId}/images/..%2Fsecret.png`, { jar: jarA });
        assert('Private image endpoint rejects path traversal (400)', privTraversal.status === 400, privTraversal.status);

        // -----------------------------------------------------------------
        // 4. TTS Speed (max 3x), Pitch (0.5x-3x), Frontend Config & Reader HTML Checks
        // -----------------------------------------------------------------
        console.log('\n--- 4. TTS Controls (3x Speed & Pitch), Reader UI & Pre-Hosting Config ---');

        const ttsMod = await import('../frontend/js/pages/read-tts.js');
        assert('TTS RATE_RANGE is 0.5..3 step 0.25 default 1',
            ttsMod.RATE_RANGE.min === 0.5 && ttsMod.RATE_RANGE.max === 3 && ttsMod.RATE_RANGE.step === 0.25 && ttsMod.RATE_RANGE.def === 1,
            ttsMod.RATE_RANGE);
        assert('TTS PITCH_RANGE is 0.5..3 step 0.25 default 1',
            ttsMod.PITCH_RANGE.min === 0.5 && ttsMod.PITCH_RANGE.max === 3 && ttsMod.PITCH_RANGE.step === 0.25 && ttsMod.PITCH_RANGE.def === 1,
            ttsMod.PITCH_RANGE);

        const validStops = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3];
        assert('All expected speed/pitch stops (0.5x..3x) validate cleanly',
            validStops.every((v) => ttsMod.validateTtsValue(v, ttsMod.RATE_RANGE) === v && ttsMod.validateTtsValue(v, ttsMod.PITCH_RANGE) === v));
        assert('TTS rejects out-of-range/invalid rate & pitch values (>3, <0.5, NaN, Infinity, non-numeric)',
            ttsMod.validateTtsValue(4, ttsMod.RATE_RANGE) === 1 &&
            ttsMod.validateTtsValue(3.25, ttsMod.RATE_RANGE) === 1 &&
            ttsMod.validateTtsValue(0, ttsMod.PITCH_RANGE) === 1 &&
            ttsMod.validateTtsValue(4, ttsMod.PITCH_RANGE) === 1 &&
            ttsMod.validateTtsValue(-1, ttsMod.PITCH_RANGE) === 1 &&
            ttsMod.validateTtsValue(NaN, ttsMod.RATE_RANGE) === 1 &&
            ttsMod.validateTtsValue('invalid', ttsMod.PITCH_RANGE) === 1);
        assert('TTS multiplier formatter displays 1× and 3× accurately',
            ttsMod.formatTtsMultiplier(1) === '1×' && ttsMod.formatTtsMultiplier(3) === '3×' && ttsMod.formatTtsMultiplier(0.75) === '0.75×');

        const readHtml = fs.readFileSync(path.resolve(__dirname, '..', 'frontend', 'read.html'), 'utf8');
        assert('read.html enforces speed slider max="3" and pitch min="0.5" max="3" step="0.25"',
            readHtml.includes('id="read-audio-speed" min="0.5" max="3" step="0.25" value="1"') &&
            readHtml.includes('id="read-audio-pitch" min="0.5" max="3" step="0.25" value="1"') &&
            readHtml.includes('id="read-mode-switch"') &&
            readHtml.includes('id="read-pdf-viewer"'),
            'HTML check failed');

        // Verify fallback SVG helper directly rejects script tags
        const xssSvg = generateFallbackCoverSvg({ id: 99, title: '<script>evil()</script>', format: 'PDF' }).toString('utf8');
        assert('generateFallbackCoverSvg escapes HTML/script payloads safely', !xssSvg.includes('<script>evil()</script>'));

        // Verify frontend config.js + all edited frontend modules parse cleanly
        const configMod = await import('../frontend/js/config.js');
        assert('frontend/js/config.js resolves API_BASE_URL without error', Boolean(configMod.API_BASE_URL));
        const readJs = fs.readFileSync(path.resolve(__dirname, '..', 'frontend', 'js', 'pages', 'read.js'), 'utf8');
        assert('read.js preserves existing reader settings, chapters, and TTS initialization',
            readJs.includes('initSettings(') && readJs.includes('initChapters(') && readJs.includes('initTts('));

    } finally {
        for (const stored of publicFilesToClean) {
            try {
                await deleteFileIfExists(resolvePublicPdfPath(stored));
                const base = path.basename(stored, path.extname(stored));
                await deleteFileIfExists(resolvePublicProcessedPath(`${base}.processed.json`));
                await deleteDirectoryIfExists(resolvePublicImagesDir(buildPublicImagesDirName(stored)));
                for (const ext of COVER_EXTENSIONS) {
                    await deleteFileIfExists(resolvePublicCoverPath(buildCoverFileName(stored, ext)));
                }
            } catch (_) {}
        }
        for (const stored of privateFilesToClean) {
            try {
                await deleteFileIfExists(resolvePrivatePdfPath(stored));
                await deleteFileIfExists(resolvePrivateProcessedPath(buildPrivateProcessedName(stored)));
                await deleteDirectoryIfExists(resolvePrivateImagesDir(buildPrivateImagesDirName(stored)));
                for (const ext of COVER_EXTENSIONS) {
                    await deleteFileIfExists(resolvePrivateCoverPath(buildCoverFileName(stored, ext)));
                }
            } catch (_) {}
        }
        if (createdPrivateIds.length > 0) {
            await pool.query(
                `DELETE FROM private_library_files WHERE private_file_id IN (${createdPrivateIds.map(() => '?').join(',')})`,
                createdPrivateIds
            ).catch(() => {});
        }
        if (createdBookIds.length > 0) {
            await pool.query(
                `DELETE FROM books WHERE book_id IN (${createdBookIds.map(() => '?').join(',')})`,
                createdBookIds
            ).catch(() => {});
        }
        if (createdUserIds.length > 0) {
            await pool.query(
                `DELETE FROM auth_events WHERE user_id IN (${createdUserIds.map(() => '?').join(',')})`,
                createdUserIds
            ).catch(() => {});
            await pool.query(
                `DELETE FROM users WHERE user_id IN (${createdUserIds.map(() => '?').join(',')})`,
                createdUserIds
            ).catch(() => {});
        }

        await new Promise((resolve) => server.close(resolve));
        await pool.end();
    }

    console.log(`\n=== Module 27.5 Verification Complete: ${passed} passed, ${failed} failed ===\n`);
    if (failed > 0) {
        process.exit(1);
    }
}

run().catch((err) => {
    console.error('Fatal Module 27.5 test error:', err);
    pool.end().catch(() => {});
    process.exit(1);
});
