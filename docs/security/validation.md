# Input Validation Security

## 1. Purpose

This document defines input-validation requirements for the Digital Library application.

The application uses HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL within a monolithic architecture.

Input validation ensures that incoming data follows the expected format, type, length, and business rules before the application processes or stores it.

**Implementation status:** This document defines security requirements and verification criteria. Actual validators, accepted fields, validation libraries, and route coverage must be verified against the current backend source code.

## 2. Scope

Input validation applies to:

- User registration and login.
- User profile operations.
- Books and book relationships.
- Authors and categories.
- Chapters and chapter ordering.
- Search, filtering, and pagination.
- Private-library metadata.
- File uploads, where implemented.
- Administrative operations.
- Query parameters, URL parameters, and request bodies.

## 3. Core Principles

The application should:

1. Validate all untrusted input on the backend.
2. Use explicit validation rules for each operation.
3. Reject malformed or unsupported values.
4. Enforce maximum input lengths and request sizes.
5. Validate data types and formats.
6. Validate business rules and resource relationships.
7. Reject unauthorized changes to restricted fields.
8. Use parameterized SQL queries.
9. Return consistent and safe validation errors.
10. Avoid relying exclusively on frontend validation.

Validation reduces invalid input but does not replace authentication, authorization, SQL parameterization, or output encoding.

## 4. Validation Locations

Different input sources require different checks.

| Input source | Examples | Required checks |
|---|---|---|
| Request body | Book title, user profile | Required fields, types, lengths, permitted fields |
| URL parameters | Book ID, chapter ID | Identifier format and existence where needed |
| Query parameters | Search, page, limit | Type, range, allowed filters |
| Authentication data | Login credentials | Required fields and credential verification |
| File uploads | PDF documents, if supported | Size, allowed type, content checks |
| Related-resource IDs | Author or category IDs | Format, existence, applicable permissions |

Every value must be treated as untrusted until validated by the backend.

## 5. Request Body Validation

Request bodies should be validated against the expected schema for the relevant endpoint.

Requirements:

- Check required fields.
- Verify field types.
- Enforce minimum and maximum lengths.
- Reject invalid formats.
- Define behavior for unexpected fields.
- Avoid silently accepting protected fields.
- Validate nested objects where supported.
- Handle missing or malformed JSON safely.

The permitted fields must match the endpoint's actual request contract.

For example, a book-creation request should accept only the fields approved for creating a book. It should not automatically accept administrative properties or ownership changes.

## 6. String Validation

String inputs may include titles, descriptions, names, usernames, and search terms.

Recommended checks:

- Define maximum lengths.
- Define required or optional status.
- Reject values containing only whitespace where inappropriate.
- Normalize values only where the business rules require it.
- Preserve valid Unicode text where supported.
- Avoid truncating input silently.
- Apply appropriate output encoding when displaying stored values.

Do not remove arbitrary characters simply because they look unusual. Validation should follow explicit product requirements.

The actual length limits must match the approved requirements and database column definitions.

## 7. Numeric Identifier Validation

Identifiers used in routes, request bodies, and query parameters must be validated before database operations.

Requirements:

- Verify the expected identifier format.
- Reject malformed values.
- Avoid accepting unexpected arrays or objects where a scalar identifier is required.
- Confirm resource existence where appropriate.
- Apply authorization and ownership checks separately.
- Handle missing related resources consistently.

A valid identifier does not prove that the requester has permission to access the corresponding resource.

The actual identifier format must match the MySQL schema and API contract.

## 8. Query Parameter Validation

Search and listing endpoints may accept query parameters such as:

- Search terms.
- Page numbers.
- Page sizes.
- Sort fields.
- Sort directions.
- Category filters.
- Author filters.

Requirements:

- Validate numeric values.
- Enforce reasonable maximum page sizes.
- Reject negative or invalid pagination values.
- Restrict sort fields to an explicit allowlist.
- Restrict sort directions to supported values.
- Validate filter identifiers.
- Apply safe defaults where approved.
- Use parameterized queries for values.

Never insert arbitrary user-provided SQL fragments into query construction.

## 9. Authentication Input Validation

Authentication endpoints should validate the structure of submitted credentials.

Requirements:

- Reject missing required fields.
- Validate expected field types.
- Enforce appropriate input-length limits.
- Avoid logging passwords.
- Use safe error responses.
- Apply authentication-specific abuse controls.
- Verify passwords through the configured password-hashing library.

Input validation alone does not authenticate a user. Credential verification must still occur.

See `authentication.md` and `password-security.md` for related requirements.

## 10. Authorization and Restricted Fields

Validation must be combined with authorization.

The backend should prevent unauthorized modification of fields such as:

- User roles.
- Resource ownership.
- Administrative flags.
- Publication status, where restricted.
- Other protected system-managed values.

The exact protected fields depend on the current schema and requirements.

A field can be correctly typed and still be unauthorized for the requester to modify.

Use operation-specific allowlists of permitted fields rather than automatically accepting every property in the incoming request.

## 11. Relationship Validation

Content operations may reference other records.

Examples include:

- A chapter referencing a book.
- A book referencing an author.
- A book referencing a category.
- A private-library resource referencing a user, if supported.

Requirements:

1. Validate the identifier format.
2. Confirm the referenced record exists.
3. Enforce the relevant authorization rules.
4. Verify any required relationship constraints.
5. Handle missing or invalid references safely.
6. Preserve database integrity.

The actual relationship rules must match the current database schema.

Database foreign-key constraints provide an additional integrity layer but do not replace application-level authorization checks.

## 12. File Upload Validation

If upload functionality is implemented, validate files independently of ordinary text fields.

Requirements may include:

- Enforce a maximum file size.
- Allow only approved file types.
- Check file signatures or content where appropriate.
- Reject malformed files.
- Generate safe storage names.
- Prevent path traversal.
- Protect private files.
- Handle processing errors safely.

The client-provided file extension and MIME type must not be trusted alone.

See `file-upload-prep.md` for detailed upload-security requirements.

## 13. SQL Injection Prevention

Validation must not be treated as the primary defense against SQL injection.

Requirements:

- Use parameterized queries.
- Avoid unsafe SQL string concatenation.
- Validate dynamic sort fields through allowlists.
- Review search and filtering queries.
- Avoid exposing database errors to clients.

Even validated values must be passed to the database through safe query APIs.

See `sql-injection.md` for detailed requirements.

## 14. Cross-Site Scripting Prevention

Valid input can still contain text that is unsafe to insert directly into HTML.

Requirements:

- Treat stored and submitted content as untrusted.
- Escape output according to its context.
- Avoid unsafe HTML insertion.
- Sanitize content if rich HTML is intentionally supported.
- Apply suitable Content Security Policy settings.
- Test user-controlled book descriptions and chapter content where applicable.

Input validation does not replace output encoding or HTML sanitization.

See `xss.md` for additional guidance.

## 15. Validation Error Responses

Validation errors should be clear, consistent, and safe.

Illustrative response:

```json id="c23e5p"
{
  "success": false,
  "message": "Validation failed.",
  "errors": [
    {
      "field": "title",
      "message": "Title is required."
    }
  ]
}
```

The actual response must follow the existing API conventions.

Requirements:

- Use an appropriate client-error status code.
- Identify invalid fields where useful.
- Avoid returning stack traces.
- Avoid exposing SQL statements or internal paths.
- Avoid echoing sensitive values.
- Do not disclose passwords, tokens, or password hashes.

## 16. Validation Library and Implementation

The project may use custom validation functions or a validation library.

Before changing validation behavior:

- Inspect the existing validators.
- Confirm the installed dependencies.
- Follow the project's established error format.
- Avoid duplicating conflicting validation rules.
- Keep controller and service responsibilities consistent.
- Add or update tests for changed validation behavior.

Do not assume that a particular validation library is installed unless the package manifest confirms it.

## 17. Testing Requirements

Test the validation behavior of implemented endpoints.

Recommended scenarios:

1. Submit a valid request.
2. Omit a required field.
3. Submit the wrong data type.
4. Exceed a field's maximum length.
5. Submit whitespace-only values where prohibited.
6. Use malformed identifiers.
7. Reference a nonexistent related record.
8. Submit invalid pagination parameters.
9. Use an unsupported sort field.
10. Attempt to modify a protected field.
11. Submit unexpected fields.
12. Submit malformed JSON.
13. Submit an unsupported file type, if uploads are supported.
14. Test SQL-looking input as ordinary data.
15. Verify validation errors do not reveal internal details.

Record the request, expected result, actual result, and evidence. Do not mark unexecuted tests as passed.

## 18. Manual Testing with PowerShell

Use the actual API route and request schema.

Illustrative example:

```powershell id="6cq2wm"
$baseUrl = "http://localhost:PORT/api/v1"

$body = @{
    title = ""
} | ConvertTo-Json

try {
    Invoke-RestMethod `
        -Method Post `
        -Uri "$baseUrl/REPLACE_WITH_BOOK_ROUTE" `
        -ContentType "application/json" `
        -Body $body
}
catch {
    Write-Host "Validation test response: $($_.Exception.Message)"
}
```

Replace the port, route, and request fields with verified values. Include authentication when the endpoint requires it.

A failed request is not automatically proof of correct validation. Confirm the actual status code and response body.

## 19. Implementation Verification Checklist

- [ ] Request bodies are validated on the backend.
- [ ] URL parameters are validated.
- [ ] Query parameters are validated.
- [ ] String lengths match approved requirements.
- [ ] Identifier formats are validated.
- [ ] Related-resource references are checked.
- [ ] Restricted fields cannot be modified without permission.
- [ ] File validation is applied where uploads exist.
- [ ] Database operations use parameterized queries.
- [ ] Error responses follow the established format.
- [ ] Sensitive values are excluded from errors and logs.
- [ ] Relevant tests have been executed.

## 20. Related Documentation

- `authentication.md`
- `authorization.md`
- `content-model.md`
- `error-handling.md`
- `file-upload-prep.md`
- `password-security.md`
- `sql-injection.md`
- `xss.md`
- `../api/README.md`
- `../api/auth.md`
- `../api/books.md`
- `../api/chapters.md`
- `../03-technical/api-specification.md`
- `../03-technical/database-design.md`
- `../07-testing/security-testing.md`
- `../07-testing/test-cases.md`

## 21. Maintenance

Update this document whenever request schemas, field constraints, validators, API endpoints, database relationships, or business rules change.

Keep documented requirements aligned with the current source code, approved requirements, and executed test evidence.
