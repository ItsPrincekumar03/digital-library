# Digital Library — AI Development Context

**Project:** Digital Library
**Project Type:** BTech Final-Year Project
**Release:** Version 1 (V1)
**Status:** Development and verification status must be established from current evidence.
**Document Purpose:** Provide consistent context and working rules for AI-assisted development.

---

## 1. Project Purpose

Digital Library is a web-based application designed to help users discover, access, manage, and read digital books and documents.

The application provides library catalogue management, chapter management, user authentication, role-based access, online reading, and related reading features.

It also includes a private PDF library intended to keep users' personal documents separate and accessible only to authorized owners.

The project is developed incrementally. A module being marked complete does not automatically establish that the complete application is integrated, tested, or ready for public deployment.

---

## 2. Approved Technology Stack

### Frontend
- HTML
- CSS
- Vanilla JavaScript

### Backend
- Node.js
- Express.js

### Database
- MySQL

### PDF Processing
- pdfjs-dist, where used by the current implementation

### Authentication and Security
- JWT-based authentication
- HttpOnly authentication cookies
- bcrypt password hashing
- Role-based authorization
- Input validation
- Parameterized SQL queries
- Security middleware and rate limiting

Verify exact package versions and the implementation of every security control from the local project files before changing or documenting them.

Do not introduce a frontend framework or replace the approved technology stack without an explicitly approved project decision.

---

## 3. Architecture Constraints

Digital Library uses a monolithic web application architecture.

The intended separation of responsibilities is:

Browser
→ Frontend
→ Express API
→ Routes and Middleware
→ Controllers
→ Services
→ Repositories
→ MySQL

This is a logical representation. The actual implementation must be checked against the existing source code.

Preserve the current layered architecture where applicable.

Do not introduce microservices, unnecessary infrastructure, or unrelated architectural complexity.

The frontend must not connect directly to MySQL. Database access must remain within the backend.

---

## 4. User Roles

The project defines two primary roles:

### USER
A regular user may access permitted published content, manage permitted profile information, read available books, and manage personal PDF documents according to the implemented authorization rules.

### ADMIN
An administrator may perform authorized library-management operations, including managing books, authors, categories, chapters, and publishing workflows where supported by the current implementation.

The backend must enforce authorization. Hiding a button or page in the frontend is not sufficient protection.

Do not allow a user to modify their own role or obtain administrative privileges through user-controlled input.

---

## 5. Main Product Areas

The existing feature inventory identifies the following product areas.

### 5.1 Authentication and User Management
- User registration
- User login and logout
- Current-user verification
- Profile retrieval and update
- Password change
- Authentication rate limiting

### 5.2 Authorization
- USER and ADMIN role separation
- Protected API endpoints
- Administrative access controls
- Publishing and content-visibility rules

### 5.3 Library Catalogue
- Book management
- Author management
- Category management
- Chapter management
- Book-author relationships
- Book-category relationships
- Publishing and archiving workflows
- Chapter ordering

### 5.4 Book Discovery and Reading
- Paginated book browsing
- Book and chapter access
- Online document reading
- Reader themes and typography controls
- Reading-width and spacing settings
- Auto-scroll where implemented
- Reading progress and resume behavior where implemented

### 5.5 Private PDF Library
- PDF upload
- Personal file listing
- Authorized file retrieval or streaming
- File deletion
- PDF validation and processing

### 5.6 Text-to-Speech
The feature inventory identifies browser-based text-to-speech capabilities, including playback controls, speed adjustment, pitch adjustment, and voice selection.

Verify which controls are implemented and working in the current source code and supported browsers.

### 5.7 Future Enhancements
The existing product documentation classifies chapter translation and AI-assisted semantic search or recommendations as future-scope features.

Do not present a future-scope feature as completed V1 functionality without evidence of an approved scope change and verified implementation.

This list is a project context summary, not proof that every feature currently works.

---

## 6. Security Requirements

Every change must preserve or improve the application's security.

### Authentication
- Verify credentials on the backend.
- Use the existing password-hashing implementation.
- Verify authentication tokens or sessions on protected routes.
- Handle logout and token invalidation consistently with the existing design.

### Authorization
- Enforce role-based permissions on the server.
- Check ownership of private resources.
- Prevent unauthorized access to unpublished or restricted content.
- Do not rely on frontend visibility as an authorization boundary.

### Database
- Use parameterized SQL queries for user-controlled values.
- Validate request data.
- Preserve database constraints and relationships.
- Avoid leaking internal database errors.

### File Uploads
- Validate permitted file types and file sizes.
- Use safe file-storage paths and filenames.
- Prevent path traversal and unauthorized file access.
- Keep private PDF storage inaccessible through unrestricted public static-file routes.
- Handle invalid or corrupted documents safely.

### Secrets and Errors
- Keep credentials and secrets in appropriate environment variables.
- Never commit actual secrets or private user data.
- Do not expose tokens, passwords, stack traces, or sensitive configuration in responses or logs.
- Apply the application's established security middleware and configuration.

### Known Authentication Limitation
The existing security documentation describes an in-memory token blacklist for logout. Such a blacklist is cleared when the server process restarts.

Do not silently describe this mechanism as persistent or distributed. Document the limitation accurately and evaluate any replacement separately, without introducing unnecessary infrastructure into V1.

---

## 7. Source-of-Truth Rules

Use the following evidence hierarchy according to the subject being investigated.

1. Current local source code determines implemented application behavior.
2. Current database schema and applicable migrations determine the database structure.
3. Actual test execution and recorded results determine the verification status.
4. Detailed API and technical security documentation describe the intended and documented contracts.
5. PRD, SRS, TRD, and approved project decisions define requirements and constraints.
6. Supporting and academic documents provide supplementary descriptions.

If two sources conflict, identify the discrepancy and investigate it before modifying either source.

Do not assume that documentation is correct merely because it exists.

Do not infer that a feature works merely because a source file, route, or database table exists.

---

## 8. Documentation Responsibilities

Use the established documentation locations.

- `docs/DOCUMENTATION-INDEX.md`: documentation structure and source-of-truth rules
- `docs/01-product/`: product vision, requirements, features, and roadmap
- `docs/02-requirements/`: software requirements and acceptance criteria
- `docs/03-technical/`: architecture, database, APIs, integration, and technology stack
- `docs/04-design/`: interface design and navigation
- `docs/05-security/`: security design and threat modelling
- `docs/06-development/`: codebase analysis, decisions, development history, and module status
- `docs/07-testing/`: testing strategy, test plans, cases, and test types
- `docs/08-deployment/`: environment, deployment, production checks, and rollback
- `docs/09-project-management/`: planning, tasks, dependencies, risks, and change requests
- `docs/10-academic/`: academic objectives, synopsis, methodology, limitations, and future scope
- `docs/api/`: detailed API endpoint documentation
- `docs/security/`: technical security documentation
- `docs/testing/`: practical testing guidance

Keep documents consistent with their designated responsibilities and link to authoritative documents instead of duplicating large sections.

---

## 9. Implementation Status Rules

Use these status definitions consistently.

| Status | Meaning |
|---|---|
| VERIFIED | Implementation and relevant verification evidence have been checked. |
| IMPLEMENTED | Code exists, but complete verification or hardening may remain. |
| IN_PROGRESS | Work is actively underway. |
| PLANNED | Approved or intended work has not yet started. |
| FUTURE_SCOPE | Work is deferred to a later release. |
| BLOCKED | A documented dependency or issue prevents progress. |

Use NOT TESTED when the behavior has not been verified.

Use PASS or FAIL only for checks that were actually executed.

Do not invent module completion dates, test outcomes, release milestones, or development history.

---

## 10. Rules for Modifying the Codebase

Before making significant changes:

1. Inspect the relevant source code and existing tests.
2. Check the current Git status.
3. Understand existing route, controller, service, and repository responsibilities.
4. Identify the expected behavior and affected dependencies.
5. Make the smallest appropriate change.
6. Add or update tests where feasible.
7. Run the relevant test suites.
8. Inspect the final diff.
9. Update affected documentation.
10. Report verified results and remaining limitations.

Preserve user changes and untracked files.

Do not delete files, reset a database, run destructive migrations, or overwrite user data without explicit authorization.

Do not commit, push, deploy, or make the website public without explicit authorization.

Do not create a parallel implementation when a compatible implementation already exists.

---

## 11. Testing Rules

Use the test scripts and test commands present in the current local project.

When reporting testing results, include:
- Command executed
- Test scope
- Actual passed, failed, and skipped counts when provided by the runner
- Relevant failure details
- Fixes applied
- Results of retesting
- Any blocked or untested areas

Use a dedicated test database and test data for destructive or data-changing tests.

Do not use a successful health endpoint as proof that the entire application works.

Do not claim all tests pass without execution evidence.

---

## 12. V1 Release and Deployment Rules

Before recommending a public launch, verify the integrated application rather than relying only on module status.

Important checks include:
- Frontend and backend integration
- Database connectivity and integrity
- Authentication and role enforcement
- Publishing and visibility rules
- Private PDF ownership enforcement
- File-upload validation
- Reader and text-to-speech functionality
- Automated and manual tests
- Environment and secret configuration
- HTTPS and production CORS settings
- Persistent PDF storage
- Database backups and recovery procedures
- Deployment and runtime verification

A staging deployment should be verified before public release.

Do not claim the website is live or production-ready unless the relevant deployment and verification steps have actually been completed.

---

## 13. Current Project Context

The project is Digital Library, a BTech final-year software project using HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL in a monolithic architecture.

The local source code, database schema, test results, and approved project requirements must be inspected when determining the current implementation status.

This context file provides development guidance; it does not replace technical inspection, testing, or explicit project decisions.

---

## 14. Final Working Principle

Prioritize correctness, security, maintainability, and compatibility with the existing application.

Understand before changing.
Verify before claiming.
Document before assuming.
Preserve existing working functionality.
Keep V1 focused on its approved scope.
