# Digital Library — Security Design

**Document Version:** 1.0  
**Project:** Digital Library  
**Release Scope:** V1 and subsequent approved versions  
**Backend:** Node.js, Express.js  
**Database:** MySQL  
**Frontend:** HTML, CSS, Vanilla JavaScript  
**Architecture:** Monolithic Web Application  
**Status:** Security Design Specification — Verify Against Implementation

---

## 1. Purpose

This document defines the security architecture and design principles for Digital Library.

It describes how the application should protect user accounts, API endpoints, database operations, book content, private documents, configuration secrets, and application errors.

The design follows a defense-in-depth approach: multiple security controls should work together so that failure of one control does not automatically expose the entire application.

This document specifies intended security behavior. The actual controls, configuration, and test results must be verified against the current repository.

---

## 2. Security Objectives

The application must aim to provide:

1. **Confidentiality:** Prevent unauthorized disclosure of private information.
2. **Integrity:** Prevent unauthorized modification or deletion of data.
3. **Availability:** Reduce disruption caused by failures and abusive requests.
4. **Authentication:** Verify the identity of authenticated users.
5. **Authorization:** Enforce permissions for every protected operation.
6. **Accountability:** Provide appropriate diagnostic records without logging secrets.
7. **Data protection:** Protect credentials, private documents, and sensitive configuration.
8. **Maintainability:** Keep security controls understandable and testable.

---

## 3. Security Principles

### 3.1 Defense in Depth

Use multiple complementary controls, including validation, authentication, authorization, safe database access, security headers, and controlled error handling.

### 3.2 Least Privilege

Grant users, application processes, and database accounts only the permissions required for their responsibilities.

### 3.3 Secure by Default

Protected resources must remain inaccessible until the required permission has been established.

### 3.4 Fail Securely

When authentication, authorization, or required security checks fail, the application must not grant access as a fallback.

### 3.5 Validate at Trust Boundaries

All externally supplied values must be treated as untrusted, including values received from authenticated users.

### 3.6 Minimize Sensitive Data

Collect, store, return, and log only the information required for the application's purpose.

### 3.7 Verify Rather Than Assume

A security design is not evidence that a control has been implemented or tested.

---

## 4. System Trust Boundaries

The principal trust boundaries are:

1. Browser to backend API.
2. Backend to MySQL.
3. Backend to filesystem or document storage.
4. User-supplied content to application rendering.
5. Development environment to production environment.
6. Public or guest access to authenticated access.
7. Ordinary user permissions to administrative permissions.

Every boundary must have appropriate validation and access controls.

---

## 5. Security Architecture

The intended security flow is:

```text
Browser / API Client
        |
        v
HTTPS in Production
        |
        v
Express Request Handling
        |
        v
Input Validation and Request Limits
        |
        v
Authentication
        |
        v
Role and Resource Authorization
        |
        v
Controller and Service Business Rules
        |
        v
Safe Repository / Database Operations
        |
        v
MySQL or Authorized File Storage
```

This diagram represents a logical design. The actual middleware and execution order must be verified from the application source.

Not every request requires authentication. Public endpoints must still apply suitable validation and abuse-prevention controls.

---

## 6. Authentication Design

### 6.1 Identity Verification

Protected operations must establish the user's identity using the implemented authentication mechanism.

The backend must not trust an identity supplied only through a request body or client-controlled role field.

### 6.2 Password Storage

Passwords must never be stored in plaintext.

The backend must use the configured password-hashing mechanism and must not return password hashes to clients.

The exact hashing algorithm and parameters must be confirmed from the current implementation.

### 6.3 Authentication Lifecycle

The implementation must define:

- Credential submission.
- Successful authentication.
- Authentication failure.
- Credential expiration.
- Logout.
- Revocation, where supported.
- Behavior after server restart where relevant.

The project must document its actual token, cookie, or session mechanism.

### 6.4 Authentication Errors

Authentication failures must return safe messages and must not disclose secrets, stack traces, or unnecessary internal account details.

---

## 7. Authorization Design

### 7.1 Roles

The documented roles are:

- `USER`
- `ADMIN`

Role names and permission assignments must match the current application.

### 7.2 Role-Based Access Control

Administrative operations must require the appropriate server-verified role.

The frontend may hide controls that are unavailable to a user, but the backend must enforce the actual permission.

### 7.3 Resource-Level Access Control

Authorization must consider the requested resource when ownership or visibility matters.

A valid login does not grant access to every record or file.

### 7.4 Ownership Enforcement

For private documents and other user-owned resources, the backend must verify ownership or an explicitly granted permission before reading, updating, or deleting the resource.

### 7.5 Content Visibility

Book and chapter access must follow the implemented publication and visibility rules.

Restricted content must not become public merely because a requester knows its identifier.

### 7.6 Administrative Boundaries

Administrative privileges must be limited to explicitly approved administrative operations.

An administrator must not automatically receive access to private user documents unless the approved product policy grants that access.

---

## 8. Input Validation Design

All externally supplied values must be validated at the backend trust boundary.

Validation should cover:

- Required fields.
- String lengths.
- Identifier formats.
- Numeric ranges.
- Allowed status values.
- Request structure.
- File metadata.
- Supported content types.
- Relevant cross-field relationships.

Validation rules must be consistent with the API contract and data model.

Client-side validation may improve usability but must not replace server-side validation.

Unexpected input must be rejected or handled according to a documented policy.

---

## 9. Database Security Design

### 9.1 Safe Queries

Database operations must use parameterized SQL queries or equivalent safe database APIs.

Untrusted input must not be concatenated into executable SQL.

### 9.2 Database Credentials

Database credentials must be stored outside committed application source.

Production credentials must not be exposed in frontend code, logs, public API responses, or repository history.

### 9.3 Least Privilege

The application database account should have only the permissions needed for normal operation.

Administrative database access should be separated from routine application access where practical.

### 9.4 Data Integrity

Use appropriate database constraints and relationships to protect data consistency.

Multi-step operations that require atomicity must use suitable transaction handling.

### 9.5 Database Errors

Clients must not receive raw SQL statements, credentials, or internal connection details when database operations fail.

---

## 10. File and PDF Security Design

This section applies where file-upload and private-document features are implemented.

### 10.1 Upload Validation

The backend must enforce:

- Allowed file types.
- Maximum file size.
- Required file presence.
- Safe metadata handling.
- User authorization.
- Appropriate processing limits.

A file extension or client-supplied MIME type alone is not sufficient to establish file safety.

### 10.2 Safe Storage

The application must generate or safely normalize stored filenames and prevent path traversal.

Uploads must not overwrite arbitrary files or write outside the intended storage location.

### 10.3 Private File Access

Private files must be delivered through an access-controlled mechanism.

A public filesystem path or unprotected static route must not expose private documents.

### 10.4 File Processing

PDF processing must handle malformed or unsupported files safely.

The project should use maintained, compatible dependencies and apply appropriate resource limits.

The exact PDF-processing implementation must be confirmed from the repository.

### 10.5 Storage Consistency

If a database record and a file are created or deleted through separate operations, the implementation must handle partial failures and cleanup.

---

## 11. Cross-Site Scripting Protection

User-controlled content must be rendered safely.

The frontend should prefer text-oriented DOM APIs for ordinary text.

If HTML content must be supported, use an appropriate sanitization policy before rendering it.

Review content originating from:

- Book titles.
- Book descriptions.
- Author names.
- Category names.
- Chapter content.
- Uploaded-file metadata.
- API error responses.

A Content Security Policy may provide additional protection but does not replace safe rendering.

---

## 12. SQL Injection Protection

The application must:

1. Use parameterized database operations.
2. Validate user-controlled values.
3. Restrict dynamic table names, column names, and sort directions to approved options.
4. Avoid unsafe query concatenation.
5. Avoid exposing database error details to clients.
6. Test relevant endpoints with controlled SQL-injection test cases.

Security testing must be performed only in environments the team is authorized to test.

---

## 13. CORS and CSRF Design

### 13.1 CORS

Configure allowed origins according to the actual frontend and backend deployment.

Do not allow arbitrary origins for credentialed requests in production.

CORS is a browser access-control mechanism and is not a substitute for authentication.

### 13.2 CSRF

If browser cookies authenticate state-changing requests, assess cross-site request forgery risks and implement suitable protections.

The required controls depend on cookie configuration, request design, and deployment origins.

### 13.3 Cookie Security

If cookies are used for authentication, review:

- `HttpOnly`.
- `Secure` in production.
- `SameSite`.
- Expiration.
- Path and domain scope.
- CSRF protection.

The actual settings must be confirmed from the source code.

---

## 14. Security Headers

The application should configure appropriate HTTP security headers through Helmet or the existing equivalent.

Review:

- Content Security Policy.
- MIME-sniffing protection.
- Framing restrictions.
- HTTPS-related headers.
- Referrer policy.
- Permissions policy where applicable.

Header settings must be compatible with the actual application.

Production behavior must be tested rather than inferred from development configuration.

---

## 15. Rate Limiting and Abuse Prevention

Apply suitable rate limits to authentication endpoints and other operations vulnerable to abuse.

Additional controls may include:

- Request-size limits.
- Upload-size limits.
- Search-query limits.
- Pagination limits.
- Processing-time constraints.
- Controlled handling of repeated failed requests.

Actual thresholds must be selected according to expected usage and deployment requirements.

If rate-limit state is stored only in process memory, document the behavior across server restarts and multiple application instances.

---

## 16. Error Handling and Logging

### 16.1 Public Errors

Public error responses must not disclose:

- Stack traces.
- Passwords or hashes.
- Authentication secrets.
- Database credentials.
- Internal filesystem paths.
- Sensitive SQL details.
- Unnecessary private data.

### 16.2 Diagnostic Logging

Logs should help maintainers diagnose operational failures.

Avoid logging complete passwords, secret keys, authentication cookies, or full sensitive tokens.

### 16.3 Failure Behavior

The application must not report an operation as successful when the underlying operation failed.

Authorization and validation failures must not fall back to unrestricted behavior.

---

## 17. Environment and Secret Management

### 17.1 Environment Variables

Use environment configuration for deployment-specific values and secrets where appropriate.

The exact variable names must match the current implementation.

### 17.2 Git Protection

Files containing real secrets must be excluded from source control.

Example configuration files must contain placeholders only.

### 17.3 Startup Validation

Required environment variables should be validated during startup.

Missing required configuration should produce a clear startup failure without printing secret values.

### 17.4 Secret Rotation

Document how exposed credentials and authentication secrets can be revoked and replaced.

Removing a secret from the current file does not guarantee removal from Git history or other copies.

---

## 18. Security Dependencies

Dependency management should include:

- Maintaining package manifests and lockfiles.
- Reviewing security advisories.
- Evaluating dependency updates.
- Removing unused packages when safe.
- Confirming compatibility with the supported runtime.
- Reviewing dependencies involved in authentication, uploads, parsing, and database access.

A successful dependency audit does not establish that the complete application is secure.

---

## 19. Security Testing Strategy

Security testing should cover:

### Authentication
- Missing credentials.
- Invalid credentials.
- Expired credentials.
- Logout and revocation behavior.

### Authorization
- User access to admin-only routes.
- Access to another user's private resources.
- Unauthorized updates and deletions.
- Direct API access that bypasses frontend navigation.

### Input Handling
- Malformed identifiers.
- Unexpected fields.
- Invalid types and values.
- SQL-injection payloads.
- XSS payloads.

### File Handling
- Unsupported file types.
- Oversized files.
- Malformed PDFs.
- Path traversal attempts.
- Unauthorized document access.

### Configuration
- Missing environment variables.
- Production error behavior.
- CORS and cookie settings.
- Security headers.
- Rate-limit behavior.

Each result must be recorded with its test procedure, actual outcome, and supporting evidence.

---

## 20. Incident Response Considerations

If a security issue is identified:

1. Record the issue and its potential impact.
2. Determine the affected component and data.
3. Restrict exposure where necessary.
4. Revoke or rotate compromised secrets where applicable.
5. Implement and review the correction.
6. Test the affected behavior.
7. Document remaining risks.
8. Review whether similar weaknesses exist elsewhere.

Incident response actions must be proportionate to the issue and coordinated with the project owner.

---

## 21. Security Verification Checklist

- [ ] Authentication mechanism is documented and verified.
- [ ] Password storage and verification are reviewed.
- [ ] Protected routes enforce authentication.
- [ ] Role permissions are enforced server-side.
- [ ] Private resources enforce ownership checks.
- [ ] SQL operations use safe query handling.
- [ ] Input validation is applied consistently.
- [ ] User-controlled content is rendered safely.
- [ ] Upload restrictions are enforced where applicable.
- [ ] CORS and CSRF risks are reviewed.
- [ ] Security headers are configured appropriately.
- [ ] Rate limiting is reviewed.
- [ ] Environment secrets are protected.
- [ ] Error responses do not expose sensitive information.
- [ ] Dependency risks are reviewed.
- [ ] Relevant security tests are executed.
- [ ] Deployment and recovery procedures are documented.

Only mark items as verified when supporting evidence is available.

---

## 22. Known Implementation Questions

Confirm the following against the current repository:

- Which authentication mechanism is active?
- How are credentials stored and transmitted?
- How are expired and revoked credentials handled?
- Which routes require administrator permissions?
- How are private-resource ownership checks performed?
- How are book and chapter visibility rules enforced?
- Which upload types and size limits are configured?
- How are files stored and served?
- Which security headers are enabled?
- Which rate limits are active?
- How are secrets validated at startup?
- Which security tests have actually passed?

Do not treat unanswered questions as proof of a security failure or proof of compliance.

---

## 23. Related Documents

- `docs/02-requirements/non-functional-requirements.md`
- `docs/03-technical/architecture.md`
- `docs/03-technical/TRD.md`
- `docs/03-technical/api-specification.md`
- `docs/03-technical/database-design.md`
- `docs/05-security/authentication-authorization.md`
- `docs/05-security/security-checklist.md`
- `docs/05-security/threat-model.md`
- `docs/security/README.md`
- `docs/security/authentication.md`
- `docs/security/authorization.md`
- `docs/security/sql-injection.md`
- `docs/security/xss.md`
- `docs/07-testing/security-testing.md`
- `docs/08-deployment/production-checklist.md`

---

## 24. Maintenance

Review this document whenever:

- Authentication or authorization changes.
- A new API endpoint is introduced.
- Database access patterns change.
- File-upload or private-document behavior changes.
- Security dependencies change.
- Deployment configuration changes.
- A vulnerability is discovered.
- Security testing identifies a new risk.

The security design must remain consistent with the approved requirements and actual implementation.
