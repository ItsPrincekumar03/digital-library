if (process.env.TEST_DB_NAME !== 'digital_library_test') {
    console.error(
        'Test blocked: TEST_DB_NAME must equal digital_library_test.'
    );
    process.exit(1);
}

process.env.DB_NAME = process.env.TEST_DB_NAME;
const http = require('http');
const app = require('../backend/src/app');
const { pool } = require('../backend/src/config/database');

let server;
let baseUrl;

function request(method, path, { headers = {}, body = null } = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, baseUrl);
        const reqHeaders = { ...headers };
        let reqBody = null;

        if (body) {
            reqBody = JSON.stringify(body);
            reqHeaders['Content-Type'] = 'application/json';
            reqHeaders['Content-Length'] = Buffer.byteLength(reqBody);
        }

        const req = http.request(
            url,
            { method, headers: reqHeaders },
            (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    let json = null;
                    try {
                        json = JSON.parse(data);
                    } catch (e) {
                        json = data;
                    }
                    resolve({
                        status: res.statusCode,
                        headers: res.headers,
                        data: json,
                    });
                });
            }
        );

        req.on('error', reject);
        if (reqBody) req.write(reqBody);
        req.end();
    });
}

async function run() {
    console.log('--- Starting API Integration Tests for Authors and Categories ---');

    let author1Id = null;
    let author2Id = null;
    let cat1Id = null;
    let cat2Id = null;
    let cleanupFailed = false;

    // Start ephemeral server
    await new Promise((resolve) => {
        server = app.listen(0, () => {
            const port = server.address().port;
            baseUrl = `http://localhost:${port}`;
            console.log(`Test server running on ${baseUrl}`);
            resolve();
        });
    });

    try {
        // 1. Health checks
        const healthRes = await request('GET', '/api/health');
        console.log('GET /api/health:', healthRes.status, healthRes.data);
        if (healthRes.status !== 200 || !healthRes.data.success) {
            throw new Error('/api/health failed');
        }

        const dbHealthRes = await request('GET', '/api/health/db');
        console.log('GET /api/health/db:', dbHealthRes.status, dbHealthRes.data);
        if (dbHealthRes.status !== 200 || !dbHealthRes.data.success) {
            throw new Error('/api/health/db failed');
        }

        // 2. Login as Demo Admin
        const loginRes = await request('POST', '/api/auth/login', {
            body: { email: 'demoadmin@example.com', password: 'Demoadmin@123' },
        });
        console.log('POST /api/auth/login (admin):', loginRes.status, loginRes.data && loginRes.data.success);
        if (loginRes.status !== 200) {
            throw new Error(`Admin login failed: ${JSON.stringify(loginRes.data)}`);
        }

        const cookieHeader = loginRes.headers['set-cookie'];
        const authCookie = Array.isArray(cookieHeader) ? cookieHeader[0].split(';')[0] : '';
        const authHeaders = { Cookie: authCookie };

        // 3. Test GET /api/authors (empty initially or existing)
        const getAuthorsInitial = await request('GET', '/api/authors', { headers: authHeaders });
        console.log('GET /api/authors (initial):', getAuthorsInitial.status, getAuthorsInitial.data);
        if (getAuthorsInitial.status !== 200) {
            throw new Error(`GET /api/authors failed with status ${getAuthorsInitial.status}: ${JSON.stringify(getAuthorsInitial.data)}`);
        }

        // 4. Test GET /api/categories (empty initially or existing)
        const getCategoriesInitial = await request('GET', '/api/categories', { headers: authHeaders });
        console.log('GET /api/categories (initial):', getCategoriesInitial.status, getCategoriesInitial.data);
        if (getCategoriesInitial.status !== 200) {
            throw new Error(`GET /api/categories failed with status ${getCategoriesInitial.status}: ${JSON.stringify(getCategoriesInitial.data)}`);
        }

        // 5. Create authors
        const stamp = Date.now();
        const createAuthor1 = await request('POST', '/api/authors', {
            headers: authHeaders,
            body: { name: `George Orwell ${stamp}`, bio: 'English novelist' },
        });
        const createAuthor2 = await request('POST', '/api/authors', {
            headers: authHeaders,
            body: { name: `Aldous Huxley ${stamp}`, bio: 'English writer' },
        });
        console.log('POST /api/authors (1 & 2 created):', createAuthor1.status, createAuthor2.status);
        author1Id = createAuthor1.data.data.author.author_id;
        author2Id = createAuthor2.data.data.author.author_id;

        // 6. Create categories
        const createCat1 = await request('POST', '/api/categories', {
            headers: authHeaders,
            body: { name: `Dystopian ${stamp}`, description: 'Dystopian fiction' },
        });
        const createCat2 = await request('POST', '/api/categories', {
            headers: authHeaders,
            body: { name: `Classic Literature ${stamp}`, description: 'Classic books' },
        });
        console.log('POST /api/categories (1 & 2 created):', createCat1.status, createCat2.status);
        cat1Id = createCat1.data.data.category.category_id;
        cat2Id = createCat2.data.data.category.category_id;

        // 7. Verify GET /api/authors returns sorted by name
        const getAuthorsAfter = await request('GET', '/api/authors', { headers: authHeaders });
        const authorsList = getAuthorsAfter.data.data.authors;
        console.log('GET /api/authors (after create):', authorsList.map(a => a.name));
        const testAuthors = authorsList.filter(a => a.author_id === author1Id || a.author_id === author2Id);
        if (testAuthors.length !== 2 || testAuthors[0].author_id !== author2Id) {
            throw new Error(`Authors not sorted properly: expected Aldous Huxley before George Orwell`);
        }

        // 8. Verify GET /api/categories returns sorted by name
        const getCategoriesAfter = await request('GET', '/api/categories', { headers: authHeaders });
        const catsList = getCategoriesAfter.data.data.categories;
        console.log('GET /api/categories (after create):', catsList.map(c => c.name));
        const testCats = catsList.filter(c => c.category_id === cat1Id || c.category_id === cat2Id);
        if (testCats.length !== 2 || testCats[0].category_id !== cat2Id) {
            throw new Error(`Categories not sorted properly: expected Classic Literature before Dystopian`);
        }

        // 9. Test Archiving: PATCH /api/authors/:id/archive
        const archiveAuthorRes = await request('PATCH', `/api/authors/${author1Id}/archive`, { headers: authHeaders });
        console.log('PATCH /api/authors/:id/archive:', archiveAuthorRes.status, archiveAuthorRes.data);
        if (archiveAuthorRes.status !== 200 || !archiveAuthorRes.data.success) {
            throw new Error('Failed to archive author');
        }

        // 10. Test Archiving: PATCH /api/categories/:id/archive
        const archiveCatRes = await request('PATCH', `/api/categories/${cat1Id}/archive`, { headers: authHeaders });
        console.log('PATCH /api/categories/:id/archive:', archiveCatRes.status, archiveCatRes.data);
        if (archiveCatRes.status !== 200 || !archiveCatRes.data.success) {
            throw new Error('Failed to archive category');
        }

        // 11. Verify archived records are excluded from GET /api/authors
        const getAuthorsAfterArchive = await request('GET', '/api/authors', { headers: authHeaders });
        const remainingAuthors = getAuthorsAfterArchive.data.data.authors;
        console.log('GET /api/authors after archive (should exclude George Orwell):', remainingAuthors.map(a => a.name));
        if (remainingAuthors.some(a => a.author_id === author1Id)) {
            throw new Error('Archived author was not excluded from GET /api/authors');
        }
        if (!remainingAuthors.some(a => a.author_id === author2Id)) {
            throw new Error('Active author missing from GET /api/authors');
        }

        // 12. Verify archived records are excluded from GET /api/categories
        const getCategoriesAfterArchive = await request('GET', '/api/categories', { headers: authHeaders });
        const remainingCats = getCategoriesAfterArchive.data.data.categories;
        console.log('GET /api/categories after archive (should exclude Dystopian):', remainingCats.map(c => c.name));
        if (remainingCats.some(c => c.category_id === cat1Id)) {
            throw new Error('Archived category was not excluded from GET /api/categories');
        }
        if (!remainingCats.some(c => c.category_id === cat2Id)) {
            throw new Error('Active category missing from GET /api/categories');
        }

    } finally {
        const attempt = async (label, action) => {
            try {
                await action();
            } catch (err) {
                cleanupFailed = true;
                console.error(`[CLEANUP] ${label} failed:`, err.message);
            }
        };

        await attempt('test authors', async () => {
            const ids = [author1Id, author2Id].filter(Number.isInteger);

            if (ids.length > 0) {
                await pool.query(
                    `DELETE FROM authors
                     WHERE author_id IN (${ids.map(() => '?').join(',')})`,
                    ids
                );
            }
        });

        await attempt('test categories', async () => {
            const ids = [cat1Id, cat2Id].filter(Number.isInteger);

            if (ids.length > 0) {
                await pool.query(
                    `DELETE FROM categories
                     WHERE category_id IN (${ids.map(() => '?').join(',')})`,
                    ids
                );
            }
        });

        await attempt('HTTP server close', async () => {
            if (server?.listening) {
                await new Promise((resolve, reject) => {
                    server.close((err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }
        });

        await attempt('database pool close', async () => {
            await pool.end();
        });

        if (cleanupFailed) {
            process.exitCode = 1;
        }
    }
}

run().catch((err) => {
    console.error('API Test Error:', err);
    process.exitCode = 1;
});
