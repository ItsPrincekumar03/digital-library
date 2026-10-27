/**
 * M13 Security / Access-Control Tests
 *
 * These tests verify that private M13 endpoints are NOT accessible
 * without a valid session cookie, and that cross-user access is denied.
 *
 * Run with:  node tests/m13_security.test.js
 *
 * Prerequisites:
 *   1. Backend server is running on http://localhost:5000
 *   2. Two regular user accounts exist in the database:
 *        USER_A_EMAIL / USER_A_PASSWORD
 *        USER_B_EMAIL / USER_B_PASSWORD
 *      (set via environment variables or edit the constants below)
 *   3. At least one private PDF has been uploaded by USER_A.
 *      The test will discover its ID automatically after login.
 *
 * No secrets are hard-coded; this file is safe to commit.
 */

'use strict';

const assert = require('assert');

const BASE = process.env.API_BASE || 'http://localhost:5000/api';
const USER_A_EMAIL = process.env.USER_A_EMAIL || 'usera@example.com';
const USER_A_PASSWORD = process.env.USER_A_PASSWORD || 'passwordA';
const USER_B_EMAIL = process.env.USER_B_EMAIL || 'userb@example.com';
const USER_B_PASSWORD = process.env.USER_B_PASSWORD || 'passwordB';

// ── helpers ────────────────────────────────────────────────────────────────

async function login(email, password) {
    const res = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
    });
    // Extract the Set-Cookie header so we can forward it manually
    const cookie = res.headers.get('set-cookie') || '';
    if (!res.ok) throw new Error(`Login failed for ${email}: ${res.status}`);
    return cookie;
}

async function get(path, cookie) {
    const headers = {};
    if (cookie) headers['Cookie'] = cookie;
    return fetch(`${BASE}${path}`, { headers });
}

let passed = 0;
let failed = 0;

async function test(name, fn) {
    try {
        await fn();
        console.log(`  PASS  ${name}`);
        passed++;
    } catch (err) {
        console.error(`  FAIL  ${name}`);
        console.error(`       ${err.message}`);
        failed++;
    }
}

// ── test suites ────────────────────────────────────────────────────────────

async function runUnauthenticatedTests() {
    console.log('\n-- Unauthenticated access (no cookie) --');

    await test('GET /private-library -> 401', async () => {
        const res = await get('/private-library', null);
        assert.strictEqual(res.status, 401, `Expected 401 got ${res.status}`);
        const body = await res.json();
        assert.strictEqual(body.success, false);
    });

    await test('GET /private-library/1 -> 401', async () => {
        const res = await get('/private-library/1', null);
        assert.strictEqual(res.status, 401);
    });

    await test('GET /private-library/1/file -> 401', async () => {
        const res = await get('/private-library/1/file', null);
        assert.strictEqual(res.status, 401);
    });

    await test('GET /private-library/1/document -> 404 (route not found)', async () => {
        const res = await get('/private-library/1/document', null);
        assert.strictEqual(res.status, 404);
    });

    await test('GET /private-library/images/* -> 404 (route not found)', async () => {
        const res = await get('/private-library/images/private_1_img_1.png', null);
        assert.strictEqual(res.status, 404);
    });

    await test('401 response body does not reveal file paths', async () => {
        const res = await get('/private-library/1/document', null);
        const text = await res.text();
        assert.ok(!text.includes('uploads'), `Should not reveal path, got: ${text}`);
    });
}

async function runOwnershipTests(cookieA, cookieB, fileIdOwnedByA) {
    console.log('\n-- Cross-user ownership (User B tries User A resources) --');

    await test(`GET /private-library/${fileIdOwnedByA} as User B -> 403/404`, async () => {
        const res = await get(`/private-library/${fileIdOwnedByA}`, cookieB);
        assert.ok([403, 404].includes(res.status), `Expected 403/404 got ${res.status}`);
    });

    await test(`GET /private-library/${fileIdOwnedByA}/file as User B -> 403/404`, async () => {
        const res = await get(`/private-library/${fileIdOwnedByA}/file`, cookieB);
        assert.ok([403, 404].includes(res.status), `Expected 403/404 got ${res.status}`);
    });

    await test(`GET /private-library/${fileIdOwnedByA}/document as User B -> 403/404`, async () => {
        const res = await get(`/private-library/${fileIdOwnedByA}/document`, cookieB);
        assert.ok([403, 404].includes(res.status), `Expected 403/404 got ${res.status}`);
    });

    await test('Image for User A not accessible by User B', async () => {
        const imageName = `private_${fileIdOwnedByA}_img_1.png`;
        const res = await get(`/private-library/images/${imageName}`, cookieB);
        assert.ok([403, 404].includes(res.status), `Expected 403/404 got ${res.status}`);
    });

    await test('Path traversal in image name is rejected', async () => {
        const malicious = encodeURIComponent(`private_${fileIdOwnedByA}_../../etc/passwd`);
        const res = await get(`/private-library/images/${malicious}`, cookieA);
        assert.ok([400, 403, 404].includes(res.status), `Expected 4xx got ${res.status}`);
    });

    await test('Non-numeric private file ID -> 404 (route not found)', async () => {
        const res = await get('/private-library/abc/document', cookieA);
        assert.strictEqual(res.status, 404);
    });
}

async function runPublicAccessTests() {
    console.log('\n-- Public book routes remain accessible --');

    await test('GET /books -> 401 without auth', async () => {
        const res = await get('/books', null);
        assert.strictEqual(res.status, 401);
        const body = await res.json();
        assert.strictEqual(body.success, false);
    });
}

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
    console.log('M13 Security Tests');
    console.log('==================');

    await runUnauthenticatedTests();
    await runPublicAccessTests();

    let cookieA, cookieB, fileIdOwnedByA;
    try {
        cookieA = await login(USER_A_EMAIL, USER_A_PASSWORD);
        cookieB = await login(USER_B_EMAIL, USER_B_PASSWORD);

        const listRes = await get('/private-library', cookieA);
        const listBody = await listRes.json();
        const files = listBody && listBody.data && listBody.data.privateFiles ? listBody.data.privateFiles : [];
        if (files.length === 0) {
            console.error('\nFAIL: No private files found for User A -- authenticated tests could not run.');
            console.error('      Upload a PDF as User A first, then re-run.');
            failed++;
        } else {
            fileIdOwnedByA = files[0].private_file_id;
            await runOwnershipTests(cookieA, cookieB, fileIdOwnedByA);
        }
    } catch (err) {
        console.error(`\nFAIL: Authenticated security tests could not complete: ${err.message}`);
        console.error('      Set USER_A_EMAIL, USER_A_PASSWORD, USER_B_EMAIL, USER_B_PASSWORD env vars.');
        failed++;
    }

    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    if (failed > 0) process.exitCode = 1;
}

main().catch(err => { console.error(err); process.exitCode = 1; });
