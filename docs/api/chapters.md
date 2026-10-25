# Chapters API

## 1. Overview

This document describes the API responsibilities for managing and retrieving chapters associated with books in the Digital Library application.

The approved technology stack consists of HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL. The backend follows a monolithic architecture.

Chapter operations may include creating chapters, retrieving chapter content, updating chapter metadata, managing chapter order, and deleting chapters, depending on the implemented functionality.

**Implementation status:** The endpoint paths, request fields, response structures, database relationships, publication rules, and access policies in this document must be verified against the current source code before being treated as implemented behavior.

## 2. Purpose

The Chapters API is intended to support structured book content.

Potential responsibilities include:

- Retrieving chapters associated with a book.
- Retrieving an individual chapter.
- Creating a chapter for a book.
- Updating chapter information.
- Managing chapter order.
- Publishing or archiving chapters, if supported.
- Deleting chapters when permitted.
- Enforcing the visibility and access rules of the parent book.

Only operations supported by the current backend should be documented as available endpoints.

## 3. Base URL

Illustrative local development base URL:

```text
http://localhost:PORT/api/v1
```

Replace `PORT` with the port configured in the backend.

The exact route prefix and chapter endpoint paths must be confirmed from the Express route definitions and server configuration.

## 4. Authentication and Authorization

Chapter access must follow the application's authentication and authorization policies.

Potential access rules include:

| Operation | Intended access policy |
|---|---|
| List chapters for a public book | Public or authenticated access, according to requirements |
| Read a public chapter | Public or authenticated access, according to requirements |
| Read a restricted chapter | Authorized access only |
| Create a chapter | Authorized user or administrator, according to approved requirements |
| Update a chapter | Authorized owner or administrator, where applicable |
| Delete a chapter | Authorized role only |

These are examples of possible policies, not confirmation of the current middleware configuration.

The backend must enforce authorization. Hiding chapter controls in the frontend does not prevent unauthorized API requests.

## 5. Conceptual Chapter Data Model

A chapter record may contain the following fields, depending on the actual database schema:

| Field | Purpose |
|---|---|
| `id` | Unique chapter identifier |
| `book_id` | Identifier of the parent book |
| `title` | Chapter title |
| `content` | Chapter text or supported content representation |
| `chapter_number` | Chapter position or number, if supported |
| `status` | Chapter lifecycle state, if supported |
| `created_at` | Creation timestamp, if supported |
| `updated_at` | Last modification timestamp, if supported |

This is a conceptual model. Actual field names, data types, constraints, and content storage methods must match the current MySQL schema.

Chapter content may be stored directly in the database or represented through another supported storage mechanism. Do not assume a storage model without inspecting the implementation.

## 6. List Chapters for a Book

### Purpose

Retrieve the chapters associated with a particular book when a listing endpoint is implemented.

**Illustrative request**

```http
GET /api/v1/books/:bookId/chapters
```

### Expected behavior

The endpoint should:

1. Validate the book identifier.
2. Confirm that the parent book exists and is accessible.
3. Retrieve the chapters permitted for the requester.
4. Apply the documented ordering rule.
5. Return a consistent response structure.
6. Handle books with no chapters.
7. Avoid exposing unpublished or restricted chapters to unauthorized users.

### Illustrative response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "book_id": 10,
      "title": "Introduction",
      "chapter_number": 1
    }
  ]
}
```

The example is illustrative and does not establish the actual response structure.

### Possible status codes

- `200 OK` — request processed successfully.
- `400 Bad Request` — invalid identifier or query parameters.
- `401 Unauthorized` — authentication required.
- `403 Forbidden` — access denied.
- `404 Not Found` — book unavailable or not found.
- `500 Internal Server Error` — unexpected failure.

The actual route and response behavior must be verified against the backend.

## 7. Retrieve an Individual Chapter

### Purpose

Retrieve one chapter by its identifier.

**Illustrative request**

```http
GET /api/v1/chapters/:chapterId
```

### Expected behavior

- Validate the chapter identifier.
- Confirm that the chapter exists.
- Identify the parent book.
- Apply the parent book's visibility and access rules.
- Apply any chapter-specific restrictions.
- Return only permitted chapter information.
- Handle unavailable chapters consistently.

Authorization must be checked on every direct chapter request, not only when the user first opens the book.

### Possible status codes

- `200 OK` — chapter retrieved.
- `400 Bad Request` — malformed identifier, where applicable.
- `401 Unauthorized` — authentication required.
- `403 Forbidden` — access denied.
- `404 Not Found` — chapter unavailable or not found.
- `500 Internal Server Error` — unexpected failure.

These are possible contract choices rather than verified implementation results.

## 8. Create a Chapter

### Purpose

Create a chapter associated with an existing book when chapter creation is supported.

**Illustrative request**

```http
POST /api/v1/books/:bookId/chapters
Content-Type: application/json
```

Example request body:

```json
{
  "title": "Introduction",
  "content": "Illustrative chapter content.",
  "chapter_number": 1
}
```

The accepted fields and required values must match the current request validator and database schema.

### Expected behavior

The backend should:

1. Authenticate the requester when required.
2. Enforce the applicable role and permission checks.
3. Validate the parent book identifier.
4. Confirm that the parent book exists.
5. Validate chapter fields and content size.
6. Enforce any chapter-number uniqueness or ordering rules.
7. Apply applicable parent-book publication and editing restrictions.
8. Persist the chapter using safe database operations.
9. Return the created resource in the established response format.

If creating a chapter and updating related metadata require multiple dependent changes, use a database transaction where appropriate.

### Possible status codes

- `201 Created` — chapter created.
- `400 Bad Request` — invalid input.
- `401 Unauthorized` — authentication required.
- `403 Forbidden` — insufficient permissions.
- `404 Not Found` — parent book not found.
- `409 Conflict` — duplicate or conflicting chapter information.
- `413 Content Too Large` — request exceeds a configured size limit, where applicable.
- `500 Internal Server Error` — unexpected failure.

Only applicable statuses should be included in the final verified API contract.

## 9. Update a Chapter

### Purpose

Update permitted chapter fields.

**Illustrative request**

```http
PATCH /api/v1/chapters/:chapterId
Content-Type: application/json
```

Example request body:

```json
{
  "title": "Updated Chapter Title",
  "content": "Updated illustrative chapter content."
}
```

### Expected behavior

- Validate the chapter identifier.
- Confirm that the chapter exists.
- Identify the parent book.
- Enforce the applicable authorization rules.
- Validate supplied fields.
- Reject unauthorized field changes.
- Preserve unchanged fields during partial updates.
- Maintain any chapter-ordering constraints.
- Return the updated chapter using the established response format.

If the application uses `PUT` instead of `PATCH`, document the actual method and its semantics.

## 10. Chapter Ordering

Where chapter ordering is supported, the API should define how the order is represented and updated.

Possible approaches include:

- A numeric chapter number.
- A dedicated ordering field.
- Another ordering mechanism defined by the database design.

The implementation should:

- Validate ordering values.
- Apply consistent sorting when retrieving chapters.
- Handle duplicate positions according to the approved rules.
- Avoid unintended reordering of unrelated chapters.
- Use transactions when multiple records must be updated atomically.

Do not assume that chapter numbers are unique or automatically generated until the actual implementation confirms that behavior.

## 11. Chapter Publication and Parent-Book Visibility

If chapter publication states are supported, the API should define permitted lifecycle transitions and the roles allowed to perform them.

Chapter access should remain consistent with the parent book's visibility and publication rules.

For example, a chapter should not become publicly accessible merely because its individual endpoint is requested directly when the parent book is restricted.

The backend should evaluate:

1. Whether the requester is authenticated, where required.
2. Whether the parent book is accessible.
3. Whether the chapter is available under the relevant publication policy.
4. Whether the requester has permission to manage or read the chapter.
5. Whether any additional ownership restrictions apply.

The exact rules must be derived from the current implementation and approved requirements.

## 12. Delete a Chapter

### Purpose

Delete a chapter when deletion is supported and permitted.

**Illustrative request**

```http
DELETE /api/v1/chapters/:chapterId
```

### Expected behavior

Before deletion, the backend should consider:

- Whether the chapter exists.
- Whether the requester has permission.
- Whether the chapter belongs to the expected book.
- Whether dependent records reference the chapter.
- Whether archival or soft deletion is used instead.
- Whether chapter ordering needs adjustment after deletion.

Deleting a chapter must not unintentionally delete its parent book or unrelated chapters.

### Possible status codes

- `200 OK` — deletion completed with a response body.
- `204 No Content` — deletion completed without a response body.
- `400 Bad Request` — invalid or prohibited operation.
- `401 Unauthorized` — authentication required.
- `403 Forbidden` — operation not permitted.
- `404 Not Found` — chapter not found.
- `409 Conflict` — operation conflicts with related data.
- `500 Internal Server Error` — unexpected failure.

The actual response behavior must follow the implemented endpoint.

## 13. Content Validation

Chapter content may be substantially larger than ordinary metadata fields.

Validation should consider:

- Required fields.
- Title length.
- Content type.
- Content size.
- Chapter identifier format.
- Parent book identifier.
- Permitted formatting.
- Unexpected or disallowed fields.
- Chapter-ordering constraints.
- Any content restrictions defined by the project.

Request-size limits should be configured to prevent excessive resource consumption.

If rich text or HTML content is supported, the application must define how unsafe markup is handled before content is rendered in the browser.

## 14. Error Response Format

Where consistent with the existing API conventions, an error response may follow this illustrative structure:

```json
{
  "success": false,
  "message": "Chapter not found."
}
```

The application's established response format takes precedence over this example.

Error responses should:

- Use suitable HTTP status codes.
- Avoid exposing stack traces or SQL statements.
- Avoid leaking restricted chapter content.
- Provide safe and understandable messages.
- Preserve useful diagnostic information in secure server-side logs.

## 15. Database and Security Requirements

Chapter-related operations should follow these principles:

- Use parameterized SQL queries.
- Validate identifiers and request fields.
- Enforce authentication and authorization.
- Check access to the parent book.
- Maintain valid book-chapter relationships.
- Apply appropriate foreign-key constraints.
- Use transactions for dependent multi-record operations.
- Enforce configured content-size limits.
- Avoid exposing private chapter content.
- Apply safe rendering practices to user-supplied content.
- Handle database constraint violations consistently.

These principles describe expected controls and do not prove that every control is currently implemented.

## 16. Testing Requirements

Test the chapter endpoints that actually exist in the backend.

Recommended scenarios include:

1. Retrieve chapters for an accessible book.
2. Retrieve chapters for a book that does not exist.
3. Retrieve an existing chapter.
4. Request a nonexistent chapter.
5. Create a chapter with valid data, if supported.
6. Reject invalid chapter data.
7. Reject content that exceeds configured limits.
8. Update permitted chapter fields.
9. Reject unauthorized chapter modifications.
10. Verify chapter ordering.
11. Verify parent-book access restrictions.
12. Verify unpublished or restricted chapter access.
13. Delete a chapter, if supported.
14. Verify behavior when related records exist.
15. Verify that deleting a chapter does not delete its parent book.
16. Confirm errors do not disclose private content.
17. Confirm database failures are handled safely.

Record the expected result, actual result, environment, and evidence for each executed test. Do not mark unexecuted tests as passed.

## 17. Manual Testing with PowerShell

After confirming the actual route and port, an implemented chapter endpoint can be tested using PowerShell.

Example template:

```powershell
$baseUrl = "http://localhost:PORT/api/v1"

Invoke-RestMethod `
    -Method Get `
    -Uri "$baseUrl/books/BOOK_ID/chapters"
```

Replace `PORT`, `BOOK_ID`, and the endpoint path with the values confirmed from the current backend.

For protected endpoints, supply authentication using the mechanism actually supported by the application. Do not expose real credentials or tokens in shared logs.

## 18. Implementation Verification Checklist

Before treating this document as the final API contract, verify:

- [ ] Chapter routes and HTTP methods exist.
- [ ] Route prefixes match the Express configuration.
- [ ] Request fields match the validators.
- [ ] Response structures match the controllers and services.
- [ ] Chapter fields match the MySQL schema.
- [ ] The parent-book relationship is documented accurately.
- [ ] Chapter ordering behavior is confirmed.
- [ ] Publication and visibility rules are verified.
- [ ] Parent-book authorization is enforced.
- [ ] Content-size and validation limits are confirmed.
- [ ] Delete behavior preserves related data.
- [ ] Relevant API tests have been executed.

Mark unsupported operations as planned or remove them from the implemented endpoint reference.

## 19. Conclusion

The Chapters API defines the expected responsibilities for organizing and managing chapter content within books in the Digital Library.

Its final contract must match the actual Express routes, controllers, services, repositories, validators, MySQL schema, access policies, and test evidence.

Illustrative endpoint paths and response examples in this document must not be interpreted as proof that the corresponding operations are already implemented.

## 20. Related Documentation

- `README.md`
- `auth.md`
- `books.md`
- `authors.md`
- `categories.md`
- `private-library.md`
- `users.md`
- `../security/README.md`
- `../security/authorization.md`
- `../security/content-model.md`
- `../security/sql-injection.md`
- `../security/validation.md`
- `../03-technical/database-design.md`
- `../03-technical/api-specification.md`
- `../07-testing/test-cases.md`

## 21. Maintenance

Update this document whenever chapter routes, request or response schemas, content storage, ordering rules, publication workflows, access policies, or supported operations change.

Record implementation status only when supported by current source code and test evidence.
