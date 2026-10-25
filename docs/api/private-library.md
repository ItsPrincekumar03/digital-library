# Private Library API

## 1. Overview

This document specifies the intended API responsibilities for private library resources in the Digital Library application.

The project uses HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL with a monolithic architecture.

The private library is intended to provide controlled access to resources associated with an individual user. Depending on the approved requirements and actual implementation, these resources may include saved books, privately uploaded documents, or other user-specific library items.

**Implementation status:** The endpoint paths, ownership model, request fields, response structures, and supported operations must be verified against the current backend. The examples in this document are illustrative and must not be treated as proof that the endpoints already exist.

## 2. Objectives

The Private Library API is intended to:

- Provide access to a user's permitted private resources.
- Prevent unauthorized access to another user's private content.
- Support listing and retrieving private library items.
- Support adding or removing items where those operations are implemented.
- Apply appropriate validation and access controls.
- Maintain data integrity in MySQL.
- Handle unavailable resources without exposing sensitive information.

Only functionality implemented and tested in the current release should be reported as available.

## 3. Base URL

Illustrative local development base URL:

```text
http://localhost:PORT/api/v1
```

Replace `PORT` with the port configured in the current backend.

The exact route prefix and private-library paths must be confirmed from the Express route definitions and server configuration.

## 4. Authentication and Ownership

Private library operations must enforce authentication and resource-level authorization.

The server should determine the authenticated user's identity from the verified authentication context. It must not rely on a user identifier supplied by the client as proof of ownership.

For each request, the backend should determine:

1. Whether the requester is authenticated.
2. Which user is making the request.
3. Whether the requested resource exists.
4. Whether the requester is authorized to access that resource.
5. Whether the requested operation is permitted.

A user should not be able to access another user's private resources by changing an identifier in a URL, query parameter, or request body.

Administrative access, if required, must follow an explicitly defined policy rather than automatically bypassing every ownership restriction.

## 5. Conceptual Data Model

The private library may use a relationship between a user and a resource.

A conceptual record could contain:

| Field | Purpose |
|---|---|
| `id` | Unique private-library record identifier |
| `user_id` | Identifier of the associated user |
| `book_id` | Identifier of an associated book, if applicable |
| `created_at` | Time the relationship was created, if supported |

The actual implementation may use a different structure or additional fields.

This table is conceptual. Field names, database types, constraints, and relationships must match the verified MySQL schema.

If the private library stores uploaded documents rather than references to existing books, its data model and file-access rules must be documented separately.

## 6. List Private Library Items

### Purpose

Retrieve private library items belonging to the authenticated user, if a listing endpoint is implemented.

**Illustrative request**

```http
GET /api/v1/private-library
```

### Expected behavior

The endpoint should:

1. Authenticate the requester.
2. Determine the user's identity from the verified authentication context.
3. Retrieve only the resources the user is permitted to access.
4. Apply supported pagination or sorting.
5. Return a consistent response structure.
6. Avoid exposing internal storage paths or sensitive metadata.

### Illustrative response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "book_id": 25,
      "title": "Example Book"
    }
  ]
}
```

The response is illustrative. Actual field names and response structure must be verified against the implementation.

### Possible status codes

- `200 OK` — request processed successfully.
- `401 Unauthorized` — authentication is missing or invalid.
- `403 Forbidden` — access is not permitted.
- `500 Internal Server Error` — unexpected failure.

The final API contract must reflect the application's actual response conventions.

## 7. Retrieve a Private Library Item

### Purpose

Retrieve an individual private library item when the corresponding endpoint exists.

**Illustrative request**

```http
GET /api/v1/private-library/:itemId
```

### Expected behavior

- Validate the item identifier.
- Confirm that the item exists.
- Determine its associated user or ownership relationship.
- Verify that the requester is permitted to access it.
- Return only permitted information.
- Avoid exposing private content when access is denied.

### Possible status codes

- `200 OK` — item retrieved.
- `400 Bad Request` — invalid identifier, where applicable.
- `401 Unauthorized` — authentication required.
- `403 Forbidden` — access denied.
- `404 Not Found` — item unavailable or not found.
- `500 Internal Server Error` — unexpected failure.

The actual route and status-code behavior must be confirmed from the backend.

## 8. Add an Item to the Private Library

### Purpose

Associate an existing book or other supported resource with the authenticated user's private library, if this operation is implemented.

**Illustrative request**

```http
POST /api/v1/private-library
Content-Type: application/json
```

Example request body:

```json
{
  "book_id": 25
}
```

The accepted fields must match the actual request validator and database model.

### Expected behavior

The backend should:

1. Authenticate the requester.
2. Derive the user identity from the verified authentication context.
3. Validate the resource identifier.
4. Confirm that the referenced resource exists.
5. Confirm that the user is permitted to access or save the resource.
6. Prevent duplicate relationships where required.
7. Persist the relationship using safe database operations.
8. Return a consistent response.

The client must not be allowed to assign a private-library item to another user merely by submitting a different `user_id`.

### Possible status codes

- `201 Created` — relationship created.
- `400 Bad Request` — invalid input.
- `401 Unauthorized` — authentication required.
- `403 Forbidden` — resource access not permitted.
- `404 Not Found` — resource unavailable.
- `409 Conflict` — duplicate relationship or conflicting state, where applicable.
- `500 Internal Server Error` — unexpected failure.

These statuses are examples, not verified implementation results.

## 9. Remove an Item from the Private Library

### Purpose

Remove an item from a user's private library when removal is supported.

**Illustrative request**

```http
DELETE /api/v1/private-library/:itemId
```

### Expected behavior

- Validate the item identifier.
- Authenticate the requester.
- Confirm that the requester owns the private-library relationship or otherwise has permission.
- Remove only the intended relationship.
- Preserve the underlying book or shared resource unless a separate, explicitly authorized operation is requested.
- Return the response defined by the API contract.

Removing a book from a user's private library must not automatically delete the original book record or other users' relationships.

### Possible status codes

- `200 OK` — removal completed with a response body.
- `204 No Content` — removal completed without a response body.
- `401 Unauthorized` — authentication required.
- `403 Forbidden` — operation not permitted.
- `404 Not Found` — item not found or unavailable.
- `500 Internal Server Error` — unexpected failure.

The exact behavior must be verified against the current implementation.

## 10. Private Document Access

If the private library supports uploaded files, document access requires additional controls.

The backend should:

- Verify the authenticated user's access rights before serving a file.
- Avoid trusting client-supplied file paths.
- Resolve files through controlled identifiers or trusted storage mappings.
- Prevent path traversal.
- Validate uploads according to the approved file policy.
- Apply configured file-size limits.
- Avoid exposing filesystem paths.
- Prevent unauthorized direct downloads.
- Handle missing or corrupted files safely.

A private document must not become publicly accessible merely because its storage URL or filename is known.

If documents are stored outside the database, the application must maintain a reliable association between document metadata and its authorized owner.

## 11. Privacy and Data Minimization

Private library endpoints should return only the information necessary for the requested operation.

The API should avoid exposing:

- Passwords or password hashes.
- Authentication tokens.
- Internal filesystem paths.
- Other users' private library records.
- Unnecessary personal information.
- Internal database details.

Logs should not contain private document contents or authentication secrets unless an explicitly justified, secure logging design requires specific information.

## 12. Validation Requirements

Private library requests should validate:

- Authentication state.
- Resource identifier format.
- Resource existence.
- Ownership or access permission.
- Request field types.
- Duplicate relationship rules.
- Supported pagination parameters.
- Request-body size.
- Any applicable document-upload constraints.

Validation must be performed on the server even if the frontend also validates input.

## 13. Error Response Format

Where consistent with the existing API conventions, an error response may follow this illustrative structure:

```json
{
  "success": false,
  "message": "Resource not found."
}
```

The actual response format takes precedence.

Error messages should not reveal private content or disclose unnecessary details about another user's resources.

The application should use appropriate HTTP status codes and record useful diagnostic information in secure server-side logs.

## 14. Database and Security Requirements

Private-library operations should follow these principles:

- Use parameterized SQL queries.
- Derive the user identity from trusted authentication context.
- Enforce ownership checks on every protected operation.
- Apply appropriate foreign-key constraints.
- Prevent duplicate relationships where required.
- Use transactions for dependent database changes.
- Validate referenced resources.
- Avoid returning unauthorized records.
- Protect file storage and download operations.
- Handle database failures consistently.

These are expected design controls, not confirmation that every control has already been implemented.

## 15. Testing Requirements

Test the private-library functionality that actually exists.

Recommended test scenarios include:

1. An authenticated user lists their private library.
2. An unauthenticated requester attempts to list private resources.
3. A user retrieves an item they are permitted to access.
4. A user attempts to access another user's item.
5. A user attempts to change an identifier to bypass ownership checks.
6. A user adds an eligible resource, if supported.
7. Duplicate additions are handled according to the defined policy.
8. A user removes their own relationship, if supported.
9. Removing a relationship does not delete the shared book.
10. Invalid resource identifiers are rejected.
11. Unauthorized private document downloads are rejected.
12. Missing files are handled safely, where applicable.
13. Database failures do not expose sensitive information.
14. Responses do not disclose another user's private metadata.

For each executed test, record the request, expected result, actual result, environment, and evidence.

Do not mark unexecuted tests as passed.

## 16. Manual Testing with PowerShell

After verifying the actual endpoint path and authentication mechanism, a private-library endpoint can be tested using PowerShell.

Illustrative request:

```powershell
$baseUrl = "http://localhost:PORT/api/v1"

Invoke-RestMethod `
    -Method Get `
    -Uri "$baseUrl/private-library"
```

Replace `PORT` and the endpoint path with the values confirmed from the current backend.

For protected endpoints, supply authentication using the mechanism actually supported by the application. Do not include real credentials or tokens in shared documentation or screenshots.

## 17. Implementation Verification Checklist

Before treating this document as the final API contract, verify:

- [ ] Private-library routes exist.
- [ ] Route prefixes and HTTP methods are correct.
- [ ] Request fields match the validators.
- [ ] Response structures match the implementation.
- [ ] The ownership model matches the database schema.
- [ ] User identity is derived from trusted authentication context.
- [ ] Ownership checks are enforced on each relevant operation.
- [ ] Shared books are not accidentally deleted when a relationship is removed.
- [ ] Private document access is protected, where applicable.
- [ ] Authentication and authorization failures are handled consistently.
- [ ] Relevant API tests have been executed.

Mark unsupported operations as planned or remove them from the implemented endpoint reference.

## 18. Conclusion

The Private Library API is intended to provide controlled access to user-specific library resources while preserving data integrity and privacy.

Its final contract must match the actual Express routes, authentication middleware, ownership checks, service logic, MySQL schema, file-access implementation, and test evidence.

Illustrative endpoint paths and examples must not be interpreted as proof that the corresponding functionality is already implemented.

## 19. Related Documentation

- `README.md`
- `auth.md`
- `users.md`
- `books.md`
- `chapters.md`
- `../security/README.md`
- `../security/authentication.md`
- `../security/authorization.md`
- `../security/content-model.md`
- `../security/file-upload-prep.md`
- `../security/sql-injection.md`
- `../security/validation.md`
- `../03-technical/database-design.md`
- `../03-technical/api-specification.md`
- `../07-testing/test-cases.md`

## 20. Maintenance

Update this document whenever private-library routes, ownership rules, request or response schemas, document storage, access policies, or supported operations change.

Record implementation status only when supported by current source code and test evidence.
