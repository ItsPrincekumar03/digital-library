# Digital Library — Dependency Register

## 1. Purpose

This document identifies and tracks dependencies that may affect the Digital Library project's development, testing, deployment, security, schedule, and delivery.

The register helps the team understand which components, decisions, tasks, resources, or external conditions must be available before other work can proceed.

This is a planning register. Dependencies must be verified against the current repository, installed packages, project plan, and actual team workflow before being marked confirmed.

## 2. Project Overview

Digital Library is a BTech final-year web application using the approved technology stack:

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js and Express.js
- **Database:** MySQL
- **Architecture:** Monolithic application

Microservices are not part of the approved architecture.

The project may include authentication, user roles, books, authors, categories, chapters, private-library functionality, and reading features according to the approved release scope and verified implementation.

## 3. Dependency Categories

Dependencies are grouped into the following categories.

### 3.1 Technical dependencies

Software, libraries, runtimes, database services, and APIs required by the application.

### 3.2 Module dependencies

Project modules or tasks that must be completed before another module can be implemented or verified.

### 3.3 Data dependencies

Database schemas, relationships, migrations, seed data, and persistence behavior required by application features.

### 3.4 Team dependencies

Work, decisions, reviews, or deliverables that depend on another team member.

### 3.5 Environment dependencies

Operating-system configuration, environment variables, storage, network access, and hosting resources.

### 3.6 Delivery dependencies

Testing, documentation, approval, academic deliverables, and deployment activities required before a release or demonstration.

## 4. Dependency Status Definitions

Use these statuses consistently:

- **Not Verified:** The dependency has not been confirmed.
- **Open:** The dependency is known but not yet satisfied.
- **In Progress:** Work to satisfy the dependency is underway.
- **Satisfied:** Evidence confirms that the dependency is available or complete.
- **Blocked:** The dependent work cannot proceed because the dependency is unavailable.
- **Not Applicable:** The dependency does not apply to the approved scope.

Do not mark a dependency satisfied merely because it is mentioned in documentation.

## 5. Dependency Register Fields

Each entry should include:

| Field | Description |
|---|---|
| Dependency ID | Unique register identifier |
| Dependency | Component, decision, task, or resource required |
| Category | Technical, module, data, team, environment, or delivery |
| Required by | Module, feature, or milestone depending on it |
| Dependency owner | Person responsible for supplying or maintaining it |
| Priority | Relative impact if unavailable |
| Status | Current verified state |
| Risk | Potential consequence of failure |
| Mitigation | Action to reduce the dependency risk |
| Evidence | File, commit, test, configuration, or approval reference |

## 6. Priority Definitions

| Priority | Meaning |
|---|---|
| P0 — Critical | Blocks a core workflow, security requirement, or essential release activity |
| P1 — High | Blocks a major feature or important integration |
| P2 — Medium | Affects supporting work or schedule flexibility |
| P3 — Low | Minor dependency with a manageable workaround |

Priority should reflect the actual release impact and be reviewed as the project evolves.

## 7. Technical Dependency Register

The following entries identify likely technical dependencies based on the approved project stack. Installed versions and current availability must be confirmed.

| ID | Dependency | Required by | Priority | Status |
|---|---|---|---|---|
| DEP-001 | Compatible Node.js runtime | Backend execution | P0 | Not Verified |
| DEP-002 | npm and dependency manifests | Backend installation | P0 | Not Verified |
| DEP-003 | Express.js application framework | Backend HTTP API | P0 | Not Verified |
| DEP-004 | MySQL Server | Persistent application data | P0 | Not Verified |
| DEP-005 | MySQL connection configuration | Backend database access | P0 | Not Verified |
| DEP-006 | HTML, CSS, and Vanilla JavaScript | Browser interface | P1 | Not Verified |
| DEP-007 | Git and repository access | Source control | P1 | Not Verified |
| DEP-008 | Browser with required web APIs | Frontend testing | P1 | Not Verified |
| DEP-009 | PDF rendering dependency, if included | PDF reading functionality | P2 | Not Verified |
| DEP-010 | Browser Speech Synthesis, if included | Text-to-speech functionality | P2 | Not Verified |
| DEP-011 | File storage, if required | Uploads and private documents | P1 | Not Verified |
| DEP-012 | Test runner and test dependencies, if configured | Automated verification | P1 | Not Verified |

Do not assume a specific library version, test framework, or package is installed without inspecting the current package manifests and lock files.

## 8. Module Dependency Register

The following dependency relationships are a planning baseline. Validate each relationship against the current module implementation.

| ID | Prerequisite | Dependent work | Priority | Status |
|---|---|---|---|---|
| DEP-013 | Environment configuration | Backend startup | P0 | Not Verified |
| DEP-014 | Database connectivity | Database-backed API operations | P0 | Not Verified |
| DEP-015 | Database schema | Repositories and persistence operations | P0 | Not Verified |
| DEP-016 | Authentication mechanism | Protected API operations | P0 | Not Verified |
| DEP-017 | Authorization rules | Role-restricted operations | P0 | Not Verified |
| DEP-018 | API contracts | Frontend integration | P1 | Not Verified |
| DEP-019 | Book data model | Book-management workflows | P1 | Not Verified |
| DEP-020 | Author and category relationships | Related book-management workflows | P1 | Not Verified |
| DEP-021 | Book relationships and validation | Related-record operations | P1 | Not Verified |
| DEP-022 | Chapter data model and book relationship | Chapter-management workflows | P1 | Not Verified |
| DEP-023 | Private-resource authorization | Private-library access | P0/P1 | Not Verified |
| DEP-024 | Test environment and fixtures | Repeatable testing | P1 | Not Verified |
| DEP-025 | Approved deployment configuration | Deployment verification | P1 | Not Verified |

These entries describe logical dependencies rather than confirmed completion states.

## 9. Database Dependencies

Database-backed features depend on a consistent and compatible schema.

Track the following:

- Database creation and configuration.
- Required tables and columns.
- Primary and foreign keys.
- Unique constraints.
- Indexes required by important queries.
- Database user privileges.
- Schema migration or setup procedures.
- Test-data preparation.
- Backup and recovery procedures.
- Compatibility between application code and schema revisions.

### Database dependency checklist

- [ ] The current schema has been identified.
- [ ] Application queries match the actual schema.
- [ ] Relationship constraints have been checked.
- [ ] Required indexes have been reviewed.
- [ ] Database configuration is documented.
- [ ] Schema changes are tracked.
- [ ] Test data can be created safely.
- [ ] Database recovery requirements are documented.

Do not assume that a database design document and the deployed schema are identical. Verify both before resolving database-dependent tasks.

## 10. API and Frontend Dependencies

Frontend features depend on stable backend contracts when they communicate through HTTP APIs.

For each integrated feature, record:

- API route and HTTP method.
- Request schema.
- Response schema.
- Authentication requirements.
- Authorization requirements.
- Validation rules.
- Error-response behavior.
- Pagination or filtering behavior, if supported.
- Related frontend page or component.
- Integration test reference.

### Integration requirements

- [ ] The frontend uses the documented API contract.
- [ ] The backend validates incoming requests.
- [ ] Authentication requirements are understood.
- [ ] Authorization is enforced by the backend.
- [ ] API errors are handled by the frontend.
- [ ] API changes are communicated to affected developers.
- [ ] Relevant integration tests have been executed.

Avoid implementing frontend assumptions based solely on planned routes that have not been confirmed.

## 11. Security Dependencies

Some features cannot be considered release-ready until their required security controls are verified.

| ID | Required control | Dependent feature | Priority | Status |
|---|---|---|---|---|
| DEP-026 | Password-hashing mechanism | Account management | P0 | Not Verified |
| DEP-027 | Authentication verification | Protected endpoints | P0 | Not Verified |
| DEP-028 | Server-side role checks | Administrator operations | P0 | Not Verified |
| DEP-029 | Ownership checks | User-specific resources | P0 | Not Verified |
| DEP-030 | Parameterized database queries | Database-backed requests | P0 | Not Verified |
| DEP-031 | Input validation | Request processing | P1 | Not Verified |
| DEP-032 | Safe error handling | API responses | P1 | Not Verified |
| DEP-033 | File validation and access control, if applicable | Uploads and private files | P0/P1 | Not Verified |
| DEP-034 | Protected environment configuration | Database and authentication secrets | P0 | Not Verified |

A security dependency is satisfied only when the relevant control has been inspected and tested appropriately.

## 12. File and Reading Feature Dependencies

If PDF, private-library, or text-to-speech functionality is included in the release, identify its specific dependencies.

Potential requirements include:

- Supported document formats.
- Browser PDF rendering capability or an approved PDF library.
- File storage and retrieval.
- Document access authorization.
- Browser Speech Synthesis support.
- Reading progress and navigation logic, if implemented.
- Browser-specific behavior and limitations.
- Safe file size and type validation.
- Test documents and expected results.

Features requiring an external AI service must also document the provider, credentials, network access, cost implications, data handling, and failure behavior before being treated as release dependencies.

Future AI features should remain deferred unless they are explicitly included in the approved release.

## 13. Team Dependency Register

The project has been discussed as a four-student team:

- Prince Madhesia
- Prince Kumar
- Ritwiz Gupta
- Mukesh Yadav

The current owner of each dependency must be confirmed with the team's latest task allocation.

| ID | Dependency | Dependent activity | Owner | Status |
|---|---|---|---|---|
| DEP-035 | Shared understanding of API contracts | Frontend/backend integration | Not assigned | Not Verified |
| DEP-036 | Communication of database changes | Repository and service integration | Not assigned | Not Verified |
| DEP-037 | Review of shared-code changes | Integration and regression testing | Not assigned | Not Verified |
| DEP-038 | Confirmation of module ownership | Parallel task execution | Not assigned | Not Verified |
| DEP-039 | Review of academic deliverables | Final project submission | Not assigned | Not Verified |

These entries identify coordination needs. They do not establish individual assignments or claim that any team member has completed a task.

## 14. External Dependencies and Services

Record external services only when the approved implementation actually uses them.

Potential examples include:

- Package registries.
- A remote Git repository.
- A hosted MySQL service.
- A deployment platform.
- An AI API provider.
- External file storage.

For each external dependency, record:

- Service or provider.
- Purpose.
- Required credentials or configuration.
- Network requirements.
- Availability and failure impact.
- Cost or usage limits, where relevant.
- Data-sharing and privacy implications.
- Fallback behavior.
- Owner and evidence.

Do not list an external service as an active application dependency solely because it is being considered for future development.

## 15. Dependency Risk Assessment

| Risk | Potential impact | Mitigation |
|---|---|---|
| Incompatible Node.js runtime | Startup or dependency failure | Document and verify the supported runtime |
| Missing or inconsistent lock file | Unreproducible installation | Maintain and review dependency manifests |
| Database unavailable | Core application workflows fail | Verify connectivity and recovery arrangements |
| Schema and code mismatch | Query errors or data corruption | Review migrations and run integration tests |
| Unstable API contracts | Frontend integration failures | Maintain API specifications and review changes |
| Missing authorization checks | Unauthorized resource access | Test roles and resource ownership |
| Shared changes conflict | Integration delays | Use a consistent Git workflow and code review |
| Missing test fixtures | Inconsistent test results | Maintain repeatable synthetic test data |
| Lost uploaded files | Data loss | Plan persistent storage and backup recovery |
| External service failure | Dependent feature unavailable | Document limits and safe fallback behavior |

Review these risks according to the actual release scope and current implementation.

## 16. Dependency Resolution Process

When a dependency is blocked:

1. Identify the dependent task or feature.
2. Confirm the missing prerequisite.
3. Record its owner and priority.
4. Assess the impact on the project schedule and release.
5. Identify a safe workaround, if available.
6. Assign an action and expected completion date.
7. Notify affected team members.
8. Verify that the dependency is available.
9. Run the tests required to validate the dependent work.
10. Update the register with evidence and the final status.

A workaround should not bypass essential security controls, data-integrity constraints, or approved architectural decisions.

## 17. Change Control

When a dependency changes, assess the impact on:

- Requirements.
- API contracts.
- Database schema.
- Application code.
- Authentication and authorization.
- Tests and fixtures.
- Deployment configuration.
- Documentation.
- Project schedule and responsibilities.

Record significant changes through `change-request-log.md` and update relevant technical documentation.

Dependency updates should be reviewed, tested, and recorded rather than applied without impact assessment.

## 18. Dependency Review Schedule

Review dependencies at appropriate project milestones:

- Before beginning a module that depends on shared functionality.
- Before integrating independently developed modules.
- After changing the database schema or API contract.
- Before installing or upgrading major dependencies.
- Before a release or academic demonstration.
- When a blocker or external-service failure is reported.

The exact review dates should be maintained in the project plan.

## 19. Dependency Register Maintenance Template

Use the following structure when adding an entry:

| Field | Example value |
|---|---|
| Dependency ID | DEP-040 |
| Dependency | Example prerequisite |
| Category | Technical / Module / Data / Team / Environment / Delivery |
| Required by | Affected module or milestone |
| Owner | Not assigned |
| Priority | Not assessed |
| Status | Not Verified |
| Risk | Not assessed |
| Mitigation | Not documented |
| Evidence | Not recorded |
| Last reviewed | Not recorded |

The example identifier is illustrative. Assign the next unused identifier when creating a real entry.

## 20. Completion Checklist

- [ ] Required technical dependencies are identified.
- [ ] Runtime and package requirements are documented.
- [ ] Database dependencies are documented.
- [ ] Module prerequisites are mapped.
- [ ] API integration dependencies are documented.
- [ ] Security prerequisites are identified.
- [ ] File and external-service dependencies are scoped appropriately.
- [ ] Team coordination dependencies have owners where possible.
- [ ] High-priority blockers have mitigation plans.
- [ ] Dependency changes are subject to review.
- [ ] Evidence is recorded for satisfied dependencies.
- [ ] The register is consistent with the current project plan.

## 21. Related Documentation

- `project-plan.md`
- `task-breakdown.md`
- `risk-register.md`
- `change-request-log.md`
- `../01-product/roadmap.md`
- `../03-technical/technology-stack.md`
- `../03-technical/architecture.md`
- `../03-technical/database-design.md`
- `../03-technical/api-specification.md`
- `../05-security/security-design.md`
- `../07-testing/test-plan.md`
- `../08-deployment/environment-setup.md`
- `../08-deployment/deployment-plan.md`

## 22. Maintenance

Update this register whenever technical prerequisites, module ordering, database structures, API contracts, team responsibilities, external services, or deployment requirements change.

Use evidence from the current repository, configuration, tests, and project decisions to maintain accurate statuses.

This register supports dependency management and risk reduction. It does not establish that a dependency exists, is installed, or has been satisfied until that state has been verified.
