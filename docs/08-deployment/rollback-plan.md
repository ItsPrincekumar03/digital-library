# Digital Library — Rollback Plan

## 1. Purpose

This document defines the procedure for responding to a failed deployment, restoring a previously working application version, recovering from configuration errors, and handling database or file-storage problems.

The goal is to minimize service disruption, protect user data, and restore a known working state without introducing additional damage.

This document describes the intended recovery procedure. It does not claim that backups, rollback scripts, or recovery tests currently exist.

## 2. Project Overview

Digital Library is a BTech final-year web application using:

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js and Express.js
- Database: MySQL
- Architecture: Monolithic application

Microservices are not part of the approved architecture.

The application may include authentication, user roles, book management, authors, categories, chapters, reading features, and private-library functionality depending on the verified release scope.

Rollback procedures must account for the features and database changes included in the specific release.

## 3. Rollback Objectives

The rollback process aims to:

1. Detect and assess serious deployment failures.
2. Protect the database and uploaded content.
3. Stop further deployment changes when necessary.
4. Restore a previously approved application revision.
5. Revert incompatible configuration changes safely.
6. Recover database state only when justified.
7. Verify application health after recovery.
8. Record the incident and corrective actions.
9. Prevent recurrence through follow-up testing.

## 4. Rollback Scope

Rollback may involve one or more of the following components:

| Component | Possible recovery action |
|---|---|
| Backend code | Restore a previously approved source revision |
| Frontend files | Restore the previous compatible frontend version |
| Environment configuration | Restore reviewed configuration values |
| Dependencies | Reinstall dependencies from the previous compatible lock file |
| Database schema | Apply a reviewed, compatible recovery migration |
| Database data | Restore a backup when required and approved |
| Uploaded files | Recover from a verified backup if data is missing or damaged |
| Deployment settings | Restore previously documented settings |

Not every incident requires all components to be rolled back.

Application code, database schema, configuration, and stored data must be assessed separately because they can have different recovery requirements.

## 5. Rollback Triggers

Consider initiating rollback when one or more of the following occurs:

- The application fails to start after deployment.
- Essential API requests fail unexpectedly.
- Authentication or authorization is broken.
- Unauthorized access to protected resources is discovered.
- Database writes cause data-integrity problems.
- A schema change makes the previous application version incompatible.
- Core book-management workflows stop working.
- Private files become publicly accessible.
- A serious performance or stability issue affects essential workflows.
- The release introduces an unresolved critical defect.
- A configuration change prevents reliable operation.

A rollback decision must consider the severity of the issue, its scope, the safety of the previous version, and the risk of data loss.

For a security incident, restrict access and contain the issue before restoring service. Rolling back application code alone may not remove compromised credentials or reverse unauthorized data access.

## 6. Roles and Responsibilities

Assign these responsibilities for each deployment.

| Responsibility | Expected duty |
|---|---|
| Incident coordinator | Coordinates the response and records the decision |
| Deployment owner | Performs approved application or configuration recovery |
| Database owner | Assesses schema compatibility, backups, and data recovery |
| Testing reviewer | Executes post-rollback verification |
| Project team | Reports symptoms and confirms affected workflows |

The specific team member assigned to each responsibility must be recorded before deployment.

Avoid making conflicting changes to the same environment during an incident.

## 7. Pre-Deployment Recovery Preparation

Before releasing a new version:

- [ ] Record the current working Git commit.
- [ ] Record the target release commit.
- [ ] Identify the previous approved version.
- [ ] Review database schema changes.
- [ ] Identify configuration changes.
- [ ] Confirm the previous dependency lock file is available.
- [ ] Identify persistent file-storage locations.
- [ ] Back up required data before risky changes.
- [ ] Document the backup location and timestamp.
- [ ] Confirm who can perform recovery.
- [ ] Review the rollback commands for the target environment.
- [ ] Verify that the previous version is compatible with the database state.
- [ ] Document any changes that cannot be safely reversed.

A backup should be treated as usable only when its contents and restoration procedure are understood. A restore test provides stronger evidence than merely checking that a backup file exists.

## 8. Incident Assessment

When a release appears to fail:

1. Record the time the problem was detected.
2. Identify the deployed version and affected environment.
3. Capture sanitized logs and error messages.
4. Identify the affected features and users.
5. Check application, database, and network availability.
6. Determine whether the issue is caused by code, configuration, dependencies, schema, or data.
7. Assess whether the problem creates a security or data-integrity risk.
8. Decide whether to fix forward, roll back, restrict access, or recover data.
9. Record the decision and responsible person.

Avoid destructive troubleshooting until the current state and recovery options have been assessed.

## 9. Application Code Rollback

### 9.1 Requirements

Before restoring the previous application version, confirm:

- The previous commit is known.
- The source code is available.
- The previous version's dependencies are available.
- Its configuration requirements are known.
- It is compatible with the current database schema and data.
- Any frontend/backend compatibility requirements are understood.

### 9.2 Inspect the current repository

From the project root:

```powershell
git status
git log -5 --oneline
git branch --show-current
```

These commands inspect the current working state. They do not perform rollback.

### 9.3 Restore a previous revision safely

For a local recovery, create a separate working directory or a dedicated recovery branch from the known working commit where practical.

Example:

```powershell
git worktree add ..\digital-library-recovery <KNOWN_GOOD_COMMIT>
```

Replace `<KNOWN_GOOD_COMMIT>` with the actual verified commit hash.

This creates a separate checkout when the selected commit and Git worktree prerequisites are valid. It does not automatically deploy the application.

Before replacing the deployed application, verify that the recovery revision is compatible with the database and configuration.

### 9.4 Important Git safety rules

- Do not run `git reset --hard` as a routine recovery shortcut.
- Do not delete uncommitted changes without reviewing them.
- Do not force-push over shared history to perform a deployment rollback.
- Do not assume switching Git branches changes the running production process.
- Keep a record of the failed release and recovery revision.

For a shared branch, use the team's approved Git workflow. A reviewed revert commit may be more appropriate than rewriting shared history.

## 10. Dependency Rollback

If a dependency change causes the failure:

1. Identify the last known compatible dependency manifest and lock file.
2. Restore the reviewed versions in a recovery branch or checkout.
3. Confirm compatibility with the selected Node.js runtime.
4. Install dependencies using the repository's supported process.
5. Run the relevant tests.
6. verify that startup and critical workflows work before redeployment.

For a backend with a valid `package-lock.json`, a reproducible installation may use:

```powershell
Set-Location .\backend
npm ci
```

Run the command only after checking that the manifest and lock file correspond to the intended recovery revision.

Do not downgrade individual packages blindly or mix dependencies from incompatible revisions.

## 11. Configuration Rollback

Configuration rollback may be required when a change affects database access, application startup, CORS, authentication, cookies, storage, or external services.

Procedure:

1. Identify the configuration change associated with the failure.
2. Compare it with the last known working configuration.
3. Restore the appropriate reviewed values.
4. Keep secrets out of source control and incident reports.
5. Restart the application using the documented process.
6. Check startup logs and connectivity.
7. Verify the affected workflow.
8. Rotate any credential that may have been exposed or compromised.

Do not restore an old secret merely because it was used previously. If the secret is suspected to be compromised, generate and deploy a new one using the approved procedure.

## 12. Database Rollback

Database recovery requires particular care because restoring an earlier state can permanently remove newer data.

### 12.1 Before changing the database

- [ ] Identify the exact schema or data problem.
- [ ] Determine whether the application is still writing data.
- [ ] Identify the affected tables and relationships.
- [ ] Check available backups and their timestamps.
- [ ] Determine which records may have been created after the backup.
- [ ] Review the database migration history, if available.
- [ ] Assess whether a forward fix is safer than restoration.
- [ ] Obtain approval for any destructive recovery operation.

### 12.2 Schema recovery

Preferred options depend on the actual change:

- Apply a reviewed corrective migration.
- Restore a compatible schema from a known version.
- Restore a complete database backup when necessary.
- Recover selected records using a validated procedure.

Do not assume every schema change has a safe inverse operation. Dropped columns, transformed data, and changed constraints may not be reversible without a backup.

### 12.3 Data recovery

If data is damaged or lost:

1. Stop or restrict affected writes when appropriate.
2. Preserve the current database state for investigation.
3. Identify the most suitable verified backup.
4. Restore into an isolated recovery database first when feasible.
5. Verify the recovered schema and records.
6. Compare recovery results with the expected data.
7. Assess whether newer valid records can be preserved.
8. Obtain approval before replacing the target database.
9. Reconnect the application only after validation.
10. Execute post-recovery tests.

Never restore a backup to a live database without understanding its impact on records created after that backup.

## 13. Uploaded Files and Private Documents

If the application stores uploaded files, PDFs, or private-library content, verify whether those files are stored separately from MySQL.

When file recovery is required:

1. Identify the affected storage location.
2. Stop unsafe file operations if necessary.
3. Preserve the current state for investigation.
4. Locate a verified backup.
5. Restore files to a controlled recovery location first where feasible.
6. Check file completeness and readability.
7. Verify ownership and access permissions.
8. Confirm that private resources remain protected.
9. Reconnect the application to the recovered storage.
10. Test authorized and unauthorized access.

Database restoration alone may not restore the corresponding files. File restoration alone may also leave database records pointing to missing content.

## 14. Deployment Process Rollback

For a deployment that introduces a serious application failure:

1. Pause additional deployment activity.
2. Record the failed release and symptoms.
3. Restrict access if the issue presents a security risk.
4. Select the known working application revision.
5. Confirm compatibility with the current database.
6. Restore compatible configuration.
7. Restore the required dependency set.
8. Deploy the previous application version using the target environment's documented procedure.
9. Restart or switch traffic using the configured hosting mechanism.
10. Verify startup and database connectivity.
11. Execute the smoke-test checklist.
12. Record the recovery result and remaining limitations.

The exact deployment commands depend on the hosting environment. Do not assume a particular cloud platform, process manager, container runtime, or hosting service is configured.

## 15. Post-Rollback Verification

After restoring the application, verify the following where applicable.

| Check | Expected outcome |
|---|---|
| Application startup | The selected revision starts without fatal errors |
| Database connection | Required database operations work |
| Health check | The configured health check reports the expected result |
| Authentication | Valid and invalid login behavior is correct |
| Protected routes | Unauthenticated access is denied |
| Role restrictions | Unauthorized administrative operations are denied |
| Book workflows | Supported operations work as expected |
| Relationships | Data relationships remain consistent |
| Private resources | Unauthorized access remains blocked |
| File handling | Required files remain available and protected |
| Frontend | Pages and assets load correctly |
| Error handling | Sensitive implementation details are not exposed |
| Data integrity | Recovered records and relationships are consistent |

Record actual results rather than marking checks as passed by assumption.

## 16. Security Incident Recovery

If a deployment failure involves exposed credentials, unauthorized access, or private data disclosure:

1. Contain the incident and restrict affected access.
2. Preserve relevant logs and evidence.
3. Identify the exposed systems, credentials, and resources.
4. Revoke or rotate compromised credentials.
5. Check whether unauthorized changes or data access occurred.
6. Correct the underlying vulnerability.
7. Assess applicable notification and reporting obligations.
8. Deploy the verified correction or a safe previous version.
9. Re-test the affected security controls.
10. Document the incident and preventive actions.

A code rollback alone is not sufficient when credentials, persistent data, or external systems may have been compromised.

## 17. Rollback Decision Matrix

| Situation | Suggested response |
|---|---|
| Minor issue with a safe, tested correction | Fix forward if risk is acceptable |
| Critical startup failure after deployment | Consider application rollback |
| Incompatible dependency update | Restore a compatible dependency set |
| Incorrect non-secret configuration | Restore reviewed configuration |
| Schema incompatibility | Assess a corrective migration or compatible recovery |
| Corrupted or missing data | Follow the approved database recovery process |
| Missing uploaded content | Follow the file recovery procedure |
| Credential exposure | Contain, rotate credentials, and investigate |
| Private-resource authorization failure | Restrict access immediately and correct the security issue |

This matrix supports decision-making; the incident owner must consider the actual risk and environment before acting.

## 18. Rollback Incident Record

Complete one record for each rollback event.

| Field | Value |
|---|---|
| Incident ID | Not recorded |
| Detection time | Not recorded |
| Affected environment | Not recorded |
| Failed release commit | Not recorded |
| Recovery commit | Not recorded |
| Incident coordinator | Not assigned |
| Root cause | Not recorded |
| Database action | Not recorded |
| File-storage action | Not recorded |
| Credentials rotated | Not recorded |
| Recovery start time | Not recorded |
| Recovery completion time | Not recorded |
| Smoke-test results | Not recorded |
| Data-loss assessment | Not recorded |
| Outstanding risks | Not recorded |
| Final decision | Not recorded |

## 19. Prevention and Follow-Up

After recovery:

- [ ] Identify the root cause.
- [ ] Create or update a defect record.
- [ ] Add regression tests for the failure.
- [ ] Review deployment and testing gaps.
- [ ] Update migration or configuration instructions.
- [ ] Improve backup or recovery procedures where needed.
- [ ] Review access logs if security is involved.
- [ ] Document any data loss or service interruption.
- [ ] Assign follow-up tasks.
- [ ] Verify that corrective changes are tested before redeployment.

The incident should not be considered fully resolved until the immediate failure is addressed and necessary follow-up actions are recorded.

## 20. Rollback Readiness Checklist

Before deployment:

- [ ] Known working revision identified.
- [ ] Release revision recorded.
- [ ] Database compatibility assessed.
- [ ] Backup requirements reviewed.
- [ ] Configuration recovery procedure documented.
- [ ] Dependency recovery process understood.
- [ ] File-storage recovery considered.
- [ ] Recovery owner identified.
- [ ] Post-rollback tests identified.

After rollback:

- [ ] Application starts successfully.
- [ ] Database connectivity is verified.
- [ ] Core workflows are tested.
- [ ] Authentication and authorization are verified.
- [ ] Private-resource access is checked where applicable.
- [ ] Data integrity is assessed.
- [ ] Recovery outcome is documented.
- [ ] Outstanding risks are communicated.
- [ ] Follow-up actions are assigned.

## 21. Related Documentation

- `deployment-plan.md`
- `environment-setup.md`
- `production-checklist.md`
- `../07-testing/test-plan.md`
- `../07-testing/regression-testing.md`
- `../05-security/security-design.md`
- `../03-technical/architecture.md`
- `../03-technical/database-design.md`

## 22. Maintenance

Review this plan whenever deployment procedures, database migrations, authentication, file storage, dependencies, or hosting infrastructure change.

Recovery instructions should be tested in a safe environment before they are relied upon during an incident.

This document defines a recovery approach. Actual recovery readiness depends on available source revisions, compatible configurations, verified backups, tested procedures, and evidence from the target environment.
