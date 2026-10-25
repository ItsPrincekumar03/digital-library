# Digital Library — Threat Model

**Document Version:** 1.0  
**Project:** Digital Library  
**Release Scope:** V1 and subsequent approved versions  
**Architecture:** Monolithic Web Application  
**Frontend:** HTML, CSS, Vanilla JavaScript  
**Backend:** Node.js, Express.js  
**Database:** MySQL  
**Status:** Threat Assessment — Validate Against Implementation

---

## 1. Purpose

This document identifies potential security threats to Digital Library, the assets that require protection, the trust boundaries involved, possible attack scenarios, and the controls required to reduce risk.

The threat model supports secure implementation, testing, and deployment decisions.

The threats listed here are potential risks, not claims that the application has already been attacked or that a vulnerability has been confirmed. Actual exposure must be determined by reviewing the source code, configuration, deployment, and test evidence.

---

## 2. Scope

This threat model covers the following application areas:

- User registration and authentication.
- Role-based authorization.
- Book, author, category, and chapter management.
- Book publication and visibility rules.
- Private PDF documents and file handling, where implemented.
- REST API endpoints.
- MySQL database access.
- Frontend rendering.
- Environment configuration and secrets.
- Error handling and logging.
- Deployment and operational recovery.

Future features must receive additional threat analysis before implementation.

---

## 3. System Overview

Digital Library is designed as a monolithic web application using HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL.

The intended logical architecture is:

```text
User / Browser
      |
      v
Frontend
      |
      v
Express API
      |
      +--> Validation and Middleware
      |
      +--> Authentication and Authorization
      |
      +--> Controllers and Services
      |
      +--> Repository / Database Access
      |              |
      |              v
      |            MySQL
      |
      +--> File Storage and PDF Processing
             (where implemented)
```

The actual architecture, components, and request flow must be confirmed against the current repository.

---

## 4. Security Objectives

The primary objectives are:

### Confidentiality

Prevent unauthorized access to account information, private documents, restricted books, and sensitive configuration.

### Integrity

Prevent unauthorized creation, modification, publication, or deletion of records.

### Availability

Reduce disruption from abusive requests, malformed files, resource exhaustion, and operational failures.

### Authentication

Ensure protected operations are associated with a valid authenticated identity.

### Authorization

Ensure each user can perform only the operations and access only the resources permitted by the application policy.

### Accountability

Provide useful diagnostic records while avoiding exposure of passwords, secrets, tokens, and private content.

---

## 5. Assets Requiring Protection

| Asset | Security Importance | Primary Concern |
|---|---|---|
| User accounts | High | Account takeover and unauthorized changes |
| Password hashes | High | Credential compromise |
| Authentication tokens or sessions | High | Impersonation and unauthorized access |
| User roles | High | Privilege escalation |
| Private PDFs | High | Unauthorized disclosure |
| Book and chapter records | Medium to High | Unauthorized modification or disclosure |
| Author and category records | Medium | Unauthorized changes |
| Database credentials | High | Database compromise |
| Environment secrets | High | Application compromise |
| Uploaded files | Medium to High | Malicious content and unsafe processing |
| Application logs | Medium to High | Leakage of sensitive information |
| Source code and dependency files | Medium to High | Supply-chain and configuration risks |
| Backups | High | Data exposure or loss |

The final classification should reflect the actual data collected and the deployment environment.

---

## 6. Threat Actors

Potential threat actors include:

1. **Unauthenticated visitor:** Attempts to access protected resources or exploit public endpoints.
2. **Malicious authenticated user:** Attempts to access another user's data or abuse permitted functionality.
3. **Privilege-escalation attacker:** Attempts to obtain administrative capabilities.
4. **Compromised account holder:** Uses stolen credentials to perform unauthorized actions.
5. **Malicious content contributor:** Submits unsafe text, metadata, or files.
6. **Automated attacker:** Sends repeated requests, credential attempts, or malformed input.
7. **Compromised dependency or development environment:** Introduces unsafe code or exposes secrets.
8. **Unauthorized operator:** Attempts to access configuration, logs, backups, or database resources.

These are threat scenarios for planning and do not indicate that any such actor has targeted the project.

---

## 7. Trust Boundaries

### 7.1 Browser to Backend

All browser input must be treated as untrusted, even when the user is authenticated.

### 7.2 Backend to Database

Database access must use safe query handling and appropriate credentials.

### 7.3 Backend to File Storage

File operations must enforce path restrictions, storage permissions, and access controls.

### 7.4 Guest to Authenticated User

Authentication must be required for protected operations.

### 7.5 User to Administrator

Administrative operations must require server-side authorization.

### 7.6 Public to Private Content

Public book visibility and private document access must be enforced by the backend.

### 7.7 Development to Production

Secrets, test data, debugging configuration, and development-only behavior must not be exposed unintentionally in production.

---

## 8. Threat Assessment Method

Threats are evaluated using:

- **Likelihood:** How plausible the attack is in the intended environment.
- **Impact:** The potential consequence if the attack succeeds.
- **Risk:** A qualitative combination of likelihood and impact.

The initial ratings below are preliminary. They must be revised after examining the implementation and deployment.

| Rating | Meaning |
|---|---|
| Critical | Could cause severe compromise or major data exposure |
| High | Could significantly compromise accounts, data, or operations |
| Medium | Could cause meaningful but more limited harm |
| Low | Limited expected impact under current assumptions |

Do not treat these preliminary ratings as results from a completed security assessment.

---

## 9. Threat 1 — SQL Injection

**Initial risk:** High  
**Affected assets:** Database records, account information, application integrity.

### Attack Scenario

An attacker submits crafted input that changes the meaning of a database query.

Potential entry points include search fields, identifiers, filters, and create or update forms.

### Potential Impact

- Unauthorized data access.
- Unauthorized data modification or deletion.
- Exposure of sensitive records.
- Database integrity compromise.

### Required Controls

- Use parameterized SQL queries or equivalent safe database APIs.
- Validate request values.
- Restrict dynamic identifiers and sort expressions to approved options.
- Avoid unsafe concatenation of untrusted input into SQL.
- Avoid returning raw database errors to clients.
- Test relevant endpoints with controlled injection cases.

### Verification Evidence

Inspect the database-access code and execute controlled negative tests in an authorized test environment.

---

## 10. Threat 2 — Broken Access Control

**Initial risk:** High  
**Affected assets:** Administrative functions, books, chapters, private documents.

### Attack Scenario

A user directly calls an API endpoint that should be restricted to an administrator or another authorized user.

### Potential Impact

- Unauthorized content changes.
- Unauthorized deletion.
- Disclosure of restricted information.
- Administrative privilege misuse.

### Required Controls

- Enforce authorization on the backend.
- Apply role checks to protected operations.
- Verify resource ownership where required.
- Check permissions for read, update, and delete operations.
- Do not rely on hidden frontend buttons.
- Test direct API requests with different user roles.

### Verification Evidence

Review route middleware and service-level authorization logic. Test both allowed and denied operations.

---

## 11. Threat 3 — Insecure Direct Object Reference

**Initial risk:** High where private resources are exposed  
**Affected assets:** Private PDFs, user-owned records, restricted content.

### Attack Scenario

A user changes a resource identifier in a request to attempt access to another user's document or record.

### Potential Impact

- Unauthorized document disclosure.
- Unauthorized data modification.
- Exposure of private user information.

### Required Controls

- Verify ownership or explicitly granted permission for each protected resource.
- Apply access checks to listing, viewing, downloading, updating, and deleting.
- Avoid assuming that unpredictable identifiers alone provide security.
- Use safe responses for unauthorized resource requests.
- Test cross-user access using separate test accounts.

### Verification Evidence

Review resource lookup and ownership logic for every protected operation.

---

## 12. Threat 4 — Authentication Bypass

**Initial risk:** High  
**Affected assets:** User accounts, protected endpoints, private content.

### Attack Scenario

An attacker sends a protected request without valid credentials or attempts to exploit incomplete authentication middleware.

### Potential Impact

- Unauthorized access.
- Account impersonation.
- Access to protected API operations.

### Required Controls

- Apply authentication middleware consistently.
- Reject malformed, missing, expired, or invalid credentials.
- Avoid trusting client-supplied user identities.
- Review public and protected route registration.
- Test direct access to protected endpoints.

### Verification Evidence

Inspect route registration and authentication middleware. Test unauthenticated requests against protected endpoints.

---

## 13. Threat 5 — Privilege Escalation

**Initial risk:** High  
**Affected assets:** Administrator permissions and management operations.

### Attack Scenario

A user submits an administrator role value during registration or modifies client-controlled account data to gain elevated privileges.

### Potential Impact

- Unauthorized book, category, or chapter management.
- Unauthorized changes to publication state.
- Broader application compromise.

### Required Controls

- Assign roles through a trusted backend process.
- Ignore or reject unauthorized role assignments in public requests.
- Verify administrative permissions on every protected operation.
- Protect role-changing workflows.
- Test attempts to modify role values directly.

### Verification Evidence

Inspect registration, account-update logic, role assignments, and administrative middleware.

---

## 14. Threat 6 — Cross-Site Scripting (XSS)

**Initial risk:** Medium to High  
**Affected assets:** User sessions, page integrity, user trust.

### Attack Scenario

An attacker submits text or content containing executable markup that is later rendered by the frontend.

Potential sources include book metadata, descriptions, chapter content, and uploaded-file metadata.

### Potential Impact

- Execution of attacker-controlled script in another user's browser.
- Unauthorized actions through the affected browser session.
- Misleading content or credential theft attempts.

### Required Controls

- Render ordinary user-controlled text using safe DOM APIs.
- Avoid unsafe HTML insertion.
- Sanitize permitted rich text with an appropriate policy.
- Apply a suitable Content Security Policy.
- Validate URLs before using them.
- Test stored and reflected input paths.

### Verification Evidence

Inspect rendering code and execute controlled XSS tests against relevant fields.

---

## 15. Threat 7 — Credential Theft or Weak Password Storage

**Initial risk:** High  
**Affected assets:** User accounts and authentication credentials.

### Attack Scenario

An attacker obtains stored credentials or exploits unsafe password handling.

### Potential Impact

- Account takeover.
- Unauthorized access to private data.
- Reuse of compromised credentials against other services.

### Required Controls

- Never store plaintext passwords.
- Use an appropriate password-hashing mechanism.
- Avoid logging credentials.
- Protect authentication endpoints.
- Require HTTPS in production.
- Keep authentication secrets outside source control.
- Review password-change and recovery workflows where implemented.

### Verification Evidence

Inspect password storage, verification code, authentication configuration, and logs.

---

## 16. Threat 8 — Token or Session Theft

**Initial risk:** High if authentication credentials are exposed  
**Affected assets:** Authenticated sessions and protected resources.

### Attack Scenario

An attacker obtains an authentication token or session credential from unsafe storage, logs, URLs, or a compromised browser environment.

### Potential Impact

- User impersonation.
- Unauthorized access to private documents.
- Unauthorized operations within the compromised session's permissions.

### Required Controls

- Protect authentication credentials in transit.
- Use secure cookie settings when cookies are used.
- Avoid placing credentials in URLs.
- Avoid logging tokens.
- Define expiration and logout behavior.
- Assess revocation requirements.
- Review XSS and CSRF risks according to the chosen mechanism.

### Verification Evidence

Confirm the actual authentication design and inspect credential handling across the full request lifecycle.

---

## 17. Threat 9 — Malicious or Oversized File Upload

**Initial risk:** High if uploads are exposed  
**Affected assets:** File storage, application availability, private documents.

### Attack Scenario

A user uploads an unsupported, oversized, malformed, or malicious file.

### Potential Impact

- Resource exhaustion.
- Storage abuse.
- Unsafe file processing.
- Unauthorized file access.
- Partial database or filesystem updates.

### Required Controls

- Enforce server-side file-size limits.
- Validate supported file types.
- Do not rely solely on file extensions or client-supplied MIME types.
- Use safe filenames and storage paths.
- Restrict storage permissions.
- Apply suitable processing limits.
- Handle partial failures and cleanup.
- Protect private-file access with authorization.

### Verification Evidence

Inspect upload middleware, file-processing code, storage configuration, and relevant negative tests.

---

## 18. Threat 10 — Path Traversal

**Initial risk:** High if user-controlled file paths are used  
**Affected assets:** Filesystem, uploaded documents, application files.

### Attack Scenario

An attacker submits a path containing traversal sequences or otherwise manipulates file paths to reach unintended filesystem locations.

### Potential Impact

- Unauthorized file reads.
- File overwrite or deletion.
- Exposure of configuration or application files.

### Required Controls

- Avoid using user-supplied paths directly.
- Generate safe storage names.
- Resolve and validate paths against an approved storage root.
- Restrict filesystem permissions.
- Avoid exposing internal paths in error responses.
- Test traversal attempts in a controlled environment.

### Verification Evidence

Review all code that constructs paths from request data or file metadata.

---

## 19. Threat 11 — Cross-Site Request Forgery (CSRF)

**Initial risk:** Depends on the authentication mechanism  
**Affected assets:** Account settings, private resources, administrative actions.

### Attack Scenario

A malicious website attempts to cause a user's browser to submit an authenticated state-changing request.

### Potential Impact

- Unauthorized changes performed with the victim's session.
- Unintended account or content operations.

### Required Controls

- Assess whether authentication cookies are automatically attached to cross-site requests.
- Configure cookie attributes appropriately.
- Implement suitable CSRF defenses where required.
- Validate state-changing requests.
- Avoid assuming CORS alone prevents CSRF.
- Test the actual deployed cookie and origin configuration.

### Verification Evidence

Review authentication transmission, cookie settings, state-changing routes, and CSRF defenses.

---

## 20. Threat 12 — Rate Abuse and Resource Exhaustion

**Initial risk:** Medium to High  
**Affected assets:** API availability, database capacity, file processing.

### Attack Scenario

An attacker sends excessive requests, repeated login attempts, expensive searches, or large uploads.

### Potential Impact

- Slow responses.
- Increased resource consumption.
- Temporary service disruption.
- Exhaustion of storage or processing capacity.

### Required Controls

- Apply suitable rate limits.
- Enforce request and upload-size limits.
- Bound expensive operations.
- Validate pagination and search parameters.
- Avoid unnecessary database queries.
- Monitor repeated failures where supported.
- Document limitations of in-memory controls.

### Verification Evidence

Review configured limits and run controlled tests within an authorized environment.

---

## 21. Threat 13 — Cross-Origin Misconfiguration

**Initial risk:** Medium to High depending on deployment  
**Affected assets:** Authenticated browser requests and protected API data.

### Attack Scenario

An overly permissive CORS policy allows an unintended origin to interact with the API in ways not intended by the application.

### Potential Impact

- Unintended cross-origin access.
- Exposure of responses to untrusted origins when combined with other conditions.
- Increased risk from incorrect credentialed-request configuration.

### Required Controls

- Define approved frontend origins.
- Avoid wildcard origins for credentialed requests.
- Use environment-appropriate configuration.
- Review allowed methods and headers.
- Treat CORS as a browser policy rather than an authentication mechanism.
- Test production configuration.

### Verification Evidence

Inspect CORS middleware and test responses from approved and unapproved origins.

---

## 22. Threat 14 — Secret or Configuration Exposure

**Initial risk:** High  
**Affected assets:** Database, authentication system, application infrastructure.

### Attack Scenario

Credentials or secrets are committed to source control, exposed in frontend assets, printed in logs, or included in public error responses.

### Potential Impact

- Database compromise.
- Authentication forgery or compromise.
- Unauthorized access to connected services.

### Required Controls

- Keep secrets out of committed source.
- Use environment configuration or an appropriate secret-management mechanism.
- Validate required configuration at startup.
- Use placeholders in example files.
- Avoid printing secret values.
- Rotate compromised credentials promptly.
- Review repository history if a secret has been committed.

### Verification Evidence

Inspect configuration files, Git tracking rules, startup behavior, and logging.

---

## 23. Threat 15 — Dependency or Supply-Chain Compromise

**Initial risk:** Medium  
**Affected assets:** Application runtime, user data, development environment.

### Attack Scenario

A vulnerable or compromised dependency introduces unsafe behavior into the application.

### Potential Impact

- Remote code execution under applicable conditions.
- Data exposure.
- Authentication compromise.
- Unexpected runtime behavior.

### Required Controls

- Maintain package manifests and lockfiles.
- Review dependency advisories.
- Evaluate updates before adoption.
- Remove unused dependencies when safe.
- Confirm package provenance and compatibility.
- Review dependencies used for authentication, SQL access, uploads, and PDF processing.
- Keep development tools and production dependencies appropriately separated.

### Verification Evidence

Review installed dependencies, audit results, lockfiles, and dependency-update history.

---

## 24. Threat 16 — Sensitive Information in Logs or Errors

**Initial risk:** Medium to High  
**Affected assets:** Credentials, personal information, private documents, internal configuration.

### Attack Scenario

Application logs or error responses contain passwords, authentication tokens, database errors, private document paths, or other sensitive information.

### Potential Impact

- Credential disclosure.
- Increased attacker knowledge of internal structure.
- Privacy violations.
- Wider impact if logs are exposed.

### Required Controls

- Use safe public error messages.
- Keep diagnostic details server-side.
- Redact secrets and sensitive values.
- Restrict log access.
- Define suitable log retention.
- Avoid recording full private document contents.
- Review error paths as well as normal request paths.

### Verification Evidence

Inspect logger configuration, error middleware, and representative logs from controlled tests.

---

## 25. Threat 17 — Data Loss or Corruption

**Initial risk:** Medium to High  
**Affected assets:** Accounts, books, chapters, categories, private documents.

### Attack Scenario

A bug, unauthorized operation, database failure, or incomplete file operation causes data loss or inconsistent records.

### Potential Impact

- Lost content.
- Broken relationships.
- Inaccessible documents.
- Incorrect publication or visibility state.

### Required Controls

- Use database constraints.
- Apply transactions to operations requiring atomicity.
- Define deletion and archival rules.
- Handle file/database partial failures.
- Maintain protected backups.
- Document recovery procedures.
- Test restoration periodically where practical.

### Verification Evidence

Review schema constraints, transaction handling, deletion logic, backup configuration, and recovery tests.

---

## 26. Threat 18 — Insecure Deployment Configuration

**Initial risk:** High if production configuration is weak  
**Affected assets:** Application, database, credentials, user data.

### Attack Scenario

The application is deployed with debug behavior, insecure cookies, exposed database ports, incorrect CORS settings, or unsafe filesystem permissions.

### Potential Impact

- Unauthorized access.
- Information disclosure.
- Data compromise.
- Service disruption.

### Required Controls

- Use HTTPS in production.
- Protect database access.
- Review environment variables.
- Restrict filesystem permissions.
- Disable unsafe debugging behavior.
- Configure production cookies and CORS correctly.
- Protect uploads and backups.
- Follow the deployment checklist.
- Verify the deployed environment after release.

### Verification Evidence

Inspect actual deployment configuration and perform authorized post-deployment checks.

---

## 27. Threat Prioritization

The following initial priorities are recommendations and must be reassessed after implementation review.

| Priority | Threat Categories | Recommended Response |
|---|---|---|
| High | Broken access control, authentication bypass, SQL injection, private-document exposure, privilege escalation | Verify before release and remediate confirmed weaknesses |
| High | Credential or secret exposure, unsafe file handling, serious deployment misconfiguration | Investigate promptly and mitigate confirmed exposure |
| Medium to High | XSS, CSRF, path traversal, rate abuse, sensitive logging | Assess actual exposure and implement suitable controls |
| Medium | Dependency risks, data inconsistency, usability-related error handling | Review, test, and track remediation |
| Context-dependent | CORS, token revocation, upload processing, account recovery | Rate according to the implemented design and deployment |

These priorities are not the result of a completed penetration test.

---

## 28. Mitigation and Verification Workflow

For each confirmed security issue:

1. Assign a unique finding identifier.
2. Describe the affected component.
3. Record the attack scenario.
4. Estimate likelihood and impact.
5. Collect evidence.
6. Identify the root cause.
7. Define the remediation.
8. Implement the correction.
9. Execute relevant regression and security tests.
10. Record the outcome.
11. Document any remaining risk.
12. Obtain approval where required.

Do not close a finding merely because code was changed; verify that the intended behavior is restored.

---

## 29. Threat Register

Use this table to track findings from implementation review and testing.

| ID | Threat | Likelihood | Impact | Risk | Mitigation | Status |
|---|---|---|---|---|---|---|
| TM-001 | SQL injection | To assess | To assess | To assess | Parameterized queries and validation | Not Reviewed |
| TM-002 | Broken access control | To assess | To assess | To assess | Server-side authorization | Not Reviewed |
| TM-003 | Private-resource exposure | To assess | To assess | To assess | Ownership checks | Not Reviewed |
| TM-004 | Authentication bypass | To assess | To assess | To assess | Protected routes and credential validation | Not Reviewed |
| TM-005 | Privilege escalation | To assess | To assess | To assess | Trusted role assignment | Not Reviewed |
| TM-006 | XSS | To assess | To assess | To assess | Safe rendering and sanitization | Not Reviewed |
| TM-007 | Credential compromise | To assess | To assess | To assess | Secure password handling | Not Reviewed |
| TM-008 | Token or session theft | To assess | To assess | To assess | Secure credential lifecycle | Not Reviewed |
| TM-009 | Unsafe file upload | To assess | To assess | To assess | File validation and processing limits | Not Reviewed |
| TM-010 | Path traversal | To assess | To assess | To assess | Safe path handling | Not Reviewed |
| TM-011 | CSRF | To assess | To assess | To assess | Appropriate CSRF controls | Not Reviewed |
| TM-012 | Resource exhaustion | To assess | To assess | To assess | Rate and resource limits | Not Reviewed |
| TM-013 | CORS misconfiguration | To assess | To assess | To assess | Explicit origin policy | Not Reviewed |
| TM-014 | Secret exposure | To assess | To assess | To assess | Secret management and rotation | Not Reviewed |
| TM-015 | Dependency compromise | To assess | To assess | To assess | Dependency review | Not Reviewed |
| TM-016 | Sensitive logging | To assess | To assess | To assess | Redaction and access control | Not Reviewed |
| TM-017 | Data loss or corruption | To assess | To assess | To assess | Integrity, backups, and recovery | Not Reviewed |
| TM-018 | Deployment misconfiguration | To assess | To assess | To assess | Production security review | Not Reviewed |

Update likelihood, impact, risk, and status only when supported by evidence.

---

## 30. Security Testing Checklist

- [ ] Review public and protected API routes.
- [ ] Test authentication failures.
- [ ] Test role-based authorization.
- [ ] Test cross-user resource access.
- [ ] Review database query construction.
- [ ] Test relevant SQL-injection cases.
- [ ] Test safe rendering of user-controlled content.
- [ ] Review file-upload validation.
- [ ] Test private-document authorization.
- [ ] Review token and logout behavior.
- [ ] Review CORS and CSRF controls.
- [ ] Review rate limiting.
- [ ] Inspect error responses and logs.
- [ ] Review environment configuration.
- [ ] Review dependency security.
- [ ] Verify backup and recovery procedures.
- [ ] Record findings and retest remediations.

Only mark a test as passed after execution and review of the result.

---

## 31. Assumptions and Limitations

This threat model is based on the documented project scope and approved technology stack.

The following require confirmation:

- Exact authentication and session mechanism.
- Current route-level authorization.
- Actual database schema and query implementation.
- Private-document storage and access model.
- Upload limits and PDF-processing behavior.
- Configured rate limits.
- CORS and cookie settings.
- Production deployment topology.
- Existing security test coverage.
- Backup and restoration procedures.

No penetration test or independent security audit is implied by this document.

---

## 32. Related Documents

- `docs/02-requirements/SRS.md`
- `docs/02-requirements/non-functional-requirements.md`
- `docs/03-technical/architecture.md`
- `docs/03-technical/TRD.md`
- `docs/03-technical/api-specification.md`
- `docs/03-technical/database-design.md`
- `docs/05-security/authentication-authorization.md`
- `docs/05-security/security-checklist.md`
- `docs/05-security/security-design.md`
- `docs/security/README.md`
- `docs/security/sql-injection.md`
- `docs/security/xss.md`
- `docs/07-testing/security-testing.md`
- `docs/08-deployment/production-checklist.md`

---

## 33. Maintenance

Review this threat model when:

- New features are introduced.
- Authentication or authorization changes.
- Private-document handling changes.
- New dependencies are added.
- Database access patterns change.
- Deployment architecture changes.
- Security testing identifies a new vulnerability.
- A security incident occurs.

Keep the threat model aligned with the current architecture, verified implementation, and actual deployment environment.
