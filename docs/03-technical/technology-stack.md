# Digital Library — Technology Stack

**Project:** Digital Library  
**Document Version:** 1.0  
**Release Scope:** Version 1 (V1)  
**Status:** Active — Verify Against Implementation  
**Architecture:** Monolithic Web Application

---

## 1. Purpose

This document defines the approved technologies, their responsibilities, integration boundaries, development tools, and technical constraints for the Digital Library project.

The stack is intended to keep the project maintainable and appropriate for a BTech final-year project.

The approved core stack is:

- HTML
- CSS
- Vanilla JavaScript
- Node.js
- Express.js
- MySQL

Actual dependencies, versions, and feature usage must be confirmed against the project's package files, source code, and environment configuration.

---

## 2. Technology Stack Overview

| Layer | Approved technology | Responsibility |
|---|---|---|
| Frontend structure | HTML | Page structure and semantic content |
| Frontend styling | CSS | Layout, themes, and responsive design |
| Frontend behavior | Vanilla JavaScript | UI interactions and API communication |
| Server runtime | Node.js | Execute backend JavaScript |
| Backend framework | Express.js | HTTP routing and middleware |
| Database | MySQL | Relational data persistence |
| API communication | HTTP/HTTPS and JSON | Frontend-backend communication |
| File handling | Existing Node.js file-handling implementation | Supported upload and file operations |
| PDF processing | Existing PDF-processing dependency, where implemented | Processing supported PDF files |
| Version control | Git | Source history and collaboration |
| Code editor | Visual Studio Code | Development and debugging |
| Testing | Existing test tools and manual HTTP testing | Verify functionality and integration |

This table identifies the approved stack and intended responsibilities. It does not confirm that every listed integration is already complete.

---

## 3. Frontend Technologies

### 3.1 HTML

**Purpose:** Define the structure of the web interface.

HTML is used for:

- Page structure.
- Forms.
- Navigation.
- Buttons and controls.
- Book and chapter content.
- Accessible interface elements.

Development requirements:

- Prefer semantic HTML.
- Associate form controls with accessible labels.
- Use appropriate input types.
- Keep document structure clear and maintainable.
- Avoid using HTML structure as a substitute for backend authorization.

### 3.2 CSS

**Purpose:** Style the application and provide responsive layouts.

CSS is used for:

- Page layouts.
- Typography.
- Spacing.
- Colors.
- Reader presentation.
- Dark, light, or other implemented themes.
- Responsive behavior.
- Focus and interaction states.

Development requirements:

- Reuse consistent design patterns.
- Avoid unnecessary duplication.
- Preserve readability across supported viewport sizes.
- Ensure theme changes maintain suitable contrast.
- Keep styling separate from application business logic.

The actual theme and design-system implementation must be confirmed from the frontend code.

### 3.3 Vanilla JavaScript

**Purpose:** Implement frontend behavior without adopting an additional frontend framework for the approved V1 scope.

JavaScript is used for:

- Form handling.
- API requests.
- Response processing.
- Dynamic content rendering.
- Navigation interactions.
- Reader controls.
- Theme settings.
- Loading and error states.
- Browser speech functionality where supported.

Development requirements:

- Use reusable functions and modules where appropriate.
- Handle asynchronous requests and failures.
- Validate input for usability while retaining backend validation.
- Render untrusted content safely.
- Avoid exposing server-side secrets.
- Keep API communication consistent with the documented backend contract.

The approved V1 frontend must remain based on HTML, CSS, and Vanilla JavaScript unless a technology change is formally approved.

---

## 4. Backend Technologies

### 4.1 Node.js

**Purpose:** Run the backend JavaScript application.

Node.js supports:

- Server execution.
- HTTP request processing through Express.js.
- Database connectivity.
- File operations where implemented.
- Integration with the project's npm dependencies.

Development requirements:

- Use a supported Node.js release compatible with the project's dependencies.
- Validate required environment configuration.
- Handle asynchronous failures appropriately.
- Avoid blocking operations that unnecessarily affect other requests.
- Keep secrets out of source code.

The actual Node.js version must be recorded from the development and deployment environments.

### 4.2 Express.js

**Purpose:** Provide backend routing and middleware.

Express.js is responsible for:

- Registering API routes.
- Parsing supported request bodies.
- Applying middleware.
- Connecting requests to controllers.
- Integrating authentication and authorization.
- Handling API errors.
- Returning HTTP responses.

Development requirements:

- Keep route definitions clear.
- Apply authentication to protected endpoints.
- Enforce role and ownership permissions.
- Validate untrusted request data.
- Configure security middleware appropriately.
- Maintain consistent response behavior.

### 4.3 Backend Layering

The intended backend structure is:

Route → Middleware → Controller → Service → Repository → MySQL

Responsibilities:

- **Routes:** Define HTTP endpoints.
- **Middleware:** Handle cross-cutting request concerns.
- **Controllers:** Coordinate request and response behavior.
- **Services:** Implement business rules.
- **Repositories:** Encapsulate database access where used.
- **Utilities and validators:** Provide reusable support functions.

Not every feature must use every layer. The actual repository structure is authoritative.

The project must retain its monolithic architecture and must not introduce microservices without an approved architectural decision.

---

## 5. Database Technology

### 5.1 MySQL

**Purpose:** Store structured application data.

MySQL supports the relational data requirements of the Digital Library application.

Potential data areas include:

- User accounts.
- Book records.
- Authors.
- Categories.
- Chapters.
- Book relationships.
- Publication and visibility state.
- Private PDF metadata.
- Other implemented application records.

The actual tables and columns must match the database schema.

### 5.2 Database Requirements

- Use primary keys for record identification.
- Use foreign keys where appropriate.
- Apply uniqueness constraints where required.
- Validate required fields.
- Use safe parameterized queries.
- Apply transactions to operations requiring atomicity.
- Use appropriate indexes based on query patterns.
- Protect database credentials.
- Document schema changes.

### 5.3 Database Connectivity

The backend must access MySQL through the project's configured database connection mechanism.

The actual database client package, connection pool, and configuration names must be verified from the repository.

The frontend must never connect directly to MySQL.

---

## 6. API Communication

The frontend and backend communicate through HTTP APIs.

JSON is the expected format for ordinary structured requests and responses. File uploads and file-streaming endpoints may use other content types.

### 6.1 API Requirements

- Use documented HTTP methods and routes.
- Validate request data on the backend.
- Return appropriate HTTP status codes.
- Keep response structures consistent.
- Enforce authentication and authorization.
- Handle errors safely.
- Update the API specification when contracts change.

### 6.2 API Versioning

The project documentation uses `/api/v1` as the intended API prefix.

Confirm the actual mounted prefix in the Express application before relying on it.

---

## 7. Authentication and Security Technologies

The application requires secure authentication and authorization.

The existing project documentation describes password hashing, token-based authentication, HttpOnly cookies, rate limiting, and security headers. Their exact implementation and configuration must be confirmed against the current code.

### 7.1 Password Security

Passwords must not be stored in plaintext.

The backend must use the approved password-hashing mechanism and must not return password hashes in normal API responses.

### 7.2 Authentication

Protected endpoints must validate authentication using the implemented mechanism.

The application must handle invalid authentication and logout according to its actual token or session lifecycle.

### 7.3 Authorization

The documented roles are:

- `USER`
- `ADMIN`

The backend must enforce the permissions assigned to each role.

Private resources must also be protected by ownership checks where applicable.

### 7.4 Security Controls

Applicable controls include:

- Input validation.
- Parameterized SQL.
- Authentication middleware.
- Authorization middleware.
- Rate limiting.
- Security headers.
- Restrictive CORS configuration.
- Safe error handling.
- Secure environment configuration.
- File-upload validation.

A listed security technology or control must not be considered verified until it has been inspected and tested.

---

## 8. PDF and File-Handling Technologies

The project includes a private PDF library and PDF-processing functionality in its intended feature scope.

### 8.1 File Handling

The backend is responsible for validating and managing uploaded files where upload functionality is implemented.

Requirements include:

- File-size limits.
- Supported media-type validation.
- Safe filename and path handling.
- Ownership association.
- Protected retrieval.
- Appropriate cleanup on failure.
- Persistent storage where required.

### 8.2 PDF Processing

The project documentation identifies `pdfjs-dist` as a PDF-processing dependency.

The actual package version and usage must be confirmed from `backend/package.json`, the lockfile, and the PDF-processing source files.

Do not assume that all PDF extraction, rendering, or OCR capabilities are available merely because a PDF-related package is installed.

### 8.3 Storage

The actual file-storage strategy must be documented from the implementation.

Uploaded documents must not become public simply because they reside in a filesystem directory.

---

## 9. Reader and Browser Technologies

### 9.1 Browser-Based Reading

The frontend displays supported book and chapter content through the browser.

Reader functionality must follow the implemented content model and API contract.

### 9.2 Speech Synthesis

Where implemented, text-to-speech uses the browser's Speech Synthesis API.

Potential controls include:

- Speech start and stop.
- Speech rate.
- Pitch.
- Voice selection where supported.

Browser capabilities vary. The application must handle unavailable voices and unsupported settings gracefully.

The exact controls and rate limits must be verified against the frontend implementation.

---

## 10. Development Tools

### 10.1 Visual Studio Code

Used for:

- Editing frontend and backend files.
- Navigating the codebase.
- Running terminal commands.
- Debugging.
- Reviewing changes.
- Managing project documentation.

### 10.2 Git

Used for:

- Version control.
- Branch management.
- Tracking changes.
- Collaboration.
- Reviewing implementation history.
- Maintaining project milestones.

Sensitive credentials, local environment files, and private uploaded documents must not be committed accidentally.

### 10.3 npm

Used to manage Node.js dependencies and execute configured project scripts.

Before adding a dependency:

1. Confirm that it is necessary.
2. Review compatibility with the existing Node.js version.
3. Check security and maintenance considerations.
4. Update the package manifest and lockfile appropriately.
5. Run relevant tests.
6. Document significant dependency changes.

### 10.4 PowerShell

PowerShell may be used for:

- Starting the backend.
- Setting development environment values.
- Running Git commands.
- Sending manual API requests.
- Running tests.
- Managing local development tasks.

Commands must be executed from the correct project directory.

---

## 11. Testing Technologies and Methods

The project may use automated tests, manual API testing, and browser-based verification.

The actual test framework and installed testing dependencies must be confirmed from the repository.

Testing should cover:

- Authentication.
- Role-based authorization.
- Book and chapter operations.
- Author and category relationships.
- Private PDF access.
- Input validation.
- Database integration.
- Error handling.
- Reader behavior.
- Responsive layouts.
- Browser speech support where implemented.

PowerShell `Invoke-RestMethod` can be used for manual API testing when appropriate.

Test status must reflect actual execution evidence. Planned tests must not be reported as passing.

---

## 12. Environment Configuration

The application may require environment values for:

- Server port.
- Runtime environment.
- MySQL connection settings.
- Authentication secrets or keys.
- Frontend origin.
- CORS settings.
- File-upload limits.
- File-storage paths.

The exact names must match the current configuration code.

Requirements:

- Validate required environment variables.
- Keep real credentials out of source control.
- Use separate configuration for development and production.
- Avoid exposing configuration secrets through APIs.
- Use appropriate production cookie and HTTPS settings.
- Document required configuration without including real secret values.

---

## 13. Deployment Technology Considerations

The application requires a deployment environment compatible with Node.js and MySQL.

The actual hosting provider and deployment strategy must be selected and documented separately.

Deployment requirements include:

- Compatible Node.js runtime.
- Accessible MySQL database.
- Correct environment configuration.
- HTTPS for public production access.
- Persistent storage for required uploaded files.
- Appropriate CORS configuration.
- Protected database access.
- Backup and recovery procedures.
- Post-deployment verification.

Do not assume that local filesystem storage persists across hosting redeployments unless the chosen environment guarantees it.

---

## 14. Technology Selection Rationale

### HTML, CSS, and Vanilla JavaScript

These technologies provide a straightforward frontend stack without requiring an additional frontend framework for V1.

### Node.js

Node.js allows the backend to use JavaScript and integrates with the project's npm-based dependency ecosystem.

### Express.js

Express.js provides routing and middleware suitable for a structured monolithic API.

### MySQL

MySQL supports relational data, foreign keys, constraints, and structured queries required by the library catalogue.

### Git and Visual Studio Code

Git supports controlled source changes, while Visual Studio Code provides a practical development environment.

These choices align with the approved project constraints. Any material replacement requires an explicit review of its implementation, compatibility, and academic-project impact.

---

## 15. Prohibited or Unapproved Architectural Changes

Unless formally approved, the project must not:

- Replace the approved core stack with an unrelated framework.
- Introduce microservices.
- Move database access into the frontend.
- Expose database credentials to browsers.
- Introduce unnecessary infrastructure.
- Add major dependencies without a clear requirement.
- Treat future AI features as existing V1 functionality.
- Replace working modules without checking their dependencies and tests.

Local development tools may be used where appropriate, but they must not change the approved application architecture without review.

---

## 16. Dependency and Version Management

Maintain a record of important dependencies and runtime versions.

For each relevant technology, record:

- Name.
- Installed version.
- Purpose.
- Direct or transitive dependency status.
- Compatibility requirements.
- Known security considerations.
- Upgrade or maintenance notes.

Use the actual package manifest and lockfile to determine installed versions.

Do not invent version numbers or assume that a globally installed package is part of the project's application dependencies.

---

## 17. Technology Verification Checklist

- [ ] Confirm the Node.js version.
- [ ] Confirm the Express.js version.
- [ ] Confirm the MySQL version.
- [ ] Confirm the database client package.
- [ ] Confirm the actual frontend structure.
- [ ] Confirm installed backend dependencies.
- [ ] Confirm PDF-processing dependencies and usage.
- [ ] Confirm authentication and password-hashing implementation.
- [ ] Confirm security middleware.
- [ ] Confirm file-storage strategy.
- [ ] Confirm browser speech functionality.
- [ ] Confirm test framework and scripts.
- [ ] Confirm environment-variable names.
- [ ] Confirm deployment requirements.
- [ ] Update this document using actual project evidence.

---

## 18. Related Documents

- `docs/01-product/PRD.md`
- `docs/01-product/feature-list.md`
- `docs/02-requirements/SRS.md`
- `docs/02-requirements/functional-requirements.md`
- `docs/02-requirements/non-functional-requirements.md`
- `docs/02-requirements/acceptance-criteria.md`
- `docs/03-technical/api-specification.md`
- `docs/03-technical/architecture.md`
- `docs/03-technical/database-design.md`
- `docs/03-technical/integration-design.md`
- `docs/03-technical/TRD.md`
- `docs/05-security/`
- `docs/07-testing/`
- `docs/08-deployment/`

---

## 19. Document Maintenance

Review this document whenever:

- The approved technology stack changes.
- Dependencies are added, removed, or upgraded.
- Authentication or security implementation changes.
- Database connectivity changes.
- File-processing technology changes.
- Browser capabilities become part of a new feature.
- Testing tools change.
- Deployment requirements change.

Keep this document aligned with package manifests, lockfiles, environment configuration, source code, and approved architecture decisions.

---

## 20. Conclusion

Digital Library uses HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL within a monolithic architecture.

The selected technologies provide the foundation for the user interface, API, data persistence, and supported document-reading workflows.

Actual package versions, dependency usage, configuration, and feature availability must be confirmed from the repository and runtime environment before being considered verified.
