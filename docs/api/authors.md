# Authors API

## 1. Overview

This document specifies the API responsibilities for managing and retrieving author information in the Digital Library application.

The approved technology stack is HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL. The backend follows a monolithic architecture.

Author records may be associated with books through a direct relationship or a separate relationship table, depending on the verified database design.

**Implementation status:** The endpoint paths, request fields, response structures, authorization rules, and database relationships described below must be verified against the current source code before they are treated as implemented API behavior.

## 2. Purpose

The Authors API is intended to support operations such as:

- Retrieving author information.
- Listing authors.
- Finding books associated with an author.
- Creating author records when author management is supported.
- Updating author information when permitted.
- Deleting author records when permitted and safe.

Only operations implemented in the backend should be exposed to clients.

## 3. Base URL

Illustrative local development base URL:

```text
http://localhost:PORT/api/v1
```

Replace `PORT` with the port configured in the backend.

The route prefix and exact author endpoint paths must be confirmed from the Express route definitions and route mounting.

## 4. Authentication and Authorization

Access to author information must follow the application's approved access policy.

Possible policies include:

- Public access to authors associated with publicly available books.
- Authenticated access to restricted author information.
- Administrator-only access to create, update, or delete author records.

These are proposed access rules, not confirmation of current route behavior.

Authorization must be enforced on the backend. Hiding a frontend control is not sufficient protection.

## 5. Author Data Model

An author record may contain fields such as:

| Field | Purpose |
|---|---|
| `id` | Unique author identifier |
| `name` | Author's display name |
| `biography` | Optional descriptive information |
| `created_at` | Record creation timestamp, if supported |
| `updated_at` | Last modification timestamp, if supported |

This is a conceptual model. Actual field names, SQL types, nullability, and constraints must match the database schema.

The API must not assume that every listed field exists.

## 6. List Authors

### Purpose

Retrieve a collection of authors when a listing endpoint is implemented.

**Illustrative request**

```http
GET /api/v1/authors
```

### Expected behavior

The endpoint should:

1. Apply the configured access policy.
2. Retrieve the permitted author records.
3. Return a consistent response structure.
4. Handle an empty result set.
5. Support pagination if required by the application.

### Possible response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Example Author"
    }
  ]
}
```

The response is illustrative and does not establish the actual response schema.

### Possible status codes

- `200 OK` — request processed successfully.
- `401 Unauthorized` — authentication is required but missing or invalid.
- `403 Forbidden` — access is not permitted.
- `500 Internal Server Error` — unexpected server failure.

Only applicable statuses should be documented as part of the final verified contract.

## 7. Retrieve an Author

### Purpose

Retrieve one author by identifier.

**Illustrative request**

```http
GET /api/v1/authors/:authorId
```

### Expected behavior

- Validate the identifier.
- Retrieve the requested author.
- Return only permitted information.
- Handle nonexistent records consistently.

### Possible status codes

- `200 OK` — author retrieved.
- `400 Bad Request` — malformed identifier, if validated this way.
- `404 Not Found` — author does not exist or is not available.
- `401 Unauthorized` — authentication required.
- `403 Forbidden` — access denied.
- `500 Internal Server Error` — unexpected server failure.

The actual route and status-code conventions must be checked against the implementation.

## 8. Create an Author

### Purpose

Create an author record when the application supports author creation.

**Illustrative request**

```http
POST /api/v1/authors
Content-Type: application/json
```

Example request body:

```json
{
  "name": "Example Author",
  "biography": "Optional author biography."
}
```

### Expected behavior

The backend should:

1. Authenticate the requester when required.
2. Enforce the applicable role and permission checks.
3. Validate all supplied fields.
4. Apply uniqueness rules if defined by the data model.
5. Insert the record using safe database queries.
6. Return the created record without exposing sensitive information.

### Possible status codes

- `201 Created` — author created.
- `400 Bad Request` — invalid input.
- `401 Unauthorized` — authentication required.
- `403 Forbidden` — requester lacks permission.
- `409 Conflict` — duplicate or conflicting record, if applicable.
- `500 Internal Server Error` — unexpected server failure.

The endpoint must not be considered implemented until its route, controller, service, repository, and database behavior are verified.

## 9. Update an Author

### Purpose

Update an existing author record when editing is supported.

**Illustrative request**

```http
PATCH /api/v1/authors/:authorId
Content-Type: application/json
```

Example request body:

```json
{
  "name": "Updated Author Name",
  "biography": "Updated biography."
}
```

### Expected behavior

- Validate the author identifier.
- Confirm that the author exists.
- Enforce authorization.
- Validate supplied fields.
- Prevent updates to fields that clients are not allowed to modify.
- Persist the permitted changes.
- Return the updated record according to the API contract.

If the application uses `PUT` rather than `PATCH`, the documentation must reflect the actual HTTP method and replacement semantics.

## 10. Delete an Author

### Purpose

Delete an author record only when deletion is supported and permitted.

**Illustrative request**

```http
DELETE /api/v1/authors/:authorId
```

### Expected behavior

Before deletion, the application should consider:

- Whether the author exists.
- Whether the requester is authorized.
- Whether books reference the author.
- Whether foreign-key constraints prevent deletion.
- Whether the project uses archival or soft deletion instead.
- Whether related records must remain intact.

The system must not unintentionally delete associated books or other important content.

### Possible status codes

- `200 OK` or `204 No Content` — deletion completed.
- `400 Bad Request` — invalid identifier or prohibited operation.
- `401 Unauthorized` — authentication required.
- `403 Forbidden` — permission denied.
- `404 Not Found` — author unavailable.
- `409 Conflict` — deletion conflicts with existing relationships.
- `500 Internal Server Error` — unexpected server failure.

The final response behavior must follow the actual implementation.

## 11. Author and Book Relationships

An author may be associated with one or more books.

The implementation may use:

- A direct author reference in a book record.
- A separate many-to-many relationship table.
- Another schema explicitly defined by the database design.

The API must follow the existing schema rather than introducing a second relationship model.

Relationship operations should validate both referenced records and preserve data integrity.

If an author is associated with several books, deleting the author must not silently remove the books themselves.

## 12. Validation Requirements

Author-related requests should be validated for:

- Required fields.
- Correct field types.
- Name length and permitted characters.
- Biography length, if supported.
- Valid author identifiers.
- Unexpected fields.
- Duplicate records, where applicable.
- Valid relationships to other entities.

Validation rules should match the project's actual validators and documented requirements.

Database constraints should provide an additional layer of data integrity where appropriate.

## 13. Error Response Format

Where consistent with the existing API conventions, an error may use a structure such as:

```json
{
  "success": false,
  "message": "Author not found."
}
```

This example is illustrative. The application's established response structure takes precedence.

Error responses should use suitable HTTP status codes and must not expose SQL statements, stack traces, credentials, or internal secrets.

## 14. Database and Security Requirements

Author-related database operations should follow these principles:

- Use parameterized SQL queries.
- Validate identifiers before database operations.
- Enforce appropriate authentication and authorization.
- Maintain valid book-author relationships.
- Handle missing records consistently.
- Use database transactions when multiple dependent changes require atomicity.
- Avoid exposing unnecessary internal database fields.
- Log useful diagnostic information without recording secrets.

A successful API request alone does not prove that every security requirement has been satisfied.

## 15. Testing Requirements

The Authors API should be tested against the operations actually implemented.

Recommended test scenarios include:

1. Retrieve the author list.
2. Retrieve an existing author.
3. Request a nonexistent author.
4. Submit an invalid author identifier.
5. Create an author with valid data, if supported.
6. Reject invalid author data.
7. Update an author, if supported.
8. Delete an author, if supported.
9. Attempt unauthorized author-management operations.
10. Verify behavior when an author has associated books.
11. Verify database constraints.
12. Confirm that errors do not expose sensitive details.

Record the expected result, actual result, test environment, and evidence for each executed test.

Do not mark unexecuted test cases as passed.

## 16. Manual Testing with PowerShell

After confirming the actual route and port, an implemented endpoint can be tested with PowerShell.

Example template:

```powershell
$baseUrl = "http://localhost:PORT/api/v1"

Invoke-RestMethod `
    -Method Get `
    -Uri "$baseUrl/authors"
```

Replace `PORT` and `/authors` with the values confirmed from the current backend.

For protected endpoints, include the authentication mechanism required by the implementation. Do not expose real credentials or tokens in shared logs.

## 17. Implementation Verification Checklist

Before treating this document as the final API contract, verify:

- [ ] The author routes exist.
- [ ] The route prefix and HTTP methods are correct.
- [ ] The controllers implement the documented behavior.
- [ ] The services enforce the expected business rules.
- [ ] The repositories use the correct database schema.
- [ ] The author fields match the actual schema.
- [ ] The book-author relationship is documented accurately.
- [ ] Authentication and authorization rules are verified.
- [ ] Error response formats and status codes are confirmed.
- [ ] Relevant API tests have been executed.

If an operation does not exist, mark it as planned or remove it from the implemented endpoint reference.

## 18. Conclusion

The Authors API provides the specification for author-related operations within the Digital Library application.

Its final contract must remain consistent with the approved requirements, existing Express routes, backend layers, MySQL schema, and verified test results.

Illustrative endpoint paths and examples in this document must not be interpreted as proof that the corresponding operations are already implemented.

## 19. Related Documentation

- `README.md`
- `books.md`
- `categories.md`
- `chapters.md`
- `users.md`
- `auth.md`
- `../security/README.md`
- `../security/authorization.md`
- `../security/sql-injection.md`
- `../security/validation.md`
- `../03-technical/database-design.md`
- `../03-technical/api-specification.md`
- `../07-testing/test-cases.md`

## 20. Maintenance

Update this document whenever author routes, request or response schemas, database relationships, access policies, or supported operations change.

Document implementation status only when supported by current source code and test evidence.
