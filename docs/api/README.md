# Digital Library API Documentation

## 1. Overview

This directory contains API documentation for the Digital Library application.

The project uses HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL. The backend follows a monolithic architecture.

The API provides the interface through which the frontend communicates with backend functionality, including authentication, book management, content organization, and other supported application operations.

**Important:** This directory documents intended API behavior and verified implementation details. An endpoint must not be considered implemented merely because it appears in documentation. Confirm endpoint paths, HTTP methods, request fields, response formats, and access rules against the current source code.

## 2. API Documentation Index

| Document | Purpose |
|---|---|
| `auth.md` | Authentication-related operations |
| `authors.md` | Author information and management |
| `books.md` | Book retrieval, discovery, and management |
| `categories.md` | Category retrieval and management |
| `chapters.md` | Chapter retrieval and management |
| `private-library.md` | User-specific library resources |
| `users.md` | User information and management |

The listed documents describe their respective areas. Their presence does not establish that every described endpoint exists in the current backend.

## 3. Base URL

The local development base URL follows this general pattern:

```text
http://localhost:PORT/api/v1
```

Replace `PORT` with the actual backend port.

The route prefix must be verified against the Express application configuration. If the application uses a different prefix, update this documentation accordingly.

## 4. HTTP Methods

The API may use the following HTTP methods, depending on the implemented routes.

| Method | Typical purpose |
|---|---|
| `GET` | Retrieve resources |
| `POST` | Create a resource or perform an operation |
| `PUT` | Replace a resource or its supported representation |
| `PATCH` | Partially update a resource |
| `DELETE` | Delete a resource or relationship |

The actual method for each operation must be taken from the route definitions.

## 5. Authentication

Protected endpoints require the authentication mechanism configured by the backend.

Depending on the implementation, authentication may use a token, a session, a cookie, or another documented mechanism.

Clients must not assume that an illustrative authentication mechanism is supported until it has been verified.

Authentication documentation is maintained in `auth.md`.

Security requirements include:

- Never return passwords or password hashes.
- Never expose authentication secrets in frontend source code.
- Protect credentials during transmission.
- Reject invalid authentication on protected routes.
- Enforce authorization separately from authentication.
- Avoid logging passwords, live tokens, or other secrets.

## 6. Authorization and Roles

The project defines two intended application roles:

- `USER`
- `ADMIN`

Authentication identifies the requester. Authorization determines which operations the requester may perform.

The final permissions for each operation must be based on the approved requirements and actual middleware configuration.

Potential authorization rules include:

- Restricting administrative operations.
- Protecting private library resources.
- Checking access to restricted books and chapters.
- Validating ownership before modifying user-specific data.

A frontend control being hidden does not replace server-side authorization.

## 7. Request Format

Where supported by an endpoint, JSON requests typically use the following header:

```http
Content-Type: application/json
```

Illustrative JSON body:

```json
{
  "title": "Example Book",
  "description": "Illustrative book description."
}
```

The accepted request fields depend on the specific endpoint and its validators.

Clients should not submit unsupported fields or assume that optional fields are accepted.

## 8. Response Format

The actual response format is defined by the backend implementation.

An illustrative successful response is:

```json
{
  "success": true,
  "data": {}
}
```

An illustrative error response is:

```json
{
  "success": false,
  "message": "The request could not be processed."
}
```

These examples are not a verified global response contract. Existing controllers and error-handling middleware determine the actual structure.

API responses should use appropriate HTTP status codes and must not expose sensitive internal details.

## 9. Common HTTP Status Codes

| Status code | General meaning |
|---|---|
| `200 OK` | Request completed successfully |
| `201 Created` | Resource created |
| `204 No Content` | Request completed without a response body |
| `400 Bad Request` | Request is invalid |
| `401 Unauthorized` | Authentication is missing or invalid |
| `403 Forbidden` | Requester is not permitted to perform the operation |
| `404 Not Found` | Resource is unavailable or not found |
| `409 Conflict` | Request conflicts with an existing state |
| `413 Content Too Large` | Request exceeds a configured size limit |
| `415 Unsupported Media Type` | Request uses an unsupported media type |
| `422 Unprocessable Content` | Request content fails applicable semantic validation |
| `429 Too Many Requests` | Rate limit exceeded |
| `500 Internal Server Error` | Unexpected server failure |

These are general HTTP meanings. The actual status codes used by each endpoint must be verified.

## 10. Backend Architecture

The backend is intended to use a monolithic architecture.

Where applicable, its logical request flow is:

```text
HTTP Request
     |
     v
Express Route
     |
     v
Middleware
     |
     v
Controller
     |
     v
Service
     |
     v
Repository
     |
     v
MySQL
```

Not every endpoint must use every layer. The actual source code determines the implemented flow.

The project does not require microservices.

## 11. Database Interaction

MySQL is the approved relational database technology.

API operations that access the database should:

- Use parameterized SQL queries.
- Validate identifiers and request fields.
- Preserve referential integrity.
- Apply suitable database constraints.
- Handle missing records consistently.
- Use transactions when multiple dependent changes must succeed together.
- Avoid exposing database credentials or internal query details.

The actual schema is documented separately in the technical documentation.

## 12. Input Validation

Request validation should occur on the server.

Depending on the endpoint, validation may include:

- Required fields.
- Data types.
- Identifier formats.
- Field lengths.
- Supported enumerated values.
- Query parameters.
- Request-body size.
- Relationships between resources.
- Resource ownership and permissions.

Frontend validation improves usability but cannot replace backend validation.

## 13. Error Handling

The API should handle expected errors consistently.

Examples include:

- Invalid request data.
- Missing resources.
- Invalid authentication.
- Insufficient permissions.
- Database constraint violations.
- Rate-limit violations.
- Unexpected internal failures.

Error responses should avoid exposing stack traces, SQL statements, passwords, tokens, or private content.

Secure server-side logging should provide enough information to diagnose problems without unnecessarily recording sensitive information.

## 14. Security Requirements

The API should be reviewed for:

- Authentication correctness.
- Role-based authorization.
- Resource ownership checks.
- SQL injection prevention.
- Input validation.
- Password security.
- Token or session lifecycle management.
- Rate limiting.
- CORS configuration.
- Secure environment configuration.
- File-upload validation where applicable.
- Safe error handling.
- Private-content access restrictions.

The presence of security middleware does not prove that every endpoint is secure. Each relevant control must be reviewed and tested.

Detailed security documentation is maintained in the `../security/` directory.

## 15. API Testing

API testing should verify both expected behavior and failure conditions.

Recommended coverage includes:

1. Successful requests.
2. Invalid request bodies.
3. Missing required fields.
4. Invalid identifiers.
5. Missing or invalid authentication.
6. Unauthorized role access.
7. Resource ownership violations.
8. Missing resources.
9. Duplicate or conflicting operations.
10. Database failure handling.
11. Rate limiting.
12. Regression testing after changes.

Testing should use the actual implemented routes and schemas.

Each test record should identify the tested build, request, expected response, actual response, and result.

Do not report tests as passed unless they have been executed and evidence is available.

## 16. Manual Testing with PowerShell

PowerShell can be used to test API endpoints without a separate graphical API client.

Illustrative example:

```powershell
$baseUrl = "http://localhost:PORT/api/v1"

Invoke-RestMethod `
    -Method Get `
    -Uri "$baseUrl/books"
```

Replace the port and route with the values verified in the current backend.

For JSON requests, use `ConvertTo-Json` and set the appropriate content type. For protected endpoints, provide authentication using the mechanism actually supported by the application.

Do not paste real credentials or tokens into shared documentation.

## 17. API Change Management

When an endpoint changes, update the relevant API document and test cases.

Changes may include:

- Route path.
- HTTP method.
- Request schema.
- Response schema.
- Validation rules.
- Authorization requirements.
- Database relationships.
- Error status codes.
- Pagination or filtering behavior.

Changes affecting the frontend, backend, and database should be coordinated before integration.

Significant changes should be recorded in the project change-request log.

## 18. Implementation Verification Checklist

Before treating the API documentation as complete, verify:

- [ ] The documented routes exist in the current backend.
- [ ] HTTP methods and route prefixes are correct.
- [ ] Request schemas match the validators.
- [ ] Response schemas match the implementation.
- [ ] Authentication requirements are accurate.
- [ ] Authorization rules are enforced server-side.
- [ ] Database relationships match the actual schema.
- [ ] Error status codes are confirmed.
- [ ] Security-sensitive operations have relevant tests.
- [ ] Documentation matches the tested version.

Unsupported or unverified endpoints should be marked as planned rather than implemented.

## 19. Related Documentation

- `auth.md`
- `authors.md`
- `books.md`
- `categories.md`
- `chapters.md`
- `private-library.md`
- `users.md`
- `../03-technical/api-specification.md`
- `../03-technical/architecture.md`
- `../03-technical/database-design.md`
- `../05-security/security-design.md`
- `../06-development/coding-standards.md`
- `../07-testing/test-cases.md`
- `../07-testing/testing-strategy.md`

## 20. Maintenance

Review this index whenever API documentation files are added, renamed, or removed.

Keep this directory aligned with the current source code, documented requirements, and test evidence. Do not treat the presence of an API document as proof that its described functionality is implemented.
