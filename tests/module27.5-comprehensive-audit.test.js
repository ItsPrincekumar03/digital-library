'use strict';

/**
 * Module 27.5 — Comprehensive Cover, User/Admin Personal Library, PDF Response & Headless Chrome UI Audit
 *
 * Strictly isolated to `digital_library_test`. Cleans up all created DB rows and disk artifacts.
 */

process.env.TEST_DB_NAME = 'digital_library_test';
process.env.DB_NAME = 'digital_library_test';

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const http = require('http');
const zlib = require('zlib');
const { spawn } = require('child_process');

require('../backend/src/config/env');
const dbConfig = require('../backend/src/config/db.config');
if (dbConfig.database !== 'digital_library_test') {
    throw new Error(`Blocked: expected digital_library_test, got ${dbConfig.database}`);
}

const { pool } = require('../backend/src/config/database');
const app = require('../backend/src/app');
const { applyMigrations } = require('../backend/scripts/migrate');
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
    resolvePrivateCoverPath,
    buildPrivateProcessedName,
    buildPrivateImagesDirName,
    buildCoverFileName,
    deleteFileIfExists,
    deleteDirectoryIfExists,
} = require('../backend/src/utils/fileStorage');
const { COVER_EXTENSIONS, saveExtractedCover } = require('../backend/src/utils/coverFallback');
const { crc32, processEpubFile } = require('../backend/src/utils/epubProcessor');

let passed = 0;
let failed = 0;

function assert(name, condition, extra = '') {
    if (condition) {
        passed += 1;
        console.log(`[PASS] ${name}`);
    } else {
        failed += 1;
        console.error(`[FAIL] ${name}${extra !== '' ? ` -> ${typeof extra === 'object' ? JSON.stringify(extra) : extra}` : ''}`);
    }
}

class CookieJar {
    constructor() {
        this.cookies = new Map();
    }
    absorb(res) {
        const list = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
        for (const raw of list) {
            const pair = String(raw).split(';')[0];
            const eq = pair.indexOf('=');
            if (eq <= 0) continue;
            const k = pair.slice(0, eq).trim();
            const v = pair.slice(eq + 1).trim();
            if (!v || raw.toLowerCase().includes('max-age=0')) this.cookies.delete(k);
            else this.cookies.set(k, v);
        }
    }
    header() {
        return Array.from(this.cookies.entries()).map(([k, v]) => `${k}=${v}`).join('; ');
    }
    get(name) {
        return this.cookies.get(name) || '';
    }
}

async function apiFetch(baseUrl, method, urlPath, { jar, headers = {}, body, formData } = {}) {
    const reqHeaders = { ...headers };
    if (jar) {
        const cookieStr = jar.header();
        if (cookieStr) reqHeaders.Cookie = cookieStr;
        if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
            const csrf = jar.get('csrf_token');
            if (csrf && !reqHeaders['X-CSRF-Token']) reqHeaders['X-CSRF-Token'] = csrf;
        }
    }
    let reqBody;
    if (formData) {
        reqBody = formData;
    } else if (body !== undefined) {
        reqHeaders['Content-Type'] = 'application/json';
        reqBody = JSON.stringify(body);
    }

    const res = await fetch(`${baseUrl}${urlPath}`, { method, headers: reqHeaders, body: reqBody });
    if (jar) jar.absorb(res);
    const buf = Buffer.from(await res.arrayBuffer());
    const contentType = res.headers.get('content-type') || '';
    let json = null;
    if (contentType.includes('application/json')) {
        try { json = JSON.parse(buf.toString('utf8')); } catch (_) {}
    }
    return { status: res.status, headers: res.headers, contentType, buf, json };
}

function buildPdfFromObjects(objects) {
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
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
    return Buffer.from(pdf, 'latin1');
}

function buildPdfWithSpacerAndCover() {
    // Im1 is 1x1 tiny spacer, Im2 is 80x120 real cover image
    const spacer = zlib.deflateSync(Buffer.from([255, 255, 255])).toString('latin1');
    const coverPixels = Buffer.alloc(80 * 120 * 3);
    for (let i = 0; i < 80 * 120; i++) {
        coverPixels[i * 3] = 30;
        coverPixels[i * 3 + 1] = 80;
        coverPixels[i * 3 + 2] = 170;
    }
    const coverCompressed = zlib.deflateSync(coverPixels).toString('latin1');
    const content = 'BT\n/F1 16 Tf\n50 720 Td\n(Chapter One Text Content) Tj\nET\nq\n1 0 0 1 0 0 cm\n/Im1 Do\nQ\nq\n180 0 0 270 50 400 cm\n/Im2 Do\nQ\n';

    const content2 = 'BT\n/F1 16 Tf\n50 720 Td\n(Chapter Two Text Content) Tj\nET\n';
    const objects = [
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R 8 0 R] /Count 2 >>\nendobj\n',
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> /XObject << /Im1 6 0 R /Im2 7 0 R >> >> /Contents 5 0 R >>\nendobj\n',
        '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
        `5 0 obj\n<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}endstream\nendobj\n`,
        `6 0 obj\n<< /Type /XObject /Subtype /Image /Width 1 /Height 1 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${Buffer.byteLength(spacer, 'latin1')} >>\nstream\n${spacer}endstream\nendobj\n`,
        `7 0 obj\n<< /Type /XObject /Subtype /Image /Width 80 /Height 120 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode /Length ${Buffer.byteLength(coverCompressed, 'latin1')} >>\nstream\n${coverCompressed}endstream\nendobj\n`,
        '8 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 9 0 R >>\nendobj\n',
        `9 0 obj\n<< /Length ${Buffer.byteLength(content2, 'latin1')} >>\nstream\n${content2}endstream\nendobj\n`,
    ];
    return buildPdfFromObjects(objects);
}

function buildScannedPdf() {
    const content = 'q\n0.2 0.3 0.6 rg\n40 400 200 260 re\nf\nQ\n';
    return buildPdfFromObjects([
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n',
        `4 0 obj\n<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}endstream\nendobj\n`,
    ]);
}

function buildTextPdf(text = 'Reflowable text page') {
    const content = `BT\n/F1 14 Tf\n50 720 Td\n(${text}) Tj\nET\n`;
    return buildPdfFromObjects([
        '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
        '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
        '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n',
        '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
        `5 0 obj\n<< /Length ${Buffer.byteLength(content, 'latin1')} >>\nstream\n${content}endstream\nendobj\n`,
    ]);
}

function buildZipStore(entries) {
    // Minimal ZIP builder (method 0 = stored) with valid CRC32
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const { name, data } of entries) {
        const nameBuf = Buffer.from(name, 'utf8');
        const dataBuf = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8');
        const crc = crc32(dataBuf);

        const local = Buffer.alloc(30 + nameBuf.length);
        local.writeUInt32LE(0x04034b50, 0);
        local.writeUInt16LE(20, 4);
        local.writeUInt16LE(0, 6);
        local.writeUInt16LE(0, 8);
        local.writeUInt16LE(0, 10);
        local.writeUInt16LE(0, 12);
        local.writeUInt32LE(crc, 14);
        local.writeUInt32LE(dataBuf.length, 18);
        local.writeUInt32LE(dataBuf.length, 22);
        local.writeUInt16LE(nameBuf.length, 26);
        local.writeUInt16LE(0, 28);
        nameBuf.copy(local, 30);

        localParts.push(local, dataBuf);

        const central = Buffer.alloc(46 + nameBuf.length);
        central.writeUInt32LE(0x02014b50, 0);
        central.writeUInt16LE(20, 4);
        central.writeUInt16LE(20, 6);
        central.writeUInt16LE(0, 8);
        central.writeUInt16LE(0, 10);
        central.writeUInt16LE(0, 12);
        central.writeUInt16LE(0, 14);
        central.writeUInt32LE(crc, 16);
        central.writeUInt32LE(dataBuf.length, 20);
        central.writeUInt32LE(dataBuf.length, 24);
        central.writeUInt16LE(nameBuf.length, 28);
        central.writeUInt16LE(0, 30);
        central.writeUInt16LE(0, 32);
        central.writeUInt16LE(0, 34);
        central.writeUInt16LE(0, 36);
        central.writeUInt32LE(0, 38);
        central.writeUInt32LE(offset, 42);
        nameBuf.copy(central, 46);

        centralParts.push(central);
        offset += local.length + dataBuf.length;
    }

    const centralBuf = Buffer.concat(centralParts);
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0);
    eocd.writeUInt16LE(0, 4);
    eocd.writeUInt16LE(0, 6);
    eocd.writeUInt16LE(entries.length, 8);
    eocd.writeUInt16LE(entries.length, 10);
    eocd.writeUInt32LE(centralBuf.length, 12);
    eocd.writeUInt32LE(offset, 16);
    eocd.writeUInt16LE(0, 20);

    return Buffer.concat([...localParts, centralBuf, eocd]);
}

function makeTinyPng() {
    // Valid 1x1 PNG (67 bytes)
    return Buffer.from(
        '89504e470d0a1a0a0000000d4948445200000001000000010802000000907753de0000000c4944415408d763f8cfc000000301010018dd8db00000000049454e44ae426082',
        'hex'
    );
}

function buildSyntheticEpubWithCover() {
    const png = makeTinyPng();
    return buildZipStore([
        { name: 'mimetype', data: 'application/epub+zip' },
        {
            name: 'META-INF/container.xml',
            data: '<?xml version="1.0"?><container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles></container>'
        },
        {
            name: 'OEBPS/content.opf',
            data: `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>Synthetic EPUB Cover Book</dc:title>
    <dc:creator>EPUB Author</dc:creator>
  </metadata>
  <manifest>
    <item id="cover-img" href="images/cover.png" media-type="image/png" properties="cover-image"/>
    <item id="ch1" href="ch1.xhtml" media-type="application/xhtml+xml"/>
  </manifest>
  <spine>
    <itemref idref="ch1"/>
  </spine>
</package>`
        },
        { name: 'OEBPS/images/cover.png', data: png },
        {
            name: 'OEBPS/ch1.xhtml',
            data: '<?xml version="1.0" encoding="utf-8"?><html xmlns="http://www.w3.org/1999/xhtml"><body><h1>Chapter 1</h1><p>EPUB body paragraph.</p></body></html>'
        }
    ]);
}

function createStaticFrontendServer(rootDir) {
    const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.mjs': 'application/javascript; charset=utf-8',
        '.wasm': 'application/wasm',
        '.css': 'text/css; charset=utf-8',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.json': 'application/json',
    };

    return http.createServer((req, res) => {
        const reqPath = new URL(req.url, 'http://localhost').pathname;
        const rel = reqPath === '/' ? 'index.html' : reqPath.replace(/^\/+/, '');
        const resolved = path.resolve(rootDir, rel);
        if (!resolved.startsWith(rootDir)) {
            res.writeHead(403);
            return res.end('Forbidden');
        }
        fs.readFile(resolved, (err, data) => {
            if (err) {
                res.writeHead(404);
                return res.end('Not found');
            }
            const ext = path.extname(resolved).toLowerCase();
            res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
            res.end(data);
        });
    });
}

class CdpClient {
    constructor(wsUrl) {
        this.ws = new WebSocket(wsUrl);
        this.nextId = 1;
        this.pending = new Map();
    }
    async connect() {
        await new Promise((resolve, reject) => {
            this.ws.addEventListener('open', resolve, { once: true });
            this.ws.addEventListener('error', reject, { once: true });
        });
        this.ws.addEventListener('message', (event) => {
            const msg = JSON.parse(event.data);
            if (msg.id && this.pending.has(msg.id)) {
                const { resolve, reject } = this.pending.get(msg.id);
                this.pending.delete(msg.id);
                if (msg.error) reject(new Error(msg.error.message));
                else resolve(msg.result);
            }
        });
    }
    send(method, params = {}) {
        const id = this.nextId++;
        return new Promise((resolve, reject) => {
            this.pending.set(id, { resolve, reject });
            this.ws.send(JSON.stringify({ id, method, params }));
        });
    }
    async eval(expression, userGesture = false) {
        const res = await this.send('Runtime.evaluate', {
            expression,
            awaitPromise: true,
            returnByValue: true,
            userGesture,
        });
        if (res.exceptionDetails) {
            throw new Error(res.exceptionDetails.text || JSON.stringify(res.exceptionDetails));
        }
        return res.result?.value;
    }
    close() {
        try { this.ws.close(); } catch (_) {}
    }
}

async function runChromeChecks({ apiUrl, frontendUrl, adminCreds, userCreds, bookIds }) {
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    if (!fs.existsSync(chromePath)) {
        console.log('[SKIP] Chrome executable not found for UI checks.');
        return;
    }

    const userDataDir = await fsp.mkdtemp(path.join(require('os').tmpdir(), 'dl-m275-chrome-'));
    const debugPort = 9229 + Math.floor(Math.random() * 400);
    const chromeProc = spawn(chromePath, [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        `--remote-debugging-port=${debugPort}`,
        `--user-data-dir=${userDataDir}`,
        'about:blank',
    ], { stdio: 'ignore' });

    let cdp = null;
    try {
        let targets = null;
        for (let i = 0; i < 40; i++) {
            try {
                const r = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
                if (r.ok) {
                    targets = await r.json();
                    if (Array.isArray(targets) && targets.some((t) => t.type === 'page')) break;
                }
            } catch (_) {}
            await new Promise((r) => setTimeout(r, 150));
        }
        const pageTarget = targets?.find((t) => t.type === 'page');
        if (!pageTarget?.webSocketDebuggerUrl) {
            throw new Error('Could not connect to Chrome CDP page target.');
        }

        cdp = new CdpClient(pageTarget.webSocketDebuggerUrl);
        await cdp.connect();
        await cdp.send('Page.enable');
        await cdp.send('Runtime.enable');

        // Auto-accept window.confirm dialogs and collect uncaught page errors
        const browserErrors = [];
        await cdp.send('Page.setInterceptFileChooserDialog', { enabled: false }).catch(() => {});
        cdp.ws.addEventListener('message', (event) => {
            const msg = JSON.parse(event.data);
            if (msg.method === 'Page.javascriptDialogOpening') {
                cdp.send('Page.handleJavaScriptDialog', { accept: true }).catch(() => {});
            } else if (msg.method === 'Runtime.exceptionThrown') {
                const desc = msg.params?.exceptionDetails?.text || 'Runtime exception';
                browserErrors.push(desc);
            }
        });

        const navigateAndWait = async (url, width = 1366, height = 768) => {
            await cdp.send('Emulation.setDeviceMetricsOverride', {
                width, height, deviceScaleFactor: 1, mobile: width < 768,
            });
            await cdp.send('Page.navigate', { url });
            // Wait for page load + async init
            for (let i = 0; i < 40; i++) {
                const ready = await cdp.eval(`(async () => {
                    if (document.readyState !== 'complete') return false;
                    return true;
                })()`);
                if (ready) break;
                await new Promise((r) => setTimeout(r, 100));
            }
            await new Promise((r) => setTimeout(r, 900));
        };

        // Helper to set window.__DL_API_BASE_URL__ before modules use it?
        // Instead, use Page.addScriptToEvaluateOnNewDocument so config.js always resolves our ephemeral test API server!
        await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
            source: `window.__DL_API_BASE_URL__ = ${JSON.stringify(apiUrl + '/api')};
                     window.confirm = () => true;`
        });

        // 1. Login as Normal User via login.html
        await navigateAndWait(`${frontendUrl}/login.html`, 1366, 768);
        await cdp.eval(`(async () => {
            document.getElementById('email').value = ${JSON.stringify(userCreds.email)};
            document.getElementById('password').value = ${JSON.stringify(userCreds.password)};
            document.getElementById('login-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        })()`);
        await new Promise((r) => setTimeout(r, 1200));

        // 2. Check library.html covers, 2:3 proportions, Save/Remove buttons (User)
        await navigateAndWait(`${frontendUrl}/library.html`, 1366, 768);
        const libDesktopCheck = await cdp.eval(`(() => {
            const imgs = [...document.querySelectorAll('.book-card-cover')];
            const loaded = imgs.filter(i => !i.hidden && i.complete && i.naturalWidth > 0);
            const broken = imgs.filter(i => !i.hidden && i.naturalWidth === 0);
            const wraps = [...document.querySelectorAll('.book-card-cover-wrap')];
            const ratiosOk = wraps.every(w => {
                const r = w.getBoundingClientRect();
                const ratio = r.width / r.height;
                return ratio >= 0.60 && ratio <= 0.74;
            });
            const fitOk = imgs.every(i => getComputedStyle(i).objectFit === 'contain');
            const overflow = document.documentElement.scrollWidth > window.innerWidth + 1;
            const saveBtns = [...document.querySelectorAll('.book-card-actions button')].map(b => b.textContent);
            return { total: imgs.length, loaded: loaded.length, broken: broken.length, ratiosOk, fitOk, overflow, hasSaveBtn: saveBtns.includes('Save to My Library') };
        })()`);
        assert('Chrome UI (User desktop): library.html renders covers with 2:3 ratio, object-fit:contain, 0 broken images & Save button',
            libDesktopCheck.total >= 5 && libDesktopCheck.loaded === libDesktopCheck.total && libDesktopCheck.broken === 0 && libDesktopCheck.ratiosOk && libDesktopCheck.fitOk && !libDesktopCheck.overflow && libDesktopCheck.hasSaveBtn,
            libDesktopCheck);

        // Mobile viewport check on library.html
        await navigateAndWait(`${frontendUrl}/library.html`, 390, 844);
        const libMobileCheck = await cdp.eval(`(() => {
            const wraps = [...document.querySelectorAll('.book-card-cover-wrap')];
            const ratiosOk = wraps.every(w => {
                const r = w.getBoundingClientRect();
                const ratio = r.width / r.height;
                return r.width >= 100 && r.width <= 140 && ratio >= 0.60 && ratio <= 0.74;
            });
            const overflow = document.documentElement.scrollWidth > window.innerWidth + 1;
            return { ratiosOk, overflow };
        })()`);
        assert('Chrome UI (mobile 390x844): library.html keeps ~120x180 (2:3) covers and 0 horizontal overflow',
            libMobileCheck.ratiosOk && !libMobileCheck.overflow, libMobileCheck);

        // Click Save to My Library on book.html for synthetic PDF book
        await navigateAndWait(`${frontendUrl}/book.html?id=${bookIds.pdfWithCover}`, 1366, 768);
        const bookPageSave = await cdp.eval(`(async () => {
            const cover = document.getElementById('book-cover');
            const saveBtn = document.getElementById('book-save-toggle');
            const removeBtn = document.getElementById('book-remove-saved');
            const beforeText = saveBtn?.textContent;
            saveBtn?.click();
            await new Promise(r => setTimeout(r, 700));
            return {
                coverLoaded: Boolean(cover && !cover.hidden && cover.naturalWidth > 0),
                beforeText,
                afterText: saveBtn?.textContent,
                saveDisabled: Boolean(saveBtn?.disabled),
                removeVisible: Boolean(removeBtn && !removeBtn.hidden && removeBtn.textContent === 'Remove from My Library'),
            };
        })()`);
        assert('Chrome UI (User): book.html loads cover and toggles Save to My Library -> Saved to My Library + Remove from My Library',
            bookPageSave.coverLoaded && bookPageSave.beforeText === 'Save to My Library' && bookPageSave.afterText === 'Saved to My Library' && bookPageSave.saveDisabled && bookPageSave.removeVisible,
            bookPageSave);

        // Check private-library.html shows saved public book with cover & remove button works
        await navigateAndWait(`${frontendUrl}/private-library.html`, 1366, 768);
        const privUploadUiCheck = await cdp.eval(`(() => {
            const input = document.getElementById('private-file');
            const epubBtn = document.getElementById('private-format-epub');
            const infoText = document.getElementById('private-format-info')?.textContent || '';
            return {
                acceptOk: input?.getAttribute('accept') === '.pdf,application/pdf',
                noEpubOption: !epubBtn,
                mentionsPdfOnly: infoText.includes('PDF only'),
            };
        })()`);
        assert('Chrome UI (User private-library.html): PDF-only file input accept=".pdf,application/pdf" and no EPUB upload option',
            privUploadUiCheck.acceptOk && privUploadUiCheck.noEpubOption && privUploadUiCheck.mentionsPdfOnly, privUploadUiCheck);

        const privUserCheck = await cdp.eval(`(async () => {
            const imgs = [...document.querySelectorAll('#saved-books-list .private-file-cover')];
            const loaded = imgs.filter(i => !i.hidden && i.naturalWidth > 0).length;
            const removeBtn = [...document.querySelectorAll('#saved-books-list button')].find(b => b.textContent === 'Remove from My Library');
            const countBefore = document.querySelectorAll('#saved-books-list .private-file-card').length;
            removeBtn?.click();
            await new Promise(r => setTimeout(r, 800));
            const countAfter = document.querySelectorAll('#saved-books-list .private-file-card').length;
            return { countBefore, loaded, countAfter };
        })()`);
        assert('Chrome UI (User): private-library.html displays saved book cover and Remove from My Library removes it',
            privUserCheck.countBefore === 1 && privUserCheck.loaded === 1 && privUserCheck.countAfter === 0, privUserCheck);

        // 3. Original PDF Reader Isolation & PDF.js Rendering Check on read.html
        await navigateAndWait(`${frontendUrl}/read.html?id=${bookIds.pdfWithCover}`, 1366, 768);
        await new Promise((r) => setTimeout(r, 700));
        const pdfModeCheck = await cdp.eval(`(() => {
            const bodyMode = document.body.dataset.readerMode;
            const viewer = document.getElementById('read-pdf-viewer');
            const stage = document.getElementById('read-pdf-stage');
            const pages = document.querySelectorAll('#read-pdf-pages .page');
            const canvases = document.querySelectorAll('#read-pdf-pages canvas');
            const hiddenIds = ['read-content', 'read-topbar', 'read-settings-panel', 'read-chapters-panel', 'read-notice', 'read-focus-exit'];
            const allHidden = hiddenIds.every(id => {
                const el = document.getElementById(id);
                return el && getComputedStyle(el).display === 'none';
            });
            const actionsHidden = getComputedStyle(document.querySelector('.read-actions')).display === 'none';
            const progressHidden = getComputedStyle(document.querySelector('.read-progress')).display === 'none';
            const hasControls = Boolean(document.getElementById('read-pdf-prev') && document.getElementById('read-pdf-next') && document.getElementById('read-pdf-zoom-in') && document.getElementById('read-pdf-zoom-out') && document.getElementById('read-pdf-fullscreen'));
            const noDownloadControls = !document.getElementById('read-pdf-download') && !document.getElementById('download') && !document.getElementById('secondaryDownload') && !document.querySelector('iframe[src^="blob:"]');
            return {
                bodyMode,
                viewerVisible: Boolean(viewer && !viewer.hidden && getComputedStyle(viewer).display !== 'none'),
                stageVisible: Boolean(stage && getComputedStyle(stage).display !== 'none'),
                pageCount: pages.length,
                canvasCount: canvases.length,
                allHidden,
                actionsHidden,
                progressHidden,
                hasControls,
                noDownloadControls,
            };
        })()`);
        assert('Chrome UI (Original PDF mode): renders via embedded PDF.js (2 pages + canvases), zero download controls or blob iframe, hides ALL EPUB/TTS/theme/chapter controls',
            pdfModeCheck.bodyMode === 'pdf' && pdfModeCheck.viewerVisible && pdfModeCheck.stageVisible && pdfModeCheck.pageCount === 2 && pdfModeCheck.canvasCount >= 1 && pdfModeCheck.allHidden && pdfModeCheck.actionsHidden && pdfModeCheck.progressHidden && pdfModeCheck.hasControls && pdfModeCheck.noDownloadControls,
            pdfModeCheck);

        // 3b. Original PDF Fullscreen, Page/Zoom/Scroll Preservation, ESC & Fallback (Desktop)
        const pdfFullscreenDesktop = await cdp.eval(`(async () => {
            const viewer = document.getElementById('read-pdf-viewer');
            const stageWrap = document.getElementById('read-pdf-stage-wrap');
            const stage = document.getElementById('read-pdf-stage');
            const toolbar = viewer.querySelector('.read-pdf-toolbar');
            const fsBtn = document.getElementById('read-pdf-fullscreen');
            const nextBtn = document.getElementById('read-pdf-next');
            const zoomInBtn = document.getElementById('read-pdf-zoom-in');
            const pageInput = document.getElementById('read-pdf-page');
            const zoomValue = document.getElementById('read-pdf-zoom-value');

            const hasNoDownloadBtn = !document.getElementById('read-pdf-download') && !document.getElementById('download') && !document.getElementById('secondaryDownload') && ![...document.querySelectorAll('.read-pdf-toolbar a, .read-pdf-toolbar button')].some(el => el.textContent.toLowerCase().includes('download'));
            const enterTooltip = fsBtn?.getAttribute('title');

            // Navigate to page 2 and zoom to 125% before entering full screen
            nextBtn?.click();
            await new Promise(r => setTimeout(r, 250));
            zoomInBtn?.click();
            await new Promise(r => setTimeout(r, 250));

            const pageBeforeFs = pageInput?.value;
            const zoomBeforeFs = zoomValue?.textContent;
            const stageBeforeH = stageWrap?.getBoundingClientRect().height || 0;

            // Enter full screen via click with userGesture
            fsBtn?.click();
            await new Promise(r => setTimeout(r, 400));

            const inFullscreen = Boolean(
                document.fullscreenElement === viewer ||
                (viewer?.classList.contains('is-fullscreen') && viewer?.dataset.fullscreen === 'true')
            );
            const rectInFs = viewer?.getBoundingClientRect();
            const stageRectInFs = stageWrap?.getBoundingClientRect();
            const toolbarVisibleInFs = Boolean(toolbar && getComputedStyle(toolbar).display !== 'none' && toolbar.getBoundingClientRect().height > 20);
            const exitTooltip = fsBtn?.getAttribute('title');
            const pressedInFs = fsBtn?.getAttribute('aria-pressed');
            const pageInFs = pageInput?.value;
            const zoomInFs = zoomValue?.textContent;
            const scrollableInFs = Boolean(stage && stage.scrollHeight > stage.clientHeight);

            // Exit via button click
            fsBtn?.click();
            await new Promise(r => setTimeout(r, 350));
            const exitedByBtn = !document.fullscreenElement && !viewer?.classList.contains('is-fullscreen');
            const pageAfterBtnExit = pageInput?.value;
            const zoomAfterBtnExit = zoomValue?.textContent;
            const tooltipAfterExit = fsBtn?.getAttribute('title');

            // Re-enter fullscreen for ESC test
            fsBtn?.click();
            await new Promise(r => setTimeout(r, 350));
            const reEntered = Boolean(document.fullscreenElement === viewer || viewer?.classList.contains('is-fullscreen'));

            return {
                hasNoDownloadBtn,
                enterTooltip,
                pageBeforeFs,
                zoomBeforeFs,
                stageBeforeH: Math.round(stageBeforeH),
                inFullscreen,
                fillsViewport: Boolean(rectInFs && rectInFs.width >= 1360 && rectInFs.height >= 760 && stageRectInFs && stageRectInFs.height > stageBeforeH && stageRectInFs.height >= 680),
                toolbarVisibleInFs,
                scrollableInFs,
                exitTooltip,
                pressedInFs,
                pageInFs,
                zoomInFs,
                exitedByBtn,
                pageAfterBtnExit,
                zoomAfterBtnExit,
                tooltipAfterExit,
                reEntered,
            };
        })()`, true);

        // Press Escape key via CDP Input to verify Escape exits fullscreen
        await cdp.send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
        await cdp.send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27, nativeVirtualKeyCode: 27 });
        await new Promise(r => setTimeout(r, 350));

        const afterEscState = await cdp.eval(`(() => {
            const viewer = document.getElementById('read-pdf-viewer');
            return {
                exitedOnEsc: !document.fullscreenElement && !viewer?.classList.contains('is-fullscreen'),
                pageAfterEsc: document.getElementById('read-pdf-page')?.value,
                zoomAfterEsc: document.getElementById('read-pdf-zoom-value')?.textContent,
            };
        })()`);

        // Verify graceful fallback full-viewport mode when native requestFullscreen throws/is unsupported
        const fallbackCheck = await cdp.eval(`(async () => {
            const viewer = document.getElementById('read-pdf-viewer');
            const origReq = viewer.requestFullscreen;
            viewer.requestFullscreen = () => Promise.reject(new Error('Fullscreen disallowed'));
            document.getElementById('read-pdf-fullscreen')?.click();
            await new Promise(r => setTimeout(r, 250));
            const fallbackActive = Boolean(viewer.classList.contains('is-fallback-fullscreen') && document.body.dataset.pdfFallbackFullscreen === 'true');
            const headerHidden = getComputedStyle(document.getElementById('site-header')).display === 'none';
            const rectFb = document.getElementById('read-pdf-stage-wrap')?.getBoundingClientRect();
            window.document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
            await new Promise(r => setTimeout(r, 200));
            const fallbackExited = !viewer.classList.contains('is-fallback-fullscreen') && !document.body.dataset.pdfFallbackFullscreen;
            viewer.requestFullscreen = origReq;
            return { fallbackActive, headerHidden, expandedInFallback: Boolean(rectFb && rectFb.height >= 680), fallbackExited };
        })()`, true);

        assert('Chrome UI (Original PDF Fullscreen Desktop): expands PDF.js viewer to viewport, preserves page=2 & zoom=125% + scrollable stage + visible dark toolbar, exits via button/ESC/fallback',
            pdfFullscreenDesktop.hasNoDownloadBtn &&
            pdfFullscreenDesktop.enterTooltip === 'Enter Full Screen' &&
            pdfFullscreenDesktop.pageBeforeFs === '2' &&
            pdfFullscreenDesktop.zoomBeforeFs === '125%' &&
            pdfFullscreenDesktop.inFullscreen &&
            pdfFullscreenDesktop.fillsViewport &&
            pdfFullscreenDesktop.toolbarVisibleInFs &&
            pdfFullscreenDesktop.scrollableInFs &&
            pdfFullscreenDesktop.exitTooltip === 'Exit Full Screen' &&
            pdfFullscreenDesktop.pressedInFs === 'true' &&
            pdfFullscreenDesktop.pageInFs === '2' &&
            pdfFullscreenDesktop.zoomInFs === '125%' &&
            pdfFullscreenDesktop.exitedByBtn &&
            pdfFullscreenDesktop.pageAfterBtnExit === '2' &&
            pdfFullscreenDesktop.zoomAfterBtnExit === '125%' &&
            pdfFullscreenDesktop.tooltipAfterExit === 'Enter Full Screen' &&
            pdfFullscreenDesktop.reEntered &&
            afterEscState.exitedOnEsc &&
            afterEscState.pageAfterEsc === '2' &&
            afterEscState.zoomAfterEsc === '125%' &&
            fallbackCheck.fallbackActive &&
            fallbackCheck.headerHidden &&
            fallbackCheck.expandedInFallback &&
            fallbackCheck.fallbackExited,
            { pdfFullscreenDesktop, afterEscState, fallbackCheck });

        // Mobile viewport check on Original PDF reader
        await navigateAndWait(`${frontendUrl}/read.html?id=${bookIds.pdfWithCover}`, 390, 844);
        await new Promise((r) => setTimeout(r, 600));
        const pdfMobileCheck = await cdp.eval(`(async () => {
            const fsBtn = document.getElementById('read-pdf-fullscreen');
            const viewer = document.getElementById('read-pdf-viewer');
            const stageWrap = document.getElementById('read-pdf-stage-wrap');
            const btnRect = fsBtn?.getBoundingClientRect();
            const stageBefore = stageWrap?.getBoundingClientRect();
            const noDownload = !document.getElementById('read-pdf-download') && !document.getElementById('download');
            const overflowBefore = document.documentElement.scrollWidth > window.innerWidth + 1;
            fsBtn?.click();
            await new Promise(r => setTimeout(r, 300));
            const enteredFs = Boolean(document.fullscreenElement === viewer || viewer?.classList.contains('is-fullscreen'));
            const viewerRectAfter = viewer?.getBoundingClientRect();
            const stageAfter = stageWrap?.getBoundingClientRect();
            fsBtn?.click();
            await new Promise(r => setTimeout(r, 250));
            return {
                noDownload,
                overflowBefore,
                usableTouchTarget: Boolean(btnRect && btnRect.height >= 44 && btnRect.width > 0),
                enteredFs,
                viewerHeightInFs: Math.round(viewerRectAfter?.height || 0),
                stageBeforeH: Math.round(stageBefore?.height || 0),
                stageAfterH: Math.round(stageAfter?.height || 0),
                mobileStageExpanded: Boolean(viewerRectAfter && viewerRectAfter.height >= 830 && stageAfter && stageBefore && stageAfter.height > stageBefore.height),
            };
        })()`, true);
        assert('Chrome UI (Original PDF mobile 390x844): Full Screen button is usable (>=44px), no Download button, PDF.js stage expands & exits cleanly',
            pdfMobileCheck.noDownload && !pdfMobileCheck.overflowBefore && pdfMobileCheck.usableTouchTarget && pdfMobileCheck.enteredFs && pdfMobileCheck.mobileStageExpanded,
            pdfMobileCheck);

        // Private PDF check on read.html?privateId=...
        if (bookIds.privatePdfId) {
            await navigateAndWait(`${frontendUrl}/read.html?privateId=${bookIds.privatePdfId}`, 1366, 768);
            await new Promise((r) => setTimeout(r, 600));
            const privPdfFsCheck = await cdp.eval(`(async () => {
                const viewer = document.getElementById('read-pdf-viewer');
                const pages = document.querySelectorAll('#read-pdf-pages .page');
                const fsBtn = document.getElementById('read-pdf-fullscreen');
                const noDownload = !document.getElementById('read-pdf-download') && !document.getElementById('download') && !document.getElementById('secondaryDownload');
                fsBtn?.click();
                await new Promise(r => setTimeout(r, 300));
                const entered = Boolean(document.fullscreenElement === viewer || viewer?.classList.contains('is-fullscreen'));
                fsBtn?.click();
                await new Promise(r => setTimeout(r, 250));
                const exited = !document.fullscreenElement && !viewer?.classList.contains('is-fullscreen');
                return {
                    pageCount: pages.length,
                    noDownload,
                    entered,
                    exited,
                };
            })()`, true);
            assert('Chrome UI (Private PDF): loads PDF.js pages cleanly, hides all download controls, Full Screen enter/exit works',
                privPdfFsCheck.pageCount === 2 && privPdfFsCheck.noDownload && privPdfFsCheck.entered && privPdfFsCheck.exited,
                privPdfFsCheck);
        }

        assert('Chrome UI: Zero uncaught runtime JavaScript errors across all tested reader flows',
            browserErrors.length === 0, browserErrors);

        // Scanned PDF should NOT show broken EPUB-style option
        await navigateAndWait(`${frontendUrl}/read.html?id=${bookIds.scannedPdf}`, 1366, 768);
        await new Promise((r) => setTimeout(r, 600));
        const scannedPdfCheck = await cdp.eval(`(() => {
            const switchEl = document.getElementById('read-mode-switch');
            const pages = document.querySelectorAll('#read-pdf-pages .page');
            return {
                modeSwitchHidden: Boolean(switchEl && switchEl.hidden),
                pageCount: pages.length,
            };
        })()`);
        assert('Chrome UI (Scanned PDF): hides unavailable EPUB-style toggle and renders Original PDF via PDF.js',
            scannedPdfCheck.modeSwitchHidden && scannedPdfCheck.pageCount === 1, scannedPdfCheck);

        // Reflow mode still works for text PDF
        await navigateAndWait(`${frontendUrl}/read.html?id=${bookIds.pdfWithCover}&mode=reflow`, 1366, 768);
        const reflowCheck = await cdp.eval(`(() => {
            const bodyMode = document.body.dataset.readerMode;
            const content = document.getElementById('read-content');
            const actions = document.querySelector('.read-actions');
            return {
                bodyMode,
                contentVisible: Boolean(content && !content.hidden && content.textContent.includes('Chapter One Text Content')),
                actionsVisible: Boolean(actions && getComputedStyle(actions).display !== 'none'),
            };
        })()`);
        assert('Chrome UI (EPUB-style mode): preserves separate reflowable reader & TTS/settings controls',
            reflowCheck.bodyMode === 'reflow' && reflowCheck.contentVisible && reflowCheck.actionsVisible, reflowCheck);

        // 4. Logout & Login as ADMIN -> test admin.html, admin-book.html, and Admin personal library!
        await cdp.eval(`(async () => {
            const btn = document.querySelector('[data-action="logout"]');
            if (btn) btn.click();
        })()`);
        await new Promise((r) => setTimeout(r, 800));
        await cdp.send('Network.clearBrowserCookies').catch(() => {});
        await navigateAndWait(`${frontendUrl}/login.html`, 1366, 768);
        await cdp.eval(`(async () => {
            document.getElementById('email').value = ${JSON.stringify(adminCreds.email)};
            document.getElementById('password').value = ${JSON.stringify(adminCreds.password)};
            document.getElementById('login-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        })()`);
        await new Promise((r) => setTimeout(r, 1200));

        await navigateAndWait(`${frontendUrl}/admin.html`, 1366, 768);
        const adminDashCheck = await cdp.eval(`(async () => {
            const thumbs = [...document.querySelectorAll('.admin-book-thumb')];
            const loadedThumbs = thumbs.filter(i => !i.hidden && i.naturalWidth > 0);
            const summaryAll = document.getElementById('admin-books-summary')?.textContent || '';
            const statusBadges = [...document.querySelectorAll('#books-table-body .admin-status')].map(s => s.textContent);
            const sortOptions = [...document.querySelectorAll('#admin-sort-filter option')].map(o => o.value);
            const categoryOptions = [...document.querySelectorAll('#admin-category-filter option')].map(o => o.textContent.trim());

            // Test Category filter + Status=DRAFT combined + Search + Sort + Reset
            const catSelect = document.getElementById('admin-category-filter');
            const targetCatVal = [...catSelect.options].find(o => o.textContent.includes('AuditCatAlpha'))?.value || '';
            catSelect.value = targetCatVal;
            catSelect.dispatchEvent(new Event('change', { bubbles: true }));
            await new Promise(r => setTimeout(r, 500));
            const countCat = document.querySelectorAll('#books-table-body tr').length;
            const summaryCat = document.getElementById('admin-books-summary')?.textContent || '';

            const statusSelect = document.getElementById('admin-status-filter');
            statusSelect.value = 'DRAFT';
            statusSelect.dispatchEvent(new Event('change', { bubbles: true }));
            await new Promise(r => setTimeout(r, 500));
            const countCatDraft = document.querySelectorAll('#books-table-body tr').length;
            const draftRowText = document.getElementById('books-table-body')?.textContent || '';

            // Check active filter chips + quick status pills + debounced live search
            const chipsBeforeSearch = document.querySelectorAll('#admin-active-filters .admin-filter-chip').length;
            const searchEl = document.getElementById('admin-book-search');
            searchEl.value = 'Synthetic Draft Filterable';
            searchEl.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(r => setTimeout(r, 650));
            const countCombined = document.querySelectorAll('#books-table-body tr').length;
            const chipsWithSearch = document.querySelectorAll('#admin-active-filters .admin-filter-chip').length;

            // Remove just the Search chip interactively
            const searchChip = [...document.querySelectorAll('#admin-active-filters .admin-filter-chip')].find(c => c.textContent.includes('Search:'));
            searchChip?.click();
            await new Promise(r => setTimeout(r, 500));
            const chipsAfterChipRemove = document.querySelectorAll('#admin-active-filters .admin-filter-chip').length;

            // Reset filters (enabled when active, disabled after reset)
            const resetBtn = document.getElementById('admin-reset-filters');
            const resetEnabledBefore = !resetBtn.disabled;
            resetBtn.click();
            await new Promise(r => setTimeout(r, 600));
            const countAfterReset = document.querySelectorAll('#books-table-body tr').length;
            const summaryAfterReset = document.getElementById('admin-books-summary')?.textContent || '';

            // Sort Title A to Z
            const sortSelect = document.getElementById('admin-sort-filter');
            sortSelect.value = 'title:ASC';
            sortSelect.dispatchEvent(new Event('change', { bubbles: true }));
            await new Promise(r => setTimeout(r, 500));
            const titlesAsc = [...document.querySelectorAll('#books-table-body .admin-book-title-body > span')].map(el => el.textContent.trim());

            const saveBtns = [...document.querySelectorAll('#books-table-body button')].filter(b => b.textContent === 'Save to My Library');
            const countBeforeSave = saveBtns.length;
            saveBtns[0]?.click();
            await new Promise(r => setTimeout(r, 700));
            const savedBtns = [...document.querySelectorAll('#books-table-body button')].filter(b => b.textContent === 'Saved to My Library');

            return {
                totalThumbs: thumbs.length,
                loadedThumbs: loadedThumbs.length,
                hasDraftAndPublished: statusBadges.includes('DRAFT') && statusBadges.includes('PUBLISHED'),
                sortOptionsMatch: JSON.stringify(sortOptions) === JSON.stringify(['created_at:DESC', 'title:ASC', 'title:DESC', 'publication_date:DESC', 'publication_date:ASC']),
                hasDynamicCategories: categoryOptions.includes('All categories') && categoryOptions.some(c => c.includes('AuditCatAlpha')),
                summaryAll,
                countCat,
                summaryCat,
                countCatDraft,
                draftFound: draftRowText.includes('Synthetic Draft Filterable'),
                chipsBeforeSearch,
                countCombined,
                chipsWithSearch,
                chipsAfterChipRemove,
                resetEnabledBefore,
                countAfterReset,
                summaryAfterReset,
                titlesSortedAsc: titlesAsc.length >= 2 && titlesAsc[0].localeCompare(titlesAsc[1]) <= 0,
                countBeforeSave,
                savedAfter: savedBtns.length,
            };
        })()`);
        assert('Chrome UI (Admin): interactive filters (category/status pills/chips/live search/sort), preserves DRAFT visibility, resets cleanly, loads covers & saves personal book',
            adminDashCheck.totalThumbs >= 6 &&
            adminDashCheck.loadedThumbs === adminDashCheck.totalThumbs &&
            adminDashCheck.hasDraftAndPublished &&
            adminDashCheck.sortOptionsMatch &&
            adminDashCheck.hasDynamicCategories &&
            adminDashCheck.countCat >= 2 &&
            adminDashCheck.summaryCat.includes('matching book') &&
            adminDashCheck.countCatDraft === 1 &&
            adminDashCheck.draftFound &&
            adminDashCheck.chipsBeforeSearch === 2 &&
            adminDashCheck.countCombined === 1 &&
            adminDashCheck.chipsWithSearch === 3 &&
            adminDashCheck.chipsAfterChipRemove === 2 &&
            adminDashCheck.resetEnabledBefore &&
            adminDashCheck.countAfterReset >= 6 &&
            adminDashCheck.titlesSortedAsc &&
            adminDashCheck.countBeforeSave >= 1 &&
            adminDashCheck.savedAfter >= 1,
            adminDashCheck);

        // Tablet (768x1024) & Mobile (390x844) interactive admin filter checks
        await navigateAndWait(`${frontendUrl}/admin.html`, 768, 1024);
        const adminTabletCheck = await cdp.eval(`(async () => {
            const overflow = document.documentElement.scrollWidth > window.innerWidth + 1;
            const draftPill = [...document.querySelectorAll('#admin-status-pills .admin-status-pill')].find(p => p.dataset.status === 'DRAFT');
            draftPill?.click();
            await new Promise(r => setTimeout(r, 500));
            const statusVal = document.getElementById('admin-status-filter')?.value;
            const firstRowRect = document.querySelector('#books-table-body tr')?.getBoundingClientRect();
            return {
                overflow,
                statusSyncedFromPill: statusVal === 'DRAFT',
                cardLayoutFitsViewport: Boolean(firstRowRect && firstRowRect.width <= 760),
                pillHeightOk: Boolean(draftPill && draftPill.getBoundingClientRect().height >= 36),
            };
        })()`);
        assert('Chrome UI (Admin tablet 768x1024): interactive pills sync filter, card-style rows fit viewport with 0 horizontal overflow',
            !adminTabletCheck.overflow && adminTabletCheck.statusSyncedFromPill && adminTabletCheck.cardLayoutFitsViewport && adminTabletCheck.pillHeightOk,
            adminTabletCheck);

        await navigateAndWait(`${frontendUrl}/admin.html`, 390, 844);
        const adminMobileCheck = await cdp.eval(`(async () => {
            const overflow = document.documentElement.scrollWidth > window.innerWidth + 1;
            const toggleBtn = document.getElementById('admin-filter-toggle');
            const controls = document.getElementById('admin-book-controls');
            const controlsBody = document.getElementById('admin-book-controls-body');
            const toggleVisible = Boolean(toggleBtn && getComputedStyle(toggleBtn).display !== 'none' && toggleBtn.getBoundingClientRect().height >= 44);

            // Tap pill & confirm active count badge shows 1, then collapse/expand drawer
            const draftPill = [...document.querySelectorAll('#admin-status-pills .admin-status-pill')].find(p => p.dataset.status === 'DRAFT');
            draftPill?.click();
            await new Promise(r => setTimeout(r, 500));
            const badgeText = document.getElementById('admin-filter-badge')?.textContent;

            toggleBtn?.click();
            await new Promise(r => setTimeout(r, 150));
            const collapsedHidden = getComputedStyle(controlsBody).display === 'none' && toggleBtn.getAttribute('aria-expanded') === 'false';
            toggleBtn?.click();
            await new Promise(r => setTimeout(r, 150));
            const reExpanded = controls.classList.contains('is-open') && getComputedStyle(controlsBody).display !== 'none';

            return { overflow, toggleVisible, badgeText, collapsedHidden, reExpanded };
        })()`);
        assert('Chrome UI (Admin mobile 390x844): 0 overflow, >=44px controls, collapsible Search & Filters drawer with active badge works cleanly',
            !adminMobileCheck.overflow && adminMobileCheck.toggleVisible && adminMobileCheck.badgeText === '1' && adminMobileCheck.collapsedHidden && adminMobileCheck.reExpanded,
            adminMobileCheck);

        await navigateAndWait(`${frontendUrl}/admin-book.html?id=${bookIds.pdfWithCover}`, 1366, 768);
        const adminUploadUiCheck = await cdp.eval(`(() => {
            const input = document.getElementById('book-pdf-file');
            const epubBtn = document.getElementById('admin-format-epub');
            const infoText = document.getElementById('admin-format-info')?.textContent || '';
            return {
                acceptOk: input?.getAttribute('accept') === '.pdf,application/pdf',
                noEpubOption: !epubBtn,
                mentionsPdfOnly: infoText.includes('PDF only'),
            };
        })()`);
        assert('Chrome UI (Admin admin-book.html): PDF-only file input accept=".pdf,application/pdf" and no EPUB upload option',
            adminUploadUiCheck.acceptOk && adminUploadUiCheck.noEpubOption && adminUploadUiCheck.mentionsPdfOnly, adminUploadUiCheck);

        const adminBookCheck = await cdp.eval(`(() => {
            const preview = document.getElementById('book-cover-preview');
            const placeholder = document.getElementById('book-cover-placeholder');
            const readerHref = document.getElementById('admin-preview-reader')?.getAttribute('href') || '';
            return {
                previewVisible: Boolean(preview && !preview.hidden && preview.naturalWidth > 0),
                placeholderHidden: Boolean(placeholder && placeholder.hidden),
                readerHrefOk: readerHref.includes('read.html?id='),
            };
        })()`);
        assert('Chrome UI (Admin): admin-book.html renders #book-cover-preview cleanly and links Preview in Reader',
            adminBookCheck.previewVisible && adminBookCheck.placeholderHidden && adminBookCheck.readerHrefOk,
            adminBookCheck);

        await navigateAndWait(`${frontendUrl}/private-library.html`, 1366, 768);
        const adminPrivCheck = await cdp.eval(`(async () => {
            const countBefore = document.querySelectorAll('#saved-books-list .private-file-card').length;
            const removeBtn = [...document.querySelectorAll('#saved-books-list button')].find(b => b.textContent === 'Remove from My Library');
            removeBtn?.click();
            await new Promise(r => setTimeout(r, 800));
            const countAfter = document.querySelectorAll('#saved-books-list .private-file-card').length;
            return { countBefore, countAfter };
        })()`);
        assert('Chrome UI (Admin): private-library.html displays Admin saved book and Remove from My Library removes it',
            adminPrivCheck.countBefore >= 1 && adminPrivCheck.countAfter === adminPrivCheck.countBefore - 1,
            adminPrivCheck);

    } finally {
        if (cdp) cdp.close();
        try { chromeProc.kill(); } catch (_) {}
        await fsp.rm(userDataDir, { recursive: true, force: true }).catch(() => {});
    }
}

async function run() {
    console.log('=== Module 27.5 Comprehensive Audit & E2E Verification ===\n');
    await applyMigrations(pool, 'digital_library_test');

    const apiServer = http.createServer(app);
    await new Promise((r) => apiServer.listen(0, '127.0.0.1', r));
    const apiUrl = `http://127.0.0.1:${apiServer.address().port}`;

    const frontendServer = createStaticFrontendServer(path.resolve(__dirname, '..', 'frontend'));
    await new Promise((r) => frontendServer.listen(0, '127.0.0.1', r));
    const frontendUrl = `http://127.0.0.1:${frontendServer.address().port}`;

    const stamp = `${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const adminEmail = `m275_audit_admin_${stamp}@example.com`;
    const userAEmail = `m275_audit_usera_${stamp}@example.com`;
    const userBEmail = `m275_audit_userb_${stamp}@example.com`;
    const pass = `AuditPass!${stamp}`;

    const createdUserIds = [];
    const createdBookIds = [];
    const createdAuthorIds = [];
    const createdCategoryIds = [];
    const createdPrivateIds = [];

    try {
        const jarAdmin = new CookieJar();
        const jarA = new CookieJar();
        const jarB = new CookieJar();

        for (const [idx, email] of [adminEmail, userAEmail, userBEmail].entries()) {
            const r = await apiFetch(apiUrl, 'POST', '/api/auth/register', {
                body: { fullName: `Audit Account ${idx}`, email, password: pass },
            });
            createdUserIds.push(r.json.data.user.user_id);
        }
        await pool.query(
            "UPDATE users SET role_id = (SELECT role_id FROM roles WHERE role_name = 'ADMIN' LIMIT 1) WHERE email = ?",
            [adminEmail]
        );
        await apiFetch(apiUrl, 'POST', '/api/auth/login', { jar: jarAdmin, body: { email: adminEmail, password: pass } });
        await apiFetch(apiUrl, 'POST', '/api/auth/login', { jar: jarA, body: { email: userAEmail, password: pass } });
        await apiFetch(apiUrl, 'POST', '/api/auth/login', { jar: jarB, body: { email: userBEmail, password: pass } });

        const userAId = createdUserIds[1];

        // -------------------------------------------------------------
        // PART B: 5 SYNTHETIC BOOKS COVER STORAGE & RETRIEVAL VERIFICATION
        // -------------------------------------------------------------
        console.log('\n--- Part B: 5 Synthetic Books Cover Verification ---');

        const authRes = await apiFetch(apiUrl, 'POST', '/api/authors', { jar: jarAdmin, body: { name: `Synthetic Author ${stamp}` } });
        const authorId = authRes.json.data.author.author_id;
        createdAuthorIds.push(authorId);

        // Book 1: PDF with 1x1 spacer + 80x120 embedded cover
        const b1Res = await apiFetch(apiUrl, 'POST', '/api/books', { jar: jarAdmin, body: { title: 'Synthetic PDF Cover Book 1', description: 'Embedded cover PDF' } });
        const b1Id = b1Res.json.data.book.book_id;
        createdBookIds.push(b1Id);
        const pdf1Buf = buildPdfWithSpacerAndCover();
        const fd1 = new FormData();
        fd1.append('format', 'PDF');
        fd1.append('file', new Blob([pdf1Buf], { type: 'application/pdf' }), 'book1.pdf');
        await apiFetch(apiUrl, 'POST', `/api/books/${b1Id}/pdf`, { jar: jarAdmin, formData: fd1 });
        await apiFetch(apiUrl, 'PATCH', `/api/books/${b1Id}/publish`, { jar: jarAdmin });

        const [b1Db] = await pool.query('SELECT cover_image, cover_path, pdf_stored_name FROM books WHERE book_id = ?', [b1Id]);
        const b1CoverFile = resolvePublicCoverPath(b1Db[0].cover_image);
        const b1CoverHttp = await apiFetch(apiUrl, 'GET', `/api/books/${b1Id}/cover`, { jar: jarA });
        const b1PngWidth = b1CoverHttp.buf.length >= 24 ? b1CoverHttp.buf.readUInt32BE(16) : 0;
        const b1PngHeight = b1CoverHttp.buf.length >= 24 ? b1CoverHttp.buf.readUInt32BE(20) : 0;
        assert('Book 1 (PDF embedded cover): skips 1x1 spacer, records cover_image & cover_path in DB, file exists on disk, HTTP 200 80x120 image/png',
            Boolean(b1Db[0].cover_image) &&
            b1Db[0].cover_path === `/api/books/${b1Id}/cover` &&
            fs.existsSync(b1CoverFile) &&
            b1CoverHttp.status === 200 &&
            b1CoverHttp.contentType.includes('image/png') &&
            b1PngWidth === 80 &&
            b1PngHeight === 120,
            { db: b1Db[0], dims: `${b1PngWidth}x${b1PngHeight}` });

        // Book 2: Legacy existing EPUB record (new EPUB upload via API rejected, existing EPUB reading/cover preserved)
        const b2Res = await apiFetch(apiUrl, 'POST', '/api/books', { jar: jarAdmin, body: { title: 'Legacy EPUB Cover Book 2', description: 'Preserved EPUB' } });
        const b2Id = b2Res.json.data.book.book_id;
        createdBookIds.push(b2Id);
        const epubBuf = buildSyntheticEpubWithCover();

        // Confirm public API rejects new EPUB upload
        const fd2 = new FormData();
        fd2.append('format', 'EPUB');
        fd2.append('file', new Blob([epubBuf], { type: 'application/epub+zip' }), 'book2.epub');
        const pubEpubReject = await apiFetch(apiUrl, 'POST', `/api/books/${b2Id}/pdf`, { jar: jarAdmin, formData: fd2 });
        assert('PDF-Only Upload: Public EPUB upload rejected (400)', pubEpubReject.status === 400, pubEpubReject.status);

        // Seed existing legacy EPUB book in DB + disk to confirm backward compatibility
        const legacyEpubStored = `legacy-epub-${Date.now()}.epub`;
        const legacyEpubPath = resolvePublicPdfPath(legacyEpubStored);
        await fsp.mkdir(path.dirname(legacyEpubPath), { recursive: true });
        await fsp.writeFile(legacyEpubPath, epubBuf);
        let legacyCoverName = null;
        const legacyDoc = await processEpubFile(legacyEpubPath, {
            bookId: b2Id,
            onCoverExtracted: async (buf) => {
                const saved = await saveExtractedCover(legacyEpubStored, buf, false);
                if (saved) legacyCoverName = saved.coverFileName;
            }
        });
        const legacyProcName = `${legacyEpubStored.replace('.epub', '')}.processed.json`;
        await fsp.writeFile(resolvePublicProcessedPath(legacyProcName), JSON.stringify(legacyDoc), 'utf8');
        await pool.query(
            `UPDATE books SET pdf_original_name = 'book2.epub', pdf_stored_name = ?, pdf_size = ?, file_format = 'EPUB', processed_content_path = ?, cover_image = ?, cover_path = ? WHERE book_id = ?`,
            [legacyEpubStored, epubBuf.length, legacyProcName, legacyCoverName, `/api/books/${b2Id}/cover`, b2Id]
        );
        await apiFetch(apiUrl, 'PATCH', `/api/books/${b2Id}/publish`, { jar: jarAdmin });

        const [b2Db] = await pool.query('SELECT cover_image, cover_path FROM books WHERE book_id = ?', [b2Id]);
        const b2CoverHttp = await apiFetch(apiUrl, 'GET', `/api/books/${b2Id}/cover`, { jar: jarA });
        const b2DocHttp = await apiFetch(apiUrl, 'GET', `/api/books/${b2Id}/document`, { jar: jarA });
        assert('Book 2 (Legacy EPUB preserved): cover & EPUB document still load cleanly (HTTP 200)',
            Boolean(b2Db[0].cover_image) &&
            fs.existsSync(resolvePublicCoverPath(b2Db[0].cover_image)) &&
            b2CoverHttp.status === 200 && b2CoverHttp.contentType.includes('image/png') &&
            b2DocHttp.status === 200 && b2DocHttp.json?.data?.document?.pages?.[0]?.text?.includes('EPUB body paragraph'),
            [b2Db[0], b2CoverHttp.status, b2DocHttp.status]);

        // Book 3: Uploaded custom cover where extension mismatches magic bytes (PNG bytes uploaded as .jpg)
        const b3Res = await apiFetch(apiUrl, 'POST', '/api/books', { jar: jarAdmin, body: { title: 'Synthetic Custom Cover Book 3' } });
        const b3Id = b3Res.json.data.book.book_id;
        createdBookIds.push(b3Id);
        const fd3 = new FormData();
        fd3.append('cover', new Blob([makeTinyPng()], { type: 'image/jpeg' }), 'mismatched.jpg');
        await apiFetch(apiUrl, 'POST', `/api/books/${b3Id}/cover`, { jar: jarAdmin, formData: fd3 });
        await apiFetch(apiUrl, 'PATCH', `/api/books/${b3Id}/publish`, { jar: jarAdmin });

        const [b3Db] = await pool.query('SELECT cover_image, cover_path FROM books WHERE book_id = ?', [b3Id]);
        const b3CoverHttp = await apiFetch(apiUrl, 'GET', `/api/books/${b3Id}/cover`, { jar: jarA });
        assert('Book 3 (Custom cover): normalizes physical filename extension to match actual PNG format (.png) & HTTP 200 image/png',
            b3Db[0].cover_image?.endsWith('.png') &&
            fs.existsSync(resolvePublicCoverPath(b3Db[0].cover_image)) &&
            b3CoverHttp.status === 200 &&
            b3CoverHttp.contentType.includes('image/png'),
            b3Db[0]);

        // Test updateBook preserves cover_path when blank & rejects OS path
        const editBlank = await apiFetch(apiUrl, 'PUT', `/api/books/${b3Id}`, {
            jar: jarAdmin,
            body: { title: 'Synthetic Custom Cover Book 3 Edited', coverPath: '' },
        });
        const editOsPath = await apiFetch(apiUrl, 'PUT', `/api/books/${b3Id}`, {
            jar: jarAdmin,
            body: { title: 'Bad Cover', coverPath: 'C:\\Users\\test\\cover.png' },
        });
        assert('updateBook preserves canonical cover_path when blank and rejects OS-specific absolute paths (400)',
            editBlank.status === 200 && editBlank.json?.data?.book?.cover_path === `/api/books/${b3Id}/cover` && editOsPath.status === 400,
            [editBlank.json?.data?.book?.cover_path, editOsPath.status]);

        // Book 4: Scanned PDF (no embedded images, no text) -> clean SVG fallback + Original PDF works
        const b4Res = await apiFetch(apiUrl, 'POST', '/api/books', { jar: jarAdmin, body: { title: 'Synthetic Scanned Book 4' } });
        const b4Id = b4Res.json.data.book.book_id;
        createdBookIds.push(b4Id);
        const scannedBuf = buildScannedPdf();
        const fd4 = new FormData();
        fd4.append('format', 'PDF');
        fd4.append('file', new Blob([scannedBuf], { type: 'application/pdf' }), 'scanned4.pdf');
        await apiFetch(apiUrl, 'POST', `/api/books/${b4Id}/pdf`, { jar: jarAdmin, formData: fd4 });
        await apiFetch(apiUrl, 'PATCH', `/api/books/${b4Id}/publish`, { jar: jarAdmin });

        const [b4Db] = await pool.query('SELECT cover_path FROM books WHERE book_id = ?', [b4Id]);
        const b4CoverHttp = await apiFetch(apiUrl, 'GET', `/api/books/${b4Id}/cover`, { jar: jarA });
        const b4Svg = b4CoverHttp.buf.toString('utf8');
        assert('Book 4 (Scanned PDF fallback): cover_path set, HTTP 200 SVG fallback with title',
            b4Db[0].cover_path === `/api/books/${b4Id}/cover` &&
            b4CoverHttp.status === 200 &&
            b4CoverHttp.contentType.includes('image/svg+xml') &&
            b4Svg.includes('Synthetic Scanned') &&
            b4Svg.includes('Book 4'),
            b4Db[0]);

        // Book 5: Chapter/text book with legacy timestamp in title & author -> sanitized SVG fallback
        const b5Res = await apiFetch(apiUrl, 'POST', '/api/books', { jar: jarAdmin, body: { title: `Synthetic Clean Title ${stamp}` } });
        const b5Id = b5Res.json.data.book.book_id;
        createdBookIds.push(b5Id);
        await apiFetch(apiUrl, 'POST', `/api/books/${b5Id}/authors`, { jar: jarAdmin, body: { authorId } });
        await apiFetch(apiUrl, 'PATCH', `/api/books/${b5Id}/publish`, { jar: jarAdmin });
        const b5CoverHttp = await apiFetch(apiUrl, 'GET', `/api/books/${b5Id}/cover`, { jar: jarA });
        const b5Svg = b5CoverHttp.buf.toString('utf8');
        assert('Book 5 (Fallback sanitization): strips epoch timestamp and shows author subtitle',
            b5CoverHttp.status === 200 &&
            b5Svg.includes('Synthetic Clean') &&
            b5Svg.includes('Title') &&
            !b5Svg.includes(stamp.split('_')[0]) &&
            b5Svg.includes('Synthetic Author'),
            b5Svg.slice(0, 500));

        // Private PDF cover persistence & isolation
        const fdPriv = new FormData();
        fdPriv.append('title', 'Private Embedded Cover');
        fdPriv.append('format', 'PDF');
        fdPriv.append('file', new Blob([pdf1Buf], { type: 'application/pdf' }), 'priv1.pdf');
        const privUp = await apiFetch(apiUrl, 'POST', '/api/private-library/upload', { jar: jarA, formData: fdPriv });
        const privId = privUp.json.data.privateFile.private_file_id;
        createdPrivateIds.push(privId);
        const [privDb] = await pool.query('SELECT cover_image, cover_path FROM private_library_files WHERE private_file_id = ?', [privId]);
        const privCoverA = await apiFetch(apiUrl, 'GET', `/api/private-library/${privId}/cover`, { jar: jarA });
        const privCoverAdmin = await apiFetch(apiUrl, 'GET', `/api/private-library/${privId}/cover`, { jar: jarAdmin });
        assert('Private upload records cover_image & cover_path in DB, file exists, owner gets 200 PNG, non-owner Admin gets 404',
            Boolean(privDb[0].cover_image) &&
            privDb[0].cover_path === `/api/private-library/${privId}/cover` &&
            fs.existsSync(resolvePrivateCoverPath(privDb[0].cover_image)) &&
            privCoverA.status === 200 && privCoverA.contentType.includes('image/png') &&
            privCoverAdmin.status === 404,
            { db: privDb[0], statusA: privCoverA.status, statusAdmin: privCoverAdmin.status });

        // -------------------------------------------------------------
        // PART C & D & G: ADMIN & USER PERSONAL LIBRARY SAVE / REMOVE
        // -------------------------------------------------------------
        console.log('\n--- Part C & D: Admin & User Personal Private Library ---');

        // Admin saves published Book 1 (even if sending spoofed userId in body!)
        const adminSave1 = await apiFetch(apiUrl, 'POST', `/api/private-library/saved/${b1Id}`, {
            jar: jarAdmin,
            body: { userId: userAId },
        });
        const adminSaveDup = await apiFetch(apiUrl, 'POST', `/api/private-library/saved/${b1Id}`, {
            jar: jarAdmin,
            body: {},
        });
        const userASave1 = await apiFetch(apiUrl, 'POST', `/api/private-library/saved/${b1Id}`, {
            jar: jarA,
            body: {},
        });

        const adminPrivList = await apiFetch(apiUrl, 'GET', '/api/private-library', { jar: jarAdmin });
        const userAPrivList = await apiFetch(apiUrl, 'GET', '/api/private-library', { jar: jarA });
        assert('Admin and User A both independently save published book; body userId spoofing ignored; duplicate save idempotent',
            adminSave1.status === 201 &&
            adminSaveDup.status === 200 && adminSaveDup.json?.data?.alreadySaved === true &&
            userASave1.status === 201 &&
            adminPrivList.json?.data?.savedBooks?.some((b) => b.book_id === b1Id) &&
            userAPrivList.json?.data?.savedBooks?.some((b) => b.book_id === b1Id) &&
            !userAPrivList.json?.data?.savedBooks?.some((b) => b.book_id !== b1Id),
            { adminCount: adminPrivList.json?.data?.savedBooks?.length, userACount: userAPrivList.json?.data?.savedBooks?.length });

        // User B cannot remove Admin's or User A's saved book
        const userBDel = await apiFetch(apiUrl, 'DELETE', `/api/private-library/saved/${b1Id}`, { jar: jarB });
        assert('User B cannot remove another account saved book (404)', userBDel.status === 404, userBDel.status);

        // Admin removes own saved book -> User A's save + original public book + PDF + cover stay 100% intact!
        const adminDel = await apiFetch(apiUrl, 'DELETE', `/api/private-library/saved/${b1Id}`, { jar: jarAdmin });
        const adminPrivAfter = await apiFetch(apiUrl, 'GET', '/api/private-library/saved', { jar: jarAdmin });
        const userAPrivAfter = await apiFetch(apiUrl, 'GET', '/api/private-library/saved', { jar: jarA });
        const pubBookCheck = await apiFetch(apiUrl, 'GET', `/api/books/${b1Id}`, { jar: jarA });
        const pubPdfCheck = await apiFetch(apiUrl, 'GET', `/api/books/${b1Id}/file`, { jar: jarA });
        assert('Admin removing saved book leaves User A save, original public book, PDF, and cover completely intact',
            adminDel.status === 200 &&
            adminPrivAfter.json?.data?.savedBooks?.length === 0 &&
            userAPrivAfter.json?.data?.savedBooks?.length === 1 &&
            pubBookCheck.status === 200 &&
            pubPdfCheck.status === 200 &&
            pubPdfCheck.buf.equals(pdf1Buf) &&
            fs.existsSync(b1CoverFile));

        // Clean up User A's save before Chrome test
        await apiFetch(apiUrl, 'DELETE', `/api/private-library/saved/${b1Id}`, { jar: jarA });

        // -------------------------------------------------------------
        // PART E3: PDF STREAMING HEADERS & BYTE-RANGE VERIFICATION
        // -------------------------------------------------------------
        console.log('\n--- Part E3: PDF Streaming Headers & Range Support ---');
        const rangeRes = await apiFetch(apiUrl, 'GET', `/api/books/${b1Id}/file`, {
            jar: jarA,
            headers: { Range: 'bytes=0-7' },
        });
        assert('Public PDF /file supports inline disposition, application/pdf, and byte-range 206 Partial Content',
            rangeRes.status === 206 &&
            rangeRes.contentType.includes('application/pdf') &&
            (rangeRes.headers.get('content-disposition') || '').startsWith('inline;') &&
            rangeRes.buf.toString('latin1') === '%PDF-1.4',
            { status: rangeRes.status, cd: rangeRes.headers.get('content-disposition'), body: rangeRes.buf.toString('latin1') });

        const privRangeRes = await apiFetch(apiUrl, 'GET', `/api/private-library/${privId}/file`, {
            jar: jarA,
            headers: { Range: 'bytes=0-7' },
        });
        assert('Private PDF /file supports inline disposition, application/pdf, and byte-range 206 Partial Content',
            privRangeRes.status === 206 &&
            privRangeRes.contentType.includes('application/pdf') &&
            (privRangeRes.headers.get('content-disposition') || '').startsWith('inline;') &&
            privRangeRes.buf.toString('latin1') === '%PDF-1.4',
            privRangeRes.status);

        // -------------------------------------------------------------
        // PART PDF-ONLY: UPLOAD FORMAT RESTRICTION & SPOOF REJECTION
        // -------------------------------------------------------------
        console.log('\n--- PDF-Only Upload Validation (Public, Private User, Private Admin, Spoofed) ---');

        // 1. Admin private PDF upload accepted
        const adminPrivFd = new FormData();
        adminPrivFd.append('title', 'Admin Private PDF');
        adminPrivFd.append('format', 'PDF');
        adminPrivFd.append('file', new Blob([pdf1Buf], { type: 'application/pdf' }), 'admin-priv.pdf');
        const adminPrivUp = await apiFetch(apiUrl, 'POST', '/api/private-library/upload', { jar: jarAdmin, formData: adminPrivFd });
        if (adminPrivUp.json?.data?.privateFile?.private_file_id) {
            createdPrivateIds.push(adminPrivUp.json.data.privateFile.private_file_id);
        }
        assert('PDF-Only Upload: Admin private PDF upload accepted (201)', adminPrivUp.status === 201, adminPrivUp.status);

        // 2. Private EPUB upload (User & Admin) rejected
        const userEpubFd = new FormData();
        userEpubFd.append('title', 'User EPUB');
        userEpubFd.append('format', 'EPUB');
        userEpubFd.append('file', new Blob([epubBuf], { type: 'application/epub+zip' }), 'user.epub');
        const userEpubRes = await apiFetch(apiUrl, 'POST', '/api/private-library/upload', { jar: jarA, formData: userEpubFd });

        const adminEpubFd = new FormData();
        adminEpubFd.append('title', 'Admin EPUB');
        adminEpubFd.append('format', 'EPUB');
        adminEpubFd.append('file', new Blob([epubBuf], { type: 'application/epub+zip' }), 'admin.epub');
        const adminEpubRes = await apiFetch(apiUrl, 'POST', '/api/private-library/upload', { jar: jarAdmin, formData: adminEpubFd });
        assert('PDF-Only Upload: Private EPUB uploads rejected for User & Admin (400)',
            userEpubRes.status === 400 && adminEpubRes.status === 400, [userEpubRes.status, adminEpubRes.status]);

        // 3. Direct API bypass attempts: valid PDF file sent with format=EPUB, ZIP/DOCX/TXT renamed to .pdf
        const pdfWithEpubFormatFd = new FormData();
        pdfWithEpubFormatFd.append('format', 'EPUB');
        pdfWithEpubFormatFd.append('file', new Blob([pdf1Buf], { type: 'application/pdf' }), 'valid.pdf');
        const pubBypassRes = await apiFetch(apiUrl, 'POST', `/api/books/${b1Id}/pdf`, { jar: jarAdmin, formData: pdfWithEpubFormatFd });

        const privBypassFd = new FormData();
        privBypassFd.append('format', 'EPUB');
        privBypassFd.append('file', new Blob([pdf1Buf], { type: 'application/pdf' }), 'valid.pdf');
        const privBypassRes = await apiFetch(apiUrl, 'POST', '/api/private-library/upload', { jar: jarA, formData: privBypassFd });
        assert('PDF-Only Upload: Direct API request with format=EPUB rejected on public & private endpoints (400)',
            pubBypassRes.status === 400 && privBypassRes.status === 400, [pubBypassRes.status, privBypassRes.status]);

        // 4. Renamed non-PDF files (ZIP/EPUB, DOCX/OLE, TXT, fake %PDF- without %%EOF)
        const renamedZipFd = new FormData();
        renamedZipFd.append('file', new Blob([epubBuf], { type: 'application/pdf' }), 'renamed-zip.pdf');
        const renamedZipRes = await apiFetch(apiUrl, 'POST', '/api/private-library/upload', { jar: jarA, formData: renamedZipFd });

        const renamedTxtFd = new FormData();
        renamedTxtFd.append('file', new Blob([Buffer.from('Plain text pretending to be PDF')], { type: 'application/pdf' }), 'fake.pdf');
        const renamedTxtRes = await apiFetch(apiUrl, 'POST', `/api/books/${b4Id}/pdf`, { jar: jarAdmin, formData: renamedTxtFd });

        const docUploadFd = new FormData();
        docUploadFd.append('file', new Blob([Buffer.from('D0CF11E0A1B11AE1', 'hex')], { type: 'application/msword' }), 'doc.doc');
        const docUploadRes = await apiFetch(apiUrl, 'POST', '/api/private-library/upload', { jar: jarA, formData: docUploadFd });

        const fakeHeaderNoEofFd = new FormData();
        fakeHeaderNoEofFd.append('file', new Blob([Buffer.from('%PDF-1.4\nnot a real pdf trailer')], { type: 'application/pdf' }), 'bad-eof.pdf');
        const fakeHeaderRes = await apiFetch(apiUrl, 'POST', '/api/private-library/upload', { jar: jarA, formData: fakeHeaderNoEofFd });

        assert('PDF-Only Upload: Renamed ZIP, renamed TXT, .doc, and truncated %PDF- without %%EOF all rejected (400)',
            renamedZipRes.status === 400 && renamedTxtRes.status === 400 && docUploadRes.status === 400 && fakeHeaderRes.status === 400,
            [renamedZipRes.status, renamedTxtRes.status, docUploadRes.status, fakeHeaderRes.status]);

        // -------------------------------------------------------------
        // PART F & H: HEADLESS CHROME E2E VERIFICATION
        // -------------------------------------------------------------
        // -------------------------------------------------------------
        // PART ADMIN-FILTERING: BACKEND FILTER/SORT/SEARCH/AUTH VERIFICATION
        // -------------------------------------------------------------
        console.log('\n--- Part Admin Filtering: Categories, Statuses, Search, Sort & Security ---');
        const cat1Res = await apiFetch(apiUrl, 'POST', '/api/categories', { jar: jarAdmin, body: { name: `AuditCatAlpha ${stamp}` } });
        const cat2Res = await apiFetch(apiUrl, 'POST', '/api/categories', { jar: jarAdmin, body: { name: `AuditCatBeta ${stamp}` } });
        const cat1Id = cat1Res.json.data.category.category_id;
        const cat2Id = cat2Res.json.data.category.category_id;
        createdCategoryIds.push(cat1Id, cat2Id);

        const draftFilterBookRes = await apiFetch(apiUrl, 'POST', '/api/books', {
            jar: jarAdmin,
            body: { title: 'Synthetic Draft Filterable Book', description: 'Admin draft filter target', publicationDate: '2024-02-01' },
        });
        const draftFilterBookId = draftFilterBookRes.json.data.book.book_id;
        createdBookIds.push(draftFilterBookId);
        await apiFetch(apiUrl, 'POST', `/api/books/${draftFilterBookId}/categories`, { jar: jarAdmin, body: { categoryId: cat1Id } });
        await apiFetch(apiUrl, 'POST', `/api/books/${draftFilterBookId}/authors`, { jar: jarAdmin, body: { authorId } });
        await apiFetch(apiUrl, 'POST', `/api/books/${b1Id}/categories`, { jar: jarAdmin, body: { categoryId: cat1Id } });
        await apiFetch(apiUrl, 'POST', `/api/books/${b4Id}/categories`, { jar: jarAdmin, body: { categoryId: cat2Id } });

        // Normal user blocked from admin filtering endpoint (403) & unauthenticated blocked (401)
        const unauthManage = await apiFetch(apiUrl, 'GET', '/api/books/manage');
        const userManage = await apiFetch(apiUrl, 'GET', '/api/books/manage', { jar: jarA });
        assert('Admin Filtering Security: unauthenticated gets 401 and normal USER gets 403 on GET /api/books/manage',
            unauthManage.status === 401 && userManage.status === 403, [unauthManage.status, userManage.status]);

        // Normal user cannot bypass visibility via GET /api/books?status=DRAFT
        const userTryDraft = await apiFetch(apiUrl, 'GET', '/api/books?status=DRAFT', { jar: jarA });
        const userSeesDraft = (userTryDraft.json?.data?.books || []).some((b) => b.book_id === draftFilterBookId || b.status !== 'PUBLISHED');
        assert('Public Filtering Security: USER sending ?status=DRAFT still only sees PUBLISHED books',
            userTryDraft.status === 200 && !userSeesDraft, userTryDraft.status);

        // Invalid category & status rejected with 400; SQLi sort & search safely parameterized
        const badCat = await apiFetch(apiUrl, 'GET', '/api/books/manage?category=abc', { jar: jarAdmin });
        const badStatus = await apiFetch(apiUrl, 'GET', '/api/books/manage?status=HACKED', { jar: jarAdmin });
        const sqliAdminSearch = await apiFetch(apiUrl, 'GET', '/api/books/manage?search=%27%20OR%201%3D1--', { jar: jarAdmin });
        assert('Admin Filtering Validation: rejects invalid category/status with 400 and safely parameterizes SQLi search (200, 0 matches)',
            badCat.status === 400 && badStatus.status === 400 && sqliAdminSearch.status === 200 && sqliAdminSearch.json.data.meta.totalItems === 0,
            [badCat.status, badStatus.status, sqliAdminSearch.status, sqliAdminSearch.json?.data?.meta?.totalItems]);

        // Combined filtering: category + status=DRAFT + search by author + sort title ASC
        const adminCombo = await apiFetch(apiUrl, 'GET', `/api/books/manage?category=${cat1Id}&status=DRAFT&search=Synthetic%20Author&sort=title&order=ASC`, { jar: jarAdmin });
        const adminCat1All = await apiFetch(apiUrl, 'GET', `/api/books/manage?category=${cat1Id}`, { jar: jarAdmin });
        const adminAll = await apiFetch(apiUrl, 'GET', '/api/books/manage?limit=50', { jar: jarAdmin });
        assert('Admin Filtering Functionality: returns all statuses, filters by category+status+author search, and reports accurate meta.totalItems',
            adminCombo.status === 200 &&
            adminCombo.json.data.meta.totalItems === 1 &&
            adminCombo.json.data.books[0].book_id === draftFilterBookId &&
            adminCat1All.json.data.meta.totalItems === 2 &&
            adminAll.json.data.meta.totalItems >= 6 &&
            adminAll.json.data.books.some((b) => b.book_id === draftFilterBookId) &&
            adminAll.json.data.books.some((b) => b.book_id === b1Id),
            { combo: adminCombo.json?.data?.meta, cat1: adminCat1All.json?.data?.meta, all: adminAll.json?.data?.meta });

        console.log('\n--- Part F & H: Headless Chrome UI E2E Verification ---');
        await runChromeChecks({
            apiUrl,
            frontendUrl,
            adminCreds: { email: adminEmail, password: pass },
            userCreds: { email: userAEmail, password: pass },
            bookIds: { pdfWithCover: b1Id, epubBook: b2Id, scannedPdf: b4Id, privatePdfId: privId },
        });

    } finally {
        for (const id of createdPrivateIds) {
            const [rows] = await pool.query('SELECT stored_file_name, cover_image FROM private_library_files WHERE private_file_id = ?', [id]);
            if (rows[0]?.stored_file_name) {
                const s = rows[0].stored_file_name;
                await deleteFileIfExists(resolvePrivatePdfPath(s)).catch(() => {});
                await deleteFileIfExists(resolvePrivateProcessedPath(buildPrivateProcessedName(s))).catch(() => {});
                await deleteDirectoryIfExists(resolvePrivateImagesDir(buildPrivateImagesDirName(s))).catch(() => {});
                for (const ext of COVER_EXTENSIONS) {
                    await deleteFileIfExists(resolvePrivateCoverPath(buildCoverFileName(s, ext))).catch(() => {});
                }
            }
            if (rows[0]?.cover_image) {
                await deleteFileIfExists(resolvePrivateCoverPath(rows[0].cover_image)).catch(() => {});
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
        if (createdCategoryIds.length) await pool.query('DELETE FROM categories WHERE category_id IN (?)', [createdCategoryIds]).catch(() => {});
        if (createdAuthorIds.length) await pool.query('DELETE FROM authors WHERE author_id IN (?)', [createdAuthorIds]).catch(() => {});
        if (createdUserIds.length) {
            await pool.query('DELETE FROM auth_events WHERE user_id IN (?)', [createdUserIds]).catch(() => {});
            await pool.query('DELETE FROM users WHERE user_id IN (?)', [createdUserIds]).catch(() => {});
        }

        await new Promise((r) => apiServer.close(r));
        await new Promise((r) => frontendServer.close(r));
        await pool.end();
    }

    console.log(`\n=== Module 27.5 Comprehensive Audit Complete: ${passed} passed, ${failed} failed ===`);
    if (failed > 0) process.exitCode = 1;
}

run().catch((err) => {
    console.error('[FATAL]', err);
    process.exitCode = 1;
});
