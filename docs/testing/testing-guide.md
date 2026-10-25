# Digital Library — Testing Guide

## 1. Purpose

This document provides a practical guide for testing the Digital Library application during development, integration, regression testing, and release preparation.

The project uses:

- HTML, CSS, and Vanilla JavaScript for the frontend.
- Node.js and Express.js for the backend.
- MySQL for persistent data storage.
- A monolithic application architecture.

The intended backend request flow is:

Route → Middleware → Controller → Service → Repository → MySQL, where applicable.

This guide describes testing procedures and expected verification areas. The exact commands, endpoints, scripts, environment variables, and implemented features must be confirmed against the current repository before use.

## 2. Testing Objectives

Testing should establish whether the application:

1. Meets its approved functional requirements.
2. Handles valid and invalid input correctly.
3. Enforces authentication and authorization.
4. Reads and writes data correctly in MySQL.
5. Preserves relationships between books, authors, categories, and chapters.
6. Handles errors without exposing sensitive information.
7. Protects against common security vulnerabilities.
8. Provides a usable reading and navigation experience.
9. Remains stable after code changes.
10. Can be deployed using documented configuration and procedures.

## 3. Testing Scope

### 3.1 Backend

Test implemented Express.js routes, middleware, controllers, services, repositories, and database operations.

Areas may include:

- Authentication and user management.
- Books and book relationships.
- Authors and categories.
- Chapters and chapter ordering.
- Publication and visibility rules.
- Private-library operations.
- Validation and error handling.
- Security middleware.
- Database transactions and constraints, where applicable.

Only test features that exist in the current implementation or are explicitly being developed.

### 3.2 Frontend

Test implemented pages and components, including:

- Login and registration screens.
- Navigation and page transitions.
- Book listing and search.
- Book details and reading views.
- Forms and validation messages.
- Responsive layouts.
- Dark mode and background settings, where implemented.
- Reading and audio controls, where implemented.

The frontend feature list must be checked against the current codebase.

### 3.3 Database

Test:

- Database connectivity.
- Table and column constraints.
- Primary and foreign keys.
- Unique constraints.
- Data integrity.
- Relationship consistency.
- Transaction behavior, where implemented.
- Expected behavior for missing or duplicate records.

## 4. Testing Environment

Use a development or dedicated test environment.

Recommended components:

| Component | Purpose |
|---|---|
| Windows PowerShell | Run commands and manual API requests |
| Node.js | Execute the backend |
| npm | Install dependencies and run configured scripts |
| MySQL | Store application data |
| Web browser | Test frontend behavior |
| Git | Track code changes and support regression testing |

Do not assume a particular port, database name, script, or dependency version without checking the project configuration.

## 5. Initial Environment Checks

Run commands from the project root:

```powershell
Get-Location
```

Check the installed runtime tools:

```powershell
node --version
npm --version
```

Inspect the project structure:

```powershell
Get-ChildItem
```

Inspect available npm scripts if a backend package manifest exists:

```powershell
Get-Content .\backend\package.json
```

The last command assumes the backend package manifest is located at `backend\package.json`. Adjust the path if the repository uses a different structure.

Review the project's environment configuration and setup instructions before starting the server.

Do not publish `.env` contents or expose passwords, tokens, or database credentials in logs or screenshots.

## 6. Starting the Backend

Use the scripts defined in the backend package manifest.

For example, if the project defines a development script:

```powershell
Set-Location .\backend
npm run dev
```

If no `dev` script exists, inspect the package manifest and use the configured command instead.

Expected checks:

- The server starts without a fatal error.
- Required configuration is available.
- The database connection succeeds when the application requires it.
- No sensitive credentials appear in the console.
- The server listens on its configured address and port.

A successful startup does not prove that all endpoints work.

## 7. Health Endpoint Test

If the application implements a health endpoint, send a request to its verified URL.

Illustrative example:

```powershell
$baseUrl = "http://localhost:PORT/api/v1"

Invoke-RestMethod `
    -Method Get `
    -Uri "$baseUrl/health"
```

Replace `PORT` and the path with values confirmed in the current source code or project documentation.

Expected result: the response should match the application's documented health-response format.

Do not treat an example URL as confirmation that the endpoint currently exists.

## 8. Manual API Testing with PowerShell

PowerShell's `Invoke-RestMethod` can test JSON APIs without Postman.

### 8.1 Define the Base URL

```powershell
$baseUrl = "http://localhost:PORT/api/v1"
```

Use the actual configured port and API prefix.

### 8.2 Send a GET Request

```powershell
try {
    $response = Invoke-RestMethod `
        -Method Get `
        -Uri "$baseUrl/REPLACE_WITH_VERIFIED_ROUTE"

    $response | ConvertTo-Json -Depth 10
}
catch {
    Write-Host "Request failed: $($_.Exception.Message)"
}
```

Replace the placeholder with a real route.

### 8.3 Send a JSON POST Request

```powershell
$body = @{
    exampleField = "example value"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod `
        -Method Post `
        -Uri "$baseUrl/REPLACE_WITH_VERIFIED_ROUTE" `
        -ContentType "application/json" `
        -Body $body

    $response | ConvertTo-Json -Depth 10
}
catch {
    Write-Host "Request failed: $($_.Exception.Message)"
}
```

Replace the example field and route with the actual API contract.

### 8.4 Inspect HTTP Error Responses

`Invoke-RestMethod` throws an exception for many non-success HTTP responses. Depending on the PowerShell version, the response body may be available through the exception's response object.

For a basic status-code check:

```powershell
try {
    Invoke-RestMethod `
        -Method Get `
        -Uri "$baseUrl/REPLACE_WITH_VERIFIED_ROUTE"
}
catch {
    Write-Host "Request failed: $($_.Exception.Message)"

    if ($_.Exception.Response) {
        Write-Host "HTTP status: $([int]$_.Exception.Response.StatusCode)"
    }
}
```

Inspect the response body as well when verifying validation and error-handling behavior.

## 9. Authentication Testing

Test the actual authentication flow implemented by the application.

Recommended cases:

1. Register with valid input.
2. Register with missing required fields.
3. Attempt duplicate registration where uniqueness is required.
4. Log in with valid credentials.
5. Log in with an incorrect password.
6. Log in with an unknown account.
7. Access a protected route without credentials.
8. Access a protected route with invalid or expired credentials, where applicable.
9. Verify the permitted behavior after logout.
10. Verify role restrictions on administrative operations.

Expected results must follow the documented API contract and security design.

Do not assume that the application uses cookies, bearer tokens, refresh tokens, or a particular session strategy without inspecting the implementation.

Avoid printing real passwords, authentication tokens, or session secrets in shared test output.

## 10. Role and Authorization Testing

The documented roles are `USER` and `ADMIN`. Verify the actual permissions implemented for each role.

| Scenario | Verification |
|---|---|
| Unauthenticated requester | Protected operations are denied |
| USER accessing an allowed operation | Operation follows the documented permissions |
| USER attempting an admin-only operation | Access is denied |
| ADMIN accessing an authorized admin operation | Operation follows the documented permissions |
| User accessing another user's private resource | Access follows ownership and privacy rules |
| Request with a modified ownership field | Unauthorized ownership changes are rejected |

A successful login does not imply permission to perform every operation.

Test authorization at the backend, not only through hidden or disabled frontend controls.

## 11. Books, Authors, Categories, and Chapters

Test each implemented content-management operation.

### Books

- Create a valid book.
- Retrieve a book.
- Update permitted fields.
- Test missing or invalid identifiers.
- Test required-field validation.
- Test duplicate or conflicting data where applicable.
- Verify publication and visibility rules where implemented.
- Verify deletion or archiving behavior where implemented.

### Authors

- Create and retrieve author records where supported.
- Update permitted fields.
- Verify handling of missing author records.
- Verify book-author relationships.

### Categories

- Create and retrieve categories where supported.
- Update or delete categories according to permissions.
- Verify behavior when a category is associated with books.
- Confirm category filtering behaves as documented.

### Chapters

- Create a chapter for an existing book.
- Retrieve chapter content.
- Update permitted fields.
- Verify chapter ordering.
- Test references to nonexistent books.
- Verify access to unpublished or private content according to the application's rules.

Use the real routes, request bodies, and permissions defined by the source code.

## 12. Database Testing

Verify database operations using the application's supported workflows and authorized database tools.

Check that:

- Successful creation stores the expected values.
- Updates affect the intended records.
- Invalid operations do not corrupt data.
- Relationships remain consistent.
- Unique constraints behave as expected.
- Foreign-key constraints behave as expected, where configured.
- Deletion and archival follow the documented rules.
- Failed transactions do not leave partial data where atomicity is required.

Use a test database or disposable test records when possible.

Do not run destructive tests against production data.

## 13. Input Validation Testing

Test valid, invalid, boundary, and unexpected values.

Recommended cases:

- Missing required fields.
- Incorrect data types.
- Empty strings and whitespace-only input.
- Values exceeding configured length limits.
- Malformed identifiers.
- Invalid pagination parameters.
- Unsupported sorting values.
- Unexpected request fields.
- Invalid relationship identifiers.
- Malformed JSON.
- Unsupported file types where uploads exist.

Verify both the HTTP response and the resulting database state where relevant.

See `../security/validation.md` for detailed requirements.

## 14. Security Testing

Security tests should cover:

- Authentication and authorization.
- Password handling.
- SQL injection prevention.
- Cross-Site Scripting (XSS) prevention.
- Input validation.
- CORS configuration.
- Rate limiting.
- File upload restrictions.
- Error-message safety.
- Secret management.
- Access to private content.

Use harmless test payloads and only test systems you are authorized to assess.

Do not assume a security feature is implemented because a corresponding documentation file exists.

See `../security/README.md` and `../07-testing/security-testing.md` for related guidance.

## 15. Frontend Testing

Use a browser to verify each implemented page.

Check:

1. Pages load without unexpected errors.
2. Navigation links lead to the intended destinations.
3. Forms show useful validation feedback.
4. Loading and error states behave correctly.
5. API failures do not break the entire page.
6. Long titles and descriptions render appropriately.
7. Content is displayed safely.
8. Layouts work at different viewport sizes.
9. Keyboard navigation works for important controls.
10. Buttons perform the actions indicated by their labels.

Use the browser developer tools to inspect console errors, failed network requests, and rendered DOM behavior.

## 16. Reading and Audio Features

If the reading interface and audio features are implemented, test them independently.

Potential checks include:

- Opening a book and selecting a chapter.
- Reading long content without layout failures.
- Handling empty or unavailable content.
- Starting and stopping browser speech synthesis.
- Changing speech rate within supported limits.
- Changing pitch where supported by the browser.
- Handling navigation while speech is active.
- Handling unsupported voices or browser capabilities.
- Testing dark mode and background settings.
- Preserving appropriate reading state, if persistence is implemented.

A planned rate of up to 4x or a pitch control is a requirement to verify, not proof that every browser supports it.

Record browser-specific limitations and actual observed behavior.

## 17. Regression Testing

Run relevant regression tests after changing:

- Authentication middleware.
- Authorization rules.
- API routes.
- Validation schemas.
- Services and repositories.
- Database schema or relationships.
- Frontend rendering.
- Security configuration.
- Upload processing.
- Reading and audio controls.

At minimum, retest the changed feature and its dependent flows.

For changes to shared middleware, database utilities, or authentication logic, expand the regression scope to all affected endpoints.

Compare the results with the previous known test evidence.

## 18. Test Data Management

Use controlled test data with clear identifiers.

Recommended practices:

- Use a dedicated test database where possible.
- Record which test accounts and records are created.
- Avoid using real users' private information.
- Remove disposable test data when safe and appropriate.
- Preserve required records used by other tests.
- Avoid reusing conflicting identifiers.
- Do not store credentials in source control.
- Document any test setup prerequisites.

Test cleanup must not delete unrelated data.

## 19. Test Case Recording

Record test results using a consistent format.

| Field | Description |
|---|---|
| Test ID | Unique identifier for the test |
| Feature | Feature or module being tested |
| Preconditions | Required environment and data |
| Test steps | Actions performed |
| Expected result | Required behavior |
| Actual result | Observed behavior |
| Status | Pass, Fail, Blocked, or Not Run |
| Evidence | Relevant output, screenshot, or log reference |
| Defect | Related issue, if any |

Only mark a test as **Pass** after observing and checking the expected result.

Use **Blocked** when a test cannot proceed because of an unmet dependency. Use **Not Run** when it has not been executed.

## 20. Defect Reporting

When a test fails, record:

- A concise summary.
- The affected feature or endpoint.
- Preconditions.
- Steps to reproduce.
- Expected behavior.
- Actual behavior.
- Relevant status code or sanitized error output.
- Environment details.
- Severity and impact.
- Related logs or screenshots, with secrets removed.

Investigate the root cause before changing unrelated code.

After fixing a defect, rerun the original test and relevant regression tests.

## 21. Git and Testing Workflow

Before testing a code change:

1. Identify the working branch.
2. Review changed files.
3. Confirm the required environment is configured.
4. Run the relevant tests.
5. Inspect the results.
6. Review unintended modifications.
7. Record the evidence.
8. Commit or push changes according to the project's approved Git workflow.

Useful commands include:

```powershell
git status --short
git diff --check
git diff
```

These commands inspect the current working tree; they do not prove that tests have passed.

Do not claim that code has been committed, pushed, or merged unless the corresponding Git operation and resulting state have been verified.

## 22. Release Readiness Checklist

### Application

- [ ] Required features have been tested.
- [ ] Critical user flows work.
- [ ] API contracts have been checked.
- [ ] Database integrity has been verified.
- [ ] Authentication and authorization have been tested.
- [ ] Error handling has been checked.
- [ ] Security checks have been executed.
- [ ] Frontend rendering has been tested.
- [ ] Regression testing has been completed for affected areas.

### Configuration and deployment

- [ ] Environment variables are documented.
- [ ] Secrets are not committed to Git.
- [ ] Production settings have been reviewed.
- [ ] Database setup and migration procedures are documented.
- [ ] Upload storage and permissions are reviewed, if applicable.
- [ ] Backup and recovery procedures are documented.
- [ ] Rollback procedures are available.
- [ ] Required dependencies and startup commands are confirmed.

### Evidence

- [ ] Test results are recorded.
- [ ] Failed tests have been investigated.
- [ ] Known limitations are documented.
- [ ] Blocked and unexecuted tests are clearly identified.
- [ ] Release approval follows the project's agreed process.

## 23. Common Troubleshooting

### Server does not start

- Check the command and npm script.
- Inspect the startup error.
- Verify required environment variables.
- Confirm that the configured port is available.
- Check that required dependencies are installed.

### Database connection fails

- Confirm the database service is running.
- Verify the configured host, port, and database name.
- Check credentials securely.
- Confirm the database schema is available.
- Inspect the backend logs without exposing secrets.

### API returns an unexpected status

- Verify the route and HTTP method.
- Check authentication requirements.
- Confirm the request body matches the API contract.
- Inspect middleware and validation behavior.
- Review the sanitized response body and backend logs.

### API returns incorrect data

- Verify test input and record identifiers.
- Check service and repository behavior.
- Inspect relevant database relationships.
- Confirm the intended transaction and visibility rules.
- Add a regression test after identifying the cause.

### Frontend does not display content

- Check browser console errors.
- Inspect network requests and response bodies.
- Verify the frontend API base URL.
- Check safe DOM rendering and response handling.
- Confirm the requested resource is available to the current user.

## 24. Completion Criteria

A feature may be considered tested when:

1. Its applicable requirements are identified.
2. Relevant positive and negative test cases have been executed.
3. Observed results match expected behavior or documented limitations.
4. Critical defects have been resolved or formally accepted.
5. Relevant regression tests have been completed.
6. Results and evidence have been recorded.

This is a testing completion criterion, not a claim that the entire Digital Library application has passed testing.

## 25. Related Documentation

- `testing-strategy.md`
- `test-plan.md`
- `test-cases.md`
- `integration-testing.md`
- `regression-testing.md`
- `security-testing.md`
- `../security/README.md`
- `../security/authentication.md`
- `../security/authorization.md`
- `../security/validation.md`
- `../security/sql-injection.md`
- `../security/xss.md`
- `../api/README.md`
- `../03-technical/api-specification.md`
- `../03-technical/database-design.md`
- `../08-deployment/environment-setup.md`
- `../08-deployment/production-checklist.md`

## 26. Maintenance

Update this guide whenever API contracts, project structure, test scripts, dependencies, database relationships, security controls, or deployment procedures change.

Keep test evidence tied to the code and environment actually tested. Distinguish verified results from planned tests and historical reports.
