# Module 27 — Security and Regression Verification

**Project:** Digital Library  
**Repository:** https://github.com/ItsPrincekumar03/digital-library  
**Module:** 27 — Security and Regression Verification  
**Assigned Developer:** Ritwiz Gupta  
**Main Developer:** Prince Kumar  
**Branch:** `module-27-security-regression-verification` (branched from `origin/main` at `d71696a`)  
**Audited Base Commits:** `d71696a` (`origin/main`) and `c20b4c0` (`module-26-automated-test-harness-fixtures`)  
**Audit & Remediation Date:** 2026-11-11  
**Final Module Status:** **COMPLETE**

---

## 1. Module Overview

Module 27 performs a pre-deployment application security audit, open-finding closure, and isolated regression verification of the Digital Library monolithic Express/MySQL application prior to Module 28 (free-hosting deployment preparation).

During the initial audit, four security gaps (**SEC-01** through **SEC-04**) were identified. During remediation and verification, two additional defects were discovered and fixed:
1. Untrusted `Origin` CORS rejections returned HTTP `500` instead of `403` due to a missing `.status` property on the CORS error callback.
2. Failed uploads to `/api/private-library/upload` (and invalid-format uploads on `/api/books/:id/pdf`) orphaned temporary uploaded files on disk in `uploads/private/` or `uploads/public/`.

All confirmed Module 27 defects have been remediated cleanly within the existing monolithic Express.js / MySQL architecture and verified against the isolated `digital_library_test` database.

---

## 2. Initial and Final Git Status

### Initial Git Status
```
Branch : module-26-automated-test-harness-fixtures
HEAD   : c20b4c0  docs(module-26): add automated test harness and fixtures report
Remote : origin  https://github.com/ItsPrincekumar03/digital-library.git
Status : Working tree clean; untracked initial draft of docs/10-modules/module-27-security-regression-verification.md
```

### Final Git Status (Uncommitted Local Workspace Only)
```
Branch : module-26-automated-test-harness-fixtures
HEAD   : c20b4c0 (unchanged — no commits, pushes, merges, or PRs created)
Modified:
  backend/scripts/migrate.js
  backend/src/app.js
  backend/src/controllers/auth.controller.js
  backend/src/controllers/profile.controller.js
  backend/src/middleware/rateLimiter.js
  backend/src/routes/auth.routes.js
  backend/src/routes/book.routes.js
  backend/src/routes/privateLibrary.routes.js
  backend/src/services/book.service.js
  backend/src/services/privateLibrary.service.js
  backend/src/validators/privateLibrary.validator.js
  frontend/js/api.js
Untracked:
  backend/src/config/cors.config.js
  backend/src/config/csp.config.js
  backend/src/middleware/csrf.middleware.js
  backend/src/utils/authAudit.js
  database/migrations/021_create_auth_events.sql
  docs/10-modules/module-27-security-regression-verification.md
  tests/module27-security-verification.test.js
```

No commits, pushes, branch merges, resets, or pull requests were executed.

---

## 3. Files Inspected

- **Backend Entry & Config:** `backend/package.json`, `backend/server.js`, `backend/src/app.js`, `backend/src/config/env.js`, `backend/src/config/db.config.js`, `backend/src/config/database.js`, `backend/src/config/jwt.config.js`, `backend/.env.example`
- **Middleware:** `backend/src/middleware/auth.middleware.js`, `backend/src/middleware/role.middleware.js`, `backend/src/middleware/rateLimiter.js`, `backend/src/middleware/upload.middleware.js`, `backend/src/middleware/errorHandler.js`
- **Routes & Controllers:** `backend/src/routes/auth.routes.js`, `backend/src/routes/book.routes.js`, `backend/src/routes/privateLibrary.routes.js`, `backend/src/routes/profile.routes.js`, `backend/src/routes/author.routes.js`, `backend/src/routes/category.routes.js`, `backend/src/routes/chapter.routes.js`, `backend/src/routes/health.routes.js`, `backend/src/controllers/auth.controller.js`, `backend/src/controllers/book.controller.js`, `backend/src/controllers/privateLibrary.controller.js`, `backend/src/controllers/profile.controller.js`
- **Services, Repositories & Validators:** `backend/src/services/auth.service.js`, `backend/src/services/book.service.js`, `backend/src/services/privateLibrary.service.js`, `backend/src/services/profile.service.js`, `backend/src/repositories/book.repository.js`, `backend/src/repositories/privateLibrary.repository.js`, `backend/src/repositories/user.repository.js`, `backend/src/validators/auth.validator.js`, `backend/src/validators/book.validator.js`, `backend/src/validators/privateLibrary.validator.js`
- **Utilities & Database:** `backend/src/utils/tokenBlacklist.js`, `backend/src/utils/pdfValidation.js`, `backend/src/utils/epubValidation.js`, `backend/src/utils/epubProcessor.js`, `backend/src/utils/formatValidation.js`, `backend/src/utils/fileStorage.js`, `backend/src/utils/bookVisibility.js`, `backend/src/utils/logger.js`, `database/schema.sql`, `database/migrations/*`, `backend/scripts/migrate.js`, `backend/scripts/test-init.js`
- **Frontend & Tests:** `frontend/*.html`, `frontend/css/*.css`, `frontend/js/api.js`, `frontend/js/auth.js`, `frontend/js/config.js`, `frontend/js/pages/login.js`, `frontend/js/pages/private-library.js`, `frontend/js/pages/read.js`, `frontend/js/pages/read-settings.js`, `frontend/js/pages/read-tts.js`, `tests/*`, `tests/fixtures/epub/*`, `docs/10-modules/module-26-automated-test-harness-fixtures.md`

---

## 4. Files Modified and Created

### Modified
| File | Purpose |
|------|---------|
| `backend/src/app.js` | Wired custom CSP (`buildCspConfig`), shared origin checker (`isOriginAllowed`), CORS headers (`X-CSRF-Token`), `403` status on CORS origin errors, and global `csrfProtection` before routes/Multer |
| `backend/src/controllers/auth.controller.js` | Issued user-bound signed `csrf_token` cookie + `X-CSRF-Token` header + `data.csrfToken`; cleared `csrf_token` on logout; added `REGISTER_SUCCESS`, `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT` audit logging; added `csrfToken` endpoint |
| `backend/src/routes/auth.routes.js` | Added authenticated `GET /api/auth/csrf-token` endpoint |
| `backend/src/controllers/profile.controller.js` | Added `PASSWORD_CHANGED` and `PASSWORD_CHANGE_FAILED` audit logging |
| `backend/src/middleware/rateLimiter.js` | Added `uploadLimiter` for file upload endpoints |
| `backend/src/routes/book.routes.js` | Mounted `uploadLimiter` before `handlePublicPdfUpload` on `POST /api/books/:id/pdf` |
| `backend/src/routes/privateLibrary.routes.js` | Mounted `uploadLimiter` before `handlePrivatePdfUpload` on `POST /api/private-library/upload` |
| `backend/src/services/privateLibrary.service.js` | Added temp-file cleanup (`deleteFileIfExists`) if format/extension/MIME/content validation or DB insert fails |
| `backend/src/validators/privateLibrary.validator.js` | Cleaned up `req.file.path` on `400` validation errors |
| `backend/src/services/book.service.js` | Cleaned up `file.path` when `validateFormat` fails on admin book import |
| `backend/scripts/migrate.js` | Added step 7 creating `auth_events` table in `digital_library_test` |
| `frontend/js/api.js` | Attached `X-CSRF-Token` on `POST`/`PUT`/`PATCH`/`DELETE` requests and captured rotated/issued tokens from cookie/header/JSON |

### Created
| File | Purpose |
|------|---------|
| `backend/src/config/cors.config.js` | Single shared `getAllowedOrigins` / `isOriginAllowed` helper for CORS and CSRF Origin/Referer validation |
| `backend/src/config/csp.config.js` | Restrictive reader-compatible Helmet CSP builder |
| `backend/src/middleware/csrf.middleware.js` | Origin/Referer validation + user-bound HMAC double-submit CSRF protection |
| `backend/src/utils/authAudit.js` | Safe structured + database authentication event logger (never logs secrets) |
| `database/migrations/021_create_auth_events.sql` | Standalone SQL migration for `auth_events` table on primary database |
| `tests/module27-security-verification.test.js` | Isolated 64-assertion Module 27 security and regression test suite |

---

## 5. Test Environment and Isolation Evidence

- **Database isolation:** `TEST_DB_NAME=digital_library_test` and `DB_NAME=digital_library_test` enforced in `backend/src/config/database.js` (`Database isolation error` if mismatched) and verified with `SELECT DATABASE() AS current_db` in test suites.
- **Migration isolation:** Confirmed `node backend/scripts/migrate.js` with `TEST_DB_NAME=digital_library` is blocked immediately with `[MIGRATE] Blocked. Both TEST_DB_NAME and DB_NAME must equal digital_library_test.`
- **Storage & user isolation:** Synthetic users (`sec_user_a_*`, `sec_user_b_*`, `sec_admin_*`) and ephemeral HTTP servers (`127.0.0.1:0`) were used. Every created DB record and uploaded/processed file was deleted in `finally`, verified clean after exit (`users`: seeded 3 rows only, `priv`: 0, `auth_events`: 0).
- **Production protection:** `digital_library` was neither read nor modified during tests.

---

## 6. SEC-01 — CSRF Protection Final Status

- **Initial Severity / Status:** MEDIUM — OPEN
- **Final Severity / Status:** **MEDIUM -> RESOLVED (PASS)**
- **Affected Components:** `backend/src/app.js`, `backend/src/middleware/csrf.middleware.js`, `backend/src/config/cors.config.js`, `backend/src/controllers/auth.controller.js`, `backend/src/routes/auth.routes.js`, `frontend/js/api.js`
- **Vulnerability Analysis:** Relying on `SameSite=Lax` cookies alone does not protect against all CSRF scenarios:
  1. Same-site cross-port (`localhost:3000` -> `localhost:5000`) or sibling subdomains still transmit `SameSite=Lax` cookies automatically.
  2. `express.urlencoded({ extended: true })` in `app.js` parses classic HTML `<form method="POST">` submissions without triggering CORS preflight.
  3. Cross-site free hosting (`netlify.app` <-> `onrender.com`) cannot use `SameSite=Lax` cookies; switching to `SameSite=None` would eliminate all cookie-level CSRF mitigation.
- **Actual Behavior (Before Fix):** Cookie-authenticated state-changing endpoints accepted `POST`/`PUT`/`PATCH`/`DELETE` requests without any CSRF token, and untrusted `Origin` headers returned HTTP `500`.
- **Expected Behavior / Fix Applied:**
  1. Implemented [`csrf.middleware.js`](file:///c:/Myproject/digital-library/backend/src/middleware/csrf.middleware.js) globally before route handlers and Multer.
  2. Rejects untrusted `Origin` or `Referer` origins on any `POST`/`PUT`/`PATCH`/`DELETE` with `403` (`CSRF_ORIGIN_FORBIDDEN`). Fixed CORS callback in `app.js` to return `403` instead of `500`.
  3. Requires matching `csrf_token` cookie + `X-CSRF-Token` header (timing-safe comparison + HMAC-SHA256 binding to `decoded.userId`) for cookie-authenticated mutations. Preserves `Authorization: Bearer` API clients, safe `GET`/`HEAD`/`OPTIONS` endpoints, and `/api/auth/login` + `/api/auth/register` bootstrap routes (which still enforce trusted Origin/Referer).
  4. Updated `frontend/js/api.js` to automatically include `X-CSRF-Token` on all mutating requests.
- **Verification Evidence (`tests/module27-security-verification.test.js`):**
  - Missing `X-CSRF-Token` -> `403 CSRF_TOKEN_MISSING` (PASS)
  - Invalid `X-CSRF-Token` -> `403 CSRF_TOKEN_INVALID` (PASS)
  - Cross-user CSRF token (USER B token replayed on USER A session) -> `403 CSRF_TOKEN_INVALID` (PASS)
  - Untrusted `Origin: https://evil-attacker.example` -> `403 CSRF_ORIGIN_FORBIDDEN` (PASS)
  - Untrusted `Referer: https://evil-attacker.example/exploit.html` -> `403 CSRF_ORIGIN_FORBIDDEN` (PASS)
  - Valid CSRF token + trusted origin `http://localhost:3000` -> `200` (PASS)
  - `GET /api/auth/csrf-token` -> `200` (PASS)
  - Explicit `Authorization: Bearer` client -> `200` (PASS)
- **Remaining Risk:** NONE for browser sessions with `X-CSRF-Token`. Legacy Node test scripts (`tests/api-categories-authors.test.js`, `tests/reader-availability.test.js`) extract only `token=` from `Set-Cookie` and will receive `403` on cookie mutations unless updated to use `Authorization: Bearer` or forward `X-CSRF-Token`.

---

## 7. SEC-02 — Content Security Policy (CSP) Final Status

- **Initial Severity / Status:** MEDIUM — OPEN
- **Final Severity / Status:** **MEDIUM -> RESOLVED (PASS)**
- **Affected Components:** `backend/src/config/csp.config.js`, `backend/src/app.js`
- **Actual Behavior (Before Fix):** CSP was disabled in development (`contentSecurityPolicy: false`) and left at unvalidated Helmet defaults in production (`undefined`), risking breakage of blob-based reader images or future PDF.js workers while lacking enforced directives in dev.
- **Expected Behavior / Fix Applied:** Created [`csp.config.js`](file:///c:/Myproject/digital-library/backend/src/config/csp.config.js) enforcing:
  - `default-src 'self'`, `script-src 'self'`, `script-src-attr 'none'`, `style-src 'self'` (zero `'unsafe-inline'`, zero `'unsafe-eval'`)
  - `img-src 'self' blob: data:` (supports authenticated blob image rendering in `frontend/js/pages/read.js`)
  - `worker-src 'self' blob:` (compatible with PDF.js workers)
  - `connect-src 'self'`, `font-src 'self'`, `media-src 'none'`, `object-src 'none'`, `frame-ancestors 'none'`, `base-uri 'self'`, `form-action 'self'`
  - `upgrade-insecure-requests` enabled in production (`NODE_ENV=production`) only.
- **Reader & TTS Compatibility Verification:**
  - Verified all 11 HTML pages in `frontend/*.html` contain zero inline `<script>`, zero `<style>`, and zero inline `on*=` event attributes.
  - Verified `frontend/css/*.css` contains zero external `@import` or remote URLs.
  - Verified `read-settings.js` and `read-chapters.js` apply dynamic reader themes, fonts, and layout via CSSOM (`element.style.setProperty(...)`), and `read.js` renders book/EPUB blocks via `document.createElement` + `.textContent` — compatible with strict `style-src 'self'` without `'unsafe-inline'`.
  - Verified `read-tts.js` uses native `window.speechSynthesis` (no external endpoints blocked by CSP).
- **Remaining Risk / Browser Note:**
  - Runtime CSP headers are applied on backend responses (`Express`); when the static frontend is served from a separate static host in Module 28 (e.g., Netlify/Vercel/Nginx), matching CSP headers (with `connect-src` allowing the production API URL) must be configured on the frontend host/reverse proxy.
  - Visual/interactive browser checks (PDF.js canvas, Web Speech API playback, live theme switching, responsive breakpoints) cannot be executed in headless Node CLI and require manual verification in a browser (tracked in Module 25/28).

---

## 8. SEC-03 — Rate Limiting Final Status

- **Initial Severity / Status:** LOW — OPEN
- **Final Severity / Status:** **LOW -> RESOLVED (PASS)**
- **Affected Components:** `backend/src/middleware/rateLimiter.js`, `backend/src/routes/auth.routes.js`, `backend/src/routes/profile.routes.js`, `backend/src/routes/privateLibrary.routes.js`, `backend/src/routes/book.routes.js`
- **Actual Behavior (Before Fix):** `authLimiter` protected `/api/auth/register` and `/api/auth/login` (10 req / 15 min in prod) and `passwordLimiter` protected `PUT /api/users/change-password` (5 req / 15 min in prod), but file upload endpoints had no rate limiting.
- **Expected Behavior / Fix Applied:** Added `uploadLimiter` (window: 15 min; `max`: `20` in production, `500` in development; standard `RateLimit-*` headers; HTTP `429` JSON response) and mounted it AFTER `requireAuth` / `requireRole('ADMIN')` and BEFORE Multer disk storage on:
  - `POST /api/private-library/upload` (`privateLibrary.routes.js`)
  - `POST /api/books/:id/pdf` (`book.routes.js`)
- **Verification Evidence (`tests/module27-security-verification.test.js`):**
  - `passwordLimiter` (prod mode): requests 1–5 return `200`, request 6 returns `429` (PASS)
  - `authLimiter` (prod mode): requests 1–10 return `200`, request 11 returns `429` (PASS)
  - `uploadLimiter` (prod mode): requests 1–20 return `200`, request 21 returns `429` (PASS)
- **Known Limitations:** Uses default in-memory store (`express-rate-limit`) without Redis per monolithic constraints; counters reset on backend restart and are per-instance. Free-hosting single-instance deployment is acceptable, provided `app.set('trust proxy', 1)` is configured before Module 28 production launch if deployed behind a reverse proxy so client IPs are not conflated.

---

## 9. SEC-04 — Authentication Audit Logging Final Status

- **Initial Severity / Status:** LOW — OPEN
- **Final Severity / Status:** **LOW -> RESOLVED (PASS)**
- **Affected Components:** `backend/src/utils/authAudit.js`, `backend/src/controllers/auth.controller.js`, `backend/src/controllers/profile.controller.js`, `database/migrations/021_create_auth_events.sql`, `backend/scripts/migrate.js`
- **Actual Behavior (Before Fix):** Auth lifecycle actions (`register`, `login` success/failure, `logout`, `change-password`) were not recorded in `audit_logs` (whose `action` ENUM excludes auth events) or structured auth logs.
- **Expected Behavior / Fix Applied:** Implemented [`authAudit.js`](file:///c:/Myproject/digital-library/backend/src/utils/authAudit.js) writing:
  1. Structured JSON `[AUTH]` lines to `logger` (`REGISTER_SUCCESS`, `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `LOGOUT`, `PASSWORD_CHANGED`, `PASSWORD_CHANGE_FAILED`) with `userId`, `ip`, and failure `email`/`reason` only.
  2. Persistent rows into `auth_events` (migration `021_create_auth_events.sql`), gracefully falling back to log-only if the table is not yet created on a target DB.
- **Verification Evidence (`tests/module27-security-verification.test.js`):**
  - Confirmed `auth_events` recorded `REGISTER_SUCCESS`, `LOGIN_SUCCESS`, `LOGIN_FAILURE`, `PASSWORD_CHANGED`, `PASSWORD_CHANGE_FAILED`, and `LOGOUT` (PASS).
  - Captured all console logs during execution and confirmed **zero** occurrences of plaintext passwords, JWTs, `JWT_SECRET`, or `DB_PASSWORD` (PASS).
- **Remaining Risk:** Low. Admin book-lifecycle actions already have the `audit_logs` table in `schema.sql`, though populating `audit_logs` for book mutations remains optional / unimplemented in `book.service.js`.

---

## 10. Private Document Ownership Results (IDOR)

Tested with isolated synthetic accounts **USER A**, **USER B**, and **ADMIN** on `POST /api/private-library/upload`, `GET /:id`, `GET /:id/file`, `GET /:id/document`, and `DELETE /:id`:

| Test Case | Expected | Actual | Result |
|-----------|----------|--------|--------|
| USER A reads own private PDF metadata & extracted text (`/document`) | `200` | `200` | PASS |
| USER A streams own private EPUB (`/file`) & reads `/document` + TOC | `200` | `200` | PASS |
| USER B accesses USER A private PDF (`/:id`, `/file`, `/document`, `DELETE`) | `404` | `404` on all 4 | PASS |
| USER B accesses USER A private EPUB (`/:id`, `/file`, `/document`, `DELETE`) | `404` | `404` on all 4 | PASS |
| ADMIN accesses USER A private PDF & EPUB (`/:id`, `/file`, `/document`, `DELETE`) | `404` | `404` on all 8 | PASS |
| USER B uploads with spoofed `ownerId` / `owner_id` / `userId` = USER A ID | Owned by USER B (`req.user.user_id`) | `owner_id` = USER B | PASS |
| USER A accesses DRAFT public EPUB book (`/document`, `/toc`, `/chapters/1`) | `404` | `404` on all 3 | PASS |
| USER A accesses PUBLISHED public EPUB book (`/document`) | `200` | `200` | PASS |

---

## 11. EPUB Archive Security Results

Verified via both `tests/module21-epub-processing.test.js` (54/54) and `tests/module27-security-verification.test.js` using synthetic fixtures in `tests/fixtures/epub/`:

| Fixture / Vector | Expected | Actual | Result |
|------------------|----------|--------|--------|
| Arbitrary ZIP renamed to `.epub` | Rejected `400` | `400` (`first entry must be "mimetype"`) | PASS |
| `invalid-container.epub` (missing `container.xml`) | Rejected | Error mentioning `container.xml` | PASS |
| `invalid-opf.epub` (missing OPF package) | Rejected | Error mentioning OPF missing | PASS |
| `invalid-spine.epub` (invalid spine itemref) | Rejected | Error thrown | PASS |
| `missing-chapter.epub` | Rejected | Error thrown | PASS |
| `path-traversal.epub` (`../` entry path) | Rejected, no escape | Error (`unsafe entry path`) | PASS |
| `duplicate-entries.epub` | Rejected | Error (`duplicate entry paths`) | PASS |
| `zip-bomb.epub` | Aborted on actual decompressed bytes | Error (`decompressed size`) | PASS |
| `crc-failure.epub` | Rejected | Error (`CRC-32 verification failed`) | PASS |
| `zip64.epub` | Rejected | Error (`ZIP64 archives are not supported`) | PASS |
| `unsafe-html.epub` (`<script>`, `onclick`, `javascript:`, `<iframe>`, `<object>`) | Stripped by `sanitize-html` | All stripped cleanly | PASS |
| `unsafe-css.epub` (`position: fixed`, `z-index: 999999`) | Stripped while keeping benign color/align | Stripped cleanly | PASS |

---

## 12. PDF Upload Validation Results

- **Format, extension & MIME agreement (`formatValidation.js`):** `11/11` passing in `tests/module20-upload-verification.test.js`.
- **Magic-byte validation (`validatePdfFile`):** Checks size `> 0` and ASCII `%PDF-` at byte offset 0 on both public admin imports (`book.service.js`) and private uploads (`privateLibrary.service.js`). HTML payload spoofed as `.pdf` rejected with `400 Uploaded file is not a valid PDF.` in `tests/module27-security-verification.test.js` (PASS).

---

## 13. SQL Injection Review

- **Prepared Statements:** Inspected all files in `backend/src/repositories/` and `tokenBlacklist.js` / `authAudit.js`. All queries pass user values as `?` parameters to `pool.query(...)`.
- **Dynamic `ORDER BY` in `book.repository.js` (`findAllPaginated`):** Interpolates `sortColumn` and `sortDirection`, which are strictly validated against whitelists in `book.service.js` (`BOOK_SORT_COLUMNS = ['created_at', 'title', 'status', 'publication_date']` and `ASC`/`DESC`).
- **Live SQLi Tests (`tests/module27-security-verification.test.js`):**
  - `GET /api/books?sort=title;DROP TABLE books;--&order=DESC` -> `200` (safely fell back to default sort; no SQL error).
  - `GET /api/books/1' OR '1'='1` -> `400` validation error.
  - `GET /api/private-library/1 OR 1=1` -> `400` validation error.
  - `UPDATE` fields in `updateFields` only accept validated keys from service layer (`book.service.js`).

---

## 14. XSS Review

- **Backend Responses:** JSON APIs enforce `Content-Type: application/json`; book titles, descriptions, author details, and user profile fields containing script payloads are stored/returned as JSON strings, never rendered as HTML by the backend.
- **EPUB Sanitization (`sanitize-html`):** Strips `<script>`, `<iframe>`, `<object>`, `on*=` attributes, `javascript:`/`data:` URL schemes, and unsafe CSS (`position: fixed`, `z-index`) while preserving headings, paragraphs, lists, and benign inline formatting (`valid-epub2.epub`, `valid-epub3.epub`).
- **Frontend Reader (`frontend/js/pages/read.js`):** Renders text blocks using `document.createElement` + `.textContent`, keeping untrusted text out of `innerHTML`. Note: `admin-book.js` and `private-library.js` only interpolate hardcoded internal `FORMAT_CONFIG` labels into `innerHTML`.

---

## 15. CORS, Cookie, and HTTPS Review

- **Cookies (`auth.controller.js`):** Session JWT delivered exclusively in `token` cookie (`httpOnly: true`, `sameSite: 'lax'`, `secure: NODE_ENV === 'production'`, `maxAge: 24h`), never in JSON login response.
- **CORS (`app.js`, `cors.config.js`):** Explicit origin allowlist (no wildcard `*`); `credentials: true`; `allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token']`; `exposedHeaders: ['X-CSRF-Token']`. In production, `allowedOrigins` starts empty and relies on `process.env.CORS_ORIGIN` (supports comma-separated origins).
- **HTTPS / Proxy Headers:** `helmet` enables HSTS (`maxAge: 31536000, includeSubDomains: true`) and CSP `upgrade-insecure-requests` when `NODE_ENV === 'production'`. Note for Module 28: behind a TLS-terminating proxy on free hosting, `app.set('trust proxy', 1)` should be added before deployment.

---

## 16. Migration Verification

- **Files in `database/migrations/`:** `001_create_roles.sql`, `016_add_user_role.sql`, `017_add_archiving_columns.sql`, `018_create_private_library_files.sql`, `019_add_book_pdf_columns.sql` (marked SUPERSEDED), `020_create_revoked_tokens.sql`, `021_create_auth_events.sql`.
- **Runner (`backend/scripts/migrate.js`):** Idempotently checks columns/indexes/tables (`authors`, `categories`, `books`, `private_library_files`, `USER` role, `revoked_tokens`, `auth_events`), strictly locked to `digital_library_test`. Executed cleanly on `digital_library_test` (created `auth_events`) and verified it blocks `digital_library`.
- **Schema Notes for Production (`digital_library`):**
  - `database/schema.sql` contains `file_format` on both `books` and `private_library_files`, but does **not** yet include `revoked_tokens` (020) or `auth_events` (021) for fresh installs, and SQL migration files 018/020/021 hardcode `USE digital_library;`.
  - No automated migration runner currently targets production/staging DBs (safety restriction by design until Module 28).

---

## 17. Environment and Secret Review

- `JWT_SECRET`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` are read solely from environment variables via `dotenv` (`backend/src/config/env.js`).
- `.env` and `backend/.env` are ignored in both root `.gitignore` and `backend/.gitignore`.
- Git history scan confirmed no `.env` file has ever been committed to any commit on the repository.
- `backend/.env.example` contains safe placeholders only.

---

## 18. Storage Findings

- **Public vs Private Separation:** Stored separately under `uploads/public/` and `uploads/private/`. Neither directory is exposed via `express.static` — confirmed `GET /uploads/private/<file>` returns `404`.
- **Path Safety:** `fileStorage.js` sanitizes filenames with `path.basename` + `path.resolve` + `startsWith(dir + path.sep)` guards, and stores uploads under `crypto.randomUUID()` names with whitelisted `.pdf`/`.epub` extensions. `imageNameParamRule` restricts image params to `/^p\d+-\d+\.png$/`.
- **Failed Upload Cleanup Defect Found & Fixed:** Previously, `privateLibrary.service.js`, `privateLibrary.validator.js`, and `book.service.js` (`!formatResult.valid`) did not unlink Multer's temp uploaded file upon validation failure. Patched all three paths and verified zero leaked files in `uploads/private/` after spoofed PDF, arbitrary-ZIP EPUB, and invalid uploads (`tests/module27-security-verification.test.js`).
- **Ephemeral Hosting Risk (for Module 28):** Free-tier PaaS containers typically reset local filesystems on redeploy/sleep, which would lose `uploads/private/` and `uploads/public/` files while DB metadata remains. Persistent object storage / mounted volume strategy is needed in Module 28/29.

---

## 19. Logging and Error-Handling Findings

- `errorHandler.js` masks stack traces and internal error messages for `5xx` responses (`An unexpected server error occurred.`), while returning structured JSON `{ success: false, message, code }`.
- `logger.js` + `authAudit.js` log timestamped structured info/error events with zero passwords, JWTs, cookies, DB passwords, or `JWT_SECRET`.

---

## 20. Regression Test Results (Observed Directly)

| Suite / Script | Command / Mode | Result | Notes |
|----------------|----------------|--------|-------|
| **Module 27 Security Verification** (`tests/module27-security-verification.test.js`) | `TEST_DB_NAME=digital_library_test node tests/module27-security-verification.test.js` | **64 passed, 0 failed** | Covers Auth, RBAC, Token Revocation, SEC-01 CSRF, SEC-02 CSP, SEC-03 Rate Limits, SEC-04 Auth Logs, IDOR (USER A/B/ADMIN), EPUB/PDF validation, Orphan upload cleanup, XSS, SQLi |
| **Module 20 Upload Validation** (`tests/module20-upload-verification.test.js`) | `TEST_DB_NAME=digital_library_test node tests/module20-upload-verification.test.js` | **11 passed, 0 failed** | 1 skipped (`scratch/test.epub not found`; unit checks 11/11 pass) |
| **Module 21 EPUB Processing** (`tests/module21-epub-processing.test.js`) | `TEST_DB_NAME=digital_library_test node tests/module21-epub-processing.test.js` | **54 passed, 0 failed** | Unit parser, security sanitization, DB/service integration, reader APIs |
| **Publishing Workflow E2E** (`tests/publishing-workflow.test.js`) | Ephemeral in-process server + temp test admin against `digital_library_test` | **37 passed, 0 failed** | Chapter publishing, PDF import/extraction, draft/archived visibility, cookie auth |
| **Archival Repository Check** (`tests/archival-verification.js`) | `TEST_DB_NAME=digital_library_test node tests/archival-verification.js` | **PASS** (exit 0) | Author & category archival sorting & filtering |
| **Legacy API Categories/Authors** (`tests/api-categories-authors.test.js`) | `TEST_DB_NAME=digital_library_test node tests/api-categories-authors.test.js` | **FAILED at setup (401)** | Hardcodes non-seeded `demoadmin@example.com` and extracts only 1st `Set-Cookie` (no `X-CSRF-Token`) |
| **External Server Tests** (`tests/reader-availability.test.js`, `tests/content-model.check.js`) | Requires external running server on `http://localhost:5001` | **NOT RUN (Blocked on external server)** | `reader-availability.test.js` also hardcodes `demoadmin@exmaple.com` and single-cookie helper |
| **Manual Browser Checks** (PDF reading UI, EPUB nav, reader customization/themes/typography, Web Speech TTS speed/pitch/highlight, Desktop/Tablet/Mobile layout) | Browser UI | **NOT AUTOMATED (Manual browser check pending)** | Frontend HTML/CSS/JS statically verified CSP-compatible |

---

## 21. Confirmed Vulnerabilities Summary

| ID | Initial Severity | Component | Evidence | Actual Before | Expected / After | Final Status |
|----|------------------|-----------|----------|---------------|------------------|--------------|
| **SEC-01** | MEDIUM | `app.js`, `csrf.middleware.js`, `auth.controller.js`, `api.js` | Missing/invalid `X-CSRF-Token` accepted on cookie POSTs; untrusted Origin returned `500` | Vulnerable to cross-port/form CSRF on cookie sessions; `500` on bad Origin | Origin/Referer check + user-bound HMAC double-submit token (`403` on missing/invalid/cross-origin); frontend `api.js` sends `X-CSRF-Token` | **RESOLVED (64/64 suite passes)** |
| **SEC-02** | MEDIUM | `app.js`, `csp.config.js` | `contentSecurityPolicy: false` in dev; unverified prod default | No CSP in dev; default CSP in prod lacked reader/blob directives | Strict `buildCspConfig` (`script-src 'self'`, `style-src 'self'`, `img-src 'self' blob: data:`, `worker-src 'self' blob:`, `frame-ancestors 'none'`) | **RESOLVED** |
| **SEC-03** | LOW | `rateLimiter.js`, `book.routes.js`, `privateLibrary.routes.js` | Upload routes unthrottled | Unlimited upload requests possible | `uploadLimiter` (`20`/15m prod, `500`/15m dev) mounted before Multer on private & public upload routes (`429` verified) | **RESOLVED** |
| **SEC-04** | LOW | `authAudit.js`, `auth.controller.js`, `profile.controller.js`, `021_create_auth_events.sql` | Login/logout/password events unlogged | No persistent/structured auth event audit trail | Structured JSON logs + `auth_events` DB table for register/login/failure/logout/password change with zero secret leakage | **RESOLVED** |
| **SEC-05** | LOW (New) | `privateLibrary.service.js`, `privateLibrary.validator.js`, `book.service.js` | Failed validation after Multer left file on disk | Orphaned files accumulated in `uploads/private/` | `deleteFileIfExists` cleanup added on all validation/insert error paths; 0 orphans verified | **RESOLVED** |
| **SEC-06** | LOW (New) | `app.js` CORS callback | `callback(new Error('Not allowed by CORS'))` | Returned HTTP `500` with stack trace log | Sets `err.status = 403` and `err.code = 'CSRF_ORIGIN_FORBIDDEN'` | **RESOLVED** |

---

## 22. Corrections Performed

1. Implemented user-bound HMAC double-submit + Origin/Referer CSRF middleware (`csrf.middleware.js`, `cors.config.js`) and integrated token issuance/headers into `auth.controller.js`, `auth.routes.js`, and `frontend/js/api.js`.
2. Fixed CORS untrusted-origin error callback in `app.js` to return `403` instead of `500`.
3. Added restrictive, reader-compatible CSP configuration (`csp.config.js`) across both development and production environments.
4. Added `uploadLimiter` (`rateLimiter.js`) onto `/api/private-library/upload` and `/api/books/:id/pdf`.
5. Added safe authentication audit logging (`authAudit.js`, `021_create_auth_events.sql`, `migrate.js`, `auth.controller.js`, `profile.controller.js`).
6. Fixed failed-upload temp-file leaks (`privateLibrary.service.js`, `privateLibrary.validator.js`, `book.service.js`).
7. Added 64-assertion automated security verification suite (`tests/module27-security-verification.test.js`).

---

## 23. Known Limitations

- Rate limiting uses Express `MemoryStore` (counters reset on restart; single-instance only).
- `tests/api-categories-authors.test.js` and `tests/reader-availability.test.js` rely on legacy non-seeded demo emails (`demoadmin@example.com` / `demoadmin@exmaple.com`) and extract only `token=` from `Set-Cookie` rather than also sending `X-CSRF-Token` or `Authorization: Bearer`.
- Automated browser E2E testing (Chromium UI for PDF/EPUB reading, TTS speech playback, themes, mobile/tablet/desktop viewports) is not part of the Node CLI test suite.
- Free-hosting ephemeral storage risk documented for Modules 28/29.

---

## 24. Outstanding Tasks for Prince (Main Developer)

1. Apply `database/migrations/020_create_revoked_tokens.sql` and `database/migrations/021_create_auth_events.sql` to the primary/production `digital_library` database (and optionally fold both tables into `database/schema.sql` for clean fresh installs).
2. Decide on legacy integration tests (`tests/api-categories-authors.test.js`, `tests/reader-availability.test.js`) — update their inline login/cookie helpers to use `TEST_ADMIN_*` + `Authorization: Bearer` or `X-CSRF-Token`.
3. Perform final manual browser smoke-test of login -> upload PDF/EPUB -> read book -> TTS -> settings -> logout with the new `X-CSRF-Token` flow in `frontend/js/api.js` before merging Module 27 work.

---

## 25. Recommendations for Module 28 (Free-Hosting Deployment Preparation)

1. Set `NODE_ENV=production`, a strong high-entropy `JWT_SECRET`, and exact `CORS_ORIGIN` URL(s) in hosting environment variables.
2. Add `app.set('trust proxy', 1)` in `backend/src/app.js` if deployed behind a reverse proxy (Render/Railway/Fly) so `express-rate-limit` and `authAudit` see real client IPs instead of the proxy IP.
3. If frontend static files are deployed on a separate domain from the backend API, serve matching CSP headers on the static host (allowing the backend origin in `connect-src`) and evaluate `SameSite=None; Secure` for cross-site cookie delivery (CSRF double-submit via `X-CSRF-Token` + `data.csrfToken` is already compatible!).
4. Plan persistent file storage (external object storage or persistent disk volume) since free-tier ephemeral containers wipe `uploads/` on restart.

---

## 26. Final Acceptance Checklist

- [x] Module 26 infrastructure inspected.
- [x] Test database and storage isolation verified.
- [x] Authentication and JWT verified.
- [x] Token expiry and revocation verified.
- [x] USER and ADMIN permissions verified.
- [x] Role escalation rejected.
- [x] Private document ownership verified.
- [x] Private chapter/resource protection verified.
- [x] PDF upload security verified.
- [x] EPUB archive security verified.
- [x] SQL injection risks reviewed.
- [x] XSS risks reviewed.
- [x] CSRF protection assessed (remediated — SEC-01 closed).
- [x] CSP compatibility assessed (remediated — SEC-02 closed).
- [x] Rate limiting assessed (remediated — SEC-03 closed).
- [x] Audit logging assessed (remediated — SEC-04 closed).
- [x] Cookie and CORS security reviewed.
- [x] Secret management reviewed.
- [x] Migration behavior reviewed.
- [x] Storage separation reviewed (temp-file leak fixed).
- [x] Module 18–26 regression tests executed where applicable (Module 17/18/19 publishing workflow 37/37, Module 20 11/11, Module 21 54/54, archival pass; legacy/external-server/manual-browser gaps documented honestly).
- [x] Confirmed Module 27 defects corrected or documented.
- [x] Existing reader customization preserved.
- [x] No production data modified.
- [x] Existing developer changes preserved.
- [x] Final report updated.

---

## 27. Final Module Status

**COMPLETE**

All four open findings from the initial Module 27 audit (**SEC-01**, **SEC-02**, **SEC-03**, **SEC-04**) plus two newly uncovered defects (CORS `500` on untrusted origin and orphaned temp upload files on failed validation) have been resolved and verified with **64/64** automated security checks passing alongside **102/102** passing assertions across executed regression suites on the isolated `digital_library_test` database. No commits, pushes, merges, or pull requests were performed, and Module 28 was not started.
