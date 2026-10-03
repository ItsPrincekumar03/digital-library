// Module 8.5 - Content Model Alignment: manual API check script.
// No extra dependencies (uses Node 18+ built-in fetch).
//
// Usage (server must be running, DB must contain an ADMIN account):
//   ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD=yourpass node tests/content-model.check.js
// Optional: BASE_URL (default http://localhost:5000)
//
// It registers a throw-away USER account on every run.
//
// NOTE: the login/register rate limiter allows 10 attempts per 15 minutes per IP and
// this script uses about 6. Run it once per 15 minutes, or restart the server
// between runs (the limiter is in memory) - otherwise you will see 429 failures.

const BASE = process.env.BASE_URL || 'http://localhost:5000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

let passed = 0;
let failed = 0;

function makeClient() {
    let cookie = '';
    return async function call(method, path, body) {
        const res = await fetch(BASE + path, {
            method,
            headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
            body: body ? JSON.stringify(body) : undefined,
        });
        const set = res.headers.get('set-cookie');
        if (set && set.startsWith('token=')) cookie = set.split(';')[0];
        let json = null;
        try { json = await res.json(); } catch (e) { /* no body */ }
        return { status: res.status, json };
    };
}

function check(name, actual, expected) {
    const ok = actual === expected;
    ok ? passed++ : failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  (expected ${expected}, got ${actual})`);
}

(async () => {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        console.log('Set ADMIN_EMAIL and ADMIN_PASSWORD first.');
        process.exit(1);
    }
    const admin = makeClient();
    const user = makeClient();
    const stamp = Date.now();

    // ---- setup ----
    let r = await admin('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    check('22a. Admin login', r.status, 200);
    const userEmail = `m85user${stamp}@example.com`;
    r = await user('POST', '/api/auth/register', { fullName: 'M85 User', email: userEmail, password: 'Passw0rd!234' });
    check('22b. User register', r.status, 201);
    r = await user('POST', '/api/auth/login', { email: userEmail, password: 'Passw0rd!234' });
    check('22c. User login', r.status, 200);
    r = await user('GET', '/api/auth/me');
    check('22d. /me works', r.status, 200);

    // ---- admin creates fixtures ----
    r = await admin('POST', '/api/books', { title: `M85 Draft ${stamp}`, description: 'draft book' });
    check('6.  ADMIN can create book', r.status, 201);
    const draftId = r.json && r.json.data && r.json.data.book && r.json.data.book.book_id;
    r = await admin('POST', '/api/books', { title: `M85 Pub ${stamp}`, description: 'to publish' });
    const pubId = r.json && r.json.data && r.json.data.book && r.json.data.book.book_id;
    r = await admin('POST', '/api/books', { title: `M85 Arch ${stamp}`, description: 'to archive' });
    const archId = r.json && r.json.data && r.json.data.book && r.json.data.book.book_id;

    r = await admin('POST', '/api/authors', { name: `M85 Author ${stamp}` });
    const authorId = r.json && r.json.data && r.json.data.author && r.json.data.author.author_id;
    r = await admin('POST', '/api/categories', { name: `M85 Cat ${stamp}` });
    const categoryId = r.json && r.json.data && r.json.data.category && r.json.data.category.category_id;

    // chapters on the (future) published book: one published, one draft
    r = await admin('POST', `/api/books/${pubId}/chapters`, { chapterNumber: 1, title: 'Ch1', content: 'public text' });
    check('16a. ADMIN can create chapter', r.status, 201);
    const ch1 = r.json && r.json.data && r.json.data.chapter && r.json.data.chapter.chapter_id;
    r = await admin('POST', `/api/books/${pubId}/chapters`, { chapterNumber: 2, title: 'Ch2 draft', content: 'draft text' });
    const ch2 = r.json && r.json.data && r.json.data.chapter && r.json.data.chapter.chapter_id;
    r = await admin('PATCH', `/api/chapters/${ch1}/publish`);
    check('16b. ADMIN can publish chapter', r.status, 200);
    r = await admin('POST', `/api/books/${draftId}/chapters`, { chapterNumber: 1, title: 'Hidden', content: 'secret draft' });
    const hiddenCh = r.json && r.json.data && r.json.data.chapter && r.json.data.chapter.chapter_id;
    await admin('PATCH', `/api/chapters/${hiddenCh}/publish`);

    // ---- PUBLICATION ----
    r = await user('PATCH', `/api/books/${pubId}/publish`);
    check('9.  USER cannot publish book (publish route)', r.status, 403);
    r = await user('PUT', `/api/books/${pubId}`, { title: 'hacked', status: 'PUBLISHED' });
    check('9b. USER cannot publish via PUT status', r.status, 403);
    r = await admin('PATCH', `/api/books/${pubId}/publish`);
    check('10. ADMIN can publish book', r.status, 200);
    check('10b. status is PUBLISHED', r.json && r.json.data && r.json.data.book && r.json.data.book.status, 'PUBLISHED');

    // ---- BOOKS ----
    r = await user('GET', '/api/books');
    check('1.  USER GET /api/books ok', r.status, 200);
    const list = (r.json && r.json.data && r.json.data.books) || [];
    check('1b. USER list has only PUBLISHED', list.every((b) => b.status === 'PUBLISHED'), true);
    check('1c. USER list hides draft', list.some((b) => b.book_id === draftId), false);
    check('1d. USER list shows published', list.some((b) => b.book_id === pubId), true);
    r = await user('GET', '/api/books?page=1&limit=100&sort=title&order=asc');
    const plist = (r.json && r.json.data && r.json.data.books) || [];
    check('1e. USER paginated list only PUBLISHED', plist.length > 0 && plist.every((b) => b.status === 'PUBLISHED'), true);
    check('1f. USER paginated totalItems matches visible', r.json.data.meta.totalItems >= plist.length, true);
    r = await user('GET', `/api/books/${pubId}`);
    check('2.  USER GET published book', r.status, 200);
    r = await user('POST', '/api/books', { title: 'user book' });
    check('3.  USER cannot create book', r.status, 403);
    check('3b. error uses standard style', r.json && r.json.success, false);
    r = await user('PUT', `/api/books/${pubId}`, { title: 'changed by user' });
    check('4.  USER cannot update book', r.status, 403);
    r = await user('PATCH', `/api/books/${pubId}/archive`);
    check('5.  USER cannot archive book', r.status, 403);
    r = await admin('PUT', `/api/books/${draftId}`, { title: `M85 Draft edited ${stamp}`, description: 'edited' });
    check('7.  ADMIN can update book', r.status, 200);
    r = await admin('PUT', `/api/books/${draftId}`, { title: 'x', status: 'PENDING_REVIEW' });
    check('7b. Legacy status rejected on write', r.status, 400);
    r = await admin('GET', `/api/books/${draftId}`);
    check('7c. ADMIN can see draft', r.status, 200);
    r = await admin('GET', '/api/books');
    const alist = (r.json && r.json.data && r.json.data.books) || [];
    check('7d. ADMIN list includes draft', alist.some((b) => b.book_id === draftId), true);

    // ---- USER cannot see unpublished / archived ----
    r = await user('GET', `/api/books/${draftId}`);
    check('11. USER cannot access unpublished book', r.status, 404);
    r = await admin('PATCH', `/api/books/${archId}/publish`);
    r = await admin('PATCH', `/api/books/${archId}/archive`);
    check('8.  ADMIN can archive book', r.status, 200);
    r = await user('GET', `/api/books/${archId}`);
    check('12. USER cannot access archived book', r.status, 404);

    // ---- CHAPTERS ----
    r = await user('GET', `/api/books/${pubId}/chapters`);
    check('13. USER can read chapters of published book', r.status, 200);
    const chs = (r.json && r.json.data && r.json.data.chapters) || [];
    check('13b. USER sees only published chapters', chs.length === 1 && chs[0].chapter_id === ch1, true);
    r = await user('GET', `/api/chapters/${ch1}`);
    check('13c. USER can read published chapter', r.status, 200);
    r = await user('GET', `/api/chapters/${ch2}`);
    check('13d. USER cannot read draft chapter of published book', r.status, 404);
    r = await user('GET', `/api/books/${draftId}/chapters`);
    check('14. USER cannot list chapters of unpublished book', r.status, 404);
    r = await user('GET', `/api/chapters/${hiddenCh}`);
    check('14b. USER cannot read chapter of unpublished book', r.status, 404);
    r = await user('POST', `/api/books/${pubId}/chapters`, { chapterNumber: 9, title: 'u', content: 'u' });
    check('15a. USER cannot create chapter', r.status, 403);
    r = await user('PUT', `/api/chapters/${ch1}`, { chapterNumber: 1, title: 'u', content: 'u' });
    check('15b. USER cannot update chapter', r.status, 403);
    r = await user('PATCH', `/api/chapters/${ch2}/publish`);
    check('15c. USER cannot publish chapter', r.status, 403);
    r = await user('PATCH', `/api/chapters/${ch1}/archive`);
    check('15d. USER cannot archive chapter', r.status, 403);
    r = await user('PATCH', `/api/books/${pubId}/chapters/reorder`, { order: [{ chapterId: ch1, chapterNumber: 1 }] });
    check('15e. USER cannot reorder chapters', r.status, 403);
    r = await admin('PUT', `/api/chapters/${ch2}`, { chapterNumber: 2, title: 'Ch2 edited', content: 'x' });
    check('16c. ADMIN can update chapter', r.status, 200);
    r = await admin('PATCH', `/api/books/${pubId}/chapters/reorder`, { order: [{ chapterId: ch1, chapterNumber: 1 }, { chapterId: ch2, chapterNumber: 2 }] });
    check('16d. ADMIN can reorder chapters', r.status, 200);
    r = await admin('GET', `/api/chapters/${ch2}`);
    check('16e. ADMIN can read draft chapter', r.status, 200);

    // ---- RELATIONSHIPS ----
    r = await user('POST', `/api/books/${pubId}/authors`, { authorId });
    check('17. USER cannot add author', r.status, 403);
    r = await user('POST', `/api/books/${pubId}/categories`, { categoryId });
    check('19. USER cannot add category', r.status, 403);
    r = await admin('POST', `/api/books/${pubId}/authors`, { authorId });
    check('21a. ADMIN can add author', r.status, 201);
    r = await admin('POST', `/api/books/${pubId}/categories`, { categoryId });
    check('21b. ADMIN can add category', r.status, 201);
    r = await user('DELETE', `/api/books/${pubId}/authors/${authorId}`);
    check('18. USER cannot remove author', r.status, 403);
    r = await user('DELETE', `/api/books/${pubId}/categories/${categoryId}`);
    check('20. USER cannot remove category', r.status, 403);
    r = await user('GET', `/api/books/${pubId}/authors`);
    check('21c. USER can read authors of published book', r.status, 200);
    r = await user('GET', `/api/books/${draftId}/authors`);
    check('21d. USER cannot read authors of unpublished book', r.status, 404);
    r = await user('GET', `/api/books/${draftId}/categories`);
    check('21e. USER cannot read categories of unpublished book', r.status, 404);
    r = await admin('DELETE', `/api/books/${pubId}/authors/${authorId}`);
    check('21f. ADMIN can remove author', r.status, 200);
    r = await admin('DELETE', `/api/books/${pubId}/categories/${categoryId}`);
    check('21g. ADMIN can remove category', r.status, 200);

    // ---- REGRESSION ----
    r = await user('GET', '/api/users/profile');
    check('23a. Profile GET', r.status, 200);
    r = await user('PUT', '/api/users/profile', { fullName: 'M85 User Renamed', email: userEmail });
    check('23b. Profile PUT', r.status, 200);
    r = await user('GET', '/api/authors');
    check('24a. USER can list authors', r.status, 200);
    r = await user('POST', '/api/authors', { name: 'nope' });
    check('24b. USER cannot create author', r.status, 403);
    r = await user('POST', '/api/categories', { name: 'nope' });
    check('24c. USER cannot create category', r.status, 403);
    r = await admin('PUT', `/api/authors/${authorId}`, { name: `M85 Author renamed ${stamp}` });
    check('25a. ADMIN can update author', r.status, 200);
    r = await admin('PATCH', `/api/categories/${categoryId}/archive`);
    check('25b. ADMIN can archive category', r.status, 200);
    r = await user('GET', '/api/books/abc');
    check('26a. Invalid id -> 400', r.status, 400);
    r = await user('GET', '/api/books/99999999');
    check('26b. Missing book -> 404', r.status, 404);
    r = await user('GET', '/api/nothing-here');
    check('26c. Unknown route -> 404', r.status, 404);
    const anon = makeClient();
    r = await anon('GET', '/api/books');
    check('26d. No login -> 401', r.status, 401);
    r = await anon('POST', '/api/auth/register', { fullName: 'x', email: 'bad', password: '1' });
    check('26e. Bad register -> 400', r.status, 400);
    r = await user('POST', '/api/auth/register', { fullName: 'Selfpromote', email: `sp${stamp}@example.com`, password: 'Passw0rd!234', role: 'ADMIN', role_name: 'ADMIN', roleId: 1 });
    r = await anon('POST', '/api/auth/login', { email: `sp${stamp}@example.com`, password: 'Passw0rd!234' });
    const spMe = await anon('GET', '/api/auth/me');
    check('R1.  Cannot self-promote to ADMIN at register', spMe.json && spMe.json.data && spMe.json.data.user && spMe.json.data.user.role_name, 'USER');
    r = await user('GET', '/api/auth/admin-check');
    check('R2.  USER blocked from admin-check', r.status, 403);
    r = await user('POST', '/api/auth/logout');
    check('22e. Logout works', r.status, 200);
    r = await user('GET', '/api/auth/me');
    check('22f. /me after logout -> 401', r.status, 401);

    console.log(`\n${passed} passed, ${failed} failed`);
    process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });