# Authentication API

## 1. Overview

This document describes the authentication API for the Digital Library application.

The backend uses Node.js and Express.js, with MySQL for persistent application data. Authentication endpoints are responsible for identifying users and establishing or terminating authenticated sessions according to the implemented authentication mechanism.

**Important:** The endpoint paths, request fields, response structures, and authentication mechanism documented below are specifications to verify against the current backend routes, controllers, validators, and middleware. Do not assume an endpoint is implemented until its route and behavior have been confirmed.

## 2. Scope

The authentication API may include the following operations, depending on the implemented routes:

- User registration.
- User login.
- Retrieval of the current authenticated user's profile.
- Logout.
- Authentication status validation.
- Token or session lifecycle management.

Password-reset, email-verification, refresh-token, and account-recovery endpoints are not assumed to exist unless separately implemented.

## 3. Base URL

Local development base URL:

```text
http://localhost:PORT/api/v1
```

Replace `PORT` with the backend port configured in the current environment.

The exact port and route prefixes must be confirmed from the server configuration and Express route mounting.

## 4. Authentication and Authorization

Protected endpoints require the authentication mechanism configured by the backend.

Depending on the implementation, credentials may be transported through an authorization header or an appropriately configured cookie.

Clients must not assume that both mechanisms are supported.

### Security requirements

- Passwords must never be returned in API responses.
- Passwords must be stored using an appropriate password-hashing algorithm.
- Authentication credentials must not be logged.
- Protected endpoints must reject unauthenticated requests.
- Role-restricted operations must enforce authorization on the server.
- Invalid or expired credentials must be handled consistently.
- Cookie-based authentication must use appropriate cookie security attributes.
- Authentication secrets must be transmitted over HTTPS in production.

## 5. Registration

### Purpose

Create a user account when public registration is supported.

**Proposed request**

```http
POST /api/v1/auth/register
Content-Type: application/json
```

Example request body:

```json
{
  "username": "reader01",
  "email": "reader@example.com",
  "password": "Use-A-Strong-Unique-Password"
}
```

The fields above are illustrative. The actual accepted fields, validation rules, and default role must be confirmed from the implementation.

### Expected behavior

A registration operation should:

1. Validate the request body.
2. Validate required fields and field formats.
3. Enforce uniqueness rules for applicable identifiers.
4. Hash the password before storing it.
5. Assign the appropriate permitted role.
6. Persist the new user record.
7. Return a safe response without exposing credentials.

### Possible responses

- `201 Created` — account created.
- `400 Bad Request` — invalid input.
- `409 Conflict` — identifier already exists, if this status is used.
- `429 Too Many Requests` — rate limit exceeded.
- `500 Internal Server Error` — unexpected server failure.

These statuses are recommended contract examples, not verified implementation results.

## 6. Login

### Purpose

Authenticate an existing user.

**Proposed request**

```http
POST /api/v1/auth/login
Content-Type: application/json
```

Example request body:

```json
{
  "email": "reader@example.com",
  "password": "Use-A-Strong-Unique-Password"
}
```

The actual login identifier may be an email address, username, or another field supported by the backend.

### Expected behavior

A login operation should:

1. Validate the request body.
2. Locate the relevant account.
3. Verify the supplied password against the stored password hash.
4. Reject invalid credentials.
5. Establish the configured authentication state.
6. Return a safe user representation.
7. Avoid disclosing whether a specific account exists when that could enable account enumeration.

### Possible responses

- `200 OK` — authentication successful.
- `400 Bad Request` — invalid request.
- `401 Unauthorized` — invalid credentials.
- `429 Too Many Requests` — rate limit exceeded.
- `500 Internal Server Error` — unexpected server failure.

If the application uses cookies, the response may set an authentication cookie. If it uses bearer tokens, the response contract must define how the token is issued and transported.

Do not document a token field or cookie name as an established fact until verified.

## 7. Current User Profile

### Purpose

Retrieve information about the currently authenticated user, if a profile endpoint is implemented.

**Proposed request**

```http
GET /api/v1/auth/me
```

### Expected behavior

- Validate the authentication state.
- Identify the authenticated account.
- Return only permitted profile fields.
- Reject unauthenticated requests.
- Avoid returning password hashes or authentication secrets.

### Possible responses

- `200 OK` — profile retrieved.
- `401 Unauthorized` — authentication is missing, invalid, or expired.
- `500 Internal Server Error` — unexpected server failure.

The path `/auth/me` is illustrative and must be checked against the actual router.

## 8. Logout

### Purpose

Terminate or invalidate the current authenticated session where logout is supported.

**Proposed request**

```http
POST /api/v1/auth/logout
```

### Expected behavior

The logout operation should follow the application's authentication design.

Depending on the mechanism, this may involve:

- Clearing an authentication cookie.
- Invalidating a server-side session.
- Revoking a refresh token.
- Invalidating a token through an appropriate revocation mechanism.

Deleting a token from the client does not necessarily invalidate a copied token on the server.

If token revocation relies on in-memory storage, its behavior after a server restart must be documented and evaluated.

### Possible responses

- `200 OK` or `204 No Content` — logout processed.
- `401 Unauthorized` — if the implementation requires valid authentication.
- `500 Internal Server Error` — unexpected server failure.

The actual logout semantics and response status must be verified.

## 9. Authentication Middleware

Protected routes should use the authentication middleware configured by the application.

The middleware should:

1. Read credentials from the configured transport.
2. Validate the credential or session.
3. Identify the authenticated user.
4. Attach the verified identity to the request context.
5. Reject invalid or missing authentication.
6. Pass control to the next middleware or route handler only when appropriate.

The exact request property used to store the authenticated identity must be taken from the actual codebase.

## 10. Role-Based Authorization

The project defines two intended application roles:

- `USER`
- `ADMIN`

Authentication establishes identity. Authorization determines which operations that identity may perform.

Examples of authorization rules include:

| Operation | Expected access policy |
|---|---|
| Browse public books | Public or authenticated access, according to requirements |
| Read restricted content | Authorized access only |
| Manage categories | Administrator only, if specified |
| Perform administrative book operations | Administrator only |
| Access another user's private library | Denied unless explicitly authorized |

The final policy must be derived from the approved requirements and actual route middleware.

Never trust a role supplied by the client without validating it against a trusted source.

## 11. Validation Requirements

Authentication requests should be validated before business logic executes.

Validation should cover:

- Required fields.
- Field types.
- Identifier formats.
- Password constraints.
- Unexpected or disallowed fields.
- Request-body size.
- Invalid or malformed JSON.

Validation rules must be consistent with the current validators and product requirements.

## 12. Error Response Contract

Where consistent with the existing API conventions, errors may follow a structure such as:

```json
{
  "success": false,
  "message": "Authentication failed."
}
```

The example is illustrative. The application's existing response format takes precedence.

Error responses should:

- Use appropriate HTTP status codes.
- Avoid exposing stack traces to clients.
- Avoid returning password hashes or credentials.
- Provide safe and useful messages.
- Preserve relevant diagnostic information in secure server-side logs.

## 13. Security Checklist

Before treating the authentication API as verified, confirm that:

- [ ] Passwords are securely hashed.
- [ ] Passwords and secrets are never returned.
- [ ] Authentication middleware validates credentials correctly.
- [ ] Protected endpoints reject unauthenticated requests.
- [ ] Administrative routes enforce role-based authorization.
- [ ] Private-resource endpoints enforce ownership or equivalent access rules.
- [ ] Login and registration have suitable rate limiting.
- [ ] Input validation is enforced server-side.
- [ ] Authentication cookies, if used, have appropriate security attributes.
- [ ] Tokens are not unnecessarily exposed or logged.
- [ ] Logout behavior is clearly defined and tested.
- [ ] Production deployment uses HTTPS.
- [ ] Error responses do not disclose sensitive implementation details.

## 14. Testing Requirements

Authentication tests should cover:

1. Valid registration data.
2. Missing registration fields.
3. Invalid field formats.
4. Duplicate identifiers.
5. Valid login credentials.
6. Invalid login credentials.
7. Missing authentication on protected endpoints.
8. Invalid or expired credentials.
9. Role-restricted operations.
10. Logout behavior.
11. Rate-limited requests.
12. Error handling when the database is unavailable.

Each test should record the request, expected response, actual response, environment, and result.

Do not mark these tests as passed until they have actually been executed.

## 15. Manual Testing with PowerShell

After confirming the actual endpoint paths and request fields, an API can be tested using PowerShell.

Example template:

```powershell
$baseUrl = "http://localhost:PORT/api/v1"

$body = @{
    email = "reader@example.com"
    password = "Use-A-Strong-Unique-Password"
} | ConvertTo-Json

Invoke-RestMethod `
    -Method Post `
    -Uri "$baseUrl/auth/login" `
    -ContentType "application/json" `
    -Body $body
```

Replace `PORT`, the endpoint path, and the request fields with the values defined by the actual backend.

Do not paste real passwords, tokens, or other secrets into shared logs or project documentation.

## 16. Implementation Verification

Before finalizing this API specification, inspect:

- Authentication route files.
- Authentication controllers.
- Authentication services.
- User repository and database queries.
- Request validators.
- Authentication middleware.
- Authorization middleware.
- Server route mounting.
- Environment configuration.
- Relevant automated and manual tests.

Record verified endpoint paths and schemas only after checking these sources.

## 17. Conclusion

The authentication API is a security-sensitive part of the Digital Library application. Its specification must accurately describe registration, login, protected access, logout, and authorization behavior supported by the actual implementation.

The illustrative endpoint paths and response examples in this document are not proof of implementation. Update them after reviewing the source code and executing the relevant tests.

## 18. Related Documentation

- `README.md`
- `users.md`
- `../security/README.md`
- `../security/authentication.md`
- `../security/authorization.md`
- `../security/password-security.md`
- `../security/rate-limiting.md`
- `../security/environment.md`
- `../security/error-handling.md`
- `../10-academic/methodology.md`
- `../07-testing/test-cases.md`
