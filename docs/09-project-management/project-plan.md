# Digital Library — Project Plan

## 1. Purpose

This document defines the project planning approach for the Digital Library application, including objectives, scope, work breakdown, responsibilities, milestones, dependencies, risks, quality activities, and delivery criteria.

It provides a shared reference for coordinating development and tracking progress toward the academic project deliverables.

This plan describes the intended organization of the work. Dates, assignments, module completion, and release status must be updated using actual project evidence.

## 2. Project Overview

**Project name:** Digital Library

**Project type:** BTech final-year software development project

**Application type:** Web application

**Approved technology stack:**

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js and Express.js
- Database: MySQL
- Architecture: Monolithic application

Microservices are not part of the approved architecture.

### 2.1 Project purpose

The project aims to provide a web-based platform for organizing, managing, discovering, and reading digital library content.

The final feature set must follow the approved requirements and the functionality verified in the current implementation.

### 2.2 Intended users

- `USER` — accesses permitted library features.
- `ADMIN` — performs authorized management operations.

Exact permissions must match the approved requirements and actual backend authorization rules.

## 3. Project Objectives

The project aims to:

1. Develop a functional digital library application.
2. Provide a structured interface for supported library operations.
3. Implement authentication and role-based authorization.
4. Support book, author, category, and chapter management where approved.
5. Store application data using MySQL.
6. Separate application responsibilities into maintainable modules.
7. Validate user input and protect sensitive operations.
8. Test API behavior and database integration.
9. Produce technical and academic documentation.
10. Prepare a reliable demonstration or deployment according to the project requirements.

## 4. Project Scope

### 4.1 Core scope

The release scope may include the following capabilities when implemented and approved:

- User registration and authentication.
- User and administrator access controls.
- Book management.
- Author management.
- Category management.
- Chapter management.
- Book relationship management.
- Publication, visibility, or archiving rules.
- Search and discovery.
- Private-library resources.
- Frontend integration with backend APIs.
- Database persistence.
- Validation and error handling.
- Security and testing.
- Deployment documentation.

### 4.2 Reading and user-experience features

The project has also discussed the following features:

- Browser-based reading.
- PDF reading, where supported.
- Browser Speech Synthesis.
- Reading speed controls, with an intended maximum of 4x where technically supported.
- Pitch controls where supported by the browser.
- Dark mode.
- Background customization.

These features must be tracked individually. Their inclusion in planning documents does not prove that they have been implemented.

### 4.3 Future enhancements

Potential later-release features include:

- AI-assisted semantic search.
- AI-based recommendations.
- Chapter translation.
- Additional reading and accessibility enhancements.
- OCR for scanned PDFs, if separately approved.

Future enhancements must not block delivery of the approved minimum viable product unless they are explicitly included in its requirements.

## 5. Out of Scope

Unless separately approved, the project does not include:

- A microservices architecture.
- Unapproved technology-stack changes.
- Features that violate applicable third-party service terms.
- Unrestricted downloading of content from external platforms.
- Unverified claims of AI integration.
- Features that have not been accepted into the release scope.

Any significant scope change should be documented through the change request process.

## 6. Project Deliverables

| ID | Deliverable | Acceptance evidence |
|---|---|---|
| DEL-01 | Requirements documentation | Reviewed and consistent requirements |
| DEL-02 | Technical architecture | Documented application structure and data flow |
| DEL-03 | Database design | Schema and relationships reviewed |
| DEL-04 | Backend application | Implemented APIs and recorded test results |
| DEL-05 | Frontend application | Implemented pages and verified workflows |
| DEL-06 | Authentication and authorization | Relevant access-control tests |
| DEL-07 | Integrated application | End-to-end workflow evidence |
| DEL-08 | Testing documentation | Test cases and execution records |
| DEL-09 | Deployment documentation | Setup and recovery procedures |
| DEL-10 | Academic synopsis | Required synopsis content reviewed |
| DEL-11 | Project presentation | Presentation aligned with actual functionality |
| DEL-12 | Final project handover | Source code, documentation, and known limitations |

These are planned deliverables. Actual completion should be recorded separately.

## 7. Development Approach

The project should be developed incrementally.

### Phase 1: Planning and requirements

- Define project objectives and scope.
- Document functional requirements.
- Document non-functional requirements.
- Define user roles and use cases.
- Establish acceptance criteria.

### Phase 2: Architecture and database design

- Confirm the approved technology stack.
- Document the monolithic architecture.
- Define the database entities and relationships.
- Establish API conventions.
- Define security requirements.

### Phase 3: Backend foundation

- Configure the Node.js and Express.js application.
- Configure environment variables.
- Establish MySQL connectivity.
- Implement shared middleware and error handling.
- Establish consistent API behavior.

### Phase 4: Core backend modules

Implement and verify approved modules such as:

- Authentication and user management.
- Book management.
- Author and category management.
- Chapter management.
- Relationship validation.
- Publication and visibility rules.
- Private-resource operations, where included.

The actual module sequence should follow the repository's current implementation and dependency register.

### Phase 5: Frontend development

- Define the navigation and page structure.
- Implement the approved HTML and CSS interface.
- Implement Vanilla JavaScript interactions.
- Integrate the frontend with verified backend APIs.
- Implement loading, validation, and error states.
- Verify supported user workflows.

### Phase 6: Reading and supporting features

Implement only the features included in the approved release, such as reading controls, PDF functionality, or appearance preferences.

### Phase 7: Integration and testing

- Test API and database integration.
- Test authentication and authorization.
- Test core user workflows.
- Test input validation and error handling.
- Run regression tests.
- Record defects and retest fixes.

### Phase 8: Deployment preparation

- Prepare the target environment.
- Configure secrets and database access.
- Review security and operational requirements.
- Validate backup and recovery procedures.
- Run deployment smoke tests.

### Phase 9: Academic completion

- Finalize documentation.
- Prepare the synopsis and presentation.
- Demonstrate verified functionality.
- Record limitations and future scope.
- Organize the final source-code handover.

## 8. Work Breakdown Structure

| WBS ID | Work package | Main output | Dependency |
|---|---|---|---|
| 1.0 | Project planning | Scope and project plan | Project objectives |
| 1.1 | Requirements analysis | Requirements and acceptance criteria | 1.0 |
| 1.2 | Architecture design | Architecture and API design | 1.1 |
| 1.3 | Database design | Schema and relationships | 1.1 |
| 2.0 | Backend foundation | Configured Express.js application | 1.2 |
| 2.1 | Authentication | Account and access-control workflows | 2.0, 1.3 |
| 2.2 | Book management | Book operations | 2.0, 1.3 |
| 2.3 | Related entities | Author and category operations | 2.0, 1.3 |
| 2.4 | Chapter management | Chapter operations | 2.2, 1.3 |
| 2.5 | Private resources | Protected resource workflows, if approved | 2.1, 1.3 |
| 3.0 | Frontend foundation | Page structure and navigation | 1.2 |
| 3.1 | API integration | Connected user workflows | 2.0, 3.0 |
| 3.2 | Reading features | Approved reading capabilities | 3.0 and relevant dependencies |
| 4.0 | Integration testing | Test results and defect records | 2.0, 3.0 |
| 4.1 | Security verification | Security test evidence | Relevant implementation |
| 4.2 | Regression testing | Regression results | Feature integration |
| 5.0 | Deployment preparation | Environment and recovery procedures | 4.0, 4.1, 4.2 |
| 6.0 | Academic deliverables | Synopsis, presentation, final report | Verified project status |

The WBS describes planned dependencies, not proof that work packages have been completed.

## 9. Team Organization

The project has been discussed as a four-student team:

- Prince Madhesia
- Prince Kumar
- Ritwiz Gupta
- Mukesh Yadav

The current task assignments must be confirmed against the latest team decisions.

| Role | Responsibilities |
|---|---|
| Project coordination | Maintain scope, milestones, and communication |
| Backend development | Implement and maintain API and business logic |
| Frontend development | Implement pages and user interactions |
| Database development | Maintain schema, relationships, and data integrity |
| Testing and review | Verify workflows and record defects |
| Documentation | Maintain technical and academic deliverables |

One student may hold multiple responsibilities. Shared modules should have clearly identified owners and reviewers.

Do not assume that every role maps to a different student.

## 10. Milestones

No verified project deadlines are specified in this plan.

| Milestone | Completion criteria | Planned date | Status |
|---|---|---|---|
| M1 — Requirements baseline | Scope and requirements reviewed | Not scheduled | Not Verified |
| M2 — Architecture baseline | Architecture and database design reviewed | Not scheduled | Not Verified |
| M3 — Backend foundation | Startup and database integration verified | Not scheduled | Not Verified |
| M4 — Core API functionality | Required API workflows tested | Not scheduled | Not Verified |
| M5 — Frontend integration | Approved frontend workflows verified | Not scheduled | Not Verified |
| M6 — Feature integration | Included modules work together | Not scheduled | Not Verified |
| M7 — Testing completion | Required tests and defects reviewed | Not scheduled | Not Verified |
| M8 — Deployment readiness | Environment and recovery checks reviewed | Not scheduled | Not Verified |
| M9 — Academic submission | Required academic deliverables reviewed | Not scheduled | Not Verified |

Dates should be added after confirming the academic deadline, current implementation state, and team availability.

## 11. Dependency Management

Track prerequisites in `dependency-register.md`.

Important dependency categories include:

- Runtime and package compatibility.
- MySQL availability and schema readiness.
- Authentication before protected-resource workflows.
- Stable API contracts before frontend integration.
- Database relationships before dependent CRUD operations.
- File-storage configuration before file-related workflows.
- Test environment readiness before repeatable testing.
- Verified implementation before final documentation claims.
- Testing and security review before release approval.

When a dependency is blocked, record its owner, impact, mitigation, and required follow-up.

## 12. Risk Management

Maintain the detailed risks in `risk-register.md`.

| Risk | Potential impact | Mitigation |
|---|---|---|
| Scope expansion | Delayed delivery | Prioritize approved release requirements |
| Unclear API contracts | Integration rework | Maintain and review API specifications |
| Database inconsistencies | Failed operations or data corruption | Review schema and integration tests |
| Authorization gaps | Unauthorized access | Test roles and resource ownership |
| Team integration conflicts | Delayed shared work | Coordinate interfaces and use code review |
| Incomplete frontend integration | Unusable user workflows | Test end-to-end functionality |
| Insufficient test time | Undetected defects | Prioritize critical workflows early |
| Unverified deployment setup | Release failure | Use deployment and recovery checklists |
| Incomplete documentation | Weak handover and academic review | Maintain documentation throughout development |

## 13. Quality Management

Quality should be incorporated throughout development rather than postponed until the end.

Required practices include:

- Consistent naming and coding conventions.
- Clear separation of application responsibilities.
- Input validation.
- Parameterized SQL queries.
- Server-side authorization.
- Appropriate error handling.
- Review of database relationships.
- Repeatable test data.
- Functional and integration testing.
- Security and regression testing.
- Documentation updates after significant changes.

The intended backend flow is:

`Route → Middleware → Controller → Service → Repository → MySQL`

Use this flow where it matches the existing architecture. Do not introduce unnecessary layers solely to match a diagram.

## 14. Git and Collaboration Workflow

The team should use a controlled workflow for shared changes.

1. Identify the task and affected files.
2. Confirm API and database contracts before parallel work.
3. Create or use an approved working branch.
4. Implement the change.
5. Run relevant tests.
6. Review changes before integration.
7. Resolve conflicts carefully.
8. Update affected documentation.
9. Record the relevant commit and test evidence.
10. Merge using the agreed team workflow.

Do not overwrite another student's work or discard local changes without review.

Follow `git-workflow.md` for the detailed procedure.

## 15. Progress Tracking

Track progress using evidence rather than assumptions.

For each task, record:

- Task ID.
- Description.
- Owner.
- Dependencies.
- Priority.
- Planned start and finish dates.
- Actual start and finish dates.
- Current status.
- Relevant branch or commit.
- Test evidence.
- Blockers.
- Reviewer.

Suggested statuses:

- Not Started
- In Progress
- Blocked
- In Review
- Testing
- Completed
- Deferred
- Cancelled

Use `module-status.md` and `task-breakdown.md` to track detailed implementation progress.

A document being written does not prove that its corresponding application feature is complete.

## 16. Change Management

Significant changes to requirements, architecture, database schema, APIs, security controls, or release scope should be recorded in `change-request-log.md`.

Before approving a change, evaluate:

- Expected benefit.
- Technical complexity.
- Dependencies.
- Security implications.
- Database compatibility.
- Testing effort.
- Schedule impact.
- Effect on academic deliverables.

Keep approved changes traceable through implementation, testing, and documentation.

## 17. Testing and Acceptance

Testing activities should follow `../07-testing/test-plan.md` and related testing documents.

Before accepting a feature:

- [ ] Its requirements are clear.
- [ ] Its implementation is available.
- [ ] Expected behavior is documented.
- [ ] Valid and invalid inputs have been considered.
- [ ] Relevant authorization rules have been tested.
- [ ] Database behavior has been verified where applicable.
- [ ] Relevant tests have been executed.
- [ ] Defects are recorded and reviewed.
- [ ] Acceptance evidence is available.
- [ ] Documentation reflects the actual behavior.

Only tests that have actually been executed can be reported as passed.

## 18. Deployment Planning

Deployment activities should follow the documents in `../08-deployment/`.

Before a release:

- Identify the target environment.
- Record the release commit.
- Confirm dependency compatibility.
- Configure environment variables securely.
- Verify database schema compatibility.
- Review file-storage requirements.
- Execute required tests.
- Confirm backup and rollback arrangements.
- Run smoke tests.
- Record the release decision.

The target hosting platform and deployment date must be confirmed rather than assumed.

## 19. Communication and Review

The team should communicate changes that affect shared components, including:

- API route or response changes.
- Database schema modifications.
- Authentication or authorization changes.
- Shared frontend interfaces.
- Dependency updates.
- Test requirements.
- Deployment configuration.
- Academic submission scope.

Review blockers and milestone status regularly. Record important technical decisions in `../06-development/decisions.md`.

## 20. Project Schedule Template

Use this template when the team agrees on dates.

| Task ID | Task | Owner | Start date | End date | Dependency | Status |
|---|---|---|---|---|---|---|
| TASK-001 | Requirements review | Not assigned | Not scheduled | Not scheduled | Project scope | Not Verified |
| TASK-002 | Architecture review | Not assigned | Not scheduled | Not scheduled | TASK-001 | Not Verified |
| TASK-003 | Database review | Not assigned | Not scheduled | Not scheduled | TASK-001 | Not Verified |
| TASK-004 | Backend verification | Not assigned | Not scheduled | Not scheduled | TASK-002, TASK-003 | Not Verified |
| TASK-005 | Frontend integration | Not assigned | Not scheduled | Not scheduled | TASK-004 | Not Verified |
| TASK-006 | Integrated testing | Not assigned | Not scheduled | Not scheduled | TASK-005 | Not Verified |
| TASK-007 | Deployment review | Not assigned | Not scheduled | Not scheduled | TASK-006 | Not Verified |
| TASK-008 | Academic deliverables | Not assigned | Not scheduled | Not scheduled | Verified project state | Not Verified |

These rows are planning placeholders. Replace them with the team's actual work items, assignments, and dates.

## 21. Completion Criteria

The project is ready for final acceptance when:

- [ ] Approved requirements have been reviewed.
- [ ] Required features are implemented or explicitly documented as deferred.
- [ ] Core workflows have been tested.
- [ ] Authentication and authorization have been reviewed.
- [ ] Database integrity has been checked.
- [ ] Required security tests have evidence.
- [ ] Known defects and limitations are documented.
- [ ] Deployment and recovery procedures are available.
- [ ] Technical documentation matches the verified implementation.
- [ ] Academic deliverables meet the required format.
- [ ] The team has reviewed the final handover.
- [ ] The final acceptance decision is recorded.

Completion depends on the actual project requirements and academic evaluation criteria.

## 22. Project Status Record

Complete this section during a project review.

| Field | Value |
|---|---|
| Review date | Not recorded |
| Current release | Not recorded |
| Current commit | Not recorded |
| Completed work packages | Not recorded |
| Work in progress | Not recorded |
| Blocked tasks | Not recorded |
| Open critical defects | Not recorded |
| Upcoming milestone | Not recorded |
| Main project risks | Not recorded |
| Review owner | Not assigned |

## 23. Related Documentation

- `../DOCUMENTATION-INDEX.md`
- `../AI-CONTEXT.md`
- `../01-product/PRD.md`
- `../01-product/roadmap.md`
- `../02-requirements/functional-requirements.md`
- `../02-requirements/acceptance-criteria.md`
- `../03-technical/architecture.md`
- `../03-technical/database-design.md`
- `../03-technical/api-specification.md`
- `../06-development/development-plan.md`
- `../06-development/git-workflow.md`
- `../06-development/module-status.md`
- `dependency-register.md`
- `risk-register.md`
- `task-breakdown.md`
- `change-request-log.md`
- `../07-testing/test-plan.md`
- `../08-deployment/deployment-plan.md`
- `../08-deployment/rollback-plan.md`

## 24. Maintenance

Review this plan when project scope, module ordering, team assignments, milestones, technical dependencies, or academic requirements change.

Keep the plan aligned with the current repository and verified implementation state.

This document provides a planning framework. Actual completion, delivery readiness, and academic acceptance must be established using current evidence and recorded decisions.
