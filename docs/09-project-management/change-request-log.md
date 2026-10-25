# Digital Library — Change Request Log

## 1. Purpose

This document records proposed, reviewed, approved, rejected, deferred, and implemented changes to the Digital Library project.

The change request process helps the team control changes to requirements, application behavior, APIs, database structures, security controls, user-interface design, testing, and deployment.

This document defines the change-management process and provides a log template. A change must not be treated as approved or implemented without supporting evidence.

## 2. Project Overview

Digital Library is a BTech final-year web application with the following approved technology stack:

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js and Express.js
- Database: MySQL
- Architecture: Monolithic application

Microservices are not part of the approved architecture.

The project may include authentication, user roles, book management, authors, categories, chapters, reading functionality, private-library features, and other approved capabilities depending on the release scope and verified implementation.

## 3. Objectives

The change-management process aims to:

1. Record proposed changes in a consistent format.
2. Explain why a change is needed.
3. Evaluate technical, academic, security, and schedule impacts.
4. Identify affected modules and documentation.
5. Prevent unreviewed changes from disrupting existing functionality.
6. Maintain traceability between requirements, implementation, and tests.
7. Record approval and implementation status.
8. Preserve a history of decisions.

## 4. What Requires a Change Request?

A change request should be created when a proposed modification affects one or more of the following:

- Project scope or objectives.
- Functional requirements.
- Non-functional requirements.
- User roles or permissions.
- API routes, request formats, or response formats.
- MySQL tables, relationships, constraints, or indexes.
- Authentication or authorization behavior.
- File uploads, private-resource access, or storage.
- Frontend navigation or page behavior.
- Reading or media features.
- Security controls.
- Dependencies or technology choices.
- Testing requirements.
- Deployment or recovery procedures.
- Project milestones, task ownership, or release scope.

Minor implementation details that do not affect approved requirements may follow the team's normal code-review process. The team should document the decision when the distinction is unclear.

## 5. Change Request Lifecycle

A change request follows this lifecycle:

1. **Submitted:** The proposal has been recorded.
2. **Under Review:** The team is assessing the proposal.
3. **Approved:** The authorized reviewer has accepted the change.
4. **Rejected:** The proposal has been declined.
5. **Deferred:** The change may be reconsidered later.
6. **In Progress:** Approved implementation work has started.
7. **Implemented:** The code or documentation change is complete.
8. **Verified:** Relevant tests and reviews have passed.
9. **Closed:** The change has been reviewed, verified, and recorded as complete.

A change may move back to review if new risks or requirements are discovered.

## 6. Change Request Identification

Assign each request a unique identifier using the following convention:

`CR-YYYY-NNN`

Examples:

- `CR-2026-001`
- `CR-2026-002`
- `CR-2026-003`

Replace `YYYY` with the year the request is created and `NNN` with a sequential number.

Do not reuse identifiers for different requests.

## 7. Change Request Template

Copy this template for each new request.

### Change Request: CR-YYYY-NNN

| Field | Details |
|---|---|
| Request title | Not recorded |
| Submitted by | Not recorded |
| Submission date | Not recorded |
| Change category | Not recorded |
| Priority | Not assessed |
| Status | Submitted |
| Target release | Not assigned |
| Reviewer | Not assigned |

#### 7.1 Description

Describe the proposed change clearly.

#### 7.2 Reason and expected benefit

Explain the problem, requirement, or opportunity motivating the change.

#### 7.3 Current behavior

Describe the existing behavior, based on verified implementation or approved documentation.

#### 7.4 Proposed behavior

Describe the expected behavior after the change.

#### 7.5 Affected components

List the relevant frontend pages, backend modules, API endpoints, database objects, security controls, tests, and documentation.

#### 7.6 Impact assessment

Assess:

- Scope impact.
- Technical complexity.
- Database compatibility.
- API compatibility.
- Security and privacy risks.
- Testing effort.
- Deployment and recovery requirements.
- Schedule and team workload.
- Academic deliverables.

#### 7.7 Acceptance criteria

Define measurable conditions that must be satisfied before the change can be considered verified.

#### 7.8 Approval decision

Record the decision, reviewer, date, and rationale.

#### 7.9 Implementation and verification

Record the relevant commit, test results, evidence, and closure decision.

## 8. Priority Levels

| Priority | Meaning |
|---|---|
| P0 — Critical | Required to address a severe security, data-integrity, or core-system issue |
| P1 — High | Important for the approved release or a major workflow |
| P2 — Medium | Useful improvement with manageable impact |
| P3 — Low | Optional enhancement or minor improvement |

Priority describes urgency and impact. It does not replace approval or risk assessment.

## 9. Change Impact Assessment

Before approving a request, assess the following areas.

### 9.1 Functional impact

- Does the change modify existing user behavior?
- Does it add or remove a capability?
- Are acceptance criteria affected?
- Does it change role-specific behavior?

### 9.2 Technical impact

- Does it change API contracts?
- Does it affect controller, service, or repository logic?
- Does it introduce a new dependency?
- Does it affect the monolithic architecture?
- Does it require configuration changes?

### 9.3 Database impact

- Are tables or columns added, changed, or removed?
- Are primary keys, foreign keys, or indexes affected?
- Could existing records become invalid?
- Is a migration or data transformation required?
- Can the previous application version use the changed schema?

### 9.4 Security impact

- Does the change affect authentication or authorization?
- Does it introduce a new attack surface?
- Does it expose private documents or user data?
- Does it change validation, file handling, or rate limiting?
- Does it affect secrets or session/token handling?

### 9.5 Testing impact

- Which existing tests must be updated?
- Which new tests are needed?
- Is regression testing required?
- Are manual API tests necessary?
- What evidence is required for acceptance?

### 9.6 Project impact

- Does the change affect milestones?
- Are additional team members or skills required?
- Does it affect the academic synopsis or presentation?
- Should the change be deferred to a later version?

## 10. Approval Rules

Before implementation, a request should have:

- A clear problem statement.
- A documented expected benefit.
- Identified affected components.
- An impact assessment.
- Acceptance criteria.
- An identified reviewer.
- A recorded approval decision.

Changes affecting security, database integrity, authentication, or release scope require careful review before implementation.

Emergency fixes may follow an expedited review process, but their rationale, implementation, testing, and follow-up review must still be recorded.

The specific approval authority should be agreed upon by the project team and academic supervisor where required.

## 11. Implementation Traceability

For each approved change, record:

- Change request ID.
- Related requirement or issue.
- Affected modules.
- Implementation owner.
- Related Git branch or commit.
- Database migration reference, if applicable.
- Tests executed.
- Test results.
- Documentation updated.
- Reviewer and approval date.
- Final status.

Use the project's established Git workflow. Do not claim a change has been pushed, deployed, or verified unless that action has actually occurred.

## 12. Change Request Register

The following register is a starting template. It does not represent confirmed historical requests.

| Request ID | Title | Category | Priority | Status | Owner | Target release |
|---|---|---|---|---|---|---|
| CR-YYYY-001 | Not recorded | Not assessed | Not assessed | Not submitted | Not assigned | Not assigned |

Add one row per request. Replace the example identifier with the first valid identifier when a real request is submitted.

## 13. Example Change Request

The following is an illustrative example, not a record of an approved project change.

### CR-EXAMPLE-001 — Improve Book Search Validation

| Field | Example |
|---|---|
| Category | Functional / Validation |
| Priority | P2 — Medium |
| Status | Example only — not submitted |
| Owner | Not assigned |
| Target release | Not assigned |

**Description:** Improve server-side validation for book-search input.

**Reason:** Unexpected input may produce inconsistent responses or unnecessary database work.

**Potentially affected components:**

- Search route and request validation.
- Relevant service and repository logic.
- API documentation.
- Functional and regression tests.
- Error-handling documentation.

**Acceptance criteria:**

1. Valid search requests return results according to the API contract.
2. Invalid input is handled safely.
3. Database access remains parameterized.
4. Existing search behavior does not regress.
5. Automated or manual test evidence is recorded.

**Approval:** Not requested.

**Implementation:** Not started.

This example demonstrates the expected format only. It must not be added to the historical register as an actual project decision.

## 14. Rejected and Deferred Changes

Rejected or deferred requests should remain in the log.

For each decision, record:

- The reason for rejection or deferral.
- The reviewer.
- The decision date.
- Any unresolved dependency.
- Conditions under which the proposal may be reconsidered.

Retaining these records prevents the same proposal from being repeatedly reviewed without considering the earlier decision.

## 15. Emergency Change Management

An emergency change may be required to address a critical defect or security problem.

Recommended process:

1. Record the issue and its impact.
2. Identify the minimum safe corrective change.
3. Obtain the required expedited approval.
4. Implement the change in a controlled branch or environment.
5. Execute focused tests.
6. Review security and data-integrity implications.
7. Deploy using the approved recovery-aware process.
8. Verify the result.
9. Complete the change request record.
10. Perform a retrospective review.

Emergency status does not justify skipping essential security checks or making untracked destructive changes.

## 16. Documentation Maintenance

An approved change may require updates to:

- `PRD.md`
- `feature-list.md`
- `functional-requirements.md`
- `non-functional-requirements.md`
- `acceptance-criteria.md`
- `api-specification.md`
- `architecture.md`
- `database-design.md`
- `security-design.md`
- Relevant testing documents.
- Deployment and rollback documents.
- Academic synopsis or presentation materials.

Update only the documents affected by the approved change. Preserve consistency across requirements, implementation, tests, and documentation.

## 17. Closure Criteria

A change request can be closed when:

- [ ] The request and decision are documented.
- [ ] Required approval has been recorded.
- [ ] The implementation is complete, if approved.
- [ ] Relevant tests have been executed.
- [ ] Test results and evidence are recorded.
- [ ] Security and database implications have been reviewed.
- [ ] Required documentation has been updated.
- [ ] Outstanding defects and limitations are documented.
- [ ] The reviewer has accepted the result.
- [ ] The final status is recorded.

Rejected requests may be closed as rejected after the decision and rationale are documented. They do not require implementation.

## 18. Reporting

Periodically review the change request register to identify:

- Requests awaiting review.
- Approved changes not yet started.
- Changes currently in progress.
- Changes awaiting verification.
- Rejected or deferred requests.
- Changes affecting the current release.
- Requests that introduce schedule or technical risks.

Report counts only from the actual maintained register. Do not infer project completion from the number of documents created.

## 19. Related Documentation

- `../01-product/PRD.md`
- `../01-product/roadmap.md`
- `../02-requirements/functional-requirements.md`
- `../02-requirements/acceptance-criteria.md`
- `../03-technical/architecture.md`
- `../03-technical/database-design.md`
- `../06-development/decisions.md`
- `../06-development/git-workflow.md`
- `../06-development/module-status.md`
- `../07-testing/test-plan.md`
- `../08-deployment/deployment-plan.md`
- `../08-deployment/rollback-plan.md`

## 20. Maintenance

The project team should review this log whenever a requirement, implementation decision, release scope, or technical constraint changes.

Every significant change should be traceable from its initial request through approval, implementation, verification, and closure.

This document defines the change-management process. The register becomes an accurate project history only when real requests and decisions are entered and maintained.
