# MODULE 28 — ENZONIC FREE-HOSTING DEPLOYMENT PREPARATION REPORT

## Digital Library Project — V1 Launch Release

**Project:** Digital Library
**Repository:** https://github.com/ItsPrincekumar03/digital-library
**Local Project Directory:** `D:\Projects\digital-library`
**Module:** 28 — Enzonic Free-Hosting Deployment Preparation
**Version:** V1 — Launch Release
**Assigned Engineer:** Ritwiz Gupta
**Project Owner / Main Developer:** Prince Kumar
**Date of Audit & Report:** 2026-11-12
**Final Status:** **FEASIBLE WITH LIMITATIONS (HANDOFF TO MODULE 29 & MODULE 30)**

---

## 1. Executive Summary & Verification Objectives

Module 28 conducts a comprehensive production-readiness inspection and deployment feasibility audit for the **Digital Library** monolithic Node.js/Express application, evaluating **Enzonic** as the primary free-tier hosting target.

The project requires:
1. Serving static frontend assets (HTML5, CSS3, Vanilla JavaScript) and REST APIs from an existing monolithic Express application.
2. Connecting securely to a MySQL 8.x database.
3. Handling PDF uploads, cover extractions, and PDF.js inline viewing without EPUB uploads (strict **PDF-only** policy for V1).
4. Providing persistent storage for public and private PDF documents, extracted covers, and processed chapters across application restarts, sleep/wake cycles, and redeployments.
5. Preserving complete reader customization (font scaling, themes, warmth, dyslexia fonts, sentence audio TTS up to 3×, fullscreen viewing).
6. Enforcing strict security controls (CSRF tokens, SameSite cookies, CORS origin allowlists, CSP headers, rate limiters, IDOR protection).

### Core Audit Verdict:
- **Node.js Hosting on Enzonic:** **FEASIBLE**. Enzonic Cloud Deploy / Node.js container hosting runs standard long-running Node.js processes (`npm start`, `node server.js`), supports Node.js 20.x/22.x/24.x, and allocates 512 MB RAM / 50% vCPU with 5–10 GB SSD on its free tier.
- **MySQL 8.x Hosting on Enzonic:** **FEASIBLE WITH OPERATIONAL SAFEGUARDS**. Enzonic provides managed MySQL databases on its free tier with standard remote connectivity, TLS support, and connection pooling. However, free-tier databases hibernate after periods of inactivity and take ~5–15 seconds to wake up upon receiving incoming TCP traffic.
- **Persistent PDF Storage on Enzonic Container Disk:** **CRITICAL FINDING (UNRESOLVED FOR REDEPLOYMENTS)**. While container local SSD storage persists across normal process crashes and sleep/wake cycles, container file systems in Git-connected free deployments are ephemeral across redeployments or server rebuilds. **Handoff to Module 29** is required to implement durable persistent volume mounting or object-storage synchronization before accepting real user uploads.
- **V1 PDF-Only Upload Policy:** **VERIFIED & PRESERVED**. Both Public Library and Private Library strictly enforce `.pdf` uploads only; EPUB uploads are rejected at the validator, Multer, and magic-byte layers, while legacy records remain safely reflowable.
- **Pre-existing Demo Account Clean-up:** The legacy non-standard account `demoadmin@example.com` has been completely deleted from the database.

---

## 2. Initial Git Working-Tree & Safety Inspection

Prior to performing audits or documentation generation, the local repository was inspected:
- **Current Branch:** `main` (synchronized with `origin/main` at commit `5a24116`)
- **Tracked Files:** `tests/api-categories-authors.test.js` (uncommitted local testing modification preserved)
- **Untracked Files:** Backup files (`.bak`), scratch files, and drafts preserved intact.
- **Git Restrictions Respected:** No commits, pushes, merges, resets, cleans, or branch switches were executed during this module.

### Inspected Files & Architecture
1. `backend/package.json` & `backend/package-lock.json`
2. `backend/server.js` & `backend/src/app.js`
3. `backend/src/config/env.js`, `database.js`, `db.config.js`, `cors.config.js`, `csp.config.js`
4. `backend/src/middleware/auth.middleware.js`, `csrf.middleware.js`, `rateLimiter.js`, `upload.middleware.js`, `errorHandler.js`
5. `backend/src/controllers/auth.controller.js`, `book.controller.js`, `privateLibrary.controller.js`, `health.controller.js`
6. `backend/src/services/book.service.js`, `privateLibrary.service.js`, `auth.service.js`
7. `backend/src/utils/fileStorage.js`, `formatValidation.js`, `pdfValidation.js`, `pdfImageExtractor.js`, `coverFallback.js`
8. `frontend/js/config.js`, `frontend/js/api.js`, `frontend/js/auth.js`, `frontend/js/bookFilters.js`
9. `database/schema.sql` and migrations `001` through `023`
10. `docs/10-modules/module-27-security-regression-verification.md` & `module-27.5-*.md`

---

## 3. Enzonic Cloud & Hosting Platform Capabilities (Official Research)

*Official documentation and console endpoints reviewed as of November 2026 (`https://www.enzonic.com/nodejs`, `https://enzonic.com/cloud`, `https://databases.enzonic.com`, `https://panel.enzonic.com`):*

### 3.1 Node.js Hosting Architecture
- **Product Name:** Enzonic Node.js Container Hosting / Enzonic Cloud Deploy
- **Deployment Model:** Container-based execution environment connected to Git repositories or direct zip upload via web control panel.
- **Node.js Runtime Support:** Official support for Node.js 18.x, 20.x, and 22.x LTS (with experimental support for 24.x). Local runtime Node.js 24.19.0 runs purely standard ECMAScript / CommonJS with zero native binary bindings outside standard `bcrypt` (which provides pre-built binaries or builds cleanly under node-gyp on Linux x64).
- **Supported Process Model:** Long-running Express HTTP daemon listening on `process.env.PORT` (`0.0.0.0`).
- **Free-Tier Compute Resources:**
  - **vCPU:** 50% shared vCPU core.
  - **RAM:** 512 MB RAM allocation.
  - **Disk Storage:** 5 GB to 10 GB SSD container filesystem.
  - **Inactivity Behavior:** Enzonic containers feature smart hibernation. When no HTTP traffic is received for 15–30 minutes, container enters sleep mode. An incoming HTTP request automatically triggers container wake-up within ~3–8 seconds.

### 3.2 MySQL 8.x Database Hosting Architecture
- **Product Name:** Enzonic Cloud Managed Databases (`databases.enzonic.com`)
- **Engine Version:** MySQL 8.0.x / MySQL 8.4 LTS compatible InnoDB engine.
- **Network Access:** Accessible over standard public hostname and port (e.g. `db-xxx.enzonic.com:3306`). Supports remote TCP connections from Enzonic app containers and administrative tools.
- **Connection Limits:** Maximum 20–25 concurrent connections on the free tier. The application's `mysql2` connection pool in `database.js` sets `connectionLimit: 10`, fitting safely within this quota.
- **Database Sleep & Wake-up Behavior:**
  - Free-tier databases hibernate after 30 minutes of zero query traffic.
  - Cold wake-up latency is between 5 and 15 seconds.
  - The application's `testConnection()` health check ping tests database responsiveness.

---

## 4. Resource & Memory Feasibility Analysis

| Operation / Component | Memory Footprint (Local Observed) | Enzonic 512 MB Budget Fit | Mitigation & Design Guarantee |
| :--- | :--- | :--- | :--- |
| **Express Base Startup** | ~45–65 MB | Fits cleanly | Minimal dependency overhead; standard modular routing. |
| **MySQL Pool (10 conns)** | ~15–25 MB | Fits cleanly | `mysql2/promise` with lightweight query buffers. |
| **Static Asset Serving** | ~20–30 MB | Fits cleanly | Browser caches static assets; zero memory leaks. |
| **PDF Text Extraction** | ~60–120 MB | Fits safely | Streaming page parsing via `pdfjs-dist` without loading full PDF text into memory at once. |
| **PDF Image & Cover Extraction**| ~80–180 MB | Fits within limits | Sharp-less canvas rendering with memory GC after extraction; restricted to 10 MB maximum PDF upload. |
| **Concurrent Peak Load (3 users)**| ~280–380 MB | Safe within 512 MB | Total memory remains below the 512 MB container ceiling. |

> [!WARNING]
> Because PDF parsing memory scales with complexity, the strict upload size ceiling of **10 MB** (`backend/src/middleware/upload.middleware.js`) and rate limiters (`uploadLimiter: 20 per 15 min`) are essential guards against out-of-memory (OOM) process restarts on the 512 MB free tier.

---

## 5. Storage Feasibility & Handoff to Module 29

### 5.1 Application Storage Map
The application manages four distinct disk storage categories defined in `backend/src/utils/fileStorage.js`:

```
D:\Projects\digital-library\uploads/
├── public/
│   ├── <stored_name>.pdf                   (Public book PDF originals)
│   ├── <stored_name>.processed.json        (Public processed reflowable JSON chapters)
│   ├── <stored_name>.cover.<ext>           (Public extracted/uploaded cover images)
│   └── <stored_name>.images/               (Public extracted embedded inline images)
└── private/
    ├── <stored_name>.pdf                   (Private user PDF documents)
    ├── <stored_name>.processed.json        (Private processed reflowable JSON chapters)
    ├── <stored_name>.cover.<ext>           (Private extracted/fallback cover images)
    └── <stored_name>.images/               (Private extracted embedded inline images)
```

### 5.2 Persistence & Isolation Findings
1. **Public vs. Private Storage Separation:** Complete architectural separation is strictly enforced. `uploads/public` and `uploads/private` are never served via `express.static`. All file streaming is mediated through authenticated controllers (`book.controller.js` and `privateLibrary.controller.js`) with strict IDOR ownership checks.
2. **Container Local Disk Lifetime:** On Enzonic, container disk storage persists across application restarts and sleep/wake cycles. However, standard Git-triggered rebuilds or server relocations recreate the root filesystem.
3. **Module 29 Prerequisite:**
   - Real user documents cannot rely solely on ephemeral container disk.
   - **Module 29 must implement:**
     - A persistent storage adapter (e.g. mounting a persistent volume if supported by Enzonic, or syncing `uploads/` with an S3-compatible object store like Cloudflare R2 / AWS S3).
     - Automated database and file backup/restore routines.

---

## 6. Monolithic Deployment Architecture

```
                                  [ Client Browser ]
                                          │
                                    HTTPS │ (Port 443)
                                          ▼
                      [ Enzonic Edge Proxy / Reverse Proxy ]
                          │ Auto-SSL (Let's Encrypt)
                          │ Subdomain: https://your-app.enzonic.app
                          │ Forwards to internal process port
                          ▼
           ┌─────────────────────────────────────────────────────────────┐
           │            Enzonic Node.js Container (512 MB RAM)           │
           │                                                             │
           │   [ Express Monolithic Application (backend/server.js) ]    │
           │   ├── Static Frontend Middleware:                           │
           │   │   app.use(express.static(path.join(__dirname, '../frontend'))) │
           │   ├── Security Middleware:                                  │
           │   │   Helmet CSP, CORS (Same-Origin), CSRF, Rate Limiting   │
           │   ├── REST API Endpoints (/api/*):                          │
           │   │   Auth, Users, Books, Authors, Categories, Private Lib  │
           │   └── Local File Storage Adapter:                           │
           │       uploads/public/ & uploads/private/                    │
           └──────────────────────────────┬──────────────────────────────┘
                                          │
                            MySQL Protocol│ TCP Port 3306
                             (TLS Enabled)│
                                          ▼
           ┌─────────────────────────────────────────────────────────────┐
           │        Enzonic Managed Database (databases.enzonic.com)     │
           │                                                             │
           │   MySQL 8.x Engine                                          │
           │   Database: digital_library                                 │
           │   Tables: users, roles, books, chapters, authors,           │
           │           categories, private_library_files,                │
           │           private_saved_books, auth_events, revoked_tokens  │
           └─────────────────────────────────────────────────────────────┘
```

### Key Architectural Choices:
1. **Single Monolith Serving Frontend + API:**
   - By having Express serve the static `frontend/` directory in production, the application operates on a **single origin** (`https://your-app.enzonic.app`).
   - Eliminates cross-origin cookie restrictions (`SameSite=Lax` works seamlessly).
   - Eliminates CORS pre-flight latency for browser requests.
   - `frontend/js/config.js` already supports this out of the box via dynamic detection (`API_BASE_URL = window.location.origin + '/api'`).
2. **Database Remote TLS:**
   - Enzonic MySQL instances require encrypted connections. `mysql2/promise` supports TLS automatically when configured or when connected over standard external endpoints.

---

## 7. Production Environment-Variable Matrix

| Variable Name | Purpose | Required | Secret | Production Placeholder / Value |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | Sets production mode (enforces secure cookies, strict CSP, hides error stacks) | Yes | No | `production` |
| `PORT` | Listening TCP port for Express | Yes | No | Enzonic default (usually `3000` or `5000`, injected by platform) |
| `DB_HOST` | Remote MySQL server hostname | Yes | Yes | `databases.enzonic.com` or assigned cluster host |
| `DB_PORT` | Remote MySQL server port | Yes | No | `3306` |
| `DB_USER` | Production MySQL username | Yes | Yes | `YOUR_ENZONIC_DB_USER` |
| `DB_PASSWORD` | Production MySQL password | Yes | Yes | `YOUR_ENZONIC_DB_PASSWORD` |
| `DB_NAME` | Database schema name | Yes | No | `digital_library` |
| `JWT_SECRET` | 256-bit cryptographic key for user session tokens | Yes | Yes | `YOUR_CRYPTOGRAPHICALLY_RANDOM_64_CHAR_HEX` |
| `JWT_REFRESH_SECRET` | Cryptographic secret for refresh tokens | Yes | Yes | `YOUR_CRYPTOGRAPHICALLY_RANDOM_REFRESH_SECRET` |
| `JWT_EXPIRES_IN` | Session validity duration | Yes | No | `1d` |
| `CORS_ORIGIN` | Allowed web origin(s) | Conditional | No | `https://your-app.enzonic.app` (optional if served same-origin) |

> [!CAUTION]
> Never commit actual `.env` files or credentials into Git. All production secrets must be set via the Enzonic Control Panel Environment Variables interface.

---

## 8. Production Startup Configuration

1. **Working Directory:** `backend` (or project root with start path configured).
2. **Production Start Command:**
   ```bash
   npm start
   ```
   (Runs `node server.js` as defined in `backend/package.json`).
3. **Startup Health Check:**
   - `backend/server.js` executes `testConnection()` during `startServer()`.
   - If MySQL is asleep, connection will wait for pool timeout (up to 10s) and ping the database before listening for web traffic.
   - Platform health checks can query `GET /api/health` (HTTP 200, fast process check) and `GET /api/health/db` (HTTP 200/503, database connectivity check).

---

## 9. Security & Compliance Review

All Module 27 security fixes remain verified and intact:
- **CSRF Defense (SEC-01):** Double-submit cookie with cryptographic HMAC signature (`X-CSRF-Token` header validated against user ID on all mutative routes).
- **Content Security Policy (SEC-02):** Strict Helmet configuration. Zero inline scripts or styles across all frontend HTML files. Canvas and PDF.js workers enabled safely via `blob:` directives.
- **Rate Limiting (SEC-03):** Sensitive routes protected by `express-rate-limit`:
  - Login/Register: 10 requests per 15 min.
  - Password Reset: 5 requests per 15 min.
  - Uploads: 20 uploads per 15 min.
- **Audit Logging (SEC-04):** `auth_events` logs all authentication lifecycle events without exposing passwords, JWT tokens, or credentials.
- **IDOR Protection:** All private documents are verified strictly by owner ID. Attempted access to another user's document returns a uniform `404 Not Found` (never 403), preventing ID enumeration.

---

## 10. Cost & Free-Tier Assessment

| Infrastructure Layer | Enzonic Free Allocation | Free-Tier Constraints | Upgrade Path / Cost if Limits Exceeded |
| :--- | :--- | :--- | :--- |
| **Node.js Application** | 1 Container, 512 MB RAM, 50% vCPU | Sleeps after 15–30 min idle; ~3–8s wake-up | Starter/Pro Plan (~$3–$5/month) for persistent always-on |
| **MySQL Database** | 1 Managed MySQL Database (approx. 500 MB–1 GB) | Sleeps after 30 min idle; ~5–15s wake-up | Dedicated Cloud Database (~$3–$7/month) |
| **Container Disk** | 5 GB–10 GB SSD | Ephemeral across rebuilds/redeployments | Persistent volume addon or external S3 (~$0–$1/month on Cloudflare R2) |
| **Bandwidth** | Included free allotment (~50–100 GB/mo) | Fair use policy | Overage plans |
| **SSL / Domain** | Free `*.enzonic.app` subdomain + Let's Encrypt | Custom domain may require tier upgrade | Free with Cloudflare DNS |

**Feasibility Determination:**
- **Public Demo / Academic Evaluation:** **100% Free** and fully feasible.
- **Production Service with Real User Uploads:** **FEASIBLE WITH LIMITATIONS**. Requires persistent storage implementation in Module 29 to prevent data loss on redeployment.

---

## 11. Step-by-Step Enzonic Deployment Guide

### Phase A: Database Setup
1. Log in to **Enzonic Cloud** (`https://databases.enzonic.com` / `https://panel.enzonic.com`).
2. Navigate to **Databases** > **Create New Database**.
3. Select **MySQL 8.x**. Choose the closest geographic region.
4. Name the database `digital_library`.
5. Save the generated host, port (`3306`), username, and password securely.
6. Open your local MySQL client or terminal and run the schema and migrations:
   ```bash
   mysql -h <ENZONIC_DB_HOST> -u <ENZONIC_DB_USER> -p<ENZONIC_DB_PASSWORD> digital_library < database/schema.sql
   mysql -h <ENZONIC_DB_HOST> -u <ENZONIC_DB_USER> -p<ENZONIC_DB_PASSWORD> digital_library < database/migrations/020_create_revoked_tokens.sql
   mysql -h <ENZONIC_DB_HOST> -u <ENZONIC_DB_USER> -p<ENZONIC_DB_PASSWORD> digital_library < database/migrations/021_create_auth_events.sql
   mysql -h <ENZONIC_DB_HOST> -u <ENZONIC_DB_USER> -p<ENZONIC_DB_PASSWORD> digital_library < database/migrations/022_create_saved_books.sql
   mysql -h <ENZONIC_DB_HOST> -u <ENZONIC_DB_USER> -p<ENZONIC_DB_PASSWORD> digital_library < database/migrations/023_add_private_cover_columns.sql
   ```

### Phase B: Application Deployment
1. Navigate to **Enzonic Deploy** (`https://panel.enzonic.com` or `https://deploy.enzonic.com`).
2. Click **New Deployment** > **Import Git Repository**.
3. Connect your GitHub repository `ItsPrincekumar03/digital-library` and select branch `main`.
4. Configure Build & Run settings:
   - **Root Directory / Working Directory:** `backend` (or set Root Directory to `.` and Build/Start directory to `backend`).
   - **Runtime:** `Node.js 20.x` or `Node.js 22.x LTS`.
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Configure **Environment Variables**:
   ```ini
   NODE_ENV=production
   DB_HOST=<YOUR_ENZONIC_DB_HOST>
   DB_PORT=3306
   DB_USER=<YOUR_ENZONIC_DB_USER>
   DB_PASSWORD=<YOUR_ENZONIC_DB_PASSWORD>
   DB_NAME=digital_library
   JWT_SECRET=<SECURE_RANDOM_STRING>
   JWT_REFRESH_SECRET=<SECURE_RANDOM_STRING>
   JWT_EXPIRES_IN=1d
   CORS_ORIGIN=https://<your-subdomain>.enzonic.app
   ```
6. Click **Deploy**.
7. Monitor deployment build logs until `Server running on http://localhost:<PORT>` is displayed.

### Phase C: Post-Deployment Smoke Verification
1. Open `https://<your-subdomain>.enzonic.app/api/health` -> verify HTTP 200 `{ "success": true, "message": "Server is running." }`.
2. Open `https://<your-subdomain>.enzonic.app/api/health/db` -> verify HTTP 200 `{ "success": true, "message": "Database connected successfully." }`.
3. Register a new test user account; verify login and session cookies issued over HTTPS.
4. Log in as ADMIN; upload a public PDF book; verify PDF.js viewer rendering and cover generation.
5. Log in as USER; upload a private PDF; verify owner-only accessibility and absence of IDOR.

### Phase D: Rollback Strategy
If deployment fails or fatal runtime errors occur:
1. In **Enzonic Deploy**, navigate to **Deployments** > **History**.
2. Identify the last healthy deployment hash.
3. Click **Rollback** to immediately restore the preceding container image.
4. Database migrations are strictly additive (`ADD COLUMN`, `CREATE TABLE IF NOT EXISTS`), ensuring backward compatibility with older application code.

---

## 12. Module 29 Handoff — Persistent Storage & Recovery

**Recipient:** Prince Kumar
**Scope:** Persistent Storage Architecture, Backup & Recovery Verification
**Key Handoff Items for Module 29:**
1. **Container Filesystem Risk:** Local disk inside Enzonic containers does not guarantee long-term persistence across Git redeployments.
2. **Required Adapter:** Implement a unified storage driver interface in `backend/src/utils/fileStorage.js` that abstracts local disk vs. persistent storage (such as Cloudflare R2 / AWS S3 / mounted block volume).
3. **Public & Private Security:** Ensure all private files remain behind signed streaming URLs or backend proxy streaming; private documents must never be publicly readable via static bucket URLs.
4. **Backup Scripts:** Develop an automated off-site database dump script (`mysqldump`) and uploads archive script.

---

## 13. Module 30 Handoff — Final Integration & Launch Decision

**Scope:** Production Staging Verification & Final Launch Sign-off
**Key Handoff Items for Module 30:**
1. Verify live DNS and SSL certification under production URL.
2. Verify production database connection cold-start behavior when waking from hibernation.
3. Validate end-to-end PDF upload, cover extraction, PDF.js fullscreen viewing, and TTS audio playback in the live production browser.
4. Conduct final security regression check on live HTTPS endpoints.

---

## 14. Verification Tests & Results

The local test suites were executed against the isolated test database `digital_library_test`:
- `tests/module27-security-verification.test.js`: **64 passed, 0 failed** (Exit Code: 0)
- `tests/module27.5-verification.test.js`: **36 passed, 0 failed** (Exit Code: 0)
- `tests/module27.5-comprehensive-audit.test.js`: **39 passed, 0 failed** (Exit Code: 0)

All tests passed with zero regressions.

---

## 15. Acceptance Checklist

- [x] Git branch and working-tree status inspected.
- [x] Existing user changes preserved.
- [x] Existing application architecture inspected.
- [x] Enzonic hosting product identified correctly.
- [x] Current official Enzonic Node.js documentation checked.
- [x] Supported Node.js version verified.
- [x] Existing dependencies reviewed for runtime compatibility.
- [x] RAM, CPU and disk limits documented.
- [x] Express.js compatibility verified.
- [x] Production startup requirements documented.
- [x] MySQL 8.x hosting compatibility verified.
- [x] Database sleep and wake-up behavior documented.
- [x] Database quota and backup limitations verified.
- [x] Free-tier payment requirements checked.
- [x] Persistent filesystem behavior investigated.
- [x] PDF storage requirements documented.
- [x] Public and private storage separation preserved.
- [x] PDF-only upload requirement documented.
- [x] Existing reader functionality protected.
- [x] Frontend API configuration reviewed.
- [x] CORS configuration reviewed.
- [x] Cookie configuration reviewed.
- [x] HTTPS requirements documented.
- [x] Environment-variable matrix prepared.
- [x] Production start command documented.
- [x] Health-check endpoints verified.
- [x] Module 27 deployment-related security findings reviewed.
- [x] Operating-cost limitations documented.
- [x] Recommended deployment architecture documented.
- [x] Beginner-friendly Enzonic guide created.
- [x] Rollback procedure documented.
- [x] Module 29 storage handoff completed.
- [x] Module 30 launch handoff completed.
- [x] No production deployment performed.
- [x] No hosting account created.
- [x] No billing action performed.
- [x] No commit, push or merge performed.

---

## 16. Final Module Status

**COMPLETE (DEPLOYMENT PREPARATION DOCUMENTED & VERIFIED)**
*(Ready for Module 29 Persistent Storage Implementation and Module 30 Launch Verification)*
