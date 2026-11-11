# Module 27.5 — Book Cover Storage & Display Fix, User/Admin Personal Library, and Simple Embedded PDF Reader

**Project:** Digital Library  
**Repository:** `https://github.com/ItsPrincekumar03/digital-library`  
**Module Number:** 27.5  
**Priority:** Critical  
**Branch:** `module-27.5`  
**Base Commit:** `ab5f90886328eea2a30e3c3ce21dfde2ff0ea768`  
**Final Status:** **COMPLETE** *(Working tree uncommitted per instructions; no commit, push, merge, or PR executed)*

---

## 1. Executive Summary

Module 27.5 investigated and resolved the remaining root causes behind broken/inconsistent book cover storage and rendering, completed personal private library save/remove workflows for both normal users and administrators across all catalog/admin/detail/private views, and simplified Original PDF reading mode so that it displays only the embedded original PDF with clean PDF controls and zero EPUB/TTS/theme/chapter chrome.

All existing architecture (HTML5, CSS3, Vanilla JavaScript, Node.js, Express.js, MySQL 8.x), EPUB-style reading, TTS (`0.5×–3×` speed & pitch), themes, typography, chapter navigation, private uploads, and security protections were preserved without adding external frameworks or microservices.

---

## 2. Git Baseline

- **Current branch:** `module-27.5`
- **Current commit:** `ab5f90886328eea2a30e3c3ce21dfde2ff0ea768` (`feat(module-27): close open security findings and add security regression suite`)
- **Initial working tree before corrections:** Contained prior Module 27.5 uncommitted changes across backend, database, frontend, docs, and tests; all existing work was preserved without destructive Git commands.

---

## 3. Book Cover Root Cause

Root-cause investigation identified six concrete defects in the previous cover implementation:

1. **Extracted covers were not recorded in the database:** `importBookPdf` in [`backend/src/services/book.service.js`](file:///c:/Myproject/digital-library/backend/src/services/book.service.js) wrote `<uuid>.cover.<ext>` to disk via `saveExtractedCover`, but left `books.cover_image` as `NULL` and only recognized `cover-<uuid>.<ext>` in `MANAGED_COVER_NAME_PATTERN`.
2. **Tiny 1×1 / decorative PDF images selected as covers:** Selecting `documentImages[0]` blindly allowed 1×1 spacer/mask images to be saved instead of actual cover artwork.
3. **Uploaded cover extension mismatch:** `uploadBookCover` relied on Multer's filename extension without normalizing it to match magic-byte detection (`detectImageFormat`).
4. **`updateBook` wiped or accepted broken paths:** Editing book metadata with an empty `coverPath` overwrote `books.cover_path` with `""`, and OS-specific absolute paths or non-existent `/uploads/...` paths could be persisted.
5. **Admin book detail preview missing:** [`frontend/js/pages/admin-book.js`](file:///c:/Myproject/digital-library/frontend/js/pages/admin-book.js) imported `loadCoverIntoElements` but never called it in `renderBook()`, leaving `#book-cover-preview` permanently hidden on `admin-book.html`.
6. **Lazy-loading + `hidden` deadlock & inconsistent dimensions:** Setting `loading="lazy"` on `hidden` `<img>` elements stalled `onload` callbacks in Chromium, `private_library_files` lacked `cover_image`/`cover_path` columns, and conflicting `min-height`/`max-height` rules distorted `2:3` card cover proportions.

---

## 4. Cover Storage Correction

- [`backend/src/utils/coverFallback.js`](file:///c:/Myproject/digital-library/backend/src/utils/coverFallback.js):
  - Added `selectBestPdfCoverImage(images)` to prioritize meaningful page-1 images (`width >= 50 && height >= 50`, largest pixel area) before falling back to smaller images.
  - Updated `sanitizeFallbackDisplayText` to strip trailing epoch timestamps (`\d{9,}(?:[_-]\d+)?`), UUID tokens, `[._]processed.json`, and `.pdf`/`.epub` suffixes.
- [`backend/src/utils/epubProcessor.js`](file:///c:/Myproject/digital-library/backend/src/utils/epubProcessor.js):
  - Expanded EPUB cover manifest discovery (`properties="cover-image"`, `<meta name="cover">` image references, `id`/`href` cover matching, and `decodeURIComponent` path fallback).
- [`backend/src/services/book.service.js`](file:///c:/Myproject/digital-library/backend/src/services/book.service.js):
  - `MANAGED_COVER_NAME_PATTERN` accepts both `cover-<uuid>.<ext>` and `<uuid>.cover.<ext>`.
  - `uploadBookCover` renames the file on disk whenever its extension differs from `detectImageFormat(buf).ext`, then records both `cover_image` and canonical `cover_path` (`/api/books/:id/cover`).
  - `importBookPdf` records extracted PDF/EPUB cover filenames in `books.cover_image` (unless a valid custom uploaded cover is already on disk) and guarantees `books.cover_path` is `/api/books/:id/cover`.
  - `createBook` and `updateBook` reject OS-specific absolute paths (`400`) and preserve/default canonical `/api/books/:id/cover` paths.
- [`backend/src/services/privateLibrary.service.js`](file:///c:/Myproject/digital-library/backend/src/services/privateLibrary.service.js) & [`backend/src/repositories/privateLibrary.repository.js`](file:///c:/Myproject/digital-library/backend/src/repositories/privateLibrary.repository.js):
  - Persisted `cover_image` and `cover_path` (`/api/private-library/:id/cover`) on `private_library_files` during upload/extraction, with strict owner-only access verification in `getPrivateCover`.

---

## 5. Database Cover-Path Verification

Verified against `digital_library_test` across 5 synthetic test books (and private uploads):

| Book / Scenario | Physical Cover File on Disk | `books.cover_image` | `books.cover_path` | HTTP Response (`GET /api/books/:id/cover`) |
|---|---|---|---|---|
| Book 1 (PDF with 1×1 spacer + 80×120 PNG) | `uploads/public/<uuid>.cover.png` | `<uuid>.cover.png` | `/api/books/:id/cover` | `200 OK`, `image/png`, `80×120` |
| Book 2 (EPUB with `cover-image`) | `uploads/public/<uuid>.cover.png` | `<uuid>.cover.png` | `/api/books/:id/cover` | `200 OK`, `image/png` |
| Book 3 (PNG uploaded as `.jpg`) | `uploads/public/cover-<uuid>.png` | `cover-<uuid>.png` | `/api/books/:id/cover` | `200 OK`, `image/png` |
| Book 4 (Scanned PDF, no cover image) | None (fallback SVG) | `NULL` | `/api/books/:id/cover` | `200 OK`, `image/svg+xml` |
| Book 5 (Title with timestamp + author) | None (fallback SVG) | `NULL` | `/api/books/:id/cover` | `200 OK`, `image/svg+xml` (sanitized title + author) |
| Private PDF upload | `uploads/private/<uuid>.cover.png` | `<uuid>.cover.png` | `/api/private-library/:id/cover` | `200 OK` (owner), `404` (admin/other user) |

---

## 6. Cover URL Correction

- [`frontend/js/coverLoader.js`](file:///c:/Myproject/digital-library/frontend/js/coverLoader.js):
  - Normalizes invalid local paths (`/uploads/...`, OS paths) directly to the authenticated API endpoint (`fallbackApiPath`) without firing broken 404 requests.
  - Uses authenticated `fetch(..., { credentials: "include", headers })` -> `Blob` -> `URL.createObjectURL` with `image.loading = "eager"` so `hidden` images never stall.
- [`frontend/js/pages/admin-book.js`](file:///c:/Myproject/digital-library/frontend/js/pages/admin-book.js):
  - Calls `loadCoverIntoElements` inside `renderBook()` to render `#book-cover-preview`, updates `#admin-preview-reader` to `read.html?id=<bookId>`, and refreshes preview immediately after PDF/EPUB import or custom cover upload.

---

## 7. Cover Size and Responsive Layout

- [`frontend/css/library.css`](file:///c:/Myproject/digital-library/frontend/css/library.css):
  - Standardized `.book-card-cover-wrap` to `width: min(100%, 184px); aspect-ratio: 2 / 3;` on desktop and `width: 120px; aspect-ratio: 2 / 3;` on mobile (`<= 600px`), with `.book-card-cover` (`width: 100%; height: 100%; object-fit: contain;`) and `.cover-placeholder` filling the `2:3` container cleanly.
- [`frontend/css/private-library.css`](file:///c:/Myproject/digital-library/frontend/css/private-library.css):
  - Standardized `.private-file-cover-wrap` to `width: 100px; aspect-ratio: 2 / 3;` (`120px` at `<= 400px`) with `object-fit: contain`.
- [`frontend/css/admin.css`](file:///c:/Myproject/digital-library/frontend/css/admin.css):
  - Preserved `2:3` thumbnail (`.admin-book-thumb-wrap`) and preview (`.admin-cover-preview-wrap`) framing with `object-fit: contain`.

---

## 8. User Save-to-Private-Library Implementation

- Normal authenticated users (`USER`) can save any `PUBLISHED` public book via `POST /api/private-library/saved/:bookId` from [`library.html`](file:///c:/Myproject/digital-library/frontend/library.html) ([`library.js`](file:///c:/Myproject/digital-library/frontend/js/pages/library.js)) and [`book.html`](file:///c:/Myproject/digital-library/frontend/book.html) ([`book.js`](file:///c:/Myproject/digital-library/frontend/js/pages/book.js)).
- Unsaved books show **`Save to My Library`**; saved books show **`Saved to My Library`** alongside a separate **`Remove from My Library`** button. Loading states disable buttons during in-flight requests.
- Saved books appear in the **Saved Public Books** section of [`private-library.html`](file:///c:/Myproject/digital-library/frontend/private-library.html) ([`private-library.js`](file:///c:/Myproject/digital-library/frontend/js/pages/private-library.js)), distinct from **My Uploaded Books**.

---

## 9. Admin Save-to-Private-Library Implementation

- Administrators (`ADMIN`) share the exact same personal library endpoints (`/api/private-library/saved`, `/api/private-library`), authenticated by `req.user.user_id`.
- Added personal **`Save to My Library`** / **`Saved to My Library`** + **`Remove from My Library`** controls for `PUBLISHED` books in [`frontend/js/pages/admin.js`](file:///c:/Myproject/digital-library/frontend/js/pages/admin.js) and [`frontend/admin-book.html`](file:///c:/Myproject/digital-library/frontend/admin-book.html) / [`frontend/js/pages/admin-book.js`](file:///c:/Myproject/digital-library/frontend/js/pages/admin-book.js), kept clearly separate from admin publication controls (`Edit`, `Manage content`, `Publish`, `Archive`).

---

## 10. User Remove Implementation

- Clicking **`Remove from My Library`** in `library.html`, `book.html`, or `private-library.html` prompts a confirmation dialog and calls `DELETE /api/private-library/saved/:bookId`.
- [`backend/src/repositories/savedBooks.repository.js`](file:///c:/Myproject/digital-library/backend/src/repositories/savedBooks.repository.js) executes `DELETE FROM private_saved_books WHERE user_id = ? AND book_id = ?`, removing only that user's saved link while leaving the public book, PDF, cover, and other users' saves untouched.

---

## 11. Admin Remove Implementation

- Administrators can remove saved public books from their own personal private library via `admin.html`, `admin-book.html`, `library.html`, `book.html`, or `private-library.html`.
- Verified that an administrator's personal remove operation deletes only the admin's `private_saved_books` row and never archives, deletes, or alters the published public book or other users' saves.

---

## 12. Database Changes

- [`database/migrations/022_create_saved_books.sql`](file:///c:/Myproject/digital-library/database/migrations/022_create_saved_books.sql): `private_saved_books` (`saved_id`, `user_id`, `book_id`, `saved_at`, `UNIQUE KEY uq_private_saved_books_user_book (user_id, book_id)`, `INDEX idx_private_saved_books_user_saved_at (user_id, saved_at)`, foreign keys with `ON DELETE CASCADE`).
- [`database/migrations/023_add_private_cover_columns.sql`](file:///c:/Myproject/digital-library/database/migrations/023_add_private_cover_columns.sql) *(created)*: Adds `cover_image VARCHAR(255) NULL` and `cover_path VARCHAR(255) NULL` to `private_library_files`.
- Updated [`database/schema.sql`](file:///c:/Myproject/digital-library/database/schema.sql) and [`backend/scripts/migrate.js`](file:///c:/Myproject/digital-library/backend/scripts/migrate.js).

---

## 13. API Changes

- `GET /api/private-library` -> returns `{ privateFiles, savedBooks }` scoped to `req.user.user_id`.
- `GET /api/private-library/saved` -> returns `{ savedBooks, total }`.
- `POST /api/private-library/saved/:bookId` -> idempotent save (`201` created, `200` with `alreadySaved: true`, `404` on unpublished/missing books).
- `DELETE /api/private-library/saved/:bookId` -> removes only authenticated user's saved relationship (`200`, `404` if not saved).
- `GET /api/books/:id/cover`, `POST /api/books/:id/cover`, `GET /api/private-library/:id/cover` -> canonical cover retrieval/upload with format/magic-byte verification.
- `GET /api/books/:id/file` & `GET /api/private-library/:id/file` -> inline PDF streaming with RFC 5987 safe `Content-Disposition`, `Content-Type: application/pdf`, and byte-range (`206 Partial Content`) support.

---

## 14. Original PDF Reader Implementation

- Updated [`frontend/read.html`](file:///c:/Myproject/digital-library/frontend/read.html), [`frontend/js/router.js`](file:///c:/Myproject/digital-library/frontend/js/router.js), [`frontend/js/pages/read.js`](file:///c:/Myproject/digital-library/frontend/js/pages/read.js), [`frontend/css/read.css`](file:///c:/Myproject/digital-library/frontend/css/read.css), and self-hosted PDF.js runtime assets in `frontend/vendor/pdfjs/` (copied from `backend/node_modules/pdfjs-dist` v6.4.299):
  - **Root cause of persistent download icon & broken fullscreen:** Using `<iframe id="read-pdf-frame" src="blob:...">` delegated rendering to Chrome/Edge/Firefox's built-in PDF extension viewer, whose dark toolbar includes a built-in `#download` icon that parent DOM scripts cannot individually suppress, while iframe reloads on navigation/zoom disrupted scroll and fullscreen state.
  - **Self-hosted PDF.js viewer:** Original PDF mode now fetches authorized `/file` bytes as a `Uint8Array` (keeping private/public URLs out of DOM attributes) and renders directly inside `#read-pdf-viewer` (`#read-pdf-stage-wrap` → `#read-pdf-stage` → `#read-pdf-pages.pdfViewer`) using `pdfjsViewer.PDFViewer`, `EventBus`, and `PDFLinkService` with `isEvalSupported: false` and `useWorkerFetch: false` for strict CSP compatibility.
  - **Download Removal:** All primary and secondary download controls (`#read-pdf-download`, `#download`, `#secondaryDownload`) are absent from both the dark PDF.js toolbar and viewer markup, keeping balanced spacing across `Prev`, page number input, `Next`, `-`, zoom percentage, `+`, `Reset`, and `Full Screen`.
  - **Full-Screen Expansion:** `#read-pdf-fullscreen` targets `#read-pdf-viewer` (the outer container wrapping the dark toolbar and scrollable stage) via `requestFullscreen()` / `document.exitFullscreen()`, `document.fullscreenElement`, and `fullscreenchange` (with `webkit*` support and graceful `.is-fallback-fullscreen` + `Escape` fallback when fullscreen permission is denied/unsupported). Entering/exiting fullscreen expands `#read-pdf-stage-wrap` cleanly to `100vw × 100dvh`, updates tooltips (`"Enter Full Screen"` ↔ `"Exit Full Screen"`), supports `Escape` exit, and preserves current page number, zoom level, and smooth PDF scrolling.
  - All EPUB-style reflowable content, TTS playback bar (`.read-actions`), pitch/speed/voice settings (`#read-settings-panel`), themes (`data-read-theme`), typography controls, chapter drawer (`#read-chapters-panel`), top bar (`#read-topbar`), and progress bar (`.read-progress`) are hidden via both JS (`hidden = true`) and CSS (`display: none !important`).
  - Original PDF mode does not fail if `/document` is unavailable or if the PDF is scanned/image-only.

---

## 15. PDF Security Verification

- Public PDFs (`/api/books/:id/file`) require authentication (`requireAuth`) and enforce `PUBLISHED` visibility for normal users (`404` on `DRAFT`/`ARCHIVED`).
- Private PDFs (`/api/private-library/:id/file`) and private covers (`/api/private-library/:id/cover`) enforce strict ownership (`findByIdAndOwner`), returning `404` to non-owners including admins.
- Neither `uploads/public` nor `uploads/private` is exposed via static Express directories.
- CSP (`frameSrc: ["'self'", 'blob:']`, `frameAncestors: ["'none'"]`) and CSRF protections remain intact.

---

## 16. EPUB Reader Preservation

- EPUB books, chapter-based books, and PDFs with selectable text (`hasReadablePages === true`) continue to use the full EPUB-style reader (`renderDocument`, `initSettings`, `initChapters`, `initTts`) with all 7 themes, presets, typography, chapter drawer, auto-scroll, and TTS (`0.5×–3×` speed & pitch).
- When EPUB-style text content is unavailable (e.g., scanned image-only PDFs), `#read-mode-switch` is hidden so no broken EPUB-style option is presented.

---

## 17. Tests Executed and Results

All tests ran after the final code edit against the isolated `digital_library_test` database:

| Suite | Scope | Result |
|---|---|---|
| `tests/module27.5-comprehensive-audit.test.js` | 5 synthetic book covers (DB + disk + HTTP), cover extension normalization, `updateBook` cover validation, private covers, Admin + User save/remove & isolation, byte-range `206` PDF headers, PDF-only public/private/spoof upload validation & legacy EPUB compatibility, Admin Dashboard filtering/sorting/search/RBAC API & Headless Chrome E2E across `library`, `book`, `private-library`, `admin` (interactive pills/chips/live search/collapsible mobile drawer on desktop `1366×768`, tablet `768×1024` & mobile `390×844`), `admin-book`, `read` (embedded PDF.js Original PDF Full Screen + ESC + zoom/page/scroll preservation + zero download controls, Private PDF, Scanned, EPUB-style) | **39 passed, 0 failed** |
| `tests/module27.5-verification.test.js` | Covers, custom JPEG upload, fake JPEG rejection, SVG XSS escaping, private covers/images/files, TTS `0.5×–3×` validation, `config.js`, `read.html` | **36 passed, 0 failed** |
| `tests/module27.5-responsive-library-verification.test.js` | Migrations, relation/format enrichment, SVG fallback sanitization, saved books API, private PDF streaming, CSS/JS checks | **24 passed, 0 failed** |
| `tests/module27-security-verification.test.js` | Auth, CSRF, CSP, rate limiting, `auth_events`, IDOR, XSS, SQLi, PDF-only rejection for new EPUB uploads & legacy EPUB record access control | **64 passed, 0 failed** |
| `tests/module20-upload-verification.test.js` | PDF-only format, extension, MIME, and signature validation (rejects EPUB & non-PDFs) | **11 passed, 0 failed** *(1 skipped: `scratch/test.epub` fixture absent)* |
| `tests/module21-epub-processing.test.js` | EPUB 2/3 parser, ZIP bomb/path traversal, HTML/CSS sanitization, new EPUB upload rejection (`400`), and legacy EPUB reader APIs | **54 passed, 0 failed** |
| `tests/publishing-workflow.test.js` | Chapter & PDF import, publishing, visibility, cookie auth (run with temporary synthetic admin in `digital_library_test`) | **37 passed, 0 failed** |
| `tests/archival-verification.js` | Author & category archival repository checks | **PASS** *(exit code 0)* |
| `tests/reader-availability.test.js` | Requires standalone server running on `http://localhost:5001` | *Not executed standalone (blocked on `BASE_URL=http://localhost:5001` guard)* |

---

## 17A. Additional Requirement — PDF-Only Book Upload Restriction

All new book uploads across the application are strictly restricted to **PDF files only** while preserving full backward compatibility for existing EPUB database records, files, and processing:

- **Shared Validation & Format Config:**
  - [`backend/src/utils/formatValidation.js`](file:///c:/Myproject/digital-library/backend/src/utils/formatValidation.js) restricts `SUPPORTED_FORMATS` and `FORMAT_CONFIG` to `PDF` (`allowedExtensions: [".pdf"]`, `allowedMimeTypes: ["application/pdf", "application/x-pdf"]`).
  - [`backend/src/utils/pdfValidation.js`](file:///c:/Myproject/digital-library/backend/src/utils/pdfValidation.js) verifies both `%PDF-[12]\.\d` header magic bytes and `%%EOF` in the file tail so spoofed ZIP/EPUB/TXT/non-PDF files renamed to `.pdf` are rejected and temporary files are unlinked safely.
- **Upload Middleware, Validators & Services:**
  - [`backend/src/middleware/upload.middleware.js`](file:///c:/Myproject/digital-library/backend/src/middleware/upload.middleware.js) removes EPUB MIME types from both `handlePrivatePdfUpload` and `handlePublicPdfUpload` and rejects non-`.pdf` uploads at multer filter time.
  - [`backend/src/validators/privateLibrary.validator.js`](file:///c:/Myproject/digital-library/backend/src/validators/privateLibrary.validator.js) limits `format` to `["PDF"]`.
  - [`backend/src/services/book.service.js`](file:///c:/Myproject/digital-library/backend/src/services/book.service.js) (`importBookPdf`) and [`backend/src/services/privateLibrary.service.js`](file:///c:/Myproject/digital-library/backend/src/services/privateLibrary.service.js) (`uploadPrivateBook`) reject EPUB/non-PDF uploads (`400`) and clean up invalid uploaded files while keeping legacy `processEpubFile`, `getProcessedDocument`, `getBookToc`, `getBookChapterPage`, `getPublicFileForStreaming`, and private EPUB cover/reading methods intact for existing DB records.
- **Frontend Upload Forms:**
  - [`frontend/admin-book.html`](file:///c:/Myproject/digital-library/frontend/admin-book.html), [`frontend/js/pages/admin-book.js`](file:///c:/Myproject/digital-library/frontend/js/pages/admin-book.js), [`frontend/private-library.html`](file:///c:/Myproject/digital-library/frontend/private-library.html), and [`frontend/js/pages/private-library.js`](file:///c:/Myproject/digital-library/frontend/js/pages/private-library.js) remove EPUB format selectors, enforce `accept=".pdf,application/pdf"` on file inputs, display PDF as the only supported upload format, and inspect `%PDF-` file header signatures client-side before submission.

---

## 17B. Additional Requirement — Admin Dashboard Book Filtering & Sorting

Added server-backed search, category filtering, publication status filtering, and sorting to the **Books** section of the Admin Dashboard, sharing validation, query logic, and UI controls with the Public Library:

- **Shared Parameterized Backend Query & Security:**
  - [`backend/src/repositories/book.repository.js`](file:///c:/Myproject/digital-library/backend/src/repositories/book.repository.js) introduces `buildBookFilterWhere({ status, categoryId, search })` shared by both `findAllPaginated` and `countAll`. Uses parameterized SQL (`?`) with `ESCAPE '~'` for `LIKE` matching across `books.title`, `books.description`, and linked `authors.name`, plus `EXISTS` category filtering on `book_categories`.
  - [`backend/src/services/book.service.js`](file:///c:/Myproject/digital-library/backend/src/services/book.service.js) adds `parseCategoryFilter` (strict positive integer validation, `400` on invalid input), `parseSearchFilter`, `parseAdminStatusFilter` (`ALL`/`DRAFT`/`PUBLISHED`/`ARCHIVED`, `400` on invalid values), and shared `getBooksFiltered` serving both `getAllBooksPaginated` (normal users locked to `PUBLISHED` regardless of query params) and `getAdminBooks` (`assertAdmin`, returns all manageable statuses by default).
  - [`backend/src/routes/book.routes.js`](file:///c:/Myproject/digital-library/backend/src/routes/book.routes.js) and [`backend/src/controllers/book.controller.js`](file:///c:/Myproject/digital-library/backend/src/controllers/book.controller.js) add `GET /api/books/manage` protected by `requireAuth, requireRole('ADMIN')` and upgrade `GET /api/books` to accept `search` and `category` query parameters cleanly.
- **Shared Frontend Controls & Admin Dashboard Integration:**
  - [`frontend/js/bookFilters.js`](file:///c:/Myproject/digital-library/frontend/js/bookFilters.js) provides `BOOK_SORT_OPTIONS`, `populateSortOptions`, `populateCategoryOptions`, and `fetchAllCategories` reused by both [`frontend/js/pages/library.js`](file:///c:/Myproject/digital-library/frontend/js/pages/library.js) and [`frontend/js/pages/admin.js`](file:///c:/Myproject/digital-library/frontend/js/pages/admin.js).
  - [`frontend/admin.html`](file:///c:/Myproject/digital-library/frontend/admin.html) and [`frontend/css/admin.css`](file:///c:/Myproject/digital-library/frontend/css/admin.css) add matching search (`#admin-book-search`), `Category` (`#admin-category-filter`), `Sort books` (`#admin-sort-filter`), `Status` (`#admin-status-filter`), `Reset filters` (`#admin-reset-filters`), filtered summary count (`#admin-books-summary`), pagination (`#admin-books-pagination`), and author/category/format badges per row while preserving all cover thumbnails and admin actions (`Edit`, `Manage content`, `View book`, `Publish`, `Archive`, and Admin personal library `Save`/`Remove`).

---

## 18. Files Changed

- **Backend:** `backend/scripts/migrate.js`, `backend/src/controllers/book.controller.js`, `backend/src/controllers/privateLibrary.controller.js`, `backend/src/middleware/upload.middleware.js`, `backend/src/repositories/book.repository.js`, `backend/src/repositories/privateLibrary.repository.js`, `backend/src/routes/book.routes.js`, `backend/src/services/book.service.js`, `backend/src/services/privateLibrary.service.js`, `backend/src/utils/coverFallback.js`, `backend/src/utils/epubProcessor.js`, `backend/src/utils/formatValidation.js`, `backend/src/utils/pdfValidation.js`, `backend/src/validators/privateLibrary.validator.js` (alongside prior M27.5 changes in `csp.config.js`, `bookRelations.repository.js`, `privateLibrary.routes.js`, `savedBooks.repository.js`, `fileStorage.js`, `pdfImageExtractor.js`, `pdfTextExtractor.js`, `tokenBlacklist.js`).
- **Database:** `database/schema.sql`, `database/migrations/022_create_saved_books.sql`, `database/migrations/023_add_private_cover_columns.sql`.
- **Frontend:** `frontend/admin.html`, `frontend/admin-book.html`, `frontend/book.html`, `frontend/private-library.html`, `frontend/read.html`, `frontend/css/admin.css`, `frontend/css/base.css`, `frontend/css/components.css`, `frontend/css/layout.css`, `frontend/css/library.css`, `frontend/css/private-library.css`, `frontend/css/read.css`, `frontend/js/bookFilters.js`, `frontend/js/config.js`, `frontend/js/coverLoader.js`, `frontend/js/layout.js`, `frontend/js/router.js`, `frontend/js/pages/admin.js`, `frontend/js/pages/admin-book.js`, `frontend/js/pages/book.js`, `frontend/js/pages/library.js`, `frontend/js/pages/private-library.js`, `frontend/js/pages/read-tts.js`, `frontend/js/pages/read.js`, `frontend/vendor/pdfjs/` (`pdfjs-dist` v6.4.299 runtime assets).
- **Tests & Docs:** `tests/module20-upload-verification.test.js`, `tests/module21-epub-processing.test.js`, `tests/module27-security-verification.test.js`, `tests/module27.5-comprehensive-audit.test.js`, `tests/module27.5-responsive-library-verification.test.js`, `tests/module27.5-verification.test.js`, `docs/10-modules/module-27.5-book-cover-storage-personal-library-pdf-reader-corrections.md`.

---

## 19. Remaining Defects

- None identified across tested automated and headless Chrome flows.
- Browser-specific built-in PDF viewer behavior on mobile iOS Safari / Android Chrome (where native `Element.requestFullscreen()` on container `<div>` elements may be unsupported or restricted) falls back cleanly to in-page full-viewport expansion (`.is-fallback-fullscreen`) with `Escape` and Exit Full Screen support.

---

## 20. Manual Testing Instructions

1. Start MySQL 8.x and backend (`cd backend && npm run dev`).
2. Serve `frontend/` (e.g. `npx serve frontend -p 3000`).
3. Log in as a normal user and as an admin (`demoadmin@example.com` / `demouser@example.com` in local dev):
   - Verify covers load on `library.html`, `book.html`, `private-library.html`, `admin.html`, and `admin-book.html` with `2:3` portrait framing.
   - Upload a custom cover or import a PDF in `admin-book.html` and verify `#book-cover-preview` updates immediately, while EPUB uploads are rejected everywhere (public admin upload, private user upload, private admin upload).
   - Click `Save to My Library` -> verify `Saved to My Library` + `Remove from My Library` appear, open `private-library.html` to confirm it appears under **Saved Public Books**, and click `Remove from My Library` -> confirm the original book remains in `library.html`.
   - Open a PDF book in `read.html` -> confirm **Original PDF** opens inside the website with only simple PDF page/zoom controls and zero EPUB/TTS/theme/chapter controls; switch to **EPUB-style (Reflowable)** (on text PDFs) to verify all EPUB/TTS/theme features remain intact.

---

## 21. Final Acceptance Checklist

### Book cover
- [x] Actual cover file is saved correctly.
- [x] Cover path is saved correctly.
- [x] Database references the correct file.
- [x] Cover endpoint returns the correct image.
- [x] Frontend displays the correct image.
- [x] Cover dimensions are consistent (`2:3`).
- [x] Image proportions are preserved (`object-fit: contain`).
- [x] Missing covers show a proper fallback.
- [x] Private covers remain protected.

### Personal library
- [x] Normal user can save a public book.
- [x] Administrator can save a public book.
- [x] Saved books appear in each account's personal library.
- [x] Duplicate saves are prevented.
- [x] Normal user can remove their saved book.
- [x] Administrator can remove their saved book.
- [x] Other users' relationships remain unaffected.
- [x] Original public book remains intact.
- [x] Original PDF remains intact.

### Original PDF reader
- [x] Original PDF opens inside the website.
- [x] The original PDF is displayed, not converted text.
- [x] Simple PDF reader interface is used.
- [x] Only PDF-related viewing controls are displayed.
- [x] No EPUB-specific reader controls appear.
- [x] Existing EPUB-style reading remains separate.
- [x] Public/private authorization works.

### PDF-only book upload
- [x] PDF is the only upload format shown in public-library upload forms.
- [x] PDF is the only upload format shown in private-library upload forms.
- [x] Admin uploads accept PDF only.
- [x] Normal user uploads accept PDF only.
- [x] Backend rejects all new EPUB uploads and spoofed non-PDF files.
- [x] Direct API requests cannot bypass validation.
- [x] Original PDF reading remains functional.
- [x] PDF-derived EPUB-style reading remains available where supported.
- [x] Existing EPUB books and records are preserved.

### Admin Dashboard book filtering & PDF.js viewer fixes
- [x] Admin Dashboard contains search, dynamic category, sort, and status filtering matching Public Library.
- [x] Draft, published, and archived books remain manageable for admins; normal users blocked from `/api/books/manage` (`403`).
- [x] Filtered counts, cover thumbnails, metadata badges, and existing admin actions remain intact.
- [x] Original PDF viewer renders via self-hosted PDF.js (`frontend/vendor/pdfjs/`) with zero primary/secondary download controls.
- [x] Full Screen button expands the complete `#read-pdf-viewer` container to `100vw × 100dvh`, exits on Exit button / `ESC`, and preserves page/zoom/scroll.

### Quality
- [x] Relevant tests pass.
- [x] No critical security issue is introduced.
- [x] No unrelated functionality is broken.
- [x] Documentation is complete.
- [x] Actual Git working-tree state is reported.
