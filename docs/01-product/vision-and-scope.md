# Digital Library — Vision and Scope

**Project:** Digital Library  
**Project Type:** BTech Final-Year Software Project  
**Release:** Version 1 (V1) and Future Releases  
**Document Version:** 1.0  
**Status:** Active  
**Related Document:** `docs/01-product/PRD.md`

---

## 1. Purpose

This document defines the vision, intended users, product direction, scope boundaries, core capabilities, and future possibilities of the Digital Library application.

It explains what the project aims to achieve, which capabilities belong to its intended Version 1 scope, and which enhancements are reserved for later releases.

This document complements the Product Requirements Document (PRD), Software Requirements Specification (SRS), and Technical Requirements Document (TRD).

The vision describes the intended direction of the product. It does not establish that every described capability has already been implemented, tested, or deployed.

---

## 2. Product Identity

**Product Name:** Digital Library

**Product Type:** Web-based digital library and reading application

**Project Context:** BTech final-year software project

**Primary Audience:** Readers and administrators who use the application to access, organize, manage, and read digital content.

**Approved Technology Stack:**
- HTML
- CSS
- Vanilla JavaScript
- Node.js
- Express.js
- MySQL

**Architecture:** Monolithic web application.

The project must preserve its approved technology stack and existing application architecture unless a change is explicitly approved.

---

## 3. Product Vision

The vision of Digital Library is to provide a centralized, secure, accessible, and user-friendly platform for discovering, managing, and reading digital books and documents.

The application aims to combine shared library catalogue management, controlled access to published content, personal PDF storage, and customizable reading functionality within one web application.

The intended product experience is:

Discover available content
→ Access permitted resources
→ Read books and documents
→ Customize the reading environment
→ Listen to supported text using text-to-speech

Administrators also need appropriate tools to maintain library content, manage publication status, and organize books and related information.

The product should remain simple enough to understand and maintain while supporting additional capabilities in later releases.

---

## 4. Product Goals

The primary product goals are:

1. Provide an organized digital library catalogue.
2. Support user registration, authentication, and account management.
3. Enforce permissions for regular users and administrators.
4. Organize books, authors, categories, and chapters.
5. Support controlled publication and visibility of library content.
6. Allow users to discover accessible books.
7. Provide an online reading experience.
8. Support reading customization, including implemented typography and theme controls.
9. Provide browser-based text-to-speech where supported.
10. Keep personal PDF documents separate from the shared catalogue.
11. Protect private files through authentication, authorization, and ownership checks.
12. Maintain a consistent, testable, and maintainable codebase.
13. Establish release readiness through integration, testing, and deployment verification.

These goals describe the intended product outcomes. Their implementation and acceptance must be evaluated separately.

---

## 5. Target Users

### 5.1 Regular Users

Regular users primarily access permitted library content and manage personal reading materials.

Depending on the implemented functionality and permissions, users may:

- Register and log in.
- Log out securely according to the existing authentication design.
- View and update permitted profile information.
- Browse available books.
- View book details and related chapters.
- Read accessible content online.
- Navigate between available chapters.
- Customize supported reading settings.
- Use supported text-to-speech features.
- Upload and manage their own private PDF documents.

Users must not be able to access another user's private documents or perform administrator-only operations.

### 5.2 Administrators

Administrators are responsible for authorized library-management activities.

Depending on the implemented functionality, administrators may:

- Create and manage books.
- Manage author records.
- Manage categories.
- Manage chapters and chapter order.
- Manage publication and archival status.
- Control content visibility.
- Review or manage submissions where supported.
- Perform other permitted administrative operations.

Administrative authority must be enforced by the backend rather than relying only on frontend controls.

---

## 6. Core Product Capabilities

### 6.1 Authentication and User Management

The application is intended to provide account registration, login, logout, authenticated-user verification, profile operations, and password changes where implemented.

Protected resources must require the appropriate authentication.

The existing authentication implementation and its limitations must be described accurately in the security documentation.

### 6.2 Shared Library Catalogue

The application maintains structured information about:

- Books.
- Authors.
- Categories.
- Chapters.
- Book-author relationships.
- Book-category relationships.
- Publication and visibility information.

These records allow the system to organize library content and support discovery and reading.

Administrative operations must follow the applicable permission and validation rules.

### 6.3 Book Discovery

Users should be able to locate and navigate available library content.

The intended capabilities include paginated browsing, viewing book information, accessing associated authors and categories, and navigating available chapters.

Search and filtering must behave consistently with their documented implementation. A search result limited to the currently loaded page must not be represented as a search across the entire catalogue.

The authentication requirements for catalogue pages and endpoints must agree with the approved product decision and the actual frontend and backend configuration.

### 6.4 Online Reading

Authorized users should be able to open accessible books and read their chapters using the online reading interface.

The intended reading experience prioritizes:

- Readable text.
- Clear chapter navigation.
- Appropriate loading and error states.
- Supported display customization.
- Access control for protected content.

Reading progress and resume behavior should only be included in the verified feature inventory where the implementation supports them.

### 6.5 Reading Customization

Where implemented, the reader allows users to adjust settings such as:

- Font size.
- Font family.
- Line height.
- Reading width.
- Light theme.
- Dark theme.
- Sepia theme.
- Auto-scroll controls.

Settings should behave predictably across supported screen sizes and should not interfere with normal reading.

Preference persistence must not be assumed unless it is implemented and verified.

### 6.6 Text-to-Speech

The application provides browser-based text-to-speech for supported reading content.

The intended controls include play, pause, resume, stop, speed adjustment, pitch adjustment, and voice selection where supported.

The feature inventory identifies a planned maximum speech speed of 4x. The supported behavior must be verified in the actual implementation and target browsers.

Browser capabilities and available voices can vary. If text-to-speech is unavailable, users should still be able to read the document normally.

### 6.7 Private PDF Library

The application provides a separate private area for users' personal PDF documents.

The intended capabilities include:

- Uploading personal PDF files.
- Listing a user's own files.
- Accessing authorized files.
- Deleting owned files.
- Validating uploads.
- Processing supported documents.

The private library must remain separate from the shared published-book catalogue.

Every private-file operation must enforce appropriate authentication, authorization, and ownership checks on the backend.

Private files must not be exposed through unrestricted public file-serving routes.

### 6.8 PDF Processing

Where implemented, PDF processing uses the existing PDF-processing library to extract available document text and images.

The application should handle invalid, unsupported, or corrupted documents gracefully.

PDFs containing selectable text are different from scanned PDFs containing only page images. OCR support for scanned PDFs is not established as a completed Version 1 feature in the existing inventory.

---

## 7. Product Boundaries

Digital Library is primarily a digital library management and digital reading application.

Its central purpose is to:

- Organize library content.
- Provide controlled access to published resources.
- Support personal PDF management.
- Provide online reading.
- Support reader customization and text-to-speech.

The project should not expand into unrelated product categories without an approved scope change.

The following are outside the intended Version 1 scope unless explicitly approved:

- Microservices architecture.
- Replacement of the approved technology stack.
- General-purpose social networking.
- Cryptocurrency functionality.
- Unnecessary payment systems.
- Unrelated enterprise software.
- Unrestricted third-party downloading.
- An unrelated video-streaming platform.
- Unnecessary AI infrastructure.
- Unrelated chatbot functionality.

New requirements must be evaluated according to their relevance to the project's core goals.

---

## 8. Version 1 Scope

Version 1 is intended to deliver an integrated implementation of the approved core library and reading capabilities.

The intended scope includes:

### Authentication and Access Control
- User registration and login.
- Logout.
- Profile operations where implemented.
- Role-based authorization.
- Protected resources.

### Catalogue Management
- Book management.
- Author management.
- Category management.
- Chapter management.
- Relevant relationships.
- Publishing, visibility, and archiving workflows where implemented.

### Discovery and Reading
- Paginated book browsing.
- Available book information.
- Chapter navigation.
- Online reading.
- Implemented reader customization.
- Implemented auto-scroll behavior.
- Browser-based text-to-speech.

### Private PDF Management
- Private PDF upload.
- Personal file listing.
- Authorized file access.
- File deletion.
- File validation and supported PDF processing.

### Quality and Security
- Input validation.
- Authentication and authorization checks.
- Private-file ownership enforcement.
- Appropriate error handling.
- Relevant automated and manual testing.
- Documentation and release preparation.

This scope defines the intended release. Actual completion must be determined from the current source code, database schema, test evidence, and approved decisions.

---

## 9. Features Deferred to Future Releases

The existing product feature inventory classifies the following features as future scope:

| Feature | Classification |
|---|---|
| Refresh-token workflow | FUTURE_SCOPE |
| Chapter translation | FUTURE_SCOPE |
| AI-assisted semantic search | FUTURE_SCOPE |
| AI-assisted book recommendations | FUTURE_SCOPE |

These classifications should remain consistent across the PRD, feature inventory, roadmap, requirements, and academic documentation.

A future feature may be moved into Version 1 only through an approved scope change and appropriate implementation and verification.

---

## 10. Quality and User Experience Principles

The application should follow these principles.

### Clarity
Users should be able to understand the available actions and navigation.

### Readability
The reading interface should prioritize readable content and comfortable presentation.

### Consistency
Similar controls and operations should behave consistently across the application.

### Accessibility
Interface controls should be usable with supported input methods and accessible markup.

### Security
Protected operations and private resources must follow the authorization rules.

### Reliability
Failures should produce understandable feedback without unnecessarily disrupting other functionality.

### Maintainability
The implementation should retain clear responsibilities and avoid unnecessary complexity.

### Responsiveness
The interface should adapt to supported desktop, tablet, and mobile displays.

These are product quality goals and must not be presented as independently verified compliance claims.

---

## 11. Security and Privacy Boundaries

The product must protect user accounts, restricted content, personal documents, and configuration secrets.

The intended security approach includes:

- Password hashing.
- Authentication checks.
- Role-based authorization.
- Input validation.
- Parameterized SQL queries.
- Appropriate rate limiting.
- Secure authentication-cookie or token handling.
- Private-file ownership enforcement.
- File-upload restrictions.
- Safe error responses.
- Protection against common web-application vulnerabilities.

Security documentation must describe the actual implementation and known limitations.

For example, an in-memory token blacklist does not preserve token revocations across a server restart. Such limitations must be documented accurately.

The presence of security middleware or libraries does not establish that the application is completely secure.

---

## 12. Technical and Architecture Constraints

The approved technology stack remains:

- HTML, CSS, and Vanilla JavaScript.
- Node.js and Express.js.
- MySQL.

The architecture remains monolithic.

The existing layered backend structure should be preserved where applicable:

Route
→ Controller
→ Service
→ Repository
→ MySQL

The frontend must communicate with the backend through the application's API layer.

Database access must remain within the backend.

Changes to the technology stack or architecture require an explicit project decision and corresponding documentation updates.

---

## 13. Scope Acceptance Principles

A feature should be considered accepted only when:

1. Its intended behavior is clearly defined.
2. The relevant implementation has been inspected.
3. Required validation and access rules are enforced.
4. Relevant tests have been executed.
5. Actual outcomes have been recorded.
6. Known limitations have been documented.
7. Related documentation is consistent.

A feature appearing in a roadmap or source-code file does not prove that it is complete.

A successful health endpoint does not establish that the complete application is ready for release.

---

## 14. Release and Deployment Boundaries

Before the application is made publicly accessible, the integrated release should be reviewed for:

- Frontend and backend integration.
- Database connectivity and integrity.
- Authentication and authorization.
- Catalogue and publishing workflows.
- Private PDF access control.
- Reader behavior and supported speech controls.
- Automated and manual test outcomes.
- Environment configuration and secret management.
- HTTPS and appropriate CORS configuration.
- Persistent document storage.
- Database backup and recovery.
- Deployment verification.

A staging environment should be tested before public release.

This document does not claim that a production deployment exists or that every release requirement has already been satisfied.

---

## 15. Relationship to Other Documents

This vision and scope document must remain consistent with:

- `docs/DOCUMENTATION-INDEX.md`
- `docs/AI-CONTEXT.md`
- `docs/01-product/feature-list.md`
- `docs/01-product/PRD.md`
- `docs/01-product/roadmap.md`
- `docs/02-requirements/SRS.md`
- `docs/02-requirements/functional-requirements.md`
- `docs/02-requirements/non-functional-requirements.md`
- `docs/03-technical/TRD.md`
- `docs/03-technical/architecture.md`
- `docs/03-technical/database-design.md`
- `docs/06-development/module-status.md`
- `docs/07-testing/`
- `docs/08-deployment/`
- `docs/10-academic/future-scope.md`

If the approved product scope changes, update the related documents together.

---

## 16. Document Maintenance

Review this document when:

- Product goals change.
- Major capabilities are added or removed.
- Release scope changes.
- A feature is moved between Version 1 and future releases.
- Approved technology or architecture constraints change.
- New product boundaries are established.

Use reliable evidence when recording implementation status, historical decisions, or milestone dates.

Do not invent missing decisions or completion claims simply to fill a document.

---

## 17. Summary

Digital Library aims to provide a centralized web application for catalogue management, controlled access to digital content, personal PDF storage, and online reading.

Its intended Version 1 scope focuses on the core library-management and reading capabilities using HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL within a monolithic architecture.

Refresh-token functionality, chapter translation, AI-assisted semantic search, and AI-assisted recommendations remain classified as future-scope features in the existing product inventory.

The current implementation status and release readiness must be established using the local source code, database structure, test evidence, and approved project decisions.
