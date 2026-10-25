# Content Model Security

## 1. Purpose

This document defines security requirements for the content model of the Digital Library application.

The application manages digital reading content such as books, authors, categories, chapters, and potentially user-owned private-library resources.

The intended technology stack is HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL, using a monolithic architecture.

**Implementation status:** This document describes the expected security model. Actual database tables, relationships, visibility rules, publication workflows, and ownership checks must be verified against the current source code and MySQL schema.

## 2. Scope

Content-model security covers:

- Book records and metadata.
- Author records and relationships.
- Category records and relationships.
- Chapter records and ordering.
- Publication and archival states, where implemented.
- Content visibility and access permissions.
- Private-library records and associated files.
- Referential integrity.
- Content ownership, where applicable.
- Prevention of unauthorized content modification.

## 3. Core Principles

The content model should follow these principles:

1. Validate content before storing it.
2. Enforce permissions on the backend.
3. Keep database relationships consistent.
4. Prevent unauthorized users from changing protected content.
5. Separate public content from private content.
6. Treat publication status and ownership as security-relevant data.
7. Use parameterized SQL queries.
8. Avoid trusting client-supplied identifiers or role values.
9. Return only content the requester is permitted to access.
10. Apply database constraints wherever appropriate.

## 4. Conceptual Content Model

The following is a conceptual model. It is not a verified representation of the current database schema.

```text
Author
  |
  | Author relationship, if supported
  v
Book ---- Category relationship ---- Category
  |
  | One-to-many relationship, if supported
  v
Chapter

User ---- Ownership relationship, if supported ---- Private Library Resource
```

The exact relationships depend on the implemented database design.

Do not assume that every book has exactly one author or category. The schema may support many-to-many relationships or different ownership rules.

## 5. Book Security

Book records may contain fields such as:

- Unique identifier.
- Title.
- Description.
- Author relationship.
- Category relationship.
- Publication or visibility status, if supported.
- Creation and modification timestamps, if supported.

The actual field names and relationships must match the database schema.

### Security requirements

- Validate all incoming book fields.
- Enforce the permissions required for creating, updating, publishing, archiving, or deleting books.
- Reject unauthorized changes to protected fields.
- Validate referenced author and category identifiers.
- Prevent SQL injection through parameterized queries.
- Apply the approved visibility policy when retrieving books.
- Avoid exposing internal storage paths or sensitive metadata.
- Handle deleted or unavailable related records safely.

A book being hidden in the frontend does not make it inaccessible through the API.

## 6. Author Security

Author records provide information associated with books.

Where author management is implemented:

- Restrict create, update, and delete operations to authorized users.
- Validate author names and other supported fields.
- Validate identifiers before database operations.
- Preserve referential integrity with related books.
- Define what happens when an author associated with existing books is deleted.
- Prevent unauthorized users from changing author relationships.

Author deletion should follow an explicit database and application policy. Do not assume that deleting an author should automatically delete associated books.

## 7. Category Security

Categories organize books into groups such as science, mathematics, psychology, and history.

Security requirements include:

- Validate category names and identifiers.
- Enforce uniqueness where required.
- Restrict category creation, modification, and deletion to authorized roles.
- Validate category relationships before assigning books.
- Define behavior when a category is referenced by existing books.
- Prevent unauthorized changes to category assignments.
- Apply consistent error handling for missing or invalid categories.

The actual category rules must follow the approved requirements and current database constraints.

## 8. Chapter Security

Chapter records represent sections of a book.

A chapter may contain a title, sequence number, content, book relationship, and other supported metadata.

Security requirements:

- Validate the parent book identifier.
- Confirm that the parent book exists.
- Enforce the applicable permission to create or modify a chapter.
- Validate chapter order and supported content fields.
- Prevent unauthorized movement of chapters between books.
- Apply the publication and visibility policy where applicable.
- Handle chapter deletion consistently with the approved data model.
- Avoid returning restricted chapter content.

If chapter ordering is implemented, the backend should prevent invalid or conflicting order values according to the selected schema design.

## 9. Content Visibility

Content visibility determines which users may retrieve a resource.

Possible visibility distinctions include:

- Publicly accessible content.
- Published content.
- Unpublished content.
- Archived content.
- Private or owner-restricted content.

These are conceptual categories. The actual application may use different states or a smaller set.

### Required safeguards

- Define the meaning of every supported visibility state.
- Validate visibility changes on the backend.
- Restrict publication and archival operations according to the permission policy.
- Enforce visibility rules during retrieval, not only during content creation.
- Ensure direct API requests cannot bypass visibility checks.
- Test access to content after status changes.

Do not infer that an archived or unpublished book is private unless the application explicitly defines that behavior.

## 10. Ownership and Private Content

If a content record belongs to a specific user, the backend must verify ownership before allowing protected operations.

The backend should not rely solely on a user identifier supplied in the request body, query string, or URL.

For private-library resources, verify authorization for:

- Listing resource metadata.
- Retrieving file contents.
- Downloading or streaming a resource.
- Updating metadata.
- Deleting a resource.
- Performing any supported processing operation.

If administrator access to private resources is required, define that permission explicitly and limit it to the approved purpose.

## 11. Database Integrity

The MySQL database should enforce the content relationships required by the approved schema.

Potential controls include:

- Primary keys.
- Foreign keys.
- Unique constraints.
- `NOT NULL` constraints.
- Suitable indexes.
- Transactions for related multi-step changes.
- Appropriate delete and update rules.

Examples of relationships that may require integrity checks include:

- Chapters referencing books.
- Books referencing authors.
- Books referencing categories.
- Private resources referencing owners.

These examples must be adapted to the actual schema. Do not add constraints or cascade rules without checking their effects on existing data and application behavior.

## 12. Content Modification and Mass Assignment

Mass assignment occurs when an application accepts client-supplied fields that the user should not be allowed to change.

To reduce this risk:

- Define permitted fields for each operation.
- Reject or ignore unsupported fields according to the API contract.
- Do not allow ordinary users to change administrative fields.
- Do not allow users to alter ownership without authorization.
- Protect internal status fields where required.
- Validate relationships before saving changes.

For example, a request to update a book title should not automatically be allowed to modify its owner, publication state, or administrative metadata.

The permitted fields must match the current validators and service logic.

## 13. SQL Injection Prevention

Content-related database operations must use parameterized queries or the equivalent safe query mechanism provided by the database library.

Requirements:

- Never concatenate untrusted values directly into SQL statements.
- Validate and bind identifiers appropriately.
- Use allowlists for dynamic column names or sort directions.
- Avoid exposing raw database errors to clients.
- Review search, filtering, sorting, pagination, and relationship queries.

Input validation is useful but does not replace parameterized SQL.

See `sql-injection.md` for additional requirements.

## 14. Content Rendering and XSS

Book descriptions, chapter content, author information, and other text may be displayed in a browser.

Requirements:

- Treat user-supplied content as untrusted.
- Escape text according to the output context.
- Avoid inserting untrusted values directly into executable HTML.
- Sanitize HTML if the product intentionally supports rich HTML content.
- Avoid unsafe DOM insertion methods where possible.
- Apply an appropriate Content Security Policy.
- Test stored and reflected cross-site scripting scenarios.

Plain text and intentionally supported rich content require different rendering strategies. Define the permitted content format explicitly.

See `xss.md` for additional requirements.

## 15. File and Document Relationships

If books or private-library records reference uploaded files, the content model must not assume that a stored path grants authorization.

Requirements:

- Keep file metadata consistent with the database.
- Verify access permissions before serving private files.
- Avoid exposing unrestricted filesystem paths.
- Validate the relationship between a record and its stored file.
- Handle missing files safely.
- Apply the approved upload and storage policy.
- Prevent unauthorized replacement or deletion of referenced files.

The actual file-storage design and supported formats must be verified against the current implementation.

## 16. Deletion and Archival

Deletion and archival are different operations.

- **Deletion** removes a record or marks it as deleted according to the approved design.
- **Archival** preserves a record while changing its availability or lifecycle state.

The application should define the expected behavior for each supported operation.

Before deleting a record, consider its related chapters, authors, categories, private resources, and other dependent data.

Use explicit foreign-key rules or transactional application logic to preserve data integrity. Do not introduce cascading deletion without understanding its impact.

## 17. Error Handling

Content-model operations should return consistent and safe errors.

Potential cases include:

- Invalid content fields.
- Missing parent records.
- Invalid relationships.
- Duplicate values.
- Unauthorized modification.
- Forbidden visibility changes.
- Conflicting chapter order.
- Database failures.

The response format must follow the established API conventions.

Do not expose SQL statements, filesystem paths, stack traces, or sensitive internal details in public error responses.

## 18. Testing Requirements

Test the security behavior of implemented content operations.

Recommended scenarios:

1. Create a book with valid data.
2. Reject invalid book fields.
3. Reject references to nonexistent authors or categories.
4. Prevent unauthorized book modification.
5. Prevent unauthorized publication or archival changes.
6. Create a chapter for a valid book.
7. Reject a chapter with an invalid parent-book identifier.
8. Prevent unauthorized chapter reassignment.
9. Verify visibility rules for unpublished and archived content.
10. Prevent access to another user's private resource.
11. Verify foreign-key and uniqueness constraints.
12. Test malicious input in searchable and displayable fields.
13. Verify safe deletion behavior for related records.
14. Confirm that errors do not reveal database internals.

Run only tests relevant to implemented features and record actual outcomes. Do not claim that unexecuted tests have passed.

## 19. Implementation Verification Checklist

- [ ] Actual content tables and fields are documented.
- [ ] Database relationships match the current schema.
- [ ] Create and update permissions are verified.
- [ ] Ownership rules are verified.
- [ ] Visibility states and transitions are documented.
- [ ] Parameterized database access is used.
- [ ] User-controlled fields are validated.
- [ ] Content rendering follows XSS protections.
- [ ] File references are protected where applicable.
- [ ] Deletion and archival behavior is documented.
- [ ] Relevant tests have been executed.
- [ ] Proposed requirements are clearly distinguished from implemented behavior.

## 20. Related Documentation

- `authentication.md`
- `authorization.md`
- `validation.md`
- `sql-injection.md`
- `xss.md`
- `error-handling.md`
- `file-upload-prep.md`
- `../api/books.md`
- `../api/authors.md`
- `../api/categories.md`
- `../api/chapters.md`
- `../api/private-library.md`
- `../03-technical/database-design.md`
- `../03-technical/architecture.md`
- `../07-testing/security-testing.md`

## 21. Maintenance

Update this document when content entities, relationships, ownership rules, visibility states, publication workflows, or file-storage behavior changes.

Keep the documented security model consistent with the current MySQL schema, backend implementation, approved requirements, and executed test evidence.
