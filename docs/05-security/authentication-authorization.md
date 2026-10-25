# Digital Library — Authentication and Authorization Specification

**Document Version:** 1.0  
**Project:** Digital Library  
**Release Scope:** V1 and subsequent approved versions  
**Backend:** Node.js, Express.js  
**Database:** MySQL  
**Architecture:** Monolithic Web Application  
**Status:** Security Specification — Implementation Must Be Verified

---

## 1. Purpose

This document defines the authentication and authorization requirements for Digital Library.

Authentication determines whether a requester is a recognized user. Authorization determines whether that user is permitted to perform a particular operation or access a particular resource.

The application must enforce these controls on the backend. Frontend navigation and hidden interface controls are not substitutes for server-side security.

This document describes required behavior and security expectations. The actual authentication mechanism, route protections, token lifecycle, and database implementation must be verified against the current repository.

---

## 2. Security Objectives

The authentication and authorization system must:

1. Identify authenticated users reliably.
2. Protect credentials and authentication secrets.
3. Prevent unauthorized access to protected API operations.
4. Enforce role-based permissions.
5. Protect user-owned private documents.
6. Prevent users from changing another user's protected data without permission.
7. Handle expired, invalid, and revoked credentials appropriately.
8. Provide safe authentication errors.
9. Protect authentication endpoints against abuse.
10. Support predictable login and logout behavior.
11. Avoid exposing sensitive information in logs or API responses.
12. Maintain consistent access-control behavior across the application.

---

## 3. Roles and Access Model

The documented application roles are:

- `USER`
- `ADMIN`

### 3.1 USER

A user may perform operations explicitly permitted by the application's access policy.

Potential permissions include:

- Accessing public books.
- Reading content available to the user.
- Accessing the user's own private documents.
- Managing permitted account information.
- Performing other explicitly authorized user operations.

These permissions must match the implemented API and product requirements.

### 3.2 ADMIN

An administrator may perform authorized management operations, potentially including:

- Book management.
- Category management.
- Chapter management.
- Author management, where implemented.
- Publication and visibility management, where implemented.

Administrative privileges must not automatically grant access to private user documents unless that permission is explicitly part of the approved policy.

### 3.3 Least Privilege

Every account must receive only the permissions needed for its intended role.

Public registration must not allow a user to assign themselves the administrator role.

Role changes must be performed through a protected and explicitly authorized process.

---

## 4. Authentication Requirements

### 4.1 Credential Submission

The login endpoint must accept only the credential fields defined by the actual API contract.

The backend must validate the request before attempting authentication.

Authentication requests should use HTTPS in production.

### 4.2 Password Verification

Passwords must never be stored in plaintext.

The backend must verify submitted passwords using the password-hashing mechanism used by the application.

The implementation must not log submitted passwords or return password hashes to clients.

The exact hashing algorithm and configuration must be confirmed from the current authentication code and dependency configuration.

### 4.3 Authentication Result

After successful authentication, the backend must establish authenticated state using the implemented mechanism.

Possible mechanisms include a session, a signed token, or a token carried in a cookie. The project must document the actual mechanism rather than assuming one.

### 4.4 Invalid Credentials

Invalid credentials must produce a safe failure response.

Error messages should not reveal passwords, password hashes, authentication secrets, or unnecessary internal account information.

### 4.5 Registration

If public registration is enabled:

- Required fields must be validated.
- Duplicate or conflicting account data must be handled.
- Password requirements must be enforced server-side.
- Users must not choose privileged roles through ordinary registration.
- Sensitive fields must not be returned in the response.

### 4.6 Account State

If the application supports disabled, suspended, or otherwise restricted accounts, authentication and authorization must enforce those states consistently.

Do not introduce account-state behavior that is not supported by the actual data model and implementation.

---

## 5. Authentication State

### 5.1 Trust Boundary

The backend must determine authenticated identity from a valid credential using the implemented authentication mechanism.

The backend must not trust a user identifier or role supplied solely through an ordinary request body, query parameter, or client-controlled header.

### 5.2 Credential Validation

Protected requests must reject credentials that are invalid, malformed, expired, or otherwise unacceptable under the implemented authentication policy.

If token revocation is supported, revoked credentials must not remain usable beyond the intended revocation behavior.

### 5.3 Expiration

Credential expiration must follow the configured authentication policy.

The implementation should provide predictable behavior when authentication expires during an active session.

### 5.4 Client-Side State

The frontend may maintain non-sensitive information about the current interface state.

Client-side state must not be treated as authoritative proof of identity or permission.

Sensitive authentication data must not be placed in unsafe browser storage.

---

## 6. Token and Cookie Considerations

This section defines security requirements for the relevant mechanism if used by the implementation.

### 6.1 Signed Tokens

If signed tokens are used:

- Validate the signature.
- Validate required claims.
- Validate expiration where applicable.
- Restrict accepted algorithms appropriately.
- Reject malformed or invalid tokens.
- Avoid placing sensitive personal information in token payloads unnecessarily.

A signed token is not automatically encrypted.

### 6.2 Cookies

If authentication uses cookies:

- Set `HttpOnly` for cookies that do not need JavaScript access.
- Use `Secure` over HTTPS in production.
- Configure `SameSite` appropriately.
- Use a suitable cookie path and lifetime.
- Review CSRF protections based on the application's request and cookie design.

The exact cookie options must be confirmed from the implementation.

### 6.3 Authorization Header

If the API accepts bearer tokens, it must parse the expected authorization format and reject invalid credentials consistently.

The frontend must not expose credentials in URLs.

### 6.4 Token Storage

The project must document where credentials are stored, how they are transmitted, and how they are invalidated.

Do not assume that a token is protected merely because it is signed.

---

## 7. Logout and Revocation

### 7.1 Logout Requirements

Logout must follow the implemented authentication design.

Depending on the mechanism, this may require:

- Clearing an authentication cookie.
- Destroying a server-side session.
- Invalidating a token through a supported revocation mechanism.
- Clearing relevant client-side state.

The application must not report successful logout before the required operation has completed.

### 7.2 Stateless Tokens

If access tokens are otherwise stateless, deleting the token from the browser does not automatically invalidate a copied token.

The project must document the actual token lifetime and revocation strategy.

### 7.3 In-Memory Revocation

If a token blacklist or revocation list is stored only in process memory, its contents may be lost when the server restarts.

This behavior must be considered when evaluating logout guarantees and deployment reliability.

Do not claim persistent token revocation unless the implementation provides it.

---

## 8. Authorization Requirements

### 8.1 Server-Side Enforcement

Every protected endpoint must enforce the required authentication and authorization checks.

The backend must not rely exclusively on:

- Hidden buttons.
- Frontend route guards.
- Client-side role values.
- Disabled interface controls.
- Unpredictable resource identifiers.

### 8.2 Role-Based Authorization

Role-restricted operations must verify the authenticated user's actual authorized role.

A `USER` must not be able to invoke administrative operations by modifying request data or calling the API directly.

### 8.3 Resource-Level Authorization

Access checks must consider the specific resource when ownership or visibility matters.

A valid authenticated user must not automatically gain access to every resource in the database.

### 8.4 Ownership Checks

For private documents and other user-owned resources, the backend must verify ownership or an explicitly granted permission.

The ownership check must apply to operations such as:

- Listing private resources.
- Viewing or downloading private files.
- Updating private records.
- Deleting private records.

### 8.5 Book and Chapter Visibility

Book and chapter access must follow the application's actual publication and visibility rules.

Unpublished, archived, private, or otherwise restricted content must not be exposed merely because its identifier is known.

The exact rules must remain consistent across book details, chapter access, search results, and reading operations.

---

## 9. Authorization Decision Model

A protected operation should follow this logical sequence:

```text
Incoming Request
       |
       v
Validate Request
       |
       v
Authenticate Request
       |
       +--> Invalid or Missing Identity
       |          |
       |          v
       |       Reject Request
       |
       v
Identify Required Permission
       |
       v
Check Role and Resource Access
       |
       +--> Permission Denied
       |          |
       |          v
       |       Reject Request
       |
       v
Execute Authorized Operation
       |
       v
Return Appropriate Response
```

This is the intended decision model. Actual middleware and controller execution order must be verified in the backend.

---

## 10. HTTP Response Expectations

The API should use HTTP status codes consistently with the documented API contract.

| Situation | Typical Status |
|---|---:|
| Missing or invalid authentication | `401 Unauthorized` |
| Authenticated but lacking permission | `403 Forbidden` |
| Resource not found or intentionally concealed | `404 Not Found` |
| Invalid request data | `400 Bad Request` or `422 Unprocessable Content` |
| Request exceeds configured rate limits | `429 Too Many Requests` |
| Unexpected server failure | `500 Internal Server Error` |

The exact status code must follow the actual API design. The table describes expected conventions, not verified responses from every endpoint.

---

## 11. Authentication Endpoint Protection

Authentication endpoints should be protected against automated abuse.

Recommended controls include:

- Rate limiting.
- Input validation.
- Safe error messages.
- Request-size limits.
- HTTPS in production.
- Appropriate logging without credential exposure.
- Secure password handling.
- Monitoring of repeated failures where supported.

The actual rate limits and account-lockout behavior, if any, must be documented from the implementation.

---

## 12. Password and Account Security

The authentication system must:

- Use secure password hashing.
- Never store plaintext passwords.
- Avoid logging passwords or password hashes.
- Validate passwords on the backend.
- Avoid returning credential fields in API responses.
- Protect password-change operations with appropriate authentication.
- Require reauthentication where justified by the risk and implemented policy.
- Handle duplicate registration and authentication failures safely.

Password recovery must not be represented as available unless the complete workflow is implemented.

---

## 13. CORS and CSRF

### 13.1 CORS

Cross-Origin Resource Sharing must be configured according to the actual frontend and backend origins.

Production configuration should not allow arbitrary origins to access credentialed endpoints.

CORS is not a substitute for authentication or authorization.

### 13.2 CSRF

If browser cookies authenticate state-changing requests, assess cross-site request forgery risks and apply suitable protections.

The appropriate controls depend on the actual cookie policy, frontend origin, and request architecture.

Do not assume that enabling CORS alone prevents CSRF.

---

## 14. Authentication Error Handling

The application must:

- Return safe, consistent error responses.
- Avoid disclosing stack traces.
- Avoid exposing token contents unnecessarily.
- Avoid revealing secret configuration.
- Avoid treating database failures as invalid credentials without a justified reason.
- Log relevant operational details without sensitive values.
- Preserve a clear distinction between authentication failure and unexpected server failure where practical.

Internal diagnostic information must remain separate from public responses.

---

## 15. Database Requirements

The database design must protect account and ownership integrity.

Requirements include:

- Unique account identifiers where required.
- Appropriate primary and foreign keys.
- Safe parameterized database operations.
- Consistent user-to-resource relationships.
- Controlled changes to privileged role assignments.
- Appropriate transaction handling for multi-step operations.

The actual table names, column names, and constraints must be documented from the schema files and repository.

---

## 16. Frontend Requirements

The frontend should:

- Display authentication forms with clear labels.
- Show safe validation and failure messages.
- Handle expired authentication state.
- Avoid storing secrets unnecessarily.
- Hide controls that are unavailable to the current user where appropriate.
- Avoid assuming a hidden control provides security.
- Provide a clear path back to public pages after logout or access denial.

All security-sensitive decisions must be enforced by the backend.

---

## 17. Testing Requirements

Authentication and authorization testing must cover the following cases where applicable.

### 17.1 Authentication

- [ ] Valid credentials are accepted.
- [ ] Invalid credentials are rejected.
- [ ] Missing required fields are rejected.
- [ ] Malformed credentials are rejected.
- [ ] Expired credentials are rejected.
- [ ] Logout follows the implemented revocation behavior.
- [ ] Authentication errors do not expose secrets.

### 17.2 Role Authorization

- [ ] A user cannot execute admin-only operations.
- [ ] An administrator can execute only authorized management operations.
- [ ] Client-supplied role values cannot elevate privileges.
- [ ] Direct API requests enforce the same permissions as the UI.

### 17.3 Resource Authorization

- [ ] A user can access permitted resources.
- [ ] A user cannot access another user's private documents without permission.
- [ ] Private file access validates ownership.
- [ ] Restricted book and chapter visibility is enforced.
- [ ] Unauthorized update and deletion requests are rejected.

### 17.4 Security Configuration

- [ ] Cookie settings match the chosen authentication design.
- [ ] CORS matches the approved origin policy.
- [ ] CSRF risk is assessed for cookie-authenticated operations.
- [ ] Authentication rate limiting is tested where configured.
- [ ] Logs do not expose passwords or authentication secrets.

Only mark tests as passed when they have actually been executed and the results recorded.

---

## 18. Implementation Review Checklist

Before considering authentication and authorization complete:

- [ ] Inspect the login and registration implementation.
- [ ] Confirm the password-hashing mechanism.
- [ ] Confirm how authenticated identity is established.
- [ ] Confirm token or session validation.
- [ ] Confirm expiration and logout behavior.
- [ ] Inspect protected route middleware.
- [ ] Confirm `USER` and `ADMIN` permissions.
- [ ] Review resource ownership checks.
- [ ] Review private document access.
- [ ] Review book and chapter visibility enforcement.
- [ ] Review CORS and CSRF considerations.
- [ ] Review authentication rate limiting.
- [ ] Confirm safe error responses.
- [ ] Execute relevant authorization tests.
- [ ] Record remaining limitations.

---

## 19. Known Design Considerations

The following items require confirmation against the current implementation:

- Whether authentication uses bearer tokens, cookies, sessions, or a combination.
- Whether cookies are configured with `HttpOnly`, `Secure`, and appropriate `SameSite` values.
- Whether logout invalidates tokens server-side.
- Whether revocation data persists across server restarts.
- Whether refresh tokens are implemented.
- Whether password recovery is implemented.
- Whether administrative role changes have a dedicated workflow.
- Whether private-document ownership checks cover every file operation.
- Whether authentication endpoints have configured rate limits.

These items must not be reported as implemented until verified.

---

## 20. Related Documents

- `docs/02-requirements/SRS.md`
- `docs/02-requirements/functional-requirements.md`
- `docs/02-requirements/non-functional-requirements.md`
- `docs/02-requirements/acceptance-criteria.md`
- `docs/03-technical/architecture.md`
- `docs/03-technical/api-specification.md`
- `docs/03-technical/database-design.md`
- `docs/03-technical/TRD.md`
- `docs/05-security/security-design.md`
- `docs/05-security/security-checklist.md`
- `docs/05-security/threat-model.md`
- `docs/security/authentication.md`
- `docs/security/authorization.md`
- `docs/07-testing/security-testing.md`

---

## 21. Maintenance

Review this document whenever:

- Authentication mechanisms change.
- Roles or permissions change.
- Private-resource rules change.
- Token expiration or revocation behavior changes.
- Cookie configuration changes.
- API routes become protected or public.
- Security testing identifies a weakness.
- New account-management features are introduced.

The implementation, API specification, security documentation, and tests must remain consistent.
