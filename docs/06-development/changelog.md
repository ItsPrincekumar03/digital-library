# Digital Library — Changelog

**Document Version:** 1.0  
**Project:** Digital Library  
**Purpose:** Record significant project changes  
**Status:** Active Development Document

---

## 1. Purpose

This changelog records significant changes to the Digital Library project, including features, bug fixes, security improvements, database changes, documentation updates, testing improvements, and deployment-related changes.

Its purpose is to provide a traceable history of project development and help team members understand what changed, why it changed, and which areas may require additional testing.

This document is a changelog template and initial project record. Historical entries must be supported by Git commits, pull requests, test reports, or other project evidence. Do not treat planned changes as completed changes.

---

## 2. Change Categories

Use the following categories when recording project changes.

| Category | Description |
|---|---|
| Added | A new feature or capability was introduced |
| Changed | Existing behavior or implementation was modified |
| Fixed | A defect was corrected |
| Security | A security-related improvement or correction was made |
| Database | Schema, relationships, indexes, or database operations changed |
| Testing | Tests or test infrastructure changed |
| Documentation | Project documentation was created or updated |
| Removed | A feature, dependency, or behavior was removed |
| Deployment | Build, configuration, or deployment behavior changed |
| Refactoring | Internal structure changed without an intended behavior change |

---

## 3. Versioning Policy

The project should use a consistent versioning convention.

A recommended format is:

`MAJOR.MINOR.PATCH`

- **MAJOR:** An incompatible or substantial release change.
- **MINOR:** A release introducing backward-compatible functionality.
- **PATCH:** A backward-compatible bug fix or maintenance release.

The team must agree on the release policy before treating version numbers as official.

Git commit hashes and release tags should be used to connect changelog entries to source-code history.

---

## 4. Initial Project Context

Digital Library is a final-year BTech project intended to provide book discovery, content management, and reading functionality.

The approved technology stack is:

- HTML.
- CSS.
- Vanilla JavaScript.
- Node.js.
- Express.js.
- MySQL.

The architecture is monolithic. Microservices are not part of the approved design.

The documented project scope includes authentication, book and chapter management, categories, role-based access, and reader-related functionality. Private PDF library features and other advanced capabilities must be recorded according to their actual implementation status.

This section describes project context, not a claim that every feature is complete.

---

## 5. Historical Development Record

The following entries summarize development milestones previously reported during project work. They are not a substitute for verified Git history.

### 5.1 Backend Foundation

**Reported area:** Backend setup and authentication foundation.

Work previously described includes:

- Express server setup.
- Environment configuration.
- MySQL connection setup.
- JSON request handling.
- Helmet security middleware.
- CORS configuration.
- Session or authentication-related configuration.
- Global error handling.
- JSON responses for unmatched API routes.
- Health endpoint verification.

**Verification status:** Historical work was reported as completed. Confirm the current source code and Git history before treating every item as currently present.

### 5.2 Book and Chapter Management

**Reported area:** Backend book and chapter workflows.

Files previously identified as changed include:

- `backend/src/controllers/book.controller.js`
- `backend/src/controllers/bookRelations.controller.js`
- `backend/src/controllers/chapter.controller.js`
- `backend/src/repositories/book.repository.js`
- `backend/src/routes/book.routes.js`
- `backend/src/routes/chapter.routes.js`
- `backend/src/services/book.service.js`
- `backend/src/services/bookRelations.service.js`
- `backend/src/services/chapter.service.js`
- `backend/src/validators/book.validator.js`

An additional file previously reported as untracked was:

- `backend/src/utils/bookVisibility.js`

These paths reflect a previously reported repository state. Their current status must be checked in Git.

### 5.3 API Testing

Earlier development notes reported successful manual API operations involving book creation, chapter creation, category relationships, publication-related actions, and user registration and login.

**Verification status:** Historical test success was reported, but current test results and the latest code state must be verified before making release claims.

### 5.4 Frontend Development

Earlier project notes stated that frontend implementation was beginning from an empty state when frontend work was planned.

**Verification status:** This is historical context only. Inspect the current frontend directory to establish its present state.

### 5.5 Documentation Development

The project has been organizing documentation into product requirements, technical design, UI/UX, security, development, testing, deployment, project management, and academic sections.

This changelog should be updated as individual documents and implementation changes are completed.

---

## 6. Changelog Entry Template

Use the following structure for each significant change.

### [Version or Date] — Short Change Title

**Date:** YYYY-MM-DD  
**Category:** Added / Changed / Fixed / Security / Database / Testing / Documentation / Deployment  
**Status:** Planned / In Progress / Completed / Verified  
**Author:** Team member or responsible contributor  
**Related Commit:** Git commit hash, if available  
**Related Issue:** Issue or task identifier, if available

#### Summary

Describe what changed.

#### Reason

Explain the requirement, defect, or maintenance need that motivated the change.

#### Files Affected

List the important files or directories changed.

#### Technical Impact

Describe the effects on APIs, database structures, frontend behavior, security, or deployment.

#### Testing

Record the tests actually executed and their results.

#### Limitations

Record unresolved issues, known risks, or behavior that remains unverified.

---

## 7. Change History

### 7.1 Documentation Structure

**Category:** Documentation  
**Status:** In Progress

The project is organizing technical and product documentation into dedicated directories.

The documentation set includes requirements, architecture, database design, API specifications, design specifications, security guidance, development planning, testing, deployment, and academic project material.

**Verification required:**

- Confirm each expected file exists.
- Confirm its content reflects the current implementation.
- Update the documentation index.
- Review links between related documents.

### 7.2 Technical Requirements Documentation

**Category:** Documentation  
**Status:** In Progress

Technical documentation is being developed for the approved stack, monolithic architecture, API behavior, database access, and implementation constraints.

**Verification required:** Compare the documented design with the current repository and configuration.

### 7.3 Security Documentation

**Category:** Security / Documentation  
**Status:** In Progress

Security documents are being prepared to cover authentication, authorization, secure database access, private resources, file handling, input validation, and threat assessment.

These documents define requirements and review procedures. Their existence does not establish that every security control has been implemented or passed testing.

### 7.4 UI/UX Documentation

**Category:** Documentation  
**Status:** In Progress

Design-system, navigation-flow, page-specification, and UI/UX documents are being prepared to guide frontend consistency and usability.

Proposed visual tokens and page behaviors must be compared with the actual frontend implementation.

---

## 8. Recording Completed Changes

A change may be recorded as completed only when the relevant work has been implemented.

For code changes, the record should include:

1. The requirement or defect addressed.
2. The important files changed.
3. The relevant implementation details.
4. The tests actually executed.
5. The test outcome.
6. Any remaining limitations.
7. The associated commit, where available.

For documentation-only changes, record the documents updated and the reason for the update.

Do not state that tests passed if they were not executed.

---

## 9. Git-Based Change Tracking

Git should be used as the primary source of truth for code-change history.

Useful commands include:

```powershell
git status --short
git log --oneline -10
git diff --stat
git diff --name-only
git tag --list
```

These commands inspect working-tree changes, recent commits, changed files, and release tags.

The changelog should not replace commit history. Instead, it should summarize important changes in a form that team members, reviewers, and academic evaluators can understand.

---

## 10. Release Notes

For each official release, record:

- Release version.
- Release date.
- Major features included.
- Important bug fixes.
- Security-related changes.
- Database changes.
- API compatibility changes.
- Tests executed.
- Known limitations.
- Upgrade or migration requirements.
- Rollback considerations.

Do not create an official release entry until the release has actually been approved and produced.

---

## 11. Database Change Recording

Every significant database change should identify:

- The affected schema or table.
- Added, modified, or removed columns.
- Constraint or index changes.
- Data migration requirements.
- Backward-compatibility implications.
- Tests performed.
- Recovery or rollback considerations.

Database documentation must match the actual SQL schema and migration history.

---

## 12. API Change Recording

For API changes, record:

- Affected endpoint or route.
- HTTP method.
- Request or response changes.
- Authentication and authorization changes.
- Validation changes.
- Status-code changes.
- Compatibility implications.
- Related tests.

Use the actual route configuration and API contract rather than inventing endpoint paths.

---

## 13. Security Change Recording

For security-related changes, record:

- The threat or weakness addressed.
- The affected component.
- The mitigation implemented.
- The tests executed.
- The result of the tests.
- Any remaining risk.

Do not include passwords, live tokens, private keys, or other secrets in changelog entries.

---

## 14. Team Contribution Tracking

For a group project, contributions should be attributed using actual work records.

Recommended evidence includes:

- Git commits.
- Pull requests.
- Reviewed code changes.
- Documentation updates.
- Test reports.
- Approved task records.

Do not assign completed work to a team member without evidence or confirmation.

---

## 15. Current Status Fields

Use the following statuses consistently:

| Status | Meaning |
|---|---|
| Planned | Approved or proposed work has not started |
| In Progress | Work is actively underway |
| Completed | The change has been implemented |
| Verified | Required verification has been performed successfully |
| Blocked | A dependency prevents progress |
| Deferred | Work has intentionally been postponed |
| Reverted | A previous change has been undone |

A change can be completed without being fully verified. Keep those states separate.

---

## 16. Open Changelog Items

The following items should be reviewed before finalizing the project history:

- [ ] Inspect the current Git history.
- [ ] Confirm the current working-tree state.
- [ ] Identify official release tags, if any.
- [ ] Record verified implementation milestones.
- [ ] Record actual frontend progress.
- [ ] Record database schema changes.
- [ ] Record API changes.
- [ ] Record completed security fixes.
- [ ] Record actual testing results.
- [ ] Record deployment changes.
- [ ] Document unresolved defects and limitations.
- [ ] Confirm contributor attribution.

These are documentation tasks, not claims that the items are currently incomplete in the repository.

---

## 17. Related Documents

- `docs/DOCUMENTATION-INDEX.md`
- `docs/AI-CONTEXT.md`
- `docs/01-product/roadmap.md`
- `docs/02-requirements/SRS.md`
- `docs/03-technical/architecture.md`
- `docs/03-technical/database-design.md`
- `docs/03-technical/api-specification.md`
- `docs/03-technical/TRD.md`
- `docs/06-development/codebase-analysis.md`
- `docs/06-development/decisions.md`
- `docs/06-development/development-plan.md`
- `docs/06-development/git-workflow.md`
- `docs/06-development/module-status.md`
- `docs/07-testing/test-plan.md`
- `docs/08-deployment/deployment-plan.md`

---

## 18. Maintenance

Update this changelog whenever a significant code, database, API, security, testing, documentation, or deployment change is completed.

Keep entries concise, traceable, and evidence-based.

The changelog should reflect actual project history rather than intended future work.
