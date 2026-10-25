# Digital Library — Project Methodology

## 1. Introduction

The Digital Library project follows a structured software development methodology to plan, design, implement, test, and maintain a web-based digital library application.

The application is intended to help users discover, manage, organize, and read digital library content through a browser-based interface.

The project uses the approved technology stack:

- **Frontend:** HTML, CSS, and Vanilla JavaScript
- **Backend:** Node.js and Express.js
- **Database:** MySQL
- **Architecture:** Monolithic application
- **Development environment:** Visual Studio Code and supporting development tools
- **Version control:** Git and GitHub

The methodology emphasizes incremental development, modular organization, requirement traceability, testing, documentation, and controlled changes.

This document describes the intended project methodology. It does not independently verify that every activity has already been completed.

## 2. Project Development Approach

The project follows an incremental, module-based development approach.

The application is divided into manageable functional modules. Each module is planned, implemented, tested, documented, and reviewed before being considered complete.

This approach helps the team:

1. Understand project requirements.
2. Identify dependencies between modules.
3. Divide work among team members.
4. Implement features in a manageable sequence.
5. Detect defects earlier.
6. Maintain consistent technical documentation.
7. Track progress toward project objectives.

The exact implementation order may change when technical dependencies, testing results, or approved requirements require adjustments.

## 3. Methodology Phases

### Phase 1: Problem Identification

The first phase identifies the problem that the Digital Library intends to address.

Traditional approaches to managing digital reading material may involve scattered files, limited organization, inconsistent metadata, and difficulty discovering relevant content.

The project aims to provide a centralized web-based system for managing and accessing digital library content.

**Output:** Problem statement and initial project scope.

### Phase 2: Requirement Analysis

Functional and non-functional requirements are identified before implementation.

Functional requirements describe what the application should do, while non-functional requirements describe expected quality attributes and constraints.

Examples of functional requirements include:

- User registration and authentication.
- Book discovery and browsing.
- Category and author management.
- Chapter management where supported.
- Authorized administrative operations.
- Reading supported digital content.

Examples of non-functional requirements include:

- Security.
- Maintainability.
- Usability.
- Reliability.
- Performance.
- Data integrity.

Requirements should be documented with identifiers, priorities, dependencies, and acceptance criteria where appropriate.

**Output:** Requirements specification, feature list, use cases, and acceptance criteria.

### Phase 3: System Analysis and Planning

The requirements are analyzed to determine the system's modules, dependencies, data needs, and implementation sequence.

The team identifies:

- User roles.
- Main application workflows.
- Backend responsibilities.
- Database entities and relationships.
- API boundaries.
- Security requirements.
- Testing requirements.
- Team responsibilities.
- Development milestones.

The project uses a monolithic architecture. Microservices are not part of the approved design.

**Output:** Module plan, development plan, task breakdown, and preliminary architecture.

### Phase 4: System Design

The system design defines how the application components interact.

#### Frontend design

The frontend uses HTML, CSS, and Vanilla JavaScript to provide pages, forms, navigation, search, and reading interfaces.

#### Backend design

The backend uses Node.js and Express.js to process HTTP requests, enforce access controls, validate input, execute application logic, and return responses.

Where applicable, the backend follows this logical flow:

`Route → Middleware → Controller → Service → Repository → MySQL`

Not every request must pass through every layer. The actual codebase should determine the appropriate implementation.

#### Database design

MySQL stores structured application data. Database design should define entities, primary keys, foreign keys, relationships, constraints, and indexes.

The schema should be reviewed for normalization, consistency, and data integrity.

#### Security design

Security planning covers authentication, authorization, input validation, database access, document access, configuration, and error handling.

**Output:** Architecture documentation, database design, API specification, UI specifications, and security design.

### Phase 5: Implementation

Development proceeds module by module according to the approved plan.

A typical implementation cycle is:

1. Review the module requirements.
2. Check dependencies and existing code.
3. Identify files and components affected.
4. Implement the required behavior.
5. Review error handling and security.
6. Run relevant tests.
7. Correct identified defects.
8. Update documentation.
9. Review changes before integration.

The implementation should reuse existing conventions and avoid unnecessary architectural changes.

### Phase 6: Database Implementation

Database implementation includes creating or updating the required tables, relationships, constraints, and indexes.

The team should:

- Review schema changes before applying them.
- Use parameterized queries for database operations.
- Enforce appropriate foreign-key constraints.
- Validate relationships between books, authors, categories, and chapters where applicable.
- Avoid exposing database credentials.
- Maintain a documented approach for schema changes.
- Test important data-integrity rules.

Database modifications should be tested against a suitable development environment before being applied to production data.

**Output:** Database schema, SQL scripts, and verified database operations.

### Phase 7: Testing

Testing evaluates whether implemented features satisfy their requirements.

The project may use several levels of testing.

| Testing level | Purpose |
|---|---|
| Unit testing | Test individual functions or components |
| Integration testing | Verify interactions between components |
| API testing | Verify endpoints, responses, validation, and access controls |
| Database testing | Verify relationships and data integrity |
| Security testing | Check authorization, input handling, and common vulnerabilities |
| Regression testing | Ensure changes do not break existing functionality |
| User-interface testing | Verify navigation, forms, and reading interactions |
| Acceptance testing | Determine whether requirements are satisfied |

Testing should include successful cases, invalid inputs, unauthorized access, missing records, and relevant failure scenarios.

Manual API tests can be performed using PowerShell's `Invoke-RestMethod` or other suitable tools. The chosen testing method should be documented.

A feature should not be marked complete solely because its server starts or one request succeeds.

**Output:** Test cases, execution results, defect records, and acceptance evidence.

### Phase 8: Integration and Version Control

Changes developed by different team members must be integrated carefully.

The project uses Git for version control and GitHub as the remote repository.

The intended workflow includes:

1. Confirm the current branch and working-tree status.
2. Review the relevant module requirements.
3. Make changes in the appropriate files.
4. Run relevant tests.
5. Review the diff for unintended modifications.
6. Commit changes with a descriptive message.
7. Integrate changes according to the agreed team workflow.
8. Push to the remote repository when ready.
9. Verify the resulting repository state.

Team members should coordinate changes to shared files, API contracts, and database structures.

A successful local commit does not prove that changes have been pushed to GitHub.

### Phase 9: Deployment Preparation

Deployment preparation determines whether the application can be configured and run in its target environment.

The process includes:

- Preparing the runtime environment.
- Configuring environment variables.
- Setting up MySQL.
- Applying database schema changes.
- Preparing document storage.
- Configuring security middleware.
- Reviewing CORS and cookie settings where applicable.
- Checking error handling and logging.
- Testing the configured application.
- Preparing backup and recovery procedures.

Production deployment should be performed only after the required checks are completed.

**Output:** Deployment instructions, configuration requirements, and release checklist.

### Phase 10: Documentation and Maintenance

Documentation is maintained throughout development rather than being postponed until the end.

Relevant documents may include:

- Requirements.
- Architecture.
- Database design.
- API specifications.
- Security design.
- Development plans.
- Testing plans.
- Deployment procedures.
- Module status.
- Known limitations.
- Future scope.

Documentation should describe the actual implementation accurately and distinguish verified behavior from planned features.

Maintenance includes defect correction, dependency updates, security reviews, performance improvements, and approved enhancements.

## 4. Module-Based Development Cycle

Each module should follow a repeatable development cycle.

1. **Planning:** Identify objectives, scope, and dependencies.
2. **Analysis:** Review requirements and existing implementation.
3. **Design:** Determine data flow, API changes, and affected components.
4. **Implementation:** Develop the required functionality.
5. **Testing:** Execute relevant test cases.
6. **Review:** Inspect correctness, security, and maintainability.
7. **Integration:** Integrate changes with the project.
8. **Documentation:** Update affected documents.
9. **Status update:** Record evidence-based completion status.

A module should be marked complete only when its agreed acceptance criteria have been met and the necessary evidence is available.

## 5. Team Collaboration Methodology

The project is a four-student group project.

The known team members are:

- Prince Madhesia — team leader.
- Prince Kumar — team member.
- Ritwiz Gupta — team member.
- Mukesh Yadav — team member.

Task allocation should reflect each member's responsibilities, skills, and current workload.

A suggested collaboration process is:

- The team leader coordinates progress and integration.
- Members work on assigned modules.
- Shared requirements and API contracts are agreed before dependent implementation begins.
- Database changes are communicated to affected members.
- Changes are reviewed before integration.
- Blockers and unresolved defects are recorded.
- Final demonstrations are coordinated so that each member can explain their assigned work.

Specific module ownership should be maintained in the project task breakdown rather than assumed from the names above.

## 6. Requirement Traceability

Requirement traceability links each requirement to its implementation and verification evidence.

A traceability record may contain:

| Field | Description |
|---|---|
| Requirement ID | Unique identifier |
| Requirement description | Expected behavior |
| Priority | Relative implementation importance |
| Module | Responsible project module |
| Implementation reference | Relevant files or API endpoints |
| Test case ID | Test used for verification |
| Status | Planned, in progress, implemented, or verified |
| Evidence | Test output or review record |

Traceability helps identify requirements that have not been implemented or tested.

The recorded status must reflect current evidence rather than historical assumptions.

## 7. Change Management

Requirements may change as the project develops.

Each significant change should document:

- Change identifier.
- Description and reason.
- Affected requirements.
- Affected modules and files.
- Database or API impact.
- Security and privacy implications.
- Testing impact.
- Schedule impact.
- Approval status.

Changes should be reviewed before implementation when they affect architecture, database relationships, authentication, authorization, or external integrations.

Use the project change-request log to track significant changes.

## 8. Quality Assurance

Quality assurance activities should be integrated into everyday development.

The team should review:

- Requirement completeness.
- Code organization and naming.
- Error handling.
- Input validation.
- Authorization checks.
- Database query safety.
- Data integrity.
- API response consistency.
- Test coverage.
- Documentation accuracy.
- Compatibility with the approved stack.

Quality checks should be proportionate to the feature's complexity and risk.

## 9. Tools and Technologies

| Tool or technology | Intended purpose |
|---|---|
| HTML | Page structure |
| CSS | Layout, styling, and responsive design |
| Vanilla JavaScript | Frontend behavior |
| Node.js | Backend JavaScript runtime |
| Express.js | HTTP routing and middleware |
| MySQL | Relational data storage |
| Git | Version control |
| GitHub | Remote repository and collaboration |
| Visual Studio Code | Development environment |
| PowerShell | Local development commands and manual API testing |
| Automated test tools | Repeatable verification of implemented behavior |

Tool availability and versions should be confirmed from the current development environment.

## 10. Methodology Deliverables

Expected project deliverables include:

1. Project problem statement.
2. Requirements specification.
3. System architecture.
4. Database design.
5. API documentation.
6. UI and navigation specifications.
7. Security documentation.
8. Source code.
9. Test cases and execution evidence.
10. Deployment instructions.
11. User and administrator workflows.
12. Academic synopsis and project report.
13. Future scope and limitations.
14. Demonstration of verified functionality.

The exact deliverables should be aligned with institutional requirements and the approved project scope.

## 11. Success Criteria

The methodology is considered effective when it supports the team in:

- Delivering the agreed core functionality.
- Maintaining a clear architecture.
- Preserving database integrity.
- Enforcing role-based access controls.
- Verifying implemented behavior through testing.
- Managing changes in a controlled manner.
- Coordinating work among team members.
- Maintaining accurate documentation.
- Demonstrating project functionality with reproducible evidence.

These are evaluation criteria, not a claim that all have already been achieved.

## 12. Conclusion

The Digital Library uses a structured, incremental, module-based development methodology suited to a student software engineering project.

Requirement analysis, design, implementation, testing, integration, deployment preparation, and documentation are treated as connected activities. This approach supports manageable development, team coordination, defect detection, and accurate reporting of project progress.

The methodology remains grounded in the approved HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL stack and the monolithic architecture.

## 13. Related Documentation

- `objectives.md`
- `project-synopsis.md`
- `limitations.md`
- `future-scope.md`
- `../01-product/PRD.md`
- `../02-requirements/SRS.md`
- `../02-requirements/functional-requirements.md`
- `../02-requirements/non-functional-requirements.md`
- `../03-technical/architecture.md`
- `../03-technical/database-design.md`
- `../03-technical/api-specification.md`
- `../06-development/development-plan.md`
- `../06-development/module-status.md`
- `../07-testing/testing-strategy.md`
- `../07-testing/test-plan.md`
- `../08-deployment/deployment-plan.md`
- `../09-project-management/task-breakdown.md`
- `../09-project-management/change-request-log.md`

## 14. Maintenance

Update this document when the development process, approved technology stack, team responsibilities, or project workflow changes.

Record completed activities only when supported by current project evidence.
