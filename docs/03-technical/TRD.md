# Digital Library — Technical Requirements Document (TRD)

**Project:** Digital Library  
**Document Version:** 1.0  
**Release Scope:** Version 1 (V1)  
**Status:** Active — Verify Against Implementation  
**Architecture:** Monolithic Web Application  
**Frontend:** HTML, CSS, Vanilla JavaScript  
**Backend:** Node.js, Express.js  
**Database:** MySQL

---

## 1. Purpose

This Technical Requirements Document defines the technical constraints, implementation requirements, component responsibilities, runtime configuration, database integration, security controls, testing expectations, and deployment requirements for the Digital Library project.

It complements the Software Requirements Specification, architecture document, database design, API specification, and security documentation.

The document describes the intended technical design. Actual package versions, configurations, routes, schema definitions, and implementation status must be confirmed against the current repository.

---

## 2. Technical Objectives

The system must:

1. Use the approved technology stack.
2. Retain a monolithic application architecture.
3. Separate frontend responsibilities from backend business logic.
4. Use MySQL for structured persistent data.
5. Enforce server-side authentication and authorization.
6. Protect private user documents.
7. Validate untrusted input.
8. Maintain database integrity.
9. Handle application errors safely.
10. Support repeatable development and testing.
11. Keep environment-specific configuration outside application source where appropriate.
12. Maintain documentation that reflects the actual implementation.

---

## 3. Mandatory Technology Constraints

The approved V1 stack is:

| Component | Technology | Requirement |
|---|---|---|
| Frontend structure | HTML | MUST |
| Frontend styling | CSS | MUST |
| Frontend behavior | Vanilla JavaScript | MUST |
| Runtime | Node.js | MUST |
| Backend framework | Express.js | MUST |
| Database | MySQL | MUST |
| Source control | Git | Project workflow requirement |
| Development editor | Visual Studio Code | Recommended project tool |

Additional frameworks, infrastructure, and dependencies must not be introduced without a clear requirement and appropriate project approval.

The application must not be converted to microservices as part of routine development.

---

## 4. System Architecture Requirements

### 4.1 Architectural Style

The system must use a monolithic architecture.

The frontend, backend, and database form one coordinated application, even if the components run in separate processes or services during deployment.

### 4.2 Backend Layering

The intended logical request flow is:

Route → Middleware → Controller → Service → Repository → MySQL

Responsibilities:

- **Route:** Maps HTTP requests to handlers.
- **Middleware:** Applies authentication, authorization, validation, and other shared request behavior.
- **Controller:** Coordinates HTTP request and response processing.
- **Service:** Applies business rules.
- **Repository:** Encapsulates database access where used.
- **MySQL:** Stores structured persistent records.

Not every existing feature must use every layer. The actual repository structure is authoritative.

### 4.3 Separation of Responsibilities

The frontend must not:

- Connect directly to MySQL.
- Contain database credentials.
- Contain server-side authentication secrets.
- Act as the only enforcement point for protected operations.

The backend must enforce permissions and validate all untrusted requests.

---

## 5. Runtime and Environment Requirements

### 5.1 Node.js Runtime

The backend must run on a Node.js version compatible with the installed dependencies.

The exact supported version must be recorded from the project environment.

### 5.2 npm

npm is used to manage project dependencies and execute the scripts defined in the package manifest.

Dependencies must be installed from the project's manifest and lockfile using the appropriate workflow.

### 5.3 Environment Configuration

The application may require configuration values for:

- Server port.
- Runtime environment.
- MySQL host.
- MySQL port.
- Database name.
- Database username.
- Database password.
- Authentication secret or key.
- Frontend origin.
- CORS configuration.
- File-upload limits.
- File-storage location.

These are illustrative configuration categories. Actual variable names must match the existing code.

### 5.4 Configuration Validation

The backend should validate required configuration at startup.

Missing required settings must produce an appropriate startup failure rather than allowing the application to operate with invalid credentials or unsafe defaults.

### 5.5 Secret Protection

Real credentials and authentication secrets must not be committed to source control.

Example environment files must use placeholders rather than real secrets.

---

## 6. Frontend Technical Requirements

### 6.1 Structure

The frontend must use HTML, CSS, and Vanilla JavaScript for the approved V1 scope.

The actual folder organization should be maintained consistently with the existing repository.

### 6.2 API Communication

The frontend must communicate with the backend through the documented HTTP API.

The implementation must:

- Use the correct HTTP methods and routes.
- Send requests in the expected format.
- Handle success and error responses.
- Display meaningful feedback.
- Handle loading and empty states where appropriate.
- Avoid assuming undocumented response fields.

### 6.3 Rendering Safety

Untrusted content must be rendered safely.

Book metadata, chapter content, and user-controlled values must not be interpreted as unintended executable script.

### 6.4 Responsive Design

The frontend must remain usable at the viewport sizes supported by the project.

Important controls must remain accessible, and theme changes must preserve readability.

### 6.5 Reader Functionality

The reader must support the features actually implemented and included in the approved V1 scope.

Potential functionality includes:

- Displaying supported book content.
- Navigating between chapters.
- Applying available reader preferences.
- Using browser speech synthesis where supported.

The exact feature set must be confirmed against the current frontend code.

---

## 7. Backend Technical Requirements

### 7.1 Express Application

The backend must use Express.js for HTTP routing and middleware.

It must provide appropriate handling for:

- API route registration.
- Request parsing.
- Authentication.
- Authorization.
- Validation.
- Error handling.
- Database access.
- Supported file operations.

### 7.2 Controllers

Controllers should coordinate request processing and response generation.

They should avoid duplicating substantial business logic or directly exposing unnecessary database implementation details.

### 7.3 Services

Services should implement business rules and coordinate relevant operations.

Potential responsibilities include:

- Book management.
- Chapter management.
- Author and category operations.
- Book relationships.
- Publication and visibility rules.
- Private-document workflows.

Only responsibilities confirmed by the actual implementation should be recorded as implemented.

### 7.4 Repositories

Repositories should encapsulate database operations where this layer exists.

They must use safe query handling and preserve the intended database integrity rules.

### 7.5 Middleware

Middleware should enforce cross-cutting requirements consistently.

Examples include:

- Authentication middleware.
- Role-based authorization.
- Request validation.
- Rate limiting.
- Security headers.
- CORS.
- Error handling.

Actual middleware names and behavior must match the source code.

---

## 8. API Requirements

### 8.1 API Convention

The project documentation uses `/api/v1` as the intended versioned API prefix.

The actual prefix must be confirmed from the Express application configuration.

### 8.2 Request Handling

The backend must:

- Validate required fields.
- Reject invalid identifiers and values.
- Apply authentication to protected routes.
- Enforce authorization for sensitive operations.
- Handle unsupported request formats appropriately.
- Return responses consistent with the API contract.

### 8.3 Response Handling

Responses must use the status codes and structures established by the actual API contract.

Illustrative examples in documentation must not override the existing implementation without an approved API change.

### 8.4 Error Handling

Errors must be handled consistently.

Production responses must not disclose passwords, credentials, tokens, SQL connection strings, or internal stack traces.

---

## 9. Database Technical Requirements

### 9.1 Database Technology

MySQL is the approved relational database.

### 9.2 Connection Management

The backend must use the configured database access mechanism and handle connectivity failures appropriately.

The exact database client and connection-pool configuration must be confirmed from the repository.

### 9.3 Query Safety

User-controlled values must be passed through parameterized SQL operations or equivalent safe database APIs.

Unsafe SQL string concatenation must not be used for untrusted input.

### 9.4 Data Integrity

The schema must use appropriate:

- Primary keys.
- Foreign keys.
- Unique constraints.
- Required-field constraints.
- Referential actions.
- Indexes.

The exact schema must be documented from the actual SQL files or database.

### 9.5 Transactions

Operations that require all-or-nothing database changes must use suitable transaction handling.

The application must correctly handle rollback and report failed operations accurately.

### 9.6 Database Migrations

Schema changes must be controlled, repeatable, and documented.

Migration scripts or other approved schema-update procedures must be used consistently with the project's existing workflow.

---

## 10. Authentication and Authorization Requirements

### 10.1 Authentication

The backend must authenticate protected requests using the implemented mechanism.

The exact token, cookie, or session design must be verified against the current authentication code.

### 10.2 Password Security

Passwords must never be stored in plaintext.

The backend must use the approved password-hashing mechanism.

### 10.3 Roles

The documented roles are:

- `USER`
- `ADMIN`

The backend must enforce the permission associated with each protected operation.

### 10.4 Ownership

Private documents and other user-owned resources must be protected by ownership checks or explicitly granted permissions.

### 10.5 Logout

Logout behavior must follow the implemented authentication lifecycle.

If token revocation uses in-memory state, the behavior across process restarts must remain documented and tested.

---

## 11. Security Requirements

The backend must apply security controls appropriate to the application and deployment environment.

These include:

- Input validation.
- Safe database queries.
- Authentication.
- Role-based authorization.
- Resource-ownership checks.
- Password hashing.
- Rate limiting where configured.
- Security headers.
- Restrictive CORS configuration.
- Safe error responses.
- Secret management.
- Safe file handling.

Each control must be verified through source inspection, configuration review, and testing.

---

## 12. File Upload and PDF Requirements

### 12.1 Upload Validation

Where file uploads are implemented, the backend must validate:

- File presence.
- Supported media type.
- Configured file-size limit.
- Relevant metadata.
- User permissions.

### 12.2 Filename and Path Safety

Filenames and storage paths must be handled safely.

User-controlled path values must not be allowed to access arbitrary filesystem locations.

### 12.3 Private Document Access

Private PDFs must not be accessible solely because a requester knows their identifier or storage path.

The backend must verify ownership or explicitly granted access.

### 12.4 PDF Processing

The project documentation identifies `pdfjs-dist` as a PDF-processing dependency.

The actual package version, processing steps, and supported formats must be confirmed against the current dependency files and source code.

### 12.5 Storage Failure Handling

The system must handle storage and database failures without falsely reporting successful upload or deletion.

If file storage and database changes occur separately, the implementation must define appropriate cleanup or recovery behavior.

---

## 13. Performance Requirements

The application should use resources efficiently while preserving correct behavior.

Requirements include:

- Appropriate database queries.
- Suitable indexes.
- Pagination for large collections where needed.
- Validation and limits for uploads.
- Efficient frontend rendering.
- Avoidance of unnecessary repeated database queries.
- Appropriate handling of long content.

Numerical performance thresholds must be explicitly approved and measured before being treated as release guarantees.

---

## 14. Reliability Requirements

The system must:

- Handle expected errors consistently.
- Avoid reporting failed operations as successful.
- Preserve database integrity.
- Handle database connection failures.
- Keep required persistent data outside volatile process memory.
- Support controlled startup and shutdown.
- Provide appropriate diagnostic information.

The actual recovery behavior must be confirmed through testing.

---

## 15. Logging and Monitoring Requirements

The application should provide useful diagnostic information for:

- Startup and shutdown.
- Unexpected API failures.
- Database connectivity failures.
- File-processing failures.
- Relevant operational errors.

Logs must not expose:

- Plaintext passwords.
- Authentication secrets.
- Full sensitive tokens.
- Database credentials.
- Unnecessary private document contents.

The actual logging library, format, and retention policy must be documented from the implementation.

---

## 16. Testing Requirements

Testing must cover the major application boundaries.

### 16.1 Unit Tests

Test isolated business rules, validators, and utilities where unit tests are available.

### 16.2 API Tests

Test route behavior, validation, response structures, authentication, authorization, and error handling.

### 16.3 Database Integration Tests

Test database connectivity, CRUD operations, relationships, constraints, and transaction behavior where applicable.

### 16.4 Security Tests

Test invalid authentication, unauthorized roles, cross-user private-resource access, unsafe input, and file-upload restrictions.

### 16.5 Frontend Tests

Test navigation, forms, API integration, reader functionality, error states, and responsive layouts.

### 16.6 Manual Testing

PowerShell `Invoke-RestMethod` may be used for manual API tests when appropriate.

### 16.7 Test Reporting

Test status must reflect actual execution evidence.

Each test should record the expected result, actual result, status, and relevant evidence.

---

## 17. Deployment Requirements

The deployment environment must support the approved application stack.

Requirements include:

- Compatible Node.js runtime.
- Accessible MySQL database.
- Correct environment configuration.
- HTTPS for public production access.
- Appropriate cookie and CORS settings.
- Persistent storage for required uploaded files.
- Protected database access.
- Backup and recovery procedures.
- Post-deployment verification.

The actual hosting provider, reverse proxy, and storage architecture must be documented after they are selected.

---

## 18. Development Workflow Requirements

The project should follow a controlled development process.

1. Review the relevant requirements and existing implementation.
2. Identify affected files and dependencies.
3. Implement the smallest suitable change.
4. Preserve existing working functionality.
5. Run relevant tests.
6. Review database and security impacts.
7. Update related documentation.
8. Inspect the final changes.
9. Commit changes using the project's Git workflow.
10. Record unresolved issues honestly.

AI-assisted coding tools may help with implementation, but generated changes must be reviewed and tested before being treated as correct.

---

## 19. Dependency Management

All project dependencies must be managed through the existing package manifests and lockfiles.

Before adding or upgrading a dependency:

- Identify the requirement it addresses.
- Check compatibility with the current Node.js version.
- Review security and maintenance considerations.
- Confirm whether the dependency is already available.
- Update the manifest and lockfile appropriately.
- Run relevant tests.
- Document significant changes.

Do not invent installed package versions or treat globally installed utilities as application dependencies.

---

## 20. Technical Constraints

The following constraints apply unless formally changed:

1. Use HTML, CSS, and Vanilla JavaScript for the approved frontend.
2. Use Node.js and Express.js for the backend.
3. Use MySQL for relational data persistence.
4. Retain the monolithic architecture.
5. Do not introduce microservices without approval.
6. Enforce authorization on the backend.
7. Protect private documents.
8. Keep secrets out of frontend code and source control.
9. Preserve working features unless an approved requirement changes them.
10. Keep technical documentation consistent with actual implementation.

---

## 21. Technical Verification Checklist

- [ ] Confirm runtime and dependency versions.
- [ ] Confirm backend startup configuration.
- [ ] Confirm route and middleware registration.
- [ ] Confirm authentication and authorization.
- [ ] Confirm database connectivity and query safety.
- [ ] Confirm schema constraints and relationships.
- [ ] Confirm upload validation and private-file access.
- [ ] Confirm environment-variable requirements.
- [ ] Confirm security headers, CORS, and rate limiting.
- [ ] Confirm error-handling behavior.
- [ ] Confirm test commands and test results.
- [ ] Confirm deployment and persistent-storage requirements.
- [ ] Review dependency changes.
- [ ] Update the technical documentation from actual evidence.

---

## 22. Related Documents

- `docs/02-requirements/SRS.md`
- `docs/02-requirements/functional-requirements.md`
- `docs/02-requirements/non-functional-requirements.md`
- `docs/02-requirements/acceptance-criteria.md`
- `docs/03-technical/api-specification.md`
- `docs/03-technical/architecture.md`
- `docs/03-technical/database-design.md`
- `docs/03-technical/integration-design.md`
- `docs/03-technical/technology-stack.md`
- `docs/05-security/`
- `docs/06-development/`
- `docs/07-testing/`
- `docs/08-deployment/`

---

## 23. Document Maintenance

Review this document whenever:

- The approved technology stack changes.
- A significant dependency is added or removed.
- Database structure changes.
- Authentication or security behavior changes.
- File-processing behavior changes.
- Deployment architecture changes.
- New performance or reliability requirements are approved.
- Testing or development workflows change.

Document significant decisions and maintain consistency across the SRS, architecture, API specification, database design, and security documentation.

---

## 24. Conclusion

This TRD defines the technical constraints and implementation expectations for Digital Library.

The application must retain its approved monolithic stack while maintaining secure API boundaries, safe database access, protected private resources, reliable error handling, and repeatable testing.

Actual source code, configuration, schema, and executed test evidence remain authoritative for confirming compliance with these technical requirements.
