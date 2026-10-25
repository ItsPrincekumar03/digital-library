# Digital Library — Project Limitations

## 1. Introduction

The Digital Library is a web-based application intended to help users discover, manage, organize, and read digital library content.

Like other software projects, the Digital Library has limitations arising from its current scope, technology choices, available development time, external dependencies, and testing environment.

This document records known or anticipated limitations that should be considered during development, testing, academic evaluation, and future enhancement planning.

**Important:** The limitations listed below describe potential constraints and areas requiring verification. They must not be interpreted as proof that a particular defect exists in the current implementation.

## 2. Technology Limitations

### 2.1 Frontend technology

The approved frontend stack consists of HTML, CSS, and Vanilla JavaScript.

Potential limitations include:

- Complex interactive interfaces may require additional custom JavaScript.
- Reusable interface components must be maintained through project conventions.
- Large frontend features may become harder to maintain without clear separation of responsibilities.
- Browser differences may affect some reading and media features.

These limitations can be managed through modular JavaScript files, consistent naming, reusable functions, and frontend testing.

### 2.2 Backend technology

The backend uses Node.js and Express.js.

Potential limitations include:

- Poorly designed synchronous or CPU-intensive operations can affect request responsiveness.
- Long-running document-processing tasks may require resource management.
- Incorrect error handling can result in failed requests or unclear messages.
- Application performance depends on database queries, file operations, and external services.

The backend should use asynchronous operations where appropriate, centralized error handling, and suitable request limits.

### 2.3 Database technology

MySQL is the planned relational database technology.

Potential limitations include:

- Complex queries may become slower as the dataset grows.
- Incorrect indexes can affect query performance.
- Database availability is necessary for operations that depend on stored records.
- Schema changes require careful migration and compatibility planning.

Database indexes, constraints, query optimization, backups, and migration procedures should be reviewed as the project develops.

### 2.4 Monolithic architecture

The project uses a monolithic architecture rather than a microservices architecture.

Potential limitations include:

- Application components share a common deployment boundary.
- A deployment can affect multiple application features.
- Poorly separated modules can increase maintenance difficulty.
- Resource-intensive operations may compete with ordinary application requests.

A modular monolith remains appropriate for the project's current scope. Clear boundaries between routes, middleware, controllers, services, repositories, and database access can improve maintainability without introducing microservices.

## 3. Functional Limitations

### 3.1 Book and content management

Book management depends on the functionality implemented in the current release.

Potential limitations include:

- Advanced bulk-import workflows may not be available.
- Metadata quality may depend on information supplied by content contributors.
- Duplicate detection may require additional rules.
- Large collections may need improved search, filtering, and pagination.

Only features confirmed by implementation and testing should be presented as completed.

### 3.2 Search and discovery

Search results depend on the implemented search rules and available metadata.

Potential limitations include:

- Keyword search may not understand a user's intended meaning.
- Misspellings and synonyms may reduce result relevance.
- Search quality depends on consistent book and author metadata.
- Advanced semantic search may require additional indexing or an external AI service.

AI-assisted semantic search and advanced recommendations are future possibilities unless verified as implemented.

### 3.3 Reading functionality

The reading experience depends on the supported document format, browser capabilities, and reader implementation.

Potential limitations include:

- Large documents may take longer to load or render.
- Document formatting may vary.
- Reading progress and bookmarks require appropriate persistence mechanisms.
- Browser-specific behavior may affect reader controls.

These limitations should be assessed using representative documents and supported browsers.

### 3.4 Text-to-speech

The project has discussed browser-based speech synthesis.

Potential limitations include:

- Available voices differ between operating systems and browsers.
- Some languages or voices may not be available.
- Pronunciation and pacing may vary.
- Speech controls may behave differently across browsers.
- Pitch and playback-rate support may vary by voice and browser.

A playback speed of up to 4x and pitch adjustment should be described as supported only after verification in the actual implementation and target browsers.

### 3.5 Offline access

Offline access depends on the functionality implemented in the release.

Potential limitations include:

- A web application may require a network connection for server-backed operations.
- Private documents may not be available offline.
- Browser storage has capacity and lifecycle constraints.
- Synchronization between offline and online changes requires conflict-handling rules.

Offline access and installable Progressive Web App capabilities should be treated as future enhancements unless implemented and tested.

## 4. Security and Privacy Limitations

Security depends on the actual implementation, configuration, deployment environment, and operational practices.

Areas requiring ongoing verification include:

- Authentication and token lifecycle management.
- Authorization for user and administrator operations.
- Ownership checks for private content.
- Input validation and parameterized database queries.
- Password hashing and credential handling.
- File-upload validation and storage controls.
- Request rate limiting.
- Cross-origin configuration.
- Secret management.
- Logging and error responses.
- Dependency updates and vulnerability assessment.

The presence of a security-related library does not by itself prove that the application is secure.

A successful test of one endpoint does not establish that every endpoint is protected. Security claims should be supported by implementation review and relevant test evidence.

## 5. File and Document Limitations

Document processing introduces constraints related to file size, file type, parsing, rendering, and storage.

Potential limitations include:

- Very large files may consume substantial memory or processing time.
- Incorrect or corrupted files may fail to render.
- MIME types and file extensions cannot independently establish that a file is safe.
- Scanned PDFs may contain images rather than selectable text.
- Text extraction quality may vary by document structure.
- File storage requires suitable access controls, capacity management, and backup procedures.

OCR support is not assumed to be part of the current version. If introduced, it will require separate evaluation and testing.

File-upload and document-access controls should be verified before the application is used with sensitive or untrusted content.

## 6. AI and External-Service Limitations

Potential future AI features may depend on third-party cloud services.

Possible limitations include:

- API costs and usage quotas.
- Network latency and service outages.
- Model-generated inaccuracies.
- Provider-specific request and response limits.
- Privacy and copyright considerations.
- Changes to provider APIs or pricing.
- Dependence on valid API credentials.

AI features should not be assumed to be available in the current release unless verified.

The application should handle external-service failures gracefully and keep API credentials on the backend rather than exposing them in frontend JavaScript.

## 7. Performance and Scalability Limitations

Application performance depends on hardware, hosting configuration, database size, query design, file sizes, and concurrent activity.

Potential limitations include:

- Response times may increase with larger datasets.
- PDF rendering can be resource-intensive.
- Inefficient queries may increase database load.
- Large uploads can consume disk space and memory.
- High concurrent traffic may exceed available resources.

Performance should be evaluated using representative data and measured workloads. Scalability claims should be based on test results rather than assumptions.

## 8. Compatibility Limitations

The application may behave differently across supported browsers, operating systems, and screen sizes.

Potential differences include:

- Speech synthesis voices and controls.
- PDF rendering behavior.
- Responsive layout.
- Keyboard navigation.
- Browser storage behavior.
- File download and upload handling.

A defined browser-support policy and compatibility test matrix should be established before a production release.

## 9. Data and Content Limitations

The usefulness of a digital library depends on the accuracy, completeness, and quality of its content.

Potential limitations include:

- Incomplete book metadata.
- Incorrect author or category associations.
- Duplicate records.
- Missing chapters or document files.
- Inconsistent naming conventions.
- Content that is unavailable or no longer accessible.

Content validation, duplicate checks, and administrative review can reduce these issues.

Users and administrators must have appropriate permissions for the content they upload or manage. The project should respect applicable copyright and licensing requirements.

## 10. Testing Limitations

Testing provides evidence about specific behaviors under particular conditions; it cannot prove the absence of every defect.

Potential limitations include:

- Tests may not cover every input combination.
- Manual testing may miss uncommon failures.
- Test data may not represent production-scale datasets.
- Browser and device coverage may be incomplete.
- External-service failures may not be fully simulated.
- Performance and security testing may require separate tools and environments.

Test reports should identify the tested build, test environment, scenarios, results, and known gaps.

Statements such as "all tests passed" must be tied to a specific test run and its scope.

## 11. Deployment and Operational Limitations

Deployment introduces requirements beyond successful local development.

Potential limitations include:

- Local configuration may differ from production configuration.
- Database credentials and environment variables require secure management.
- Persistent file storage and backups must be configured.
- Production errors need appropriate monitoring.
- Database migrations must be managed safely.
- Recovery procedures require testing.

A successful local run does not by itself prove that the application is production-ready.

## 12. Academic Project Constraints

As a BTech final-year project, development may be constrained by:

- Available implementation time.
- Team members' skills and responsibilities.
- Access to suitable testing devices and environments.
- Available hosting and external-service budgets.
- The need to prioritize essential features.
- Academic submission and demonstration deadlines.

These constraints may require some advanced features to be deferred to later versions.

Project documentation and demonstrations should distinguish completed work from planned functionality.

## 13. Mitigation Strategies

| Limitation area | Suggested mitigation |
|---|---|
| Complex frontend behavior | Use clear JavaScript modules and reusable functions |
| Database performance | Review query plans, indexes, and pagination |
| Authentication and authorization | Test protected routes and ownership rules |
| Document processing | Enforce upload limits and handle parsing failures |
| Browser differences | Test supported browsers and document known differences |
| AI service dependency | Add timeouts, error handling, and graceful fallbacks |
| Incomplete test coverage | Maintain a test plan and track uncovered scenarios |
| Deployment differences | Use documented environment configuration |
| Content quality | Validate metadata and provide review workflows |
| Scope limitations | Prioritize features and maintain a change log |

## 14. Known Issues Versus Potential Limitations

This document is not a verified defect list.

A limitation should be recorded as a known issue only when supported by reproducible evidence, such as:

- A failed test case.
- A confirmed implementation gap.
- A reproducible error.
- A documented browser incompatibility.
- A measured performance problem.
- An approved requirement that has not been implemented.

For each confirmed issue, record its description, impact, reproduction steps, affected version, priority, and planned resolution.

Potential limitations should remain clearly identified as areas for evaluation until evidence confirms them.

## 15. Conclusion

The Digital Library has opportunities for improvement in usability, search, document handling, security, performance, compatibility, and future AI-assisted features.

These limitations do not necessarily prevent the application from meeting its intended academic objectives. They identify areas that require verification, careful design, and possible future enhancement.

The project should continue to use its approved technology stack and monolithic architecture unless a documented and approved change establishes otherwise.

All claims about current functionality, security, test coverage, and production readiness must be supported by evidence from the relevant implementation and environment.

## 16. Related Documentation

- `../01-product/feature-list.md`
- `../01-product/roadmap.md`
- `../01-product/future-scope.md`
- `../02-requirements/functional-requirements.md`
- `../02-requirements/non-functional-requirements.md`
- `../02-requirements/acceptance-criteria.md`
- `../03-technical/architecture.md`
- `../03-technical/database-design.md`
- `../05-security/security-design.md`
- `../06-development/module-status.md`
- `../07-testing/testing-strategy.md`
- `../07-testing/test-plan.md`
- `../08-deployment/production-checklist.md`
- `../09-project-management/risk-register.md`
- `future-scope.md`

## 17. Maintenance

Review this document when requirements change, new limitations are discovered, test evidence becomes available, or a new release is prepared.

Update statements about known issues only when supported by current evidence. Keep proposed improvements separate from verified implementation status.
