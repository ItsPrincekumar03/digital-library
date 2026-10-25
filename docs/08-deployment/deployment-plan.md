# Digital Library — Deployment Plan

## 1. Purpose

This document defines the deployment approach for the Digital Library project, including environment preparation, application configuration, database setup, release validation, deployment responsibilities, rollback considerations, and post-deployment checks.

This plan describes the intended deployment process. Actual deployment status must be supported by evidence from the target environment.

## 2. Project Overview

Digital Library is a BTech final-year web application designed to support digital book management and reading.

### 2.1 Approved technology stack

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js and Express.js
- Database: MySQL
- Architecture: Monolithic web application

Microservices are not part of the approved architecture.

### 2.2 Application components

The repository has been organized around these areas:

- `frontend/` — browser-facing application files.
- `backend/` — Node.js and Express.js application.
- `database/` — database scripts and schema documentation, where present.
- `tests/` — automated or manual testing resources, where present.
- `docs/` — project documentation.
- `uploads/` — file storage area, subject to the actual implementation and deployment design.

Confirm the current repository structure before deployment. Do not assume every directory contains completed implementation.

## 3. Deployment Objectives

The deployment process aims to:

1. Install the application in a controlled environment.
2. Configure environment-specific settings safely.
3. Establish database connectivity.
4. Apply the correct database schema and migrations, if available.
5. Start the application using a documented process.
6. Verify critical application workflows.
7. Protect credentials and uploaded content.
8. Provide a documented rollback procedure.
9. Record the deployed version and outstanding risks.

## 4. Deployment Environments

### 4.1 Development

Used for active implementation, debugging, and developer testing.

Typical characteristics:

- Local Node.js runtime.
- Development MySQL database.
- Non-production test accounts.
- Development-specific environment variables.
- Debugging tools enabled only as appropriate.

### 4.2 Testing or staging

Used to validate an integrated release before deployment to its final target.

Recommended characteristics:

- Configuration similar to the target environment.
- Separate database and test data.
- Restricted administrative access.
- Testable logging and error handling.
- No dependency on production credentials.

### 4.3 Production or demonstration environment

Used for the approved live demonstration or release.

The exact hosting provider and operating environment must be selected and documented before deployment. A college demonstration server, virtual private server, cloud platform, or local demonstration machine may have different requirements.

Do not describe the application as deployed to production until the target environment has been identified and deployment has been verified.

## 5. Deployment Prerequisites

Before deployment, confirm the following:

- [ ] The release scope has been approved.
- [ ] The required source code is available.
- [ ] The release branch or commit is recorded.
- [ ] Node.js compatibility has been checked.
- [ ] Dependency installation has been verified.
- [ ] The MySQL server is available.
- [ ] Database schema scripts or migrations are identified.
- [ ] Required environment variables are documented.
- [ ] Secrets are stored outside version control.
- [ ] Upload and storage paths are configured.
- [ ] Required tests have been executed.
- [ ] Known defects and limitations are documented.
- [ ] A backup and rollback approach is available.
- [ ] The target environment has sufficient resources.

## 6. Source Code Preparation

Use the intended repository and approved release commit.

Repository:

`https://github.com/ItsPrincekumar03/digital-library.git`

From the project root, inspect the current Git state:

```powershell
git status
git branch --show-current
git log -1 --oneline
```

Review any uncommitted changes before creating a release.

If a clean release checkout is required, use a separate working directory rather than discarding existing work.

Do not deploy unreviewed local changes unintentionally.

## 7. Dependency Installation

Install dependencies from the relevant package manifest.

For the backend, if `backend/package.json` exists:

```powershell
Set-Location .\backend
npm ci
```

`npm ci` requires a compatible lock file. If the repository does not contain the required lock file, inspect the project's dependency-management process before choosing another installation command.

Do not update dependencies as part of a routine deployment unless the change has been reviewed and tested.

Record the runtime and dependency versions used for the release.

## 8. Environment Configuration

Create environment-specific configuration using the variables required by the actual implementation.

Potential settings include:

| Setting | Purpose |
|---|---|
| `NODE_ENV` | Runtime environment |
| `PORT` | Application listening port |
| Database host | MySQL server address |
| Database port | MySQL connection port |
| Database name | Target database |
| Database user | Application database account |
| Database password | Secret for database access |
| Authentication secret | Secret used by the implemented authentication mechanism |
| Frontend origin | Allowed browser origin, if configured |
| Upload directory | Storage location, if supported |

These are examples, not confirmation that the application uses these exact variable names.

Use the project's actual environment-variable names and validation rules.

### Configuration rules

1. Never commit real secrets or production `.env` files.
2. Use separate credentials for development and deployment.
3. Use a database account with only the required privileges.
4. Do not enable verbose error output in a public environment.
5. Keep authentication secrets strong and private.
6. Configure browser origins explicitly.
7. Ensure persistent storage is available where required.
8. Validate configuration before starting the application.

## 9. Database Deployment

MySQL must be configured before the application depends on it.

### 9.1 Preparation

- Confirm the target database and server.
- Review the current schema and migration scripts.
- Back up existing data when applicable.
- Verify database account permissions.
- Confirm character set and collation requirements.
- Check foreign keys, indexes, and constraints.
- Confirm that the application can connect using the deployment configuration.

### 9.2 Schema changes

Apply reviewed schema changes using the project's actual database scripts or migration tooling.

Do not invent migration commands or execute unreviewed SQL against an existing database.

For an existing database, assess whether the change is backward-compatible and whether a backup or maintenance window is required.

### 9.3 Data safety

- Never use destructive test data in a live database.
- Avoid manually deleting records to resolve deployment issues.
- Keep backup files protected.
- Confirm that restore instructions are documented.
- Verify critical relationships after schema changes.

## 10. Backend Deployment

The backend is responsible for processing API requests, applying business rules, and interacting with MySQL.

Recommended deployment sequence:

1. Obtain the approved source revision.
2. Install the required Node.js dependencies.
3. Configure environment variables.
4. Verify database connectivity.
5. Apply reviewed schema changes.
6. Run the required test suite.
7. Start the server using the project's documented command.
8. Confirm the expected listening port.
9. Check logs for startup errors.
10. Execute the available health-check endpoint, if implemented.
11. Test authentication and a small set of core API workflows.

Use the actual start script in `backend/package.json`. Do not assume a script name or endpoint path without inspecting the project.

## 11. Frontend Deployment

The frontend uses HTML, CSS, and Vanilla JavaScript.

The deployment method depends on how the current frontend is integrated.

Possible arrangements include:

- Express serves the frontend files.
- A web server serves static frontend files separately.
- A static hosting platform serves the frontend while API requests target the backend.

Choose the arrangement that matches the implemented application and approved deployment environment.

### Frontend validation

- Confirm the entry page loads.
- Check browser console errors.
- Verify CSS and JavaScript assets load correctly.
- Confirm API base URLs point to the intended environment.
- Check authentication-related workflows.
- Verify that failed API requests produce understandable feedback.
- Check responsive layouts on supported screen sizes.
- Confirm private resources are not exposed through public static paths.

Do not publish uploaded or private documents as public static assets unless the access model explicitly permits it.

## 12. File Storage and Uploads

If file upload or private-library functionality is included in the release, verify the storage design before deployment.

Requirements to assess:

- Storage location and permissions.
- File size limits.
- File-type and content validation.
- Safe filename handling.
- Ownership and access-control checks.
- Download authorization.
- Storage capacity and cleanup.
- Backup and recovery requirements.
- Protection against executable uploads.
- Whether uploaded files must persist across restarts or redeployments.

Do not assume the repository's `uploads/` directory is automatically suitable for production storage.

## 13. Network and Security Configuration

Before exposing the application to users:

- Restrict access to database ports.
- Use HTTPS when the environment is accessible over a network.
- Configure CORS for intended frontend origins.
- Keep secrets outside source control.
- Ensure production error responses do not disclose stack traces or secrets.
- Review authentication and session or token handling.
- Verify authorization for administrative and private operations.
- Confirm request validation and SQL parameterization.
- Apply appropriate rate limits.
- Review security headers and cookie settings where applicable.
- Protect backups and log files.
- Restrict operating-system permissions for application files.

Security controls must be verified against the actual implementation and hosting configuration.

## 14. Startup and Process Management

The application should have a documented and repeatable startup method.

For a local development environment, the project's configured npm script may be used.

For a persistent hosted environment, select an appropriate process-management or hosting mechanism based on the target platform.

Verify:

- The application starts after the intended deployment procedure.
- Startup failures are visible in logs.
- The process can be restarted safely.
- Secrets remain available without being printed.
- The database is reachable when the application needs it.
- Logs can be inspected without exposing sensitive data.
- Shutdown does not corrupt application data.

Do not claim that a process manager, container platform, or cloud service is configured unless confirmed.

## 15. Post-Deployment Smoke Tests

Perform a short set of high-priority checks after deployment.

| Check | Expected outcome |
|---|---|
| Application startup | Server starts without fatal errors |
| Database connection | Required database operations can connect |
| Health check, if available | Reports the expected healthy state |
| Login | Valid credentials are handled correctly |
| Invalid login | Request is rejected safely |
| Protected endpoint | Unauthenticated access is denied |
| Role restrictions | Unauthorized administrative actions are denied |
| Core book workflow | Supported operations behave as expected |
| Relationship handling | Invalid references are rejected |
| Frontend loading | Required pages and assets load |
| Error handling | Failures do not expose sensitive details |
| Private-resource access | Access is restricted to authorized users |

Record actual outcomes. Do not mark these checks as passed until they have been executed.

## 16. Release Approval

A deployment should proceed only when the responsible team has reviewed:

- Scope and release revision.
- Test results and evidence.
- Critical and high-severity defects.
- Database compatibility.
- Configuration and secret handling.
- Storage and backup arrangements.
- Security-sensitive workflows.
- Rollback feasibility.
- Known limitations and acceptance of residual risks.

The person responsible for approving the release should be identified in the project's release record.

## 17. Rollback Strategy

If deployment introduces a serious failure, stop further rollout and assess whether rollback is appropriate.

Potential rollback actions include:

1. Record the error and affected release.
2. Restrict access if a security issue is involved.
3. Stop or disable the affected application process if necessary.
4. Restore the previously approved application revision.
5. Revert configuration changes where safe.
6. Restore database state only when required and after assessing data loss.
7. Re-run smoke tests.
8. Confirm service behavior.
9. Record the incident and follow-up actions.

Application rollback does not automatically reverse database changes.

Use the separate `rollback-plan.md` document for detailed recovery procedures. Never restore an old database backup without understanding the effect on data created since that backup.

## 18. Backup and Recovery

Document the actual backup method before deployment.

The plan should identify:

- What is backed up.
- Backup frequency.
- Storage location.
- Access permissions.
- Retention policy.
- Encryption requirements.
- Recovery owner.
- Restore procedure.
- Last verified restore test.

Potential backup targets include the MySQL database, uploaded documents, and deployment configuration that can safely be retained without exposing secrets.

A backup is not proven recoverable until a restore procedure has been tested.

## 19. Deployment Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Incorrect environment variables | Application startup or authentication failure | Validate configuration before release |
| Database schema mismatch | API errors or data-integrity issues | Review and test schema changes |
| Missing dependencies | Startup failure | Install from the approved lock file |
| Exposed credentials | Unauthorized access | Use protected environment configuration |
| Public access to private files | Data disclosure | Verify storage and authorization controls |
| Incompatible release changes | Application failure | Test the release and maintain rollback options |
| Lost uploaded files | User data loss | Use persistent storage and backups |
| Unverified deployment | Undetected defects | Execute and record smoke tests |
| Unsafe database rollback | Loss of newer data | Plan database recovery separately |

## 20. Deployment Record

Complete this record for each deployment.

| Field | Value |
|---|---|
| Deployment ID | Not recorded |
| Deployment date | Not recorded |
| Target environment | Not selected |
| Release version | Not recorded |
| Git commit | Not recorded |
| Deployed by | Not assigned |
| Database migration | Not recorded |
| Test report | Not recorded |
| Smoke-test result | Not recorded |
| Known issues | Not recorded |
| Rollback reference | `rollback-plan.md` |
| Approval status | Not recorded |

## 21. Completion Checklist

- [ ] Target environment is documented.
- [ ] Approved source revision is recorded.
- [ ] Dependencies are installed reproducibly.
- [ ] Environment variables are configured securely.
- [ ] Database schema is compatible.
- [ ] Database access is restricted appropriately.
- [ ] Application starts using the documented process.
- [ ] Frontend assets and API connections are verified.
- [ ] Upload and private-resource controls are verified where applicable.
- [ ] Required tests have evidence.
- [ ] Post-deployment smoke tests are recorded.
- [ ] Backup and recovery arrangements are documented.
- [ ] Rollback steps have been reviewed.
- [ ] Outstanding defects and risks are disclosed.
- [ ] Deployment approval is recorded.

## 22. Maintenance

Update this document when the deployment target, runtime requirements, dependency process, database structure, storage design, network configuration, or release procedure changes.

Keep it consistent with:

- `environment-setup.md`
- `production-checklist.md`
- `rollback-plan.md`
- `../03-technical/architecture.md`
- `../03-technical/database-design.md`
- `../05-security/security-design.md`
- `../07-testing/test-plan.md`

This document defines the deployment procedure and readiness requirements. It does not, by itself, prove that the application has been deployed or that the target environment is operational.
