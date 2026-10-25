# Categories API

## 1. Overview

This document specifies the API responsibilities for managing and retrieving book categories in the Digital Library application.

The project uses HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL. The backend follows a monolithic architecture.

Categories help organize library resources into meaningful groups, such as science, mathematics, psychology, and history.

**Implementation status:** Endpoint paths, request fields, response structures, authorization rules, and database relationships must be verified against the current backend before being treated as implemented behavior. Examples in this document are illustrative unless confirmed by source code and tests.

## 2. Objectives

The Categories API is intended to support the following operations where implemented:

- List available categories.
- Retrieve a category by identifier.
- Create a category.
- Update category information.
- Delete a category when permitted.
- Retrieve books associated with a category.
- Maintain valid relationships between categories and books.

Only operations supported by the current implementation should be documented as available endpoints.

## 3. Base URL

Illustrative local development base URL:

```text
http://localhost:PORT/api/v1
```

Replace `PORT` with the port configured in the backend.

The actual API prefix and category route paths must be verified from the Express route definitions and server configuration.

## 4. Authentication and Authorization

Category access must follow the application's approved access policy.

Possible policies include:

| Operation | Intended access policy |
|---|---|
| List public categories | Public or authenticated access, according to requirements |
| Retrieve a category | Public or authenticated access, according to requirements |
| Create a category | Administrator-only, if required by the approved policy |
| Update a category | Administrator-only, if required by the approved policy |
| Delete a category | Administrator-only, subject to relationship safeguards |

These policies are recommendations and are not confirmation of the current middleware configuration.

Authorization must be enforced on the server. Hiding category-management controls in the frontend does not prevent unauthorized API requests.

## 5. Conceptual Category Data Model

A category record may contain the following fields, depending on the verified database schema:

| Field | Purpose |
|---|---|
| `id` | Unique category identifier |
| `name` | Category display name |
| `description` | Optional category description |
| `created_at` | Creation timestamp, if supported |
| `updated_at` | Last modification timestamp, if supported |

The actual field names, data types, constraints, defaults, and timestamp behavior must match the existing MySQL schema.

Do not assume that every conceptual field exists in the implementation.

## 6. List Categories

### Purpose

Retrieve the categories available to the requester.

**Illustrative request**

```http
GET /api/v1/categories
```

### Expected behavior

The endpoint should:

1. Apply the configured access policy.
2. Retrieve the categories permitted for display.
3. Return a consistent response structure.
4. Handle an empty result set.
5. Use an appropriate ordering rule if one is defined.

### Illustrative response

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Science",
      "description": "Science-related books."
    },
    {
      "id": 2,
      "name": "History",
      "description": "History-related books."
    }
  ]
}
```

The example is illustrative and does not establish the actual response schema or category records.

### Possible status codes

- `200 OK` — request processed successfully.
- `401 Unauthorized` — authentication is required but missing or invalid.
- `403 Forbidden` — access is not permitted.
- `500 Internal Server Error` — unexpected server failure.

Use only status codes consistent with the verified API contract.

## 7. Retrieve a Category

### Purpose

Retrieve one category by its identifier.

**Illustrative request**

```http
GET /api/v1/categories/:categoryId
```

### Expected behavior

- Validate the category identifier.
- Confirm that the category exists.
- Return the permitted category fields.
- Handle missing or inaccessible categories consistently.

### Possible status codes

- `200 OK` — category retrieved.
- `400 Bad Request` — malformed identifier, where applicable.
- `401 Unauthorized` — authentication required.
- `403 Forbidden` — access denied.
- `404 Not Found` — category not found or unavailable.
- `500 Internal Server Error` — unexpected server failure.

The actual route and response behavior must be verified against the backend.

## 8. Create a Category

### Purpose

Create a category when category creation is supported.

**Illustrative request**

```http
POST /api/v1/categories
Content-Type: application/json
```

Example request body:

```json
{
  "name": "Psychology",
  "description": "Books related to psychology."
}
```

The accepted fields and required values must match the current validator and database schema.

### Expected behavior

The backend should:

1. Authenticate the requester when required.
2. Enforce the applicable role and permission checks.
3. Validate the request body.
4. Normalize category names according to the approved rules.
5. Enforce applicable uniqueness constraints.
6. Insert the record using parameterized database operations.
7. Return the created category in the established response format.

### Possible status codes

- `201 Created` — category created.
- `400 Bad Request` — invalid input.
- `401 Unauthorized` — authentication required.
- `403 Forbidden` — insufficient permissions.
- `409 Conflict` — duplicate or conflicting category, if applicable.
- `500 Internal Server Error` — unexpected server failure.

These are possible contract choices rather than verified implementation results.

## 9. Update a Category

### Purpose

Update permitted fields of an existing category.

**Illustrative request**

```http
PATCH /api/v1/categories/:categoryId
Content-Type: application/json
```

Example request body:

```json
{
  "name": "Updated Category Name",
  "description": "Updated category description."
}
```

### Expected behavior

- Validate the category identifier.
- Confirm that the category exists.
- Enforce authorization.
- Validate supplied fields.
- Reject fields that the requester is not permitted to modify.
- Preserve unchanged fields during a partial update.
- Handle name conflicts.
- Return a consistent response.

If the implementation uses `PUT` instead of `PATCH`, document the actual method and its semantics.

## 10. Delete a Category

### Purpose

Delete a category only when the operation is supported and the requester is authorized.

**Illustrative request**

```http
DELETE /api/v1/categories/:categoryId
```

### Expected behavior

Before deletion, the backend should consider:

- Whether the category exists.
- Whether the requester has permission.
- Whether books reference the category.
- Whether the schema uses foreign-key constraints.
- Whether category associations should be removed or reassigned.
- Whether archival is preferable to permanent deletion.

Deleting a category must not unintentionally delete associated books.

If the category is still referenced, the application should follow an explicit policy, such as rejecting the deletion, requiring reassignment, or performing an approved relationship update.

### Possible status codes

- `200 OK` — operation completed with a response body.
- `204 No Content` — operation completed without a response body.
- `400 Bad Request` — invalid or prohibited operation.
- `401 Unauthorized` — authentication required.
- `403 Forbidden` — operation not permitted.
- `404 Not Found` — category not found.
- `409 Conflict` — existing relationships prevent deletion.
- `500 Internal Server Error` — unexpected failure.

The final response behavior must match the implemented endpoint.

## 11. Category and Book Relationships

A category may be associated with one or more books.

The project may implement this relationship using a direct category reference in a book record or a separate relationship table.

The actual relationship must be determined from the database schema and backend code.

Relationship operations should:

- Validate referenced category and book identifiers.
- Prevent duplicate associations where applicable.
- Preserve referential integrity.
- Apply the appropriate authorization policy.
- Avoid deleting unrelated records.
- Handle missing records consistently.

The Categories API should remain consistent with the Books API and the documented database design.

## 12. Search and Filtering

If category search or filtering is implemented, the API should define the supported query parameters.

Potential capabilities include:

- Searching category names.
- Filtering books by category.
- Sorting categories.
- Paginating large category collections.

An illustrative request for filtering books is:

```http
GET /api/v1/books?categoryId=1
```

The parameter name and behavior must be verified before use.

Search and filtering must enforce the same visibility and access restrictions as ordinary book retrieval.

## 13. Validation Requirements

Category requests should validate:

- Required fields.
- Category identifier format.
- Category name length.
- Description length, if supported.
- Correct field types.
- Duplicate names under the applicable comparison rules.
- Unexpected or disallowed fields.
- Related book or category identifiers where applicable.

Validation rules must match the current validators and approved requirements.

Database constraints should reinforce data integrity where appropriate.

## 14. Error Response Format

Where consistent with the existing API conventions, an error response may follow this illustrative structure:

```json
{
  "success": false,
  "message": "Category not found."
}
```

The actual application's response format takes precedence.

Error responses should use suitable HTTP status codes and must not expose SQL statements, stack traces, credentials, or internal secrets.

## 15. Database and Security Requirements

Category-related operations should follow these principles:

- Use parameterized SQL queries.
- Validate identifiers and request fields.
- Enforce authentication and authorization.
- Maintain valid book-category relationships.
- Apply uniqueness constraints where required.
- Use transactions when multiple dependent changes must succeed together.
- Avoid exposing unnecessary database fields.
- Handle constraint violations consistently.
- Record useful diagnostic information without logging secrets.

These principles describe expected controls and do not establish that every control is currently implemented.

## 16. Testing Requirements

Test each category operation that exists in the backend.

Recommended scenarios include:

1. Retrieve the category list.
2. Retrieve an existing category.
3. Request a nonexistent category.
4. Create a category with valid data, if supported.
5. Reject invalid category data.
6. Attempt to create a duplicate category.
7. Update a category, if supported.
8. Reject unauthorized changes.
9. Delete an unused category, if supported.
10. Attempt to delete a category referenced by books.
11. Verify book-category relationships.
12. Verify that deletion does not remove unrelated books.
13. Confirm database errors are handled safely.
14. Confirm that access restrictions are enforced.

For each executed test, record the request, expected result, actual result, environment, and evidence.

Do not mark unexecuted tests as passed.

## 17. Manual Testing with PowerShell

After confirming the actual route and port, an implemented category endpoint can be tested using PowerShell.

Example template:

```powershell
$baseUrl = "http://localhost:PORT/api/v1"

Invoke-RestMethod `
    -Method Get `
    -Uri "$baseUrl/categories"
```

Replace `PORT` and `/categories` with the values confirmed from the current backend.

For protected operations, supply authentication through the mechanism actually supported by the application. Do not expose real credentials or tokens in shared logs.

## 18. Implementation Verification Checklist

Before treating this document as the final API reference, verify:

- [ ] Category routes and HTTP methods exist.
- [ ] Route prefixes match the Express configuration.
- [ ] Request fields match the validators.
- [ ] Response structures match the controllers and services.
- [ ] Category fields match the MySQL schema.
- [ ] Category-name uniqueness rules are confirmed.
- [ ] Book-category relationships are documented accurately.
- [ ] Authentication and authorization rules are verified.
- [ ] Delete behavior is safe for referenced categories.
- [ ] Error response formats and status codes are confirmed.
- [ ] Relevant API tests have been executed.

Mark unsupported operations as planned or remove them from the implemented endpoint reference.

## 19. Conclusion

The Categories API defines the responsibilities for organizing library content into categories and maintaining their relationships with books.

The final API contract must match the actual Express routes, backend logic, validators, database schema, authorization policy, and test evidence.

Illustrative endpoints and response examples in this document must not be interpreted as proof that the corresponding operations are already implemented.

## 20. Related Documentation

- `README.md`
- `books.md`
- `authors.md`
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

## 21. Maintenance

Update this document whenever category routes, request or response schemas, database relationships, access policies, or supported operations change.

Record implementation status only when supported by current source code and test evidence.
