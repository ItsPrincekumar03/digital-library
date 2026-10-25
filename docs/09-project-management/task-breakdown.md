# Digital Library — Task Breakdown Structure

## 1. Purpose

This document breaks the Digital Library project into manageable tasks, work packages, dependencies, responsibilities, and completion criteria.

It supports team coordination, workload distribution, progress tracking, testing, and preparation of academic deliverables.

This is a planning document. Task assignments, dates, and completion statuses must be updated according to the team's actual decisions and verified implementation.

## 2. Project Overview

**Project:** Digital Library

**Project type:** BTech final-year project

**Approved technology stack:**

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js and Express.js
- Database: MySQL
- Architecture: Monolithic application

Microservices are not part of the approved architecture.

The project may include authentication, user management, books, authors, categories, chapters, private-library functionality, reading features, and other approved capabilities depending on the release scope.

## 3. Task Management Rules

Each task should have:

- A unique task ID.
- A clear description.
- An accountable owner.
- Defined prerequisites.
- A priority.
- A measurable completion criterion.
- A status.
- Relevant implementation or documentation references.
- Test evidence when applicable.

Tasks should be small enough to estimate, assign, review, and verify independently.

A task should not be marked complete simply because code has been written. Its acceptance criteria must be satisfied.

## 4. Task Status Definitions

| Status | Meaning |
|---|---|
| Not Started | Work has not begun |
| In Progress | Implementation or preparation is underway |
| Blocked | A prerequisite or issue prevents progress |
| In Review | Work is awaiting review |
| Testing | Verification is underway |
| Completed | Acceptance criteria have been satisfied |
| Deferred | Work has been postponed |
| Cancelled | Work is no longer required |

Record a reason when a task is blocked, deferred, or cancelled.

## 5. Priority Definitions

- **P0 — Critical:** Essential for security, data integrity, startup, or a release-blocking workflow.
- **P1 — High:** Required for major application functionality or integration.
- **P2 — Medium:** Supporting functionality, quality improvements, or important documentation.
- **P3 — Low:** Optional enhancement or later-release improvement.

Priorities must reflect the approved release scope and current risks.

## 6. Work Breakdown Structure

The following work packages organize the project from planning through delivery.

| WBS | Work package | Main output |
|---|---|---|
| 1.0 | Project planning | Approved scope and plan |
| 1.1 | Requirements analysis | Functional and non-functional requirements |
| 1.2 | Acceptance criteria | Testable completion conditions |
| 1.3 | Architecture design | Monolithic application architecture |
| 1.4 | Database design | Reviewed schema and relationships |
| 1.5 | API specification | Documented API contracts |
| 2.0 | Backend foundation | Configured Express.js application |
| 2.1 | Authentication and users | Account and access-control workflows |
| 2.2 | Book management | Supported book operations |
| 2.3 | Authors and categories | Related entity operations |
| 2.4 | Chapter management | Chapter operations and relationships |
| 2.5 | Publication and visibility | Approved visibility rules |
| 2.6 | Private-library functionality | Protected resources, if in scope |
| 3.0 | Frontend foundation | Pages, styles, and navigation |
| 3.1 | API integration | Connected user workflows |
| 3.2 | Reader functionality | Approved reading features |
| 3.3 | Appearance preferences | Dark mode and background settings, if included |
| 4.0 | Integration and testing | Test results and defect records |
| 4.1 | Security verification | Security test evidence |
| 4.2 | Regression testing | Regression results |
| 5.0 | Deployment preparation | Environment and recovery procedures |
| 6.0 | Academic deliverables | Synopsis, presentation, and final report |

This breakdown is a planning baseline, not a declaration that every work package has been implemented.

## 7. Task Register — Planning and Design

| Task ID | Task | Priority | Dependency | Status |
|---|---|---|---|---|
| TASK-001 | Confirm project scope | P0 | Project objectives | Not Started |
| TASK-002 | Review functional requirements | P1 | TASK-001 | Not Started |
| TASK-003 | Review non-functional requirements | P1 | TASK-001 | Not Started |
| TASK-004 | Define acceptance criteria | P1 | TASK-002, TASK-003 | Not Started |
| TASK-005 | Review system architecture | P1 | TASK-002 | Not Started |
| TASK-006 | Review database schema | P0 | TASK-002 | Not Started |
| TASK-007 | Review API contracts | P1 | TASK-005, TASK-006 | Not Started |
| TASK-008 | Review security requirements | P0 | TASK-002 | Not Started |
| TASK-009 | Establish test plan | P1 | TASK-004, TASK-008 | Not Started |

Update these statuses to reflect current project evidence.

## 8. Task Register — Backend Foundation

| Task ID | Task | Priority | Dependency | Status |
|---|---|---|---|---|
| TASK-010 | Verify Node.js and Express.js configuration | P0 | TASK-005 | Not Started |
| TASK-011 | Verify environment-variable handling | P0 | TASK-010 | Not Started |
| TASK-012 | Verify MySQL connectivity | P0 | TASK-006, TASK-011 | Not Started |
| TASK-013 | Review shared middleware | P1 | TASK-010 | Not Started |
| TASK-014 | Review error-handling behavior | P1 | TASK-013 | Not Started |
| TASK-015 | Verify request parsing and validation | P1 | TASK-013 | Not Started |
| TASK-016 | Verify application startup | P0 | TASK-012, TASK-014 | Not Started |
| TASK-017 | Verify health-check behavior, if implemented | P1 | TASK-016 | Not Started |

The exact middleware, scripts, and endpoint paths must be confirmed against the current codebase.

## 9. Task Register — Authentication and Authorization

| Task ID | Task | Priority | Dependency | Status |
|---|---|---|---|---|
| TASK-018 | Review registration workflow | P0 | TASK-016 | Not Started |
| TASK-019 | Review login workflow | P0 | TASK-018 | Not Started |
| TASK-020 | Verify password hashing | P0 | TASK-018 | Not Started |
| TASK-021 | Verify authentication middleware | P0 | TASK-019 | Not Started |
| TASK-022 | Verify role-based restrictions | P0 | TASK-021 | Not Started |
| TASK-023 | Verify resource ownership checks | P0 | TASK-021 | Not Started |
| TASK-024 | Verify logout behavior | P1 | TASK-021 | Not Started |
| TASK-025 | Test invalid credentials and unauthorized access | P0 | TASK-018 to TASK-024 | Not Started |

Do not assume that a particular token or cookie strategy is active without checking the implementation.

## 10. Task Register — Books, Authors, and Categories

| Task ID | Task | Priority | Dependency | Status |
|---|---|---|---|---|
| TASK-026 | Review book data model | P1 | TASK-006 | Not Started |
| TASK-027 | Verify book creation and validation | P1 | TASK-026 | Not Started |
| TASK-028 | Verify book retrieval | P1 | TASK-026 | Not Started |
| TASK-029 | Verify book updates | P1 | TASK-026 | Not Started |
| TASK-030 | Verify book deletion or archival rules | P1 | TASK-026 | Not Started |
| TASK-031 | Review author operations | P1 | TASK-006 | Not Started |
| TASK-032 | Review category operations | P1 | TASK-006 | Not Started |
| TASK-033 | Verify book-author relationships | P1 | TASK-026, TASK-031 | Not Started |
| TASK-034 | Verify book-category relationships | P1 | TASK-026, TASK-032 | Not Started |
| TASK-035 | Verify publication and visibility rules | P1 | TASK-026 | Not Started |

Test both valid and invalid relationship identifiers, including unauthorized operations where applicable.

## 11. Task Register — Chapters and Private Resources

| Task ID | Task | Priority | Dependency | Status |
|---|---|---|---|---|
| TASK-036 | Review chapter data model | P1 | TASK-006 | Not Started |
| TASK-037 | Verify chapter creation | P1 | TASK-036 | Not Started |
| TASK-038 | Verify chapter retrieval and ordering | P1 | TASK-036 | Not Started |
| TASK-039 | Verify chapter updates and removal rules | P1 | TASK-036 | Not Started |
| TASK-040 | Verify chapter-to-book relationships | P1 | TASK-026, TASK-036 | Not Started |
| TASK-041 | Review private-library requirements | P1 | TASK-002 | Not Started |
| TASK-042 | Verify private-resource authorization | P0 | TASK-021, TASK-041 | Not Started |
| TASK-043 | Verify file validation and storage, if implemented | P0/P1 | TASK-041 | Not Started |
| TASK-044 | Verify authorized downloads, if supported | P0/P1 | TASK-042, TASK-043 | Not Started |

Mark file-related tasks as not applicable if those capabilities are outside the approved release.

## 12. Task Register — Frontend

| Task ID | Task | Priority | Dependency | Status |
|---|---|---|---|---|
| TASK-045 | Review frontend directory and entry point | P1 | Approved page specification | Not Started |
| TASK-046 | Establish page structure and navigation | P1 | TASK-045 | Not Started |
| TASK-047 | Implement approved HTML layouts | P1 | TASK-046 | Not Started |
| TASK-048 | Implement styles and responsive behavior | P2 | TASK-047 | Not Started |
| TASK-049 | Implement Vanilla JavaScript interactions | P1 | TASK-047 | Not Started |
| TASK-050 | Integrate authentication workflows | P1 | TASK-018, TASK-021, TASK-049 | Not Started |
| TASK-051 | Integrate book and category workflows | P1 | TASK-027 to TASK-035, TASK-049 | Not Started |
| TASK-052 | Integrate chapter workflows | P1 | TASK-037 to TASK-040, TASK-049 | Not Started |
| TASK-053 | Implement loading and error states | P1 | TASK-050 to TASK-052 | Not Started |
| TASK-054 | Verify browser behavior and API URLs | P1 | TASK-050 to TASK-053 | Not Started |

The frontend should integrate with verified backend contracts rather than assumed endpoints.

## 13. Task Register — Reading and Supporting Features

| Task ID | Task | Priority | Dependency | Status |
|---|---|---|---|---|
| TASK-055 | Confirm reader feature scope | P1 | TASK-001 | Not Started |
| TASK-056 | Implement approved reading interface | P1 | TASK-055, TASK-045 | Not Started |
| TASK-057 | Verify PDF rendering, if included | P2 | TASK-056 | Not Started |
| TASK-058 | Verify speech synthesis, if included | P2 | TASK-056 | Not Started |
| TASK-059 | Verify supported speed and pitch controls | P2 | TASK-058 | Not Started |
| TASK-060 | Implement dark mode, if included | P2 | TASK-045 | Not Started |
| TASK-061 | Implement background preferences, if included | P2 | TASK-045 | Not Started |
| TASK-062 | Verify reader accessibility and usability | P2 | Relevant reader tasks | Not Started |

Browser capabilities and limitations should be documented. Do not promise identical pitch or speech behavior across all browsers.

## 14. Task Register — Testing and Quality

| Task ID | Task | Priority | Dependency | Status |
|---|---|---|---|---|
| TASK-063 | Prepare test data | P1 | Database setup | Not Started |
| TASK-064 | Execute functional tests | P1 | Relevant feature implementation | Not Started |
| TASK-065 | Execute integration tests | P1 | API and database integration | Not Started |
| TASK-066 | Execute authentication tests | P0 | Authentication implementation | Not Started |
| TASK-067 | Execute authorization tests | P0 | Authorization implementation | Not Started |
| TASK-068 | Execute input-validation tests | P1 | API implementation | Not Started |
| TASK-069 | Execute security tests | P0 | Relevant implementation | Not Started |
| TASK-070 | Execute regression tests | P1 | Integrated changes | Not Started |
| TASK-071 | Record defects and reproduction steps | P1 | Test execution | Not Started |
| TASK-072 | Retest fixes and update evidence | P1 | Defect corrections | Not Started |
| TASK-073 | Review release acceptance criteria | P1 | Required testing | Not Started |

Testing status must be supported by actual test results.

## 15. Task Register — Deployment and Academic Delivery

| Task ID | Task | Priority | Dependency | Status |
|---|---|---|---|---|
| TASK-074 | Verify deployment prerequisites | P1 | Integrated application | Not Started |
| TASK-075 | Configure target environment | P1 | TASK-074 | Not Started |
| TASK-076 | Verify database deployment procedure | P0 | TASK-075 | Not Started |
| TASK-077 | Review backup and rollback procedures | P1 | TASK-075 | Not Started |
| TASK-078 | Execute deployment smoke tests | P1 | TASK-074 to TASK-077 | Not Started |
| TASK-079 | Finalize project synopsis | P1 | Verified project scope | Not Started |
| TASK-080 | Prepare presentation | P1 | Verified project functionality | Not Started |
| TASK-081 | Finalize technical documentation | P1 | Current implementation | Not Started |
| TASK-082 | Prepare final source-code handover | P1 | Required reviews | Not Started |
| TASK-083 | Review academic submission requirements | P1 | TASK-079 to TASK-082 | Not Started |

Confirm the college's actual submission format and deadline before scheduling these tasks.

## 16. Team Responsibilities

The project has been discussed as a four-student team:

- Prince Madhesia
- Prince Kumar
- Ritwiz Gupta
- Mukesh Yadav

The current ownership of each task must be confirmed with the team's latest decisions.

Use this assignment template:

| Task ID | Task | Owner | Reviewer | Assignment status |
|---|---|---|---|---|
| TASK-001 | Confirm project scope | Not assigned | Not assigned | Pending |
| TASK-006 | Review database schema | Not assigned | Not assigned | Pending |
| TASK-016 | Verify application startup | Not assigned | Not assigned | Pending |
| TASK-025 | Test authentication and authorization | Not assigned | Not assigned | Pending |
| TASK-045 | Review frontend entry point | Not assigned | Not assigned | Pending |
| TASK-065 | Execute integration tests | Not assigned | Not assigned | Pending |
| TASK-078 | Execute deployment smoke tests | Not assigned | Not assigned | Pending |
| TASK-080 | Prepare presentation | Not assigned | Not assigned | Pending |

One student may own several tasks. Shared tasks should have one accountable owner and a clear reviewer.

## 17. Task Acceptance Criteria

A task should be marked complete when its relevant criteria are satisfied.

### Development tasks

- [ ] Requirements are understood.
- [ ] The implementation follows the approved architecture.
- [ ] Input validation and authorization are addressed where required.
- [ ] Relevant tests have been executed.
- [ ] Defects are recorded or resolved.
- [ ] Changes are reviewed.
- [ ] Relevant documentation is updated.
- [ ] Evidence is recorded.

### Documentation tasks

- [ ] Content reflects the actual approved scope.
- [ ] Planned and implemented features are distinguished.
- [ ] Technical claims have supporting evidence where required.
- [ ] Related documents are consistent.
- [ ] Cross-references are correct.
- [ ] The responsible reviewer has reviewed the document.

### Deployment tasks

- [ ] Target environment is identified.
- [ ] Configuration is correct and secure.
- [ ] Database compatibility is checked.
- [ ] Required tests have been executed.
- [ ] Recovery procedures are documented.
- [ ] Deployment results are recorded.

## 18. Schedule and Effort Tracking

Do not invent task deadlines or completion dates.

For each assigned task, record:

| Field | Value |
|---|---|
| Task ID | Not recorded |
| Planned start | Not scheduled |
| Planned completion | Not scheduled |
| Actual start | Not recorded |
| Actual completion | Not recorded |
| Estimated effort | Not estimated |
| Actual effort | Not recorded |
| Blocker | None recorded |
| Last review | Not recorded |

Set dates after confirming the academic deadline, task dependencies, team availability, and current implementation state.

## 19. Blocker Management

When a task becomes blocked:

1. Change its status to `Blocked`.
2. Record the missing prerequisite or problem.
3. Identify the dependency owner.
4. Assess the impact on dependent tasks.
5. Define a mitigation or workaround.
6. Communicate the blocker to affected team members.
7. Track the resolution.
8. Verify the dependent task after the blocker is removed.

Do not bypass essential security, database-integrity, or testing requirements simply to keep a task moving.

## 20. Change Control

Significant changes to tasks, requirements, architecture, database schema, or release scope should be recorded in `change-request-log.md`.

Before accepting a new task:

- Confirm its expected benefit.
- Identify dependencies.
- Assess its priority.
- Determine whether it belongs in the current release.
- Review security and testing impact.
- Assign an owner.
- Update the project plan where necessary.

Deferred work should remain visible so that it is not mistaken for completed work.

## 21. Progress Reporting

Review the task register regularly and summarize:

- Tasks completed with evidence.
- Tasks in progress.
- Blocked tasks.
- Tasks awaiting review.
- Tasks awaiting testing.
- Critical defects.
- Upcoming milestones.
- Risks requiring escalation.
- Deferred work.

Use the current task register and `module-status.md` to report progress. Do not infer module completion from the number of task rows or documentation files.

## 22. Related Documentation

- `project-plan.md`
- `dependency-register.md`
- `risk-register.md`
- `change-request-log.md`
- `../01-product/roadmap.md`
- `../02-requirements/acceptance-criteria.md`
- `../03-technical/architecture.md`
- `../03-technical/database-design.md`
- `../03-technical/api-specification.md`
- `../06-development/development-plan.md`
- `../06-development/git-workflow.md`
- `../06-development/module-status.md`
- `../07-testing/test-plan.md`
- `../08-deployment/deployment-plan.md`
- `../08-deployment/production-checklist.md`
- `../08-deployment/rollback-plan.md`
- `../10-academic/project-synopsis.md`

## 23. Maintenance

Update this document whenever task scope, module dependencies, team assignments, priorities, acceptance criteria, or project milestones change.

Keep the task register consistent with the current repository, verified test results, and approved project decisions.

This document defines a work breakdown and tracking process. It does not prove that listed tasks have been assigned, started, or completed.
