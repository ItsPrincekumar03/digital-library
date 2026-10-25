# Digital Library — Testing Strategy

## 1. Purpose

This document defines the overall testing strategy for the Digital Library project. It establishes the testing levels, test types, responsibilities, environment requirements, execution process, defect handling, and completion criteria used to assess application quality.

The strategy supports incremental development, safe integration, and reliable delivery of the project's approved features.

This document defines the intended testing approach. It does not claim that tests have been executed or passed without recorded evidence.

## 2. Project Context

Digital Library is a BTech final-year project using the following approved technology stack:

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js and Express.js
- **Database:** MySQL
- **Architecture:** Monolithic application

Microservices are not part of the approved architecture.

The primary roles are `USER` and `ADMIN`. Exact role permissions, supported endpoints, and available features must be confirmed against the current requirements and implementation.

## 3. Testing Objectives

The testing process should:

1. Verify that implemented features meet their acceptance criteria.
2. Detect defects before integration and release.
3. Verify API behavior and database operations.
4. Confirm authentication and authorization rules.
5. Protect data integrity and private resources.
6. Detect regressions after code or schema changes.
7. Verify frontend behavior and backend integration.
8. Check error handling and invalid-input behavior.
9. Support repeatable manual and automated testing.
10. Provide evidence-based completion reports.
11. Identify unresolved defects and limitations.
12. Support academic demonstrations and project evaluation.

## 4. Testing Principles

- Begin testing as soon as a testable component is available.
- Define expected behavior before executing tests.
- Derive test cases from requirements and acceptance criteria.
- Test normal, boundary, invalid, and unauthorized scenarios.
- Prioritize security-sensitive and data-integrity behavior.
- Use isolated test data and environments.
- Automate repeatable checks where practical.
- Preserve tests for important previously fixed defects.
- Record actual results rather than assumptions.
- Keep planned tests separate from executed tests.
- Investigate failures before changing expectations.
- Do not report an unexecuted test as passed.

## 5. Testing Scope

### 5.1 Included areas

- Application configuration and startup.
- MySQL connectivity and repository operations.
- Authentication and user management.
- Role and ownership authorization.
- Book management.
- Author and category operations where implemented.
- Chapter management.
- Book relationships and visibility rules where implemented.
- Private-library functionality where implemented.
- File upload and access control where implemented.
- Frontend-to-backend integration.
- Input validation and error handling.
- Security and regression testing.
- Deployment-readiness checks.

### 5.2 Conditional or future areas

The following should be tested only when they are part of the approved scope and implementation:

- PDF reader controls.
- Browser Speech Synthesis.
- Playback speed and pitch behavior.
- Theme and background preferences.
- Advanced search and recommendations.
- AI-assisted search or translation.
- OCR for scanned documents.

A planned feature must not be counted as implemented merely because it appears in the roadmap.

## 6. Testing Levels

### 6.1 Unit testing

**Purpose:** Verify individual functions or modules in isolation.

Examples:

- Input-validation functions.
- Business-rule functions.
- Utility functions.
- Data transformation logic.
- Permission-decision helpers.

Unit tests should be fast, deterministic, and independent of production services.

### 6.2 Integration testing

**Purpose:** Verify that related components work together.

Examples:

- Express routes and middleware.
- Controllers and services.
- Services and repositories.
- Repositories and MySQL.
- Authentication middleware and protected endpoints.
- Frontend API calls and backend responses.

See `integration-testing.md` for the detailed integration-testing approach.

### 6.3 System testing

**Purpose:** Verify the integrated application against its requirements.

Examples:

- Complete registration and login workflows.
- Creating and retrieving a book.
- Managing chapters and relationships.
- Accessing private resources.
- Completing reader workflows where implemented.

### 6.4 Acceptance testing

**Purpose:** Determine whether the application meets the agreed user and academic project requirements.

Acceptance testing should use documented acceptance criteria and representative user workflows.

### 6.5 Regression testing

**Purpose:** Verify that changes have not broken existing behavior.

Run relevant regression tests after bug fixes, schema changes, API changes, security changes, and major integration work.

See `regression-testing.md` for detailed guidance.

## 7. Test Types

| Test type | Purpose |
|---|---|
| Functional | Verify that features behave as specified |
| Negative | Verify safe handling of invalid or rejected operations |
| Integration | Verify interaction between components |
| Regression | Detect defects introduced by changes |
| Security | Verify authentication, authorization, and defensive controls |
| Database | Verify persistence, constraints, and relationships |
| API | Verify methods, inputs, responses, and status codes |
| Usability | Evaluate clarity and consistency of the interface |
| Accessibility | Check keyboard operation, labels, contrast, and related needs |
| Compatibility | Check supported browsers and runtime environments |
| Performance | Assess response time and resource behavior under defined workloads |
| Deployment | Verify configuration and startup in the target environment |

Not every test type needs to be fully automated. Choose the method appropriate to the requirement and available tools.

## 8. Risk-Based Test Prioritization

### P0 — Critical

Prioritize tests related to:

- Authentication bypass.
- Unauthorized access to private resources.
- Administrator privilege enforcement.
- Database integrity.
- Application startup and essential configuration.
- Exposure of credentials or sensitive data.

### P1 — High

Prioritize tests related to:

- Core book operations.
- Chapter and relationship management.
- API contracts.
- Important validation rules.
- Database transactions.
- File-access controls.
- Critical user workflows.

### P2 — Medium

Prioritize tests related to:

- Supporting user-interface features.
- Search and filtering.
- Reader usability.
- Appearance preferences.
- Noncritical integration behavior.

### P3 — Low

Examples include minor presentation defects and low-impact usability improvements.

Priority should reflect the actual impact of failure. A feature can require higher priority when it handles sensitive data or affects a critical workflow.

## 9. Test Environment

Use a dedicated development or test environment.

The environment may require:

- A supported Node.js runtime.
- Dependencies installed from the project lock file.
- MySQL with a dedicated test database.
- Test-specific environment variables.
- Controlled test users and fixtures.
- The configured test runner, if available.
- A browser for frontend testing.
- A safe storage location for file tests.
- A documented database-reset process.

Do not run destructive tests against production data.

### 9.1 Configuration management

- Keep real credentials outside version control.
- Use placeholders in example configuration files.
- Separate development and production credentials.
- Validate required environment variables where appropriate.
- Avoid logging authentication secrets.
- Record required configuration names without publishing their secret values.

## 10. Test Data Management

Prepare controlled data for the scenarios being tested.

Possible fixtures include:

- A valid regular user.
- A valid administrator.
- An invalid or unauthenticated requester.
- Books with distinct identifiers.
- Authors and categories where supported.
- Chapters associated with valid books.
- Private resources owned by different users.
- Invalid relationship identifiers.
- Test files representing allowed and rejected cases.

These are proposed fixtures, not a claim that such records already exist.

### Data rules

1. Use synthetic test data.
2. Avoid relying on records from previous manual tests.
3. Generate unique values when required.
4. Clean up only test-owned records.
5. Preserve foreign-key relationships during cleanup.
6. Do not expose private data in logs or reports.
7. Keep tests repeatable.
8. Avoid sharing mutable test data across concurrent tests unless isolation is guaranteed.

## 11. Test Design Techniques

Use appropriate techniques to derive effective test cases.

### 11.1 Equivalence partitioning

Group inputs into categories expected to behave similarly.

For example, a book identifier might be valid, nonexistent, malformed, or missing.

### 11.2 Boundary-value analysis

Test values near important limits, such as:

- Minimum and maximum accepted string lengths.
- Configured upload-size limits.
- Numeric range limits.
- Pagination boundaries.
- Empty and maximum-length fields.

Use the actual documented limits instead of inventing them.

### 11.3 Decision-table testing

Use decision tables when outcomes depend on multiple conditions, such as user role, authentication status, ownership, and resource visibility.

### 11.4 State-transition testing

Test transitions where records or accounts have defined states, such as publication or archival states if implemented.

Verify that invalid transitions are rejected when the business rules prohibit them.

### 11.5 Negative testing

Provide invalid or unexpected input to verify that the application rejects it safely without unintended changes.

## 12. Test Coverage

Track coverage at several levels:

- Requirement coverage.
- Acceptance-criteria coverage.
- API endpoint coverage.
- Important business-rule coverage.
- Security-scenario coverage.
- Regression coverage.
- Browser and interface coverage.

A high code-coverage percentage does not automatically establish correctness or security.

Where coverage tooling is configured, record the actual report. Do not invent coverage percentages or assume a coverage tool is installed.

## 13. Manual Testing

Manual testing is useful for user-interface workflows, exploratory checks, and scenarios that are difficult to automate immediately.

Recommended process:

1. Identify the requirement.
2. Define preconditions and test data.
3. Write the expected result.
4. Execute the steps.
5. Record the actual result.
6. Capture safe evidence.
7. Report defects.
8. Retest after a correction.
9. Record the final status.

PowerShell `Invoke-RestMethod` can be used for manual API testing when the actual endpoint paths, methods, payloads, and authentication mechanism are known.

Do not guess API routes or test against an unintended database.

## 14. Automated Testing

Automate repeatable and high-value checks when practical.

Good candidates include:

- Validation functions.
- Business rules.
- Authentication and authorization checks.
- Repository integration tests.
- API endpoint behavior.
- Regression tests for recurring defects.
- Data-integrity scenarios.

Use the test framework already configured in the repository unless the team approves a change.

Before adding tests, inspect the relevant `package.json`, existing test files, and test configuration.

Avoid creating duplicate test frameworks or scripts without a clear requirement.

## 15. Test Execution Workflow

### Step 1: Understand the change

Read the requirement, acceptance criteria, affected code, and dependencies.

### Step 2: Select tests

Identify relevant unit, integration, system, security, and regression tests.

### Step 3: Prepare the environment

Verify configuration, database connectivity, and test data.

### Step 4: Execute tests

Run the configured test commands and required manual scenarios.

### Step 5: Investigate failures

Determine whether a failure comes from the code, test data, environment, or an existing defect.

### Step 6: Correct defects

Fix the underlying issue rather than suppressing valid test failures.

### Step 7: Retest

Run the failed tests and relevant regression checks.

### Step 8: Record evidence

Record test IDs, dates, results, environment details, and the tested commit where available.

### Step 9: Review readiness

Evaluate unresolved defects, blocked tests, and remaining risks before marking the work complete.

## 16. Defect Management

Each defect should record:

- Defect ID.
- Summary.
- Affected module.
- Severity and priority.
- Preconditions.
- Reproduction steps.
- Expected result.
- Actual result.
- Environment and tested commit.
- Evidence.
- Assigned owner.
- Fix reference.
- Retest result.
- Current status.

### Defect severity

| Severity | Meaning |
|---|---|
| Critical | Severe security, data-loss, or core-system failure |
| High | Major functionality or security issue |
| Medium | Significant but limited-impact defect |
| Low | Minor functional or presentation issue |

Severity should be based on observed impact, exploitability, and scope.

## 17. Test Reporting

Maintain a test execution summary for each meaningful testing cycle.

| Field | Value |
|---|---|
| Test cycle | Not recorded |
| Execution date | Not recorded |
| Application branch or commit | Not recorded |
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

Use actual values when the test cycle is executed.

Do not report blocked or unexecuted tests as passed.

## 18. Responsibilities

Suggested responsibilities for the four-student team should be confirmed against the current work allocation.

- **Prince Madhesia:** Participate in assigned implementation, integration, or review tasks.
- **Prince Kumar:** Participate in assigned implementation, testing, and integration tasks.
- **Ritwiz Gupta:** Participate in assigned implementation, testing, or review tasks.
- **Mukesh Yadav:** Participate in assigned frontend, integration, or testing tasks.

These are broad participation suggestions, not verified assignments. The team should designate an owner and reviewer for each task and test cycle.

All contributors should provide reproducible evidence for reported results.

## 19. Entry Criteria

Testing may begin when:

- The relevant requirement is understood.
- The feature or component is available for testing.
- Expected behavior is documented.
- Required configuration and dependencies are available.
- Test data can be prepared safely.
- The test environment is suitable.
- The test case has identifiable expected results.

If essential prerequisites are unavailable, record the test as blocked rather than guessing.

## 20. Exit Criteria

A test cycle is complete when:

- Required tests have been executed.
- Actual results have been recorded.
- Critical workflows have supporting evidence.
- Relevant security checks have been performed.
- Failures have been investigated.
- Release-blocking defects are resolved or formally accepted.
- Blocked and unexecuted tests are disclosed.
- Relevant regression tests have been executed.
- Remaining risks and limitations are documented.
- The test report accurately reflects the tested code and environment.

Passing a subset of tests does not establish that the entire application is verified.

## 21. Continuous Improvement

After each significant testing cycle:

1. Identify recurring defect patterns.
2. Add regression tests for confirmed defects.
3. Improve test data and setup instructions.
4. Identify manual tests suitable for automation.
5. Remove obsolete test cases.
6. Update test coverage for new features.
7. Review the effectiveness of security and integration tests.
8. Record lessons learned and outstanding risks.

## 22. Maintenance

Review this strategy whenever project scope, architecture, API contracts, database relationships, test tooling, or release requirements change.

Keep the testing strategy aligned with the actual codebase, the detailed test plan, test cases, integration tests, regression tests, and security tests.

Test documentation describes intended verification. Only recorded execution evidence can establish the result of a test.
