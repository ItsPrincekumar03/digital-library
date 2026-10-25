# Books API

## 1. Overview

This document describes the API contract for book-related operations in the Digital Library application.

The application uses HTML, CSS, and Vanilla JavaScript for the frontend, Node.js and Express.js for the backend, and MySQL for relational data storage. The approved architecture is monolithic.

The Books API is intended to support book discovery, retrieval, creation, updating, publication management, and relationships with authors, categories, and chapters where those operations are implemented.

**Implementation status:** Endpoint paths, request fields, response structures, publication rules, and authorization requirements must be verified against the current backend source code and database schema. Examples in this document are illustrative unless explicitly confirmed.

## 2. Scope

Depending on the implemented routes, book-related operations may include:

- Listing books.
- Retrieving a book by identifier.
- Searching and filtering books.
- Creating a book.
- Updating book metadata.
- Deleting or archiving a book.
- Managing book publication status.
- Associating books with authors and categories.
- Retrieving chapters belonging to a book.
- Managing visibility and access restrictions.

Only implemented and tested operations should be presented as available API functionality.

## 3. Base URL

Illustrative local development base URL:

```text
http://localhost:PORT/api/v1
```

Replace `PORT` with the port configured in the backend.

The exact API prefix and route paths must be confirmed from the Express server configuration and route mounting.

## 4. Authentication and Authorization

Book endpoints may have different access policies depending on the operation.

Examples of intended access rules include:

| Operation | Intended access policy |
|---|---|
| Browse public books | Public or authenticated access, according to requirements |
| Retrieve a public book | Public or authenticated access, according to requirements |
| Create a book | Authorized user or administrator, according to the approved requirements |
| Update book metadata | Authorized owner or administrator, where applicable |
| Publish or archive a book | Authorized role only |
| Read restricted content | Access permitted only after applicable authorization checks |
| Delete a book | Authorized role only, with relationship and data-integrity safeguards |

These are policy examples, not a verified access-control matrix.

Authorization must be enforced on the backend. Frontend visibility controls alone are insufficient.

## 5. Conceptual Book Data Model

A book may contain the following information, depending on the verified schema:

| Field | Purpose |
|---|---|
| `id` | Unique book identifier |
| `title` | Book title |
| `description` | Optional book description |
| `visibility` | Access classification, if supported |
| `status` | Publication or lifecycle status, if supported |
| `created_at` | Record creation timestamp, if supported |
| `updated_at` | Last modification timestamp, if supported |

Author, category, and chapter information may be stored through relationships rather than directly within the book record.

This table is conceptual. Actual field names, SQL types, defaults, constraints, and relationship structures must match the existing database schema.

## 6. List Books

### Purpose

Retrieve a collection of books accessible to the requester.

**Illustrative request**

```http
GET /api/v1/books
```

### Expected behavior

The endpoint should:

1. Apply the configured access policy.
2. Return only books the requester is permitted to discover.
3. Support pagination when required.
4. Apply supported search, filtering, or sorting criteria.
5. Return a consistent response structure.
6. Handle empty result sets correctly.

### Illustrative response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Example Book",
      "description": "An illustrative book description."
    }
  ]
}
```

The example does not establish the actual response structure or book fields.

### Possible status codes

- `200 OK` — request processed successfully.
- `400 Bad Request` — invalid query parameters.
- `401 Unauthorized` — authentication required.
- `403 Forbidden` — access denied.
- `500 Internal Server Error` — unexpected failure.

Use only the statuses supported by the verified API contract.

## 7. Retrieve a Book

### Purpose

Retrieve the details of one book by its identifier.

**Illustrative request**

```http
GET /api/v1/books/:bookId
```

### Expected behavior

- Validate the book identifier.
- Confirm that the book exists.
- Enforce visibility and authorization rules.
- Return permitted book metadata.
- Handle unavailable or inaccessible records consistently.

### Possible status codes

- `200 OK` — book retrieved.
- `400 Bad Request` — malformed identifier, where applicable.
- `401 Unauthorized` — authentication required.
- `403 Forbidden` — access denied.
- `404 Not Found` — book not found or not available to the requester.
- `500 Internal Server Error` — unexpected failure.

The actual route and status-code conventions must be confirmed from the backend.

## 8. Search and Filter Books

### Purpose

Help users discover relevant books using the search and filtering functionality implemented by the application.

Potential search and filtering criteria include:

- Book title.
- Author.
- Category.
- Supported publication status.
- Other documented metadata fields.

**Illustrative request**

```http
GET /api/v1/books?search=example&page=1&limit=10
```

The query parameters above are examples, not confirmed supported parameters.

### Expected behavior

- Validate query parameters.
- Apply only supported filters.
- Restrict results according to the access policy.
- Use parameterized database queries.
- Apply sensible pagination limits.
- Return consistent results for empty searches.
- Avoid exposing private or unpublished content to unauthorized users.

Advanced semantic search and AI-based recommendations are future possibilities unless verified as implemented.

## 9. Create a Book

### Purpose

Create a book record when the operation is supported.

**Illustrative request**

```http
POST /api/v1/books
Content-Type: application/json
```

Example request body:

```json
{
  "title": "Example Book",
  "description": "An illustrative description."
}
```

Additional fields may be required by the actual implementation.

### Expected behavior

The backend should:

1. Authenticate the requester when required.
2. Enforce the applicable role and permission checks.
3. Validate the request body.
4. Validate related author and category identifiers where supplied.
5. Apply permitted defaults for lifecycle and visibility fields.
6. Persist the book using safe database operations.
7. Return the created resource in the established response format.

The backend must not trust client-supplied fields that determine privileged ownership, administrative permissions, or protected lifecycle transitions.

### Possible status codes

- `201 Created` — book created.
- `400 Bad Request` — invalid input.
- `401 Unauthorized` — authentication required.
- `403 Forbidden` — insufficient permissions.
- `409 Conflict` — duplicate or conflicting record, where applicable.
- `500 Internal Server Error` — unexpected failure.

## 10. Update a Book

### Purpose

Update an existing book's permitted metadata.

**Illustrative request**

```http
PATCH /api/v1/books/:bookId
Content-Type: application/json
```

Example request body:

```json
{
  "title": "Updated Book Title",
  "description": "Updated description."
}
```

### Expected behavior

- Validate the book identifier.
- Confirm that the book exists.
- Enforce authorization.
- Validate supplied fields.
- Reject fields that the requester is not permitted to change.
- Preserve unrelated fields during partial updates.
- Maintain database relationships.
- Return a consistent response.

If the implementation uses `PUT` instead of `PATCH`, document the actual method and its replacement semantics.

## 11. Book Publication and Archival

The application has discussed publication and archival workflows. The exact supported lifecycle states and transition rules must be verified from the current implementation.

Where applicable, the backend should define:

- Permitted publication states.
- Which roles can change lifecycle status.
- Required conditions before publication.
- Behavior when a book is archived.
- Whether archived books remain accessible to administrators.
- Whether unpublished content is hidden from ordinary users.

Lifecycle transitions should be validated on the backend. A client must not be able to bypass authorization by submitting a different status value.

Do not assume particular status names or transition rules until confirmed by the service logic, validators, and database schema.

## 12. Book Visibility and Private Content

Book visibility controls which users may discover or access a resource.

Where visibility rules exist, the backend should:

1. Determine the requester's authenticated identity.
2. Load the relevant resource and access information.
3. Apply the configured visibility policy.
4. Enforce ownership or other access conditions.
5. Avoid exposing restricted metadata or document content.
6. Return a suitable response for unauthorized access.

A hidden frontend link is not an access-control mechanism.

Visibility rules must be applied consistently across listing, detail, search, chapter retrieval, document access, and related endpoints.

## 13. Author and Category Relationships

Books may be associated with authors and categories through the database relationships defined by the project.

Potential relationship operations include:

- Assigning authors to a book.
- Removing author associations.
- Assigning categories.
- Removing category associations.
- Retrieving related authors or categories.

The exact relationship model must be taken from the existing database schema.

When changing relationships, the backend should validate referenced records and preserve referential integrity.

Relationship changes should not create duplicate associations or unintentionally remove unrelated data.

## 14. Chapter Relationships

A book may contain one or more chapters where chapter management is supported.

Chapter-related behavior may include:

- Retrieving chapters associated with a book.
- Creating a chapter for a book.
- Updating chapter metadata.
- Managing chapter order.
- Restricting access to chapters based on the book's visibility and publication rules.

The Chapters API should define the detailed chapter operations.

Book-level authorization and visibility rules must not be bypassed by requesting a chapter directly through its own endpoint.

## 15. Delete or Archive a Book

### Purpose

Remove or archive a book only where the operation is supported and permitted.

**Illustrative request**

```http
DELETE /api/v1/books/:bookId
```

Deletion and archival are different operations. The actual implementation determines which is supported.

Before deleting a book, the backend should consider:

- Whether the book exists.
- Whether the requester has permission.
- Whether chapters or relationship records depend on the book.
- Whether foreign-key constraints prevent deletion.
- Whether archival is the preferred alternative.
- Whether associated files require controlled cleanup.

The system must not unintentionally delete unrelated records or leave unmanaged files.

### Possible status codes

- `200 OK` — operation completed with a response body.
- `204 No Content` — operation completed without a response body.
- `401 Unauthorized` — authentication required.
- `403 Forbidden` — operation not permitted.
- `404 Not Found` — book not found.
- `409 Conflict` — operation conflicts with existing relationships.
- `500 Internal Server Error` — unexpected failure.

These are possible contract choices, not verified behavior.

## 16. Validation Requirements

Book-related requests should validate:

- Required fields.
- Field types and lengths.
- Book identifiers.
- Search and pagination parameters.
- Author and category identifiers.
- Supported lifecycle values.
- Visibility-related fields.
- Relationship updates.
- Unexpected fields.
- Resource ownership and permissions.

Validation rules must match the current backend validators and approved requirements.

Database constraints should reinforce data integrity where appropriate.

## 17. Error Response Format

Where consistent with the application's API conventions, an error response may follow this illustrative structure:

```json
{
  "success": false,
  "message": "Book not found."
}
```

The existing application response contract takes precedence over this example.

Error responses should:

- Use suitable HTTP status codes.
- Avoid exposing SQL queries or stack traces.
- Avoid disclosing restricted resource details unnecessarily.
- Provide safe and understandable messages.
- Preserve diagnostic information in secure server-side logs.

## 18. Database and Security Requirements

Book-related operations should follow these principles:

- Use parameterized SQL queries.
- Validate request data before processing.
- Enforce authentication and authorization.
- Apply visibility rules consistently.
- Validate relationships with authors, categories, and chapters.
- Maintain referential integrity.
- Use transactions for operations that require atomic updates.
- Apply appropriate indexes for common search and retrieval patterns.
- Avoid returning internal database fields unnecessarily.
- Protect private document paths and content.

These are required design considerations, not proof that every control is currently implemented.

## 19. Testing Requirements

Test the book endpoints that actually exist.

Recommended scenarios include:

1. List accessible books.
2. Retrieve an existing book.
3. Request a nonexistent book.
4. Search using supported query parameters.
5. Submit invalid pagination values.
6. Create a book with valid data, if supported.
7. Reject invalid book data.
8. Update permitted book fields.
9. Reject unauthorized modifications.
10. Verify publication and archival rules, if supported.
11. Verify visibility and private-content restrictions.
12. Verify author and category relationships.
13. Verify chapter access follows book-level permissions.
14. Test deletion behavior with related records, if supported.
15. Confirm database errors are handled safely.
16. Confirm that restricted content is not leaked in search results.

Record expected results, actual results, environment, and evidence. Do not mark tests as passed until they have been executed.

## 20. Manual Testing with PowerShell

After confirming the current route and port, use PowerShell to test an implemented endpoint.

Example template:

```powershell
$baseUrl = "http://localhost:PORT/api/v1"

Invoke-RestMethod `
    -Method Get `
    -Uri "$baseUrl/books"
```

Replace `PORT` and `/books` with the values verified in the current backend.

For protected operations, provide authentication using the mechanism actually supported by the application. Do not store real credentials or tokens in shared documentation.

## 21. Implementation Verification Checklist

Before finalizing this API reference, verify:

- [ ] Book routes and HTTP methods exist.
- [ ] Route prefixes match the Express configuration.
- [ ] Request fields match the validators.
- [ ] Response structures match the controllers and services.
- [ ] Database fields match the actual schema.
- [ ] Search and pagination behavior is confirmed.
- [ ] Author and category relationships are accurate.
- [ ] Chapter relationships are accurate.
- [ ] Publication and archival rules are confirmed.
- [ ] Visibility rules are enforced on every relevant access path.
- [ ] Authentication and authorization are tested.
- [ ] Delete and archival behavior is documented accurately.
- [ ] Relevant API tests have been executed.

Mark unsupported operations as planned or remove them from the implemented endpoint reference.

## 22. Conclusion

The Books API defines the expected responsibilities for managing, retrieving, discovering, and controlling access to book records in the Digital Library.

The final API contract must match the existing Express routes, backend business logic, validators, MySQL schema, authorization policies, and test evidence.

Illustrative endpoints and response examples in this document must not be interpreted as proof that the corresponding operations are already implemented.

## 23. Related Documentation

- `README.md`
- `auth.md`
- `authors.md`
- `categories.md`
- `chapters.md`
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

## 24. Maintenance

Update this document whenever book routes, request or response schemas, database relationships, publication workflows, visibility rules, or authorization policies change.

Document implementation status only when supported by current source code and test evidence.
