# Digital Library Security Documentation

## 1. Purpose

This directory contains security documentation for the Digital Library application.

The project uses HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL. It follows a monolithic architecture rather than a microservices architecture.

These documents define security requirements, implementation guidance, and verification procedures for the backend, frontend, database, authentication workflows, and file-related features.

**Implementation status:** The presence of a security document does not prove that its recommendations are implemented. Verify actual controls against the current source code, configuration, database schema, and test evidence.

## 2. Security Documentation Index

| Document | Purpose |
|---|---|
| `authentication.md` | Authentication requirements and verification |
| `authorization.md` | Role-based access and resource ownership |
| `content-model.md` | Security requirements for books, authors, categories, chapters, and related resources |
| `cors.md` | Cross-Origin Resource Sharing configuration |
| `environment.md` | Environment variables, secrets, and configuration security |
| `error-handling.md` | Safe API errors, logging, and exception handling |
| `file-upload-prep.md` | Upload validation, storage, and file-access safeguards |
| `password-security.md` | Password hashing, validation, and credential protection |
| `rate-limiting.md` | Request limits and abuse prevention |
| `sql-injection.md` | SQL injection prevention |
| `validation.md` | Backend request validation |
| `xss.md` | Cross-site scripting prevention |

## 3. Security Objectives

The application should:

1. Protect user accounts and credentials.
2. Enforce authentication and authorization on protected endpoints.
3. Protect private-library resources and associated files.
4. Validate untrusted input on the backend.
5. Use parameterized database queries.
6. Prevent unauthorized content modification.
7. Avoid exposing sensitive information in API responses and logs.
8. Configure CORS and environment settings deliberately.
9. Limit excessive or abusive requests.
10. Handle errors without disclosing internal implementation details.
11. Preserve database and file consistency.
12. Verify security controls through testing.

## 4. Application Security Boundaries

The intended architecture includes the following components:

```text
Browser / Frontend
        |
        | HTTP requests
        v
Express.js API
        |
        +--> Request Validation
        |
        +--> Authentication
        |
        +--> Authorization
        |
        +--> Controllers and Services
        |
        +--> Repositories / Database Access
                    |
                    v
                  MySQL

File Storage, if implemented
        ^
        |
Authorized backend operations
```

This diagram represents the intended security boundaries, not a verified map of every implemented middleware or module.

The backend must enforce security rules independently of frontend behavior.

## 5. Authentication and Authorization

Authentication verifies the identity of a requester. Authorization determines whether that identity can perform a particular operation.

The application defines the intended roles:

- `USER`
- `ADMIN`

Security requirements include:

- Require authentication for protected resources.
- Restrict administrative operations.
- Prevent users from assigning themselves privileged roles.
- Check ownership before accessing private resources.
- Reject invalid or expired credentials according to the authentication design.
- Avoid returning password hashes or authentication secrets.
- Apply permissions consistently across API routes.

The actual token or session mechanism, role assignments, and route permissions must be verified against the current implementation.

## 6. Database Security

The backend should use safe database-access practices.

Requirements include:

- Parameterized SQL queries.
- Validated query parameters.
- Appropriate primary and foreign keys.
- Suitable unique constraints.
- Restricted database privileges.
- Consistent transaction handling.
- Safe database error mapping.
- Protection of database credentials.

Input validation does not replace parameterized queries.

The actual schema and database permissions must be reviewed before declaring these controls implemented.

## 7. API Security

Every API endpoint should have an explicit access policy.

Depending on the operation, requirements may include:

- Authentication.
- Role checks.
- Resource ownership checks.
- Request validation.
- Rate limiting.
- Safe error handling.
- Appropriate response fields.
- Consistent HTTP status codes.

Public catalogue endpoints and protected account operations may require different controls.

The API contract must match the routes and behavior actually present in the backend.

## 8. File and Content Security

Where file uploads or private-library files are supported, the application should:

- Validate supported file types.
- Enforce file-size limits.
- Generate safe storage names.
- Prevent path traversal.
- Restrict filesystem permissions.
- Protect private files from unauthorized access.
- Handle partial upload failures safely.
- Avoid exposing internal storage paths.
- Validate and safely render user-controlled content.

A file identifier or URL must not automatically grant permission to access a private file.

The actual upload formats, storage mechanism, and processing capabilities must be verified.

## 9. Frontend Security

The frontend should:

- Avoid storing unnecessary sensitive information.
- Avoid exposing private server-side secrets.
- Render untrusted content safely.
- Avoid unsafe HTML insertion.
- Handle authentication failures appropriately.
- Avoid uncontrolled request retries.
- Use the intended backend API URL.
- Apply the approved authentication and CSRF strategy.

Frontend checks improve usability but cannot replace backend security enforcement.

## 10. Environment and Deployment Security

Configuration should distinguish development, testing, and production environments.

Requirements include:

- Keep real secrets out of Git.
- Validate required environment variables.
- Protect database credentials.
- Protect authentication secrets.
- Use HTTPS in production.
- Configure trusted frontend origins.
- Avoid exposing stack traces in production.
- Restrict access to uploads, logs, and backups.
- Document backup and recovery procedures.

The actual deployment environment and configuration must be verified.

## 11. Security Testing

Security tests should cover the implemented features and endpoints.

Recommended categories include:

- Authentication failures.
- Authorization failures.
- Role escalation attempts.
- Unauthorized resource access.
- Invalid request data.
- SQL injection attempts.
- Cross-site scripting attempts.
- CORS behavior.
- Rate-limit enforcement.
- File-upload validation.
- Sensitive-information disclosure.
- Error-handling behavior.

Use an isolated test environment and test accounts.

Record actual test results and evidence. Do not mark a security control as verified merely because its documentation exists.

## 12. Security Verification Workflow

Use the following workflow when reviewing a security requirement:

1. Identify the requirement in the relevant document.
2. Locate the corresponding route, middleware, controller, service, repository, or configuration.
3. Inspect the related database schema if applicable.
4. Confirm the expected behavior in the source code.
5. Execute a relevant test.
6. Record the actual outcome.
7. Document any gap or limitation.
8. Update the implementation or documentation as needed.

Distinguish clearly between:

- **Planned:** Described as a future requirement.
- **Implemented:** Present in the current source code.
- **Tested:** Executed under a documented test scenario.
- **Verified:** Supported by current implementation and relevant test evidence.

## 13. Security Review Checklist

- [ ] Authentication behavior is verified.
- [ ] Authorization policies are verified.
- [ ] Passwords are securely hashed.
- [ ] Protected endpoints reject unauthorized requests.
- [ ] Private resources enforce ownership checks.
- [ ] Database queries use safe parameterization.
- [ ] Backend input validation is enforced.
- [ ] XSS protections are appropriate for rendered content.
- [ ] CORS matches the intended frontend origins.
- [ ] Environment secrets are protected.
- [ ] Error responses avoid sensitive information.
- [ ] Rate limits are configured where required.
- [ ] File uploads are validated where supported.
- [ ] Logs exclude sensitive credentials.
- [ ] Security tests have been executed and recorded.

## 14. Recommended Review Order

For a structured security review, use this order:

1. `authentication.md`
2. `authorization.md`
3. `password-security.md`
4. `environment.md`
5. `validation.md`
6. `sql-injection.md`
7. `xss.md`
8. `cors.md`
9. `rate-limiting.md`
10. `error-handling.md`
11. `content-model.md`
12. `file-upload-prep.md`

This is a suggested review order, not a dependency sequence.

## 15. Related Documentation

- `../api/README.md`
- `../api/auth.md`
- `../api/users.md`
- `../api/books.md`
- `../api/chapters.md`
- `../api/private-library.md`
- `../03-technical/architecture.md`
- `../03-technical/database-design.md`
- `../03-technical/api-specification.md`
- `../07-testing/security-testing.md`
- `../07-testing/test-cases.md`
- `../08-deployment/production-checklist.md`

## 16. Maintenance

Review the security documentation whenever authentication, authorization, database access, API routes, file handling, configuration, dependencies, or deployment procedures change.

Keep the documentation synchronized with the current implementation, approved requirements, and executed test evidence.

Do not treat recommendations in these documents as proof of security compliance.
