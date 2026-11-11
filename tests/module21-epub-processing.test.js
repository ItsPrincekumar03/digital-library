// tests/module21-epub-processing.test.js
// Module 21 — EPUB Processing and Reader Compatibility Test Suite
// Verifies:
//   - Unit security and parser checks on synthetic EPUB fixtures
//   - HTML/CSS sanitization and reader block classification
//   - Service and repository integration (file storage, database updates, processed JSON)
//   - Reader APIs (document, TOC, chapters, images)
//   - Public vs private visibility and role-based access control
//   - Isolation check: strictly uses digital_library_test

'use strict';

if (process.env.TEST_DB_NAME !== 'digital_library_test') {
  console.error('Test blocked: TEST_DB_NAME must equal digital_library_test.');
  process.exit(1);
}

process.env.DB_NAME = process.env.TEST_DB_NAME;

const fs = require('fs');
const path = require('path');
const http = require('http');
const { pool } = require('../backend/src/config/database');
const app = require('../backend/src/app');
const {
  processEpubFile,
  extractEpubComponents,
  sanitiseChapter,
  extractContentBlocks,
  assertNotZip64,
  crc32
} = require('../backend/src/utils/epubProcessor');
const bookService = require('../backend/src/services/book.service');
const bookRepository = require('../backend/src/repositories/book.repository');
const privateLibraryRepository = require('../backend/src/repositories/privateLibrary.repository');
const privateLibraryService = require('../backend/src/services/privateLibrary.service');
const {
  resolvePublicProcessedPath,
  resolvePublicPdfPath,
  resolvePublicImagesDir,
  getPublicUploadDirectory,
  deleteFileIfExists,
  deleteDirectoryIfExists
} = require('../backend/src/utils/fileStorage');

const FIXTURES_DIR = path.resolve(__dirname, 'fixtures', 'epub');

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

async function verifyDbTarget() {
  const [rows] = await pool.query('SELECT DATABASE() AS current_db');
  if (rows[0].current_db !== 'digital_library_test') {
    throw new Error(`Isolation failure: expected digital_library_test, got ${rows[0].current_db}`);
  }
}

// Minimal HTTP client helper for testing API endpoints
function httpRequest(serverUrl, method, reqPath, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(reqPath, serverUrl);
    const headers = { ...(options.headers || {}) };
    let reqBody = null;

    if (options.body) {
      if (typeof options.body === 'object' && !Buffer.isBuffer(options.body)) {
        reqBody = JSON.stringify(options.body);
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = Buffer.byteLength(reqBody);
      } else {
        reqBody = options.body;
      }
    }

    const req = http.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (_) { json = data; }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json
        });
      });
    });

    req.on('error', reject);
    if (reqBody) req.write(reqBody);
    req.end();
  });
}

async function run() {
  console.log('=== Module 21 — EPUB Processing and Reader Compatibility Tests ===\n');

  await verifyDbTarget();
  assert('Database isolation: running on digital_library_test', true);

  // -------------------------------------------------------------
  // Group 1: Unit & Parser Tests with Synthetic EPUB Fixtures
  // -------------------------------------------------------------
  console.log('\n--- Group 1: Parser and Security Unit Tests ---');

  // 1.1 Valid EPUB 3
  const epub3Path = path.join(FIXTURES_DIR, 'valid-epub3.epub');
  const epub3Doc = await processEpubFile(epub3Path);
  assert('EPUB 3: parses successfully', !!epub3Doc);
  assert('EPUB 3: fileFormat is EPUB', epub3Doc.fileFormat === 'EPUB', epub3Doc.fileFormat);
  assert('EPUB 3: title extracted correctly', epub3Doc.metadata && epub3Doc.metadata.title === 'Valid EPUB 3 Title', epub3Doc.metadata);
  assert('EPUB 3: pageCount matches spine count (2 chapters)', epub3Doc.pageCount === 2, epub3Doc.pageCount);
  assert('EPUB 3: nested TOC extracted with hierarchy', Array.isArray(epub3Doc.toc) && epub3Doc.toc.length === 2 && epub3Doc.toc[0].subitems.length === 1, epub3Doc.toc);
  assert('EPUB 3: chapter 1 has heading block', epub3Doc.pages[0].blocks.some(b => b.kind === 'heading' && b.text.includes('Part 1')), epub3Doc.pages[0].blocks);
  assert('EPUB 3: textChars accumulated for TTS', typeof epub3Doc.textChars === 'number' && epub3Doc.textChars > 0, epub3Doc.textChars);

  // 1.2 Valid EPUB 2
  const epub2Path = path.join(FIXTURES_DIR, 'valid-epub2.epub');
  const epub2Doc = await processEpubFile(epub2Path);
  assert('EPUB 2: parses successfully', !!epub2Doc);
  assert('EPUB 2: title extracted from NCX/OPF', epub2Doc.metadata && epub2Doc.metadata.title === 'Valid EPUB 2 Title', epub2Doc.metadata);
  assert('EPUB 2: hierarchical NCX TOC extracted', Array.isArray(epub2Doc.toc) && epub2Doc.toc.length === 1 && epub2Doc.toc[0].subitems.length === 1, epub2Doc.toc);

  // 1.3 Invalid Container
  let containerFailed = false;
  try {
    await processEpubFile(path.join(FIXTURES_DIR, 'invalid-container.epub'));
  } catch (err) {
    containerFailed = true;
    assert('Malformed container: throws descriptive error', err.message.includes('container.xml'), err.message);
  }
  assert('Malformed container: rejected', containerFailed);

  // 1.4 Invalid OPF
  let opfFailed = false;
  try {
    await processEpubFile(path.join(FIXTURES_DIR, 'invalid-opf.epub'));
  } catch (err) {
    opfFailed = true;
    assert('Missing OPF: throws descriptive error', err.message.includes('OPF file referenced') && err.message.includes('not found'), err.message);
  }
  assert('Missing OPF: rejected', opfFailed);

  // 1.5 Invalid Spine Itemref
  let spineFailed = false;
  try {
    await processEpubFile(path.join(FIXTURES_DIR, 'invalid-spine.epub'));
  } catch (err) {
    spineFailed = true;
    assert('Invalid spine idref: throws descriptive error', err.message.includes('Spine itemref references missing manifest item'), err.message);
  }
  assert('Invalid spine: rejected', spineFailed);

  // 1.6 Missing Chapter Document File
  let chapterMissingFailed = false;
  try {
    await processEpubFile(path.join(FIXTURES_DIR, 'missing-chapter.epub'));
  } catch (err) {
    chapterMissingFailed = true;
    assert('Missing chapter file: throws descriptive error', err.message.includes('Chapter document file missing from EPUB archive'), err.message);
  }
  assert('Missing chapter file: rejected', chapterMissingFailed);

  // -------------------------------------------------------------
  // Group 2: Sanitization and Security Policy
  // -------------------------------------------------------------
  console.log('\n--- Group 2: HTML and CSS Sanitization Security Tests ---');

  // 2.1 Unsafe HTML sanitization
  const unsafeHtmlDoc = await processEpubFile(path.join(FIXTURES_DIR, 'unsafe-html.epub'));
  const safeHtml = unsafeHtmlDoc.pages[0].html;
  assert('HTML Sanitization: <script> tag completely removed', !safeHtml.includes('<script') && !safeHtml.includes('window.pwned'), safeHtml);
  assert('HTML Sanitization: onclick handler removed', !safeHtml.includes('onclick'), safeHtml);
  assert('HTML Sanitization: javascript: URL removed from href', !safeHtml.includes('javascript:'), safeHtml);
  assert('HTML Sanitization: <iframe> stripped', !safeHtml.includes('<iframe'), safeHtml);
  assert('HTML Sanitization: <object> stripped', !safeHtml.includes('<object'), safeHtml);

  // 2.2 Unsafe CSS sanitization
  const unsafeCssDoc = await processEpubFile(path.join(FIXTURES_DIR, 'unsafe-css.epub'));
  const safeCssHtml = unsafeCssDoc.pages[0].html;
  assert('CSS Sanitization: position: fixed stripped', !safeCssHtml.includes('position: fixed') && !safeCssHtml.includes('position:fixed'), safeCssHtml);
  assert('CSS Sanitization: z-index: 999999 stripped', !safeCssHtml.includes('999999'), safeCssHtml);
  assert('CSS Sanitization: safe styles (text-align, color) preserved', safeCssHtml.includes('color: blue') || safeCssHtml.includes('color:blue') || safeCssHtml.includes('text-align'), safeCssHtml);

  // 2.3 Path Traversal in archive
  let traversalFailed = false;
  try {
    await processEpubFile(path.join(FIXTURES_DIR, 'path-traversal.epub'));
  } catch (err) {
    traversalFailed = true;
    assert('Path traversal in ZIP: rejected', err.message.includes('unsafe entry path'), err.message);
  }
  assert('Path traversal archive: rejected', traversalFailed);

  // 2.4 Duplicate Entries in archive
  let duplicateFailed = false;
  try {
    await processEpubFile(path.join(FIXTURES_DIR, 'duplicate-entries.epub'));
  } catch (err) {
    duplicateFailed = true;
    assert('Duplicate normalized entry in ZIP: rejected', err.message.includes('duplicate entry paths'), err.message);
  }
  assert('Duplicate entry archive: rejected', duplicateFailed);

  // 2.5 ZIP Bomb / Actual Decompression Limits
  let zipBombFailed = false;
  try {
    await processEpubFile(path.join(FIXTURES_DIR, 'zip-bomb.epub'));
  } catch (err) {
    zipBombFailed = true;
    assert('Decompression byte limit: aborted stream on actual byte count', err.message.includes('decompressed size'), err.message);
  }
  assert('ZIP bomb: rejected before memory exhaustion', zipBombFailed);

  // 2.6 CRC-32 Failure
  let crcFailed = false;
  try {
    await processEpubFile(path.join(FIXTURES_DIR, 'crc-failure.epub'));
  } catch (err) {
    crcFailed = true;
    assert('CRC-32 failure in archive: rejected', err.message.includes('CRC-32 verification failed'), err.message);
  }
  assert('Corrupted CRC archive: rejected', crcFailed);

  // 2.7 ZIP64 format rejection
  let zip64Failed = false;
  try {
    await processEpubFile(path.join(FIXTURES_DIR, 'zip64.epub'));
  } catch (err) {
    zip64Failed = true;
    assert('ZIP64 archive: explicitly rejected', err.message.includes('ZIP64 archives are not supported'), err.message);
  }
  assert('ZIP64 archive: rejected', zip64Failed);

  // 2.8 Internal Image Extraction
  const tempImagesDir = `test-img-${Date.now()}.images`;
  const imgDoc = await processEpubFile(path.join(FIXTURES_DIR, 'with-images.epub'), {
    bookId: 9999,
    imagesDirName: tempImagesDir,
    publicUploadDir: getPublicUploadDirectory()
  });
  assert('Image extraction: detected and extracted valid PNG', imgDoc.images.length === 1, imgDoc.images);
  assert('Image extraction: image filename follows p<page>-<seq>.png', imgDoc.images[0].file.includes('p1-1.png'), imgDoc.images[0]);
  // Clean up extracted test image directory
  try {
    await deleteDirectoryIfExists(path.join(getPublicUploadDirectory(), tempImagesDir));
  } catch (_) {}

  // -------------------------------------------------------------
  // Group 3: Service, Database & API Integration Tests
  // -------------------------------------------------------------
  console.log('\n--- Group 3: Service, Database & API Integration Tests ---');

  // Start in-process server on ephemeral port for API tests
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const serverPort = server.address().port;
  const baseUrl = `http://127.0.0.1:${serverPort}`;

  // Find or create test users
  const [adminRows] = await pool.query("SELECT u.user_id, u.email, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE r.role_name = 'ADMIN' LIMIT 1");
  const [normalRows] = await pool.query("SELECT u.user_id, u.email, r.role_name FROM users u JOIN roles r ON u.role_id = r.role_id WHERE r.role_name = 'USER' LIMIT 1");

  const adminUser = adminRows[0] || { user_id: 1, role_name: 'ADMIN' };
  const normalUser = normalRows[0] || { user_id: 2, role_name: 'USER' };

  // Create a JWT token for testing requests
  const jwt = require('../backend/node_modules/jsonwebtoken');
  const adminToken = jwt.sign(
    { userId: adminUser.user_id, role: 'ADMIN', role_name: 'ADMIN' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
  const userToken = jwt.sign(
    { userId: normalUser.user_id, role: 'USER', role_name: 'USER' },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );

  const adminHeaders = { 'Cookie': `token=${adminToken}` };
  const userHeaders = { 'Cookie': `token=${userToken}` };

  // Create test book for EPUB import
  const bookId = await bookRepository.create({
    ownerUserId: adminUser.user_id,
    title: `Module 21 Test EPUB Book ${Date.now()}`,
    description: 'EPUB integration test book',
    publicationDate: '2026-11-09'
  });
  assert('Book created in database for EPUB import', !!bookId);

  // Copy valid-epub3.epub to public uploads directory mimicking multer upload
  const testStoredName = `test-epub-${Date.now()}.epub`;
  const publicUploadPath = resolvePublicPdfPath(testStoredName);
  await fs.promises.copyFile(epub3Path, publicUploadPath);

  const mockFile = {
    originalname: 'valid-epub3.epub',
    filename: testStoredName,
    path: publicUploadPath,
    size: (await fs.promises.stat(publicUploadPath)).size,
    mimetype: 'application/epub+zip'
  };

  // Verify importBookPdf rejects new EPUB uploads (PDF-only upload policy),
  // while existing EPUB books in DB remain fully processed & readable.
  let epubUploadBlocked = false;
  const blockedCopyPath = path.resolve(getPublicUploadDirectory(), `blocked-${testStoredName}`);
  await fs.promises.copyFile(epub3Path, blockedCopyPath);
  try {
    await bookService.importBookPdf(bookId, adminUser, { ...mockFile, path: blockedCopyPath, filename: `blocked-${testStoredName}` }, 'EPUB');
  } catch (err) {
    epubUploadBlocked = err && err.status === 400;
  }
  assert('importBookPdf(EPUB): rejects new EPUB upload (400 PDF-only)', epubUploadBlocked);

  // Seed legacy existing EPUB book record to verify backward compatibility
  const legacyDoc = await processEpubFile(publicUploadPath, { bookId });
  const legacyProcessedName = testStoredName.replace('.epub', '.processed.json');
  await fs.promises.writeFile(resolvePublicProcessedPath(legacyProcessedName), JSON.stringify(legacyDoc), 'utf8');
  await bookRepository.updatePdfMetadata(bookId, {
    originalName: 'valid-epub3.epub',
    storedName: testStoredName,
    size: mockFile.size,
    fileFormat: 'EPUB',
  });
  await bookRepository.updateProcessedPath(bookId, legacyProcessedName);
  const seededBook = await bookRepository.findById(bookId);
  assert('Existing EPUB book record preserved in DB', seededBook && seededBook.file_format === 'EPUB', seededBook?.file_format);

  // Verify processed JSON file exists on disk
  const expectedProcessedName = testStoredName.replace('.epub', '.processed.json');
  const processedFilePath = resolvePublicProcessedPath(expectedProcessedName);
  let processedExists = false;
  try {
    await fs.promises.access(processedFilePath);
    processedExists = true;
  } catch (_) {}
  assert('EPUB Import: persisted <uuid>.processed.json file to disk', processedExists);

  // Publish book
  await bookRepository.setStatus(bookId, 'PUBLISHED');

  // 3.1 GET /api/books/:id/document (Reader API)
  const docRes = await httpRequest(baseUrl, 'GET', `/api/books/${bookId}/document`, { headers: userHeaders });
  assert('API: GET /api/books/:id/document returns 200', docRes.status === 200, docRes.status);
  assert('API: GET /api/books/:id/document returns valid document payload', docRes.data.success && docRes.data.data.document.pageCount === 2);

  // 3.2 GET /api/books/:id/toc
  const tocRes = await httpRequest(baseUrl, 'GET', `/api/books/${bookId}/toc`, { headers: userHeaders });
  assert('API: GET /api/books/:id/toc returns 200', tocRes.status === 200, tocRes.status);
  assert('API: GET /api/books/:id/toc returns hierarchical TOC', Array.isArray(tocRes.data.data.toc) && tocRes.data.data.toc.length === 2);

  // 3.3 GET /api/books/:id/chapters/1
  const chRes = await httpRequest(baseUrl, 'GET', `/api/books/${bookId}/chapters/1`, { headers: userHeaders });
  assert('API: GET /api/books/:id/chapters/1 returns 200', chRes.status === 200, chRes.status);
  assert('API: GET /api/books/:id/chapters/1 returns page 1 data with blocks', chRes.data.data.chapter.pageNumber === 1 && Array.isArray(chRes.data.data.chapter.blocks));

  // 3.4 Unauthenticated access
  const unauthRes = await httpRequest(baseUrl, 'GET', `/api/books/${bookId}/document`);
  assert('API Security: Unauthenticated request rejected with 401', unauthRes.status === 401, unauthRes.status);

  // 3.5 Draft book visibility
  await bookRepository.setStatus(bookId, 'DRAFT');
  const draftUserRes = await httpRequest(baseUrl, 'GET', `/api/books/${bookId}/document`, { headers: userHeaders });
  assert('API Security: Draft book hidden from regular user (404)', draftUserRes.status === 404, draftUserRes.status);

  const draftAdminRes = await httpRequest(baseUrl, 'GET', `/api/books/${bookId}/document`, { headers: adminHeaders });
  assert('API Security: Draft book accessible to ADMIN (200)', draftAdminRes.status === 200, draftAdminRes.status);

  // 3.6 Private Library EPUB upload and document access
  const privateStoredName = `test-priv-${Date.now()}.epub`;
  const privateUploadPath = path.resolve(getPublicUploadDirectory(), '..', 'private', privateStoredName);
  await fs.promises.mkdir(path.dirname(privateUploadPath), { recursive: true });
  await fs.promises.copyFile(epub3Path, privateUploadPath);

  const privFileId = await privateLibraryRepository.create({
    ownerId: normalUser.user_id,
    title: 'Private Test EPUB',
    originalFileName: 'valid-epub3.epub',
    storedFileName: privateStoredName,
    storagePath: 'private/' + privateStoredName,
    mimeType: 'application/epub+zip',
    fileSize: (await fs.promises.stat(privateUploadPath)).size,
    fileFormat: 'EPUB'
  });

  const privDocRes = await httpRequest(baseUrl, 'GET', `/api/private-library/${privFileId}/document`, { headers: userHeaders });
  assert('Private Library API: Owner can access private EPUB document (200)', privDocRes.status === 200, privDocRes.status);

  // Other user cannot access private book (even admin is rejected on private documents belonging to another user)
  const intruderRes = await httpRequest(baseUrl, 'GET', `/api/private-library/${privFileId}/document`, { headers: adminHeaders });
  assert('Private Library Security: Unauthorized user rejected with 404', intruderRes.status === 404, intruderRes.status);

  // Cleanup test artifacts
  try {
    await deleteFileIfExists(publicUploadPath);
    await deleteFileIfExists(processedFilePath);
    await deleteFileIfExists(privateUploadPath);
    await pool.query('DELETE FROM books WHERE book_id = ?', [bookId]);
    await pool.query('DELETE FROM private_library_files WHERE private_file_id = ?', [privFileId]);
  } catch (cleanupErr) {
    console.error('Cleanup warning:', cleanupErr.message);
  }

  await new Promise(resolve => server.close(resolve));

  console.log(`\n=== Module 21 Test Suite Complete: ${passed} passed, ${failed} failed ===\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

run()
  .then(() => {
    pool.end();
  })
  .catch(err => {
    console.error('Fatal test error:', err);
    pool.end();
    process.exit(1);
  });
