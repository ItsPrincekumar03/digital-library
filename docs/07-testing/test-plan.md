# Digital Library — Test Plan

## 1. Purpose

This document defines the test plan for the Digital Library project. It identifies the testing scope, objectives, approach, resources, schedule-planning method, test cases, responsibilities, risks, and completion criteria.

The plan provides a repeatable process for verifying that implemented functionality meets the approved requirements and is suitable for academic demonstration or release.

This document describes planned testing activities. It does not claim that tests have been executed or passed without recorded evidence.

## 2. Project Overview

Digital Library is a BTech final-year web application intended to support digital book management and reading.

### 2.1 Approved technology stack

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js and Express.js
- **Database:** MySQL
- **Architecture:** Monolithic application

Microservices are not part of the approved architecture.

### 2.2 User roles

- `USER`
- `ADMIN`

The precise permissions associated with each role must match the verified requirements and implementation.

## 3. Test Plan Objectives

The test plan aims to:

1. Verify functional requirements and acceptance criteria.
2. Check authentication and authorization.
3. Validate API behavior and database integration.
4. Verify book, author, category, and chapter operations where implemented.
5. Check data integrity and relationship handling.
6. Verify private-resource access controls where implemented.
7. Test input validation and error handling.
8. Identify regressions caused by code or database changes.
9. Assess frontend workflows and browser behavior.
10. Record defects, results, and outstanding risks.
11. Support evidence-based module completion decisions.
12. Confirm readiness for the intended demonstration or release.

## 4. Scope of Testing

### 4.1 In scope

- Application startup and environment configuration.
- MySQL connectivity.
- Authentication and user management.
- Role and ownership authorization.
- Book-management operations.
- Author and category operations where supported.
- Chapter operations and book relationships.
- Publication and visibility rules where implemented.
- Private-library functionality where implemented.
- File upload and download behavior where implemented.
- Frontend-to-backend integration.
- API validation and error responses.
- Security and regression testing.
- Deployment-readiness checks.

### 4.2 Conditional features

Test the following only if they are included in the approved release and implemented:

- PDF rendering and navigation.
- Browser Speech Synthesis.
- Reader speed and pitch controls.
- Dark mode and background preferences.
- Advanced search and recommendations.
- AI-assisted features.
- OCR for scanned documents.

Planned features must not be reported as implemented or tested without evidence.

### 4.3 Out of scope

Unless separately approved, the test plan does not cover:

- Destructive testing against production.
- Unauthorized testing of external systems.
- Comprehensive infrastructure penetration testing.
- Formal security certification.
- High-volume load testing beyond an explicitly defined performance plan.

## 5. Testing Approach

Testing should proceed incrementally throughout development.

### 5.1 Unit testing

Verify isolated functions and business rules, including validation helpers and data transformations.

### 5.2 Integration testing

Verify interactions between routes, middleware, controllers, services, repositories, and MySQL where those layers exist.

### 5.3 System testing

Verify complete workflows across the integrated application.

### 5.4 Acceptance testing

Verify that implemented features satisfy their approved acceptance criteria.

### 5.5 Regression testing

Recheck existing behavior after code, API, database, configuration, or security changes.

### 5.6 Security testing

Verify authentication, authorization, ownership checks, SQL query safety, input handling, file access, and sensitive-information protection.

Refer to the project's detailed integration, regression, security, and test-case documents for execution procedures.

## 6. Test Environment

Use a dedicated development or test environment.

The environment may require:

- A supported Node.js runtime.
- Dependencies installed using the project's lock file.
- MySQL with an isolated test database.
- Test-specific environment variables.
- Controlled test accounts and records.
- The configured test runner, if available.
- A supported browser for frontend tests.
- Isolated storage for file-related tests.

### Environment rules

1. Never use production data for destructive test scenarios.
2. Keep credentials out of test reports and version control.
3. Record the application commit or version being tested.
4. Ensure test data can be safely created and cleaned up.
5. Record configuration problems that prevent execution.
6. Do not mark blocked tests as passed.

## 7. Test Data Requirements

Prepare synthetic data for the required scenarios.

Potential test data includes:

- A valid regular user.
- A valid administrator.
- Invalid authentication credentials.
- Books with distinct identifiers.
- Authors and categories where supported.
- Chapters linked to valid books.
- Resources owned by separate test users.
- Invalid relationship identifiers.
- Files representing supported and rejected upload cases.

These are proposed test fixtures, not a claim that the records currently exist.

Test data must be repeatable, isolated, and cleaned up without damaging unrelated records.

## 8. Test Case Categories

| Category | Main objective | Priority |
|---|---|---|
| Startup and configuration | Confirm the application initializes correctly | P0 |
| Authentication | Verify credential and protected-route behavior | P0 |
| Authorization | Verify role and ownership restrictions | P0 |
| Database integration | Verify persistence and relationship integrity | P0 |
| Book management | Verify core book operations | P1 |
| Chapters and relationships | Verify related-record operations | P1 |
| Input validation | Reject invalid or unexpected input | P1 |
| Frontend integration | Verify API-driven user workflows | P1 |
| File handling | Verify safe uploads and authorized access | P0/P1 |
| Regression | Detect unintended behavior changes | Risk-based |
| Appearance and usability | Verify interface behavior | P2 |
| Future features | Verify approved later-release functionality | As scheduled |

### Priority definitions

- **P0 — Critical:** Security, authentication, data integrity, and essential startup.
- **P1 — High:** Core application workflows and major integration behavior.
- **P2 — Medium:** Supporting functionality and user-interface behavior.
- **P3 — Low:** Minor presentation and low-impact usability issues.

Priorities must be adjusted when the actual impact of a failure warrants it.

## 9. Core Test Scenarios

The following scenarios form the initial test baseline. Adapt them to actual routes, features, and API contracts.

| Test ID | Scenario | Expected outcome |
|---|---|---|
| TP-001 | Start the application with valid configuration | Application starts according to its design |
| TP-002 | Connect to the test database | Database operations are available |
| TP-003 | Register with valid data | Account is created according to the API contract |
| TP-004 | Register with invalid or duplicate data | Request is rejected appropriately |
| TP-005 | Log in with valid credentials | Authentication succeeds |
| TP-006 | Log in with invalid credentials | Authentication fails safely |
| TP-007 | Access a protected endpoint without credentials | Access is denied |
| TP-008 | Attempt an administrator operation as a regular user | Access is denied |
| TP-009 | Create and retrieve a book | Expected data is persisted and returned |
| TP-010 | Update an existing book | Intended fields change correctly |
| TP-011 | Use an invalid relationship identifier | Invalid relationship is rejected |
| TP-012 | Create a chapter for a valid book | Chapter relationship is persisted |
| TP-013 | Access another user's private resource | Unauthorized access is denied |
| TP-014 | Submit malformed input | Validation or safe error handling occurs |
| TP-015 | Trigger a controlled internal error | Sensitive implementation details are not exposed |
| TP-016 | Complete a frontend API workflow | Interface reflects the actual backend result |
| TP-017 | Recheck a previously fixed defect | The defect does not recur |
| TP-018 | Verify supported file restrictions | Invalid uploads or unauthorized access are rejected |

These scenarios define expected behavior. Their actual execution status must be recorded separately.

## 10. Test Execution Procedure

### Step 1: Review requirements

Identify the relevant requirements, acceptance criteria, and feature scope.

### Step 2: Inspect implementation

Confirm which endpoints, pages, database objects, and features actually exist.

### Step 3: Prepare test cases

Define preconditions, input data, steps, and expected results.

### Step 4: Prepare the environment

Confirm dependencies, configuration, database access, and test isolation.

### Step 5: Execute tests

Run the appropriate automated tests and manual scenarios.

### Step 6: Record results

Record the observed behavior and supporting evidence.

### Step 7: Report defects

Document failures with reproducible steps, severity, and affected components.

### Step 8: Retest fixes

Repeat the failed tests and relevant regression tests after corrections.

### Step 9: Review completion

Confirm that required scenarios have evidence and that remaining risks are documented.

## 11. Running Tests

Inspect the project's actual package scripts before running tests:

```powershell
Get-Content .\backend\package.json
```

If the backend package manifest is located elsewhere, use its actual path.

If the project defines a `test` script, an example is:

```powershell
Set-Location .\backend
npm test
```

Do not assume this command is valid until the configured script has been inspected.

For manual API testing, PowerShell's `Invoke-RestMethod` can submit HTTP requests and display JSON responses. Use the actual endpoint paths, request bodies, and authentication mechanism documented in the project.

Do not invent route paths or run destructive requests against an unintended database.

## 12. Defect Management

For every failed test, record:

- Defect ID.
- Related test ID.
- Short description.
- Affected module.
- Severity and priority.
- Preconditions and reproduction steps.
- Expected result.
- Actual result.
- Environment and tested commit.
- Evidence location.
- Assigned owner.
- Fix reference.
- Retest result.
- Current status.

### Defect severity

| Severity | Description |
|---|---|
| Critical | Severe security, data-integrity, or core-system failure |
| High | Major functional or security defect |
| Medium | Significant defect with limited scope |
| Low | Minor issue with limited impact |

Classify severity using observed impact and exploitability rather than assumptions.

## 13. Test Responsibilities

The project has been discussed as a four-student team:

- Prince Madhesia
- Prince Kumar
- Ritwiz Gupta
- Mukesh Yadav

The specific testing assignments must be confirmed with the team's current task allocation.

For each test cycle, designate:

- Test owner.
- Implementing developer, if applicable.
- Reviewer.
- Required environment.
- Evidence location.
- Completion decision owner.

A developer should communicate relevant changes and test results to the team, especially when shared APIs, database structures, or security controls are affected.

## 14. Schedule Planning

Create the actual testing schedule after confirming the release scope, remaining work, team availability, and dependencies.

| Activity | Planned date | Owner | Status |
|---|---|---|---|
| Test preparation | Not scheduled | Not assigned | Not Verified |
| Backend integration testing | Not scheduled | Not assigned | Not Verified |
| Frontend system testing | Not scheduled | Not assigned | Not Verified |
| Security testing | Not scheduled | Not assigned | Not Verified |
| Regression testing | Not scheduled | Not assigned | Not Verified |
| Defect retesting | Not scheduled | Not assigned | Not Verified |
| Release-readiness review | Not scheduled | Not assigned | Not Verified |

Do not invent deadlines or mark an activity complete without evidence.

## 15. Entry Criteria

A test activity can begin when:

- The requirement is sufficiently clear.
- The relevant implementation is available.
- Expected behavior is documented.
- Required dependencies are accessible.
- The environment is suitable.
- Test data can be prepared safely.
- The test has identifiable expected results.

If these conditions are not met, record the blocker.

## 16. Exit Criteria

A test cycle can be considered complete when:

- Required test cases have been executed.
- Actual results have been recorded.
- Critical workflows have supporting evidence.
- Relevant security scenarios have been tested.
- Failures have been investigated.
- Release-blocking defects are resolved or formally accepted.
- Blocked and unexecuted tests are disclosed.
- Relevant regression tests have been performed.
- Test reports and evidence are available.
- Remaining risks and limitations are documented.

A passing subset of tests does not prove that the whole application is verified.

## 17. Test Execution Report Template

| Field | Value |
|---|---|
| Test cycle ID | Not recorded |
| Execution date | Not recorded |
| Branch or commit | Not recorded |
| Environment | Not recorded |
| Planned tests | Not recorded |
| Executed tests | Not recorded |
| Passed | Not recorded |
| Failed | Not recorded |
| Blocked | Not recorded |
| Not run | Not recorded |
| Open defects | Not recorded |
| Evidence location | Not recorded |
| Reviewer | Not recorded |

Update this table only with actual execution information.

## 18. Risks and Mitigations

| Risk | Potential impact | Mitigation |
|---|---|---|
| Incomplete requirements | Missing or incorrect test coverage | Define testable acceptance criteria |
| Shared database state | Unreliable or destructive test results | Use isolated test data and cleanup |
| Unverified implementation | False completion claims | Inspect current code and test evidence |
| Incomplete authorization checks | Unauthorized access | Test role and ownership restrictions |
| Schema changes | Broken relationships or queries | Run database integration and regression tests |
| Frontend/API mismatch | Broken user workflows | Validate contracts end to end |
| Environment differences | Inconsistent results | Record and standardize test configuration |
| Time constraints | Important scenarios omitted | Prioritize high-risk workflows first |

## 19. Reporting and Evidence

Evidence may include:

- Test-run output.
- HTTP request and response records.
- Sanitized application logs.
- Database verification results.
- Browser screenshots where appropriate.
- Test-runner reports.
- Relevant commit hashes.
- Defect records and retest results.

Do not include passwords, live tokens, session cookies, private documents, or unnecessary personal information.

Each result must identify the environment and version or commit when available.

## 20. Completion Checklist

- [ ] Requirements and acceptance criteria have been reviewed.
- [ ] Test environment is documented.
- [ ] Test data is isolated and controlled.
- [ ] Required functional tests have been executed.
- [ ] Relevant integration tests have been executed.
- [ ] Authentication and authorization have been checked.
- [ ] Database integrity has been verified where applicable.
- [ ] Security tests have recorded results.
- [ ] Relevant regression tests have been executed.
- [ ] Defects and retest results are documented.
- [ ] Blocked and unexecuted tests are disclosed.
- [ ] Evidence is available.
- [ ] Release risks and limitations are documented.

## 21. Maintenance

Update this plan when requirements, modules, APIs, database relationships, security controls, test tooling, or release goals change.

Keep this plan consistent with `testing-strategy.md`, `testing-strategy.md`'s related integration and regression guidance, and the detailed `test-cases.md` document.

The plan defines intended verification activities. Only recorded execution evidence can establish actual test results.
