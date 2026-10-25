# Digital Library — Product Roadmap

**Project:** Digital Library  
**Project Type:** BTech Final-Year Software Project  
**Release:** Version 1 (V1) and Future Releases  
**Document Version:** 1.0  
**Status:** Active — roadmap and implementation status are maintained separately

---

## 1. Purpose

This document defines the planned development direction for the Digital Library application.

It describes the intended sequence of development phases, dependencies between major product areas, integration activities, release-readiness requirements, and possible future enhancements.

The roadmap supports:

- Development planning.
- Feature prioritization.
- Module sequencing.
- Dependency management.
- Integration planning.
- Testing and verification.
- Release planning.
- Academic project tracking.
- Future product evolution.

This document describes the planned direction of development. It does not prove that a feature has been implemented, tested, or completed.

Actual implementation status must be determined from the current local codebase, database structure, applicable test evidence, and `docs/06-development/module-status.md`.

---

## 2. Roadmap Principles

The Digital Library roadmap follows these principles:

1. Build the foundation before integrating dependent features.
2. Preserve the approved technology stack.
3. Preserve the monolithic application architecture.
4. Develop the application incrementally.
5. Verify module behavior before relying on it in integrated workflows.
6. Treat authentication, authorization, and private-file access as core requirements.
7. Separate shared catalogue content from users' private PDF documents.
8. Avoid uncontrolled expansion of Version 1 scope.
9. Record important approved technical and product decisions.
10. Verify implementation before reporting a feature as complete.
11. Plan releases around evidence-based acceptance criteria.
12. Keep future enhancements separate from the required Version 1 release.

---

## 3. Product Development Direction

The planned development sequence is:

1. Project foundation and requirements.
2. Database design and backend configuration.
3. Authentication, user management, and authorization.
4. Core library catalogue management.
5. Author, category, book, and chapter relationships.
6. Publishing and content-visibility workflows.
7. Book discovery and catalogue integration.
8. Frontend and backend integration.
9. Online reader and reading customization.
10. Private PDF library and PDF processing.
11. Text-to-speech and related reader controls.
12. Integrated testing and regression verification.
13. Security review and reliability improvements.
14. Documentation and release preparation.
15. Staging deployment and release verification.
16. Future enhancements after Version 1.

This sequence represents the intended development direction. The actual order of completed work may differ and must be recorded using verified project evidence.

---

## 4. Phase 1 — Foundation and Requirements

### Purpose

Establish the project's technical foundation, approved scope, and development rules.

### Planned activities

- Confirm the product requirements.
- Define user roles and their permissions.
- Establish the approved technology stack.
- Define the monolithic application architecture.
- Plan the database entities and relationships.
- Establish source-code organization and development conventions.
- Define initial security and testing expectations.
- Organize project documentation.

### Expected outcomes

- Approved product scope.
- Software and technical requirements.
- Agreed system architecture.
- Initial database design.
- Development and verification approach.

### Completion criteria

The project requirements and technical decisions are documented consistently, with unresolved decisions identified rather than assumed.

---

## 5. Phase 2 — Database and Backend Foundation

### Purpose

Establish the server-side foundation and database access required by the application.

### Planned activities

- Configure the Node.js and Express.js application.
- Configure environment variables.
- Establish MySQL connectivity.
- Maintain the approved database schema and migrations.
- Configure middleware and structured error handling.
- Establish the existing route, controller, service, and repository structure where applicable.
- Implement the health endpoint and essential server behavior.
- Configure baseline input validation and security middleware.

### Expected outcomes

- A functioning backend foundation.
- Database connectivity.
- Consistent request and error handling.
- A structure that supports the project's core modules.

### Completion criteria

The backend starts with the intended configuration, database operations behave as expected, and the relevant foundation tests pass.

---

## 6. Phase 3 — Authentication and Authorization

### Purpose

Provide account management and enforce appropriate access permissions.

### Planned activities

- Implement or maintain user registration.
- Implement login and logout.
- Verify authenticated-user identity.
- Support permitted profile operations.
- Support password changes with appropriate verification.
- Enforce USER and ADMIN role separation.
- Protect restricted routes.
- Apply appropriate authentication rate limits.
- Ensure that users cannot assign themselves administrative privileges.

### Expected outcomes

- Authentication functionality.
- Server-side access control.
- Protected administrative operations.
- A documented authentication and authorization model.

### Completion criteria

Positive and negative tests demonstrate that valid operations succeed and unauthorized operations are denied.

The existing authentication limitations must remain documented until a verified improvement addresses them.

---

## 7. Phase 4 — Core Library Catalogue

### Purpose

Provide the structured library-management functionality.

### Planned activities

- Implement or maintain book management.
- Implement or maintain author management.
- Implement or maintain category management.
- Implement or maintain chapter management.
- Establish book-author relationships.
- Establish book-category relationships.
- Support chapter ordering where implemented.
- Apply the required validation and database constraints.

### Expected outcomes

- Structured catalogue records.
- Relationships between books, authors, and categories.
- Chapter records associated with books.
- Consistent catalogue-management operations.

### Completion criteria

The relevant operations work correctly, relationships remain consistent, and authorization and validation behavior are verified.

---

## 8. Phase 5 — Publishing and Content Visibility

### Purpose

Control when library content becomes available to users.

### Planned activities

- Implement the supported publishing workflow.
- Manage publication and archival status.
- Enforce content-visibility rules.
- Restrict administrative operations to authorized roles.
- Prevent unauthorized access to unpublished or restricted content.
- Handle invalid state transitions and missing resources appropriately.

### Expected outcomes

- A controlled content-management workflow.
- Consistent publication rules.
- Appropriate visibility for different user roles.

### Completion criteria

Tests verify both permitted publishing operations and denied access to restricted content.

Actual route behavior and API documentation must agree on authentication and visibility requirements.

---

## 9. Phase 6 — Book Discovery and Catalogue Integration

### Purpose

Help users find and access available library content.

### Planned activities

- Integrate paginated book browsing.
- Display accessible book information.
- Present author and category associations.
- Provide navigation to available chapters.
- Implement and verify supported search and filtering behavior.
- Handle loading, empty, and error states.
- Ensure that results and pagination represent the intended dataset.

### Expected outcomes

- An integrated book-discovery experience.
- Correct catalogue navigation.
- Consistent search and filtering behavior where implemented.

### Completion criteria

Catalogue pages and backend APIs behave consistently, and the frontend does not display misleading or incomplete results as though they represent the entire catalogue.

The actual authentication requirements for browsing must follow the approved product decision and match the backend and frontend implementation.

---

## 10. Phase 7 — Frontend and Backend Integration

### Purpose

Connect the application interface to the actual backend functionality.

### Planned activities

- Integrate the authentication interface with the backend.
- Connect catalogue pages to implemented APIs.
- Integrate profile and account-management features.
- Connect administrative interfaces to authorized operations.
- Implement appropriate loading and error states.
- Handle expired authentication and denied requests.
- Verify API URLs, response formats, and cross-origin configuration where applicable.

### Expected outcomes

- Functional communication between the frontend and backend.
- Consistent application behavior across connected features.
- Clear feedback when operations succeed or fail.

### Completion criteria

Core user workflows have been tested through the actual interface and backend rather than solely through isolated API calls.

---

## 11. Phase 8 — Online Reader and Customization

### Purpose

Provide a convenient reading experience for accessible library content.

### Planned activities

- Integrate book and chapter retrieval.
- Display chapter content.
- Support chapter selection and navigation.
- Implement supported reader themes.
- Implement supported font and layout controls.
- Integrate auto-scroll where implemented.
- Support reading-progress and resume behavior where implemented.
- Handle missing chapters and content-loading failures.

### Expected outcomes

- An integrated online reading interface.
- Functional chapter navigation.
- Reader customization where implemented.
- Appropriate handling of reading errors.

### Completion criteria

Users can read permitted content, navigate available chapters, and use the implemented reader controls without bypassing authorization rules.

---

## 12. Phase 9 — Private PDF Library and Processing

### Purpose

Provide registered users with a separate area for personal PDF documents.

### Planned activities

- Implement or maintain private PDF upload.
- Validate file size and permitted file type.
- Store documents using safe filenames and paths.
- Process supported PDFs using the existing PDF-processing implementation.
- List users' own documents.
- Support authorized file retrieval and deletion.
- Enforce ownership checks on every private-file operation.
- Handle missing, invalid, and corrupted documents.
- Verify that private files are not exposed through unrestricted static-file routes.

### Expected outcomes

- Private document management.
- Controlled access to personal PDF files.
- Integrated document processing and reading where implemented.

### Completion criteria

Tests demonstrate that authorized users can manage their own documents and cannot access or delete another user's private files.

Deployment must use storage suitable for the target environment and preserve required files across restarts or redeployments.

OCR for scanned PDFs is a potential future enhancement, not a confirmed Version 1 capability.

---

## 13. Phase 10 — Text-to-Speech and Reader Enhancements

### Purpose

Provide audio support for users reading supported digital content.

### Planned activities

- Integrate browser-based text-to-speech.
- Verify play, pause, resume, and stop behavior.
- Verify available speed controls.
- Verify pitch and voice selection where supported.
- Handle changes between chapters.
- Avoid duplicate or stale speech queues.
- Test long chapter content.
- Handle unavailable speech services or browser capabilities gracefully.

### Expected outcomes

- Text-to-speech functionality where supported.
- Consistent reader behavior.
- Graceful handling of unsupported or unavailable audio capabilities.

### Completion criteria

The implemented controls behave as expected in the supported test environments, and normal text reading remains available if speech functionality fails.

---

## 14. Phase 11 — Integrated Testing and Regression Verification

### Purpose

Verify that the integrated application behaves correctly across its major workflows.

### Planned activities

- Run the existing automated test suites.
- Test authentication and authorization.
- Test catalogue operations.
- Test publishing and visibility rules.
- Test frontend and backend integration.
- Test private PDF upload and ownership enforcement.
- Test reader behavior and implemented speech controls.
- Verify input validation and error handling.
- Run regression tests after fixes.
- Record actual results and unresolved failures.

### Expected outcomes

- Recorded test execution results.
- A documented list of defects and resolutions.
- Evidence for the features included in the release.

### Completion criteria

Required tests have documented outcomes. Critical and high-priority defects must be resolved or explicitly assessed before release.

Planned tests and historical test counts must not be reported as proof that all tests currently pass.

---

## 15. Phase 12 — Security and Reliability Review

### Purpose

Review whether the integrated application protects accounts, documents, and restricted content appropriately.

### Planned activities

- Review authentication and authorization.
- Verify private-file ownership checks.
- Verify parameterized SQL usage.
- Review input validation and safe rendering of untrusted content.
- Review file-upload restrictions.
- Review environment variables and secret management.
- Review CORS and security-header configuration.
- Review rate limiting and error handling.
- Confirm that sensitive information is not exposed in errors or logs.
- Review data backup and recovery arrangements before public deployment.

### Expected outcomes

- Recorded security findings.
- Verified security controls.
- Documented limitations and remaining remediation work.

### Completion criteria

No known critical or high-priority security blocker remains for the proposed release, and any accepted limitations are documented.

A security checklist is not a substitute for actual verification.

---

## 16. Phase 13 — Documentation and Release Preparation

### Purpose

Ensure that project documentation accurately reflects the implemented system.

### Planned activities

- Reconcile the PRD and SRS with approved scope.
- Update the feature inventory.
- Verify architecture and database documentation.
- Align API specifications with implemented endpoints.
- Update the module-status record.
- Document current testing results.
- Record known limitations.
- Prepare deployment and recovery instructions.
- Review academic documentation for consistency.

### Expected outcomes

- Consistent product and technical documentation.
- Evidence-based feature status.
- Documented release requirements and limitations.

### Completion criteria

Important project documents agree with the current implementation and approved requirements. Missing historical facts must not be invented to complete templates.

---

## 17. Phase 14 — Staging Deployment and Release Verification

### Purpose

Verify the application in a deployment environment before public release.

### Planned activities

- Prepare the staging configuration.
- Configure the application and MySQL database.
- Configure environment variables and secrets.
- Configure HTTPS and appropriate CORS settings.
- Configure persistent storage for uploaded documents.
- Verify server startup and health checks.
- Test frontend-to-backend communication.
- Run representative end-to-end workflows.
- Verify private-document access restrictions.
- Verify that required database records and files persist across restarts.
- Prepare backup and rollback procedures.

### Expected outcomes

- A staging deployment where configuration and access are available.
- A documented staging acceptance report.
- A list of any production-specific blockers.

### Completion criteria

Staging functionality and deployment assumptions are verified. A successful local health check alone is not sufficient.

Public release requires a separate decision based on test results, security, persistence, backup, and deployment readiness.

---

## 18. Version 1 Release Criteria

Version 1 may be considered ready for release only after the applicable approved scope has been integrated and verified.

Release evaluation must include:

- Required authentication and account-management workflows.
- Role-based authorization.
- Catalogue and publishing operations.
- Content-visibility enforcement.
- Frontend and backend integration.
- Online reading and implemented reader controls.
- Private PDF management and ownership enforcement.
- Actual automated and manual test results.
- Security and configuration review.
- Persistent file storage.
- Database backup and recovery planning.
- Deployment verification.
- Consistent project documentation.

The final release decision must be based on evidence and remaining risks, not the number of completed modules or documentation files.

The current release status must be recorded in `docs/06-development/module-status.md` and the relevant testing and deployment records.

---

## 19. Future Roadmap

The following capabilities are identified as future-scope items in the existing product feature inventory.

| Future capability | Intended direction |
|---|---|
| Refresh-token workflow | Review session-renewal requirements and security implications. |
| Chapter translation | Evaluate translation requirements, supported languages, and safe integration. |
| AI-assisted semantic search | Evaluate semantic retrieval needs and suitable implementation approaches. |
| AI-assisted recommendations | Evaluate relevant book-discovery and recommendation capabilities. |

Other possible enhancements may include improved accessibility, usability, personalization, and OCR support for scanned PDFs.

Each future capability requires a separate scope decision, dependency assessment, implementation plan, and testing strategy.

Future features must not be treated as mandatory V1 work unless the approved product scope changes.

---

## 20. Dependencies and Risk Considerations

The roadmap depends on accurate information about the current implementation and environment.

Important dependencies and risks include:

- Database-schema and application compatibility.
- Correct authentication and authorization.
- Accurate API documentation.
- Frontend and backend integration.
- Safe private-file storage and retrieval.
- Browser compatibility for text-to-speech.
- Availability of the required local and deployment configuration.
- Test coverage for critical workflows.
- Reliable backup and restoration procedures.
- Changes that affect existing users or stored documents.

Dependencies and risks should be recorded in:

- `docs/09-project-management/dependency-register.md`
- `docs/09-project-management/risk-register.md`

The roadmap should be revised when a dependency, approved requirement, or verified implementation constraint changes.

---

## 21. Tracking and Maintenance

The roadmap defines intended development direction. The module-status document records actual module progress.

Use the following documents together:

- `docs/01-product/PRD.md`
- `docs/01-product/feature-list.md`
- `docs/01-product/vision-and-scope.md`
- `docs/02-requirements/SRS.md`
- `docs/03-technical/TRD.md`
- `docs/06-development/module-status.md`
- `docs/06-development/development-plan.md`
- `docs/07-testing/test-plan.md`
- `docs/08-deployment/deployment-plan.md`
- `docs/08-deployment/production-checklist.md`

Update the roadmap when approved scope, dependencies, or release sequencing changes.

Record completion only when supported by implementation and verification evidence.

Do not invent milestone dates, historical events, or release completion claims.

---

## 22. Summary

The Digital Library roadmap establishes a planned progression from foundational requirements and backend development through catalogue management, reading features, testing, security review, documentation, and staging deployment.

The roadmap preserves the approved HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL stack and the monolithic architecture.

It separates planned activities from verified completion and keeps refresh-token functionality, chapter translation, AI-assisted semantic search, and AI recommendations in future scope according to the existing feature inventory.

The actual development status and release readiness must be determined from the local implementation, test evidence, approved decisions, and deployment verification.
