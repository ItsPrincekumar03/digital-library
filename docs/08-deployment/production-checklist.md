# Digital Library — Production Deployment Checklist

## 1. Purpose

This checklist defines the readiness checks to complete before, during, and after deploying the Digital Library application to a production-like, hosted, or final demonstration environment.

It covers application configuration, source code, dependencies, MySQL, security, file storage, testing, deployment verification, recovery, and release approval.

**Important:** This is a readiness checklist, not evidence that the application has been deployed or that any individual control has passed. Mark an item complete only after verifying it.

## 2. Project Overview

Digital Library is a BTech final-year project using the approved technology stack:

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js and Express.js
- Database: MySQL
- Architecture: Monolithic application

Microservices are not part of the approved architecture.

The application may include authentication, user roles, books, authors, categories, chapters, reading functionality, and private-library features depending on the approved release scope and verified implementation.

Only features included in the release should be assessed as release requirements.

## 3. Status Definitions

Use these statuses when maintaining this checklist:

- **Not Verified:** No supporting verification has been recorded.
- **In Progress:** Work or verification is underway.
- **Passed:** The check has been completed successfully with evidence.
- **Failed:** The check did not meet its expected result.
- **Blocked:** The check cannot be completed because of an identified dependency.
- **Not Applicable:** The check does not apply to the approved release, with a reason recorded.

Do not treat an unchecked item as passed.

## 4. Release Information

Complete this section for each deployment.

| Field | Value |
|---|---|
| Release ID | Not recorded |
| Release version | Not recorded |
| Git branch | Not recorded |
| Git commit | Not recorded |
| Target environment | Not selected |
| Deployment date | Not recorded |
| Deployment owner | Not assigned |
| Database version or migration reference | Not recorded |
| Test report reference | Not recorded |
| Approval status | Not recorded |

## 5. Release Scope

- [ ] The intended release features are documented.
- [ ] Included modules are identified.
- [ ] Known limitations are documented.
- [ ] Deferred features are clearly distinguished from implemented features.
- [ ] API and database changes are identified.
- [ ] File-storage requirements are documented where applicable.
- [ ] Outstanding defects have been reviewed.
- [ ] Release-blocking issues are resolved or explicitly rejected from release.
- [ ] The team understands the expected deployment outcome.

Do not include unfinished features in release claims simply because they appear in the roadmap or requirements documents.

## 6. Source Code and Version Control

- [ ] The correct repository has been selected.
- [ ] The release branch and commit are recorded.
- [ ] Changes have been reviewed.
- [ ] Required changes have been committed.
- [ ] No unintended local modifications will be deployed.
- [ ] No required files are missing from the release.
- [ ] No credentials or private configuration files are committed.
- [ ] Dependency manifests and lock files are consistent.
- [ ] Relevant documentation has been updated.
- [ ] The rollback revision is identified.

Repository:

`https://github.com/ItsPrincekumar03/digital-library.git`

From the project root, inspect the current state:

```powershell
git status
git branch --show-current
git log -1 --oneline
```

These commands inspect the current checkout; they do not establish that the intended release has been reviewed or approved.

## 7. Runtime and Dependency Readiness

- [ ] The supported Node.js version is documented.
- [ ] The installed runtime is compatible with the application.
- [ ] Dependencies install successfully.
- [ ] The appropriate package lock file is available.
- [ ] The dependency installation procedure is documented.
- [ ] Required native or system-level dependencies are available.
- [ ] No unreviewed dependency updates are included.
- [ ] Startup and test scripts have been verified.
- [ ] The application can start using the intended deployment procedure.

If the backend contains a compatible `package-lock.json`, `npm ci` can be used for reproducible installation.

```powershell
Set-Location .\backend
npm ci
```

Run this only when the package manifest and lock file are available and compatible. Inspect `package.json` to determine the actual startup and testing scripts.

## 8. Environment Configuration

- [ ] All required environment variables are identified.
- [ ] Production configuration is separated from development configuration.
- [ ] Real secrets are stored outside version control.
- [ ] Authentication secrets are strong and protected.
- [ ] Database credentials are correct.
- [ ] Database credentials have appropriate privileges.
- [ ] The application port is configured correctly.
- [ ] CORS settings permit only intended origins.
- [ ] Production error handling does not expose sensitive details.
- [ ] Debugging settings are appropriate for the target environment.
- [ ] Configuration is validated during startup where supported.
- [ ] The team knows how to rotate exposed credentials.

Use the exact environment-variable names expected by the implementation. Do not assume that example variable names in documentation match the application automatically.

## 9. MySQL Readiness

- [ ] The target MySQL server is available.
- [ ] The intended database exists.
- [ ] The schema matches the release.
- [ ] Required tables and relationships are present.
- [ ] Primary and foreign key constraints are correct.
- [ ] Required unique constraints and indexes are present.
- [ ] The application database account has the required privileges.
- [ ] Database access is restricted to trusted systems.
- [ ] Schema changes have been reviewed.
- [ ] Migration or schema application procedures are documented.
- [ ] A suitable backup exists before risky schema changes.
- [ ] Restore instructions are available.
- [ ] Data integrity has been checked after schema changes.

Never apply unreviewed destructive SQL to a live database. Do not assume a specific migration tool or script exists without inspecting the repository.

## 10. Authentication and Authorization

- [ ] Registration behavior has been tested, if supported.
- [ ] Valid login behavior has been tested.
- [ ] Invalid login behavior has been tested.
- [ ] Passwords are stored using the approved password-hashing mechanism.
- [ ] Protected endpoints reject unauthenticated requests.
- [ ] Administrator-only operations enforce server-side role checks.
- [ ] User-owned resources enforce ownership restrictions.
- [ ] Private-library resources cannot be accessed by unauthorized users.
- [ ] Logout behavior matches the implemented authentication design.
- [ ] Token, cookie, or session handling has been reviewed.
- [ ] Sensitive authentication data is not written to logs.
- [ ] Authentication failures produce safe responses.

The project has discussed `USER` and `ADMIN` roles. Verify their actual permissions against the current implementation and approved requirements.

## 11. API and Input Validation

- [ ] Required routes and HTTP methods have been verified.
- [ ] Request bodies are validated.
- [ ] Query parameters and route parameters are validated.
- [ ] Invalid identifiers are rejected appropriately.
- [ ] Database queries use parameterized inputs where appropriate.
- [ ] Error responses follow the documented API contract.
- [ ] Unsupported operations are rejected.
- [ ] Unexpected server errors do not expose stack traces or secrets.
- [ ] Rate limits are configured where required.
- [ ] Security headers are configured appropriately.
- [ ] CORS behavior has been tested from intended frontend origins.

Do not claim that an endpoint is secure merely because its route exists. Test its input handling, authorization, and actual behavior.

## 12. File Storage and Private Resources

Complete this section when file uploads, PDFs, or private-library resources are included in the release.

- [ ] Supported file types are documented.
- [ ] Upload size limits are enforced.
- [ ] File validation is performed server-side.
- [ ] Filenames are handled safely.
- [ ] Files are stored in the intended location.
- [ ] Uploaded files persist across the required restart or redeployment scenarios.
- [ ] Private files are not unintentionally served publicly.
- [ ] Download operations enforce authorization.
- [ ] Resource ownership is checked.
- [ ] Storage permissions are appropriately restricted.
- [ ] Storage capacity is sufficient.
- [ ] Backup and recovery procedures cover required files.
- [ ] Rejected uploads produce safe error responses.

Do not assume the repository's `uploads/` directory provides persistent or secure storage in a hosted environment without checking the deployment configuration.

## 13. Frontend Readiness

- [ ] The intended entry page loads.
- [ ] CSS and JavaScript assets load correctly.
- [ ] API base URLs point to the intended backend.
- [ ] No development-only URLs remain unintentionally.
- [ ] Browser console errors have been reviewed.
- [ ] Network failures are handled appropriately.
- [ ] Login and protected workflows have been tested.
- [ ] User-facing validation and error messages are understandable.
- [ ] Supported screen sizes have been checked.
- [ ] Private information is not exposed in browser-side configuration.
- [ ] Any enabled reading or media controls behave as documented.
- [ ] Dark mode and background preferences are verified if included in the release.

Features listed in the roadmap but not implemented should be marked as out of scope for the release.

## 14. Testing Readiness

- [ ] The test plan has been reviewed.
- [ ] Required functional tests have been executed.
- [ ] Relevant integration tests have been executed.
- [ ] Authentication and authorization tests have been executed.
- [ ] Database integrity tests have been executed.
- [ ] Security tests have been executed for release-critical paths.
- [ ] Regression tests have been executed after relevant changes.
- [ ] Critical workflows have been tested end to end.
- [ ] Failures and blocked tests are documented.
- [ ] Fixed defects have been retested.
- [ ] Test evidence identifies the relevant version or commit.
- [ ] Outstanding risks have been reviewed.

A test is not passed until its actual result has been recorded.

## 15. Deployment Configuration

- [ ] The target hosting environment is identified.
- [ ] Required runtime versions are available.
- [ ] Network access is configured appropriately.
- [ ] HTTPS is enabled where required.
- [ ] Application and database connection settings are correct.
- [ ] The process startup method is documented.
- [ ] Restart behavior is understood.
- [ ] Required storage paths exist and have suitable permissions.
- [ ] Logging is available to the responsible team.
- [ ] Sensitive configuration is not exposed through public files.
- [ ] Deployment instructions have been reviewed.
- [ ] The rollback procedure is available.

The hosting provider and deployment platform must be recorded separately. This checklist does not assume a specific cloud provider or process manager.

## 16. Backup and Recovery Readiness

- [ ] The required database backup is available.
- [ ] Required uploaded content is included in the recovery plan.
- [ ] Backup files are protected against unauthorized access.
- [ ] Backup retention requirements are documented.
- [ ] The restore procedure is documented.
- [ ] The recovery owner is identified.
- [ ] The effect of database rollback on newer data has been assessed.
- [ ] A suitable recovery test has been performed or its absence recorded.
- [ ] The previous application revision is available for rollback.

A backup should not be considered reliable solely because a backup file exists. Verify the restore procedure in an appropriate test environment.

## 17. Logging and Operational Monitoring

- [ ] Startup errors can be diagnosed.
- [ ] Database connection failures can be diagnosed.
- [ ] Relevant application failures are logged.
- [ ] Logs do not contain passwords or live tokens.
- [ ] Stack traces are not exposed to ordinary users in production.
- [ ] Log access is restricted appropriately.
- [ ] Storage and database capacity can be checked.
- [ ] The responsible person knows how to identify service failure.
- [ ] An incident-reporting process is documented.

Use monitoring capabilities appropriate to the chosen deployment environment. Do not claim that an external monitoring service is configured unless it has been verified.

## 18. Deployment Execution Checklist

Immediately before deployment:

- [ ] Confirm release approval.
- [ ] Confirm the target environment.
- [ ] Record the release commit.
- [ ] Confirm configuration and secrets.
- [ ] Confirm database backup requirements.
- [ ] Review pending schema changes.
- [ ] Confirm rollback instructions.
- [ ] Notify the relevant team members.

During deployment:

- [ ] Obtain the approved source revision.
- [ ] Install the required dependencies.
- [ ] Apply reviewed database changes.
- [ ] Start or restart the application using the documented procedure.
- [ ] Review startup and database logs.
- [ ] Check the health endpoint, if implemented.
- [ ] Run the approved smoke tests.
- [ ] Record errors and unexpected behavior.

After deployment:

- [ ] Verify critical user workflows.
- [ ] Verify authentication and role restrictions.
- [ ] Verify private-resource access controls where applicable.
- [ ] Confirm the frontend communicates with the intended backend.
- [ ] Record the actual test results.
- [ ] Document remaining defects and risks.
- [ ] Confirm the deployment outcome with the responsible team.

## 19. Post-Deployment Smoke Tests

| Test | Expected result | Status |
|---|---|---|
| Application startup | Application starts without fatal errors | Not Verified |
| Database connection | Required database operations connect successfully | Not Verified |
| Health check | Expected healthy response, if supported | Not Verified |
| Valid login | Authentication succeeds | Not Verified |
| Invalid login | Authentication is rejected safely | Not Verified |
| Protected endpoint | Unauthorized access is denied | Not Verified |
| Role-restricted operation | Unauthorized role is denied | Not Verified |
| Core book workflow | Supported operation behaves as expected | Not Verified |
| Database relationship | Invalid relationship is rejected | Not Verified |
| Frontend loading | Required assets load correctly | Not Verified |
| Error handling | Sensitive details are not exposed | Not Verified |
| Private resource | Unauthorized access is denied | Not Verified |

Update the status column only after executing each applicable test.

## 20. Rollback Decision

Consider rollback if the release causes:

- Critical application startup failure.
- Significant data-integrity problems.
- Broken essential user workflows.
- A serious security vulnerability.
- Unrecoverable database connectivity problems.
- Widespread failures that cannot be safely corrected in place.

Before restoring an earlier version, assess whether database or configuration changes are compatible with that version.

Refer to `rollback-plan.md` for the detailed rollback process.

## 21. Release Sign-Off

Complete this record after the checks have been reviewed.

| Approval field | Value |
|---|---|
| Technical reviewer | Not assigned |
| Testing reviewer | Not assigned |
| Deployment owner | Not assigned |
| Open critical defects | Not recorded |
| Open high-severity defects | Not recorded |
| Accepted residual risks | Not recorded |
| Deployment decision | Not recorded |
| Approval date | Not recorded |

Release approval must reflect actual test results and known risks. Do not use an empty sign-off record as evidence of approval.

## 22. Final Readiness Summary

- [ ] All mandatory release checks are passed or have a documented, approved exception.
- [ ] No unresolved release-blocking issue remains.
- [ ] Required test evidence is available.
- [ ] Security-sensitive workflows have been reviewed.
- [ ] Database and file recovery arrangements are documented.
- [ ] Deployment and rollback procedures are available.
- [ ] The release revision is recorded.
- [ ] Outstanding limitations are disclosed.
- [ ] The deployment decision is recorded.

## 23. Related Documentation

- `deployment-plan.md`
- `environment-setup.md`
- `rollback-plan.md`
- `../07-testing/test-plan.md`
- `../07-testing/testing-strategy.md`
- `../05-security/security-design.md`
- `../03-technical/architecture.md`
- `../03-technical/database-design.md`

## 24. Maintenance

Update this checklist whenever release scope, authentication, database schema, deployment infrastructure, storage behavior, security controls, or testing requirements change.

This checklist supports a consistent deployment review. Only completed checks, recorded results, and authorized sign-off can establish actual release readiness.
