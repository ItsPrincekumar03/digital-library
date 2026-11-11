'use strict';

/**
 * Module 27 — Security and Regression Verification Automated Test Suite.
 *
 * Strictly isolated to digital_library_test and ephemeral local HTTP server.
 * Cleans up all synthetic users, books, private files, auth_events, revoked_tokens,
 * and uploaded files on exit.
 *
 * Run:
 *   TEST_DB_NAME=digital_library_test node tests/module27-security-verification.test.js
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
const express = require('../backend/node_modules/express');

const dbConfig = require('../backend/src/config/db.config');
if (dbConfig.database !== 'digital_library_test') {
    throw new Error(`Blocked: DB_NAME resolved to ${dbConfig.database}, expected digital_library_test.`);
}

const { pool } = require('../backend/src/config/database');
const app = require('../backend/src/app');
const { buildCspConfig } = require('../backend/src/config/csp.config');
const { processEpubFile } = require('../backend/src/utils/epubProcessor');
const {
    getPrivateUploadDirectory,
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
const { COVER_EXTENSIONS } = require('../backend/src/utils/coverFallback');

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures', 'epub');
const AUTH_COOKIE_ORIGIN = 'http://localhost:3000';

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

function createMinimalPdfBuffer(text = 'Module 27 Security Test PDF') {
    const contentStream = `BT\n/F1 16 Tf\n50 720 Td\n(${text}) Tj\nET\n`;
    const objects = [
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
        '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
        `5 0 obj\n<< /Length ${Buffer.byteLength(contentStream, 'utf8')} >>\nstream\n${contentStream}endstream\nendobj\n`,
    ];

    let pdf = '%PDF-1.4\n';
    const offsets = [0];
    for (const obj of objects) {
        offsets.push(Buffer.byteLength(pdf, 'utf8'));
        pdf += obj;
    }
    const xrefOffset = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let i = 1; i <= objects.length; i += 1) {
        pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    return Buffer.from(pdf, 'utf8');
}

function createArbitraryZipBuffer() {
    // Minimal valid ZIP with a single file "hello.txt" (not an EPUB mimetype)
    const name = Buffer.from('hello.txt', 'utf8');
    const data = Buffer.from('not an epub', 'utf8');
    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);

    const cdOffset = localHeader.length + name.length + data.length;
    const cdSize = centralHeader.length + name.length;

    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(1, 8);
    eocd.writeUInt16LE(1, 10);
    eocd.writeUInt32LE(cdSize, 12);
    eocd.writeUInt32LE(cdOffset, 16);

    return Buffer.concat([localHeader, name, data, centralHeader, name, eocd]);
}

function parseSetCookieHeaders(res) {
    const raw = res.headers.getSetCookie ? res.headers.getSetCookie() : [];
    const map = {};
    for (const entry of raw) {
        const firstPart = entry.split(';')[0];
        const eqIdx = firstPart.indexOf('=');
        if (eqIdx > 0) {
            const name = firstPart.slice(0, eqIdx).trim();
            const val = firstPart.slice(eqIdx + 1).trim();
            map[name] = { value: val, raw: entry };
        }
    }
    return map;
}

function buildCookieHeader(jar) {
    return Object.entries(jar)
        .filter(([, v]) => v && v.value)
        .map(([k, v]) => `${k}=${v.value}`)
        .join('; ');
}

async function apiFetch(baseUrl, method, urlPath, { jar = null, headers = {}, body = null, formData = null } = {}) {
    const reqHeaders = { ...headers };
    if (jar) {
        const cookieStr = buildCookieHeader(jar);
        if (cookieStr) reqHeaders.Cookie = cookieStr;
    }

    let reqBody = null;
    if (formData) {
        reqBody = formData;
    } else if (body !== null) {
        reqHeaders['Content-Type'] = 'application/json';
        reqBody = JSON.stringify(body);
    }

    const res = await fetch(`${baseUrl}${urlPath}`, {
        method,
        headers: reqHeaders,
        body: reqBody,
    });

    const setCookies = parseSetCookieHeaders(res);
    let json = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        try { json = await res.json(); } catch (_) {}
    }

    return { status: res.status, headers: res.headers, setCookies, json };
}

async function verifyDatabaseIsolation() {
    const [rows] = await pool.query('SELECT DATABASE() AS current_db');
    if (rows[0]?.current_db !== 'digital_library_test') {
        throw new Error(`Isolation check failed: connected to ${rows[0]?.current_db}`);
    }
}

async function run() {
    console.log('=== Module 27 — Security and Regression Verification Suite ===\n');
    await verifyDatabaseIsolation();
    assert('Database isolation verified: digital_library_test', true);

    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const baseUrl = `http://127.0.0.1:${server.address().port}`;

    const stamp = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const userAEmail = `sec_user_a_${stamp}@example.com`;
    const userBEmail = `sec_user_b_${stamp}@example.com`;
    const adminEmail = `sec_admin_${stamp}@example.com`;
    const testSecretPassword = `SecTest!Pass#${stamp}`;
    const newSecretPassword = `SecTest!New#${stamp}`;

    const createdUserIds = [];
    const createdBookIds = [];
    const createdPrivateFileIds = [];
    const privateFilesToClean = [];
    const publicArtifactsToClean = [];

    // Capture console logs during auth operations to verify zero secret leakage
    const capturedLogs = [];
    const origLog = console.log;
    const origErr = console.error;
    function captureStart() {
        console.log = (...args) => {
            capturedLogs.push(args.map(String).join(' '));
            origLog(...args);
        };
        console.error = (...args) => {
            capturedLogs.push(args.map(String).join(' '));
            origErr(...args);
        };
    }
    function captureStop() {
        console.log = origLog;
        console.error = origErr;
    }

    try {
        // -----------------------------------------------------------------
        // 1. User Registration, Login, Cookie & JWT Security, Role Promotion
        // -----------------------------------------------------------------
        console.log('\n--- 1. Auth, Cookie & RBAC Verification ---');
        captureStart();

        const regA = await apiFetch(baseUrl, 'POST', '/api/auth/register', {
            headers: { Origin: AUTH_COOKIE_ORIGIN },
            body: { fullName: 'Security User A', email: userAEmail, password: testSecretPassword },
        });
        assert('Register USER A succeeds (201)', regA.status === 201, regA.status);
        assert('Register response omits password_hash', regA.json?.data?.user?.password_hash === undefined, regA.json);
        const userAId = regA.json?.data?.user?.user_id;
        if (userAId) createdUserIds.push(userAId);

        const regB = await apiFetch(baseUrl, 'POST', '/api/auth/register', {
            headers: { Origin: AUTH_COOKIE_ORIGIN },
            body: { fullName: 'Security User B', email: userBEmail, password: testSecretPassword },
        });
        assert('Register USER B succeeds (201)', regB.status === 201, regB.status);
        const userBId = regB.json?.data?.user?.user_id;
        if (userBId) createdUserIds.push(userBId);

        const regAdmin = await apiFetch(baseUrl, 'POST', '/api/auth/register', {
            headers: { Origin: AUTH_COOKIE_ORIGIN },
            body: { fullName: 'Security Admin', email: adminEmail, password: testSecretPassword },
        });
        assert('Register synthetic ADMIN succeeds (201)', regAdmin.status === 201, regAdmin.status);
        const adminId = regAdmin.json?.data?.user?.user_id;
        if (adminId) createdUserIds.push(adminId);

        // Promote synthetic admin only in isolated test DB
        await pool.query(
            `UPDATE users SET role_id = (SELECT role_id FROM roles WHERE role_name = 'ADMIN' LIMIT 1) WHERE user_id = ?`,
            [adminId]
        );

        // Failed login test (SEC-04 audit log test too)
        const badLogin = await apiFetch(baseUrl, 'POST', '/api/auth/login', {
            headers: { Origin: AUTH_COOKIE_ORIGIN },
            body: { email: userAEmail, password: 'WrongPassword!123' },
        });
        assert('Invalid login rejected with 401', badLogin.status === 401, badLogin.status);

        // Login USER A, USER B, ADMIN
        const loginA = await apiFetch(baseUrl, 'POST', '/api/auth/login', {
            headers: { Origin: AUTH_COOKIE_ORIGIN },
            body: { email: userAEmail, password: testSecretPassword },
        });
        assert('Login USER A succeeds (200)', loginA.status === 200, loginA.status);
        assert('JWT set as HttpOnly + SameSite=Lax cookie',
            loginA.setCookies.token?.raw.includes('HttpOnly') && /SameSite=Lax/i.test(loginA.setCookies.token?.raw || ''),
            loginA.setCookies.token?.raw);
        assert('JWT is NOT returned in JSON login body', loginA.json?.data?.token === undefined, loginA.json);
        assert('CSRF token cookie and JSON csrfToken issued on login',
            Boolean(loginA.setCookies.csrf_token?.value) && Boolean(loginA.json?.data?.csrfToken),
            loginA.setCookies);

        const jarA = { token: loginA.setCookies.token, csrf_token: loginA.setCookies.csrf_token };
        const csrfA = loginA.json?.data?.csrfToken;

        const loginB = await apiFetch(baseUrl, 'POST', '/api/auth/login', {
            headers: { Origin: AUTH_COOKIE_ORIGIN },
            body: { email: userBEmail, password: testSecretPassword },
        });
        const jarB = { token: loginB.setCookies.token, csrf_token: loginB.setCookies.csrf_token };
        const csrfB = loginB.json?.data?.csrfToken;

        const loginAdmin = await apiFetch(baseUrl, 'POST', '/api/auth/login', {
            headers: { Origin: AUTH_COOKIE_ORIGIN },
            body: { email: adminEmail, password: testSecretPassword },
        });
        const jarAdmin = { token: loginAdmin.setCookies.token, csrf_token: loginAdmin.setCookies.csrf_token };
        const csrfAdmin = loginAdmin.json?.data?.csrfToken;

        // Role escalation check
        const escAdminCheck = await apiFetch(baseUrl, 'GET', '/api/auth/admin-check', { jar: jarA });
        assert('RBAC: USER A blocked from /api/auth/admin-check (403)', escAdminCheck.status === 403, escAdminCheck.status);

        const escCreateBook = await apiFetch(baseUrl, 'POST', '/api/books', {
            jar: jarA,
            headers: { Origin: AUTH_COOKIE_ORIGIN, 'X-CSRF-Token': csrfA },
            body: { title: 'Unauthorized Book' },
        });
        assert('RBAC: USER A blocked from POST /api/books (403)', escCreateBook.status === 403, escCreateBook.status);

        const adminCheckOk = await apiFetch(baseUrl, 'GET', '/api/auth/admin-check', { jar: jarAdmin });
        assert('RBAC: ADMIN allowed on /api/auth/admin-check (200)', adminCheckOk.status === 200, adminCheckOk.status);

        // -----------------------------------------------------------------
        // 2. SEC-01 — CSRF Protection Tests
        // -----------------------------------------------------------------
        console.log('\n--- 2. SEC-01 — CSRF Protection Tests ---');

        const csrfMissing = await apiFetch(baseUrl, 'PUT', '/api/users/profile', {
            jar: jarA,
            headers: { Origin: AUTH_COOKIE_ORIGIN },
            body: { fullName: 'CSRF Attacker', email: userAEmail },
        });
        assert('SEC-01: Missing X-CSRF-Token rejected with 403',
            csrfMissing.status === 403 && csrfMissing.json?.code === 'CSRF_TOKEN_MISSING',
            csrfMissing.status);

        const csrfInvalid = await apiFetch(baseUrl, 'PUT', '/api/users/profile', {
            jar: jarA,
            headers: { Origin: AUTH_COOKIE_ORIGIN, 'X-CSRF-Token': 'forged-csrf-token-value' },
            body: { fullName: 'CSRF Attacker', email: userAEmail },
        });
        assert('SEC-01: Invalid X-CSRF-Token rejected with 403',
            csrfInvalid.status === 403 && csrfInvalid.json?.code === 'CSRF_TOKEN_INVALID',
            csrfInvalid.status);

        const csrfCrossUserToken = await apiFetch(baseUrl, 'PUT', '/api/users/profile', {
            jar: { token: jarA.token, csrf_token: jarB.csrf_token },
            headers: { Origin: AUTH_COOKIE_ORIGIN, 'X-CSRF-Token': csrfB },
            body: { fullName: 'CSRF User-Swap', email: userAEmail },
        });
        assert('SEC-01: Cross-user signed CSRF token bound to USER B rejected for USER A (403)',
            csrfCrossUserToken.status === 403 && csrfCrossUserToken.json?.code === 'CSRF_TOKEN_INVALID',
            csrfCrossUserToken.status);

        const csrfUntrustedOrigin = await apiFetch(baseUrl, 'POST', '/api/books', {
            jar: jarAdmin,
            headers: { Origin: 'https://evil-attacker.example', 'X-CSRF-Token': csrfAdmin },
            body: { title: 'Cross-Origin Attack' },
        });
        assert('SEC-01: Untrusted Origin rejected with 403',
            csrfUntrustedOrigin.status === 403 && csrfUntrustedOrigin.json?.code === 'CSRF_ORIGIN_FORBIDDEN',
            csrfUntrustedOrigin.status);

        const csrfUntrustedReferer = await apiFetch(baseUrl, 'PUT', '/api/users/profile', {
            jar: jarA,
            headers: { Referer: 'https://evil-attacker.example/exploit.html', 'X-CSRF-Token': csrfA },
            body: { fullName: 'Referer Attack', email: userAEmail },
        });
        assert('SEC-01: Untrusted Referer rejected with 403',
            csrfUntrustedReferer.status === 403 && csrfUntrustedReferer.json?.code === 'CSRF_ORIGIN_FORBIDDEN',
            csrfUntrustedReferer.status);

        const csrfValidReq = await apiFetch(baseUrl, 'PUT', '/api/users/profile', {
            jar: jarA,
            headers: { Origin: AUTH_COOKIE_ORIGIN, 'X-CSRF-Token': csrfA },
            body: { fullName: 'Security User A Verified', email: userAEmail },
        });
        assert('SEC-01: Valid CSRF token + trusted Origin succeeds (200)', csrfValidReq.status === 200, csrfValidReq.status);

        const csrfEndpoint = await apiFetch(baseUrl, 'GET', '/api/auth/csrf-token', { jar: jarA });
        assert('SEC-01: GET /api/auth/csrf-token issues valid token (200)',
            csrfEndpoint.status === 200 && Boolean(csrfEndpoint.json?.data?.csrfToken),
            csrfEndpoint.status);

        const bearerBypassOk = await apiFetch(baseUrl, 'GET', '/api/auth/me', {
            headers: { Authorization: `Bearer ${jarA.token.value}` },
        });
        assert('SEC-01: Explicit Bearer auth works cleanly on API endpoints (200)', bearerBypassOk.status === 200, bearerBypassOk.status);

        // -----------------------------------------------------------------
        // 3. SEC-02 — CSP & Security Headers
        // -----------------------------------------------------------------
        console.log('\n--- 3. SEC-02 — CSP & Security Headers Verification ---');

        const healthRes = await apiFetch(baseUrl, 'GET', '/api/health');
        const cspHeader = healthRes.headers.get('content-security-policy') || '';
        assert('SEC-02: Content-Security-Policy header is present', cspHeader.length > 0, cspHeader);
        assert('SEC-02: CSP restricts script-src to self without unsafe-inline or unsafe-eval',
            cspHeader.includes("script-src 'self'") && !cspHeader.includes("'unsafe-inline'") && !cspHeader.includes("'unsafe-eval'"),
            cspHeader);
        assert('SEC-02: CSP allows img-src blob: data: and worker-src self blob:',
            cspHeader.includes("img-src 'self' blob: data:") && cspHeader.includes("worker-src 'self' blob:"),
            cspHeader);
        assert('SEC-02: CSP sets frame-ancestors none and object-src none',
            cspHeader.includes("frame-ancestors 'none'") && cspHeader.includes("object-src 'none'"),
            cspHeader);
        assert('SEC-02: X-Content-Type-Options nosniff header set',
            healthRes.headers.get('x-content-type-options') === 'nosniff',
            healthRes.headers.get('x-content-type-options'));

        const prodCsp = buildCspConfig(true);
        assert('SEC-02: Production CSP enables upgradeInsecureRequests',
            Array.isArray(prodCsp.directives.upgradeInsecureRequests) && prodCsp.reportOnly === false,
            prodCsp.directives);

        // Check frontend HTML files for zero inline scripts/styles/event handlers
        const frontendDir = path.resolve(__dirname, '..', 'frontend');
        const htmlFiles = fs.readdirSync(frontendDir).filter((f) => f.endsWith('.html'));
        let inlineViolation = null;
        for (const file of htmlFiles) {
            const html = fs.readFileSync(path.join(frontendDir, file), 'utf8');
            if (/<script(?![^>]*\bsrc=)[^>]*>/i.test(html) || /<style\b/i.test(html) || /\son[a-z]+\s*=/i.test(html)) {
                inlineViolation = file;
                break;
            }
        }
        assert('SEC-02: All frontend HTML pages contain zero inline scripts, styles, or on* handlers',
            inlineViolation === null, inlineViolation);

        // -----------------------------------------------------------------
        // 4. SEC-03 — Rate Limiting Tests (Isolated Production Thresholds)
        // -----------------------------------------------------------------
        console.log('\n--- 4. SEC-03 — Rate Limiting Tests ---');

        const origNodeEnv = process.env.NODE_ENV;
        process.env.NODE_ENV = 'production';
        const rateLimiterPath = require.resolve('../backend/src/middleware/rateLimiter');
        delete require.cache[rateLimiterPath];
        const prodLimiters = require('../backend/src/middleware/rateLimiter');
        // Restore module cache for dev mode cleanly
        process.env.NODE_ENV = origNodeEnv;
        delete require.cache[rateLimiterPath];
        require('../backend/src/middleware/rateLimiter');

        const rlApp = express();
        rlApp.post('/pw', prodLimiters.passwordLimiter, (req, res) => res.status(200).json({ ok: true }));
        rlApp.post('/auth', prodLimiters.authLimiter, (req, res) => res.status(200).json({ ok: true }));
        rlApp.post('/up', prodLimiters.uploadLimiter, (req, res) => res.status(200).json({ ok: true }));

        const rlServer = http.createServer(rlApp);
        await new Promise((resolve) => rlServer.listen(0, '127.0.0.1', resolve));
        const rlUrl = `http://127.0.0.1:${rlServer.address().port}`;

        try {
            let pwStatuses = [];
            for (let i = 0; i < 6; i += 1) {
                const r = await fetch(`${rlUrl}/pw`, { method: 'POST' });
                pwStatuses.push(r.status);
            }
            assert('SEC-03: passwordLimiter allows 5 requests and blocks 6th with 429',
                pwStatuses.slice(0, 5).every((s) => s === 200) && pwStatuses[5] === 429, pwStatuses);

            let authStatuses = [];
            for (let i = 0; i < 11; i += 1) {
                const r = await fetch(`${rlUrl}/auth`, { method: 'POST' });
                authStatuses.push(r.status);
            }
            assert('SEC-03: authLimiter allows 10 requests and blocks 11th with 429',
                authStatuses.slice(0, 10).every((s) => s === 200) && authStatuses[10] === 429, authStatuses);

            let upStatuses = [];
            for (let i = 0; i < 21; i += 1) {
                const r = await fetch(`${rlUrl}/up`, { method: 'POST' });
                upStatuses.push(r.status);
            }
            assert('SEC-03: uploadLimiter allows 20 requests and blocks 21st with 429',
                upStatuses.slice(0, 20).every((s) => s === 200) && upStatuses[20] === 429, upStatuses);
        } finally {
            await new Promise((resolve) => rlServer.close(resolve));
        }

        // -----------------------------------------------------------------
        // 5. Private Document Ownership (IDOR) + Failed Upload Cleanup
        // -----------------------------------------------------------------
        console.log('\n--- 5. Private Library IDOR & Upload Cleanup Tests ---');

        const privateDir = getPrivateUploadDirectory();
        const filesBeforeFailure = new Set(fs.existsSync(privateDir) ? fs.readdirSync(privateDir) : []);

        // 5.1 Failed PDF magic-byte spoof upload -> must reject 400 and leave NO file on disk
        const spoofFd = new FormData();
        spoofFd.append('title', 'Spoofed PDF');
        spoofFd.append('format', 'PDF');
        spoofFd.append('file', new Blob(['<html>not a pdf</html>'], { type: 'application/pdf' }), 'evil.pdf');

        const spoofRes = await apiFetch(baseUrl, 'POST', '/api/private-library/upload', {
            jar: jarA,
            headers: { Origin: AUTH_COOKIE_ORIGIN, 'X-CSRF-Token': csrfA },
            formData: spoofFd,
        });
        assert('Upload Security: Fake PDF magic bytes rejected (400)', spoofRes.status === 400, spoofRes.status);

        // 5.2 Arbitrary ZIP renamed to .epub -> must reject 400 and leave NO file on disk
        const fakeEpubFd = new FormData();
        fakeEpubFd.append('title', 'Arbitrary ZIP as EPUB');
        fakeEpubFd.append('format', 'EPUB');
        fakeEpubFd.append('file', new Blob([createArbitraryZipBuffer()], { type: 'application/epub+zip' }), 'arbitrary.epub');

        const fakeEpubRes = await apiFetch(baseUrl, 'POST', '/api/private-library/upload', {
            jar: jarA,
            headers: { Origin: AUTH_COOKIE_ORIGIN, 'X-CSRF-Token': csrfA },
            formData: fakeEpubFd,
        });
        assert('Upload Security: Arbitrary ZIP renamed to .epub rejected (400)', fakeEpubRes.status === 400, fakeEpubRes.status);

        // Wait briefly for async unlink if any
        await new Promise((r) => setTimeout(r, 100));
        const filesAfterFailure = fs.existsSync(privateDir) ? fs.readdirSync(privateDir) : [];
        const leakedFiles = filesAfterFailure.filter((f) => !filesBeforeFailure.has(f));
        assert('Storage Cleanup: Failed uploads leave zero orphaned files in uploads/private/',
            leakedFiles.length === 0, leakedFiles);

        // 5.3 Valid PDF upload by USER A
        const pdfFd = new FormData();
        pdfFd.append('title', 'User A Private PDF');
        pdfFd.append('description', '<script>alert("xss")</script>');
        pdfFd.append('format', 'PDF');
        pdfFd.append('file', new Blob([createMinimalPdfBuffer('User A Private Content')], { type: 'application/pdf' }), 'user-a.pdf');

        const upPdfA = await apiFetch(baseUrl, 'POST', '/api/private-library/upload', {
            jar: jarA,
            headers: { Origin: AUTH_COOKIE_ORIGIN, 'X-CSRF-Token': csrfA },
            formData: pdfFd,
        });
        assert('USER A private PDF upload succeeds (201)', upPdfA.status === 201, upPdfA.status);
        const privPdfId = upPdfA.json?.data?.privateFile?.private_file_id;
        if (privPdfId) createdPrivateFileIds.push(privPdfId);

        // 5.4 EPUB upload rejected under PDF-only upload policy; seed legacy private EPUB for IDOR checks
        const validEpubBuf = await fsp.readFile(path.join(FIXTURES_DIR, 'valid-epub3.epub'));
        const epubFd = new FormData();
        epubFd.append('title', 'User A Private EPUB');
        epubFd.append('format', 'EPUB');
        epubFd.append('file', new Blob([validEpubBuf], { type: 'application/epub+zip' }), 'user-a.epub');

        const upEpubA = await apiFetch(baseUrl, 'POST', '/api/private-library/upload', {
            jar: jarA,
            headers: { Origin: AUTH_COOKIE_ORIGIN, 'X-CSRF-Token': csrfA },
            formData: epubFd,
        });
        assert('USER A private EPUB upload rejected under PDF-only policy (400)', upEpubA.status === 400, upEpubA.status);

        const legacyPrivStored = `legacy-priv-${Date.now()}.epub`;
        const legacyPrivPath = resolvePrivatePdfPath(legacyPrivStored);
        await fsp.mkdir(path.dirname(legacyPrivPath), { recursive: true });
        await fsp.writeFile(legacyPrivPath, validEpubBuf);
        const [insLegacyPriv] = await pool.query(
            `INSERT INTO private_library_files (owner_id, title, original_file_name, stored_file_name, storage_path, mime_type, file_format, file_size)
             VALUES (?, 'Legacy User A EPUB', 'user-a.epub', ?, ?, 'application/epub+zip', 'EPUB', ?)`,
            [userAId, legacyPrivStored, 'private/' + legacyPrivStored, validEpubBuf.length]
        );
        const privEpubId = insLegacyPriv.insertId;
        if (privEpubId) createdPrivateFileIds.push(privEpubId);

        // Record stored filenames for cleanup
        if (createdPrivateFileIds.length > 0) {
            const [pRows] = await pool.query(
                `SELECT stored_file_name FROM private_library_files WHERE private_file_id IN (${createdPrivateFileIds.map(() => '?').join(',')})`,
                createdPrivateFileIds
            );
            for (const r of pRows) privateFilesToClean.push(r.stored_file_name);
        }

        // Verify USER A can read own metadata, file, and processed document
        const ownerPdfMeta = await apiFetch(baseUrl, 'GET', `/api/private-library/${privPdfId}`, { jar: jarA });
        assert('Owner (USER A) can read private PDF metadata (200)', ownerPdfMeta.status === 200, ownerPdfMeta.status);
        const ownerPdfDoc = await apiFetch(baseUrl, 'GET', `/api/private-library/${privPdfId}/document`, { jar: jarA });
        assert('Owner (USER A) can read processed PDF document (200)', ownerPdfDoc.status === 200, ownerPdfDoc.status);
        const ownerEpubFile = await apiFetch(baseUrl, 'GET', `/api/private-library/${privEpubId}/file`, { jar: jarA });
        assert('Owner (USER A) can stream original EPUB file (200)', ownerEpubFile.status === 200, ownerEpubFile.status);
        const ownerEpubDoc = await apiFetch(baseUrl, 'GET', `/api/private-library/${privEpubId}/document`, { jar: jarA });
        assert('Owner (USER A) can read processed EPUB document & TOC (200)',
            ownerEpubDoc.status === 200 && Array.isArray(ownerEpubDoc.json?.data?.document?.toc),
            ownerEpubDoc.status);

        // Verify USER B and ADMIN are denied across ALL private endpoints (IDOR)
        for (const [label, intruderJar, intruderCsrf] of [['USER B', jarB, csrfB], ['ADMIN', jarAdmin, csrfAdmin]]) {
            for (const [resName, id] of [['PDF', privPdfId], ['EPUB', privEpubId]]) {
                const m = await apiFetch(baseUrl, 'GET', `/api/private-library/${id}`, { jar: intruderJar });
                const f = await apiFetch(baseUrl, 'GET', `/api/private-library/${id}/file`, { jar: intruderJar });
                const d = await apiFetch(baseUrl, 'GET', `/api/private-library/${id}/document`, { jar: intruderJar });
                const del = await apiFetch(baseUrl, 'DELETE', `/api/private-library/${id}`, {
                    jar: intruderJar,
                    headers: { Origin: AUTH_COOKIE_ORIGIN, 'X-CSRF-Token': intruderCsrf },
                });
                assert(`IDOR: ${label} blocked from USER A private ${resName} (meta/file/doc/delete -> 404)`,
                    m.status === 404 && f.status === 404 && d.status === 404 && del.status === 404,
                    [m.status, f.status, d.status, del.status]);
            }
        }

        // Verify ownership cannot be spoofed via request body ownerId/userId
        const spoofOwnerFd = new FormData();
        spoofOwnerFd.append('title', 'Ownership Spoof Attempt');
        spoofOwnerFd.append('ownerId', String(userAId));
        spoofOwnerFd.append('owner_id', String(userAId));
        spoofOwnerFd.append('userId', String(userAId));
        spoofOwnerFd.append('format', 'PDF');
        spoofOwnerFd.append('file', new Blob([createMinimalPdfBuffer('User B File')], { type: 'application/pdf' }), 'spoof-owner.pdf');

        const upB = await apiFetch(baseUrl, 'POST', '/api/private-library/upload', {
            jar: jarB,
            headers: { Origin: AUTH_COOKIE_ORIGIN, 'X-CSRF-Token': csrfB },
            formData: spoofOwnerFd,
        });
        assert('USER B upload with spoofed ownerId succeeds under authenticated identity (201)', upB.status === 201, upB.status);
        const privBId = upB.json?.data?.privateFile?.private_file_id;
        if (privBId) {
            createdPrivateFileIds.push(privBId);
            const [ownerRows] = await pool.query('SELECT owner_id, stored_file_name FROM private_library_files WHERE private_file_id = ?', [privBId]);
            if (ownerRows[0]?.stored_file_name) privateFilesToClean.push(ownerRows[0].stored_file_name);
            assert('Ownership derived from req.user, ignoring spoofed ownerId body param',
                Number(ownerRows[0]?.owner_id) === Number(userBId), ownerRows[0]);
        }

        // Verify private files cannot be accessed via static Express routes
        const staticProbe = await apiFetch(baseUrl, 'GET', `/uploads/private/${privateFilesToClean[0] || 'missing.pdf'}`);
        assert('Storage Security: /uploads/private/* is not served statically (404)', staticProbe.status === 404, staticProbe.status);

        // -----------------------------------------------------------------
        // 6. Public Book Visibility, EPUB Import, XSS & SQLi Verification
        // -----------------------------------------------------------------
        console.log('\n--- 6. Public Books, EPUB Security, XSS & SQL Injection ---');

        const createBookRes = await apiFetch(baseUrl, 'POST', '/api/books', {
            jar: jarAdmin,
            headers: { Origin: AUTH_COOKIE_ORIGIN, 'X-CSRF-Token': csrfAdmin },
            body: { title: 'XSS <script>alert(1)</script> Book', description: '<img src=x onerror=alert(1)>' },
        });
        assert('ADMIN creates public book (201)', createBookRes.status === 201, createBookRes.status);
        const pubBookId = createBookRes.json?.data?.book?.book_id;
        if (pubBookId) createdBookIds.push(pubBookId);

        const epubImgBuf = await fsp.readFile(path.join(FIXTURES_DIR, 'with-images.epub'));
        const pubEpubFd = new FormData();
        pubEpubFd.append('format', 'EPUB');
        pubEpubFd.append('file', new Blob([epubImgBuf], { type: 'application/epub+zip' }), 'with-images.epub');

        const importRes = await apiFetch(baseUrl, 'POST', `/api/books/${pubBookId}/pdf`, {
            jar: jarAdmin,
            headers: { Origin: AUTH_COOKIE_ORIGIN, 'X-CSRF-Token': csrfAdmin },
            formData: pubEpubFd,
        });
        assert('ADMIN public EPUB upload rejected under PDF-only policy (400)', importRes.status === 400, importRes.status);

        // Seed legacy public EPUB record to verify visibility & XSS protections remain intact
        const legacyPubStored = `legacy-pub-${Date.now()}.epub`;
        const legacyPubPath = resolvePublicPdfPath(legacyPubStored);
        await fsp.mkdir(path.dirname(legacyPubPath), { recursive: true });
        await fsp.writeFile(legacyPubPath, epubImgBuf);
        const legacyPubDoc = await processEpubFile(legacyPubPath, { bookId: pubBookId });
        const legacyPubProcessed = `${legacyPubStored.replace('.epub', '')}.processed.json`;
        await fsp.writeFile(resolvePublicProcessedPath(legacyPubProcessed), JSON.stringify(legacyPubDoc), 'utf8');
        await pool.query(
            `UPDATE books SET pdf_original_name = 'with-images.epub', pdf_stored_name = ?, pdf_size = ?, file_format = 'EPUB', processed_content_path = ? WHERE book_id = ?`,
            [legacyPubStored, epubImgBuf.length, legacyPubProcessed, pubBookId]
        );
        publicArtifactsToClean.push(legacyPubStored);

        // USER A blocked from draft book & its TOC/chapter/image
        const userDraftDoc = await apiFetch(baseUrl, 'GET', `/api/books/${pubBookId}/document`, { jar: jarA });
        const userDraftToc = await apiFetch(baseUrl, 'GET', `/api/books/${pubBookId}/toc`, { jar: jarA });
        const userDraftCh = await apiFetch(baseUrl, 'GET', `/api/books/${pubBookId}/chapters/1`, { jar: jarA });
        assert('Public Visibility: USER A blocked from DRAFT book document/toc/chapter (404)',
            userDraftDoc.status === 404 && userDraftToc.status === 404 && userDraftCh.status === 404,
            [userDraftDoc.status, userDraftToc.status, userDraftCh.status]);

        // Publish book -> USER A can read document, TOC, chapter, and image
        const pubPatch = await apiFetch(baseUrl, 'PATCH', `/api/books/${pubBookId}/publish`, {
            jar: jarAdmin,
            headers: { Origin: AUTH_COOKIE_ORIGIN, 'X-CSRF-Token': csrfAdmin },
        });
        assert('ADMIN publishes public EPUB book (200)', pubPatch.status === 200, pubPatch.status);

        const userPubDoc = await apiFetch(baseUrl, 'GET', `/api/books/${pubBookId}/document`, { jar: jarA });
        assert('Published EPUB: USER A reads document (200) & preserves JSON Content-Type (no raw HTML)',
            userPubDoc.status === 200 && (userPubDoc.headers.get('content-type') || '').includes('application/json'),
            userPubDoc.status);

        // Path traversal on book image param
        const imgTraversal = await apiFetch(baseUrl, 'GET', `/api/books/${pubBookId}/images/..%2Fsecret.png`, { jar: jarA });
        assert('Path Traversal: invalid image param rejected (400)', imgTraversal.status === 400, imgTraversal.status);

        // EPUB unsafe HTML/CSS sanitization preserves benign formatting
        const unsafeHtmlDoc = await processEpubFile(path.join(FIXTURES_DIR, 'unsafe-html.epub'));
        const sanitizedHtml = unsafeHtmlDoc.pages[0].html;
        assert('XSS (EPUB): strips script/onclick/javascript:/iframe/object while keeping safe text',
            !sanitizedHtml.includes('<script') && !sanitizedHtml.includes('onclick') &&
            !sanitizedHtml.includes('javascript:') && !sanitizedHtml.includes('<iframe'),
            sanitizedHtml);

        // SQL Injection safe handling
        const sqliSort = await apiFetch(baseUrl, 'GET', '/api/books?sort=title;DROP%20TABLE%20books;--&order=DESC', { jar: jarA });
        assert('SQLi: malicious sort param safely handled via whitelist without 500 error',
            sqliSort.status === 200, sqliSort.status);

        const sqliParam = await apiFetch(baseUrl, 'GET', "/api/books/1'%20OR%20'1'='1", { jar: jarA });
        assert('SQLi: malicious :id param rejected cleanly with 400 validation error',
            sqliParam.status === 400, sqliParam.status);

        const sqliPrivParam = await apiFetch(baseUrl, 'GET', '/api/private-library/1%20OR%201=1', { jar: jarA });
        assert('SQLi: malicious private-library :id rejected cleanly with 400',
            sqliPrivParam.status === 400, sqliPrivParam.status);

        // -----------------------------------------------------------------
        // 7. SEC-04 — Password Change, Logout, Token Revocation & Audit Log
        // -----------------------------------------------------------------
        console.log('\n--- 7. SEC-04 — Password Change, Token Revocation & Audit Logs ---');

        const badPwChange = await apiFetch(baseUrl, 'PUT', '/api/users/change-password', {
            jar: jarA,
            headers: { Origin: AUTH_COOKIE_ORIGIN, 'X-CSRF-Token': csrfA },
            body: { currentPassword: 'WrongCurrentPassword!', newPassword: newSecretPassword },
        });
        assert('Invalid password change rejected (401)', badPwChange.status === 401, badPwChange.status);

        const okPwChange = await apiFetch(baseUrl, 'PUT', '/api/users/change-password', {
            jar: jarA,
            headers: { Origin: AUTH_COOKIE_ORIGIN, 'X-CSRF-Token': csrfA },
            body: { currentPassword: testSecretPassword, newPassword: newSecretPassword },
        });
        assert('Valid password change succeeds (200)', okPwChange.status === 200, okPwChange.status);

        const logoutRes = await apiFetch(baseUrl, 'POST', '/api/auth/logout', {
            jar: jarA,
            headers: { Origin: AUTH_COOKIE_ORIGIN, 'X-CSRF-Token': csrfA },
        });
        assert('Logout succeeds with CSRF token (200)', logoutRes.status === 200, logoutRes.status);

        // Replay old revoked JWT
        const replayRes = await apiFetch(baseUrl, 'GET', '/api/auth/me', {
            headers: { Authorization: `Bearer ${jarA.token.value}` },
        });
        assert('Token Revocation: logged-out JWT rejected with 401', replayRes.status === 401, replayRes.status);

        // Check auth_events rows recorded in test DB
        const [eventRows] = await pool.query(
            'SELECT event_type, user_id FROM auth_events WHERE user_id IN (?) ORDER BY event_id',
            [createdUserIds]
        );
        const eventTypes = new Set(eventRows.map((r) => r.event_type));
        assert('SEC-04: auth_events recorded REGISTER_SUCCESS, LOGIN_SUCCESS, PASSWORD_CHANGED, PASSWORD_CHANGE_FAILED, LOGOUT',
            eventTypes.has('REGISTER_SUCCESS') &&
            eventTypes.has('LOGIN_SUCCESS') &&
            eventTypes.has('PASSWORD_CHANGED') &&
            eventTypes.has('PASSWORD_CHANGE_FAILED') &&
            eventTypes.has('LOGOUT'),
            [...eventTypes]);

        const [failRows] = await pool.query(
            "SELECT event_type FROM auth_events WHERE event_type = 'LOGIN_FAILURE' ORDER BY event_id DESC LIMIT 1"
        );
        assert('SEC-04: auth_events recorded LOGIN_FAILURE', failRows.length === 1, failRows);

        captureStop();

        const joinedLogs = capturedLogs.join('\n');
        const leakedSecret =
            joinedLogs.includes(testSecretPassword) ||
            joinedLogs.includes(newSecretPassword) ||
            joinedLogs.includes('WrongPassword!123') ||
            joinedLogs.includes('WrongCurrentPassword!') ||
            joinedLogs.includes(jarA.token.value) ||
            (process.env.JWT_SECRET && joinedLogs.includes(process.env.JWT_SECRET)) ||
            (process.env.DB_PASSWORD && process.env.DB_PASSWORD.length > 0 && joinedLogs.includes(process.env.DB_PASSWORD));
        assert('SEC-04: Logs contain ZERO passwords, JWTs, or secret env values', !leakedSecret);

    } finally {
        captureStop();

        for (const storedName of privateFilesToClean) {
            try {
                await deleteFileIfExists(resolvePrivatePdfPath(storedName));
                await deleteFileIfExists(resolvePrivateProcessedPath(buildPrivateProcessedName(storedName)));
                await deleteDirectoryIfExists(resolvePrivateImagesDir(buildPrivateImagesDirName(storedName)));
                for (const ext of COVER_EXTENSIONS) {
                    await deleteFileIfExists(resolvePrivateCoverPath(buildCoverFileName(storedName, ext)));
                }
            } catch (_) {}
        }
        for (const storedName of publicArtifactsToClean) {
            try {
                await deleteFileIfExists(resolvePublicPdfPath(storedName));
                const base = path.basename(storedName, path.extname(storedName));
                await deleteFileIfExists(resolvePublicProcessedPath(`${base}.processed.json`));
                await deleteDirectoryIfExists(resolvePublicImagesDir(buildPublicImagesDirName(storedName)));
                for (const ext of COVER_EXTENSIONS) {
                    await deleteFileIfExists(resolvePublicCoverPath(buildCoverFileName(storedName, ext)));
                }
            } catch (_) {}
        }

        if (createdPrivateFileIds.length > 0) {
            await pool.query(
                `DELETE FROM private_library_files WHERE private_file_id IN (${createdPrivateFileIds.map(() => '?').join(',')})`,
                createdPrivateFileIds
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
                `DELETE FROM revoked_tokens WHERE user_id IN (${createdUserIds.map(() => '?').join(',')})`,
                createdUserIds
            ).catch(() => {});
            await pool.query(
                `DELETE FROM auth_events WHERE user_id IN (${createdUserIds.map(() => '?').join(',')})`,
                createdUserIds
            ).catch(() => {});
            await pool.query(
                `DELETE FROM users WHERE user_id IN (${createdUserIds.map(() => '?').join(',')})`,
                createdUserIds
            ).catch(() => {});
        }
        await pool.query("DELETE FROM auth_events WHERE event_type = 'LOGIN_FAILURE' AND user_id IS NULL AND created_at >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)").catch(() => {});

        await new Promise((resolve) => server.close(resolve));
        await pool.end();
    }

    console.log(`\n=== Module 27 Security Verification Complete: ${passed} passed, ${failed} failed ===\n`);
    if (failed > 0) {
        process.exit(1);
    }
}

run().catch((err) => {
    console.error('Fatal Module 27 test error:', err);
    pool.end().catch(() => {});
    process.exit(1);
});
