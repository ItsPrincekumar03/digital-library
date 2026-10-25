# Digital Library — Documentation Index

**Project:** Digital Library  
**Project Type:** BTech Final-Year Project  
**Release:** Version 1 (V1)  
**Document:** Documentation Index and Source-of-Truth Guide  
**Status:** Active  

---

## 1. Purpose

This document provides the central index for the Digital Library documentation.

It defines the documentation structure, explains the responsibility of each documentation folder, establishes the source-of-truth rules, and describes how documentation must be maintained.

The purpose is to ensure that developers, testers, project members, and AI coding assistants use consistent and accurate project information.

This index describes where project information belongs. It does not itself prove that a feature has been implemented, tested, or deployed.

---

## 2. Project Technology and Architecture

The approved project technology stack is:

- Frontend: HTML, CSS, and Vanilla JavaScript
- Backend: Node.js and Express.js
- Database: MySQL
- Architecture: Monolithic web application

The existing layered backend architecture must be preserved where applicable:

Route → Controller → Service → Repository → MySQL

The project must not be converted to a microservices architecture or have its technology stack replaced without an approved project decision.

---

## 3. Source-of-Truth Rules

Different sources are authoritative for different types of information.

### 3.1 Current implementation

The current local source code determines the behavior that is actually implemented.

Relevant sources include:

- Frontend HTML, CSS, and JavaScript
- Backend routes and middleware
- Controllers, services, and repositories
- Authentication and authorization logic
- File-upload and PDF-processing implementation
- Application configuration

A feature must not be marked as implemented merely because it appears in a requirements document.

### 3.2 Database structure

The actual database schema and applicable migrations define the implemented database structure.

Primary references:

- `database/schema.sql`
- `database/migrations/`
- Actual database configuration and applied migrations, where available

Database documentation must be reconciled with the actual schema.

### 3.3 Testing and verification

Runnable test scripts and recorded test results are the primary evidence of verification.

Primary references:

- Existing automated tests
- `docs/testing/testing-guide.md`
- `docs/07-testing/`

A planned test is not evidence of a passing test. Test counts must not be treated as passing counts unless the test results demonstrate that outcome.

### 3.4 API contracts

The detailed API documentation is maintained in `docs/api/`.

The actual backend route configuration determines which endpoints exist and which authentication and authorization requirements they enforce.

API documentation must match the implemented routes, request parameters, responses, and error behavior.

### 3.5 Security documentation

The technical security documentation is maintained in `docs/security/`.

The `docs/05-security/` folder contains higher-level security design, risk analysis, and checklist documents.

Security documentation describes intended controls and documented implementation behavior. It does not, by itself, establish that the application is secure.

### 3.6 Product requirements

`docs/01-product/PRD.md` defines the high-level product goals, intended scope, users, and major features.

`docs/02-requirements/SRS.md` defines the software requirements.

`docs/03-technical/TRD.md` defines the technical requirements and implementation constraints.

Approved requirements describe intended behavior. When they conflict with the current implementation, document the discrepancy and resolve it through an approved change rather than silently treating either source as proof of the other.

---

## 4. Documentation Directory Structure

### 4.1 Root documentation

Location: `docs/`

- `DOCUMENTATION-INDEX.md` — Central documentation index and source-of-truth rules.
- `AI-CONTEXT.md` — Project context, technical constraints, and instructions for AI-assisted development.

### 4.2 Product documentation

Location: `docs/01-product/`

- `feature-list.md` — Feature inventory and implementation status.
- `PRD.md` — Product Requirements Document.
- `roadmap.md` — Development roadmap and planned releases.
- `vision-and-scope.md` — Product vision, boundaries, and scope.

### 4.3 Requirements documentation

Location: `docs/02-requirements/`

- `acceptance-criteria.md` — Conditions for accepting requirements and features.
- `functional-requirements.md` — Required system behaviors.
- `non-functional-requirements.md` — Quality attributes and operational constraints.
- `SRS.md` — Software Requirements Specification.
- `use-cases.md` — Actors, goals, and system interactions.

### 4.4 Technical documentation

Location: `docs/03-technical/`

- `api-specification.md` — High-level API contract reference.
- `architecture.md` — System components and their relationships.
- `database-design.md` — Database entities, relationships, constraints, and indexes.
- `integration-design.md` — Integration between frontend, backend, database, and other components.
- `technology-stack.md` — Approved technology stack.
- `TRD.md` — Technical Requirements Document.

### 4.5 Design documentation

Location: `docs/04-design/`

- `design-system.md` — Visual design conventions and reusable interface patterns.
- `navigation-flow.md` — Navigation structure and user journeys.
- `page-specification.md` — Page-level behavior and requirements.
- `UI-UX-specification.md` — User-interface and user-experience requirements.

### 4.6 Security planning documentation

Location: `docs/05-security/`

- `authentication-authorization.md` — Authentication and permission requirements.
- `security-checklist.md` — Security review checklist.
- `security-design.md` — High-level security design.
- `threat-model.md` — Threats, risks, and planned mitigations.

### 4.7 Development documentation

Location: `docs/06-development/`

- `changelog.md` — Chronological record of confirmed changes.
- `codebase-analysis.md` — Analysis of the existing implementation.
- `coding-standards.md` — Project coding conventions.
- `decisions.md` — Approved architectural and technical decisions.
- `development-plan.md` — Development sequence and milestones.
- `git-workflow.md` — Branching, commits, and source-control practices.
- `module-status.md` — Module implementation and verification status.

### 4.8 Testing documentation

Location: `docs/07-testing/`

- `integration-testing.md` — Verification of interactions between components.
- `regression-testing.md` — Checks that existing functionality continues to work.
- `security-testing.md` — Security verification procedures.
- `test-cases.md` — Individual test cases and expected results.
- `testing-strategy.md` — Overall testing approach.
- `test-plan.md` — Test scope, resources, execution, and reporting.

### 4.9 Deployment documentation

Location: `docs/08-deployment/`

- `deployment-plan.md` — Deployment procedure and target environment.
- `environment-setup.md` — Environment and configuration requirements.
- `production-checklist.md` — Production-readiness checks.
- `rollback-plan.md` — Recovery and rollback procedure.

### 4.10 Project management documentation

Location: `docs/09-project-management/`

- `change-request-log.md` — Approved and pending changes.
- `dependency-register.md` — Project dependencies and their implications.
- `project-plan.md` — Project milestones and planned activities.
- `risk-register.md` — Identified project risks and mitigations.
- `task-breakdown.md` — Work items, responsibilities, and dependencies.

### 4.11 Academic documentation

Location: `docs/10-academic/`

- `future-scope.md` — Features and improvements planned beyond the current release.
- `limitations.md` — Known limitations and constraints.
- `methodology.md` — Development and project methodology.
- `objectives.md` — Academic project objectives.
- `project-synopsis.md` — Synopsis of the Digital Library project.

### 4.12 API endpoint documentation

Location: `docs/api/`

- `auth.md` — Authentication endpoints.
- `authors.md` — Author endpoints.
- `books.md` — Book endpoints.
- `categories.md` — Category endpoints.
- `chapters.md` — Chapter endpoints.
- `private-library.md` — Private PDF library endpoints.
- `README.md` — API documentation index and conventions.
- `users.md` — User profile and account endpoints.

### 4.13 Technical security documentation

Location: `docs/security/`

- `authentication.md` — Authentication implementation.
- `authorization.md` — Access control and permissions.
- `content-model.md` — Content visibility and access rules.
- `cors.md` — Cross-Origin Resource Sharing configuration.
- `environment.md` — Environment variables and secret management.
- `error-handling.md` — Application error handling.
- `file-upload-prep.md` — File-upload validation and protection.
- `password-security.md` — Password hashing and password handling.
- `rate-limiting.md` — Request and authentication rate limits.
- `README.md` — Security documentation index.
- `sql-injection.md` — SQL injection prevention.
- `validation.md` — Input validation.
- `xss.md` — Cross-Site Scripting prevention.

### 4.14 Additional testing documentation

Location: `docs/testing/`

- `testing-guide.md` — Practical testing and verification instructions.

---

## 5. Canonical Document Map

The following documents provide the main references for each area.

| Area | Primary reference | Supporting references |
|---|---|---|
| Product scope | `docs/01-product/PRD.md` | `feature-list.md`, `roadmap.md`, `vision-and-scope.md` |
| Software requirements | `docs/02-requirements/SRS.md` | Functional requirements, non-functional requirements, use cases, acceptance criteria |
| Technical design | `docs/03-technical/TRD.md` | Architecture, integration design, technology stack |
| Database | `database/schema.sql` and applicable migrations | `docs/03-technical/database-design.md` |
| API contracts | `docs/api/README.md` and endpoint-specific files | `docs/03-technical/api-specification.md` |
| Technical security | `docs/security/` | `docs/05-security/` |
| Feature status | `docs/06-development/module-status.md` | Feature list, codebase analysis, test evidence |
| Testing | Runnable tests and recorded results | `docs/07-testing/`, `docs/testing/testing-guide.md` |
| Deployment | Actual deployment configuration and environment | `docs/08-deployment/` |
| Academic scope | `docs/10-academic/` | PRD, SRS, and approved project decisions |

Supporting documents must reference their primary documents instead of introducing conflicting definitions.

---

## 6. Feature Status Definitions

Use the following status labels consistently across project documentation.

| Status | Meaning |
|---|---|
| VERIFIED | Implementation and relevant verification evidence have been checked. |
| IMPLEMENTED | Implementation exists, but complete verification or hardening may remain. |
| IN_PROGRESS | Work is actively underway. |
| PLANNED | Approved or intended work has not yet started. |
| FUTURE_SCOPE | Work has been deferred to a later release. |
| BLOCKED | Work cannot proceed because a documented dependency or issue remains unresolved. |

Every status must be supported by current evidence.

Where verification is unavailable, state that the feature has not been verified. Do not infer completion from a document, filename, or earlier conversation.

---

## 7. Version 1 Scope and Future Scope

The approved product requirements define the intended Version 1 scope.

The implemented Version 1 feature set must be established from the current source code, database, and testing evidence.

Features explicitly deferred to future releases must be identified as FUTURE_SCOPE and must not be presented as completed V1 functionality.

The existing product documentation identifies chapter translation and AI-assisted semantic search or recommendations as future-scope items. These classifications must remain consistent across the PRD, SRS, feature list, roadmap, and academic documentation unless an approved scope change is recorded.

Any conflict in feature scope must be documented and resolved before declaring the release ready.

---

## 8. Documentation Maintenance Rules

1. Preserve the approved HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL stack.
2. Preserve the existing monolithic architecture.
3. Verify implementation claims against the current local codebase.
4. Verify database claims against the current schema and applicable migrations.
5. Verify test claims against actual test executions.
6. Do not invent test results, completion dates, historical decisions, or deployment details.
7. Use consistent terminology for users, administrators, books, chapters, publication status, and private PDF documents.
8. Record approved changes in the appropriate project documentation.
9. Update cross-references when a document is renamed or moved.
10. Keep technical implementation details in technical documents and academic summaries focused on their intended purpose.
11. Document known limitations rather than concealing them.
12. Protect credentials, private user information, and environment secrets.
13. Avoid duplicating large sections of canonical documents.
14. Use clear headings, readable tables, and valid Markdown.
15. Review affected documents whenever a requirement, API, database structure, security control, or release scope changes.

---

## 9. Version Control and Change Management

Documentation changes must be reviewed alongside their related implementation changes.

Before committing documentation:

- Inspect the modified files.
- Verify that Markdown formatting is valid.
- Check paths and cross-references.
- Confirm that claims match available evidence.
- Review the Git diff.
- Ensure that no secrets or private user data have been included.

Historical records such as changelogs and decision logs must be based on reliable repository history or confirmed decisions. Missing historical information must not be fabricated.

---

## 10. Release Readiness and Documentation

Documentation completion does not establish that the application is ready for production.

Before a Version 1 launch, relevant checks must cover:

- Integrated frontend and backend behavior
- Database connectivity and integrity
- Authentication and authorization
- Publishing and content visibility
- Private PDF ownership enforcement
- File-upload restrictions
- Reader functionality
- Automated and manual testing
- Production configuration and secret management
- Persistent file storage
- Backup and recovery procedures
- Deployment verification

The result of each check must be recorded as PASS, FAIL, NOT TESTED, or BLOCKED.

A release must not be described as verified when critical checks remain unresolved.

---

## 11. Document Inventory

This index covers the 74 documentation files listed in the current documentation inventory.

The inventory covers the Markdown documentation described in Sections 4.1–4.14. Other files or artifacts present under `docs/` may exist but are not counted as documentation entries.

Update this inventory when documentation files are added, removed, or renamed.

---

## 12. Final Principle

The purpose of the Digital Library documentation is to provide an accurate, consistent, maintainable, and evidence-based description of the project.

Requirements describe intended behavior. Source code describes implemented behavior. Tests provide verification evidence. Deployment records describe the actual deployment state.

These sources must be kept consistent without confusing plans, implementations, tests, and release claims.
