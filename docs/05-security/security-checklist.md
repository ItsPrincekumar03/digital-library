# Digital Library — Security Checklist

**Document Version:** 1.0  
**Project:** Digital Library  
**Release Scope:** V1 and subsequent approved versions  
**Backend:** Node.js, Express.js  
**Database:** MySQL  
**Architecture:** Monolithic Web Application  
**Status:** Security Review Checklist

---

## 1. Purpose

This checklist provides a structured method for reviewing the security of Digital Library during development, testing, and deployment.

It covers authentication, authorization, input validation, database access, file handling, API security, configuration, error handling, logging, and release readiness.

This document defines items to verify. An unchecked item means that verification is still required; it does not automatically mean the implementation is insecure.

## 2. Checklist Status Definitions

Use the following status values when tracking security work:

| Status | Meaning |
|---|---|
| Not Reviewed | No review evidence has been recorded |
| In Progress | Review or remediation is underway |
| Pass | Evidence supports the requirement |
| Fail | A security weakness or requirement violation was identified |
| Not Applicable | The requirement does not apply, with justification |
| Blocked | Verification cannot proceed because a dependency is unavailable |

Do not mark a control as passed based only on documentation or an intention to implement it.

---

## 3. Authentication Security

- [ ] Confirm passwords are never stored in plaintext.
- [ ] Confirm the configured password-hashing mechanism is appropriate.
- [ ] Confirm password verification uses the stored password hash safely.
- [ ] Confirm authentication requests validate required fields.
- [ ] Confirm malformed credentials are rejected.
- [ ] Confirm invalid credentials produce safe responses.
- [ ] Confirm authentication secrets are not exposed in API responses.
- [ ] Confirm protected routes require valid authentication.
- [ ] Confirm token or session expiration behavior.
- [ ] Confirm logout follows the implemented authentication mechanism.
- [ ] Confirm any token-revocation mechanism behaves as documented.
- [ ] Confirm registration cannot assign an unauthorized administrator role.
- [ ] Confirm password-reset functionality is protected if implemented.
- [ ] Confirm authentication failures do not expose unnecessary account information.

**Evidence to record:** Relevant authentication code, configuration, and executed test results.

---

## 4. Authorization and Access Control

- [ ] Confirm the documented `USER` and `ADMIN` roles match the implementation.
- [ ] Confirm administrative operations enforce server-side role checks.
- [ ] Confirm client-supplied role values cannot elevate privileges.
- [ ] Confirm protected endpoints reject unauthenticated requests.
- [ ] Confirm authenticated users cannot perform unauthorized operations.
- [ ] Confirm resource-level permissions are enforced where required.
- [ ] Confirm private-resource ownership checks are applied consistently.
- [ ] Confirm users cannot access another user's private documents without permission.
- [ ] Confirm unauthorized update operations are rejected.
- [ ] Confirm unauthorized deletion operations are rejected.
- [ ] Confirm book and chapter visibility rules are enforced by the backend.
- [ ] Confirm direct API requests cannot bypass frontend restrictions.
- [ ] Confirm administrative access does not implicitly grant private-document access unless explicitly permitted.

**Evidence to record:** Route middleware, service-layer checks, ownership logic, and negative authorization tests.

---

## 5. Password and Account Security

- [ ] Confirm passwords and password hashes are not written to logs.
- [ ] Confirm password requirements are enforced server-side.
- [ ] Confirm password changes require appropriate authorization.
- [ ] Confirm account updates cannot modify protected fields without permission.
- [ ] Confirm duplicate-account handling is safe.
- [ ] Confirm sensitive account fields are excluded from public responses.
- [ ] Confirm account recovery is secure if implemented.
- [ ] Confirm administrative role changes are restricted.
- [ ] Confirm account status restrictions are enforced if supported.

Do not claim password recovery, account locking, or other account features are secure until their complete workflows have been reviewed.

---

## 6. API Security

- [ ] Confirm all protected routes use the required authentication middleware.
- [ ] Confirm authorization is applied to sensitive operations.
- [ ] Confirm request bodies are validated.
- [ ] Confirm query parameters are validated.
- [ ] Confirm path parameters and identifiers are validated.
- [ ] Confirm unsupported HTTP methods are handled appropriately.
- [ ] Confirm request-size limits are configured where appropriate.
- [ ] Confirm errors use consistent response structures.
- [ ] Confirm stack traces are not exposed in production responses.
- [ ] Confirm unexpected exceptions are handled centrally where appropriate.
- [ ] Confirm sensitive information is not placed in URLs.
- [ ] Confirm API versioning and route documentation match the actual implementation.

**Evidence to record:** Route definitions, middleware configuration, API contract, and request tests.

---

## 7. SQL Injection and Database Security

- [ ] Confirm untrusted values use parameterized SQL queries or equivalent safe database APIs.
- [ ] Confirm SQL is not built by unsafe concatenation of user-controlled values.
- [ ] Confirm dynamic identifiers are restricted to approved values.
- [ ] Confirm database credentials are stored outside committed source code.
- [ ] Confirm the database account uses appropriate privileges.
- [ ] Confirm database errors do not disclose SQL statements or credentials to clients.
- [ ] Confirm foreign keys and constraints protect relational integrity where required.
- [ ] Confirm multi-step database operations use transactions where necessary.
- [ ] Confirm database connections and failures are handled appropriately.
- [ ] Confirm sensitive data is not returned unnecessarily.
- [ ] Confirm backups and database access are appropriately protected.

Do not assume every repository uses a particular query library. Verify the actual database access implementation.

---

## 8. Input Validation

- [ ] Confirm required fields are validated on the server.
- [ ] Confirm string lengths are constrained where appropriate.
- [ ] Confirm identifiers use expected formats.
- [ ] Confirm numeric values have valid ranges.
- [ ] Confirm enum or status values are restricted to approved options.
- [ ] Confirm unexpected fields are handled according to the API contract.
- [ ] Confirm malformed JSON is handled safely.
- [ ] Confirm validation failures return appropriate status codes.
- [ ] Confirm validation errors do not disclose internal implementation details.
- [ ] Confirm validation is applied consistently across create, update, and delete workflows.

Client-side validation is useful for usability but must not replace server-side validation.

---

## 9. Cross-Site Scripting (XSS)

- [ ] Confirm user-controlled text is rendered as text rather than executable HTML.
- [ ] Confirm unsafe HTML insertion is avoided or securely controlled.
- [ ] Confirm book titles, descriptions, chapter content, and metadata are handled safely.
- [ ] Confirm uploaded-file metadata is not trusted as executable content.
- [ ] Confirm URL values are validated before being used in navigation or resource loading.
- [ ] Confirm security headers are configured appropriately.
- [ ] Confirm any permitted rich text has a suitable sanitization policy.
- [ ] Confirm stored content is tested for script-injection behavior.
- [ ] Confirm error messages do not render untrusted server responses as HTML.

**Evidence to record:** Relevant rendering code, header configuration, and executed XSS test cases.

---

## 10. File Upload Security

Apply these checks if the application supports uploads.

- [ ] Confirm only approved file types are accepted.
- [ ] Confirm file size limits are enforced on the server.
- [ ] Confirm file presence and upload errors are handled.
- [ ] Confirm MIME type checks are not treated as the only security control.
- [ ] Confirm filenames are generated or normalized safely.
- [ ] Confirm path traversal is prevented.
- [ ] Confirm uploaded files cannot overwrite unintended files.
- [ ] Confirm storage permissions are appropriately restricted.
- [ ] Confirm private files cannot be accessed through an unprotected public path.
- [ ] Confirm file access checks ownership or explicit permission.
- [ ] Confirm file deletion handles database and storage consistency.
- [ ] Confirm failed uploads do not leave uncontrolled partial files.
- [ ] Confirm file-processing libraries are maintained and compatible.
- [ ] Confirm unsupported or malformed PDFs are handled safely.

Record the actual allowed file types, limits, storage paths, and processing behavior from the implementation.

---

## 11. Private Library and Document Access

- [ ] Confirm private document listings are scoped to authorized users.
- [ ] Confirm opening a document requires authorization.
- [ ] Confirm downloading a document requires authorization where applicable.
- [ ] Confirm updating document metadata requires authorization.
- [ ] Confirm deleting a document requires authorization.
- [ ] Confirm guessed or copied document identifiers do not bypass ownership checks.
- [ ] Confirm private document paths are not exposed unnecessarily.
- [ ] Confirm administrative privileges follow the approved private-document policy.
- [ ] Confirm unauthorized access responses do not reveal sensitive resource information.
- [ ] Confirm document access is tested using different user accounts.

These checks apply only to private-document functionality included in the implementation.

---

## 12. CORS and CSRF

- [ ] Confirm allowed origins match the intended deployment.
- [ ] Confirm arbitrary origins are not allowed for credentialed requests.
- [ ] Confirm CORS configuration is environment-appropriate.
- [ ] Confirm CORS is not treated as an authentication mechanism.
- [ ] Confirm CSRF risk is assessed for cookie-authenticated requests.
- [ ] Confirm appropriate CSRF protections are used where required.
- [ ] Confirm cookie settings are consistent with the authentication design.
- [ ] Confirm production cookies use `Secure` over HTTPS where applicable.
- [ ] Confirm `HttpOnly` is set for cookies that do not require JavaScript access.
- [ ] Confirm `SameSite` settings are selected according to the application's request flow.

The correct controls depend on the actual cookie, token, and frontend-origin design.

---

## 13. Security Headers

- [ ] Confirm Helmet or the project's equivalent security-header configuration is reviewed.
- [ ] Confirm Content Security Policy is appropriate for the application.
- [ ] Confirm framing protections are configured.
- [ ] Confirm MIME-sniffing protections are configured.
- [ ] Confirm HTTPS-related headers are configured appropriately for production.
- [ ] Confirm headers do not conflict with required frontend functionality.
- [ ] Confirm production header behavior is tested in the deployed environment.

Do not enable a production header policy without checking its compatibility and deployment assumptions.

---

## 14. Rate Limiting and Abuse Prevention

- [ ] Confirm authentication endpoints have appropriate rate limits.
- [ ] Confirm expensive or abuse-prone endpoints are reviewed.
- [ ] Confirm upload endpoints have appropriate request and file limits.
- [ ] Confirm rate-limit responses are handled by the frontend.
- [ ] Confirm rate-limit configuration is appropriate for the deployment topology.
- [ ] Confirm any in-memory rate-limit state is understood across restarts and multiple instances.
- [ ] Confirm rate limiting does not unintentionally block normal use.

Record actual thresholds and implementation details only after verification.

---

## 15. Environment and Secret Management

- [ ] Confirm `.env` files containing secrets are excluded from Git.
- [ ] Confirm example environment files contain placeholders only.
- [ ] Confirm required configuration variables are documented.
- [ ] Confirm production secrets are not embedded in frontend assets.
- [ ] Confirm secrets are not committed in configuration files or test fixtures.
- [ ] Confirm startup behavior for missing required variables.
- [ ] Confirm database credentials use appropriate privileges.
- [ ] Confirm logs do not print secret values.
- [ ] Confirm deployment credentials are stored securely.
- [ ] Confirm exposed secrets can be rotated using a defined procedure.

If a secret is committed accidentally, removing it from the latest file alone may not be sufficient; the secret may need to be revoked and rotated.

---

## 16. Error Handling and Logging

- [ ] Confirm unexpected errors are handled safely.
- [ ] Confirm production responses do not expose stack traces.
- [ ] Confirm SQL errors are not returned directly to clients.
- [ ] Confirm authentication errors do not expose credentials.
- [ ] Confirm logs omit passwords, secrets, and unnecessary token data.
- [ ] Confirm useful diagnostic information remains available to maintainers.
- [ ] Confirm failed database operations are not reported as successful.
- [ ] Confirm file-processing errors are handled consistently.
- [ ] Confirm error responses follow the documented API contract.

---

## 17. Dependency Security

- [ ] Confirm application dependencies are recorded in the package manifest.
- [ ] Confirm the lockfile is maintained.
- [ ] Review dependency vulnerabilities using the project's supported audit workflow.
- [ ] Review significant dependency upgrades before applying them.
- [ ] Confirm dependencies are compatible with the supported Node.js version.
- [ ] Remove unused dependencies when safe to do so.
- [ ] Confirm package installation does not rely on undocumented local-only packages.
- [ ] Document unresolved dependency risks.

A clean dependency audit does not prove that the application itself is secure.

---

## 18. Database and Data Protection

- [ ] Confirm primary keys and foreign keys are appropriate.
- [ ] Confirm unique constraints protect values that must be unique.
- [ ] Confirm destructive operations follow approved relationship rules.
- [ ] Confirm transactions are used for operations requiring atomicity.
- [ ] Confirm private user data is returned only to authorized requesters.
- [ ] Confirm database backups are protected.
- [ ] Confirm restore procedures are documented and tested.
- [ ] Confirm production data is not copied into development environments without appropriate safeguards.
- [ ] Confirm retention and deletion rules are documented where required.

---

## 19. Deployment Security

- [ ] Confirm production uses HTTPS.
- [ ] Confirm the application does not run with unnecessary operating-system privileges.
- [ ] Confirm the MySQL service is not exposed unnecessarily to the public internet.
- [ ] Confirm production environment variables are configured securely.
- [ ] Confirm upload storage is persistent where required.
- [ ] Confirm directory and file permissions are appropriate.
- [ ] Confirm debug behavior is disabled or restricted in production.
- [ ] Confirm error pages do not expose internal information.
- [ ] Confirm database backups and recovery procedures are available.
- [ ] Confirm deployment and rollback procedures are documented.
- [ ] Confirm production configuration is reviewed after deployment.

---

## 20. Security Testing

- [ ] Test missing authentication.
- [ ] Test invalid and expired credentials.
- [ ] Test unauthorized administrative operations.
- [ ] Test cross-user private-document access.
- [ ] Test invalid identifiers and malformed request data.
- [ ] Test SQL-injection payloads safely in a controlled environment.
- [ ] Test XSS payload handling in relevant text fields.
- [ ] Test upload size and file-type restrictions.
- [ ] Test path traversal protections where file paths are involved.
- [ ] Test rate limiting where configured.
- [ ] Test safe error responses.
- [ ] Test logout and revocation behavior.
- [ ] Test relevant security headers.
- [ ] Record the actual result and supporting evidence for each test.

Security testing must be performed only against systems and data the project team is authorized to test.

---

## 21. Release Security Gate

Before a release is considered ready, the team should:

1. Review all security checklist items relevant to the release.
2. Resolve critical and high-risk findings.
3. Document accepted residual risks and their rationale.
4. Confirm authentication and authorization tests.
5. Confirm private-resource protection.
6. Review environment configuration and secrets.
7. Review dependencies and known vulnerabilities.
8. Confirm deployment and recovery procedures.
9. Record actual test results.
10. Obtain the required project approval.

A completed checklist is evidence of review only when supported by actual verification.

---

## 22. Security Finding Register

Record discovered issues using this format:

| ID | Finding | Severity | Affected Component | Evidence | Remediation | Status |
|---|---|---|---|---|---|---|
| SEC-001 | To be recorded | TBD | TBD | TBD | TBD | Not Reviewed |

Use one row per finding. Do not leave a known security weakness undocumented.

---

## 23. Related Documents

- `docs/02-requirements/non-functional-requirements.md`
- `docs/03-technical/architecture.md`
- `docs/03-technical/TRD.md`
- `docs/03-technical/api-specification.md`
- `docs/03-technical/database-design.md`
- `docs/05-security/authentication-authorization.md`
- `docs/05-security/security-design.md`
- `docs/05-security/threat-model.md`
- `docs/security/README.md`
- `docs/security/authentication.md`
- `docs/security/authorization.md`
- `docs/security/sql-injection.md`
- `docs/security/xss.md`
- `docs/07-testing/security-testing.md`
- `docs/08-deployment/production-checklist.md`

---

## 24. Maintenance

Review this checklist when:

- Authentication or authorization behavior changes.
- New API endpoints are introduced.
- File upload or private-document handling changes.
- Database schema or access patterns change.
- Dependencies are added or upgraded.
- Deployment configuration changes.
- Security tests identify new weaknesses.
- A release candidate is prepared.

Security status must be based on current evidence, not assumptions or outdated test results.
