# Security Testing

## 1. Purpose

This document defines the security-testing strategy for the Digital Library project.

Security testing evaluates whether the application's authentication, authorization, input validation, database access, file handling, configuration, and error handling protect the application and its data against unauthorized access and common vulnerabilities.

This document describes planned security checks. It does not claim that the application has passed a security assessment or that any listed control is implemented without supporting evidence.

## 2. Project Context

Digital Library is a BTech final-year project using:

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js and Express.js
- **Database:** MySQL
- **Architecture:** Monolithic application

The primary application roles are `USER` and `ADMIN`.

Security requirements must be verified against the actual application, documented API contracts, and database schema. Do not assume that a planned feature or security control is already implemented.

## 3. Security Testing Objectives

Security testing should verify that:

1. Authentication cannot be bypassed.
2. Passwords and authentication credentials are handled safely.
3. Administrative operations are restricted to authorized users.
4. Private resources cannot be accessed by unauthorized users.
5. User-controlled input cannot manipulate SQL queries.
6. Malicious content cannot execute unexpectedly in the browser.
7. File uploads and downloads follow defined security rules.
8. Sensitive information is not exposed through API responses or logs.
9. Configuration and secrets are protected.
10. Rate limiting and security middleware behave as intended where implemented.
11. Errors do not reveal unnecessary internal details.
12. Security-related changes do not introduce regressions.

## 4. Scope

### 4.1 Included areas

- Registration and login.
- Authentication middleware.
- Role-based authorization.
- Resource ownership and access control.
- Request validation.
- SQL injection resistance.
- Cross-site scripting (XSS) prevention.
- Cross-origin resource sharing (CORS).
- Security headers.
- Rate limiting.
- File upload and private-file access.
- Password hashing.
- Session or token handling.
- Environment configuration.
- Error responses and logging.
- Security regression testing.

### 4.2 Out of scope

The following require separate approval, tools, or dedicated assessments:

- Destructive penetration testing against production.
- Denial-of-service testing against public infrastructure.
- Testing third-party systems without authorization.
- Comprehensive infrastructure penetration testing.
- Formal compliance certification.

All testing must be authorized and conducted against an isolated development or test environment whenever possible.

## 5. Test Environment and Safety

Before testing:

1. Confirm the target environment and application owner.
2. Use a dedicated test database.
3. Create test accounts with controlled permissions.
4. Use synthetic test data.
5. Back up test data when necessary.
6. Confirm that test cleanup cannot affect production data.
7. Record the application version or commit being tested.
8. Avoid recording real passwords, tokens, cookies, or other secrets.
9. Avoid high-volume or destructive tests unless explicitly authorized and safely controlled.

Never perform destructive security testing against a production system without explicit authorization and an approved test plan.

## 6. Authentication Testing

### 6.1 Registration

Verify that:

- Required fields are validated.
- Invalid data is rejected.
- Duplicate accounts are handled according to requirements.
- Passwords are not stored in plaintext.
- Client-provided role values cannot grant administrative privileges.
- Error responses do not expose sensitive account details.

### 6.2 Login

Verify that:

- Valid credentials authenticate successfully.
- Invalid credentials are rejected.
- Missing fields are handled safely.
- Authentication failures do not reveal unnecessary sensitive details.
- Protected endpoints reject requests without valid credentials.
- Token or session validation follows the documented design.

### 6.3 Logout and expiration

Where applicable, verify that:

- Logout follows the actual authentication design.
- Authentication credentials cannot be reused contrary to the documented invalidation behavior.
- Expired or invalid credentials are rejected.
- Cookie attributes are configured appropriately when cookies are used.
- Token invalidation behavior is understood, including whether invalidation state persists across server restarts.

Do not assume that deleting a browser token automatically invalidates a server-side token.

## 7. Authorization Testing

Authentication identifies the requester; authorization determines what that requester may do.

Verify that:

- `USER` cannot perform administrator-only operations.
- `ADMIN` can perform only the administrative operations allowed by requirements.
- Requests without authentication cannot access protected resources.
- A user cannot access another user's private library without permission.
- Ownership is checked on the server.
- Client-provided user IDs, role values, and ownership fields are not trusted blindly.
- Direct API calls receive the same authorization checks as frontend-initiated requests.
- Unauthorized requests do not modify database records.

### Example ownership test

1. Create User A and User B in the test environment.
2. Create a private resource owned by User A.
3. Authenticate as User B.
4. Request User A's resource using its actual identifier.
5. Verify that access is denied unless the documented sharing rules explicitly permit it.
6. Verify that the request did not modify the resource or disclose private contents.

Record the actual endpoint and result after testing the implementation.

## 8. Input Validation Testing

Test request bodies, path parameters, query parameters, and relevant headers.

Check:

- Missing required fields.
- Incorrect data types.
- Empty and excessively long strings.
- Invalid identifiers.
- Unexpected fields.
- Malformed JSON.
- Invalid enum or status values.
- Invalid relationship identifiers.
- Unexpected arrays or objects.
- Boundary values.
- Unsupported file metadata.

Expected behavior is rejection or safe handling according to the API contract. Validation must not be bypassable merely because the frontend performs its own checks.

## 9. SQL Injection Testing

### Objective

Verify that user-controlled input cannot alter SQL query structure or bypass database authorization.

### Areas to inspect

- Login and registration queries.
- Book search and filtering.
- Book and chapter identifiers.
- Sorting and pagination.
- Category and author lookups.
- Database update and deletion operations.
- Any dynamic SQL construction.

### Test approach

1. Inspect database-access code.
2. Confirm that supplied values use parameterized queries.
3. Test unusual input in an isolated environment.
4. Confirm that input is treated as data rather than executable SQL.
5. Verify that failed requests do not expose database errors.
6. Check that invalid input does not modify unintended records.

Use allowlists for dynamic identifiers such as sort-column names, because ordinary query parameters generally represent values rather than SQL identifiers.

Do not use destructive SQL payloads against real data.

## 10. Cross-Site Scripting (XSS) Testing

### Objective

Verify that user-controlled text is displayed safely in the browser.

### Areas to inspect

- Book titles and descriptions.
- Author names and metadata.
- Chapter titles and content.
- Search results.
- User profile fields, if implemented.
- Error messages and dynamically generated UI elements.

### Test approach

- Review DOM rendering code.
- Prefer `textContent` for displaying plain text.
- Avoid inserting untrusted values through `innerHTML`.
- If HTML rendering is required, use an appropriate sanitization approach.
- Test representative harmless XSS payload strings in the isolated environment.
- Confirm that input is displayed as text or safely sanitized rather than executed.

Do not assume that input validation alone prevents XSS. Output handling must also be reviewed.

## 11. CORS Testing

Verify that the CORS configuration matches the intended frontend origins.

Check:

- Requests from an approved origin.
- Requests from an unapproved origin.
- Preflight requests where applicable.
- Allowed HTTP methods.
- Allowed request headers.
- Credentialed requests, if supported.
- Compatibility between credential settings and origin policy.

CORS is a browser-enforced cross-origin policy, not a replacement for authentication or authorization. A denied browser response does not necessarily mean that direct API access is blocked.

## 12. Security Headers

If Helmet or other security-header middleware is configured, verify the actual response headers.

Review applicable controls such as:

- Content Security Policy.
- `X-Content-Type-Options`.
- Frame embedding restrictions.
- Referrer policy.
- Transport security settings in the appropriate HTTPS deployment environment.

Do not assume that installing Helmet automatically provides every desired policy. Verify the configuration and resulting headers.

Avoid weakening security headers simply to make a test pass. Investigate the underlying compatibility issue first.

## 13. Rate-Limiting Testing

Where rate limiting is implemented, verify:

- Sensitive endpoints have appropriate limits.
- Requests below the configured limit work normally.
- Repeated requests beyond the limit are handled as documented.
- The response does not reveal sensitive information.
- Legitimate users can recover after the configured window.
- Rate-limit behavior is appropriate for the deployment architecture.

Record the configured limit and window from the actual implementation. Do not invent values.

Run these checks in a controlled environment to avoid unintentionally blocking other developers.

## 14. Password Security Testing

Verify that:

- Passwords are stored as approved hashes.
- Password verification uses the corresponding hashing mechanism.
- Plaintext passwords are not written to logs.
- Password values are not returned in API responses.
- Password changes, if implemented, require appropriate authorization.
- Database exports and test reports do not expose plaintext credentials.
- Password hashing parameters follow the selected library's supported configuration.

Do not publish hashes or real credentials in test reports when they could create additional exposure.

## 15. File Upload and Download Testing

Apply these checks only to file functionality that exists in the current implementation.

Verify:

- Missing files are rejected.
- Oversized files are rejected.
- Unsupported file types are rejected.
- Client-provided MIME types are not blindly trusted.
- File paths cannot be manipulated through traversal input.
- Storage names are safe.
- Private files are not publicly accessible unintentionally.
- Download endpoints enforce authentication and ownership rules.
- Missing or corrupt files produce safe error responses.
- Upload failures do not leave inconsistent database records or unnecessary temporary files.

For PDF functionality, also inspect how uploaded files are processed and served. Do not assume that every PDF is safe simply because its extension is `.pdf`.

## 16. Error Handling and Information Disclosure

Verify that:

- Invalid requests produce predictable client errors.
- Unexpected failures produce appropriate server errors.
- Public responses do not include stack traces.
- SQL query text and database credentials are not exposed.
- Authentication errors do not leak tokens.
- Logs avoid passwords, session cookies, and secret values.
- Internal errors retain enough safe diagnostic context for developers.
- Missing resources do not reveal unauthorized private content.

Use the actual response contract when determining expected status codes and error structures.

## 17. Environment and Secret Management

Verify that:

- Real `.env` files are excluded from version control where appropriate.
- Example configuration contains placeholders only.
- Secrets are not embedded in frontend source code.
- Required configuration is validated appropriately.
- Development and production credentials are separated.
- Error messages do not reveal secret values.
- Git history and tracked files are reviewed for accidental secret exposure.

If a secret is exposed, remove it from active use by rotating or revoking it. Deleting it from the latest version alone does not guarantee that it has been removed from repository history.

## 18. Security Test Case Register

The following cases are a baseline. Adjust them to match implemented functionality.

| Test ID | Scenario | Expected result | Priority |
|---|---|---|---|
| ST-001 | Access protected API without credentials | Access is denied | Critical |
| ST-002 | Authenticate with invalid credentials | Authentication fails safely | Critical |
| ST-003 | Attempt an admin operation as `USER` | Access is denied | Critical |
| ST-004 | Access another user's private resource | Access is denied unless explicitly permitted | Critical |
| ST-005 | Submit invalid registration data | Request is rejected safely | High |
| ST-006 | Submit SQL-like input to an applicable field | Input cannot alter query structure | Critical |
| ST-007 | Display an XSS test string | String is rendered safely | High |
| ST-008 | Request from an unapproved browser origin | CORS policy behaves as configured | Medium |
| ST-009 | Exceed a configured rate limit | Request is limited according to policy | High |
| ST-010 | Upload an oversized file | Upload is rejected | High |
| ST-011 | Attempt path traversal in file access | Unauthorized path access is prevented | Critical |
| ST-012 | Trigger a controlled internal error | Sensitive internals are not exposed | High |
| ST-013 | Inspect authentication responses | No secret credentials are returned | Critical |
| ST-014 | Review tracked files for secrets | No active secrets are committed | Critical |
| ST-015 | Reuse an invalidated credential | Behavior matches the documented authentication design | High |

These cases describe expected outcomes. They are not execution results.

## 19. Manual Security Testing Workflow

For each test:

1. Assign a test ID.
2. Record the target environment and code version.
3. Identify the relevant endpoint or frontend workflow.
4. Prepare controlled test data.
5. Define the expected behavior.
6. Execute the test.
7. Record the observed behavior.
8. Preserve safe diagnostic evidence.
9. Assign severity if a defect is found.
10. Retest after the correction.
11. Run related regression tests.
12. Update the security report.

Use the documented API specification and actual route files to obtain endpoint paths. Do not guess route names.

## 20. Security Defect Severity

Use the following categories as an initial classification guide.

| Severity | Description | Examples |
|---|---|---|
| Critical | Direct, serious compromise of sensitive data or control | Authentication bypass or broad unauthorized private-data access |
| High | Significant security weakness with meaningful impact | Privilege escalation or exploitable injection vulnerability |
| Medium | Limited or conditional security impact | Misconfiguration with restricted exposure |
| Low | Minor weakness with limited impact | Non-sensitive information disclosure |
| Informational | Improvement or observation without a demonstrated vulnerability | Additional hardening recommendation |

Determine severity from actual exploitability, impact, exposure, and available mitigations. Do not assign a severity solely from the test name.

## 21. Security Finding Report Template

For each finding, record:

- **Finding ID:**
- **Title:**
- **Date discovered:**
- **Test environment:**
- **Application commit or version:**
- **Affected component:**
- **Severity:**
- **Description:**
- **Preconditions:**
- **Steps to reproduce:**
- **Expected behavior:**
- **Observed behavior:**
- **Impact:**
- **Evidence location:**
- **Recommended remediation:**
- **Retest result:**
- **Current status:**

Never include live credentials, active session tokens, or unnecessary personal information in a finding report.

## 22. Exit Criteria

Security testing for a release is complete when:

- Required security scenarios have been executed.
- Authentication and authorization checks have evidence.
- Private-resource access controls have been reviewed.
- Database and input-handling risks have been assessed.
- File handling has been reviewed where applicable.
- Relevant configuration and secret-management checks have been performed.
- Findings are documented with appropriate severity.
- Critical release-blocking issues are resolved or formally accepted by the responsible project authority.
- Fixes have been retested.
- Remaining risks and untested areas are clearly disclosed.

Passing the listed checks does not establish that the application is completely secure or that a formal penetration test has been performed.

## 23. Maintenance

Update this document when authentication, authorization, database access, file handling, API contracts, deployment configuration, or other security-sensitive components change.

Keep planned test cases separate from executed results and maintain a record of outstanding security risks.
