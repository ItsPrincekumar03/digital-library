# Error Handling and Security

## 1. Purpose

This document defines secure error-handling requirements for the Digital Library application.

The project uses HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL within a monolithic architecture.

Secure error handling ensures that failures are communicated consistently without exposing sensitive information, leaking implementation details, or leaving application operations in an inconsistent state.

**Implementation status:** This document describes expected behavior and verification criteria. Actual error middleware, response formats, logging behavior, and status codes must be verified against the current backend source code.

## 2. Scope

This document covers:

- Request validation errors.
- Authentication and authorization failures.
- Database errors.
- Missing routes and resources.
- File-processing errors.
- Upload errors.
- Unexpected server exceptions.
- Logging and diagnostic information.
- Asynchronous error handling.
- Consistent API error responses.

## 3. Security Principles

The application should follow these principles:

1. Return safe, understandable error messages.
2. Never expose stack traces to clients in production.
3. Never expose database credentials, passwords, tokens, or signing secrets.
4. Use appropriate HTTP status codes.
5. Maintain a consistent response structure.
6. Log useful diagnostic information securely.
7. Handle rejected promises and asynchronous errors.
8. Avoid swallowing errors silently.
9. Preserve database consistency when operations fail.
10. Avoid revealing private resource information through error messages.

## 4. Error Categories

The backend should distinguish between expected application errors and unexpected failures.

### 4.1 Validation errors

Examples:

- Missing required fields.
- Invalid identifiers.
- Invalid email format.
- Unsupported field values.
- Invalid pagination parameters.

These errors should produce a client-error response consistent with the API contract.

### 4.2 Authentication errors

Examples:

- Missing credentials.
- Invalid credentials.
- Expired authentication credentials, where applicable.

Protected endpoints should reject these requests using the application's established authentication response format.

### 4.3 Authorization errors

Examples:

- A standard user attempts an administrator-only operation.
- A user attempts to access another user's private resource.
- A user attempts to modify a restricted field.

The backend should deny the operation without exposing unnecessary internal permission details.

### 4.4 Resource errors

Examples:

- Requested book does not exist.
- Requested chapter does not exist.
- Referenced category is unavailable.
- Requested private resource is inaccessible.

Use a consistent policy for distinguishing missing resources from inaccessible resources.

### 4.5 Database errors

Examples:

- Database connection failure.
- Constraint violation.
- Duplicate unique value.
- Foreign-key violation.
- Query execution failure.

Database-specific details should be retained only in appropriately protected server-side diagnostics.

### 4.6 Unexpected errors

Examples:

- An unhandled exception.
- An unexpected dependency failure.
- An unforeseen programming error.

Return a generic server-error response and record appropriate diagnostic information.

## 5. HTTP Status Codes

The following status codes are recommended. The actual API should use a consistent policy.

| Status | Meaning | Example |
|---|---|---|
| `200 OK` | Successful request | Resource retrieved |
| `201 Created` | Resource created | Book created |
| `204 No Content` | Successful request with no response body | Resource deleted, if supported |
| `400 Bad Request` | Invalid request | Malformed input |
| `401 Unauthorized` | Authentication required or invalid | Missing credentials |
| `403 Forbidden` | Permission denied | Unauthorized administrative operation |
| `404 Not Found` | Resource or route unavailable | Missing book |
| `409 Conflict` | State or uniqueness conflict | Duplicate value |
| `413 Content Too Large` | Request or upload exceeds the configured limit | Oversized upload |
| `415 Unsupported Media Type` | Unsupported request media type | Invalid upload content type |
| `422 Unprocessable Content` | Semantically invalid input, if used by the API | Invalid field combination |
| `429 Too Many Requests` | Rate limit exceeded | Repeated requests |
| `500 Internal Server Error` | Unexpected server failure | Unhandled application error |
| `503 Service Unavailable` | Service temporarily unavailable | Planned temporary database-dependent outage |

Do not return a success status when an operation failed.

Use only status codes appropriate to the actual request and established API conventions.

## 6. Standard Error Response

Where consistent with the existing API, an error response may follow this illustrative format:

```json
{
  "success": false,
  "message": "The requested resource could not be found."
}
```

The application may use a different established structure. Do not introduce a new response format without updating the API contract and clients.

A structured response may optionally include a stable application error code or safe field-validation details.

Avoid returning internal exception messages directly to the client.

## 7. Express.js Error Middleware

Express applications commonly use centralized error middleware.

The following is an illustrative example, not a claim about the current implementation.

```javascript
function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const statusCode =
    Number.isInteger(err.statusCode) &&
    err.statusCode >= 400 &&
    err.statusCode < 600
      ? err.statusCode
      : 500;

  const message =
    statusCode >= 500
      ? "An unexpected server error occurred."
      : err.publicMessage || "The request could not be completed.";

  // Log safe diagnostic information using the application's
  // established logging mechanism. Do not log secrets.
  console.error({
    message: err.message,
    statusCode,
    path: req.originalUrl,
    method: req.method
  });

  return res.status(statusCode).json({
    success: false,
    message
  });
}
```

Before adopting this example:

- Confirm the application's established error-response format.
- Avoid logging raw request bodies or authorization headers.
- Sanitize user-controlled log values where appropriate.
- Use the project's logger if one exists.
- Ensure production responses do not expose stack traces.
- Confirm the middleware is registered in the appropriate position.

The example is a starting point, not a replacement for reviewing the existing middleware.

## 8. Middleware Order

Error-handling middleware must be integrated correctly with the Express middleware stack.

A typical conceptual order is:

1. Security and request-parsing middleware.
2. CORS configuration, where applicable.
3. Authentication and authorization middleware as required.
4. API routes.
5. Not-found handling.
6. Centralized error handling.

The precise order depends on the application's existing architecture.

Error middleware in Express uses the error-handler signature with four parameters:

```javascript
(err, req, res, next)
```

A not-found handler should not be confused with the centralized error handler.

Verify the actual middleware order before changing the application.

## 9. Asynchronous Errors

Asynchronous operations may fail while executing database queries, file processing, or other application services.

Requirements:

- Handle rejected promises.
- Forward errors to the established error-handling mechanism.
- Avoid unhandled promise rejections.
- Avoid sending multiple responses for a single request.
- Ensure failed operations do not appear successful.
- Handle errors from database and file-system operations.
- Follow the behavior supported by the installed Express version.

The exact pattern depends on the project's Node.js and Express versions and existing controller conventions.

## 10. Database Error Handling

Database errors should be mapped to safe application-level responses where appropriate.

Examples:

- Duplicate-key errors may map to a conflict response.
- Foreign-key violations may indicate invalid relationships.
- Connection failures may require a temporary service-error response.
- Unexpected query errors should produce a generic server-error response.

Requirements:

- Do not return raw SQL statements.
- Do not expose database hostnames, usernames, or passwords.
- Do not expose driver stack traces.
- Preserve useful diagnostics in secure logs.
- Use transactions for operations that require atomic updates.
- Roll back transactions when appropriate after failure.
- Avoid retrying non-idempotent operations blindly.

The mapping must match the actual database driver and application's error conventions.

## 11. Authentication and Authorization Errors

Authentication and authorization failures must be handled separately from unexpected server failures.

Requirements:

- Use `401 Unauthorized` for missing or invalid authentication where appropriate.
- Use `403 Forbidden` when the user is authenticated but lacks permission, according to the application's policy.
- Avoid returning authentication secrets.
- Avoid exposing internal role checks.
- Apply the approved resource-concealment policy where appropriate.
- Ensure failed authorization checks do not modify data.

Error messages should provide enough information for legitimate users to understand the failure without disclosing sensitive details.

## 12. Validation Errors

Validation failures should identify invalid input safely.

Example:

```json
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

This response is illustrative. Use the application's established response schema.

Validation responses should not contain:

- Stack traces.
- SQL statements.
- Internal filesystem paths.
- Environment configuration.
- Authentication secrets.
- Unnecessary internal validation details.

Validation must occur on the backend even if the frontend already validates the same fields.

## 13. File and Upload Errors

If file-upload functionality is implemented, errors may arise from:

- Missing files.
- Unsupported file formats.
- Oversized requests.
- Invalid content.
- Storage permission failures.
- Disk-space exhaustion.
- File-processing failures.

Requirements:

- Enforce configured size limits.
- Validate the file according to the approved upload policy.
- Avoid exposing internal storage paths.
- Clean up temporary files when appropriate.
- Avoid leaving database records that point to incomplete files.
- Protect private file contents from unauthorized access.
- Return safe, consistent error messages.

Do not claim that a particular file format or upload workflow is supported until the current implementation confirms it.

## 14. Logging and Sensitive Data

Server-side logging should support debugging and security investigations without exposing secrets.

Never log:

- Plaintext passwords.
- Password hashes.
- Authentication tokens.
- Session secrets.
- Database passwords.
- Private signing keys.
- Unnecessary private document contents.

Avoid logging full request bodies for authentication or sensitive account operations.

Useful diagnostic fields may include:

- Timestamp.
- Request method.
- Sanitized route.
- HTTP status.
- Safe application error code.
- A request or correlation identifier, if implemented.

Protect access to logs and define suitable retention policies.

## 15. Production Error Handling

Production clients should receive generic messages for unexpected server failures.

Requirements:

- Disable stack-trace exposure.
- Avoid sending internal exception messages.
- Avoid revealing environment configuration.
- Use secure server-side diagnostics.
- Handle unavailable dependencies safely.
- Return the correct HTTP status.
- Prevent a failed request from leaving inconsistent state.

Detailed diagnostics should remain in protected server logs rather than public API responses.

## 16. Database Consistency

Errors during multi-step operations can leave related records inconsistent if partial changes are committed.

For operations that require atomicity:

- Use appropriate database transactions.
- Commit only after all required steps succeed.
- Roll back on failure.
- Handle rollback failures safely.
- Keep file and database operations consistent through an explicit recovery strategy where necessary.

Examples may include creating a book and its relationships or creating a chapter and updating related metadata.

Use transactions only where supported and appropriate to the actual database operations.

## 17. Testing Requirements

Test the error-handling behavior of implemented endpoints.

Recommended scenarios:

1. Submit malformed JSON.
2. Submit missing required fields.
3. Use an invalid identifier.
4. Request a nonexistent resource.
5. Access a protected route without authentication.
6. Attempt an unauthorized operation.
7. Trigger a duplicate-value conflict.
8. Trigger an invalid foreign-key relationship.
9. Simulate a database connection failure in a safe test environment.
10. Submit an oversized request where limits are configured.
11. Verify unsupported content types are handled correctly.
12. Confirm unexpected errors do not expose stack traces.
13. Confirm sensitive information is not logged.
14. Verify failed operations do not leave inconsistent records.
15. Confirm each request produces at most one response.

Record actual results and evidence. Do not report tests as passed unless they have been executed.

## 18. Manual Testing with PowerShell

Use the actual backend URL and endpoint paths.

Example request for an intentionally invalid route:

```powershell
$baseUrl = "http://localhost:PORT/api/v1"

try {
    Invoke-RestMethod `
        -Method Get `
        -Uri "$baseUrl/REPLACE_WITH_NONEXISTENT_ROUTE"
}
catch {
    $response = $_.Exception.Response

    if ($null -ne $response) {
        Write-Host "HTTP status: $([int]$response.StatusCode)"
    }

    Write-Host "Request failed as expected for this test."
}
```

Replace placeholders with verified values.

A failed request is not automatically proof of correct error handling. Confirm the expected status code and safe response structure.

## 19. Implementation Verification Checklist

- [ ] Standard error-response format is documented.
- [ ] Not-found handling is separate from error middleware.
- [ ] Error middleware is registered correctly.
- [ ] Asynchronous failures are handled.
- [ ] Database errors are mapped safely.
- [ ] Authentication and authorization errors are consistent.
- [ ] Validation errors do not expose internals.
- [ ] Upload errors are handled safely where applicable.
- [ ] Production responses do not expose stack traces.
- [ ] Sensitive information is excluded from logs.
- [ ] Multi-step operations preserve data consistency.
- [ ] Relevant tests have been executed.

## 20. Related Documentation

- `authentication.md`
- `authorization.md`
- `environment.md`
- `validation.md`
- `sql-injection.md`
- `cors.md`
- `file-upload-prep.md`
- `../api/README.md`
- `../03-technical/api-specification.md`
- `../03-technical/architecture.md`
- `../07-testing/test-cases.md`
- `../07-testing/security-testing.md`

## 21. Maintenance

Update this document when the Express middleware stack, API response format, database error mapping, logging behavior, upload handling, or production error policy changes.

Keep documented behavior aligned with the current backend implementation and executed test evidence.
