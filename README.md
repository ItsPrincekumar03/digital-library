# Digital Library

A monolithic web application for managing a digital library.

## Backend Setup

1. Navigate to the backend folder:
   cd backend

2. Install dependencies:
   npm install

3. Copy the example env file and fill in your local MySQL credentials:
   cp .env.example .env

4. Create the MySQL database (if it doesn't exist):
   CREATE DATABASE digital_library;

### Development demo accounts

After creating the database and applying `database/schema.sql`, run from the `backend` folder:

    npm run seed:dev

This creates two local demo accounts. Use them only on your own machine.

| Role  | Login ID             | Password        |
|-------|----------------------|-----------------|
| ADMIN | demoadmin@example.com | Demoadmin@123  |
| USER  | demouser@example.com  | Demouser@123   |

The seed requires `NODE_ENV=development` in your `.env`, refuses to run in production, and never changes an existing account.

5. Start the server in development mode:
   npm run dev

6. Verify it's working:
   - http://localhost:5000/api/health         server check
   - http://localhost:5000/api/health/db      database connection check

## Features Implemented

* **Authentication:** JWT based registration, login, logout and profile check. Includes rate limiting.
* **Authorization:** Role based access control (ADMIN/USER), endpoint protection, and ownership checks.
* **Profile Management:** Users can update their profiles and change passwords.
* **Authors & Categories:** CRUD endpoints for authors and categories.
* **Books & Chapters:** CRUD endpoints for books and chapters, including chapter reordering.
* **Book Relationships:** Managing relations between books and authors/categories.
* **PDF Ingestion & Processing:** Automated extraction of PDF text and images into structured JSON documents using `pdfjs-dist`.
* **Private Library:** Isolated personal library document uploads and reading for registered users.
* **Modern Reader Engine:** Custom typography controls (live font size, line height, paragraph spacing), color themes (light, sepia, dark), responsive pagination.
* **Text-to-Speech (TTS):** Speech synthesis with synchronized sentence highlighting using the CSS Custom Highlight API, 4-icon audio playback bar, and 3-tab reader settings bottom sheet.

## Testing & Verification

Automated test suites can be run directly from the `backend` directory:
```bash
cd backend
npm test
```
The test suite covers:
1. Full end-to-end publishing workflow (`tests/publishing-workflow.test.js`) — 44 tests.
2. Reader availability and error responses (`tests/reader-availability.test.js`) — 29 tests.
3. Repository soft deletion and archival queries (`tests/archival-verification.js`).
4. Category and Author API endpoints (`tests/api-categories-authors.test.js`).

Additionally, the Postman collection `Digital Library API.postman_collection.json` is included at the root of the project to test all implemented APIs.
All APIs perform robust input validation, proper error handling, parameterization against SQL Injection, and return standardized JSON responses.

## Security Overview

* Passwords hashed using bcrypt.
* JWT for stateless session management with HttpOnly cookies and token blacklisting on logout.
* Prepared statements strictly used for all database queries to prevent SQL injection.
* Rate limiters implemented for authentication and sensitive routes to deter brute-forcing.
* Security headers managed via `helmet`.
* Upload limits and MIME type validation strictly enforced for PDF uploads.

## Documentation

Full architectural and technical documentation is available in the `docs/` directory:
- [Module Status](docs/module-status.md)
- [Architecture](docs/architecture.md)
- [Database Schema](docs/database.md)
- [Architecture Decisions (ADRs)](docs/decisions.md)
- [System Requirements](docs/requirements.md)
- [Security Guide](docs/security/README.md)
- [Testing Guide](docs/testing-plan.md)
- [Deployment Plan](docs/deployment-plan.md)
- [Changelog](docs/changelog.md)