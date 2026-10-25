# Authentication Security

## 1. Purpose

This document describes authentication security requirements for the Digital Library application.

The application uses a monolithic architecture built with HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL.

Authentication establishes the identity of a requester before the application permits access to protected resources. Authorization is a separate process that determines what an authenticated user is allowed to do.

**Implementation status:** This document defines security requirements and verification criteria. The actual authentication mechanism, endpoint paths, token lifecycle, middleware behavior, and cookie settings must be confirmed against the current source code and configuration.

## 2. Scope

Authentication security covers:

- User registration, where supported.
- User login and credential verification.
- Authentication state management.
- Access to protected API endpoints.
- Logout and session or token invalidation.
- Authentication failure handling.
- Password-reset workflows, if implemented.
- Protection of credentials and authentication secrets.
- Authentication-related logging and testing.

## 3. Authentication Principles

The implementation should follow these principles:

1. Identify users through a trusted authentication process.
2. Verify credentials on the backend.
3. Store password hashes rather than plaintext passwords.
4. Require authentication for protected resources.
5. Reject missing, expired, invalid, or revoked credentials.
6. Avoid trusting user identifiers supplied by the client without verifying the authenticated identity and permissions.
7. Return only the information necessary for the requested operation.
8. Avoid exposing credentials, tokens, hashes, or internal security details in responses and logs.
9. Use HTTPS in production.
10. Apply consistent authentication middleware across protected routes.

## 4. Authentication Flow

The following is the intended conceptual workflow. The actual implementation may differ and must be verified.

```text
Client
  |
  | Submit credentials
  v
Authentication Route
  |
  v
Request Validation
  |
  v
Authentication Controller
  |
  v
Authentication Service
  |
  | Retrieve account and verify password
  v
User Repository -----> MySQL
  |
  | Credentials valid
  v
Create Authentication State
  |
  v
Return Safe Response
  |
  v
Client Requests Protected Resource
  |
  v
Authentication Middleware
  |
  v
Authorized Request Continues
```

The intended backend layering is Route → Middleware → Controller → Service → Repository → MySQL, where applicable.

The authentication flow must not bypass the established application architecture without a documented reason.

## 5. Password Handling

Passwords must never be stored in plaintext.

The backend should use a suitable password-hashing algorithm, such as bcrypt if that is the algorithm used by the current project.

Requirements:

- Hash passwords before storing them.
- Verify submitted passwords using the selected hashing library.
- Never return password hashes through ordinary API responses.
- Never log passwords.
- Never include credentials in URLs.
- Validate password inputs on the server.
- Handle incorrect credentials without exposing unnecessary account details.
- Avoid implementing custom password-hashing algorithms.

The configured hashing algorithm, cost factor, and library version must be checked against the current dependencies and implementation.

See `password-security.md` for additional password-specific requirements.

## 6. Authentication Mechanism

The project may use a token-based mechanism, a session-based mechanism, or another explicitly approved approach.

The actual mechanism must be identified from the current code before this document is treated as a description of implemented behavior.

### If using bearer tokens

- Verify token integrity and required claims.
- Validate expiration.
- Reject malformed or invalid tokens.
- Protect signing secrets.
- Define token expiry and revocation behavior.
- Avoid exposing tokens in URLs or logs.
- Use secure transport in production.

### If using cookies

Where authentication is cookie-based, configure appropriate attributes:

- `HttpOnly` to prevent JavaScript from reading the cookie.
- `Secure` in HTTPS production environments.
- An appropriate `SameSite` policy.
- A suitable expiration or lifetime.
- Appropriate cookie scope.

Cookie-based authentication must also address cross-site request forgery (CSRF) according to the application's deployment and cookie policy.

Do not assume that the project uses both bearer tokens and cookies unless the implementation confirms it.

## 7. Login Requirements

A login endpoint should:

1. Validate the request body.
2. Reject missing or invalid fields.
3. Retrieve the account through the repository layer.
4. Verify the submitted password against the stored hash.
5. Apply applicable account-status checks.
6. Create the configured authentication state after successful verification.
7. Return a safe response.
8. Avoid exposing internal database or authentication errors.

Repeated failed login attempts should be subject to appropriate abuse controls, such as rate limiting.

The response should not disclose whether an account exists when doing so would create an unnecessary account-enumeration risk.

## 8. Registration Requirements

If registration is implemented, the backend should:

- Validate all required fields.
- Enforce username or email uniqueness where applicable.
- Hash passwords before database insertion.
- Assign a safe default role.
- Prevent clients from assigning themselves the `ADMIN` role.
- Handle duplicate account information consistently.
- Return only permitted user fields.
- Avoid returning password hashes or authentication secrets.

Registration must not bypass the application's established validation, service, or repository responsibilities.

## 9. Protected API Endpoints

Protected endpoints must use the application's established authentication middleware.

The middleware should:

1. Read credentials from the configured location.
2. Validate the credentials.
3. Identify the authenticated user.
4. Reject invalid or missing credentials.
5. Populate a trusted authentication context.
6. Allow the request to continue only after successful authentication.

Controllers and services should use this trusted identity when enforcing ownership rules.

A user-supplied ID in a request body or URL must not automatically be treated as the identity of the authenticated requester.

## 10. Logout and Token Invalidation

Logout behavior depends on the authentication mechanism.

### Cookie or session-based authentication

Where applicable:

- Invalidate the server-side session.
- Clear the authentication cookie using matching cookie attributes.
- Ensure that the invalidated session cannot be reused.

### Token-based authentication

Where applicable:

- Remove the client's stored authentication state.
- Revoke or invalidate the token when the implementation supports server-side revocation.
- Ensure that the documented token lifetime and logout guarantees are accurate.

If a token blacklist is stored only in memory, entries may be lost when the server restarts. This behavior must be considered when documenting logout guarantees.

Client-side token removal alone does not invalidate a token that remains valid on the server.

The actual logout implementation and its limitations must be verified.

## 11. Authentication Errors

The API should use appropriate HTTP status codes and a consistent response structure.

Common cases include:

| Situation | Expected status |
|---|---|
| Missing authentication for a protected endpoint | `401 Unauthorized` |
| Invalid or expired credentials | `401 Unauthorized` |
| Authenticated user lacks required permission | `403 Forbidden` |
| Malformed request | `400 Bad Request`, where applicable |
| Unexpected server failure | `500 Internal Server Error` |

The exact status codes must match the application's established API conventions.

Error responses must not expose:

- Passwords or password hashes.
- Signing secrets.
- Session identifiers or tokens.
- SQL queries.
- Stack traces.
- Internal environment configuration.

## 12. Brute-Force and Abuse Protection

Authentication endpoints should have appropriate rate limits and abuse controls.

Recommended measures include:

- Rate limiting repeated login attempts.
- Limiting request-body sizes.
- Validating credentials before expensive downstream processing where appropriate.
- Monitoring unusual authentication failures.
- Returning safe error messages.
- Avoiding detailed account-existence disclosures.

Any account-lockout policy should be designed carefully to prevent attackers from using it to deny service to legitimate users.

See `rate-limiting.md` for additional requirements.

## 13. Environment Secrets

Authentication secrets must be supplied through the application's configuration mechanism rather than hardcoded into source files.

Examples include:

- Token-signing secrets.
- Database credentials.
- Session secrets.
- Other private authentication configuration.

Requirements:

- Keep local environment files out of version control.
- Provide safe placeholder values in example configuration files.
- Use strong, appropriately generated secrets.
- Restrict production secret access.
- Rotate exposed or compromised secrets.
- Avoid printing secrets in logs or terminal output.
- Never commit real credentials to the repository.

The actual environment-variable names must be verified against the current backend configuration.

See `environment.md` for related requirements.

## 14. Authentication and CORS

CORS controls which browser origins may access cross-origin resources; it is not an authentication mechanism.

The application must separately enforce authentication and authorization on protected endpoints.

If cookies are used for cross-origin requests:

- Configure an explicit trusted-origin policy.
- Enable credentialed requests only where required.
- Do not combine credentialed requests with a wildcard allowed origin.
- Apply appropriate CSRF protection.
- Use secure cookies in production.

The actual CORS policy must match the application's deployment architecture.

See `cors.md` for additional details.

## 15. Logging and Monitoring

Authentication logs should support security investigation without exposing secrets.

Appropriate events may include:

- Successful login.
- Failed login.
- Logout.
- Invalid or expired authentication attempts.
- Account-status changes.
- Administrative authentication-related actions.

Logging requirements:

- Never log passwords or password hashes.
- Never log full authentication tokens or session secrets.
- Avoid unnecessary personal information.
- Use timestamps and relevant request context where appropriate.
- Restrict access to sensitive logs.
- Avoid returning internal diagnostic information to clients.

The actual logging implementation must be verified before it is described as available.

## 16. Testing Requirements

Authentication tests should cover:

### Login and registration

- Valid login credentials.
- Incorrect password.
- Unknown account.
- Missing required fields.
- Invalid input formats.
- Duplicate account information, where applicable.
- Attempted self-assignment of the administrator role.

### Protected routes

- Request without credentials.
- Request with invalid credentials.
- Request with expired credentials, if supported.
- Request with revoked credentials, if supported.
- Request with valid credentials.
- Access attempts using another user's identifier.

### Logout

- Successful logout.
- Reuse of invalidated session credentials.
- Cookie-clearing behavior, if applicable.
- Token-revocation behavior, if applicable.
- Server restart behavior where an in-memory revocation mechanism is used.

### Security

- Password hashes are not returned.
- Credentials are not written to logs.
- Rate limits are applied as configured.
- Authentication errors do not expose internal details.
- CORS behavior matches the approved configuration.

Record actual results and evidence. Do not mark tests as passed until they have been executed.

## 17. Manual Testing with PowerShell

Use the real endpoint paths and authentication mechanism from the current backend.

Illustrative request template:

```powershell
$baseUrl = "http://localhost:PORT/api/v1"

# Replace PORT and the route with verified values.
Invoke-RestMethod `
    -Method Get `
    -Uri "$baseUrl/REPLACE_WITH_PROTECTED_ROUTE"
```

For protected requests, provide credentials using the application's actual authentication mechanism.

Do not place production secrets in shared scripts, screenshots, or documentation.

## 18. Implementation Verification Checklist

- [ ] Registration route verified, if implemented.
- [ ] Login route verified.
- [ ] Password hashing and verification verified.
- [ ] Authentication middleware verified.
- [ ] Protected routes identified.
- [ ] Authentication mechanism documented accurately.
- [ ] Token or session expiration behavior verified.
- [ ] Logout and revocation behavior verified.
- [ ] Cookie security settings verified, if applicable.
- [ ] Login rate limiting verified.
- [ ] Environment secrets protected.
- [ ] CORS and CSRF requirements reviewed.
- [ ] Sensitive fields excluded from responses.
- [ ] Authentication errors handled consistently.
- [ ] Relevant tests executed and recorded.

## 19. Related Documentation

- `authorization.md`
- `password-security.md`
- `rate-limiting.md`
- `environment.md`
- `cors.md`
- `error-handling.md`
- `validation.md`
- `../api/auth.md`
- `../api/users.md`
- `../03-technical/api-specification.md`
- `../03-technical/database-design.md`
- `../07-testing/security-testing.md`
- `../07-testing/test-cases.md`

## 20. Maintenance

Review this document whenever authentication routes, password-handling logic, token or session behavior, security middleware, environment configuration, or authentication tests change.

Keep intended security requirements separate from verified implementation details.
