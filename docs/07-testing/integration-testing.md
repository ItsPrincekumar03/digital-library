# Integration Testing

## 1. Purpose

This document defines the integration-testing strategy for the Digital Library project.

Integration testing verifies that related components work together correctly, including routes, middleware, controllers, services, repositories, the MySQL database, and frontend API interactions.

The purpose is to identify problems that may not appear when individual components are tested in isolation.

This document describes the required testing approach. It does not claim that any test has been implemented or passed without recorded execution evidence.

## 2. Project Context

Digital Library is a BTech final-year project using the following approved technology stack:

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js and Express.js
- **Database:** MySQL
- **Architecture:** Monolithic application

Microservices are not part of the approved architecture.

The application's primary roles are `USER` and `ADMIN`. Exact permissions and supported features must follow the verified implementation and requirements.

## 3. Objectives

Integration testing should verify that:

1. The application communicates correctly with MySQL.
2. Registered routes invoke the correct middleware and handlers.
3. Controllers and services exchange data correctly.
4. Repositories execute database operations as intended.
5. Authentication is enforced on protected endpoints.
6. Authorization and ownership checks prevent unauthorized operations.
7. Database constraints preserve data integrity.
8. Related entities are created, updated, and deleted consistently.
9. API responses match the documented contracts.
10. Errors are handled consistently across component boundaries.
11. The frontend interprets API responses correctly.
12. Important end-to-end workflows work across integrated components.

## 4. Scope

### 4.1 Included areas

- Backend application and middleware integration.
- Authentication and user management.
- Role-based and ownership-based authorization.
- MySQL connection and repository operations.
- Book-management APIs.
- Author and category relationships, where implemented.
- Chapter-management APIs.
- Publication and visibility behavior, where implemented.
- Private-library access, where implemented.
- File handling and PDF integration, where implemented.
- Frontend-to-backend API integration.
- Error propagation and response formatting.
- Database transaction and consistency behavior.

### 4.2 Excluded or separately tested areas

The following require separate unit, security, performance, or other specialized tests where applicable:

- Individual functions tested in isolation.
- High-load and stress testing.
- Comprehensive penetration testing.
- Browser compatibility testing beyond the integration scope.
- Production infrastructure validation.
- Future AI features that have not been implemented.

## 5. Integration Architecture

The intended backend flow is:

```text
HTTP Client
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
MySQL Database
```

The frontend may communicate with backend endpoints through HTTP requests.

Integration tests should follow the actual implementation rather than assume that every endpoint uses every layer. Inspect the repository to identify real component boundaries before designing tests.

## 6. Test Environment

Use a dedicated development or test environment.

Required environment elements may include:

- A supported Node.js runtime.
- Project dependencies installed from the lock file.
- MySQL server and a dedicated test database.
- Test-specific environment configuration.
- An available test runner, if configured.
- Controlled test users and sample records.
- An isolated file-storage location when testing uploads.
- A documented method for resetting test data.

Do not run destructive test cleanup against production or a database containing important user data.

### 6.1 Environment configuration

Use environment variables for configuration and secrets.

Do not include real passwords, authentication tokens, or database credentials in test files, reports, or Git commits.

Record required environment-variable names and safe setup instructions in the environment documentation.

## 7. Test Data Strategy

Prepare predictable data for each test.

Possible fixtures include:

- One valid registered user.
- One administrative user.
- One user with no administrative permissions.
- Several books with distinct identifiers.
- Authors and categories, if supported.
- Chapters associated with valid books.
- A private resource owned by one user.
- Invalid or missing relationship identifiers.

These are suggested test fixtures, not claims that these records already exist in the database.

### Data management rules

1. Use dedicated test accounts.
2. Generate unique values when database constraints require uniqueness.
3. Avoid depending on data left by previous tests.
4. Clean up only records created by the test.
5. Preserve referential integrity during cleanup.
6. Do not expose real user data in test output.
7. Verify important database changes directly when appropriate.
8. Make tests repeatable.

## 8. Integration Test Categories

### 8.1 Application startup and database connectivity

Verify that:

- The application starts with valid configuration.
- The database connection can be established.
- Database connection failures are handled appropriately.
- The application responds correctly to its documented health endpoint, if one exists.
- Missing required configuration is handled according to the application's startup policy.

### 8.2 Authentication integration

Verify that:

- A valid registration request creates the expected account.
- Duplicate or invalid registrations are rejected according to the requirements.
- Valid credentials authenticate successfully.
- Invalid credentials are rejected.
- Protected endpoints reject unauthenticated requests.
- Logout behaves according to the implemented authentication mechanism.
- User information returned by the API does not expose sensitive fields.

### 8.3 Authorization integration

Verify that:

- An authorized administrator can perform permitted administrative operations.
- A regular user cannot perform administrator-only actions.
- A user cannot access another user's private resources without permission.
- Missing, invalid, or expired authentication credentials are rejected as appropriate.
- Authorization checks apply to direct API requests, not only frontend navigation.

### 8.4 Book-management integration

Verify that:

- Valid book creation persists the expected data.
- Newly created books can be retrieved according to visibility rules.
- Updates modify the intended record.
- Invalid input is rejected.
- Missing records produce the documented response.
- Deletion or archival follows the defined business rules.
- Related records remain consistent.

### 8.5 Author and category integration

Where supported, verify that:

- Valid relationships can be created.
- Invalid foreign-key references are rejected.
- Retrieval returns the expected relationships.
- Updates preserve valid relationships.
- Deletion follows the intended constraint and cleanup behavior.

### 8.6 Chapter integration

Where supported, verify that:

- A chapter can be associated with a valid book.
- A chapter referencing a nonexistent book is rejected.
- Chapter content and metadata persist correctly.
- Updates affect only the intended chapter.
- Chapter ordering follows the documented rules, if ordering exists.
- Authorization is enforced when modifying restricted content.

### 8.7 Private-library and file integration

Where implemented, verify that:

- A permitted user can access their own private resource.
- Another user cannot access that resource without authorization.
- Missing files are handled safely.
- Invalid upload inputs are rejected.
- Stored file metadata matches the actual resource.
- Unauthorized file requests do not disclose private file contents or storage paths.

### 8.8 Frontend and API integration

Verify that:

- Frontend requests use the documented endpoint and method.
- Request payloads match backend validation rules.
- Authentication information is sent according to the actual design.
- Successful responses update the interface correctly.
- Validation errors are displayed appropriately.
- Network failures do not leave the interface in a misleading state.
- Loading and empty states are handled correctly.

## 9. Integration Test Cases

The following cases are a baseline checklist. Adapt them to the endpoints and features actually implemented.

| Test ID | Scenario | Expected result |
|---|---|---|
| IT-001 | Start the application with valid configuration | Application starts successfully |
| IT-002 | Connect to the configured test database | Database operations can execute |
| IT-003 | Submit a valid registration request | Account is created according to the contract |
| IT-004 | Submit duplicate registration data | Request is rejected appropriately |
| IT-005 | Authenticate with valid credentials | Authentication succeeds |
| IT-006 | Authenticate with invalid credentials | Authentication fails safely |
| IT-007 | Access a protected route without credentials | Access is denied |
| IT-008 | Attempt an administrator-only operation as a regular user | Access is denied |
| IT-009 | Create a valid book | Expected data is persisted |
| IT-010 | Retrieve an existing book | Expected permitted data is returned |
| IT-011 | Update an existing book | Intended fields are updated |
| IT-012 | Request a nonexistent book | Documented not-found behavior occurs |
| IT-013 | Associate a book with a valid category | Relationship is persisted |
| IT-014 | Use an invalid relationship identifier | Request is rejected without corrupting data |
| IT-015 | Create a chapter for a valid book | Chapter and relationship are persisted |
| IT-016 | Create a chapter for a nonexistent book | Request is rejected |
| IT-017 | Access another user's private resource | Access is denied unless explicitly permitted |
| IT-018 | Submit malformed request data | Validation error is returned |
| IT-019 | Cause a controlled database failure | Error is handled without exposing sensitive details |
| IT-020 | Complete a frontend API workflow | Interface reflects the actual API result |

Do not mark a test passed until it has been executed and its result recorded.

## 10. Example Integration Test Structure

Use the test runner already configured in the repository. The following is a conceptual organization, not a requirement to install a particular framework.

```text
tests/
├── integration/
│   ├── application.integration.test.js
│   ├── authentication.integration.test.js
│   ├── authorization.integration.test.js
│   ├── books.integration.test.js
│   ├── categories.integration.test.js
│   ├── chapters.integration.test.js
│   └── private-library.integration.test.js
└── fixtures/
    └── test-data.js
```

Create only the files that correspond to the actual test setup and implemented features.

Integration tests should use the application's real routing and relevant database components where practical. Avoid replacing the component being tested with a mock when the purpose of the test is to verify its integration.

## 11. Example Test Scenario

### Scenario: Create a book and retrieve it

**Preconditions**

- The application is running in a test environment.
- The test database is accessible.
- A user with the required permissions is available.
- The API contract defines the required book fields.

**Steps**

1. Authenticate as an authorized user.
2. Submit a valid book-creation request.
3. Inspect the HTTP status and response structure.
4. Capture the created resource identifier.
5. Retrieve the created book using the documented endpoint.
6. Compare the returned fields with the submitted values and expected server-generated values.
7. Verify the database state when appropriate.
8. Clean up test data according to the test-environment policy.

**Expected result**

The book is created once, its persisted data matches the documented behavior, and retrieval returns the permitted representation of the created resource.

**Evidence to record**

- Test name or ID.
- Test execution date.
- Environment used.
- Actual HTTP responses.
- Database verification result, where applicable.
- Pass, fail, or blocked status.

## 12. Running Tests

First inspect the available scripts:

```powershell
Get-Content .\backend\package.json
```

If the backend directory is not present at that path, locate the actual package manifest before proceeding.

Inspect the configured test scripts and use the command that the project actually defines. For example, if a `test` script exists:

```powershell
Set-Location .\backend
npm test
```

Do not run this example blindly if the package manifest does not define the script.

For manually testing JSON APIs, PowerShell's `Invoke-RestMethod` can submit requests and display responses. Use the actual route paths and request bodies from the API specification or current route files.

Do not invent endpoint paths or authentication headers.

## 13. Failure Investigation

When an integration test fails:

1. Record the exact test and failure message.
2. Determine whether the failure originates in routing, middleware, controller, service, repository, database, or frontend integration.
3. Inspect application logs without exposing secrets.
4. Verify the test environment and database configuration.
5. Check the expected API contract.
6. Inspect database state and constraints where relevant.
7. Reproduce the issue with a minimal test case.
8. Fix the root cause rather than weakening the test without justification.
9. Rerun the failed test and relevant regression tests.
10. Record the final result.

A failure caused by a missing dependency or unavailable environment should be marked blocked, not passed.

## 14. Test Isolation and Reliability

Integration tests should:

- Use independent test data.
- Avoid relying on test execution order.
- Clean up resources created by the test.
- Use controlled database state.
- Avoid arbitrary delays when deterministic synchronization is possible.
- Avoid depending on external services unless the test specifically targets that integration.
- Avoid parallel execution when shared mutable data makes it unsafe.
- Produce diagnostic output sufficient to investigate failures.

If an operation spans multiple database tables, verify that failure handling does not leave inconsistent partial changes.

## 15. Security Considerations

Integration testing should include checks for:

- Missing authentication credentials.
- Invalid credentials.
- Insufficient roles.
- Cross-user resource access.
- Invalid foreign-key identifiers.
- Malformed request payloads.
- SQL injection attempts in applicable inputs.
- Unsafe file access.
- Sensitive information in API errors.
- Incorrect cookie or token behavior, if applicable.

These checks complement dedicated security testing. Passing integration tests does not establish that the application is completely secure.

## 16. Reporting Results

Record results in a test report with the following fields:

| Field | Description |
|---|---|
| Test ID | Unique test identifier |
| Scenario | Behavior being verified |
| Environment | Test environment and relevant configuration |
| Execution date | Date the test ran |
| Result | Passed, Failed, Blocked, or Not Run |
| Actual behavior | Observed result |
| Expected behavior | Required result |
| Evidence | Output, logs, or relevant test reference |
| Defect ID | Related defect, if any |
| Notes | Limitations or follow-up actions |

Do not record secrets or private user data in test reports.

## 17. Exit Criteria

Integration testing for a release is complete when:

- Required integration scenarios have been executed.
- Critical workflows have verified results.
- Relevant authentication and authorization scenarios have been tested.
- Database relationships and integrity have been checked.
- API contracts have been validated.
- Release-blocking defects are resolved or formally accepted.
- Failed and blocked tests are documented.
- Regression tests for resolved defects have been executed where appropriate.
- Test evidence is retained.
- Remaining risks and limitations are disclosed.

A test suite containing only passing tests is insufficient if required scenarios were never executed.

## 18. Maintenance

Update this document when routes, API contracts, database relationships, authentication behavior, file handling, or major application workflows change.

Keep the test plan aligned with the actual implementation and record current test results separately from the expected behavior described in this document.
