# Digital Library — Functional Requirements

**Project:** Digital Library  
**Project Type:** BTech Final-Year Software Project  
**Release:** Version 1 (V1)  
**Document Version:** 1.0  
**Status:** Active  
**Related Documents:** `docs/02-requirements/SRS.md`, `docs/02-requirements/acceptance-criteria.md`

---

## 1. Purpose

This document defines the functional requirements for the Digital Library application.

Functional requirements describe the services the system must provide, the operations users can perform, the rules that govern those operations, and the responses expected from the application.

These requirements establish intended behavior. They do not prove that a requirement has already been implemented or verified.

The current implementation status must be established by inspecting the local source code, database schema, and relevant test evidence.

---

## 2. Scope

The functional requirements cover:

- User registration and authentication.
- User account and profile management.
- Role-based authorization.
- Book, author, category, and chapter management.
- Relationships between catalogue entities.
- Publishing, archiving, and content visibility.
- Book browsing and discovery.
- Online reading.
- Reader customization.
- Browser-based text-to-speech.
- Private PDF library management.
- PDF upload and processing.
- Validation and error handling.
- Security-related application behavior.

Refresh-token functionality, chapter translation, AI-assisted semantic search, and AI-assisted recommendations remain future-scope features according to the existing product feature inventory.

---

## 3. Actors

### 3.1 Guest

A guest is a person who has not authenticated.

Guest access to catalogue content must follow the approved access rules and the actual implementation. Protected resources must not be accessible to guests.

### 3.2 USER

A USER is an authenticated regular account.

A USER may perform permitted account operations, access available library content, read authorized books, and manage personal PDF documents according to the implemented permissions.

### 3.3 ADMIN

An ADMIN is an authenticated account with administrative privileges.

An ADMIN may perform authorized catalogue-management and publishing operations.

Administrative privileges must be enforced by the backend and must not be obtainable through ordinary user-controlled input.

### 3.4 Application

The application includes the frontend, Express backend, and MySQL database.

The backend validates requests, enforces permissions, executes business logic, and coordinates database operations.

---

## 4. Requirement Conventions

Each requirement has a unique identifier.

Priority definitions:

- **MUST:** Required for the approved Version 1 scope.
- **SHOULD:** Expected where applicable, subject to documented constraints.
- **FUTURE:** Deferred to a later release.

Requirement priority describes intended scope, not implementation status.

---

## 5. Authentication and Account Management

### FR-AUTH-001 — User Registration

**Priority:** MUST

The system must allow a person to register an account using the required registration information.

The system must:

- Validate required fields.
- Reject invalid registration data.
- Reject duplicate account identifiers according to the application's uniqueness rules.
- Store passwords using the approved password-hashing mechanism.
- Assign the standard USER role through the authorized registration process.
- Return an appropriate success or error response.

### FR-AUTH-002 — User Login

**Priority:** MUST

The system must authenticate users using valid credentials.

The system must:

- Validate the submitted credentials.
- Reject incorrect credentials.
- Establish the authentication state according to the implemented token or cookie design.
- Avoid exposing passwords or sensitive authentication details in responses.
- Apply the configured authentication rate limits.

### FR-AUTH-003 — Authentication Verification

**Priority:** MUST

The system must provide the implemented mechanism for determining whether a request is authenticated.

Protected endpoints must reject requests with missing or invalid authentication.

The system must return an appropriate response when authentication is required but unavailable or invalid.

### FR-AUTH-004 — User Logout

**Priority:** MUST

The system must provide a logout operation.

The operation must clear the relevant client authentication state and apply the implemented token-invalidation behavior.

The system must not claim persistent token revocation when the implementation uses an in-memory blacklist that is lost after a server restart.

### FR-USER-001 — Profile Retrieval

**Priority:** MUST

The system must allow an authenticated user to retrieve their permitted profile information.

A user must not retrieve another user's private profile data without appropriate authorization.

### FR-USER-002 — Profile Update

**Priority:** MUST

The system must allow an authenticated user to update permitted profile fields.

The system must validate submitted values and prevent ordinary profile updates from changing protected fields such as administrative privileges.

### FR-USER-003 — Password Change

**Priority:** MUST

The system must provide the implemented password-change operation.

The system must verify the current password, validate the new password, and store the updated password using the approved hashing mechanism.

### FR-AUTH-005 — Refresh-Token Workflow

**Priority:** FUTURE

A refresh-token workflow may be introduced in a future release after its security, lifecycle, and storage requirements have been approved.

It is not a mandatory Version 1 functional requirement under the existing product scope.

---

## 6. Authorization and Access Control

### FR-ACL-001 — Role-Based Authorization

**Priority:** MUST

The system must distinguish between USER and ADMIN permissions.

The backend must enforce the required role for protected operations.

### FR-ACL-002 — Protected API Access

**Priority:** MUST

The system must reject unauthorized requests to protected endpoints.

Frontend restrictions must not replace backend authorization checks.

### FR-ACL-003 — Content Visibility

**Priority:** MUST

The system must enforce the approved visibility rules for published, unpublished, archived, or otherwise restricted content, according to the states supported by the implementation.

Direct requests using resource identifiers must not bypass those rules.

### FR-ACL-004 — Private Resource Ownership

**Priority:** MUST

The system must verify that the authenticated user is authorized to access, modify, or delete a private resource.

For private PDF documents, the backend must enforce ownership checks on every relevant operation.

---

## 7. Book Management

### FR-BOOK-001 — Create Book

**Priority:** MUST

The system must allow an authorized administrator to create a book record using valid data.

The system must validate required fields and preserve database constraints.

### FR-BOOK-002 — Retrieve Books

**Priority:** MUST

The system must provide the implemented API operations for retrieving books.

Returned records must follow the applicable authentication, authorization, pagination, and visibility rules.

### FR-BOOK-003 — Update Book

**Priority:** MUST

The system must allow authorized updates to supported book fields.

Invalid data and unauthorized requests must be rejected.

### FR-BOOK-004 — Archive or Delete Book

**Priority:** MUST

The system must support the book archival or deletion operations defined by the implementation.

The system must preserve the approved relationship and data-retention rules.

Archiving and permanent deletion must not be treated as equivalent operations unless the implementation explicitly defines them that way.

### FR-BOOK-005 — Book PDF Processing

**Priority:** MUST, where included in the approved V1 implementation

The system must support the implemented book-PDF upload and processing workflow.

The system must validate files, handle processing failures, and enforce the appropriate permissions.

---

## 8. Author Management

### FR-AUTHOR-001 — Create Author

**Priority:** MUST

The system must allow authorized users to create author records where the applicable administrative permissions permit the operation.

### FR-AUTHOR-002 — Retrieve Authors

**Priority:** MUST

The system must provide the implemented operations for retrieving author records.

### FR-AUTHOR-003 — Update Author

**Priority:** MUST

The system must allow authorized updates to supported author fields.

### FR-AUTHOR-004 — Archive or Delete Author

**Priority:** MUST

The system must support the author archival or deletion behavior defined by the implementation and database relationship rules.

---

## 9. Category Management

### FR-CAT-001 — Create Category

**Priority:** MUST

The system must allow an authorized administrator to create a category using valid data.

### FR-CAT-002 — Retrieve Categories

**Priority:** MUST

The system must provide the implemented category retrieval operations.

### FR-CAT-003 — Update Category

**Priority:** MUST

The system must allow authorized updates to supported category fields.

### FR-CAT-004 — Archive or Delete Category

**Priority:** MUST

The system must support the category archival or deletion behavior defined by the implementation and database relationship rules.

---

## 10. Book Relationships

### FR-REL-001 — Associate Books and Authors

**Priority:** MUST

The system must support the book-author relationships defined by the database and API design.

The system must validate referenced identifiers and prevent invalid relationships.

### FR-REL-002 — Associate Books and Categories

**Priority:** MUST

The system must support the book-category relationships defined by the database and API design.

The system must validate referenced identifiers and preserve relationship integrity.

### FR-REL-003 — Retrieve Relationships

**Priority:** MUST

The system must return the relevant associated author and category information through the supported API operations.

The returned relationships must match the stored data.

---

## 11. Chapter Management

### FR-CH-001 — Create Chapter

**Priority:** MUST

The system must allow authorized users to create a chapter associated with a valid book.

The system must validate chapter information and referenced identifiers.

### FR-CH-002 — Retrieve Chapters

**Priority:** MUST

The system must provide the implemented operations for retrieving chapters.

Chapter visibility must follow the applicable book, publication, and authorization rules.

### FR-CH-003 — Update Chapter

**Priority:** MUST

The system must allow authorized updates to supported chapter fields and content.

### FR-CH-004 — Delete Chapter

**Priority:** MUST

The system must support chapter deletion according to the implemented authorization and data-retention rules.

### FR-CH-005 — Reorder Chapters

**Priority:** MUST

The system must support the implemented chapter-reordering operation.

It must validate chapter identifiers and persist the intended ordering.

---

## 12. Publishing and Archiving

### FR-PUB-001 — Manage Publication Status

**Priority:** MUST

The system must provide the implemented mechanism for changing publication status.

Only authorized users may perform restricted publication operations.

### FR-PUB-002 — Enforce Published Content Rules

**Priority:** MUST

The system must make content available according to the approved publication and visibility rules.

Unpublished or restricted content must not be exposed to unauthorized users.

### FR-PUB-003 — Manage Archival Status

**Priority:** MUST

The system must support the archival operations defined by the application.

Archival behavior must remain consistent with retrieval, publication, and relationship rules.

### FR-PUB-004 — Reject Invalid State Changes

**Priority:** SHOULD

Where the publishing workflow defines permitted state transitions, the system should reject invalid transitions and return an appropriate error response.

---

## 13. Book Discovery

### FR-DISC-001 — Paginated Browsing

**Priority:** MUST

The system must support the documented paginated book-browsing behavior.

Pagination parameters must be validated and results must respect the applicable visibility rules.

### FR-DISC-002 — View Book Information

**Priority:** MUST

The system must provide the supported book information needed to identify and open accessible content.

### FR-DISC-003 — Browse by Category

**Priority:** MUST, where supported by the approved catalogue interface

The system must support the implemented category-based browsing behavior.

Results must reflect the correct category relationships.

### FR-DISC-004 — Search Books

**Priority:** MUST only if approved and implemented in the V1 scope

If book search is included, the system must process search input safely and return results consistent with the documented search contract.

Search across the complete catalogue must not be claimed if the implementation only searches the currently loaded page.

### FR-DISC-005 — Handle Empty Results

**Priority:** MUST

The system must handle empty result sets without treating them as application crashes or returning misleading records.

---

## 14. Online Reading

### FR-READ-001 — Open Accessible Book

**Priority:** MUST

The system must allow an authorized user to open an accessible book in the reading interface.

Missing or restricted content must be handled appropriately.

### FR-READ-002 — Display Chapter Content

**Priority:** MUST

The system must display the chapter content that the current user is authorized to read.

### FR-READ-003 — Navigate Chapters

**Priority:** MUST

The system must provide the chapter navigation supported by the reader.

Navigation must respect the available chapter ordering and prevent invalid transitions.

### FR-READ-004 — Reader Themes

**Priority:** MUST, where included in the approved V1 reader

The reader must support the implemented light, dark, and sepia themes.

### FR-READ-005 — Typography Controls

**Priority:** MUST, where included in the approved V1 reader

The reader must support the implemented typography controls, such as font size, font family, and line height.

### FR-READ-006 — Reading Width and Layout

**Priority:** SHOULD

The reader should provide the implemented reading-width or spacing controls where included in the approved interface.

### FR-READ-007 — Auto-Scroll

**Priority:** MUST, where included in the approved V1 reader

The reader must provide the implemented auto-scroll controls and handle changes in reading context appropriately.

### FR-READ-008 — Reading Progress

**Priority:** MUST only if included in the approved and implemented V1 scope

If reading-progress persistence is included, the system must save and retrieve progress according to the defined user and book relationships.

It must not expose another user's private reading data.

---

## 15. Text-to-Speech

### FR-TTS-001 — Read Supported Text Aloud

**Priority:** MUST, where included in the approved V1 reader

The system must provide browser-based speech for supported reading content.

### FR-TTS-002 — Playback Controls

**Priority:** MUST, where speech playback is implemented

The system must provide the available play, pause, resume, and stop controls.

### FR-TTS-003 — Speech Speed

**Priority:** MUST, where speech playback is implemented

The system must provide the implemented speech-speed control.

A maximum of 4x may be claimed only when the actual implementation supports it.

### FR-TTS-004 — Pitch and Voice Selection

**Priority:** SHOULD

The system should provide pitch adjustment and voice selection where implemented and supported by the browser.

### FR-TTS-005 — Handle Speech Limitations

**Priority:** MUST

The application must handle unavailable voices, unsupported settings, or speech errors without preventing ordinary visual reading.

### FR-TTS-006 — Speech and Chapter Changes

**Priority:** MUST

The reader must handle changes in chapter or reading context without leaving unintended or stale speech operations running.

---

## 16. Private PDF Library

### FR-PRIVATE-001 — Upload Personal PDF

**Priority:** MUST

The system must allow an authenticated user to upload a valid personal PDF within the configured limits.

### FR-PRIVATE-002 — List Personal PDFs

**Priority:** MUST

The system must return the authenticated user's own private PDF records.

It must not include another user's private documents.

### FR-PRIVATE-003 — Retrieve or Stream Private PDF

**Priority:** MUST

The system must allow authorized access to an owned private PDF.

Authentication, ownership, and applicable file-access checks must be enforced on the backend.

### FR-PRIVATE-004 — Delete Personal PDF

**Priority:** MUST

The system must allow an authorized user to delete their own private PDF according to the implemented deletion rules.

### FR-PRIVATE-005 — Validate PDF Uploads

**Priority:** MUST

The system must validate permitted file types, file size, and relevant upload constraints.

### FR-PRIVATE-006 — Process PDF Content

**Priority:** MUST, where included in the approved V1 implementation

The system must process supported PDFs according to the existing implementation and handle invalid or corrupted documents safely.

### FR-PRIVATE-007 — Separate Private and Shared Content

**Priority:** MUST

The system must maintain the distinction between private user-owned documents and shared library content.

Private files must not become public catalogue resources merely because they were uploaded or processed.

---

## 17. Validation and Error Handling

### FR-VAL-001 — Validate Requests

**Priority:** MUST

The system must validate incoming request data according to the applicable endpoint rules.

Invalid requests must not bypass business rules or authorization.

### FR-ERR-001 — Consistent Error Responses

**Priority:** MUST

The system must provide consistent error responses for validation failures, authentication failures, authorization failures, missing resources, and unexpected errors.

### FR-ERR-002 — Protect Internal Details

**Priority:** MUST

Production responses must not disclose sensitive implementation details, secrets, database credentials, or internal stack traces.

### FR-ERR-003 — Handle Missing Resources

**Priority:** MUST

The system must return an appropriate response when a requested book, chapter, author, category, or private file does not exist or is not accessible.

---

## 18. Database and Persistence

### FR-DATA-001 — Persist Successful Changes

**Priority:** MUST

Successful create and update operations must persist their changes according to the database design.

### FR-DATA-002 — Maintain Relationships

**Priority:** MUST

The system must preserve the integrity of supported relationships between users, books, authors, categories, chapters, and private files.

### FR-DATA-003 — Handle Database Failures

**Priority:** MUST

The application must handle database failures through the established error-handling approach and must not falsely report failed operations as successful.

### FR-DATA-004 — Preserve Private Ownership

**Priority:** MUST

Private-file metadata and ownership information must be used to enforce access control.

---

## 19. Security-Related Functional Requirements

### FR-SEC-001 — Password Protection

**Priority:** MUST

The system must store passwords using the approved password-hashing mechanism and must not return plaintext passwords.

### FR-SEC-002 — SQL Injection Prevention

**Priority:** MUST

Database operations involving user-controlled values must use appropriate parameterized queries or equivalent safe database mechanisms.

### FR-SEC-003 — Safe Content Rendering

**Priority:** MUST

The frontend must handle untrusted content safely and prevent it from being interpreted as unintended executable script.

### FR-SEC-004 — Rate Limiting

**Priority:** MUST

The system must apply the configured rate limits to the endpoints designated for protection.

### FR-SEC-005 — File Access Protection

**Priority:** MUST

The system must enforce authorization and ownership rules before serving private files.

### FR-SEC-006 — Authentication Cookie Protection

**Priority:** MUST

Authentication cookies must use the security attributes required by the approved authentication design and target environment.

Production configuration must be reviewed to ensure that cookie settings are appropriate for HTTPS and cross-origin requirements.

---

## 20. Future-Scope Functional Requirements

The following capabilities are deferred according to the existing product feature inventory.

### FR-FUTURE-001 — Chapter Translation

**Priority:** FUTURE

The system may support translation of chapter content into selected languages in a future release.

### FR-FUTURE-002 — AI Semantic Search

**Priority:** FUTURE

The system may support meaning-based search using AI-assisted retrieval in a future release.

### FR-FUTURE-003 — AI Recommendations

**Priority:** FUTURE

The system may recommend relevant reading material in a future release.

### FR-FUTURE-004 — Refresh Tokens

**Priority:** FUTURE

The system may introduce a refresh-token workflow after its lifecycle and security requirements are approved.

These features are not mandatory Version 1 requirements under the current documented scope.

---

## 21. Requirement Traceability

Each functional requirement should be connected to:

- Its source product requirement.
- Relevant acceptance criteria.
- Applicable API endpoints or UI pages.
- Related database entities.
- Relevant test cases.
- Implementation status.

The intended traceability path is:

Functional Requirement → Acceptance Criterion → Implementation Reference → Test Case → Recorded Result

Implementation references and test outcomes must be based on actual project evidence.

---

## 22. Verification Rules

Functional requirements must be verified using appropriate tests.

Depending on the requirement, verification may include:

- Unit tests.
- API tests.
- Integration tests.
- Database verification.
- Security tests.
- Manual user-interface tests.
- End-to-end tests.

Record the actual commands or procedures used and their observed results.

Do not mark a requirement as verified merely because the corresponding source file or endpoint exists.

A successful health endpoint does not prove that all functional requirements are satisfied.

---

## 23. Related Documents

This document must remain consistent with:

- `docs/DOCUMENTATION-INDEX.md`
- `docs/AI-CONTEXT.md`
- `docs/01-product/PRD.md`
- `docs/01-product/feature-list.md`
- `docs/01-product/roadmap.md`
- `docs/01-product/vision-and-scope.md`
- `docs/02-requirements/acceptance-criteria.md`
- `docs/02-requirements/non-functional-requirements.md`
- `docs/02-requirements/SRS.md`
- `docs/02-requirements/use-cases.md`
- `docs/03-technical/api-specification.md`
- `docs/03-technical/architecture.md`
- `docs/03-technical/database-design.md`
- `docs/03-technical/TRD.md`
- `docs/06-development/module-status.md`
- `docs/07-testing/`

---

## 24. Document Maintenance

Review this document whenever:

- A functional requirement is added, changed, or removed.
- A user role or permission changes.
- An API contract changes.
- A database relationship changes.
- A reader feature changes.
- Private PDF handling changes.
- A feature is moved between V1 and future scope.

Approved scope changes must be recorded and reflected in the affected requirements, acceptance criteria, test cases, and supporting documentation.

---

## 25. Summary

This document defines the intended functional behavior of the Digital Library application across authentication, authorization, catalogue management, publishing, discovery, reading, private PDF handling, text-to-speech, validation, and persistence.

It provides stable identifiers to support traceability between requirements, implementation, acceptance criteria, and tests.

The requirements describe intended behavior. Current implementation and verification status must be established separately from the local codebase, database, and test evidence.
