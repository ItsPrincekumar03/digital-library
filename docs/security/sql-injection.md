# SQL Injection Prevention

## 1. Purpose

This document defines security requirements for preventing SQL injection in the Digital Library application.

The application uses Node.js, Express.js, and MySQL in a monolithic architecture. The frontend uses HTML, CSS, and Vanilla JavaScript.

SQL injection occurs when untrusted input changes the intended meaning of a database query. It may allow attackers to bypass authentication, access unauthorized records, modify data, or interfere with database operations.

**Implementation status:** This document defines required controls and verification procedures. The actual database driver, query implementation, repository methods, and test results must be verified against the current source code.

## 2. Scope

This document applies to database operations involving:

- User registration and authentication.
- User profile management.
- Books and book relationships.
- Authors and categories.
- Chapters and chapter ordering.
- Private-library metadata.
- Search, filtering, sorting, and pagination.
- Administrative operations.
- Any other feature that queries MySQL.

## 3. Security Objectives

The application should:

1. Use parameterized queries for untrusted values.
2. Avoid building SQL statements through unsafe string concatenation.
3. Validate request data on the backend.
4. Restrict database privileges.
5. Handle database errors safely.
6. Protect authentication and authorization queries.
7. Review dynamic query construction.
8. Test database operations with malicious input.
9. Avoid exposing database details to clients.
10. Maintain data integrity when operations fail.

Input validation is important but does not replace safe query construction.

## 4. Parameterized Queries

Parameterized queries separate SQL instructions from user-supplied values.

Illustrative example using a MySQL driver that supports `?` placeholders:

```javascript
const [rows] = await db.execute(
  "SELECT id, title FROM books WHERE id = ?",
  [bookId]
);
```

The placeholder represents a value supplied separately from the SQL statement.

The example is illustrative. Verify the database library and query conventions used by the current project before adopting it.

### Requirements

- Bind user-controlled values as parameters.
- Use the supported parameterized-query API.
- Avoid concatenating user input into SQL statements.
- Apply the same principle to `SELECT`, `INSERT`, `UPDATE`, and `DELETE`.
- Review queries inside repositories and services.
- Avoid returning raw database errors to API clients.

## 5. Unsafe Query Construction

The following pattern is unsafe:

```javascript
const sql =
  "SELECT * FROM books WHERE title = '" + title + "'";
```

If `title` contains SQL syntax, it may alter the query's intended meaning.

Prefer a parameterized query:

```javascript
const [rows] = await db.execute(
  "SELECT id, title FROM books WHERE title = ?",
  [title]
);
```

Do not assume that escaping quotes manually is an adequate substitute for parameterized queries.

The exact safe-query method depends on the selected MySQL driver and its supported API.

## 6. Authentication Query Security

Authentication queries require particular care because SQL injection may bypass account checks or expose credential-related information.

Requirements:

- Use parameterized queries when retrieving account records.
- Never concatenate submitted email addresses or usernames into SQL.
- Verify passwords using the application's password-hashing library.
- Keep authentication and authorization checks separate from user input.
- Return safe authentication errors.
- Never expose password hashes or database diagnostics in API responses.

A successful database query does not establish that the supplied credentials are valid. Password verification and the rest of the authentication workflow must still occur.

## 7. Search and Filtering

The Digital Library may provide search across books, authors, categories, or other supported content.

Search operations often involve dynamic conditions and therefore require careful query construction.

Requirements:

- Parameterize search values.
- Validate pagination values.
- Set reasonable maximum page sizes.
- Restrict supported filter fields.
- Restrict supported sort fields and directions.
- Avoid inserting arbitrary user-supplied SQL fragments.
- Review queries that use `LIKE`, joins, ordering, and aggregation.
- Consider query cost and indexing for frequently used searches.

### Dynamic column names

SQL identifiers, such as column names, generally cannot be supplied as ordinary value parameters.

If dynamic sorting is required, use a fixed allowlist.

Illustrative example:

```javascript
const allowedSortColumns = {
  title: "title",
  createdAt: "created_at"
};

const sortColumn = allowedSortColumns[requestedSort];

if (!sortColumn) {
  throw new Error("Unsupported sort field");
}

const [rows] = await db.execute(
  `SELECT id, title FROM books ORDER BY ${sortColumn}`,
  []
);
```

The SQL fragment is selected from fixed application-controlled values rather than copied from arbitrary client input.

The example must be adapted to the project's actual query and error-handling conventions.

## 8. INSERT, UPDATE, and DELETE Operations

All data-changing queries should use safe parameter binding for values.

Illustrative insert:

```javascript
await db.execute(
  "INSERT INTO categories (name) VALUES (?)",
  [categoryName]
);
```

Illustrative update:

```javascript
await db.execute(
  "UPDATE books SET title = ? WHERE id = ?",
  [title, bookId]
);
```

Illustrative delete:

```javascript
await db.execute(
  "DELETE FROM chapters WHERE id = ?",
  [chapterId]
);
```

These examples illustrate query parameterization only. They do not establish the actual table names, columns, ownership rules, or delete behavior of the current application.

Before modifying data, the backend must also validate the request and enforce the appropriate authorization policy.

## 9. ORM and Query Builder Considerations

If an ORM or query builder is used, verify that its APIs are used safely.

Requirements:

- Prefer supported parameterized query methods.
- Avoid unsafe raw-query interpolation.
- Review raw SQL statements.
- Do not assume that an ORM automatically protects every query.
- Review dynamic identifiers and SQL fragments.
- Keep database dependencies appropriately maintained.

The project may use a direct MySQL driver rather than an ORM. Document the actual approach used in the codebase.

## 10. Input Validation

Backend validation should reject malformed or unsupported input before database operations.

Potential validation targets include:

- Numeric identifiers.
- Required strings.
- Maximum string lengths.
- Pagination values.
- Sort fields.
- Search parameters.
- Category and author references.
- Chapter order values.
- Fields permitted in update operations.

Validation reduces invalid input and application errors, but parameterized queries remain necessary even for validated values.

Do not rely on frontend validation as a security boundary.

## 11. Database Permissions

The application's database account should have only the privileges required for its intended operations.

Recommended practices:

- Avoid using a database administrator account for normal application access.
- Grant only required privileges.
- Separate administrative database operations from ordinary application operations where appropriate.
- Protect database credentials.
- Restrict database network access.
- Review production permissions periodically.

The exact privileges depend on the application's deployment, migrations, and operational procedures.

## 12. Error Handling

Database errors should be converted into safe application-level responses.

Requirements:

- Avoid returning raw SQL statements.
- Avoid exposing database usernames, passwords, or host configuration.
- Avoid exposing driver stack traces to clients.
- Map known constraint errors to appropriate application responses.
- Log diagnostic information securely.
- Avoid logging sensitive query parameters unnecessarily.
- Preserve database consistency during failed multi-step operations.

Use the established API response format and status-code conventions.

## 13. Transactions and Data Integrity

Operations involving multiple related database changes may require transactions.

Examples may include:

- Creating a book and associated relationships.
- Creating a chapter and updating related records.
- Performing administrative content changes.
- Updating related records that must remain consistent.

Requirements:

- Use transactions where atomicity is necessary.
- Commit only after required changes succeed.
- Roll back when an operation fails.
- Handle rollback failures safely.
- Avoid retrying non-idempotent operations without a suitable strategy.

Transactions help maintain data integrity but do not replace SQL injection prevention.

## 14. SQL Injection Testing

Security testing should use a dedicated test environment and non-production data.

Recommended scenarios include:

1. Submit quotes in a search field.
2. Submit SQL-looking strings in book titles.
3. Submit malformed identifiers.
4. Test search filters with unexpected values.
5. Test sorting with unsupported column names.
6. Attempt to manipulate authentication query inputs.
7. Test category and author identifiers.
8. Test update and delete requests with malformed values.
9. Verify invalid input cannot modify unrelated records.
10. Confirm database errors do not expose SQL statements.
11. Review raw SQL queries and dynamic query construction.
12. Confirm normal valid queries still work.

Use harmless test strings and verify that input is treated as data rather than executable SQL.

Do not run destructive injection tests against production systems.

Record actual results and evidence. Do not mark tests as passed without execution.

## 15. Manual Testing with PowerShell

Use an implemented endpoint and test data in a safe environment.

Illustrative example:

```powershell
$baseUrl = "http://localhost:PORT/api/v1"

$body = @{
    query = "' OR '1'='1"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod `
        -Method Get `
        -Uri "$baseUrl/REPLACE_WITH_SEARCH_ROUTE" `
        -ErrorAction Stop

    $response
}
catch {
    Write-Host "Request outcome: $($_.Exception.Message)"
}
```

This example is only a template. Adapt the HTTP method, query parameter, route, and request body to the actual search endpoint.

A request that returns an error is not automatically proof of SQL injection prevention. Verify the expected behavior and confirm that database contents remain unchanged.

## 16. Implementation Verification Checklist

- [ ] Actual MySQL driver and version identified.
- [ ] Repository queries reviewed.
- [ ] Authentication queries use safe parameterization.
- [ ] Book, author, category, and chapter queries reviewed.
- [ ] Search and filtering queries reviewed.
- [ ] Dynamic sorting uses an allowlist.
- [ ] Insert, update, and delete operations use parameterized values.
- [ ] Raw SQL usage reviewed.
- [ ] Database privileges follow least privilege.
- [ ] Error responses do not expose database internals.
- [ ] Relevant security tests have been executed.
- [ ] Actual implementation details are distinguished from recommendations.

## 17. Related Documentation

- `authentication.md`
- `authorization.md`
- `content-model.md`
- `environment.md`
- `error-handling.md`
- `validation.md`
- `../api/auth.md`
- `../api/books.md`
- `../api/authors.md`
- `../api/categories.md`
- `../api/chapters.md`
- `../03-technical/database-design.md`
- `../03-technical/architecture.md`
- `../07-testing/security-testing.md`
- `../07-testing/test-cases.md`

## 18. Maintenance

Review this document whenever database access patterns, repository methods, search behavior, authentication queries, schema relationships, or database dependencies change.

Keep the documented requirements aligned with the current implementation, approved requirements, and executed test evidence.
