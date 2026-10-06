# Digital Library — Codebase Analysis

**Date:** 2026-07-09
**Scope:** Full repository read-through (`~/digital-library`) — backend, frontend, database, docs, tests, tooling.
**Authority note:** Findings below come from the source code and filesystem, not from the docs. Where docs and code disagree, the code is stated as fact and the doc drift is flagged.

---

## 1. What the project actually is

| Layer | Reality (verified in files) |
|---|---|
| Frontend | Multi-page HTML + vanilla ES modules. No framework, no bundler. 11 pages, 6,512 LOC of JS/HTML. |
| Backend | Express 5, layered: routes → controllers → services → repositories → MySQL pool. 58 files, 2,675 LOC. |
| Database | MySQL. 15 tables in `database/schema.sql`, 4 migrations (`001`, `016`, `017`, `018`). |
| Auth | JWT in HttpOnly cookie, bcrypt, in-memory token blacklist, role check (`ADMIN`/`USER`). |
| Storage | Local disk: `uploads/private/*.pdf` (multer, UUID filenames, 10 MB default cap). |
| Tests | 2 standalone Node scripts, no framework, no runner. |
| Repo state | No root `package.json`. Git not on PATH in this shell; no working tree status available. |

Verified feature set: auth (register/login/logout/me), profile + password change, authors CRUD, categories CRUD, books CRUD + publish/archive, book↔author and book↔category relations, chapters CRUD + reorder + publish/archive, public visibility rule (PUBLISHED only for non-admins, hidden content returns 404), private PDF library (upload/list/get/stream/delete), online reader (themes, fonts, width, auto-scroll, resume banner, progress bar).

---

## 2. High-severity findings

### 2.1 Public library is not public
Every content route requires authentication:

- `backend/src/routes/book.routes.js:23` → `router.get('/', requireAuth, ...)`
- same pattern in `author.routes.js`, `category.routes.js`, `chapter.routes.js`

Yet `docs/api/books.md:7`, `authors.md:7`, `categories.md:7`, `chapters.md:7` all say **"Auth Required: No"**. The frontend pages `library.html` and `book.html` are marked `data-access="public"` in `router.js`, so an anonymous visitor reaches the page, the API call 401s, and they see an error state.

**Decide one way and align all three layers:** make the read routes genuinely public (drop `requireAuth` on GET, keep the `bookVisibility` PUBLISHED filter), or mark those pages `data-access="auth"` and fix the API docs.

### 2.2 Search and category filter are client-side and mislabeled
`frontend/js/pages/library.js`:
- `matchesSearch()` (line 357) filters only the **current page** of results — 12 books at a time.
- `filterByCategory()` (line 404) issues one `GET /books/:id/categories` **per book on the page** (N+1 requests) just to test membership.
- The summary text admits it: `"N matching books on this page"`.

The backend already has `findAllPaginated` with whitelisted `sortColumn`/`sortDirection` and a `status` filter. Add `search` (title/description LIKE) and `categoryId` to that query and move both filters server-side; the N+1 disappears with them.

### 2.3 Unauthenticated PDF path is only one flag deep
`GET /api/private-library/:id/file` is `requireAuth` + an ownership check inside the service — correct today. But the file is served from `uploads/private/`, which is excluded from git yet lives under the same static root if a static handler is ever added. Confirm in `app.js` that no `express.static('uploads')` exists and add a regression test that a second user gets 404 (not 403) for someone else's file.

### 2.4 Token blacklist is in-memory
`backend/src/utils/tokenBlacklist.js` holds revoked tokens in a process Map. Logout does not survive a server restart, and it will not work across multiple instances. Acceptable for V1 single-process, but it must be named in `docs/05-security/` as a known limitation rather than left implicit.

---

## 3. Medium-severity findings

### 3.1 Documentation is not describing this codebase
- `docs/06-development/module-status.md` is **truncated at line 53** — it ends mid-way through "Primary Repository" with an unclosed code fence and contains no module list at all. It is the document that is supposed to be the central status record.
- `docs/module-status.md` (root copy) contains a single line: `Module 13: Online Reader & Reader Customization (Completed)`.
- `docs/06-development/changelog.md` and `docs/06-development/decisions.md` contain only template/boilerplate text — no real entries.
- The **Private Library** feature (backend routes, controller, service, repository, validator, upload middleware, two frontend pages) appears **nowhere in `docs/`**. Only `docs/security/content-model.md:5` mentions it, calling it "a separate future feature (Module 12)" — which is now stale, since it ships.
- `docs/testing/testing-guide.md` describes Module 8 only and its Module 13 line is mojibake (`Run \ ode tests/reader.check.js\`).

### 3.2 Duplicate and dead code
- `backend/src/middleware/authMiddleware.js` (Bearer-header `authenticateToken`) is imported only by `middleware/index.js`, which nothing else imports. Both files are dead. Delete them or route everything through them — two auth middlewares in one repo invites the wrong one being used later.
- `backend/src/config/db.config.js` vs `database.js` is fine (config vs pool), but `db.config.js` calls `dotenv.config()` itself, so env loading happens in two places.

### 3.3 `.env` hygiene
- `CORS_ORIGIN` is defined **twice** (lines 12 and 13). Only the last wins — silently, and it happens to be correct, which is worse.
- `JWT_REFRESH_SECRET` is set but nothing reads it; there is no refresh flow.
- `backend/.env` is present on disk. Confirm it is git-ignored and that no commit ever carried it (`git log -p -- backend/.env`).

### 3.4 Test suite is not a suite
`tests/content-model.check.js` and `tests/reader.check.js` are good manual scripts (the content-model one covers ~40 authorization assertions and is the most valuable asset in the repo), but:
- no `npm test`, no runner, no CI;
- they require a live server, a seeded admin, and they hit the login rate limiter (the file itself warns: ~6 of 10 attempts per 15 min);
- `reader.check.js` mixes filesystem assertions with live-API assertions in one flow.

**Minimum fix:** a root `package.json` with `"test": "node tests/run-all.js"`, a runner that starts the server, waits for `/api/health/db`, runs each script, and reports a single pass/fail exit code.

### 3.5 Repository junk
- `gh.zip` (3.5 MB, empty listing) and `digital-library-module8-review.zip` (49 KB) are committed.
- `module8-review/` and `.kilo/worktrees/well-allium/` are full duplicate copies of the backend/frontend tree inside the repo — the `.gitignore` excludes `gh.zip` and `/module8-review/`, but the working tree still carries them and they will confuse any grep or refactor.
- `update_book_js.py` is corrupted: its replacement string contains mojibake and broken template literals (`Chapter :`, `eader.html?bookId=`). It is a leftover patch script and should be deleted.
- Cookie files (`cookies.txt`, `admincookies.txt`, `sectest_cookies.txt`) are on disk and correctly git-ignored — but they hold live session tokens. Delete them when done testing.

---

## 4. Low-severity / polish

- `frontend/js/config.js` hardcodes `http://localhost:5000/api` and `http://localhost:3000`. Fine for the academic demo; one env-driven build step would make deployment honest.
- `book.js` has 242 lines and no pagination on chapters — acceptable.
- `frontend/404.html` is `data-access="public"`, good; `router.js` `getSafeReturnUrl()` correctly rejects cross-origin `next` values — that is a solid open-redirect defence worth keeping.
- Accessibility is above average for a student project: `reader.html` has `role="progressbar"` with `aria-valuenow`, `aria-modal` drawers, `aria-live` status regions, and labelled stepper buttons. Keep that standard on the private-library page, which is the weakest of the newer pages.
- `privateLibrary.validator.js` caps title at 255 and description at 1000; the upload middleware checks both extension **and** MIME — good. There is no magic-byte (`%PDF-`) check, so a renamed non-PDF with a spoofed content type passes. Cheap to add.

---

## 5. Suggested order of work

1. **Decide the public-read question** (§2.1) — it changes routes, router access flags, and five doc files at once, so it must be settled before anything else touches those files.
2. **Move search + category filtering server-side** (§2.2) — removes the N+1 and makes the "N books" count truthful.
3. **Write the real module-status table** (§3.1) covering Modules 1–13 plus Private Library and the reader, with an evidence column pointing at the test script that proves each one.
4. **Add a test runner + root `package.json`** (§3.4) so the two existing scripts become one command.
5. **Delete the dead middleware, the junk zips, `module8-review/`, the worktree copy, and `update_book_js.py`** (§3.2, §3.5).
6. **Clean `.env`** (§3.3) and document the in-memory blacklist as a V1 limitation (§2.4).
7. **Add the `%PDF-` magic-byte check** (§4).

---

## 6. One-line verdict

The code is in better shape than its documentation: the layering is consistent, authorization is enforced centrally through `bookVisibility`, and the content-model test script is genuinely strong — the project's real risk is that its status, changelog, and API docs describe a system that no longer exists, and that the two most visible user features (search, filtering) quietly only work within a single page of results.
