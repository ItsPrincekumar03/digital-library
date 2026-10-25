# Environment Configuration Security

## 1. Purpose

This document defines requirements for securely configuring the Digital Library application's development, testing, and production environments.

The project uses HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL in a monolithic architecture.

Environment configuration contains settings that control application behavior, database connections, authentication, logging, file storage, and deployment.

**Implementation status:** This document describes recommended configuration practices. Actual environment-variable names, configuration files, defaults, and deployment settings must be verified against the current codebase.

## 2. Scope

This document covers:

- Environment variables.
- Database connection settings.
- Authentication and session secrets.
- Server configuration.
- Frontend and backend URLs.
- CORS configuration.
- File-upload and storage settings.
- Logging and error reporting.
- Development and production separation.
- Secret management and rotation.

## 3. Security Principles

The application should follow these principles:

1. Never commit real secrets to source control.
2. Keep development, testing, and production configurations separate.
3. Validate required configuration at application startup.
4. Use strong, randomly generated secrets where required.
5. Restrict access to production credentials.
6. Avoid exposing environment values through API responses.
7. Never log passwords, tokens, or database credentials.
8. Use secure defaults.
9. Document required configuration without including real secret values.
10. Rotate compromised credentials promptly.

## 4. Environment Files

A Node.js application may use environment files such as `.env` for local development.

Example structure:

```text
digital-library/
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── src/
│   └── package.json
├── frontend/
├── database/
├── tests/
├── docs/
└── README.md
```

This is an illustrative structure. The actual repository may place environment files elsewhere.

### Requirements

- Keep real `.env` files out of Git.
- Commit only safe example configuration files.
- Do not put real passwords or secrets in `.env.example`.
- Restrict access to environment files on the operating system.
- Avoid duplicating secrets unnecessarily.
- Confirm which directory the application uses when loading configuration.

Check the current `.gitignore` before assuming environment files are excluded.

## 5. Example Environment Variables

The following names are illustrative and must be compared with the actual backend configuration.

```dotenv
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=3306
DB_NAME=digital_library
DB_USER=replace_with_local_database_user
DB_PASSWORD=replace_with_local_database_password

AUTH_SECRET=replace_with_a_strong_random_secret

FRONTEND_URL=http://localhost:5500
```

Do not copy placeholder values into a production environment.

The application may use different names, authentication mechanisms, ports, or configuration conventions. Do not introduce variables without updating the code that consumes them.

## 6. Database Credentials

Database credentials should be protected because they may provide access to user records and library content.

Requirements:

- Use a dedicated database account for the application.
- Grant only the privileges required by the application.
- Avoid using a database administrator account for routine application access.
- Keep passwords out of source code.
- Restrict access to production credentials.
- Use encrypted connections where required by the deployment environment.
- Rotate compromised credentials.
- Avoid printing connection strings containing passwords.

The database account should not have unnecessary privileges such as creating arbitrary users or changing server-wide configuration.

Actual database privileges must be reviewed against the application's deployment requirements.

## 7. Authentication Secrets

If the application uses signed tokens, sessions, or another secret-dependent authentication mechanism, protect the corresponding secrets.

Requirements:

- Generate strong, unpredictable secrets.
- Store secrets outside committed source files.
- Never return secrets through APIs.
- Never log complete tokens or session secrets.
- Restrict access to production configuration.
- Define a rotation procedure.
- Understand the impact of changing a secret on existing sessions or tokens.

Do not assume that the application uses a particular token-signing secret or session secret without checking the implementation.

## 8. Configuration Validation

Required configuration should be validated before the application begins accepting requests.

Recommended checks include:

- Required variables are present.
- Numeric settings contain valid numbers.
- Port values are valid.
- Database connection settings are complete.
- Authentication secrets meet the required policy.
- URLs use expected schemes and formats.
- Environment names are recognized.
- File-storage paths are valid and accessible.

Fail startup safely when essential configuration is missing or invalid.

Error messages may identify the missing variable name, but they must not reveal the variable's secret value.

## 9. Development, Testing, and Production

### Development

Development configuration should support local implementation and testing without exposing real production credentials.

Recommended practices:

- Use a dedicated local database.
- Use local-only credentials.
- Keep development secrets out of Git.
- Use local frontend and backend URLs.
- Avoid storing real user data unnecessarily.
- Keep test files and generated uploads separate from production data.

### Testing

Test configuration should isolate test data from development and production.

Recommended practices:

- Use a dedicated test database where practical.
- Avoid running destructive tests against production.
- Use test credentials and safe fixtures.
- Reset test data deliberately.
- Keep test secrets separate from production secrets.

### Production

Production configuration should:

- Use strong, unique credentials.
- Use HTTPS.
- Disable development-only behavior.
- Restrict database privileges.
- Limit filesystem access.
- Use approved frontend origins.
- Protect secret access.
- Apply secure logging and error handling.
- Use backups and an appropriate recovery process.

The actual deployment environment must be documented before treating these recommendations as configured controls.

## 10. Frontend Configuration

Frontend applications may need public configuration values, such as the backend API base URL.

Requirements:

- Expose only values intended to be public.
- Never embed database passwords in frontend code.
- Never embed private signing keys or server secrets in JavaScript files.
- Treat all browser-visible configuration as public.
- Keep the frontend API URL consistent with the deployed backend.
- Verify CORS settings when frontend and backend origins differ.

A secret included in a bundled JavaScript file is not protected merely because the source file was originally stored in an environment variable.

## 11. File Storage Configuration

If the application stores uploaded books, PDFs, or other files, storage settings must be protected.

Requirements:

- Use a defined storage location.
- Validate that the configured path is accessible.
- Avoid exposing internal filesystem paths to clients.
- Restrict write access to the required application process.
- Protect private files from direct public access.
- Define file-size and allowed-format policies.
- Monitor available disk space where appropriate.
- Back up important files and related database metadata consistently.

Do not assume that all uploads are public or private. Access rules must match the approved product design.

## 12. CORS and URL Configuration

The application may use environment configuration for trusted frontend origins.

Requirements:

- Use explicit allowed origins.
- Avoid wildcard origins when credentialed requests are required.
- Validate production URLs.
- Keep local development origins out of production unless specifically required.
- Do not treat CORS as a replacement for authentication.
- Apply appropriate CSRF protections when relevant to cookie-based authentication.

See `cors.md` for detailed CORS requirements.

## 13. Logging Configuration

Logging configuration should support troubleshooting without exposing sensitive information.

Requirements:

- Avoid logging passwords and password hashes.
- Avoid logging database credentials.
- Avoid logging complete authentication tokens.
- Restrict access to sensitive logs.
- Use appropriate log levels.
- Avoid returning stack traces to production clients.
- Ensure logs do not contain unnecessary personal information.
- Define log retention and access policies appropriate to the deployment.

Development logging may be more detailed than production logging, but secrets must remain protected in every environment.

## 14. Secret Rotation and Incident Response

When a secret is exposed or suspected to be compromised:

1. Identify the affected secret and systems.
2. Generate a replacement secret or credential.
3. Update the authorized environment configuration.
4. Restart or redeploy affected services where necessary.
5. Revoke or invalidate affected credentials when supported.
6. Review logs for suspicious activity.
7. Confirm that the replacement configuration works.
8. Remove exposed copies from active locations and address repository history where appropriate.
9. Document the incident and corrective actions.

Removing a secret from the latest source file does not guarantee that it has been removed from Git history, logs, backups, or other copies.

## 15. Configuration Error Handling

Configuration errors should be handled safely.

Examples include:

- Missing database credentials.
- Invalid database port.
- Missing authentication secrets.
- Invalid frontend URL.
- Unavailable file-storage directory.
- Unsupported environment name.

The application should fail safely when essential settings are invalid.

Do not log complete environment objects or dump every configuration value during startup.

Configuration diagnostics should reveal enough information to locate the problem without exposing secret values.

## 16. Testing Requirements

Test the configuration behavior in the environments used by the project.

Recommended scenarios:

1. Start the application with valid development configuration.
2. Verify that missing required settings are detected.
3. Verify that invalid numeric configuration is rejected.
4. Confirm that database connection failures are handled safely.
5. Confirm that secrets do not appear in API responses.
6. Confirm that secrets are not written to logs.
7. Verify that `.env` files containing real credentials are excluded from Git.
8. Confirm that example files contain placeholders rather than real secrets.
9. Verify the configured frontend origin.
10. Confirm that production configuration does not enable development-only behavior.
11. Verify that file-storage paths and permissions are appropriate.
12. Confirm that secret rotation can be performed using the documented procedure.

Record actual outcomes. Do not mark tests as passed without executing them.

## 17. Manual Verification with PowerShell

Run these checks from the project root.

Check whether the backend environment file exists:

```powershell
Test-Path -LiteralPath ".\backend\.env"
```

Check whether an example configuration exists:

```powershell
Test-Path -LiteralPath ".\backend\.env.example"
```

Check the ignore rules without displaying secret values:

```powershell
git check-ignore -v backend/.env
```

A nonzero result from `git check-ignore` may indicate that the path is not ignored. Review the repository's actual ignore rules before proceeding.

Check whether a file is tracked by Git:

```powershell
git ls-files --error-unmatch backend/.env
```

If Git reports the file as tracked, do not display or publish its contents. Remove it from tracking using an appropriate repository procedure, rotate any exposed credentials, and address repository history if necessary.

These commands verify file and Git state only; they do not establish that every application secret is secure.

## 18. Implementation Verification Checklist

- [ ] Actual environment-variable names documented.
- [ ] Real environment files excluded from source control.
- [ ] Example configuration contains safe placeholders.
- [ ] Database credentials are protected.
- [ ] Authentication secrets are protected.
- [ ] Required configuration is validated at startup.
- [ ] Development and production settings are separated.
- [ ] Frontend configuration contains no private secrets.
- [ ] CORS origins match the intended environment.
- [ ] File-storage permissions are reviewed.
- [ ] Logging does not expose sensitive values.
- [ ] Secret rotation procedure is documented.
- [ ] Relevant tests have been executed.

## 19. Related Documentation

- `authentication.md`
- `authorization.md`
- `cors.md`
- `error-handling.md`
- `password-security.md`
- `rate-limiting.md`
- `../api/README.md`
- `../03-technical/architecture.md`
- `../03-technical/database-design.md`
- `../08-deployment/environment-setup.md`
- `../08-deployment/production-checklist.md`
- `../07-testing/security-testing.md`

## 20. Maintenance

Update this document whenever environment-variable names, database credentials, authentication configuration, frontend URLs, file-storage settings, or deployment environments change.

Keep example configuration synchronized with the actual application while ensuring that real secrets never enter version control.
