# Digital Library — Development Plan

## 1. Purpose

This document defines the development approach, work phases, dependencies, deliverables, and completion criteria for the Digital Library project.

The plan supports incremental development while preserving the approved technology stack, monolithic architecture, security requirements, and academic project objectives.

This is a planning document, not proof that a phase or module has been completed. Actual progress must be verified against the current repository, tests, and Git history.

## 2. Project Overview

Digital Library is a BTech final-year web application intended to help users access, organize, manage, and read digital books.

### 2.1 Approved technology stack

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js and Express.js
- **Database:** MySQL
- **Architecture:** Monolithic application with logically separated responsibilities

Microservices are not part of the approved architecture.

### 2.2 Main roles

- **USER:** Uses features permitted to registered users.
- **ADMIN:** Performs administrative operations permitted by the application's authorization rules.

The exact permissions for each role must follow the verified authorization implementation and approved functional requirements.

## 3. Development Objectives

The development process should:

1. Deliver working functionality in manageable increments.
2. Establish a reliable backend and database foundation.
3. Implement authentication and authorization before exposing protected functionality.
4. Build and integrate book-management features.
5. Develop the frontend against documented API contracts.
6. Validate data integrity and security.
7. Test important workflows and regression risks.
8. Maintain technical documentation throughout development.
9. Keep the project suitable for demonstration and academic evaluation.
10. Record unfinished work and known limitations accurately.

## 4. Development Principles

- Inspect the existing code before modifying it.
- Follow the established coding standards and architecture.
- Prefer small, reviewable changes.
- Keep database changes coordinated with backend code.
- Use parameterized SQL queries.
- Validate all untrusted input.
- Enforce access control on the server.
- Avoid unnecessary dependencies and architectural complexity.
- Test changes before declaring them complete.
- Preserve contributors' uncommitted work.
- Distinguish implemented features from planned features.
- Update documentation when behavior or interfaces change.

## 5. Development Phases

The phases below describe the recommended development sequence. They do not represent a verified current status.

### Phase 1: Requirements and Planning

**Objectives**

- Confirm project scope and user roles.
- Define functional and non-functional requirements.
- Identify MVP features and future enhancements.
- Document acceptance criteria.
- Establish module ownership and development priorities.

**Deliverables**

- Requirements specification.
- Feature list and roadmap.
- Use cases and acceptance criteria.
- Initial risk register.
- Task breakdown.

**Completion criteria**

Requirements are clear, internally consistent, and testable. Out-of-scope features are identified.

### Phase 2: Architecture and Database Design

**Objectives**

- Confirm the monolithic application structure.
- Define frontend, backend, and database responsibilities.
- Design entity relationships and constraints.
- Establish API conventions.
- Identify security boundaries and configuration requirements.

**Deliverables**

- Architecture document.
- Database design and schema.
- API specification.
- Security design.
- Environment setup instructions.

**Completion criteria**

The team can identify where a feature belongs, how it communicates with the backend, and how its data is stored.

### Phase 3: Backend Foundation

**Objectives**

- Configure the Express application.
- Establish environment-based configuration.
- Configure the MySQL connection.
- Set up middleware and centralized error handling.
- Establish route registration and API conventions.
- Add appropriate security headers and request handling.

**Deliverables**

- Application startup configuration.
- Database connection handling.
- Shared middleware.
- Health-check endpoint, if required by the project.
- Basic error and response handling.

**Completion criteria**

The application starts using the documented configuration, handles expected errors consistently, and connects to the intended development database when the environment is available.

### Phase 4: Authentication and Authorization

**Objectives**

- Implement registration and login.
- Apply secure password handling.
- Implement the selected authentication mechanism.
- Protect restricted endpoints.
- Enforce role and resource-access rules.
- Implement logout according to the selected authentication design.

**Deliverables**

- Authentication endpoints.
- Authentication middleware.
- Role and ownership checks.
- Validation and error handling.
- Authentication tests.

**Completion criteria**

Valid authentication flows work, invalid credentials are rejected, protected routes enforce access rules, and relevant security tests pass.

### Phase 5: Core Book Management

**Objectives**

- Implement book creation, retrieval, updating, and deletion where authorized.
- Implement author and category operations required by the scope.
- Establish book-author and book-category relationships where required.
- Implement chapter management.
- Enforce data integrity and publication or visibility rules where specified.

**Deliverables**

- Book-management APIs.
- Author and category APIs, as required.
- Chapter-management APIs.
- Relationship-management logic.
- Validation and integration tests.

**Completion criteria**

The supported operations behave according to requirements, invalid relationships are rejected, and database state remains consistent.

### Phase 6: Additional Library Features

**Objectives**

- Implement approved private-library functionality.
- Define access rules for user-specific resources.
- Implement file handling where required.
- Integrate PDF processing or reader functionality when included in the current release scope.

**Deliverables**

- Private-resource APIs.
- File-access controls.
- Reader integration components.
- Tests for access restrictions and relevant file operations.

**Completion criteria**

Users can access only the resources they are authorized to access, and supported file or reader operations meet their acceptance criteria.

Do not assume that OCR, third-party downloads, or other future enhancements belong to the MVP.

### Phase 7: Frontend Development

**Objectives**

- Create the application pages and navigation.
- Implement registration, login, and role-appropriate interfaces.
- Integrate frontend API calls.
- Build book discovery and reading workflows.
- Provide loading, empty, success, and error states.
- Implement approved appearance preferences such as dark mode and background settings.

**Deliverables**

- HTML page structures.
- CSS layouts and reusable styles.
- Vanilla JavaScript modules.
- API integration.
- Responsive and accessible interface behavior.

**Completion criteria**

Core user workflows operate through the interface and correctly reflect backend responses, validation errors, and authorization restrictions.

### Phase 8: Integration and Feature Completion

**Objectives**

- Connect frontend workflows to backend APIs.
- Verify request and response contracts.
- Resolve integration defects.
- Confirm database relationships across end-to-end workflows.
- Review incomplete features and dependencies.

**Deliverables**

- Integrated application workflows.
- Updated API documentation.
- Integration-test results.
- Defect list and resolution records.

**Completion criteria**

Critical workflows operate across the frontend, backend, and database without unresolved release-blocking defects.

### Phase 9: Testing and Security Review

**Objectives**

- Execute available automated tests.
- Perform manual end-to-end checks.
- Test validation, authentication, authorization, and ownership.
- Review SQL query safety and file access.
- Check frontend accessibility and browser compatibility.
- Verify that error responses do not expose sensitive information.

**Deliverables**

- Test execution report.
- Defect and regression records.
- Security review findings.
- Final test checklist.

**Completion criteria**

Required tests have actual recorded results, critical defects are resolved or explicitly accepted, and known limitations are documented.

### Phase 10: Deployment and Academic Delivery

**Objectives**

- Prepare the target environment.
- Configure production secrets and database access.
- Apply the documented database setup process.
- Verify startup and essential application workflows.
- Prepare the project report, demonstration, and presentation.

**Deliverables**

- Deployment instructions.
- Environment configuration guide.
- Release checklist.
- Project synopsis and technical documentation.
- Demonstration plan.

**Completion criteria**

The application can be started and demonstrated in the intended environment, required documentation is available, and release limitations are clearly recorded.

## 6. Module Prioritization

Prioritize work using the following order, adjusting it to the actual module dependencies.

| Priority | Work area | Reason |
|---|---|---|
| P0 | Configuration and database connectivity | Required foundation for backend functionality |
| P0 | Authentication and authorization | Protects accounts and restricted operations |
| P0 | Core book and relationship operations | Establishes the primary library workflows |
| P1 | Chapter and category management | Supports structured book organization |
| P1 | Frontend integration | Makes core workflows accessible to users |
| P1 | Validation, error handling, and regression testing | Improves reliability and safety |
| P1 | Private library and reader integration | Adds approved document-access and reading workflows |
| P2 | Advanced search and recommendations | Enhances discovery after core workflows are stable |
| P2 | Translation and AI-assisted features | Future enhancements requiring additional evaluation |
| P2 | OCR for scanned documents | Optional enhancement requiring separate scope and feasibility review |

Priority labels indicate planning importance, not actual implementation status.

## 7. Milestones and Dependencies

| Milestone | Prerequisites | Evidence of completion |
|---|---|---|
| M1: Requirements approved | Project scope agreed | Reviewed requirements and acceptance criteria |
| M2: Architecture defined | Requirements available | Architecture and schema reviewed |
| M3: Backend foundation ready | Configuration and database design | Startup checks and recorded results |
| M4: Authentication verified | Backend foundation ready | Authentication and access-control test results |
| M5: Core APIs verified | Authentication and schema available | Endpoint tests and database verification |
| M6: Frontend workflows integrated | API contracts stable | Recorded end-to-end test results |
| M7: Release candidate tested | Critical workflows integrated | Test report and defect review |
| M8: Academic delivery ready | Release candidate and documents ready | Demonstration checklist and documentation review |

Milestones should be marked complete only when their evidence exists.

## 8. Team Responsibilities

The project has been discussed as a four-student team:

- Prince Madhesia
- Prince Kumar
- Ritwiz Gupta
- Mukesh Yadav

The exact ownership of each module should be confirmed with the team's current task assignment. Names in this plan do not imply that a task has been assigned or completed.

For every task, record:

- Task ID and title.
- Responsible student.
- Reviewer or integration owner.
- Dependencies.
- Expected deliverable.
- Acceptance criteria.
- Status.
- Test evidence.
- Git branch or commit reference when available.

The team should coordinate API contracts and database changes before parallel implementation to reduce integration conflicts.

## 9. Task Workflow

Use the following workflow for each feature or defect.

1. **Understand:** Read the requirement, related documents, and existing implementation.
2. **Plan:** Identify affected files, dependencies, API changes, and database changes.
3. **Implement:** Make the smallest coherent change.
4. **Validate:** Check inputs, permissions, error handling, and data integrity.
5. **Test:** Run the relevant tests and record the actual results.
6. **Review:** Inspect the diff and request review when appropriate.
7. **Document:** Update affected technical documentation.
8. **Integrate:** Merge or push according to the agreed Git workflow.
9. **Verify:** Confirm the integrated behavior in the target environment.
10. **Close:** Record evidence and remaining limitations.

## 10. Definition of Ready

A task is ready to start when:

- The requirement is understandable.
- Acceptance criteria are defined.
- Dependencies are identified.
- Relevant existing code has been located.
- API and database expectations are known.
- Ownership is clear.
- The task is appropriately sized for the team.

If critical information is missing, record the blocker rather than guessing.

## 11. Definition of Done

A task is complete only when applicable conditions are satisfied:

- [ ] Acceptance criteria are met.
- [ ] Implementation follows the approved stack and architecture.
- [ ] Validation and authorization requirements are handled.
- [ ] Relevant tests have been executed.
- [ ] Actual test results are recorded.
- [ ] Database changes are documented and reproducible.
- [ ] API documentation is updated where necessary.
- [ ] The code diff has been reviewed.
- [ ] No unintended changes or secrets are included.
- [ ] Git status and commit state are understood.
- [ ] Remaining limitations are documented.

A passing test suite alone does not establish that every acceptance criterion has been met.

## 12. Risk Management

Track and review these potential risks throughout development.

| Risk | Potential impact | Mitigation |
|---|---|---|
| Unclear requirements | Rework and inconsistent behavior | Define acceptance criteria before implementation |
| Parallel changes to shared files | Merge conflicts and regressions | Assign ownership and coordinate integration |
| Schema and API drift | Broken frontend-backend integration | Review and document contract changes |
| Incomplete authorization | Unauthorized access to private data | Enforce server-side access checks and test them |
| Unsafe SQL operations | Data exposure or corruption | Use parameterized queries and constraints |
| Environment differences | Startup or deployment failures | Document configuration and test setup |
| Insufficient testing | Defects discovered during demonstration | Prioritize integration and regression tests |
| Unverified progress reports | Misleading project status | Record evidence and timestamps |
| Scope expansion | Delayed MVP delivery | Separate MVP requirements from future features |
| Unavailable external AI services | Feature failures or unexpected cost | Keep future AI integrations optional and evaluate dependencies |

Add project-specific risks when they are identified and assign owners where appropriate.

## 13. Progress Tracking

Use the following status definitions consistently.

- **Not started:** Work has not begun.
- **In progress:** Work is actively being implemented.
- **Blocked:** Work cannot continue until a dependency or issue is resolved.
- **Implemented:** Code changes have been made but may still require testing or review.
- **Verified:** Applicable acceptance criteria and required tests have supporting evidence.
- **Complete:** The task meets the project's definition of done.
- **Deferred:** The work has been deliberately moved to a later release.
- **Cancelled:** The work is no longer required.

Do not equate code being written with a feature being verified.

## 14. Schedule Planning

Create a schedule only after estimating the remaining work and confirming team availability.

For each planned period, specify:

- Deliverables.
- Responsible students.
- Dependencies.
- Estimated effort.
- Review date.
- Verification criteria.
- Known risks.

Avoid inventing deadlines or claiming that the project will finish by a particular date without an agreed schedule.

Reassess estimates when integration work, testing, or requirement changes reveal additional effort.

## 15. Change Management

When a requirement or design changes:

1. Record the requested change.
2. Explain the reason.
3. Identify affected modules and documents.
4. Assess security, data, compatibility, and schedule impacts.
5. Obtain the required approval.
6. Update acceptance criteria and API or schema documentation.
7. Implement and test the change.
8. Record the final outcome.

Major architectural changes must also be recorded in the decision log.

## 16. Release Readiness Checklist

Before an academic demonstration or release:

- [ ] Required workflows are implemented and verified.
- [ ] Authentication and authorization checks have been tested.
- [ ] Database setup instructions are available.
- [ ] Environment configuration is documented.
- [ ] Secrets are not committed.
- [ ] Required tests have recorded results.
- [ ] Critical defects are resolved or explicitly disclosed.
- [ ] Frontend behavior is checked in the intended browser.
- [ ] API and architecture documentation match the verified implementation.
- [ ] Known limitations and future scope are documented.
- [ ] The current Git state is confirmed.
- [ ] Presentation and demonstration steps are prepared.

## 17. Plan Maintenance

Review this plan when the MVP scope, architecture, dependencies, team assignments, or release goals change.

Update progress using evidence from the repository and executed tests. Preserve historical information where useful, but do not present planned work or earlier reports as proof of current completion.
