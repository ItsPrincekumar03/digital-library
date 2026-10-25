# Digital Library — Risk Register

## 1. Purpose

This document identifies, assesses, prioritizes, and tracks risks that could affect the Digital Library project's scope, implementation, security, quality, schedule, deployment, and academic delivery.

The risk register provides a structured process for prevention, mitigation, monitoring, and escalation.

This document identifies potential risks. It does not claim that a risk has occurred or that a mitigation has been implemented unless supporting evidence is recorded.

## 2. Project Overview

**Project:** Digital Library

**Project type:** BTech final-year web application

**Approved technology stack:**

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js and Express.js
- Database: MySQL
- Architecture: Monolithic application

Microservices are not part of the approved architecture.

The intended application may include authentication, role-based access, books, authors, categories, chapters, reading features, and private-library resources depending on the approved release scope and verified implementation.

## 3. Risk Management Objectives

The project team should:

1. Identify threats before they cause significant problems.
2. Assess each risk by likelihood and impact.
3. Prioritize risks that could affect security, data integrity, or essential workflows.
4. Assign an owner to each significant risk.
5. Define practical prevention and mitigation actions.
6. Establish triggers that indicate a risk is increasing.
7. Track mitigation progress using evidence.
8. Reassess residual risk after mitigation.
9. Record incidents and lessons learned.
10. Review risks before integration, testing, deployment, and academic submission.

## 4. Risk Categories

### 4.1 Technical risks

- Incompatible runtime or dependencies.
- Incorrect API contracts.
- Database schema inconsistencies.
- Integration failures.
- Application startup failures.
- Poor performance or reliability.

### 4.2 Security risks

- Weak authentication controls.
- Missing role or ownership checks.
- SQL injection.
- Cross-site scripting.
- Unsafe file uploads.
- Exposure of private resources.
- Leakage of credentials or tokens.

### 4.3 Project management risks

- Unclear requirements.
- Scope expansion.
- Unassigned responsibilities.
- Delayed dependencies.
- Team integration conflicts.
- Unrealistic schedules.

### 4.4 Quality risks

- Insufficient test coverage.
- Undetected regressions.
- Inconsistent error handling.
- Incorrect business rules.
- Incomplete documentation.

### 4.5 Deployment and recovery risks

- Incorrect environment configuration.
- Database incompatibility.
- Missing persistent file storage.
- Inadequate backups.
- Failed rollback.
- Differences between development and deployment environments.

### 4.6 Academic delivery risks

- Incomplete synopsis or report.
- Presentation claims that exceed verified functionality.
- Missing testing evidence.
- Inconsistent documentation.
- Incomplete source-code handover.

## 5. Risk Assessment Method

Assess each risk using two ratings:

- **Likelihood:** How likely the risk is to occur.
- **Impact:** How serious the consequences would be.

Use a scale from 1 to 5.

### 5.1 Likelihood scale

| Score | Rating | Description |
|---|---|---|
| 1 | Rare | Unlikely under current conditions |
| 2 | Unlikely | Possible but not expected |
| 3 | Possible | Could reasonably occur |
| 4 | Likely | Expected to occur without intervention |
| 5 | Almost Certain | Highly likely or recurring |

### 5.2 Impact scale

| Score | Rating | Description |
|---|---|---|
| 1 | Negligible | Minimal inconvenience |
| 2 | Minor | Limited rework or disruption |
| 3 | Moderate | Significant rework or partial feature failure |
| 4 | Major | Essential workflow, data, or delivery seriously affected |
| 5 | Critical | Severe security, data-integrity, or project-delivery consequences |

### 5.3 Risk score

Calculate the initial risk score as:

Risk score = Likelihood × Impact

The score ranges from 1 to 25.

| Score | Risk level | Suggested response |
|---|---|---|
| 1–4 | Low | Monitor and review periodically |
| 5–9 | Moderate | Define mitigation and track progress |
| 10–16 | High | Prioritize mitigation and assign an owner |
| 17–25 | Critical | Escalate and address urgently |

These thresholds are a project-planning convention. A security or data-integrity risk may require urgent action regardless of its numerical score.

## 6. Risk Status Definitions

- **Open:** Risk has been identified but is not resolved.
- **Mitigation In Progress:** Risk-reduction work is underway.
- **Monitoring:** Controls exist, but residual risk remains.
- **Escalated:** The risk requires a higher-level decision.
- **Closed:** Evidence supports closing the risk.
- **Accepted:** An authorized reviewer has explicitly accepted the remaining risk.

Do not mark a risk closed merely because a mitigation action has been proposed.

## 7. Initial Risk Register

The following ratings are preliminary planning estimates, not measured project statistics. Reassess them against the current implementation, deadlines, and environment.

| ID | Risk | Likelihood | Impact | Score | Level | Status |
|---|---|---:|---:|---:|---|---|
| RISK-001 | Scope expansion delays essential features | 4 | 4 | 16 | High | Open |
| RISK-002 | Incomplete or unclear requirements cause rework | 3 | 4 | 12 | High | Open |
| RISK-003 | Backend and frontend API contracts become inconsistent | 4 | 4 | 16 | High | Open |
| RISK-004 | Database schema and application queries diverge | 3 | 5 | 15 | High | Open |
| RISK-005 | Authentication or authorization defects expose protected operations | 3 | 5 | 15 | High | Open |
| RISK-006 | SQL injection or unsafe input handling compromises data | 3 | 5 | 15 | High | Open |
| RISK-007 | Insufficient testing leaves serious defects undetected | 4 | 4 | 16 | High | Open |
| RISK-008 | Team coordination or shared-code conflicts delay integration | 3 | 4 | 12 | High | Open |
| RISK-009 | Environment configuration prevents application startup | 3 | 4 | 12 | High | Open |
| RISK-010 | Database failure or unsafe changes cause data loss | 2 | 5 | 10 | High | Open |
| RISK-011 | Private files become accessible to unauthorized users | 3 | 5 | 15 | High | Open |
| RISK-012 | Missing or incomplete deployment recovery procedures prolong downtime | 3 | 4 | 12 | High | Open |
| RISK-013 | Documentation becomes inconsistent with the implementation | 4 | 3 | 12 | High | Open |
| RISK-014 | Academic deliverables are incomplete at submission time | 3 | 5 | 15 | High | Open |
| RISK-015 | Dependency incompatibility breaks startup or runtime behavior | 3 | 4 | 12 | High | Open |
| RISK-016 | Planned features are presented as implemented without evidence | 3 | 4 | 12 | High | Open |
| RISK-017 | Uploaded files are lost during redeployment | 2 | 4 | 8 | Moderate | Open |
| RISK-018 | Future AI features expand scope or introduce unplanned costs | 3 | 3 | 9 | Moderate | Open |

These entries are a starting assessment. Update scores and statuses as evidence becomes available.

## 8. Detailed Risk Mitigation Plans

### RISK-001 — Scope Expansion

**Cause:** New features are added before the approved release requirements are complete.

**Potential impact:** Delayed delivery, incomplete testing, and unfinished academic deliverables.

**Mitigation:**

- Define the minimum viable product.
- Separate release requirements from future enhancements.
- Evaluate changes through the change request process.
- Prioritize essential workflows.
- Review scope before accepting additional work.

**Trigger:** New requirements repeatedly displace planned release tasks.

**Owner:** Project coordinator, to be assigned.

**Residual risk:** Reassess after scope and priorities are agreed.

### RISK-002 — Unclear Requirements

**Cause:** Features lack precise behavior, validation rules, or acceptance criteria.

**Potential impact:** Conflicting implementations and repeated rework.

**Mitigation:**

- Document functional and non-functional requirements.
- Define testable acceptance criteria.
- Resolve ambiguous business rules before implementation.
- Review requirements with affected team members.

**Trigger:** Developers interpret the same feature differently.

### RISK-003 — API Contract Inconsistency

**Cause:** Frontend and backend work proceed with different assumptions about endpoints or response formats.

**Potential impact:** Broken integration and repeated changes.

**Mitigation:**

- Maintain the API specification.
- Agree on request and response structures.
- Communicate breaking changes.
- Test integrated workflows.
- Review affected frontend code after API changes.

**Trigger:** Requests fail because of mismatched paths, fields, status codes, or authentication expectations.

### RISK-004 — Database Inconsistency

**Cause:** Schema changes are not coordinated with services, repositories, or existing records.

**Potential impact:** Query failures, invalid relationships, or data loss.

**Mitigation:**

- Maintain the database design document.
- Review schema changes.
- Use appropriate constraints and indexes.
- Test migrations in an isolated environment.
- Verify application queries against the actual schema.
- Prepare recovery procedures before risky changes.

**Trigger:** Runtime database errors or failed integrity checks appear after a schema change.

### RISK-005 — Authentication and Authorization Defects

**Cause:** Missing server-side authentication, role checks, or ownership validation.

**Potential impact:** Unauthorized operations or disclosure of protected data.

**Mitigation:**

- Test unauthenticated access.
- Test each role against restricted operations.
- Verify resource ownership.
- Review middleware and route protection.
- Avoid relying on frontend-only restrictions.
- Record evidence from negative access-control tests.

**Trigger:** A user can access an operation or resource outside their permissions.

**Response:** Restrict affected access immediately and investigate.

### RISK-006 — SQL Injection and Unsafe Input

**Cause:** User-controlled values reach database queries without appropriate parameterization or validation.

**Potential impact:** Unauthorized data access, modification, or deletion.

**Mitigation:**

- Use parameterized SQL queries.
- Validate request fields and identifiers.
- Apply appropriate database permissions.
- Test malformed and unexpected input.
- Review error handling and query construction.

**Trigger:** Review or testing identifies unsafe query construction.

### RISK-007 — Insufficient Testing

**Cause:** Tests are delayed or limited to successful scenarios.

**Potential impact:** Security defects, regressions, and failed demonstrations.

**Mitigation:**

- Maintain the test plan.
- Prioritize critical workflows.
- Test invalid input and unauthorized access.
- Run integration and regression tests after relevant changes.
- Track defects and retest fixes.
- Reserve time for release verification.

**Trigger:** Major features reach integration without recorded test results.

### RISK-008 — Team Integration Conflicts

**Cause:** Shared files, schemas, API contracts, or task responsibilities are not coordinated.

**Potential impact:** Merge conflicts, duplicated work, and delayed delivery.

**Mitigation:**

- Assign clear module owners.
- Coordinate shared interfaces.
- Use the agreed Git workflow.
- Review changes before integration.
- Communicate database and API changes early.

**Trigger:** Repeated merge conflicts or incompatible implementations block work.

### RISK-009 — Environment Configuration Failure

**Cause:** Missing variables, incompatible runtimes, or incorrect database credentials.

**Potential impact:** Application startup or connectivity failure.

**Mitigation:**

- Maintain environment setup instructions.
- Document required variable names.
- Keep secrets outside version control.
- Verify supported runtime versions.
- Test the startup process in a clean environment.

**Trigger:** The application starts locally for one developer but fails in another environment.

### RISK-010 — Database Failure or Data Loss

**Cause:** Accidental deletion, unsafe migrations, unavailable storage, or failed recovery.

**Potential impact:** Lost records and prolonged interruption.

**Mitigation:**

- Separate development and production databases.
- Review destructive operations.
- Back up important data.
- Document restoration procedures.
- Test recovery in an isolated environment.
- Verify record integrity after recovery.

**Trigger:** Unexpected record loss, database corruption, or an unsuccessful migration.

### RISK-011 — Private File Exposure

**Cause:** Files are stored in a public location or accessed without server-side authorization.

**Potential impact:** Disclosure of private documents.

**Mitigation:**

- Verify storage paths.
- Validate uploads.
- Enforce ownership and access checks.
- Avoid exposing private storage through static file serving.
- Test unauthorized download attempts.
- Review file permissions.

**Trigger:** A private resource can be retrieved without the required authorization.

### RISK-012 — Inadequate Recovery Procedures

**Cause:** The team cannot identify a compatible application version or recover required data.

**Potential impact:** Extended downtime or irreversible data loss.

**Mitigation:**

- Record the deployed commit.
- Maintain rollback instructions.
- Assess database compatibility before rollback.
- Document backup locations.
- Test recovery procedures.

**Trigger:** A release failure occurs without a verified recovery path.

### RISK-013 — Documentation Drift

**Cause:** API, schema, or feature changes are not reflected in documentation.

**Potential impact:** Incorrect development assumptions and misleading project reports.

**Mitigation:**

- Update affected documents with implementation changes.
- Review documentation during code review.
- Distinguish intended design from verified functionality.
- Recheck cross-document references.

**Trigger:** Documentation contradicts the current code or actual test results.

### RISK-014 — Academic Delivery Delay

**Cause:** Synopsis, final report, presentation, or required evidence is left until the end.

**Potential impact:** Incomplete submission or rushed demonstration.

**Mitigation:**

- Confirm academic requirements and deadlines.
- Maintain a deliverable checklist.
- Allocate time for review.
- Keep presentation claims aligned with verified functionality.
- Assign owners for outstanding academic tasks.

**Trigger:** A required deliverable remains incomplete near the confirmed deadline.

### RISK-015 — Dependency Incompatibility

**Cause:** Runtime or package versions change unexpectedly.

**Potential impact:** Startup failures or runtime regressions.

**Mitigation:**

- Maintain package lock files.
- Document supported runtime versions.
- Review dependency updates.
- Test changes before integration.
- Avoid unplanned upgrades during release preparation.

**Trigger:** Dependency installation or runtime behavior changes after an upgrade.

### RISK-016 — Unsupported Completion Claims

**Cause:** Planned or documented features are described as finished without implementation evidence.

**Potential impact:** Misleading progress reports, failed demonstrations, and academic credibility issues.

**Mitigation:**

- Track implementation separately from documentation.
- Verify features against source code and tests.
- Record actual test results.
- Disclose incomplete features.
- Review presentation claims before submission.

**Trigger:** A feature is listed as complete without demonstrable functionality or supporting evidence.

### RISK-017 — Uploaded File Loss

**Cause:** Files are stored in temporary or non-persistent locations.

**Potential impact:** Missing documents after a restart or redeployment.

**Mitigation:**

- Confirm the storage lifetime.
- Use appropriate persistent storage.
- Back up required files.
- Test restoration and access permissions.

**Trigger:** Uploaded files disappear after a restart or environment replacement.

### RISK-018 — Future AI Scope and Cost

**Cause:** AI-assisted search, recommendations, or translation is introduced without a defined provider, budget, or release scope.

**Potential impact:** Additional cost, privacy concerns, integration complexity, and schedule delays.

**Mitigation:**

- Keep AI capabilities in future scope unless approved.
- Define the required provider and API contract before implementation.
- Assess cost and usage limits.
- Review privacy and data handling.
- Establish fallback behavior for provider outages.

**Trigger:** An AI feature becomes a release dependency without an approved plan.

## 9. Risk Ownership

The project has been discussed as a four-student team:

- Prince Madhesia
- Prince Kumar
- Ritwiz Gupta
- Mukesh Yadav

The owner of each risk must be assigned according to the current team responsibilities.

Recommended ownership rules:

- Assign one accountable owner per risk.
- Identify a reviewer for high and critical risks.
- Escalate risks that affect the release date or security.
- Update ownership when responsibilities change.
- Do not assume that a student owns a risk based only on their name or general technical interests.

## 10. Risk Response Strategies

Choose an appropriate response for each risk.

### Avoid

Change the plan or scope so that the risk no longer applies.

### Mitigate

Reduce the likelihood or impact through preventive controls or additional verification.

### Transfer

Move a defined responsibility or exposure through an approved arrangement, while recognizing that accountability may still remain with the project.

### Accept

Accept the residual risk after documenting the rationale and obtaining appropriate approval.

### Contingency

Define an action to take if the risk occurs, such as restricting access, restoring a compatible revision, or using a verified backup.

## 11. Risk Monitoring

Review the register at appropriate milestones:

- Before starting a major module.
- During API and database integration.
- Before release testing.
- After significant security or schema changes.
- Before deployment or demonstration.
- When a dependency becomes blocked.
- After an incident or failed release.

For each review, update:

- Likelihood and impact.
- Risk score.
- Current status.
- Mitigation progress.
- Owner.
- Evidence.
- Residual risk.
- Next review date.

## 12. Risk Escalation Rules

Escalate a risk when:

- Its score reaches the critical range.
- A serious security weakness is discovered.
- Data integrity may be compromised.
- An essential release workflow is blocked.
- A milestone is likely to be missed.
- The assigned owner cannot resolve the issue.
- The proposed mitigation requires a significant scope or architecture change.

Security and data-integrity issues may require immediate action even when their initial numerical score is lower.

## 13. Risk Review Record

Use this template during each risk review.

| Field | Value |
|---|---|
| Review date | Not recorded |
| Reviewed by | Not assigned |
| Highest-priority risk | Not recorded |
| Newly identified risks | Not recorded |
| Risks escalated | Not recorded |
| Mitigations completed | Not recorded |
| Risks closed | Not recorded |
| Remaining blockers | Not recorded |
| Next review date | Not scheduled |

## 14. Risk Closure Criteria

A risk may be closed when:

- The triggering condition no longer applies, or
- The mitigation has been implemented and verified, and
- The remaining exposure is acceptable, and
- Required approval has been recorded.

A risk should remain open or under monitoring when important uncertainty remains.

## 15. Risk Management Checklist

- [ ] Major technical risks have been identified.
- [ ] Security and data-integrity risks have been assessed.
- [ ] Project schedule and scope risks have been assessed.
- [ ] Important dependencies have been reviewed.
- [ ] High-priority risks have assigned owners.
- [ ] Mitigation actions are documented.
- [ ] Triggers and contingency actions are understood.
- [ ] Risk ratings reflect current evidence.
- [ ] Residual risks are recorded.
- [ ] Significant risks are escalated appropriately.
- [ ] Closed risks have supporting evidence.
- [ ] The register is reviewed before release.

## 16. Related Documentation

- `project-plan.md`
- `dependency-register.md`
- `task-breakdown.md`
- `change-request-log.md`
- `../01-product/roadmap.md`
- `../02-requirements/non-functional-requirements.md`
- `../03-technical/architecture.md`
- `../03-technical/database-design.md`
- `../05-security/security-design.md`
- `../05-security/threat-model.md`
- `../06-development/module-status.md`
- `../07-testing/test-plan.md`
- `../08-deployment/deployment-plan.md`
- `../08-deployment/production-checklist.md`
- `../08-deployment/rollback-plan.md`

## 17. Maintenance

Review this register whenever the project scope, architecture, database design, security controls, team responsibilities, dependencies, or delivery schedule changes.

Risk scores should be updated using current evidence rather than copied indefinitely from the initial assessment.

This document provides a structured risk-management process. It does not establish that the listed risks have occurred, that mitigations are complete, or that the project is risk-free.
