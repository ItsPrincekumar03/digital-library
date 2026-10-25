# Authorization Security

## 1. Purpose

This document defines authorization requirements for the Digital Library application.

Authentication verifies who a user is. Authorization determines which resources and operations that authenticated user is permitted to access.

The application uses the intended roles `USER` and `ADMIN`. Actual permissions must be verified against the current backend implementation and approved requirements.

**Implementation status:** This document defines expected policies and verification criteria. It does not claim that every listed permission check has already been implemented.

## 2. Scope

Authorization applies to:

- User profiles and account management.
- Book creation, editing, publication, and deletion.
- Author and category management.
- Chapter creation and management.
- Private library resources.
- Administrative operations.
- Resource ownership and access restrictions.
- Protected API routes.
- Access-denial responses and authorization testing.

## 3. Core Principles

The application should follow these principles:

1. Deny access by default.
2. Authenticate users before evaluating protected permissions.
3. Enforce permissions on the backend.
4. Validate resource ownership where applicable.
5. Apply least privilege.
6. Never trust role or ownership information supplied by the client.
7. Check permissions for every protected request.
8. Avoid exposing private resources through predictable identifiers.
9. Keep administrative privileges restricted.
10. Use consistent authorization middleware and service-level checks where appropriate.

Frontend controls may hide unavailable actions, but they must never replace backend authorization.

## 4. Application Roles

### USER

The `USER` role represents a standard authenticated application user.

Depending on the approved requirements, a user may be permitted to:

- View publicly available books.
- Search available books and categories.
- Read published content.
- Manage permitted personal profile fields.
- Access their own private-library resources.
- Perform other explicitly approved user operations.

A user must not automatically receive permission to manage all application content or other users' private resources.

### ADMIN

The `ADMIN` role represents an administrator.

Depending on the implemented requirements, an administrator may be permitted to:

- Manage books and categories.
- Manage authors and chapters.
- Perform approved publication or archival operations.
- Review user records through authorized administrative endpoints.
- Perform other explicitly approved administrative actions.

Administrative permissions should be limited to the operations required by the application.

These role descriptions express intended policy, not verified behavior of every current endpoint.

## 5. Permission Matrix

The following is a proposed baseline. Confirm each operation against the project's approved requirements before treating the matrix as final.

| Resource or action | USER | ADMIN |
|---|---|---|
| Read publicly available books | Allow | Allow |
| Search public catalogue | Allow | Allow |
| Read published chapters | Allow | Allow |
| Manage all books | Deny unless explicitly granted | Allow if implemented |
| Manage authors | Deny unless explicitly granted | Allow if implemented |
| Manage categories | Deny unless explicitly granted | Allow if implemented |
| Manage chapters | Deny unless explicitly granted | Allow if implemented |
| Access own private-library resources | Allow when authorized | Only according to explicit policy |
| Access another user's private resources | Deny by default | Only if explicitly authorized |
| Change own role | Deny | Restricted administrative workflow |
| Manage other user accounts | Deny unless explicitly granted | Allow only for implemented operations |
| View administrative reports | Deny unless explicitly granted | Allow if implemented |

A user's role must not be inferred from the frontend interface or from a request-body field.

## 6. Authorization Flow

The intended request flow is:

```text
Incoming Request
       |
       v
Route Matching
       |
       v
Authentication Middleware
       |
       v
Identify Trusted User
       |
       v
Role / Permission Check
       |
       v
Resource Ownership Check
       |
       v
Controller and Service
       |
       v
Repository and MySQL
       |
       v
Response
```

Not every endpoint requires every step. Public endpoints may not require authentication, while private resources may require both authentication and ownership checks.

The actual middleware order must be verified in the Express route configuration.

## 7. Role-Based Access Control

Role-based access control (RBAC) assigns permissions based on a user's role.

For the Digital Library, RBAC can be used to distinguish ordinary users from administrators.

Recommended requirements:

- Store roles using the application's approved schema.
- Assign safe default roles during registration.
- Prevent users from assigning their own privileged roles.
- Validate role changes on the backend.
- Protect administrative routes with explicit permission checks.
- Avoid treating a role name sent by the client as authoritative.
- Ensure role changes take effect according to the application's token or session design.

If roles are stored in authentication tokens, consider how role changes and revocation affect existing credentials.

## 8. Resource Ownership

Some resources are private or belong to a specific user.

For ownership-protected operations, the backend should compare the authenticated identity with the resource owner's identity before granting access.

Examples include:

- Reading a user's private-library document.
- Modifying a user-owned record.
- Deleting a user-owned private resource.
- Accessing personal settings.
- Managing account information.

The backend must not trust a `userId` supplied by the requester without independently checking authorization.

If administrators need cross-user access, define that permission explicitly rather than relying on accidental access.

## 9. Book and Chapter Permissions

Book and chapter operations may have different access requirements depending on publication status and visibility.

Recommended distinctions include:

- Publicly available published content.
- Unpublished content restricted to authorized users.
- Archived content subject to the approved visibility policy.
- Content available only to its owner or an authorized administrator, if ownership is part of the design.
- Administrative create, update, publish, archive, and delete operations.

The exact meaning of publication, archival, and visibility must follow the current application rules.

A hidden button or unpublished frontend link does not secure an API endpoint. The backend must enforce the relevant rule.

## 10. Private Library Permissions

Private-library resources require special attention because they may contain user-specific documents or files.

The backend should:

1. Authenticate the requester.
2. Identify the requested resource.
3. Verify ownership or another explicitly authorized access rule.
4. Confirm that the resource is available.
5. Return or modify the resource only when permitted.

Access checks must apply to file retrieval as well as metadata endpoints.

Knowing a file identifier or guessing a URL must not be sufficient to access another user's private content.

If private-library features are not fully implemented, document them as planned rather than available.

## 11. Authorization Middleware

Authorization middleware should centralize common permission checks where practical.

Examples of conceptual responsibilities include:

- Requiring an authenticated user.
- Requiring an administrator role.
- Checking ownership of a resource.
- Checking a resource's publication or visibility state.
- Rejecting unsupported role or permission values.

Middleware should use the trusted authentication context established by the authentication layer.

Resource-specific checks may require service or repository data. Avoid implementing checks that depend only on client-provided resource ownership information.

The exact middleware names and function signatures must match the current codebase.

## 12. Authorization Failure Responses

Use appropriate HTTP status codes consistently.

| Situation | Expected response |
|---|---|
| Missing or invalid authentication | `401 Unauthorized` |
| Authenticated user lacks permission | `403 Forbidden` |
| Resource does not exist | `404 Not Found`, where appropriate |
| Resource is intentionally concealed from unauthorized users | `404 Not Found`, if that is the approved policy |
| Invalid request data | `400 Bad Request`, where applicable |
| Unexpected server error | `500 Internal Server Error` |

Do not expose internal permission rules, database details, or stack traces unnecessarily.

The actual response format must follow the application's established API conventions.

## 13. Preventing Privilege Escalation

Privilege escalation occurs when a user gains permissions they should not have.

Preventive controls should include:

- Never trust a client-submitted role.
- Validate all privileged operations on the backend.
- Restrict role-changing operations.
- Prevent mass assignment of sensitive fields.
- Check authorization before modifying resources.
- Verify resource ownership.
- Protect administrative routes.
- Test role changes and access revocation.
- Avoid relying solely on frontend restrictions.

User profile updates should accept only explicitly permitted fields.

## 14. Database Considerations

Authorization decisions may depend on user, role, ownership, publication, and visibility records.

Database requirements include:

- Maintain referential integrity for relevant relationships.
- Use parameterized SQL queries.
- Validate resource identifiers.
- Ensure ownership data cannot be changed through unauthorized operations.
- Handle missing or inconsistent relationships safely.
- Use transactions where multiple related changes must remain consistent.

The actual table names, foreign keys, and ownership columns must be verified against the current MySQL schema.

## 15. Logging and Auditing

Where appropriate, record security-relevant events such as:

- Denied administrative operations.
- Unauthorized resource-access attempts.
- Role changes.
- Account deactivation.
- Other sensitive administrative changes.

Logs should include useful event context without storing passwords, authentication tokens, or unnecessary private data.

Do not let logging failures accidentally grant access to a protected resource.

Audit logging requirements should be proportional to the application's scope and operational needs.

## 16. Testing Requirements

Test the authorization behavior of implemented endpoints.

Recommended scenarios:

1. An unauthenticated user requests a protected resource.
2. A `USER` attempts an administrative operation.
3. An `ADMIN` performs an allowed administrative operation.
4. A user accesses their own private resource.
5. A user attempts to access another user's private resource.
6. A user submits a forged owner identifier.
7. A user attempts to change their role.
8. An unauthorized user attempts to modify book or chapter records.
9. A request attempts to access unpublished content.
10. A request attempts to access archived content.
11. A resource does not exist.
12. A role or permission changes while authentication credentials remain active.
13. A frontend-hidden operation is called directly through the API.
14. The application returns the correct status code for denied access.

Execute only the scenarios relevant to implemented features and record actual results. Do not report tests as passed without evidence.

## 17. Manual Testing with PowerShell

Use actual route paths and authentication details from the current backend.

Illustrative template:

```powershell
$baseUrl = "http://localhost:PORT/api/v1"

# Replace the placeholder with a verified administrative endpoint.
Invoke-RestMethod `
    -Method Get `
    -Uri "$baseUrl/REPLACE_WITH_ADMIN_ENDPOINT"
```

For a meaningful authorization test, send the request using a standard user's authentication state and then repeat it using an administrator's authentication state where supported.

Do not place production credentials or tokens in shared scripts or documentation.

## 18. Implementation Verification Checklist

- [ ] Authentication middleware is applied to protected routes.
- [ ] Administrative endpoints enforce the intended role policy.
- [ ] Ownership checks are applied to private resources.
- [ ] Client-supplied roles are not trusted.
- [ ] Restricted fields cannot be modified through mass assignment.
- [ ] Book and chapter visibility rules are enforced by the backend.
- [ ] Private files are protected from unauthorized access.
- [ ] Access-denial status codes are consistent.
- [ ] Sensitive authorization failures are logged appropriately.
- [ ] Relevant authorization tests have been executed.
- [ ] The permission matrix matches the approved requirements and current code.

## 19. Related Documentation

- `authentication.md`
- `content-model.md`
- `error-handling.md`
- `validation.md`
- `../api/users.md`
- `../api/books.md`
- `../api/chapters.md`
- `../api/private-library.md`
- `../05-security/authentication-authorization.md`
- `../05-security/security-design.md`
- `../07-testing/security-testing.md`
- `../07-testing/test-cases.md`

## 20. Maintenance

Review this document whenever roles, permissions, ownership rules, content visibility, private-library behavior, or administrative operations change.

Keep the proposed permission policy synchronized with the actual backend implementation and executed test evidence.
