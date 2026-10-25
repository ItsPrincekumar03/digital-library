# Digital Library — Test Cases

## 1. Purpose

This document defines the test cases used to verify the Digital Library application's functional behavior, integration, security, and user workflows.

Each test case describes its objective, preconditions, execution steps, expected result, and actual result status. The test cases provide a repeatable basis for manual and automated testing.

**Important:** These are planned test cases. They must not be treated as executed or passed until the corresponding tests have been performed and their results recorded.

## 2. Project Context

Digital Library is a BTech final-year project using the following approved technology stack:

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js and Express.js
- **Database:** MySQL
- **Architecture:** Monolithic application

The application uses the roles `USER` and `ADMIN`. Exact permissions and available features must be verified against the current requirements and implementation.

## 3. Test Case Format

Each test case should include:

- **Test ID:** Unique identifier.
- **Test title:** Short description of the scenario.
- **Module:** Component being tested.
- **Priority:** Importance of the test.
- **Type:** Functional, integration, security, regression, or usability.
- **Preconditions:** Required setup and data.
- **Test data:** Input values or records needed.
- **Steps:** Actions to execute.
- **Expected result:** Required behavior.
- **Actual result:** Observed behavior after execution.
- **Status:** Not Run, Passed, Failed, or Blocked.
- **Evidence:** Output, logs, screenshots, or test report reference.
- **Notes:** Defects, limitations, or follow-up actions.

## 4. Priority Definitions

| Priority | Meaning |
|---|---|
| P0 — Critical | Security, authentication, data integrity, or essential application startup |
| P1 — High | Core library functionality and major API workflows |
| P2 — Medium | Supporting features and frontend behavior |
| P3 — Low | Minor usability or presentation details |

Priority should reflect the actual impact of a failure, not just the feature name.

## 5. Test Environment

Use a dedicated development or test environment with:

- The required Node.js runtime and project dependencies.
- MySQL configured for testing.
- Valid test-specific environment variables.
- Test accounts with controlled roles.
- Test records that can be safely created and removed.
- The test runner configured by the project, if available.
- A browser for frontend tests, where applicable.

Do not run destructive test cases against production data.

Record the branch or commit being tested and ensure the environment matches the intended test scope.

## 6. Application Startup and Configuration

### TC-001: Start the backend with valid configuration

- **Module:** Backend foundation
- **Priority:** P0
- **Type:** Integration

**Preconditions**

Required configuration and dependencies are available.

**Steps**

1. Navigate to the actual backend directory.
2. Start the application using the configured project command.
3. Observe startup output.
4. Confirm whether the database connection is established.

**Expected result**

The application starts without configuration errors and connects to the intended database when database access is required.

**Actual result:** Not recorded

**Status:** Not Run

### TC-002: Start the backend with invalid database configuration

- **Module:** Configuration and database
- **Priority:** P0
- **Type:** Negative integration test

**Steps**

1. Use an isolated test configuration with an intentionally invalid database setting.
2. Start the application.
3. Observe the startup behavior.
4. Review the resulting logs.

**Expected result**

The application handles the connection failure according to its startup policy and does not expose secrets.

**Actual result:** Not recorded

**Status:** Not Run

### TC-003: Verify the health endpoint

- **Module:** Backend foundation
- **Priority:** P1
- **Type:** API integration

**Steps**

1. Inspect the registered routes to identify the health endpoint, if present.
2. Send a request using the documented HTTP method.
3. Inspect the status and response body.

**Expected result**

The endpoint behaves according to its documented contract.

**Actual result:** Not recorded

**Status:** Not Run

## 7. Authentication Test Cases

### TC-004: Register with valid data

- **Module:** Authentication
- **Priority:** P0
- **Type:** Functional

**Preconditions**

The registration endpoint exists and the test database is available.

**Steps**

1. Submit a valid registration request using the documented fields.
2. Inspect the response.
3. Verify that the account was created as expected.
4. Confirm that no plaintext password is stored.

**Expected result**

The account is created according to the API contract, with secure password storage.

**Actual result:** Not recorded

**Status:** Not Run

### TC-005: Register with missing required fields

- **Module:** Authentication
- **Priority:** P1
- **Type:** Negative functional

**Steps**

1. Submit a registration request with a required field omitted.
2. Inspect the response.
3. Verify that no invalid account is created.

**Expected result**

The request is rejected with the documented validation response.

**Actual result:** Not recorded

**Status:** Not Run

### TC-006: Register with duplicate account data

- **Module:** Authentication
- **Priority:** P1
- **Type:** Negative functional

**Preconditions**

A test account with the relevant unique field already exists.

**Steps**

1. Submit another registration request using the same unique value.
2. Inspect the response.
3. Verify the database state.

**Expected result**

The duplicate account is not created and the application handles the conflict consistently.

**Actual result:** Not recorded

**Status:** Not Run

### TC-007: Log in with valid credentials

- **Module:** Authentication
- **Priority:** P0
- **Type:** Functional

**Steps**

1. Submit valid test credentials.
2. Inspect the response.
3. Verify that the documented authentication mechanism is established.
4. Request an endpoint that requires authentication.

**Expected result**

Authentication succeeds and the user can access permitted protected resources.

**Actual result:** Not recorded

**Status:** Not Run

### TC-008: Log in with invalid credentials

- **Module:** Authentication
- **Priority:** P0
- **Type:** Negative functional

**Steps**

1. Submit an incorrect password or invalid credentials.
2. Inspect the response.
3. Attempt to access a protected endpoint without valid authentication.

**Expected result**

Authentication fails, protected access is denied, and sensitive details are not disclosed.

**Actual result:** Not recorded

**Status:** Not Run

### TC-009: Access a protected endpoint without authentication

- **Module:** Authentication and authorization
- **Priority:** P0
- **Type:** Security

**Steps**

1. Identify a documented protected endpoint.
2. Send a request without authentication credentials.
3. Inspect the status and response.

**Expected result**

The server denies access according to the API contract.

**Actual result:** Not recorded

**Status:** Not Run

### TC-010: Verify logout behavior

- **Module:** Authentication
- **Priority:** P1
- **Type:** Functional and security

**Preconditions**

The application supports logout.

**Steps**

1. Authenticate using a test account.
2. Confirm access to a protected endpoint.
3. Perform logout using the documented mechanism.
4. Repeat the protected request using the previous credentials.

**Expected result**

Logout behaves according to the implemented token or session invalidation design.

**Actual result:** Not recorded

**Status:** Not Run

## 8. Authorization Test Cases

### TC-011: Administrator performs an authorized operation

- **Module:** Authorization
- **Priority:** P0
- **Type:** Functional and security

**Preconditions**

A test administrator exists and the operation is supported.

**Steps**

1. Authenticate as the administrator.
2. Submit a valid administrative request.
3. Inspect the response and resulting data.

**Expected result**

The operation succeeds when the account has the required permission.

**Actual result:** Not recorded

**Status:** Not Run

### TC-012: Regular user attempts an administrator-only operation

- **Module:** Authorization
- **Priority:** P0
- **Type:** Security

**Steps**

1. Authenticate as a regular user.
2. Submit a request to an administrator-only endpoint.
3. Verify that the database remains unchanged.

**Expected result**

The server denies the operation and does not apply unauthorized changes.

**Actual result:** Not recorded

**Status:** Not Run

### TC-013: User attempts to access another user's private resource

- **Module:** Authorization and private library
- **Priority:** P0
- **Type:** Security

**Preconditions**

Two test users exist, and one owns a private resource.

**Steps**

1. Authenticate as the resource owner and verify permitted access.
2. Authenticate as the second user.
3. Request the first user's private resource.
4. Verify that no private content is disclosed.

**Expected result**

Access is denied unless the documented sharing or authorization rules explicitly permit it.

**Actual result:** Not recorded

**Status:** Not Run

## 9. Book Management Test Cases

### TC-014: Create a book with valid data

- **Module:** Books
- **Priority:** P1
- **Type:** Functional and integration

**Preconditions**

The book-creation endpoint exists and the test account has the required permission.

**Steps**

1. Submit a valid book-creation request.
2. Inspect the HTTP status and response body.
3. Retrieve the created record.
4. Verify the persisted data.

**Expected result**

The book is created once and the returned information matches the documented contract.

**Actual result:** Not recorded

**Status:** Not Run

### TC-015: Create a book with invalid data

- **Module:** Books
- **Priority:** P1
- **Type:** Negative functional

**Steps**

1. Submit a request missing a required field or containing an invalid value.
2. Inspect the response.
3. Verify that invalid data was not persisted.

**Expected result**

The request is rejected safely with the documented validation behavior.

**Actual result:** Not recorded

**Status:** Not Run

### TC-016: Retrieve an existing book

- **Module:** Books
- **Priority:** P1
- **Type:** Functional

**Steps**

1. Identify a valid test book.
2. Request it using the documented endpoint.
3. Inspect the returned data and access permissions.

**Expected result**

The endpoint returns the expected permitted representation of the book.

**Actual result:** Not recorded

**Status:** Not Run

### TC-017: Retrieve a nonexistent book

- **Module:** Books
- **Priority:** P1
- **Type:** Negative functional

**Steps**

1. Request a book identifier that does not exist.
2. Inspect the response.

**Expected result**

The API returns its documented not-found response without exposing internal details.

**Actual result:** Not recorded

**Status:** Not Run

### TC-018: Update an existing book

- **Module:** Books
- **Priority:** P1
- **Type:** Functional

**Steps**

1. Create or identify a test book.
2. Submit a valid update request using the documented endpoint.
3. Retrieve the book again.
4. Compare the modified and unchanged fields.

**Expected result**

Only the intended fields change and the record remains consistent.

**Actual result:** Not recorded

**Status:** Not Run

### TC-019: Delete or archive a book

- **Module:** Books
- **Priority:** P1
- **Type:** Functional and integration

**Preconditions**

The application supports deletion, archiving, or both.

**Steps**

1. Create a disposable test book.
2. Perform the documented operation.
3. Attempt to retrieve the record.
4. Check dependent relationships and database consistency.

**Expected result**

The record follows the documented deletion or archival rules without unintended data loss.

**Actual result:** Not recorded

**Status:** Not Run

### TC-020: Verify book visibility and publication rules

- **Module:** Books
- **Priority:** P1
- **Type:** Functional and authorization

**Preconditions**

The implementation includes publication or visibility states.

**Steps**

1. Create or identify test books with supported visibility states.
2. Request each book as an authorized user.
3. Repeat the requests as a user without the required permissions.
4. Compare the results with the documented rules.

**Expected result**

Each user receives only the books and information permitted by the application rules.

**Actual result:** Not recorded

**Status:** Not Run

## 10. Author and Category Test Cases

### TC-021: Create and retrieve a category

- **Module:** Categories
- **Priority:** P2
- **Type:** Functional

**Preconditions**

Category management is implemented.

**Steps**

1. Submit valid category data using the documented endpoint.
2. Retrieve the category.
3. Compare the returned data with the submitted values.

**Expected result**

The category is created and retrieved according to the API contract.

**Actual result:** Not recorded

**Status:** Not Run

### TC-022: Reject an invalid category relationship

- **Module:** Categories and books
- **Priority:** P1
- **Type:** Integration

**Steps**

1. Submit a book or relationship request containing a nonexistent category identifier.
2. Inspect the response.
3. Verify database consistency.

**Expected result**

The invalid relationship is rejected without creating inconsistent data.

**Actual result:** Not recorded

**Status:** Not Run

### TC-023: Verify author relationships

- **Module:** Authors and books
- **Priority:** P2
- **Type:** Integration

**Preconditions**

Author management and book-author relationships are implemented.

**Steps**

1. Create or identify a valid author and book.
2. Establish the supported relationship.
3. Retrieve the relevant records.
4. Verify the relationship.

**Expected result**

The relationship matches the documented schema and API behavior.

**Actual result:** Not recorded

**Status:** Not Run

## 11. Chapter Test Cases

### TC-024: Create a chapter for a valid book

- **Module:** Chapters
- **Priority:** P1
- **Type:** Integration

**Preconditions**

Chapter management is implemented and a valid test book exists.

**Steps**

1. Submit valid chapter data for the book.
2. Inspect the response.
3. Retrieve the chapter and associated book information.
4. Verify the stored relationship.

**Expected result**

The chapter is created and associated with the intended book.

**Actual result:** Not recorded

**Status:** Not Run

### TC-025: Reject a chapter referencing a nonexistent book

- **Module:** Chapters
- **Priority:** P1
- **Type:** Negative integration

**Steps**

1. Submit a chapter request with a nonexistent book identifier.
2. Inspect the response.
3. Verify that no invalid relationship was persisted.

**Expected result**

The request is rejected and database integrity is preserved.

**Actual result:** Not recorded

**Status:** Not Run

### TC-026: Update a chapter

- **Module:** Chapters
- **Priority:** P1
- **Type:** Functional

**Steps**

1. Create or identify a test chapter.
2. Submit a valid update request.
3. Retrieve the chapter again.
4. Compare the updated values.

**Expected result**

The intended fields are updated without affecting unrelated chapters.

**Actual result:** Not recorded

**Status:** Not Run

## 12. Database and API Test Cases

### TC-027: Verify database constraints

- **Module:** Database
- **Priority:** P0
- **Type:** Integration

**Steps**

1. Identify relevant primary keys, foreign keys, and unique constraints.
2. Submit valid operations.
3. Attempt invalid relationship or duplicate operations in the test database.
4. Inspect the resulting database state.

**Expected result**

Database constraints and application validation preserve data integrity.

**Actual result:** Not recorded

**Status:** Not Run

### TC-028: Verify parameterized SQL operations

- **Module:** Database security
- **Priority:** P0
- **Type:** Security

**Steps**

1. Inspect the relevant repository queries.
2. Identify endpoints accepting user-controlled values.
3. Submit representative unusual input in the test environment.
4. Verify that the input does not alter query structure or access unauthorized records.

**Expected result**

User input is handled safely and cannot change the intended SQL operation.

**Actual result:** Not recorded

**Status:** Not Run

### TC-029: Verify malformed request handling

- **Module:** API validation
- **Priority:** P1
- **Type:** Negative integration

**Steps**

1. Submit malformed JSON or invalid request data to a documented endpoint.
2. Inspect the response.
3. Verify that no unintended operation occurs.

**Expected result**

The API handles invalid input according to its documented error contract.

**Actual result:** Not recorded

**Status:** Not Run

### TC-030: Verify safe error responses

- **Module:** Error handling
- **Priority:** P0
- **Type:** Security and integration

**Steps**

1. Trigger a controlled failure in the test environment.
2. Inspect the public API response.
3. Review server logs separately.

**Expected result**

The response does not expose stack traces, credentials, SQL details, or other unnecessary internal information.

**Actual result:** Not recorded

**Status:** Not Run

## 13. File and Private-Library Test Cases

Run these cases only if the corresponding functionality exists.

### TC-031: Reject an oversized upload

- **Module:** File handling
- **Priority:** P1
- **Type:** Security

**Steps**

1. Inspect the configured upload limit.
2. Submit a test file exceeding that limit.
3. Inspect the response and storage state.

**Expected result**

The file is rejected and no unauthorized or incomplete resource is left behind.

**Actual result:** Not recorded

**Status:** Not Run

### TC-032: Reject an unsupported file type

- **Module:** File handling
- **Priority:** P1
- **Type:** Security

**Steps**

1. Identify the file types allowed by the actual implementation.
2. Submit a test file of an unsupported type.
3. Inspect the response and storage state.

**Expected result**

Unsupported files are rejected according to the upload policy.

**Actual result:** Not recorded

**Status:** Not Run

### TC-033: Verify private file access

- **Module:** Private library
- **Priority:** P0
- **Type:** Security

**Steps**

1. Create a private test resource for User A.
2. Confirm permitted access as User A.
3. Attempt access as User B.
4. Inspect the response and verify that private content is not disclosed.

**Expected result**

Access is enforced according to the documented ownership and sharing rules.

**Actual result:** Not recorded

**Status:** Not Run

## 14. Frontend Test Cases

Execute these tests when the relevant frontend pages are implemented.

### TC-034: Validate frontend forms

- **Module:** Frontend
- **Priority:** P2
- **Type:** Functional and usability

**Steps**

1. Open the relevant form.
2. Submit missing or invalid fields.
3. Observe the validation feedback.
4. Submit valid test data.

**Expected result**

The interface provides understandable feedback and submits valid data according to the API contract.

**Actual result:** Not recorded

**Status:** Not Run

### TC-035: Handle API failures

- **Module:** Frontend integration
- **Priority:** P2
- **Type:** Integration

**Steps**

1. Trigger a controlled API failure in the test environment.
2. Submit the relevant frontend action.
3. Observe the displayed result.
4. Confirm that the interface does not falsely indicate success.

**Expected result**

The interface communicates the failure clearly and remains usable.

**Actual result:** Not recorded

**Status:** Not Run

### TC-036: Verify theme preferences

- **Module:** Frontend preferences
- **Priority:** P3
- **Type:** Functional

**Preconditions**

Dark mode or background preferences are implemented.

**Steps**

1. Change the appearance preference.
2. Navigate to another supported page.
3. Observe whether the preference is applied according to the requirements.

**Expected result**

Appearance behavior matches the documented preference-persistence rules.

**Actual result:** Not recorded

**Status:** Not Run

### TC-037: Verify reader functionality

- **Module:** Reader
- **Priority:** P1
- **Type:** Functional and compatibility

**Preconditions**

The reader feature is implemented.

**Steps**

1. Open a supported test document.
2. Verify that content loads.
3. Exercise supported navigation and reader controls.
4. Test relevant error handling with an invalid or unavailable document.

**Expected result**

The reader follows its documented behavior and handles unsupported or unavailable content safely.

**Actual result:** Not recorded

**Status:** Not Run

## 15. Test Execution Summary

Use this table to record actual execution results.

| Metric | Value |
|---|---|
| Total planned test cases | 37 |
| Executed | Not recorded |
| Passed | Not recorded |
| Failed | Not recorded |
| Blocked | Not recorded |
| Not Run | Not recorded |
| Execution date | Not recorded |
| Tested commit | Not recorded |

The count of 37 refers to the test cases defined in this document, not the number executed or passed.

## 16. Defect Reporting

For each failed test, record:

- Defect ID.
- Related test ID.
- Description.
- Preconditions and reproduction steps.
- Expected result.
- Actual result.
- Severity and priority.
- Affected files or components.
- Evidence location.
- Assigned owner.
- Fix status.
- Retest result.

Avoid recording passwords, active tokens, or unnecessary private user data in defect reports.

## 17. Completion Criteria

Testing for a module or release is complete when:

- Required test cases have been executed.
- Actual results have been recorded.
- Critical failures have been resolved or formally accepted.
- Security-sensitive behavior has been verified.
- Relevant integration and regression tests have been executed.
- Test evidence is available.
- Blocked and unexecuted tests are disclosed.
- Known limitations and remaining defects are documented.

Do not mark a module complete merely because all test cases have been written.

## 18. Maintenance

Update this document when new features, API endpoints, database relationships, security requirements, or reader capabilities are introduced.

Add test cases for significant defects and preserve them as regression tests. Keep planned scenarios, actual results, and final completion decisions clearly separated.
