// Module 13 - Online Reader & Customization Test Suite
// Verifies APIs, security, XSS defenses, accessibility structure, themes, and preferences.

const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://localhost:5000';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Passw0rd!234';

let passed = 0;
let failed = 0;

function check(name, condition, extraInfo = '') {
    if (condition) {
        passed++;
        console.log(`PASS  ${name}`);
    } else {
        failed++;
        console.log(`FAIL  ${name} ${extraInfo ? `(${extraInfo})` : ''}`);
    }
}

function makeClient() {
    let cookie = '';
    return async function call(method, apiPath, body) {
        const res = await fetch(BASE + apiPath, {
            method,
            headers: { 'Content-Type': 'application/json', ...(cookie ? { Cookie: cookie } : {}) },
            body: body ? JSON.stringify(body) : undefined,
        });
        const set = res.headers.get('set-cookie');
        if (set && set.startsWith('token=')) cookie = set.split(';')[0];
        let json = null;
        try { json = await res.json(); } catch (e) {}
        return { status: res.status, json, cookie };
    };
}

(async () => {
    console.log('--- 1. Testing Frontend Reader Files & Structure ---');
    const rootDir = path.resolve(__dirname, '..');
    const readerHtmlPath = path.join(rootDir, 'frontend', 'reader.html');
    const readerCssPath = path.join(rootDir, 'frontend', 'css', 'reader.css');
    const readerJsPath = path.join(rootDir, 'frontend', 'js', 'pages', 'reader.js');
    const routerJsPath = path.join(rootDir, 'frontend', 'js', 'router.js');
    const bookHtmlPath = path.join(rootDir, 'frontend', 'book.html');
    const bookJsPath = path.join(rootDir, 'frontend', 'js', 'pages', 'book.js');

    check('reader.html exists', fs.existsSync(readerHtmlPath));
    check('reader.css exists', fs.existsSync(readerCssPath));
    check('reader.js exists', fs.existsSync(readerJsPath));

    const readerHtml = fs.readFileSync(readerHtmlPath, 'utf8');
    check('reader.html has data-page="reader"', readerHtml.includes('data-page="reader"'));
    check('reader.html has reader-progress-bar', readerHtml.includes('id="reader-progress-bar"'));
    check('reader.html has reader-toc-drawer', readerHtml.includes('id="reader-toc-drawer"'));
    check('reader.html has reader-settings-drawer', readerHtml.includes('id="reader-settings-drawer"'));
    check('reader.html has reader-content article', readerHtml.includes('id="reader-content"'));
    check('reader.html has chapter body container', readerHtml.includes('id="reader-body-paragraphs"'));
    check('reader.html has bottom chapter nav', readerHtml.includes('id="reader-bottom-nav"'));
    check('reader.html has auto-scroll toolbar', readerHtml.includes('id="reader-autoscroll-bar"'));
    check('reader.html has resume banner', readerHtml.includes('id="reader-resume-banner"'));

    const readerCss = fs.readFileSync(readerCssPath, 'utf8');
    check('reader.css defines light theme', readerCss.includes('.reader-theme-light'));
    check('reader.css defines dark theme', readerCss.includes('.reader-theme-dark'));
    check('reader.css defines sepia theme', readerCss.includes('.reader-theme-sepia'));
    check('reader.css defines sans font family', readerCss.includes('.reader-font-sans'));
    check('reader.css defines serif font family', readerCss.includes('.reader-font-serif'));
    check('reader.css defines mono font family', readerCss.includes('.reader-font-mono'));
    check('reader.css defines narrow width', readerCss.includes('.reader-width-narrow'));
    check('reader.css defines normal width', readerCss.includes('.reader-width-normal'));
    check('reader.css defines wide width', readerCss.includes('.reader-width-wide'));
    check('reader.css defines compact/normal/relaxed line heights',
        readerCss.includes('.reader-leading-compact') &&
        readerCss.includes('.reader-leading-normal') &&
        readerCss.includes('.reader-leading-relaxed'));

    const readerJs = fs.readFileSync(readerJsPath, 'utf8');
    check('reader.js uses textContent/createTextNode for safe XSS-free text',
        readerJs.includes('createTextNode') && !readerJs.includes('.innerHTML ='));
    check('reader.js has preference storage key', readerJs.includes('digitalLibrary.readerPreferences'));
    check('reader.js has progress storage key', readerJs.includes('digitalLibrary.readingProgress'));
    check('reader.js supports auto-scroll with speed controls', readerJs.includes('AUTO_SCROLL_SPEEDS'));
    check('reader.js exports init() function', readerJs.includes('export async function init'));

    const routerJs = fs.readFileSync(routerJsPath, 'utf8');
    check('router.js registers reader module', routerJs.includes('reader: "./pages/reader.js"'));
    check('router.js includes reader.html in allowedPages', routerJs.includes('"reader.html"'));

    const bookHtml = fs.readFileSync(bookHtmlPath, 'utf8');
    check('book.html has Read online button', bookHtml.includes('id="btn-read-book"'));

    const bookJs = fs.readFileSync(bookJsPath, 'utf8');
    check('book.js links chapters to reader.html', bookJs.includes('reader.html?bookId='));

    console.log('\n--- 2. Testing Online Reader APIs with Backend ---');
    const admin = makeClient();
    const user = makeClient();
    const stamp = Date.now();

    // Setup accounts
    let r = await admin('POST', '/api/auth/login', { email: ADMIN_EMAIL, password: ADMIN_PASSWORD });
    check('Admin login succeeded', r.status === 200);

    const userEmail = `reader_test_${stamp}@example.com`;
    r = await user('POST', '/api/auth/register', { fullName: 'Reader User', email: userEmail, password: 'Passw0rd!234' });
    check('User register succeeded', r.status === 201);
    r = await user('POST', '/api/auth/login', { email: userEmail, password: 'Passw0rd!234' });
    check('User login succeeded', r.status === 200);

    // Create a published book with 3 chapters for reader testing
    r = await admin('POST', '/api/books', { title: `Module 13 Reader Test ${stamp}`, description: 'Test Reader Book' });
    const bookId = r.json?.data?.book?.book_id;
    check('Admin created book', r.status === 201 && !!bookId);

    // Add 3 chapters
    r = await admin('POST', `/api/books/${bookId}/chapters`, {
        chapterNumber: 1,
        title: 'Chapter One: The Awakening',
        content: 'This is the first paragraph of chapter one.\n\nThis is the second paragraph with detailed narrative content.'
    });
    const ch1 = r.json?.data?.chapter?.chapter_id;
    check('Admin created chapter 1', r.status === 201 && !!ch1);

    r = await admin('POST', `/api/books/${bookId}/chapters`, {
        chapterNumber: 2,
        title: 'Chapter Two: Dangerous Scripts',
        content: 'Safe text paragraph.\n\n<script>alert("XSS")</script>\n<img src=x onerror=alert(1)>'
    });
    const ch2 = r.json?.data?.chapter?.chapter_id;
    check('Admin created chapter 2 (with script payload)', r.status === 201 && !!ch2);

    r = await admin('POST', `/api/books/${bookId}/chapters`, {
        chapterNumber: 3,
        title: 'Chapter Three: The Finale',
        content: 'Final chapter content.'
    });
    const ch3 = r.json?.data?.chapter?.chapter_id;
    check('Admin created chapter 3', r.status === 201 && !!ch3);

    // Publish chapters 1, 2, 3 and the book
    await admin('PATCH', `/api/chapters/${ch1}/publish`);
    await admin('PATCH', `/api/chapters/${ch2}/publish`);
    await admin('PATCH', `/api/chapters/${ch3}/publish`);
    await admin('PATCH', `/api/books/${bookId}/publish`);

    // Verify Reader user can fetch published book
    r = await user('GET', `/api/books/${bookId}`);
    check('Reader user can fetch book details', r.status === 200 && r.json?.data?.book?.title.includes('Reader Test'));

    // Verify Reader user can fetch published chapters list
    r = await user('GET', `/api/books/${bookId}/chapters`);
    const chapters = r.json?.data?.chapters || [];
    check('Reader user fetches chapters list in order', r.status === 200 && chapters.length === 3 && chapters[0].chapter_number === 1 && chapters[2].chapter_number === 3);

    // Verify Reader user can fetch individual chapter content
    r = await user('GET', `/api/chapters/${ch1}`);
    check('Reader user fetches Chapter 1 content', r.status === 200 && r.json?.data?.chapter?.content.includes('first paragraph'));

    r = await user('GET', `/api/chapters/${ch2}`);
    check('Reader user fetches Chapter 2 content', r.status === 200 && r.json?.data?.chapter?.content.includes('<script>'));

    // Verify Unpublished/Draft book protection for reader
    r = await admin('POST', '/api/books', { title: `Draft Book ${stamp}`, description: 'Secret Draft' });
    const draftBookId = r.json?.data?.book?.book_id;
    r = await admin('POST', `/api/books/${draftBookId}/chapters`, { chapterNumber: 1, title: 'Draft Ch', content: 'Secret text' });
    const draftCh = r.json?.data?.chapter?.chapter_id;

    r = await user('GET', `/api/books/${draftBookId}`);
    check('Unpublished book is hidden from normal reader (404)', r.status === 404);

    r = await user('GET', `/api/books/${draftBookId}/chapters`);
    check('Unpublished book chapters are hidden from normal reader (404)', r.status === 404);

    r = await user('GET', `/api/chapters/${draftCh}`);
    check('Unpublished chapter is hidden from normal reader (404)', r.status === 404);

    // Verify Anonymous reader protection
    const anon = makeClient();
    r = await anon('GET', `/api/chapters/${ch1}`);
    check('Unauthenticated request to chapter requires auth (401)', r.status === 401);

    console.log(`\n================================`);
    console.log(`Total tests: ${passed + failed}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`================================`);

    process.exit(failed > 0 ? 1 : 0);
})().catch((err) => {
    console.error('Test execution error:', err);
    process.exit(2);
});
