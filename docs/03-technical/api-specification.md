# Digital Library — API Specification

**Project:** Digital Library  
**Document Version:** 1.0  
**Release Scope:** Version 1 (V1)  
**Status:** Active — Verify Against Implementation  
**Backend:** Node.js and Express.js  
**Database:** MySQL  
**API Style:** REST-oriented HTTP API

---

## 1. Purpose

This document defines the API conventions, security expectations, request and response behavior, and endpoint groups for the Digital Library application.

It is intended to guide frontend integration, backend development, manual testing, and future maintenance.

**Important:** The endpoint groups and examples in this document are a specification reference, not proof that every listed route exists. The actual Express route files, controllers, validators, and services are authoritative for implemented behavior. Confirm exact HTTP methods, paths, request fields, and response structures against the code before using this document as an executable API contract.

---

## 2. API Design Principles

The API should follow these principles:

1. Use HTTP methods consistently with the operation being performed.
2. Use JSON for ordinary request and response bodies unless an endpoint requires multipart data or file streaming.
3. Validate all untrusted input on the backend.
4. Enforce authentication and authorization on protected endpoints.
5. Enforce ownership checks for private user resources.
6. Use parameterized SQL operations or equivalent safe database access.
7. Return consistent status codes and error structures.
8. Avoid exposing passwords, tokens, secrets, or internal stack traces.
9. Apply pagination to collection endpoints where appropriate.
10. Keep API behavior consistent with the approved monolithic architecture.
11. Do not introduce microservices as part of routine API implementation.
12. Update this specification when actual routes or response contracts change.

---

## 3. Base URL and Versioning

The API base URL depends on the environment.

Development example:

`http://localhost:<PORT>/api/v1`

Production example:

`https://<YOUR-DOMAIN>/api/v1`

Replace the placeholders with the actual configured port and deployment domain.

The `/api/v1` prefix is the intended versioned API convention. Confirm the actual prefix in the Express application configuration before relying on it.

### 3.1 Versioning Rules

- Avoid breaking existing API contracts without an approved change.
- Document incompatible changes explicitly.
- Keep frontend requests aligned with the backend route definitions.
- Record new or changed endpoints in the API documentation.

---

## 4. Request and Response Conventions

### 4.1 Content Types

Ordinary JSON request:

`Content-Type: application/json`

File-upload request, where supported:

`Content-Type: multipart/form-data`

The browser should normally generate the multipart boundary automatically when sending a `FormData` request.

File responses may use an appropriate media type, such as `application/pdf`, depending on the endpoint.

### 4.2 JSON Response Envelope

The following is an illustrative success-response format:

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

This envelope is a documentation example. Do not change existing responses to match it without checking the current API contract.

A collection response may contain pagination metadata if supported:

```json
{
  "success": true,
  "message": "Records retrieved successfully.",
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 0,
    "totalPages": 0
  }
}
```

The actual field names and response shape must match the implementation.

### 4.3 Error Response

Illustrative error response:

```json
{
  "success": false,
  "message": "Request validation failed.",
  "errors": []
}
```

The backend must not expose secrets, SQL credentials, authentication tokens, or production stack traces in client-facing errors.

### 4.4 Identifier Format

Identifiers must use the format required by the database schema and existing validators.

The API must reject malformed identifiers before performing operations that depend on them.

---

## 5. HTTP Status Codes

Use status codes according to the documented endpoint behavior.

| Status | Meaning | Typical use |
|---|---|---|
| 200 | OK | Successful retrieval or update |
| 201 | Created | Successful resource creation |
| 204 | No Content | Successful operation with no response body, if used |
| 400 | Bad Request | Invalid request or validation failure |
| 401 | Unauthorized | Authentication missing or invalid |
| 403 | Forbidden | Authenticated actor lacks permission |
| 404 | Not Found | Resource or route not found |
| 409 | Conflict | Duplicate or conflicting state |
| 413 | Content Too Large | Request or file exceeds a configured limit |
| 415 | Unsupported Media Type | Unsupported request or file media type |
| 422 | Unprocessable Content | Semantically invalid input, if used |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server-side failure |
| 503 | Service Unavailable | Service or dependency unavailable, if implemented |

The status codes in the table are conventions. Use the codes actually specified by each route and its error-handling implementation.

---

## 6. Authentication and Authorization

### 6.1 Authentication

Protected endpoints must use the authentication mechanism implemented by the backend.

The current project documentation describes token-based authentication and HttpOnly cookies, but the precise mechanism, cookie configuration, and token lifecycle must be verified against the authentication middleware and controller code.

Do not assume that both bearer-token and cookie authentication are supported unless the implementation confirms this.

### 6.2 Authentication Requirements

- Public endpoints must not require authentication unless their route configuration specifies otherwise.
- Protected endpoints must reject missing or invalid authentication.
- Logout must follow the implemented token or session invalidation mechanism.
- Authentication secrets must not be returned in ordinary resource responses.
- Cookies must use appropriate security attributes for the deployment environment.
- If cookie authentication is used, review CSRF protection requirements for state-changing requests.

### 6.3 Authorization

The documented roles are:

- `USER`
- `ADMIN`

The backend must enforce the permissions configured for each operation.

Frontend route guards or hidden controls are not sufficient authorization.

### 6.4 Ownership

For private PDF resources and other user-owned data, the backend must verify ownership or explicitly granted permission before returning or modifying the resource.

---

## 7. Endpoint Inventory

The following groups describe the expected API areas. They do not confirm exact paths or methods.

| API group | Purpose | Verification source |
|---|---|---|
| Health | Service health check | Health route |
| Authentication | Registration, login, logout | Auth routes and controller |
| Users | User-related operations | User routes and controller |
| Books | Book CRUD and listing | Book routes and controller |
| Authors | Author management | Author routes and controller |
| Categories | Category management | Category routes and controller |
| Chapters | Chapter management | Chapter routes and controller |
| Book relationships | Supported book associations | Relationship routes and controller |
| Private library | User-owned PDF operations | Private-library routes and controller |

The precise routes must be extracted from the current backend before this inventory is treated as complete.

---

## 8. Health Endpoint

### Purpose

Provides a basic indication that the backend service is responding.

### Illustrative request

`GET /api/v1/health`

### Illustrative response

```json
{
  "success": true,
  "message": "Server is running."
}
```

**Verification required:** Confirm the mounted route and exact response in the current Express application. A successful health response does not prove that all features or database operations are healthy.

---

## 9. Authentication Endpoints

The exact paths below are intentionally not fixed here. Use the existing authentication route definitions as the source of truth.

### 9.1 Registration

**Method:** Confirm in the authentication route file.

**Purpose:** Create a user account.

Expected validation considerations:

- Required fields.
- Valid field formats.
- Password requirements.
- Duplicate account prevention.
- Safe password hashing.
- Rejection of client-supplied administrative privileges unless explicitly permitted by a secure design.

### 9.2 Login

**Method:** Confirm in the authentication route file.

**Purpose:** Authenticate an account.

Expected behavior:

- Validate credentials.
- Verify the password securely.
- Apply authentication rate limiting where configured.
- Establish the configured authenticated state.
- Return an appropriate response without exposing password hashes.

### 9.3 Logout

**Method:** Confirm in the authentication route file.

**Purpose:** End or invalidate the authenticated state according to the implemented design.

Verify cookie clearing, token invalidation, and server-side revocation behavior as applicable.

### 9.4 Authentication Verification

Test:

1. Valid registration.
2. Invalid registration data.
3. Duplicate account registration.
4. Valid login.
5. Invalid login.
6. Access to a protected endpoint without authentication.
7. Access with invalid authentication.
8. Logout behavior.
9. Access after logout.
10. Rate limiting where configured.

---

## 10. User Endpoints

User routes must be inspected before documenting exact methods and paths.

Expected concerns include:

- Accessing permitted user information.
- Updating only fields that the user is authorized to change.
- Protecting administrative fields.
- Avoiding exposure of password hashes and authentication secrets.
- Enforcing authorization for any operation involving another user.

Do not assume a public user-list endpoint exists.

---

## 11. Book Endpoints

Book operations are defined by the actual book route and controller implementation.

Expected operation categories may include:

- Create a book.
- List books.
- Retrieve book details.
- Update book metadata.
- Delete or archive a book where supported.
- Apply publication or visibility changes where supported.

### 11.1 Book Request Validation

Validate applicable fields, including:

- Required metadata.
- Identifier format.
- String length and permitted values.
- Referenced author or category identifiers.
- Publication and visibility fields.
- Pagination and filter parameters.

Use the actual validator schema as the source of truth.

### 11.2 Book Access Rules

- Verify the actor's permissions before mutations.
- Apply the implemented visibility rules to retrieval.
- Validate referenced records.
- Preserve data integrity.
- Return consistent error responses for invalid operations.

---

## 12. Author Endpoints

Author operations must be documented from the actual author route definitions.

Potential operation categories include create, list, retrieve, update, and delete.

The implementation must validate author data and enforce the documented relationship rules for books.

Deletion behavior must match the database constraints and service logic.

---

## 13. Category Endpoints

Category operations must match the current category route definitions.

Potential operation categories include create, list, retrieve, update, delete, and filter books by category.

The backend must validate category identifiers and apply the configured relationship and deletion rules.

Do not assume that all category operations are available to ordinary users.

---

## 14. Chapter Endpoints

Chapter operations must match the current chapter route definitions.

Potential operation categories include:

- Create a chapter.
- List chapters for a book.
- Retrieve chapter details.
- Update a chapter.
- Delete a chapter.
- Apply supported ordering or visibility rules.

The backend must validate the parent book, chapter data, and permissions.

If a chapter belongs to a restricted book, chapter retrieval must follow the implemented access rules.

---

## 15. Book Relationship Endpoints

The project includes a relationship-management area for associations between books and related entities.

The exact relationship types and endpoint paths must be confirmed from the relationship route, controller, service, and repository files.

Requirements:

- Validate all referenced identifiers.
- Verify the actor's permission.
- Reject invalid relationships.
- Apply the documented duplicate and integrity rules.
- Avoid partial inconsistent changes where a multi-step operation requires atomicity.

Do not infer the relationship types from route names alone; verify the actual implementation.

---

## 16. Private Library and PDF Endpoints

Private-library operations must be documented from the actual routes and implementation.

Potential operation categories include:

- Upload a private PDF.
- List the current user's private documents.
- Retrieve a document or its metadata.
- Stream supported PDF content.
- Delete a private document where supported.

### 16.1 Upload Requirements

Where uploads are implemented:

- Authenticate the user.
- Validate file type and configured size limits.
- Validate relevant file metadata.
- Use safe storage paths and filenames.
- Handle malformed files safely.
- Associate the file with the correct owner.
- Return success only after the required operation completes.

### 16.2 Retrieval Requirements

Before returning a private file, the backend must verify that the requesting user owns it or has explicit authorization.

Knowledge of a document identifier must not grant access.

### 16.3 File Response

A file-streaming endpoint may return the appropriate content type and download or inline-display headers.

The exact behavior must match the implementation.

---

## 17. Pagination, Filtering, and Sorting

Collection endpoints should implement pagination where appropriate.

If supported, document:

- Default page.
- Default page size.
- Maximum page size.
- Supported filters.
- Supported sort fields.
- Sort direction.
- Behavior for invalid values.
- Pagination metadata in the response.

All query parameters must be validated and bounded.

Do not assume that every endpoint supports the same filters or pagination format.

---

## 18. Input Validation Rules

The backend must validate requests at the appropriate boundary.

Validation should cover, where applicable:

- Required fields.
- String length.
- Data type.
- Identifier format.
- Enum or state values.
- Numeric bounds.
- Pagination limits.
- File size and media type.
- Related-record existence.
- Business-rule constraints.

Validation must not replace authorization checks. A structurally valid request can still be unauthorized.

The API specification must be updated to reflect the exact validation schemas in the repository.

---

## 19. Error Handling

The API must handle errors consistently.

Expected error categories include:

- Validation failure.
- Authentication failure.
- Authorization failure.
- Missing resource.
- Duplicate or conflicting resource.
- Unsupported media type.
- Upload-size violation.
- Rate limit exceeded.
- Database failure.
- Unexpected server error.

### 19.1 Error Safety

Error responses must not disclose:

- Passwords or password hashes.
- JWT secrets or other credentials.
- Database connection strings.
- Internal stack traces in production.
- Private document contents.
- Sensitive environment variables.

### 19.2 Error Verification

For each important endpoint, test at least one successful request and relevant failure cases.

Record actual status codes and response bodies instead of assuming they match illustrative examples in this document.

---

## 20. Security Requirements

The API must apply the security controls supported by the approved implementation and deployment configuration.

These include:

- Server-side authentication and authorization.
- Input validation.
- Parameterized database queries.
- Password hashing.
- Rate limiting where configured.
- Security headers.
- Restrictive CORS configuration.
- Safe error responses.
- Private-resource ownership checks.
- Safe file-upload handling.
- Secret management through environment configuration.

A documented control is not proof that the control is correctly configured. Verification must use code review, tests, and environment inspection.

---

## 21. API Testing Strategy

Test endpoints using automated tests or manual HTTP requests, including PowerShell `Invoke-RestMethod` where appropriate.

### 21.1 Positive Tests

- Valid request.
- Correct authenticated user.
- Correct administrative role where required.
- Valid referenced records.
- Expected response and database state.

### 21.2 Negative Tests

- Missing required fields.
- Invalid identifiers.
- Invalid authentication.
- Insufficient permissions.
- Another user's private resource.
- Nonexistent resources.
- Duplicate or conflicting data.
- Unsupported file type.
- Oversized file.
- Invalid pagination parameters.

### 21.3 Integration Tests

Verify that routes, controllers, services, repositories, and MySQL work together correctly where those layers are used.

### 21.4 Test Evidence

For every test, record:

- Endpoint and HTTP method.
- Preconditions.
- Request data.
- Expected status and response.
- Actual status and response.
- Relevant database changes.
- Result: passed, failed, blocked, or not tested.

---

## 22. API Change Management

Any API change that affects frontend or external clients must be reviewed and documented.

Examples include:

- Adding or removing an endpoint.
- Changing a method or path.
- Changing request fields.
- Changing response fields.
- Changing status codes.
- Changing authentication requirements.
- Changing permissions.
- Changing validation rules.
- Changing pagination or filtering behavior.

Update the corresponding tests and related API documentation with the change.

---

## 23. Implementation Verification Checklist

Before marking this specification as verified:

- [ ] Confirm the actual API base path.
- [ ] Inventory the Express route registrations.
- [ ] Record exact HTTP methods and paths.
- [ ] Inspect controller request and response behavior.
- [ ] Inspect validator schemas.
- [ ] Inspect authentication and authorization middleware.
- [ ] Confirm role and ownership checks.
- [ ] Confirm request and response formats.
- [ ] Confirm error status codes.
- [ ] Confirm pagination and filtering behavior.
- [ ] Confirm file-upload and private-file behavior.
- [ ] Run relevant API tests.
- [ ] Record any undocumented or inconsistent behavior.
- [ ] Update this document from actual evidence.

---

## 24. Related Documents

- `docs/02-requirements/SRS.md`
- `docs/02-requirements/functional-requirements.md`
- `docs/02-requirements/non-functional-requirements.md`
- `docs/02-requirements/acceptance-criteria.md`
- `docs/02-requirements/use-cases.md`
- `docs/03-technical/architecture.md`
- `docs/03-technical/database-design.md`
- `docs/03-technical/technology-stack.md`
- `docs/05-security/`
- `docs/07-testing/`
- `docs/api/README.md`
- `docs/api/auth.md`
- `docs/api/books.md`
- `docs/api/authors.md`
- `docs/api/categories.md`
- `docs/api/chapters.md`
- `docs/api/private-library.md`
- `docs/api/users.md`

---

## 25. Conclusion

This document defines the API design conventions and expected endpoint groups for Digital Library.

The actual backend implementation remains the source of truth for exact route paths, request schemas, response formats, authorization rules, and status codes. The specification must be reconciled with the current code and verified through testing before being treated as a complete API contract.
