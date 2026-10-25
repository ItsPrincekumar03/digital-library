# Coding Standards

## 1. Purpose

This document defines consistent coding practices for the Digital Library project. These standards are intended to improve readability, maintainability, security, testing, and collaboration among team members.

All contributors should follow these guidelines when creating or modifying code. Existing code should be inspected before refactoring so that changes remain compatible with the current implementation.

## 2. Project Technology and Architecture

The approved technology stack is:

- HTML
- CSS
- Vanilla JavaScript
- Node.js
- Express.js
- MySQL

The project uses a monolithic application architecture. Do not introduce microservices or additional frameworks without an explicit project decision.

The intended backend organization is:

```text
Routes
  -> Middleware
  -> Controllers
  -> Services
  -> Repositories
  -> MySQL
```

Use the layers that are appropriate to the operation and consistent with the existing codebase. Do not create unnecessary abstractions merely to satisfy a folder structure.

## 3. General Principles

All code should follow these principles:

1. Prefer clear, descriptive names over cryptic abbreviations.
2. Keep functions focused on one responsibility.
3. Avoid duplicated business logic.
4. Validate untrusted input at application boundaries.
5. Enforce authorization on the server.
6. Use parameterized SQL queries.
7. Handle expected errors explicitly.
8. Avoid hardcoded secrets, credentials, and environment-specific values.
9. Preserve existing behavior unless a change is intentional.
10. Write tests for important business rules and security-sensitive behavior.
11. Keep dependencies and abstractions proportionate to the project's needs.
12. Document non-obvious decisions and important constraints.

## 4. Naming Conventions

Follow the naming conventions already established in the repository. For new code, use the following defaults unless existing project conventions require otherwise.

| Element | Convention | Example |
|---|---|---|
| Variables | `camelCase` | `bookTitle` |
| Functions | `camelCase` | `findBookById` |
| Classes | `PascalCase` | `BookService` |
| Constants | `UPPER_SNAKE_CASE` for true constants | `MAX_UPLOAD_SIZE` |
| Filenames | Match the existing folder convention | `book.service.js` |
| Database tables | Follow the existing schema convention | Verify before creating |
| Environment variables | `UPPER_SNAKE_CASE` | `DB_HOST` |
| Boolean variables | Clear question-like names | `isPublished` |
| Test files | Match the existing test framework convention | Verify before creating |

Use names that express purpose. Avoid ambiguous names such as `data`, `temp`, `obj`, or `result` when a more specific name would improve understanding.

## 5. JavaScript Standards

### 5.1 Variables and scope

- Prefer `const` when a variable is not reassigned.
- Use `let` when reassignment is necessary.
- Avoid `var` in new code.
- Keep variable scope as narrow as practical.
- Avoid implicit global variables.

```javascript
const bookId = req.params.bookId;
let retryCount = 0;
```

### 5.2 Functions

- Use descriptive function names.
- Keep functions short enough to understand without excessive scrolling.
- Separate validation, business rules, database access, and response formatting when appropriate.
- Avoid deeply nested conditional logic.
- Use early returns when they make control flow clearer.

```javascript
function isValidBookId(bookId) {
    return Number.isInteger(bookId) && bookId > 0;
}
```

This is an illustrative example. Adapt validation to the actual type and format used by the application.

### 5.3 Asynchronous operations

- Use `async` and `await` consistently where supported by the project runtime.
- Handle rejected promises.
- Do not leave asynchronous operations unawaited when their completion is required.
- Avoid swallowing errors with empty `catch` blocks.
- Follow the project's established Express error-handling pattern.

```javascript
async function getBook(bookId) {
    try {
        return await bookRepository.findById(bookId);
    } catch (error) {
        throw error;
    }
}
```

Do not add redundant `try/catch` blocks that simply rethrow the same error. Add them when they provide meaningful cleanup, translation, logging, or recovery.

### 5.4 Equality and conditions

- Prefer strict equality operators (`===` and `!==`).
- Use explicit boolean conditions.
- Avoid complex nested ternary expressions.
- Handle `null`, `undefined`, empty strings, and missing fields according to the operation's requirements.

### 5.5 Comments

Comments should explain why a decision exists, not merely repeat what the code does.

Avoid outdated comments. Update comments when behavior changes.

Use JSDoc for exported or complex functions when parameter types, return values, side effects, or important assumptions are not obvious.

## 6. Backend Standards

### 6.1 Routes

Routes should define HTTP methods, URL patterns, and the relevant middleware/controller chain.

- Keep business logic out of route declarations.
- Apply authentication and authorization middleware where required.
- Use consistent URL and HTTP method conventions.
- Avoid duplicate route definitions.
- Confirm route registration and middleware order when adding endpoints.

### 6.2 Middleware

Middleware should handle cross-cutting request concerns, such as authentication, authorization, request validation, and error handling.

- Call `next()` when continuing the middleware chain.
- Do not call `next()` after sending a completed response.
- Avoid performing unrelated business operations in middleware.
- Do not trust client-provided role or ownership fields without server-side verification.

### 6.3 Controllers

Controllers should coordinate HTTP request handling.

- Read validated request data.
- Call the appropriate service.
- Translate successful results into HTTP responses.
- Pass unexpected errors to the established error handler.
- Avoid embedding complex business rules or large SQL queries in controllers.
- Return consistent response structures where the API specification defines them.

### 6.4 Services

Services should contain application business rules.

- Keep domain decisions out of route definitions.
- Reuse services for shared business operations.
- Enforce relevant business invariants.
- Do not assume the caller has permission merely because authentication succeeded.
- Use database transactions when a multi-step operation must be atomic.

### 6.5 Repositories

Repositories should encapsulate database access where the repository pattern is used.

- Use parameterized queries.
- Keep SQL readable and maintainable.
- Avoid mixing unrelated database operations in one function.
- Handle database results consistently.
- Do not expose database credentials or sensitive connection details.
- Review query performance when operations involve large datasets or repeated lookups.

### 6.6 Error handling

- Use the project's established error types and response conventions.
- Return appropriate HTTP status codes.
- Do not send stack traces, SQL details, tokens, or secrets to clients.
- Log useful diagnostic information without recording passwords or authentication secrets.
- Distinguish expected client errors from unexpected server failures.
- Ensure asynchronous errors reach the application's error-handling mechanism.

## 7. API Standards

New or modified endpoints should follow the documented API specification.

- Use HTTP methods according to the operation's purpose.
- Validate path parameters, query parameters, and request bodies.
- Return predictable JSON structures when the endpoint is a JSON API.
- Use suitable status codes for success, validation failures, authentication failures, authorization failures, missing resources, conflicts, and server errors.
- Avoid exposing internal database structures unnecessarily.
- Keep error responses useful but safe.
- Update API documentation when endpoint behavior changes.

Do not invent or change route paths, response fields, or status-code conventions without checking the existing API.

## 8. Database Standards

- Use the existing MySQL schema conventions.
- Define primary and foreign keys according to the documented relationships.
- Apply appropriate `NOT NULL`, `UNIQUE`, and other constraints.
- Use parameterized queries for all user-controlled values.
- Avoid `SELECT *` in production application queries when explicit columns improve clarity and maintainability.
- Use transactions for operations requiring atomic changes.
- Keep schema changes documented and reproducible.
- Avoid destructive schema changes without a reviewed migration or backup plan.
- Consider indexes based on actual query patterns and execution plans.
- Use consistent date, time, and identifier handling.

Do not change table or column names based only on assumptions. Inspect the current schema and update dependent code and documentation together.

## 9. Frontend Standards

### 9.1 HTML

- Use semantic HTML elements.
- Associate form labels with their controls.
- Provide accessible names for interactive elements.
- Use meaningful headings in a logical hierarchy.
- Avoid duplicate element IDs.
- Do not use HTML structure as a substitute for CSS styling.

### 9.2 CSS

- Reuse existing design tokens, variables, and component patterns.
- Use meaningful class names.
- Avoid unnecessary duplication and excessive specificity.
- Keep responsive behavior in mind.
- Ensure text and controls remain usable in supported themes.
- Avoid introducing a CSS framework without an approved project decision.

### 9.3 Vanilla JavaScript

- Keep DOM manipulation separate from API and business logic when practical.
- Avoid duplicating event listeners.
- Handle loading, success, empty, and error states.
- Do not insert untrusted content through unsafe HTML-rendering APIs.
- Use safe DOM APIs such as `textContent` for plain user-controlled text.
- Avoid exposing secrets in browser code.
- Handle network failures and unexpected response formats.

### 9.4 Accessibility and usability

- Support keyboard navigation for interactive features.
- Preserve visible focus indicators.
- Use sufficient color contrast.
- Avoid communicating important states through color alone.
- Provide meaningful feedback when actions succeed or fail.
- Test layouts at relevant viewport sizes.

## 10. Authentication and Authorization Standards

- Store passwords only as approved password hashes.
- Never log passwords, raw authentication tokens, or session secrets.
- Apply authentication checks to protected operations.
- Apply authorization checks independently of authentication.
- Verify ownership before accessing private books, files, or other user-specific resources.
- Enforce role restrictions on the backend, not only in the frontend.
- Use secure cookie attributes when cookie-based authentication is implemented.
- Avoid storing sensitive credentials in frontend source code.
- Follow the documented token-expiration, logout, and invalidation behavior.
- Test attempts to access resources belonging to another user.

Authentication and authorization details must match the verified implementation and the security design.

## 11. File Upload Standards

For upload functionality:

- Enforce configured file-size limits.
- Validate file type using appropriate server-side checks.
- Do not rely exclusively on a filename extension or client-provided MIME type.
- Generate safe storage names rather than trusting arbitrary user-supplied paths.
- Prevent path traversal.
- Store private files outside publicly served directories when required.
- Enforce ownership and access permissions when downloading or reading files.
- Handle partial failures and cleanup appropriately.
- Avoid executing uploaded files.
- Keep upload errors consistent and avoid exposing internal filesystem paths.

Only apply these rules to the upload capabilities actually present in the project; record planned controls separately from implemented controls.

## 12. Configuration and Secrets

- Read environment-specific settings from the established configuration mechanism.
- Keep real `.env` files and credentials out of version control.
- Maintain an example environment file containing placeholders, not working secrets.
- Validate required configuration during application startup where practical.
- Use different credentials for development and production.
- Never commit API keys, passwords, private tokens, or production connection strings.
- Document new environment variables and their purpose.

## 13. Logging Standards

Logs should help developers diagnose problems without exposing private information.

- Use the project's established logging approach.
- Include useful context such as operation names and request identifiers when available.
- Avoid logging passwords, tokens, session cookies, or unnecessary personal data.
- Do not expose internal error details in public API responses.
- Avoid excessive logs for routine successful operations.
- Use appropriate severity levels where the logging system supports them.

## 14. Testing Standards

- Add tests for new business rules and important bug fixes.
- Test normal behavior, invalid input, and relevant failure paths.
- Include authorization and ownership tests for protected resources.
- Keep tests isolated from real production data.
- Use controlled test fixtures and clean up test data.
- Avoid tests that depend on execution order unless explicitly designed to do so.
- Do not claim that tests pass unless they have actually been run and the results recorded.
- Update regression tests when fixing a previously observed defect.

Use the test runner already configured in the repository. Do not introduce a new testing framework without reviewing project requirements and dependencies.

## 15. Dependencies and Imports

- Prefer built-in Node.js functionality when it meets the requirement.
- Add third-party packages only when justified.
- Review package maintenance, compatibility, license, and security implications.
- Keep dependency manifests and lock files synchronized.
- Avoid unused packages and imports.
- Use the established module system in each part of the application.
- Do not mix CommonJS and ECMAScript modules without understanding the project's configuration.

## 16. Formatting and File Organization

- Follow the repository's existing indentation and quote style.
- Keep one clear responsibility per module where practical.
- Group related code together.
- Avoid excessively long functions and files.
- Keep import declarations organized consistently.
- Remove unused code only when its lack of use is confirmed.
- Use the formatter or linter already configured by the project.
- Do not add formatting tools solely for cosmetic preference without agreement.

If the project does not yet have automated formatting or linting, record that as a possible improvement rather than claiming it is configured.

## 17. Git and Team Collaboration

Before editing:

```powershell
git status --short
git branch --show-current
```

Before committing:

```powershell
git diff --check
git diff
```

Team rules:

- Work on the agreed task or module.
- Avoid overwriting another contributor's uncommitted work.
- Keep commits focused on a coherent change.
- Use clear commit messages.
- Include relevant documentation and tests in the same change when appropriate.
- Do not commit secrets, generated temporary files, or unrelated changes.
- Confirm the current branch and repository state before pushing.
- Do not claim a change is pushed until the remote state is confirmed.

## 18. Code Review Checklist

Before approving a change, review the following:

- [ ] Does the change meet the requested requirement?
- [ ] Does it follow the existing architecture and coding conventions?
- [ ] Are variable, function, and file names clear?
- [ ] Is input validated at the appropriate boundary?
- [ ] Are authentication and authorization enforced where necessary?
- [ ] Are SQL operations parameterized?
- [ ] Are errors handled consistently?
- [ ] Are sensitive values excluded from logs and responses?
- [ ] Are database constraints and transactions appropriate?
- [ ] Are frontend states accessible and understandable?
- [ ] Are relevant tests added or updated?
- [ ] Have the relevant tests actually been executed?
- [ ] Is the API or technical documentation updated?
- [ ] Have unintended changes and secrets been excluded?
- [ ] Has the Git diff been reviewed?

## 19. Exceptions

If an existing implementation cannot immediately follow a standard:

1. Identify the affected code.
2. Explain the technical or compatibility reason.
3. Record the risk.
4. Propose a practical correction where appropriate.
5. Add tests or monitoring if needed.
6. Update the code and documentation when the exception is resolved.

Do not perform broad refactoring during a small feature task unless it is required for correctness, security, or maintainability.

## 20. Maintenance

Review this document when the technology stack, project architecture, coding tools, or team workflow changes.

When a standard changes, ensure that new guidance remains compatible with the approved stack: HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL.
