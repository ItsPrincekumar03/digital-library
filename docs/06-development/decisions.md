# Architecture and Technical Decision Log

## 1. Purpose

This document records important technical and architectural decisions made during the development of the Digital Library project.

The decision log helps the team understand why a particular approach was selected, what alternatives were considered, what trade-offs were accepted, and whether a previous decision should be reviewed.

This document distinguishes confirmed project constraints from proposed decisions and historical reports. A decision must not be treated as implemented merely because it is documented here.

## 2. Project Context

Digital Library is a BTech final-year project for managing, organizing, and reading digital books.

### Approved technology stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js and Express.js
- Database: MySQL

### Project constraints

- Use a monolithic application architecture.
- Do not introduce microservices.
- Keep the architecture understandable and maintainable for a student development team.
- Separate responsibilities where useful without introducing unnecessary complexity.
- Verify existing code and database structures before making implementation changes.

## 3. Decision Status Definitions

| Status | Meaning |
|---|---|
| Accepted | The project has agreed to follow the decision. |
| Proposed | The decision is suggested but has not been approved. |
| Implemented | Repository evidence confirms the decision has been applied in code. |
| Superseded | A later decision replaced the earlier approach. |
| Deprecated | The approach should no longer be used for new work. |
| Under review | The team is reassessing the decision. |

Acceptance and implementation are separate statuses. Update the record when implementation is verified.

## 4. Decision Record Format

Each significant decision should contain:

- **ID:** Unique identifier.
- **Title:** Short description.
- **Date:** Date the decision was made or recorded.
- **Status:** Current decision status.
- **Context:** The problem or requirement.
- **Decision:** The selected approach.
- **Alternatives:** Other reasonable options.
- **Rationale:** Why the approach was selected.
- **Consequences:** Benefits, limitations, and trade-offs.
- **Verification:** Evidence that implementation follows the decision.
- **Review conditions:** Circumstances that may require reconsideration.

Do not invent dates, approvals, or implementation evidence. Use `Not recorded` or `Not verified` when information is unavailable.

## 5. Core Project Decisions

### ADR-001: Use the Approved Technology Stack

**Status:** Accepted

**Context**

The project needs a web application that can be developed and maintained by a student team.

**Decision**

Use HTML, CSS, and Vanilla JavaScript for the frontend, Node.js and Express.js for the backend, and MySQL for relational data storage.

**Alternatives considered**

- Introducing a frontend framework.
- Replacing MySQL with a different database.
- Replacing Express.js with another backend framework.

**Rationale**

The selected stack follows the project requirements and avoids unnecessary technology changes.

**Consequences**

- Contributors should understand the existing stack before proposing additional tools.
- Frontend behavior must be implemented with the approved technologies.
- Database operations should follow the project's MySQL design.
- Any proposed stack change requires an explicit review.

**Verification**

Check the current source files and dependency manifests before claiming that every part uses the approved stack.

### ADR-002: Use a Monolithic Architecture

**Status:** Accepted

**Context**

The project requires a manageable application architecture suitable for a student development team.

**Decision**

Keep the Digital Library as a monolithic application. Organize responsibilities into logical modules within the project rather than deploying independent microservices.

**Alternatives considered**

- Microservices.
- Separately deployed backend services.
- A monolithic application with internal module boundaries.

**Rationale**

A monolithic architecture reduces deployment, networking, and operational complexity for the project's expected scope.

**Consequences**

- Modules can share application configuration and database infrastructure.
- Logical separation remains important for maintainability.
- Avoid unnecessary inter-service communication and distributed transactions.
- A future architecture change would require a documented review of actual scaling or organizational needs.

**Verification**

Inspect the application entry point, deployment configuration, and service structure to confirm the current architecture.

### ADR-003: Separate Backend Responsibilities

**Status:** Accepted as the intended design

**Context**

Combining HTTP handling, business logic, and SQL operations in large route handlers can make the backend difficult to test and maintain.

**Decision**

Use the following logical request flow where appropriate:

`Route → Middleware → Controller → Service → Repository → MySQL`

**Rationale**

Each layer has a distinct responsibility, making behavior easier to understand and test.

**Consequences**

- Routes should define endpoint registration and middleware.
- Middleware should handle cross-cutting request concerns.
- Controllers should coordinate HTTP requests and responses.
- Services should implement business rules.
- Repositories should encapsulate database access where the pattern is used.
- Simple operations should not acquire unnecessary layers solely for architectural consistency.

**Verification**

Trace representative endpoints through the actual source code. This decision does not establish that every existing endpoint already follows the pattern.

### ADR-004: Use MySQL for Relational Data

**Status:** Accepted

**Context**

Books, authors, categories, chapters, users, and related records may require relational constraints and consistent updates.

**Decision**

Use MySQL as the project's relational database.

**Rationale**

MySQL supports relational tables, constraints, indexes, transactions, and parameterized queries.

**Consequences**

- Schema changes must be coordinated with backend code.
- Relationships should be represented using appropriate keys and constraints.
- Multi-step operations requiring atomicity should use transactions.
- Indexes should be selected based on query patterns and measured needs.
- Actual table and column names must come from the current schema.

**Verification**

Inspect the database configuration, SQL files, migrations, and repository queries.

### ADR-005: Use Vanilla JavaScript for the Frontend

**Status:** Accepted

**Context**

The project specifies a frontend based on HTML, CSS, and JavaScript without requiring a separate frontend framework.

**Decision**

Use Vanilla JavaScript for browser interactions, API calls, and reader behavior.

**Rationale**

This follows the approved stack and limits additional dependencies.

**Consequences**

- Reusable functions and clear module boundaries are important.
- DOM updates and API interactions should be organized consistently.
- User-controlled content must be rendered safely.
- Browser compatibility must be considered for features such as PDF viewing and Speech Synthesis.

**Verification**

Inspect frontend files and dependencies before confirming the absence of a framework throughout the application.

### ADR-006: Enforce Server-Side Authorization

**Status:** Accepted as a security requirement

**Context**

The application distinguishes `USER` and `ADMIN` roles and may manage private resources.

**Decision**

Enforce authentication, role restrictions, and resource-ownership checks on the server wherever required.

**Rationale**

Client-side checks alone cannot protect APIs or private data.

**Consequences**

- Protected routes need appropriate authentication middleware.
- Administrative actions need server-side role checks.
- Private resources require ownership or other authorized-access checks.
- Tests should cover unauthorized and cross-user access attempts.

**Verification**

Inspect the middleware, service logic, relevant database operations, and security tests. Do not mark the controls implemented without evidence.

### ADR-007: Use Parameterized SQL Queries

**Status:** Accepted as a security requirement

**Context**

User-controlled values can create SQL injection vulnerabilities when incorporated unsafely into queries.

**Decision**

Use parameterized queries for user-controlled database values.

**Rationale**

Parameterization separates SQL structure from supplied values.

**Consequences**

- Review every database operation that accepts request data.
- Do not build SQL statements by concatenating untrusted values.
- Dynamic identifiers, such as sort columns, require explicit allowlists because they generally cannot be handled as ordinary query parameters.
- Database access patterns should remain consistent with the selected driver.

**Verification**

Inspect repository query implementations and run relevant security tests.

### ADR-008: Keep Secrets Out of Source Control

**Status:** Accepted as a security requirement

**Context**

Database credentials, tokens, and other secrets must not be exposed through public source code.

**Decision**

Use environment-based configuration for secrets and keep real secret-bearing environment files out of version control.

**Rationale**

This reduces accidental exposure and allows different configurations for development and deployment.

**Consequences**

- Document required variable names and example values without including real secrets.
- Validate required configuration during startup where appropriate.
- Use different credentials for development and production.
- Review Git changes before committing.

**Verification**

Inspect configuration loading, `.gitignore`, environment examples, and tracked files. Never print real secret values in this document.

### ADR-009: Document API Contracts

**Status:** Accepted as a documentation practice

**Context**

The frontend, backend, and multiple contributors need a consistent understanding of endpoint behavior.

**Decision**

Maintain API documentation covering routes, methods, authentication requirements, request parameters, response formats, status codes, and errors.

**Rationale**

A documented contract reduces integration errors and helps manual and automated testing.

**Consequences**

- Update API documentation when endpoint behavior changes.
- Confirm routes against actual route registration.
- Do not document planned endpoints as working endpoints.
- Keep examples consistent with the implementation.

**Verification**

Compare API documentation with the registered routes, controllers, middleware, and observed responses.

### ADR-010: Preserve Evidence-Based Implementation Status

**Status:** Accepted as a project documentation rule

**Context**

Planning documents and earlier project reports may describe work that has changed or has not yet been verified.

**Decision**

Distinguish requirements, proposals, historical reports, implementation evidence, and executed test results.

**Rationale**

Accurate status reporting prevents unfinished work from being presented as complete.

**Consequences**

- Inspect the current repository before reporting implementation status.
- Record actual test execution results.
- Confirm Git commits and remote pushes independently.
- Mark unsupported conclusions as unverified.
- Update historical reports when current evidence becomes available.

**Verification**

Review module-status documents and completion reports for evidence and timestamps.

## 6. Decisions Requiring Project-Specific Verification

The following topics require inspection of the current implementation before an exact decision can be recorded.

| Topic | Information to verify |
|---|---|
| Authentication mechanism | Token, session, or other authentication approach |
| Token storage | Cookie attributes and any other token-storage mechanism |
| Logout invalidation | Actual invalidation behavior and persistence |
| Password hashing | Library, configuration, and verification flow |
| Database schema | Actual tables, columns, constraints, and indexes |
| API response format | Current success and error response structures |
| File storage | Storage location, naming strategy, and access controls |
| Upload validation | Actual size, MIME, and file-content checks |
| PDF processing | Current parsing and browser-rendering implementation |
| Reader controls | Supported speed and pitch behavior in the target browsers |
| Testing framework | Installed runner, test scripts, and existing coverage |
| Deployment | Current hosting, process management, and configuration |

Record verified decisions as separate entries when the chosen implementation materially affects architecture or future work.

## 7. Proposed Decisions for Future Review

The following are possible future topics, not approved or implemented features merely by appearing in this list.

- Refresh-token workflow.
- Chapter translation.
- AI-assisted semantic search.
- AI-powered book recommendations.
- Improved PDF text extraction or OCR for scanned documents.
- More comprehensive automated testing.
- Persistent token invalidation, if required by the selected authentication design.

For each proposal, document the problem it solves, security and privacy implications, dependencies, cost, complexity, and acceptance criteria before implementation.

## 8. Decision Review Process

When a significant technical decision is proposed:

1. Identify the requirement or problem.
2. Inspect the existing implementation and constraints.
3. Compare realistic alternatives.
4. Evaluate maintainability, security, testing, compatibility, and complexity.
5. Record the selected approach and trade-offs.
6. Obtain the project's required approval.
7. Implement the change in a focused branch or task.
8. Run relevant tests and review the diff.
9. Record evidence of implementation.
10. Update dependent documentation.

If a decision changes, create a new entry referencing the superseded decision. Preserve the historical record instead of silently rewriting the original rationale.

## 9. Decision Log Template

Use this template for future entries.

### ADR-XXX: Decision Title

- **Date:** Not recorded
- **Status:** Proposed
- **Owner:** Not assigned
- **Related modules:** Not recorded

**Context**

Describe the problem, constraints, and requirements.

**Decision**

Describe the selected approach.

**Alternatives considered**

List realistic alternatives and explain why they were accepted or rejected.

**Rationale**

Explain the main reasons for the choice.

**Consequences**

Describe benefits, limitations, risks, and maintenance implications.

**Verification evidence**

List relevant file paths, commits, tests, or other evidence. Use `Not verified` until evidence is available.

**Review conditions**

Describe what future changes or evidence would justify reconsidering the decision.

## 10. Maintenance

Review this document whenever a major architectural, security, database, dependency, or development-workflow decision changes.

Keep decisions concise, traceable, and evidence-based. Update the status of an entry only when its approval or implementation state is known.
