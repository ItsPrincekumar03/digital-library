# Digital Library — Software Requirements Specification (SRS)

**Project:** Digital Library  
**Project Type:** BTech Final-Year Project  
**Release Scope:** Version 1 (V1)  
**Document Version:** 1.0  
**Status:** Active  
**Primary Stack:** HTML, CSS, Vanilla JavaScript, Node.js, Express.js, MySQL

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification defines the functional and non-functional requirements of the Digital Library application.

It establishes the system's intended capabilities, user roles, interfaces, data requirements, constraints, and quality expectations. It serves as a reference for implementation, testing, documentation, and project evaluation.

This document describes the intended system requirements. It does not independently prove that every feature has been implemented or verified.

### 1.2 Project Scope

Digital Library is a web-based application for managing, discovering, reading, and organizing digital books and personal PDF documents.

The V1 scope includes the following areas, subject to verification against the current implementation:

- User registration, login, and logout.
- Role-based access for users and administrators.
- Book catalogue and metadata management.
- Author and category management.
- Chapter management and book relationships.
- Publishing, visibility, and archival workflows where implemented.
- Reading supported book content through a browser interface.
- Private PDF library functionality.
- PDF processing within the supported implementation.
- Reader display preferences.
- Browser-based text-to-speech where supported.
- Input validation and security controls.
- MySQL persistence.

### 1.3 Intended Audience

This document is intended for:

- Project team members.
- Student developers.
- Project supervisors and evaluators.
- Testers.
- Future maintainers.
- Developers using AI-assisted coding tools.

### 1.4 Definitions and Abbreviations

| Term | Definition |
|---|---|
| SRS | Software Requirements Specification |
| UI | User Interface |
| API | Application Programming Interface |
| DB | Database |
| CRUD | Create, Read, Update, Delete |
| JWT | JSON Web Token |
| SQL | Structured Query Language |
| PDF | Portable Document Format |
| USER | Standard authenticated application role |
| ADMIN | Administrative application role |
| V1 | Initial approved release scope |
| NFR | Non-Functional Requirement |
| FR | Functional Requirement |

### 1.5 References

Related project documentation:

- `docs/DOCUMENTATION-INDEX.md`
- `docs/AI-CONTEXT.md`
- `docs/01-product/PRD.md`
- `docs/01-product/feature-list.md`
- `docs/01-product/roadmap.md`
- `docs/02-requirements/functional-requirements.md`
- `docs/02-requirements/non-functional-requirements.md`
- `docs/02-requirements/acceptance-criteria.md`
- `docs/02-requirements/use-cases.md`
- `docs/03-technical/architecture.md`
- `docs/03-technical/database-design.md`
- `docs/03-technical/api-specification.md`
- `docs/05-security/`

---

## 2. Overall Description

### 2.1 Product Perspective

Digital Library is a web application using a monolithic architecture.

The frontend communicates with a Node.js and Express.js backend through HTTP APIs. The backend applies validation, authorization, business rules, and data-access logic. MySQL stores structured application data.

The application must not introduce a microservices architecture unless an approved project decision changes this constraint.

### 2.2 System Architecture Overview

The logical request flow is:

Browser Frontend → Express Routes → Controllers → Services → Repositories → MySQL

Not every existing feature necessarily uses every layer. Actual code organization must be confirmed against the repository.

### 2.3 User Classes

#### 2.3.1 Guest

A guest is an unauthenticated visitor.

Guest access is limited to public functionality explicitly allowed by the API and visibility rules.

#### 2.3.2 Registered User

A registered user can authenticate and access features permitted by the USER role.

These may include reading accessible published books and managing their own private PDF documents, subject to implemented permissions.

#### 2.3.3 Administrator

An administrator has the permissions assigned to the ADMIN role.

Administrative capabilities may include managing books, authors, categories, chapters, and publication state, according to the implemented authorization rules.

An administrator must not be assumed to have unrestricted access to every private user resource unless explicitly authorized by the approved design.

### 2.4 Operating Environment

The intended development environment includes:

- Windows.
- Node.js.
- npm.
- Express.js.
- MySQL.
- A modern web browser.
- Visual Studio Code or another compatible code editor.
- Git for source control.

The actual deployment environment may differ and must be documented separately.

### 2.5 Design and Implementation Constraints

1. The frontend must use HTML, CSS, and Vanilla JavaScript for the approved V1 implementation.
2. The backend must use Node.js and Express.js.
3. MySQL must be used as the relational database.
4. The application must use a monolithic architecture.
5. API contracts must remain consistent with the backend implementation and API documentation.
6. Secrets must be provided through environment configuration rather than hardcoded source values.
7. Private documents must be protected by server-side authorization.
8. New dependencies must be justified and compatible with the approved stack.

### 2.6 Assumptions and Dependencies

- Node.js and npm are available in the development environment.
- MySQL is installed or accessible.
- Required environment variables are configured.
- The browser supports the application's required web features.
- Browser speech capabilities vary by browser and operating system.
- File storage is available for supported upload and processing workflows.
- Actual feature availability depends on completed implementation and successful verification.

---

## 3. System Features and Functional Requirements

### 3.1 Authentication and User Management

**Related IDs:** FR-AUTH

The system shall provide account and authentication functionality according to the approved authentication design.

Requirements:

- The system shall validate registration input.
- The system shall prevent duplicate accounts according to the configured uniqueness rules.
- The system shall securely hash passwords before storage.
- The system shall authenticate valid credentials.
- The system shall reject invalid authentication attempts.
- The system shall protect endpoints that require authentication.
- The system shall support logout according to the implemented token or session strategy.
- The system shall not expose password hashes or authentication secrets in ordinary API responses.

**Verification:** Registration, login, logout, invalid credentials, and protected-route tests.

### 3.2 Role-Based Authorization

**Related IDs:** FR-AUTHZ

The system shall distinguish USER and ADMIN permissions.

Requirements:

- Protected operations shall enforce authorization on the backend.
- Administrative operations shall reject unauthorized standard users.
- Resource ownership shall be checked where user-owned data is involved.
- Access decisions shall not rely solely on frontend visibility.

**Verification:** Test each protected operation using guest, USER, and ADMIN identities as applicable.

### 3.3 Book Management

**Related IDs:** FR-BOOK

The system shall manage book records according to the approved business rules.

Expected capabilities include:

- Creating permitted book records.
- Retrieving authorized book details.
- Updating permitted metadata.
- Listing books with appropriate filtering and pagination.
- Applying publishing, visibility, or archival rules where implemented.
- Maintaining relationships with authors, categories, and chapters where applicable.

**Verification:** Test valid and invalid CRUD operations, authorization, relationships, and visibility rules.

### 3.4 Author Management

**Related IDs:** FR-AUTHOR

The system shall support author records and their relationships to books where included in the approved V1 scope.

Requirements:

- Validate author data.
- Apply authorized create, read, update, and delete operations.
- Preserve referential integrity.
- Handle attempts to delete referenced records according to documented rules.

**Verification:** Author CRUD and relationship-integrity tests.

### 3.5 Category Management

**Related IDs:** FR-CATEGORY

The system shall support categorizing books.

Requirements:

- Authorized administrators shall manage categories according to the implemented rules.
- Book-category relationships shall follow the database design.
- Invalid category references shall be rejected.
- Catalogue filtering shall respect the documented API contract.

**Verification:** Category CRUD, relationship, and filtering tests.

### 3.6 Chapter Management

**Related IDs:** FR-CHAPTER

The system shall support chapter records associated with books where implemented.

Requirements:

- Validate chapter data.
- Associate chapters with valid parent books.
- Enforce permissions for chapter modifications.
- Apply documented ordering and visibility rules where implemented.
- Prevent invalid references and inconsistent parent-child relationships.

**Verification:** Chapter creation, retrieval, modification, deletion, and authorization tests.

### 3.7 Book Relationships and Visibility

**Related IDs:** FR-RELATION, FR-VISIBILITY

The system shall maintain supported relationships among books, authors, categories, and chapters.

Requirements:

- Validate referenced records.
- Enforce relationship-management permissions.
- Apply the approved publication and visibility rules.
- Prevent unauthorized retrieval of non-public content.
- Preserve database consistency during relationship changes.

**Verification:** Relationship tests and access tests for applicable publication states.

### 3.8 Reading Interface

**Related IDs:** FR-READER

The application shall provide a browser-based reading interface for supported content.

Expected capabilities may include:

- Displaying supported book or chapter content.
- Navigating between available reading sections.
- Applying supported reader display preferences.
- Presenting errors when content cannot be loaded.

Reader functionality must reflect the actual supported content model.

**Verification:** Test content retrieval, navigation, display settings, and failure states.

### 3.9 Private PDF Library

**Related IDs:** FR-PRIVATE-PDF

The system shall provide supported private PDF management functionality.

Requirements:

- Validate uploaded files according to configured constraints.
- Associate private documents with their owning users.
- Restrict document retrieval and management to authorized users.
- Handle unsupported or invalid documents safely.
- Preserve required files and metadata according to the storage design.

**Verification:** Upload tests, file validation tests, and cross-user authorization tests.

### 3.10 PDF Processing

**Related IDs:** FR-PDF

The system shall process supported PDF documents according to the current implementation.

Requirements:

- Reject or safely handle invalid files.
- Apply configured resource and file-size limits.
- Handle processing failures without falsely reporting success.
- Avoid exposing private content to unauthorized users.

The exact extraction, rendering, and persistence behavior must be documented from the implementation.

**Verification:** Test representative supported, malformed, and unsupported PDF files.

### 3.11 Reader Preferences

**Related IDs:** FR-READER-SETTINGS

The reader may provide supported display preferences, including themes and typography controls.

Requirements:

- Available settings shall be applied consistently within their supported scope.
- Theme changes shall preserve content readability.
- Unsupported settings shall not break ordinary reading.

**Verification:** Test every implemented preference and its expected persistence behavior.

### 3.12 Text-to-Speech

**Related IDs:** FR-TTS

Where implemented, the application shall use supported browser speech capabilities to read accessible text aloud.

Expected settings may include speech rate and pitch, subject to browser support and the implemented limits.

Requirements:

- Speech controls shall handle supported browser capabilities.
- The interface shall handle unavailable speech features appropriately.
- Speech errors shall not prevent ordinary text reading.
- The application shall not claim that every browser supports identical speech voices or settings.

**Verification:** Test supported browsers, speech start and stop behavior, and available settings.

### 3.13 Error Handling

**Related IDs:** FR-ERROR

The system shall provide consistent error responses.

Requirements:

- Validation errors shall be distinguishable from authentication and authorization failures.
- Missing resources shall return the documented response.
- Unexpected server errors shall not expose sensitive implementation details.
- Clients shall not receive a success result when an operation fails.

**Verification:** Test representative failure scenarios and confirm response status and structure.

---

## 4. External Interface Requirements

### 4.1 User Interface

The user interface shall:

- Provide appropriate navigation for available user roles.
- Display validation and operation feedback.
- Present supported catalogue and reader functionality.
- Provide clear authentication forms.
- Handle loading, empty, and error states where applicable.
- Remain usable at the documented viewport sizes.

The exact pages and controls are defined in the UI and page-specification documents.

### 4.2 Software Interfaces

The system interfaces include:

- Browser-to-backend HTTP API communication.
- Express.js backend-to-MySQL database access.
- Authentication and authorization middleware.
- PDF-processing dependencies used by the implementation.
- Browser speech APIs where supported.

### 4.3 API Interface

The backend shall expose versioned API routes according to the current route configuration and API specification.

Requirements:

- HTTP methods shall match the intended operation.
- Request and response structures shall follow the documented contract.
- Validation and authorization shall be applied at the appropriate server-side boundaries.
- Error status codes and response formats shall be consistent with the API contract.

Exact endpoints must be verified against the actual route files and API documentation.

### 4.4 Database Interface

The backend shall communicate with MySQL through the configured database access layer.

Requirements:

- Queries must safely handle user-controlled values.
- Required relationships and constraints must be maintained.
- Database failures must be handled appropriately.
- Database credentials must remain server-side.

---

## 5. Data Requirements

### 5.1 Data Categories

The system may store the following categories of data, depending on the implemented schema:

- User account records.
- Authentication-related state.
- Book metadata.
- Author records.
- Category records.
- Chapter records.
- Book relationships.
- Publication and visibility state.
- Private PDF metadata.
- File-storage references.
- Relevant timestamps and audit information where implemented.

The database design document is the authoritative source for actual table and column definitions.

### 5.2 Data Integrity

The system shall:

- Enforce required fields.
- Validate identifiers and references.
- Apply uniqueness constraints where required.
- Maintain referential integrity.
- Apply appropriate deletion and update rules.
- Prevent unauthorized modification of protected records.

### 5.3 Data Security

- Passwords shall be stored using the approved password-hashing mechanism.
- Private documents shall be protected through server-side access control.
- Sensitive credentials shall not be returned to clients.
- SQL operations shall use safe parameter handling.

### 5.4 Data Retention and Recovery

The project shall document how database records and required uploaded files are retained and backed up before public production deployment.

Specific retention periods and recovery guarantees must be approved separately if required.

---

## 6. Non-Functional Requirements

### 6.1 Security

The application must implement authentication, authorization, safe database access, input validation, suitable security headers, appropriate CORS configuration, and protection for private files.

### 6.2 Performance

The application should use efficient queries, suitable indexes, appropriate pagination, and resource limits for file processing.

Numerical performance targets must be established and measured before they are treated as release guarantees.

### 6.3 Reliability

The application must handle expected failures without falsely reporting success. Required persistent data must not rely solely on in-memory process state.

### 6.4 Usability

The application must provide clear navigation, meaningful feedback, readable content, and usable layouts for its documented supported viewport sizes.

### 6.5 Maintainability

The implementation must follow the approved stack and architecture, preserve separation of responsibilities where applicable, and keep technical documentation consistent with code changes.

### 6.6 Compatibility

Supported browsers and viewport ranges must be documented and tested. Browser-dependent functionality must handle unsupported capabilities appropriately.

### 6.7 Privacy

Private documents and user-specific resources must be protected by server-side ownership checks and authorization rules.

Detailed quality requirements are defined in `docs/02-requirements/non-functional-requirements.md`.

---

## 7. Security and Access-Control Requirements

### 7.1 Authentication Boundary

Protected API operations must validate the authentication mechanism specified by the implementation.

### 7.2 Role Boundary

Operations restricted to administrators must enforce the ADMIN role on the backend.

### 7.3 Ownership Boundary

Private resources must be accessible only to their owners and other explicitly authorized identities.

### 7.4 Input Boundary

The backend must treat client input as untrusted, including identifiers, filenames, metadata, and request bodies.

### 7.5 Failure Boundary

Authentication, authorization, validation, and unexpected server failures must not disclose secrets or private content.

The detailed security design and security documentation govern the implementation of these requirements.

---

## 8. Use Cases

The principal use cases include:

| ID | Use case | Primary actor |
|---|---|---|
| UC-01 | Register an account | Guest |
| UC-02 | Log in | Guest |
| UC-03 | Log out | Authenticated user |
| UC-04 | Browse accessible books | Guest or authenticated user, subject to visibility |
| UC-05 | View book details | Authorized visitor |
| UC-06 | Read supported content | Authorized visitor |
| UC-07 | Manage books | Administrator or another explicitly authorized role |
| UC-08 | Manage authors | Administrator or another explicitly authorized role |
| UC-09 | Manage categories | Administrator or another explicitly authorized role |
| UC-10 | Manage chapters | Administrator or another explicitly authorized role |
| UC-11 | Manage book relationships | Authorized role |
| UC-12 | Upload a private PDF | Authenticated user, if supported |
| UC-13 | View a private PDF | Owner or explicitly authorized identity |
| UC-14 | Apply reader preferences | Reader user |
| UC-15 | Use text-to-speech | Reader user, where supported |

Detailed preconditions, flows, alternate flows, and postconditions belong in `docs/02-requirements/use-cases.md`.

---

## 9. Acceptance and Verification

A requirement is accepted only when its expected behavior has been verified using an appropriate method.

Verification may include:

- Code inspection.
- API tests.
- Database integration tests.
- Authorization and security tests.
- Manual browser testing.
- File-upload and PDF-processing tests.
- Responsive-interface checks.
- Deployment checks.

Each verification record should include:

1. Requirement or test identifier.
2. Preconditions and test data.
3. Execution steps.
4. Expected result.
5. Actual result.
6. Pass, fail, blocked, or not-tested status.
7. Relevant evidence or defect reference.

A documented requirement is not evidence of successful implementation.

---

## 10. Out of Scope and Future Enhancements

The following capabilities must remain outside the V1 commitment unless separately approved and implemented:

- AI-assisted semantic search.
- AI-based personalized recommendations.
- Chapter translation.
- OCR for scanned PDF documents.
- A refresh-token workflow beyond the currently implemented authentication design.
- Additional media-processing capabilities not established in the approved V1 scope.

Future capabilities require their own functional requirements, non-functional requirements, security review, acceptance criteria, and implementation plan.

---

## 11. Project Constraints

1. The approved application stack is HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL.
2. The application uses a monolithic architecture.
3. Backend authorization is mandatory for protected operations.
4. Private user documents must remain protected.
5. Implementation must not introduce undocumented dependencies or architectural changes.
6. Existing functionality must be preserved unless a change is approved.
7. Documentation and test status must reflect actual implementation evidence.

---

## 12. Requirements Traceability

Requirements should be traceable across the following documents:

| Concern | Authoritative document |
|---|---|
| Product scope and goals | `docs/01-product/PRD.md` |
| Feature inventory | `docs/01-product/feature-list.md` |
| Functional behavior | `docs/02-requirements/functional-requirements.md` |
| Quality requirements | `docs/02-requirements/non-functional-requirements.md` |
| Acceptance conditions | `docs/02-requirements/acceptance-criteria.md` |
| Use-case details | `docs/02-requirements/use-cases.md` |
| System architecture | `docs/03-technical/architecture.md` |
| Database structure | `docs/03-technical/database-design.md` |
| API contracts | `docs/03-technical/api-specification.md` |
| Security controls | `docs/05-security/` |
| Development progress | `docs/06-development/module-status.md` |
| Test evidence | `docs/07-testing/` |
| Deployment readiness | `docs/08-deployment/` |

---

## 13. Change Management

Changes to this SRS must be reviewed when:

- A feature is added, removed, or materially changed.
- The technology stack or architecture changes.
- API behavior changes.
- Database structure or relationships change.
- Security or privacy controls change.
- A requirement is found to be infeasible or ambiguous.
- A new release changes the approved scope.

Material changes should include a rationale, affected requirements, implementation impact, testing impact, and approval status.

---

## 14. Open Verification Items

The following items require confirmation from the current implementation and test evidence:

- Exact API endpoints and response schemas.
- Exact database table and column definitions.
- Complete USER and ADMIN permission matrix.
- Actual publication and visibility rules.
- Private PDF storage and retrieval behavior.
- Actual reader settings and their persistence.
- Supported browser and speech capabilities.
- Authentication token or session lifecycle.
- Test coverage and current passing status.
- Deployment, backup, and recovery configuration.

These items must not be treated as verified solely because they appear in this document.

---

## 15. Conclusion

This SRS establishes the intended functional behavior, quality expectations, interfaces, data constraints, security boundaries, and verification approach for the Digital Library project.

It provides a shared reference for implementation and academic evaluation while requiring that actual feature status and compliance be established through source-code inspection and test evidence.
