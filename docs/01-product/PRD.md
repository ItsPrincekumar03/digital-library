# Digital Library — Product Requirements Document (PRD)

**Project:** Digital Library  
**Project Type:** BTech Final-Year Software Project  
**Release:** Version 1 (V1)  
**Document Version:** 1.0  
**Status:** Active  
**Parent Index:** `docs/DOCUMENTATION-INDEX.md`

---

## 1. Purpose

This Product Requirements Document defines the product vision, objectives, intended users, core functionality, scope boundaries, constraints, and success criteria for the Digital Library application.

It describes what the product is intended to provide and why those capabilities are needed.

Detailed software behavior is specified in `docs/02-requirements/SRS.md`. Technical design is documented in `docs/03-technical/TRD.md` and the related technical documents.

This PRD describes intended product requirements. It does not independently prove that a feature has been implemented, tested, or deployed.

---

## 2. Product Overview

Digital Library is a web-based application for organizing, discovering, managing, and reading digital books and documents.

The application brings together shared library catalogue management, user accounts, chapter-based reading, personal PDF storage, and reading customization.

The product supports two primary roles:

- USER
- ADMIN

Regular users access permitted library content and manage their personal documents according to the application's authorization rules.

Administrators manage library content and publishing operations according to their assigned permissions.

The intended result is an understandable and maintainable digital reading application suitable for a BTech final-year project.

---

## 3. Problem Statement

Readers may experience difficulties when digital reading materials are distributed across separate applications or are not organized consistently.

Common challenges include:

- Finding books and relevant reading materials.
- Organizing books by author, category, and other metadata.
- Managing chapters and publication status.
- Accessing permitted content through a convenient online reader.
- Keeping personal PDF documents separate from shared library content.
- Adjusting the reading interface to individual preferences.
- Using text-to-speech to listen to supported text.
- Managing library resources through a centralized administrative interface.

Administrators also need controlled operations for creating, updating, publishing, archiving, and organizing library content.

Digital Library aims to address these needs through one integrated web application.

---

## 4. Product Vision

The vision is to provide a centralized, secure, accessible, and user-friendly environment for discovering and reading digital content.

The product aims to combine:

- Organized library catalogue management.
- Controlled access to published and restricted content.
- Personal PDF document management.
- Online chapter-based reading.
- Reader appearance and typography customization.
- Browser-based text-to-speech.
- Appropriate administrative workflows.

The product should remain suitable for academic development while allowing future enhancements without unnecessary architectural complexity.

---

## 5. Product Objectives

The primary objectives are:

1. Provide user registration, authentication, and account management.
2. Enforce role-based access control.
3. Organize books, authors, categories, and chapters.
4. Support book publication, archiving, and content-visibility rules.
5. Provide appropriate book discovery and navigation.
6. Support online reading of accessible content.
7. Provide reading customization, including supported themes and typography controls.
8. Provide browser-based text-to-speech where supported.
9. Allow registered users to manage personal PDF documents.
10. Protect private content through authentication, authorization, and ownership checks.
11. Maintain a clear and maintainable application architecture.
12. Establish a verifiable Version 1 release through integration and testing.

---

## 6. Target Users

### 6.1 Regular User

A regular user primarily discovers and reads permitted library content.

Depending on the implemented functionality and authorization rules, a user may:

- Register and log in.
- Manage permitted profile information.
- Browse published books.
- View book details and available chapters.
- Navigate and read chapter content.
- Customize supported reader settings.
- Use text-to-speech features where supported.
- Upload, list, access, and delete personal PDF documents within the user's permissions.

A regular user must not gain administrative privileges by changing frontend data or submitting unauthorized API requests.

### 6.2 Administrator

An administrator manages library resources through authorized administrative operations.

Depending on the implemented functionality, an administrator may:

- Manage books and book metadata.
- Manage authors.
- Manage categories.
- Manage chapters and chapter ordering.
- Manage publication and archiving workflows.
- Control content visibility.
- Review and manage content according to the application's permissions.

All administrative operations must be enforced by the backend.

---

## 7. User Roles and Access Principles

| Role | Primary responsibility |
|---|---|
| USER | Access permitted library content, read books, manage permitted account information, and manage personal PDF documents. |
| ADMIN | Perform authorized library-management and publishing operations. |

The application must enforce permissions on the server.

The availability of a page or button in the frontend must not be treated as proof of authorization.

Unpublished or restricted content must not be disclosed to users who do not have permission to access it.

Anonymous access to catalogue endpoints must follow an explicit product decision and match the actual frontend routing, backend routes, and API documentation. The term shared catalogue does not, by itself, establish that every endpoint is accessible without login.

---

## 8. Product Scope

### 8.1 Authentication and User Management

The intended product scope includes:

- User registration.
- User login and logout.
- Authenticated-user verification.
- Profile retrieval and permitted updates.
- Password change with appropriate verification.
- Authentication and authorization for protected resources.
- Appropriate rate limiting for sensitive authentication operations.

The detailed endpoint contracts are maintained in `docs/api/auth.md` and `docs/api/users.md`.

### 8.2 Library Catalogue Management

The product supports organized catalogue information, including:

- Books.
- Authors.
- Categories.
- Chapters.
- Book-author relationships.
- Book-category relationships.
- Publication status.
- Content visibility.
- Archiving and chapter reordering where supported.

Administrative operations must respect role-based authorization and relevant validation rules.

### 8.3 Book Discovery

Users should be able to find and navigate available library content.

The intended discovery capabilities include:

- Paginated book browsing.
- Viewing accessible book information.
- Viewing associated authors and categories.
- Navigating available chapters.
- Search and category filtering where supported by the approved implementation.

Search results and filters should represent the actual result set rather than misleading users about matches that exist only on the currently displayed page.

The detailed behavior and availability of discovery endpoints must be confirmed against the current implementation.

### 8.4 Online Reading

Users with appropriate permissions should be able to open an accessible book and read its available chapters.

The reader requirements include, where implemented:

- Book information.
- A chapter list or table of contents.
- Chapter selection.
- Previous and next chapter navigation.
- Current chapter indication.
- A readable content area.
- Appropriate loading and error states.
- Reading progress and resume behavior where implemented.

The reader must not expose content that the current user is not authorized to access.

### 8.5 Reader Customization

The intended reader customization capabilities include:

**Typography**
- Font size.
- Font family.
- Line height.

**Layout**
- Reading width.
- Spacing and layout controls where implemented.

**Appearance**
- Light theme.
- Dark theme.
- Sepia theme.

Reader settings should update the reading interface appropriately. Preference persistence must only be claimed where it is implemented and verified.

### 8.6 Auto-Scroll

Where implemented, the reader may provide automatic scrolling controls, including starting, pausing, resuming, stopping, and adjusting scroll speed.

Auto-scroll must not interfere with ordinary reading or navigation.

### 8.7 Text-to-Speech

The product includes browser-based text-to-speech for supported reading content.

The intended controls include:

- Play.
- Pause.
- Resume.
- Stop.
- Speech speed adjustment.
- Pitch adjustment where supported.
- Voice selection where supported.

The planned maximum speech speed is 4x.

Speech availability and voice options depend on the browser, operating system, and installed speech voices.

Failure or unavailability of speech functionality must not prevent users from reading the text normally.

Long chapters should be handled without creating unnecessary duplicate speech queues or degrading ordinary reader behavior.

### 8.8 Private PDF Library

Registered users should have a separate private area for personal PDF documents.

The intended capabilities include:

- Uploading personal PDF files.
- Listing the user's own files.
- Accessing or streaming authorized documents.
- Deleting owned files.
- Validating uploads.
- Processing supported PDFs.
- Handling missing, invalid, unsupported, or corrupted files.

Private documents must remain separate from the shared library catalogue.

Every private-file request must enforce appropriate authentication, authorization, and ownership checks on the backend.

The implementation must not expose private files through unrestricted public static-file URLs.

### 8.9 PDF Processing

Where supported by the current implementation, PDF processing uses `pdfjs-dist` to extract available text and images from PDF documents.

Processing must handle invalid files and failures safely.

PDFs containing selectable text differ from scanned documents that contain only page images. OCR support for scanned PDFs is not part of the confirmed Version 1 feature inventory and must not be represented as implemented without evidence.

### 8.10 Security

The product requires appropriate protections for:

- User credentials.
- Authentication tokens or sessions.
- Role-based permissions.
- Protected and unpublished content.
- Private user documents.
- Database operations.
- File uploads.
- Request validation.
- Application errors.
- Configuration secrets.

Security implementation details are maintained in `docs/security/` and the supporting security design documents.

---

## 9. Features Deferred to Future Scope

The existing product feature inventory explicitly identifies the following as future-scope features:

| Feature | Release classification |
|---|---|
| Refresh-token workflow | Future scope |
| Chapter translation | Future scope |
| AI-assisted semantic search | Future scope |
| AI-assisted recommendations | Future scope |

These features must not be described as completed Version 1 capabilities unless an approved scope change is recorded and their implementation is verified.

Other enhancements may be proposed through the project's change-management process.

---

## 10. Out of Scope for Version 1

Unless explicitly approved through a project scope change, Version 1 does not require:

- A microservices architecture.
- Replacement of the approved technology stack.
- A general-purpose social network.
- Cryptocurrency functionality.
- Unnecessary payment infrastructure.
- Unrelated enterprise systems.
- Unrestricted third-party downloading.
- An unrelated video-streaming platform.
- Unnecessary AI infrastructure.
- An unrelated chatbot.

The project should remain focused on digital library management, controlled digital content access, personal PDF storage, and online reading.

---

## 11. Technology Constraints

The approved technology stack is:

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend runtime | Node.js |
| Backend framework | Express.js |
| Database | MySQL |
| PDF processing | pdfjs-dist where used by the implementation |

The application must remain monolithic.

The existing layered backend structure should be preserved where applicable:

Route → Controller → Service → Repository → MySQL

The frontend must communicate with the backend through the application's defined APIs. It must not connect directly to MySQL.

Specific package versions and installed dependencies must be verified from the local project configuration.

---

## 12. User Experience Requirements

The application should be:

- Understandable.
- Consistent.
- Responsive.
- Readable.
- Accessible.
- Maintainable.

The interface should provide clear feedback for:

- Loading operations.
- Successful actions.
- Validation errors.
- Missing resources.
- Unauthorized access.
- Network errors.
- PDF-processing errors.
- Unsupported speech features.

The reader should prioritize content readability and avoid unnecessary visual or interaction complexity.

### Responsive behavior

The application should support desktop, tablet, and mobile browsers within the capabilities of the implemented design.

Important reading controls should remain usable on smaller screens, and the interface should avoid unnecessary horizontal scrolling.

### Accessibility

The design should use semantic HTML, properly associated form labels, accessible controls, keyboard navigation, visible focus states, appropriate contrast, and ARIA attributes where necessary.

These are product requirements; their compliance must be verified separately.

---

## 13. Security and Privacy Requirements

The application must protect accounts, private documents, restricted content, and configuration secrets.

The expected security controls include:

- Password hashing.
- Authentication verification.
- Server-side authorization.
- Input validation.
- Parameterized database queries.
- Appropriate request rate limiting.
- Secure handling of authentication cookies or tokens.
- Private-file ownership enforcement.
- File-upload restrictions.
- Safe error responses.
- Protection against common injection and cross-site scripting risks.

Security controls must be verified against the actual implementation and appropriate tests.

No individual control or collection of controls establishes that the system is completely secure.

The existing authentication documentation describes an in-memory token blacklist. Its restart-related limitation must remain documented rather than being concealed or described as persistent token revocation.

---

## 14. Data Requirements

The application needs structured data for the entities supported by the current database schema.

Major data areas include:

- Users and roles.
- Books.
- Authors.
- Categories.
- Book-author relationships.
- Book-category relationships.
- Chapters.
- Publishing and visibility information.
- Private library files.
- Reading progress and history where implemented.
- Bookmarks and favorites where implemented.
- Reader settings where implemented.
- Audit records where implemented.

The authoritative physical schema is maintained in `database/schema.sql` and the applicable database migrations.

Product documentation must not substitute an assumed schema for the actual database structure.

---

## 15. Non-Functional Product Goals

### Security

The system should enforce access control, protect private data, handle secrets appropriately, and reduce common application security risks.

### Reliability

The application should handle invalid requests, missing resources, unavailable services, and processing errors without exposing sensitive information.

### Performance

The application should provide reasonable performance for the intended academic project workload.

Relevant considerations include efficient database queries, pagination, appropriate indexing, reader rendering, and efficient handling of long chapters.

No specific performance benchmark is guaranteed by this PRD unless a measurable target is approved and tested.

### Maintainability

The implementation should preserve separation of concerns and keep the existing architecture understandable.

### Compatibility

The application should work in the supported browsers and screen sizes. Browser-dependent speech functionality must be evaluated in the environments where it is expected to work.

### Testability

Product behavior should be defined clearly enough to be verified through appropriate unit, API, integration, security, and manual tests.

---

## 16. Product Success Criteria

Version 1 acceptance requires evidence that the applicable approved requirements have been implemented and tested.

### Authentication and authorization
- Users can register and authenticate.
- Logout behaves according to the implemented token/session design.
- Protected routes enforce authentication.
- Administrative operations enforce the required permissions.

### Catalogue management
- Authorized operations for books, authors, categories, and chapters behave as intended.
- Required relationships and validation rules are maintained.
- Publishing, archiving, and visibility rules are enforced.

### Discovery and reading
- Users can access permitted library content.
- Available chapters can be opened and navigated.
- Implemented reader customization behaves correctly.
- Implemented reading features handle errors appropriately.

### Private PDF library
- Authorized users can manage their own PDF documents.
- Invalid uploads are rejected appropriately.
- Users cannot access another user's private documents.
- Storage and retrieval behavior matches the intended deployment configuration.

### Text-to-speech
- Supported speech controls work in verified environments.
- Speech-speed and other controls behave as implemented.
- Speech failure does not prevent normal text reading.

### Security and quality
- Critical authorization and data-protection requirements are verified.
- Relevant automated and manual tests have actual recorded outcomes.
- Important known limitations are documented.
- The application has a verified deployment and recovery plan before public release.

A feature must not be marked as accepted solely because its source file or route exists.

---

## 17. Testing and Acceptance

Requirements must be connected to observable acceptance criteria and appropriate test cases.

The expected relationship is:

Requirement → Feature → Acceptance Criteria → Test Case → Evidence → Acceptance Decision

The test plan and test-case documents define the verification approach.

For each reported test result, record the test performed, expected behavior, actual outcome, and relevant evidence.

Distinguish between:

- Planned tests.
- Tests executed.
- Tests passed.
- Tests failed.
- Tests not run or blocked.

Do not infer that the whole application passes testing from a successful server health check or a single completed module.

---

## 18. Release and Deployment Principles

Version 1 is intended to provide an integrated application suitable for demonstration and deployment after required verification.

Before public release, the project should be checked for:

- Frontend and backend integration.
- Database connectivity and integrity.
- Authentication and authorization.
- Catalogue and publishing workflows.
- Private PDF access controls.
- Reader behavior.
- Automated and manual test outcomes.
- Production environment configuration.
- Secret management.
- HTTPS and appropriate CORS configuration.
- Persistent file storage.
- Database backups and recovery.
- Deployment and runtime verification.

A staging deployment should be verified before opening the application to the public.

This PRD does not claim that a production deployment already exists or that the release criteria have been satisfied.

---

## 19. Known Limitations and Release Boundaries

Known limitations must be recorded in the appropriate technical, security, development, and academic documentation.

The current product documents identify the in-memory token blacklist as a limitation and classify translation, semantic search, recommendations, and refresh-token functionality as future scope.

Additional limitations must be established from the current implementation and verification evidence.

The project must not claim support for unimplemented features or claim complete security, reliability, accessibility, or compatibility without supporting evidence.

---

## 20. Future Scope

Potential future enhancements may include:

- Chapter translation.
- AI-assisted semantic search.
- AI-assisted book recommendations.
- Refresh-token functionality.
- Additional accessibility improvements.
- Improved personalization.
- OCR support for scanned PDFs.
- Further usability and reading improvements.

Each proposed feature must be evaluated separately and included in a future release only after its scope, dependencies, implementation, and testing requirements are agreed.

These possibilities are not claims that the features currently exist.

---

## 21. Documentation Relationships

This PRD must remain consistent with:

- `docs/DOCUMENTATION-INDEX.md`
- `docs/AI-CONTEXT.md`
- `docs/01-product/feature-list.md`
- `docs/01-product/roadmap.md`
- `docs/01-product/vision-and-scope.md`
- `docs/02-requirements/SRS.md`
- `docs/02-requirements/functional-requirements.md`
- `docs/02-requirements/non-functional-requirements.md`
- `docs/02-requirements/acceptance-criteria.md`
- `docs/03-technical/TRD.md`
- `docs/03-technical/architecture.md`
- `docs/03-technical/database-design.md`
- `docs/03-technical/api-specification.md`
- `docs/06-development/module-status.md`
- `docs/07-testing/`
- `docs/08-deployment/`
- `docs/10-academic/future-scope.md`

When scope or approved requirements change, update the affected documents together.

---

## 22. Change Management

Changes to product goals, user roles, major features, release scope, or technology constraints must be recorded through the project's change-management process.

A proposed feature is not automatically part of Version 1.

The impact of an approved change should be reviewed against:

- Requirements.
- Architecture.
- Database structure.
- API contracts.
- User interface.
- Security.
- Testing.
- Deployment.
- Academic deliverables.

Historical decisions and implementation dates must be based on reliable evidence rather than invented retrospectively.

---

## 23. Document Maintenance

This PRD should be reviewed when:

- Product scope changes.
- A major requirement is added or removed.
- User roles or permissions change.
- A planned feature is moved between releases.
- An approved architecture or technology decision changes.
- Release acceptance criteria change.

Technical implementation details should remain in the appropriate technical documents.

The current source code, database structure, approved requirements, and test evidence must be considered together when resolving discrepancies.

---

## 24. Current Product Information

**Project:** Digital Library

**Project Type:** BTech Final-Year Software Project

**Release:** Version 1

**Frontend:** HTML, CSS, Vanilla JavaScript

**Backend:** Node.js and Express.js

**Database:** MySQL

**Architecture:** Monolithic web application

**Product Source Document:** `docs/01-product/PRD.md`

**Technical Requirements:** `docs/03-technical/TRD.md`

**Software Requirements:** `docs/02-requirements/SRS.md`

**Implementation Status:** Must be determined from current local source code and verification evidence.

**Release Readiness:** Must be determined from integrated testing, security verification, and deployment evidence.

---

## 25. Approval

**Document:** Product Requirements Document (PRD)

**Version:** 1.0

**Release:** V1

**Status:** Active

**Prepared for:** Digital Library — BTech Final-Year Project
