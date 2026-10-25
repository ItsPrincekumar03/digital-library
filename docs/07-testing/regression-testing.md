# Regression Testing

## 1. Purpose

This document defines the regression-testing strategy for the Digital Library project.

Regression testing verifies that changes to existing code, database structures, API contracts, security controls, or frontend behavior do not unintentionally break functionality that previously worked.

This document describes the testing process and expected checks. It does not claim that any regression test has been executed or passed without recorded evidence.

## 2. Project Context

Digital Library is a BTech final-year web application built using the approved technology stack:

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js and Express.js
- **Database:** MySQL
- **Architecture:** Monolithic application

Microservices are not part of the approved architecture.

The application includes the planned roles `USER` and `ADMIN`. Actual permissions and supported features must be confirmed from the current requirements and implementation.

## 3. Objectives

Regression testing should:

1. Detect defects introduced by recent changes.
2. Preserve existing authentication and authorization behavior.
3. Protect database integrity and relationships.
4. Verify previously working API contracts.
5. Prevent repeated defects from returning.
6. Confirm frontend workflows remain compatible with backend changes.
7. Detect unexpected changes in book, chapter, and category operations.
8. Verify that security fixes do not introduce new failures.
9. Support reliable integration and release decisions.
10. Maintain traceable test evidence across project versions.

## 4. When Regression Testing Is Required

Run relevant regression tests after:

- Fixing a defect.
- Modifying authentication or authorization.
- Changing a route or middleware.
- Updating a controller, service, or repository.
- Changing a database schema, constraint, or index.
- Modifying book, author, category, or chapter relationships.
- Changing publication or visibility rules.
- Updating file-upload or private-resource handling.
- Changing API response structures.
- Updating frontend API calls or shared JavaScript.
- Changing configuration or dependencies.
- Integrating contributions from multiple students.
- Preparing a release or academic demonstration.

The scope of testing should reflect the risk and impact of the change.

## 5. Regression Testing Principles

- Reproduce the original defect before fixing it when practical.
- Add a test that would fail under the defective behavior.
- Confirm that the test passes after the correction.
- Run related tests to identify side effects.
- Preserve previously defined acceptance criteria.
- Use isolated test data and a dedicated test database.
- Never weaken a test simply to make the suite pass.
- Record failed, blocked, and unexecuted tests honestly.
- Distinguish test coverage from proof of correctness.
- Avoid claiming that an entire module is verified based on a small selection of tests.

## 6. Regression Test Categories

### 6.1 Authentication

Recheck relevant behavior after authentication changes:

- Valid registration.
- Duplicate registration handling.
- Valid login.
- Invalid login.
- Protected-route access.
- Logout behavior.
- Handling of invalid or expired credentials, where applicable.
- Safe responses that do not expose sensitive account information.

### 6.2 Authorization

Recheck:

- Administrative operations with an authorized administrator.
- Attempts by regular users to perform restricted operations.
- Attempts to access resources owned by another user.
- Requests without authentication.
- Requests containing altered client-side role or ownership values.
- Direct API access that bypasses frontend restrictions.

### 6.3 Books

Recheck the implemented book workflows:

- Create a valid book.
- Retrieve an existing book.
- Update a book.
- Handle missing book identifiers.
- Reject invalid fields.
- Apply publication and visibility rules where implemented.
- Delete or archive records according to the defined behavior.
- Preserve valid relationships with other entities.

### 6.4 Authors and categories

Where implemented, recheck:

- Creating and retrieving metadata.
- Updating and deleting metadata.
- Associating books with authors or categories.
- Handling invalid relationship identifiers.
- Preventing inconsistent data after updates or deletion.

### 6.5 Chapters

Where implemented, recheck:

- Creating a chapter for a valid book.
- Retrieving chapter data.
- Updating chapter content and metadata.
- Rejecting invalid book references.
- Applying the correct access restrictions.
- Preserving chapter relationships and ordering where required.

### 6.6 Database integrity

Recheck:

- Primary-key behavior.
- Foreign-key constraints.
- Unique constraints.
- Required fields and nullability.
- Transaction behavior for multi-step operations.
- Data consistency after updates and deletion.
- Parameterized query behavior.
- Relevant indexes and query behavior after schema changes.

### 6.7 Private library and files

Where implemented, recheck:

- Access to an authorized user's own resources.
- Denial of unauthorized cross-user access.
- File metadata persistence.
- Invalid upload rejection.
- File-size and type restrictions.
- Missing-file handling.
- Prevention of path traversal and unauthorized downloads.

### 6.8 Frontend

Recheck:

- Login and registration forms.
- Navigation and page access.
- Book listings and details.
- Form validation and error messages.
- API request handling.
- Loading, empty, success, and failure states.
- Theme and background preferences where implemented.
- Reader controls and PDF behavior where implemented.
- Responsive layout and keyboard accessibility.

## 7. Regression Test Prioritization

Use risk-based prioritization.

| Priority | Scope | Typical triggers |
|---|---|---|
| P0 — Critical | Authentication, authorization, data integrity, application startup | Security fixes, database changes, authentication changes |
| P1 — High | Core book workflows, chapters, major API contracts | Changes to shared services, repositories, or endpoints |
| P2 — Medium | Frontend behavior, categories, preferences, noncritical workflows | UI changes or isolated feature updates |
| P3 — Low | Minor presentation details and low-impact changes | Small styling or documentation-related changes |

A low-priority label does not justify skipping a required test. Increase priority whenever the change affects security, private data, or critical workflows.

## 8. Regression Test Case Register

The following is a baseline test register. Adjust it to the actual implemented features and documented API.

| Test ID | Scenario | Expected result | Priority |
|---|---|---|---|
| RT-001 | Start the application with valid configuration | Application starts successfully | P0 |
| RT-002 | Connect to the test database | Database operations succeed | P0 |
| RT-003 | Register with valid input | Account is created according to the API contract | P0 |
| RT-004 | Register with duplicate data | Request is rejected appropriately | P1 |
| RT-005 | Log in with valid credentials | Authentication succeeds | P0 |
| RT-006 | Log in with invalid credentials | Authentication fails safely | P0 |
| RT-007 | Access a protected endpoint without credentials | Access is denied | P0 |
| RT-008 | Perform an administrative action as a regular user | Access is denied | P0 |
| RT-009 | Create and retrieve a book | Persisted data is returned correctly | P1 |
| RT-010 | Update an existing book | Intended fields change correctly | P1 |
| RT-011 | Request a nonexistent book | Documented not-found behavior occurs | P1 |
| RT-012 | Create an invalid book relationship | Request is rejected without inconsistent data | P1 |
| RT-013 | Create a chapter for a valid book | Chapter relationship is persisted correctly | P1 |
| RT-014 | Attempt unauthorized private-resource access | Access is denied | P0 |
| RT-015 | Submit malformed request data | Validation error is returned | P1 |
| RT-016 | Trigger a controlled server error | Error is handled without leaking sensitive details | P0 |
| RT-017 | Submit frontend form with invalid input | Clear validation feedback appears | P2 |
| RT-018 | Simulate an API failure in the frontend | Failure is handled without misleading success state | P2 |
| RT-019 | Apply a database schema change | Existing required workflows remain functional | P0 |
| RT-020 | Re-run a test for a previously fixed defect | Defect does not recur | Based on defect severity |

These cases define expected behavior, not actual test results.

## 9. Regression Testing Workflow

### Step 1: Identify the change

Record:

- Change or defect ID.
- Affected files.
- Affected API endpoints.
- Related database tables.
- Relevant frontend components.
- Security implications.
- Dependent modules.

### Step 2: Identify affected tests

Select tests that cover:

- The changed behavior.
- Direct dependencies.
- Shared components.
- Related error paths.
- Security boundaries.
- Previously observed regressions.

### Step 3: Establish the baseline

Inspect the current Git state and preserve uncommitted work.

```powershell
git status --short
git branch --show-current
git diff
```

Confirm that the test environment is configured correctly.

### Step 4: Execute tests

Run the project's existing test commands and relevant manual scenarios.

Do not assume a test runner or script exists. Inspect the applicable `package.json` and use the configured commands.

### Step 5: Analyze failures

For every failure:

1. Record the exact test and observed result.
2. Determine whether the failure is new or pre-existing.
3. Inspect the relevant code and application logs.
4. Check the test data and environment.
5. Identify the root cause.
6. Fix the issue or record it as an unresolved defect.

### Step 6: Verify the correction

Rerun the failed test and related regression tests.

Confirm that the fix does not break neighboring workflows.

### Step 7: Record the outcome

Update the regression report with actual results, evidence, and remaining limitations.

## 10. Running Tests in PowerShell

First inspect the available backend scripts:

```powershell
Get-Content .\backend\package.json
```

If that path does not exist, locate the actual backend package manifest.

When a `test` script is defined, an example command is:

```powershell
Set-Location .\backend
npm test
```

Use the project's real configured script. Do not assume that `npm test` exists or that it executes integration tests.

For manually testing APIs, PowerShell's `Invoke-RestMethod` can submit HTTP requests and display JSON responses. Use the actual route paths, payloads, and authentication method documented by the project.

Do not invent endpoints or modify shared data during testing without confirming that the environment is safe.

## 11. Regression Testing After Database Changes

Database changes can affect more than the feature being modified.

After a schema or query change, verify:

- Existing records remain valid.
- Foreign-key relationships still work.
- Required fields and uniqueness rules behave correctly.
- Inserts, updates, and deletes preserve expected relationships.
- Transactions roll back failed multi-step operations where required.
- Existing repository queries remain compatible.
- Relevant frontend workflows still receive the expected response format.

Use a dedicated test database. Never run destructive regression cleanup against production data.

## 12. Regression Testing After API Changes

When an endpoint changes, verify:

- HTTP method and route registration.
- Authentication and authorization middleware.
- Required request fields.
- Validation and error responses.
- Success status and response structure.
- Database effects.
- Dependent frontend requests.
- Other endpoints that reuse the changed service or repository.

Update the API specification when the contract changes intentionally.

A change that is technically valid can still cause a regression if existing consumers depend on the previous contract.

## 13. Defect Regression Tests

For each confirmed defect:

1. Record the original behavior.
2. Define the expected behavior.
3. Create a reproducible test.
4. Confirm the test detects the original problem when practical.
5. Apply the correction.
6. Execute the test again.
7. Run relevant related tests.
8. Record the result and evidence.

Use descriptive test names that explain the expected behavior.

Example scenario:

**Defect:** A user could attempt to access another user's private resource.

**Regression test:** Authenticate as User A and request a resource owned by User B.

**Expected result:** The server denies access unless the resource is explicitly shared or the documented authorization rules permit access.

The test must exercise the actual server-side authorization path rather than only checking frontend navigation.

## 14. Test Data and Isolation

- Use dedicated test accounts and records.
- Avoid relying on records from manual testing.
- Generate unique values where required.
- Reset only data owned by the test.
- Preserve database constraints.
- Avoid exposing personal or confidential data in reports.
- Ensure one test's cleanup does not remove another test's records.
- Avoid running concurrent tests against shared mutable data unless the test setup supports it safely.

## 15. Regression Results Template

Record each execution using the following format.

| Field | Value |
|---|---|
| Execution ID | Not recorded |
| Execution date | Not recorded |
| Branch or commit | Not recorded |
| Test environment | Not recorded |
| Change or defect ID | Not recorded |
| Test IDs executed | Not recorded |
| Passed | Not recorded |
| Failed | Not recorded |
| Blocked | Not recorded |
| Not run | Not recorded |
| Defects discovered | Not recorded |
| Evidence location | Not recorded |
| Reviewer | Not recorded |

Replace placeholders only after collecting the relevant evidence.

## 16. Exit Criteria

Regression testing for a change or release is complete when:

- Relevant affected tests have been identified.
- Required regression tests have been executed.
- Critical authentication and authorization scenarios have been checked.
- Database integrity has been verified where affected.
- Failed tests have been investigated.
- Release-blocking defects have been resolved or formally accepted.
- Fixes have been checked for repeated regressions.
- Actual results are recorded.
- Blocked and unexecuted tests are disclosed.
- Remaining risks and limitations are documented.

Do not report the entire suite as passing when some required tests were not executed.

## 17. Maintenance

Update this document when major workflows, API contracts, database relationships, authentication behavior, or the test framework changes.

Maintain regression cases alongside defect fixes and important feature changes. Keep expected behavior separate from recorded execution results so that the document remains accurate as the application evolves.
