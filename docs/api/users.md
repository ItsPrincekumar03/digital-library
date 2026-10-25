# Users API

## 1. Overview

This document describes the API responsibilities for user-related operations in the Digital Library application.

The project uses HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL. The backend follows a monolithic architecture.

The Users API may support retrieving user information, updating permitted profile fields, and performing administrative user-management operations, depending on the approved requirements and actual implementation.

Authentication-specific operations, such as registration and login, are documented separately in `auth.md`.

**Implementation status:** Endpoint paths, request fields, response structures, role permissions, and database fields must be verified against the current backend before being treated as implemented behavior. Examples in this document are illustrative unless confirmed by source code and tests.

## 2. Objectives

The Users API is intended to:

- Retrieve permitted user information.
- Support profile management where implemented.
- Protect sensitive account information.
- Enforce authentication and authorization.
- Restrict administrative operations to authorized roles.
- Maintain consistent user records.
- Handle invalid requests and unavailable accounts safely.

Only implemented and tested operations should be described as available functionality.

## 3. Base URL

Illustrative local development base URL:

```text
http://localhost:PORT/api/v1
```

Replace `PORT` with the port configured in the backend.

The actual API prefix and user route paths must be verified from the Express application configuration.

## 4. User Roles

The project defines two intended application roles:

- `USER`
- `ADMIN`

The exact permissions associated with each role must be confirmed against the approved requirements and current authorization middleware.

Typical policy considerations include:

| Operation | Intended access policy |
|---|---|
| Retrieve one's own profile | Authenticated user |
| Update one's own permitted profile fields | Authenticated user |
| Retrieve another user's private profile | Denied unless explicitly authorized |
| List users for administration | Administrator, if supported |
| Update another user's account | Administrator or another explicitly authorized role |
| Change user roles | Restricted administrative operation |
| Delete or deactivate a user | Restricted administrative operation, if supported |

These policies are recommendations, not confirmation of current route behavior.

## 5. Conceptual User Data Model

A user record may contain fields such as:

| Field | Purpose |
|---|---|
| `id` | Unique user identifier |
| `username` | User's display or login name, if supported |
| `email` | Email address, if supported |
| `role` | Application role |
| `created_at` | Account creation timestamp, if supported |
| `updated_at` | Last modification timestamp, if supported |

The actual database schema may use different names or additional fields.

Password hashes, authentication tokens, recovery secrets, and other sensitive fields must not be included in ordinary user-profile responses.

The exact field names, types, constraints, and defaults must match the current MySQL schema.

## 6. Retrieve the Current User

### Purpose

Retrieve the authenticated user's profile when a current-user endpoint is implemented.

**Illustrative request**

```http
GET /api/v1/users/me
```

The actual endpoint may instead be implemented under the authentication routes.

### Expected behavior

The endpoint should:

1. Validate the authentication state.
2. Identify the user from trusted authentication context.
3. Retrieve the permitted profile information.
4. Exclude passwords, password hashes, and authentication secrets.
5. Return a consistent response.

### Illustrative response

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "reader01",
    "email": "reader@example.com",
    "role": "USER"
  }
}
```

The example does not establish the actual response schema or supported fields.

### Possible status codes

- `200 OK` — profile retrieved.
- `401 Unauthorized` — authentication is missing or invalid.
- `404 Not Found` — account is unavailable, where applicable.
- `500 Internal Server Error` — unexpected failure.

## 7. Retrieve a User by Identifier

### Purpose

Retrieve a user record by identifier when the API supports this operation.

**Illustrative request**

```http
GET /api/v1/users/:userId
```

### Expected behavior

- Validate the user identifier.
- Confirm that the account exists.
- Enforce the applicable authorization policy.
- Return only permitted fields.
- Avoid exposing another user's private information.

The endpoint should not allow a user to access another person's profile merely by changing the identifier in the URL.

### Possible status codes

- `200 OK` — permitted profile retrieved.
- `400 Bad Request` — invalid identifier, where applicable.
- `401 Unauthorized` — authentication required.
- `403 Forbidden` — access denied.
- `404 Not Found` — user unavailable or not found.
- `500 Internal Server Error` — unexpected failure.

The exact route and behavior must be verified against the current implementation.

## 8. List Users

### Purpose

Provide a user listing for authorized administrative operations, if implemented.

**Illustrative request**

```http
GET /api/v1/users
```

### Expected behavior

The endpoint should:

- Enforce the required administrative permission.
- Return only fields required for the operation.
- Apply pagination when appropriate.
- Validate supported filtering parameters.
- Avoid exposing password hashes or authentication secrets.
- Handle empty results consistently.

Ordinary users should not receive unrestricted access to other users' account information.

### Possible status codes

- `200 OK` — list retrieved.
- `401 Unauthorized` — authentication required.
- `403 Forbidden` — insufficient permissions.
- `500 Internal Server Error` — unexpected failure.

The endpoint must not be considered implemented until the route and authorization rules have been verified.

## 9. Update a User Profile

### Purpose

Update permitted profile fields when profile editing is supported.

**Illustrative request**

```http
PATCH /api/v1/users/me
Content-Type: application/json
```

Example request body:

```json
{
  "username": "updated-reader",
  "email": "reader@example.com"
}
```

The accepted fields must match the current request validator and database schema.

### Expected behavior

The backend should:

1. Authenticate the requester.
2. Determine the account from trusted authentication context.
3. Validate the supplied fields.
4. Reject fields the user is not allowed to modify.
5. Enforce applicable uniqueness constraints.
6. Persist the permitted changes.
7. Return a safe user representation.

A client must not be able to change its own role to `ADMIN` by submitting a role field in a profile-update request.

If a separate administrative profile-update operation exists, its permissions must be documented independently.

## 10. Administrative User Management

If the approved requirements include administrative user management, the API may support operations such as:

- Viewing permitted user information.
- Updating explicitly permitted account fields.
- Deactivating or restoring accounts.
- Managing roles through a restricted workflow.
- Removing accounts where supported.

Each operation requires an explicit authorization policy.

Role changes and account deactivation can have significant security consequences and should be tested carefully.

The API must not allow a user to grant themselves administrative privileges.

Administrative actions should be logged where appropriate, without recording passwords, authentication tokens, or unnecessary personal information.

## 11. Password Management

Password registration, verification, and other authentication-related operations belong to the authentication workflow documented in `auth.md`.

User-profile endpoints should not return password values or password hashes.

If password changes are supported, the backend should:

- Require the appropriate authentication.
- Validate the new password against the approved policy.
- Hash the password using an appropriate password-hashing algorithm.
- Avoid logging credentials.
- Define whether existing sessions or tokens need to be invalidated.
- Return a response that does not reveal sensitive information.

Password-reset and recovery endpoints should be documented separately if implemented.

## 12. Validation Requirements

User-related requests should validate:

- User identifier format.
- Required fields.
- Field types and lengths.
- Email format, if email is supported.
- Username constraints, if usernames are supported.
- Uniqueness requirements.
- Permitted profile-update fields.
- Role-change permissions.
- Account status transitions, if supported.
- Unexpected or disallowed fields.

Validation must be enforced by the backend even when the frontend performs its own validation.

The exact rules must match the current validators and approved requirements.

## 13. Error Response Format

Where consistent with the existing API conventions, an error response may follow this illustrative structure:

```json
{
  "success": false,
  "message": "The requested user could not be found."
}
```

The application's established response format takes precedence over this example.

Error handling should:

- Use appropriate HTTP status codes.
- Avoid exposing SQL statements or stack traces.
- Avoid revealing password hashes or authentication secrets.
- Limit unnecessary disclosure of account existence.
- Provide safe, understandable messages.
- Preserve useful diagnostic information in secure server-side logs.

## 14. Database and Security Requirements

User-related operations should follow these principles:

- Use parameterized SQL queries.
- Enforce authentication and authorization.
- Restrict access to private profile information.
- Protect password hashes and authentication secrets.
- Prevent unauthorized role changes.
- Apply suitable uniqueness constraints.
- Maintain database integrity.
- Validate all incoming fields.
- Avoid logging sensitive personal information unnecessarily.
- Handle database errors consistently.

These principles describe expected controls and do not prove that every control has already been implemented.

## 15. Privacy Requirements

The API should return only information needed for the requested operation.

The following information must not be included in ordinary profile responses:

- Plaintext passwords.
- Password hashes.
- Live authentication tokens.
- Session secrets.
- Password-reset secrets.
- Internal security configuration.

Administrative access should follow the documented permissions policy. Sensitive information should not become available merely because a requester has authenticated.

## 16. Testing Requirements

Test the user operations that actually exist in the backend.

Recommended test scenarios include:

1. Retrieve the current user's profile.
2. Attempt profile retrieval without authentication.
3. Retrieve an existing user where permitted.
4. Request a nonexistent user.
5. Attempt to access another user's private profile.
6. Update permitted profile fields.
7. Reject invalid profile data.
8. Reject duplicate identifiers where uniqueness applies.
9. Attempt to modify restricted fields.
10. Attempt unauthorized role changes.
11. Verify administrative listing permissions, if supported.
12. Verify account deactivation or deletion behavior, if supported.
13. Confirm that sensitive fields are not returned.
14. Confirm database errors are handled safely.

Record the request, expected result, actual result, test environment, and evidence for each executed test.

Do not mark unexecuted tests as passed.

## 17. Manual Testing with PowerShell

After confirming the actual endpoint and port, an implemented current-user endpoint can be tested using PowerShell.

Illustrative template:

```powershell
$baseUrl = "http://localhost:PORT/api/v1"

Invoke-RestMethod `
    -Method Get `
    -Uri "$baseUrl/users/me"
```

Replace `PORT` and `/users/me` with the values verified in the current backend.

For protected endpoints, supply authentication using the mechanism actually supported by the application. Do not place real passwords or tokens in shared documentation or screenshots.

## 18. Implementation Verification Checklist

Before treating this document as the final API contract, verify:

- [ ] User routes and HTTP methods exist.
- [ ] Route prefixes match the Express configuration.
- [ ] Request fields match the validators.
- [ ] Response structures match the implementation.
- [ ] User fields match the MySQL schema.
- [ ] Authentication requirements are accurate.
- [ ] Profile ownership checks are enforced.
- [ ] Administrative operations have appropriate authorization.
- [ ] Restricted fields cannot be modified by unauthorized users.
- [ ] Password hashes and authentication secrets are not returned.
- [ ] Error status codes and response formats are confirmed.
- [ ] Relevant API tests have been executed.

Mark unsupported operations as planned or remove them from the implemented endpoint reference.

## 19. Conclusion

The Users API defines the intended responsibilities for retrieving and managing user information within the Digital Library application.

The final API contract must match the actual Express routes, authentication middleware, authorization rules, controllers, services, validators, MySQL schema, and test evidence.

Illustrative endpoint paths and response examples in this document must not be interpreted as proof that the corresponding functionality is already implemented.

## 20. Related Documentation

- `README.md`
- `auth.md`
- `books.md`
- `private-library.md`
- `../security/README.md`
- `../security/authentication.md`
- `../security/authorization.md`
- `../security/password-security.md`
- `../security/validation.md`
- `../security/environment.md`
- `../03-technical/database-design.md`
- `../03-technical/api-specification.md`
- `../07-testing/test-cases.md`

## 21. Maintenance

Update this document whenever user routes, profile fields, role permissions, request or response schemas, account-management operations, or security requirements change.

Record implementation status only when supported by current source code and test evidence.
