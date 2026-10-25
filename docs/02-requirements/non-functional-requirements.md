# Digital Library — Non-Functional Requirements

**Project:** Digital Library  
**Project Type:** BTech Final-Year Software Project  
**Release:** Version 1 (V1)  
**Document Version:** 1.0  
**Status:** Active  
**Related Documents:** `docs/02-requirements/SRS.md`, `docs/02-requirements/functional-requirements.md`

---

## 1. Purpose

This document defines the non-functional requirements (NFRs) for the Digital Library application.

Non-functional requirements describe the quality attributes and operational constraints that govern how the system should behave. They complement functional requirements by specifying expectations for security, performance, reliability, usability, maintainability, compatibility, and data protection.

These requirements describe intended quality goals. They do not establish that the current application already meets them. Compliance must be evaluated through code review, testing, configuration inspection, and other appropriate evidence.

---

## 2. Scope

The non-functional requirements apply to the following system components:

- Frontend built with HTML, CSS, and Vanilla JavaScript.
- Backend built with Node.js and Express.js.
- MySQL database.
- Authentication and authorization mechanisms.
- Shared library catalogue.
- Online reader.
- Private PDF library.
- PDF processing.
- Browser-based text-to-speech.
- Development, testing, and deployment environments.

The application must retain its approved monolithic architecture and technology stack unless a change is explicitly approved.

---

## 3. Requirement Conventions

Each requirement has a unique identifier.

Priority definitions:

- **MUST:** Required for the approved Version 1 scope.
- **SHOULD:** Expected where applicable, subject to documented constraints.
- **TARGET:** A measurable goal proposed for evaluation; it is not a verified performance guarantee.
- **FUTURE:** Deferred to a later release.

Where a numerical threshold has not been approved or measured, it must not be presented as an established project commitment.

---

## 4. Security Requirements

### NFR-SEC-001 — Password Protection

**Priority:** MUST

Passwords must not be stored in plaintext.

The application must use the approved password-hashing mechanism and must not expose passwords in API responses, logs, or error messages.

**Verification:** Inspect password-handling code and verify stored password representations.

### NFR-SEC-002 — Authentication

**Priority:** MUST

Protected resources must require valid authentication according to the application's documented authentication design.

Authentication failures must be handled consistently without revealing unnecessary sensitive information.

**Verification:** Test protected endpoints with missing, invalid, and valid authentication.

### NFR-SEC-003 — Authorization

**Priority:** MUST

The backend must enforce role-based permissions and resource-ownership rules.

Frontend controls must not be treated as a security boundary.

**Verification:** Test permitted and denied operations using different user roles and resource owners.

### NFR-SEC-004 — Database Security

**Priority:** MUST

User-controlled values must be handled through parameterized SQL queries or equivalent safe database operations.

Database credentials must not be exposed through frontend code or public API responses.

**Verification:** Inspect database access code and review database configuration.

### NFR-SEC-005 — Input Validation

**Priority:** MUST

The application must validate untrusted input before processing it.

Validation must cover applicable request fields, identifiers, query parameters, and file-upload metadata.

Invalid input must not bypass business rules or access controls.

**Verification:** Execute relevant positive, negative, and boundary-value tests.

### NFR-SEC-006 — Cross-Site Scripting Protection

**Priority:** MUST

The frontend must render untrusted content safely.

Book metadata, chapter text, and other user-controlled content must not be interpreted as unintended executable script.

**Verification:** Review rendering operations and perform appropriate input-security tests.

### NFR-SEC-007 — Authentication Cookie Protection

**Priority:** MUST

Authentication cookies must use the security attributes required by the approved authentication design and deployment environment.

Production cookie settings must be reviewed for HTTPS, cross-origin behavior, and applicable browser requirements.

**Verification:** Inspect the cookie configuration and the actual response headers in the target environment.

### NFR-SEC-008 — Rate Limiting

**Priority:** MUST

Sensitive endpoints, especially authentication endpoints, must apply the configured rate limits.

Rate limiting must produce an appropriate response when the applicable threshold is exceeded.

**Verification:** Review middleware configuration and test the relevant endpoints.

### NFR-SEC-009 — Security Headers and CORS

**Priority:** MUST

The backend must apply the approved security-header configuration.

CORS must permit only the origins and methods required by the intended application environment.

Production configuration must not unnecessarily expose the application to arbitrary origins.

**Verification:** Inspect configuration and test response headers in the target environment.

### NFR-SEC-010 — Error Disclosure

**Priority:** MUST

Production error responses must not disclose stack traces, secrets, database credentials, or unnecessary internal implementation details.

Errors must remain useful enough for clients to understand the outcome of their requests.

**Verification:** Test representative validation, authentication, database, and server errors.

### NFR-SEC-011 — Secret Management

**Priority:** MUST

Environment-specific secrets must be stored outside source code and supplied through appropriate configuration mechanisms.

Real credentials must not be committed to the repository or included in documentation.

Example environment files must use placeholders.

**Verification:** Review environment configuration and repository changes before committing.

---

## 5. Private File and Data Protection Requirements

### NFR-DATA-001 — Private PDF Confidentiality

**Priority:** MUST

A user's private PDF documents must be accessible only to authorized users.

The backend must enforce ownership checks for listing, retrieving, streaming, and deleting private files as applicable.

**Verification:** Attempt cross-user access using separate test accounts.

### NFR-DATA-002 — Separation of Private and Shared Content

**Priority:** MUST

Private user documents must remain logically separate from the shared library catalogue.

Uploading a personal PDF must not automatically make it public.

**Verification:** Inspect storage, database relationships, and access routes.

### NFR-DATA-003 — File Upload Safety

**Priority:** MUST

The application must validate permitted file types, file sizes, and relevant upload constraints.

File paths and stored filenames must be handled safely to reduce path-traversal and unauthorized-access risks.

**Verification:** Test valid, invalid, oversized, and malformed uploads.

### NFR-DATA-004 — Data Integrity

**Priority:** MUST

The application must preserve required relationships and consistency rules across database operations.

Invalid references must be rejected through database constraints or equivalent application validation.

**Verification:** Inspect the schema and test relevant create, update, and delete operations.

### NFR-DATA-005 — Data Persistence

**Priority:** MUST

Successful operations must persist according to the documented database and storage design.

The deployment environment must provide appropriate persistent storage for data that must survive application restarts or redeployments.

**Verification:** Confirm records and required files remain available after a controlled restart or deployment test.

### NFR-DATA-006 — Data Minimization

**Priority:** SHOULD

The application should collect and retain only information needed for its defined functionality.

Access to personal data should be limited to authorized operations.

**Verification:** Review data fields, API responses, and access controls.

---

## 6. Performance Requirements

### NFR-PERF-001 — Responsive API Behavior

**Priority:** MUST

The application should respond to ordinary API requests without unnecessary processing or database operations.

Performance evaluation must use a documented test environment and representative requests.

**Verification:** Measure relevant API response times under a defined test workload.

### NFR-PERF-002 — Database Efficiency

**Priority:** MUST

Database operations should use appropriate queries, constraints, and indexes for the supported access patterns.

Pagination should be used for collection endpoints where appropriate.

**Verification:** Review SQL queries, schema indexes, and representative query performance.

### NFR-PERF-003 — Catalogue Pagination

**Priority:** MUST

Book-listing endpoints must apply the documented pagination behavior and must not return the entire catalogue unnecessarily when pagination is required.

Pagination parameters must be validated and bounded according to the API contract.

**Verification:** Test default, valid, invalid, and boundary pagination parameters.

### NFR-PERF-004 — Reader Performance

**Priority:** SHOULD

The reader should display supported content without unnecessary interface blocking.

Long chapters should be handled in a way that avoids avoidable rendering and speech-processing overhead.

**Verification:** Test representative short and long chapters in supported browsers.

### NFR-PERF-005 — PDF Processing

**Priority:** MUST

PDF processing must handle invalid or corrupted files safely and must not unnecessarily disrupt unrelated application operations.

The system should apply suitable upload limits and resource controls.

**Verification:** Test representative PDF files and observe failure behavior and resource usage.

### NFR-PERF-006 — Performance Targets

**Priority:** TARGET

If the project adopts numerical response-time or throughput targets, those targets must be recorded with:

- The endpoint or workflow being measured.
- The test environment.
- The test dataset and request pattern.
- The measurement method.
- The acceptance threshold.

No specific response-time guarantee is established by this document until a target is approved and measured.

---

## 7. Reliability and Availability Requirements

### NFR-REL-001 — Graceful Error Handling

**Priority:** MUST

The application must handle expected validation, authorization, resource, database, and file-processing failures through its established error-handling approach.

An error in an optional feature should not unnecessarily disable unrelated core functionality.

**Verification:** Execute relevant failure-path tests.

### NFR-REL-002 — Consistent Operation Results

**Priority:** MUST

The application must not report a failed operation as successful.

Where a workflow modifies related records, the implementation must preserve the intended consistency rules.

**Verification:** Test failed operations and inspect the resulting database state.

### NFR-REL-003 — Database Connectivity

**Priority:** MUST

The backend must handle database connection failures according to its configuration and error-handling design.

The application must not expose credentials or unnecessary internal database details when connectivity fails.

**Verification:** Test the documented failure-handling behavior in a controlled environment.

### NFR-REL-004 — Restart Behavior

**Priority:** MUST

The application must be able to start using its documented configuration and dependencies.

Data that must persist must not depend solely on process memory.

The existing in-memory authentication-token blacklist has a restart-related limitation that must remain documented.

**Verification:** Perform a controlled restart and verify the documented persistence and authentication behavior.

### NFR-REL-005 — Health Monitoring

**Priority:** SHOULD

The application should expose an appropriate health endpoint for checking basic service availability.

A health response must not expose secrets or sensitive system information.

A successful health check must not be interpreted as proof that every application feature is functioning.

**Verification:** Test the health endpoint and inspect its response.

---

## 8. Usability Requirements

### NFR-UX-001 — Clear Navigation

**Priority:** MUST

The interface must provide understandable navigation between the available pages and functions.

Users should be able to identify the actions available to their role.

**Verification:** Conduct manual navigation tests using the supported user roles.

### NFR-UX-002 — Consistent Interface

**Priority:** SHOULD

Similar interface controls should follow consistent visual and behavioral conventions.

**Verification:** Review related pages and workflows for consistency.

### NFR-UX-003 — Action Feedback

**Priority:** MUST

The interface must provide appropriate feedback for successful operations, validation errors, authorization failures, loading states, and processing errors where applicable.

**Verification:** Test representative successful and failed user journeys.

### NFR-UX-004 — Readable Content

**Priority:** MUST

The reader must present content in a readable format and support the reader settings included in the approved implementation.

**Verification:** Inspect representative books and reader configurations.

### NFR-UX-005 — Responsive Layout

**Priority:** MUST

The interface must remain usable at the supported desktop, tablet, and mobile viewport sizes.

Important controls must remain accessible without unnecessary horizontal overflow.

**Verification:** Perform responsive layout checks at documented viewport sizes.

---

## 9. Accessibility Requirements

### NFR-A11Y-001 — Semantic Structure

**Priority:** SHOULD

Pages should use semantic HTML elements that reflect their content and purpose.

### NFR-A11Y-002 — Form Labels

**Priority:** MUST

Form controls must have suitable accessible labels or equivalent accessible names.

### NFR-A11Y-003 — Keyboard Navigation

**Priority:** SHOULD

Relevant navigation and form controls should be usable with a keyboard.

Focus indicators should remain visible.

### NFR-A11Y-004 — Color and Contrast

**Priority:** SHOULD

Text and essential controls should have sufficient contrast for readability.

Theme choices should not make essential content or controls unreadable.

### NFR-A11Y-005 — Speech Feature Compatibility

**Priority:** SHOULD

Text-to-speech functionality should handle supported browser capabilities appropriately.

Unavailable voices or speech features must not prevent ordinary text reading.

**Verification:** Perform manual accessibility checks and test speech behavior in documented browsers.

These requirements do not claim compliance with a specific accessibility standard unless that standard is explicitly adopted and evaluated.

---

## 10. Compatibility Requirements

### NFR-COMP-001 — Supported Browsers

**Priority:** MUST

The application must work in the browsers selected for the project's supported environment.

The supported browser versions must be documented based on actual testing.

### NFR-COMP-002 — Responsive Devices

**Priority:** MUST

The interface must support the documented desktop and mobile viewport ranges.

### NFR-COMP-003 — Browser Speech Capabilities

**Priority:** MUST

The application must handle differences in browser speech support, available voices, and supported speech settings.

The application must not assume identical text-to-speech behavior in every browser.

### NFR-COMP-004 — PDF Compatibility

**Priority:** MUST

The application must handle supported PDF documents according to the existing PDF-processing implementation.

Unsupported or malformed files must be rejected or handled safely.

---

## 11. Maintainability Requirements

### NFR-MAINT-001 — Separation of Responsibilities

**Priority:** MUST

The backend should preserve its existing separation of responsibilities across routes, controllers, services, repositories, and database access where applicable.

### NFR-MAINT-002 — Consistent Coding Standards

**Priority:** MUST

New and modified code must follow the project's established coding conventions.

### NFR-MAINT-003 — Configuration Management

**Priority:** MUST

Environment-specific configuration must be separated from application logic where appropriate.

### NFR-MAINT-004 — Documentation Consistency

**Priority:** MUST

Changes to APIs, database structure, security behavior, and product scope must be reflected in the relevant documentation.

### NFR-MAINT-005 — Change Safety

**Priority:** MUST

Changes must preserve existing working functionality unless an approved requirement explicitly changes that behavior.

Relevant tests must be run after modifications.

### NFR-MAINT-006 — Avoid Unnecessary Complexity

**Priority:** MUST

The implementation must remain appropriate for the project's approved monolithic architecture and technology stack.

Unnecessary microservices, frameworks, or infrastructure must not be introduced without an approved project decision.

---

## 12. Testability and Observability Requirements

### NFR-TEST-001 — Testable Behavior

**Priority:** MUST

Core application behavior must be defined clearly enough to be tested using appropriate unit, API, integration, security, and manual tests.

### NFR-TEST-002 — Repeatable Verification

**Priority:** MUST

Documented tests should be repeatable using controlled test data and documented environment requirements.

### NFR-TEST-003 — Accurate Test Reporting

**Priority:** MUST

Test reports must distinguish passed, failed, skipped, blocked, and untested cases.

Tests must not be reported as passing without actual execution evidence.

### NFR-OBS-001 — Useful Error Logging

**Priority:** MUST

The application should record sufficient diagnostic information to investigate failures without exposing passwords, tokens, secrets, or unnecessary personal information.

### NFR-OBS-002 — Operational Health

**Priority:** SHOULD

The deployment should provide an appropriate method for identifying basic service availability and relevant operational failures.

---

## 13. Backup and Recovery Requirements

### NFR-REC-001 — Database Backup

**Priority:** MUST before public production release

A documented database-backup procedure must exist before the application is released publicly.

### NFR-REC-002 — File Backup

**Priority:** MUST before public production release

If uploaded PDFs must persist, the deployment must provide appropriate persistent storage and a documented backup strategy for those files.

### NFR-REC-003 — Recovery Procedure

**Priority:** MUST before public production release

A documented procedure must describe how the database and required files can be restored after a relevant failure.

### NFR-REC-004 — Recovery Verification

**Priority:** SHOULD

Backup and recovery procedures should be tested in a controlled environment before being relied on for production recovery.

No specific recovery-time or recovery-point guarantee is established until measurable targets are approved and verified.

---

## 14. Deployment and Configuration Requirements

### NFR-DEP-001 — Environment Separation

**Priority:** MUST

Development, testing, staging, and production configuration must be handled appropriately for their respective environments.

### NFR-DEP-002 — Secret Protection

**Priority:** MUST

Production credentials and tokens must not be embedded in frontend code or committed to the repository.

### NFR-DEP-003 — HTTPS

**Priority:** MUST before public production release

The public deployment must use HTTPS and appropriate secure-cookie settings.

### NFR-DEP-004 — CORS Configuration

**Priority:** MUST

Cross-origin access must be restricted to the origins required by the deployed frontend and API arrangement.

### NFR-DEP-005 — Persistent Storage

**Priority:** MUST

The target deployment must provide suitable storage for database records and uploaded files that must persist.

### NFR-DEP-006 — Deployment Verification

**Priority:** MUST

The deployed application must be checked for startup, database connectivity, authentication, core workflows, private-file access, and relevant runtime errors.

---

## 15. Privacy Requirements

### NFR-PRIV-001 — User Data Access

**Priority:** MUST

Users must access only the personal information and private resources permitted by the application's authorization rules.

### NFR-PRIV-002 — Data Exposure

**Priority:** MUST

API responses must not include unnecessary sensitive information.

### NFR-PRIV-003 — Private File Isolation

**Priority:** MUST

Private documents must remain isolated by user ownership and must not be exposed through unrestricted public routes.

### NFR-PRIV-004 — Sensitive Logging

**Priority:** MUST

Logs must not contain plaintext passwords, authentication secrets, or unnecessary sensitive document contents.

---

## 16. Non-Functional Requirement Verification

The following table summarizes how requirement groups should be evaluated.

| Requirement group | Suggested verification method |
|---|---|
| Security | Code review, API security tests, configuration inspection |
| Private data protection | Cross-user access tests, storage review |
| Performance | Measurements under a documented workload |
| Reliability | Failure-path tests, restart checks |
| Usability | Manual user-journey evaluation |
| Accessibility | Keyboard, focus, contrast, and label checks |
| Compatibility | Testing in documented browsers and viewport sizes |
| Maintainability | Code review, test execution, documentation review |
| Testability | Repeatable test execution and result recording |
| Backup and recovery | Controlled backup and restore test |
| Deployment | Staging and production-configuration verification |
| Privacy | API response review and access-control tests |

The existence of a requirement does not mean that it has passed verification.

---

## 17. Requirement Traceability

Each non-functional requirement should be linked to:

- The relevant product requirement.
- The applicable functional requirement.
- The technical component affected.
- The verification method.
- The test case or inspection record.
- The actual result.

The intended traceability relationship is:

Non-Functional Requirement → Design or Configuration → Verification Method → Evidence → Result

Use stable requirement identifiers when linking test cases and technical documents.

---

## 18. Future-Scope Quality Considerations

Future features such as chapter translation, AI-assisted semantic search, AI recommendations, and refresh-token functionality will require additional non-functional evaluation before implementation.

Potential considerations include:

- Privacy and data handling.
- Resource usage.
- Performance.
- External service dependencies.
- Security and authentication lifecycle.
- Error handling.
- Accessibility and usability.
- Testability and operational support.

These considerations do not bring future-scope features into the mandatory V1 release.

---

## 19. Related Documents

This document must remain consistent with:

- `docs/DOCUMENTATION-INDEX.md`
- `docs/AI-CONTEXT.md`
- `docs/01-product/PRD.md`
- `docs/01-product/feature-list.md`
- `docs/01-product/roadmap.md`
- `docs/01-product/vision-and-scope.md`
- `docs/02-requirements/SRS.md`
- `docs/02-requirements/functional-requirements.md`
- `docs/02-requirements/acceptance-criteria.md`
- `docs/03-technical/architecture.md`
- `docs/03-technical/database-design.md`
- `docs/03-technical/TRD.md`
- `docs/05-security/`
- `docs/06-development/module-status.md`
- `docs/07-testing/`
- `docs/08-deployment/`

---

## 20. Document Maintenance

Review these requirements whenever:

- The technology stack or architecture changes through an approved decision.
- Security or privacy controls change.
- Database or file-storage behavior changes.
- Performance targets are approved.
- Supported browsers or deployment environments change.
- Backup or recovery requirements change.
- New quality requirements are introduced.
- Version 1 scope changes.

Record measurable targets and verification outcomes only when they are supported by project decisions and actual evidence.

---

## 21. Summary

These non-functional requirements define the quality and operational expectations for Digital Library across security, privacy, performance, reliability, usability, accessibility, compatibility, maintainability, testing, recovery, and deployment.

They provide a basis for design reviews, verification planning, and release-readiness decisions.

The requirements are not proof of compliance. Each applicable requirement must be evaluated using suitable evidence from the actual implementation and target environment.
