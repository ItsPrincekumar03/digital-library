# Digital Library — Environment Setup Guide

## 1. Purpose

This document describes how to prepare a development environment for the Digital Library project, configure the required software, connect the application to MySQL, and troubleshoot common setup problems.

The guide is intended for team members developing, testing, or preparing the application for deployment.

Commands and configuration examples must be adapted to the repository's actual package scripts, environment-variable names, database schema, and authentication implementation.

## 2. Project Overview

Digital Library is a BTech final-year web application built using the following approved technology stack:

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Backend:** Node.js and Express.js
- **Database:** MySQL
- **Architecture:** Monolithic application

Microservices are not part of the approved architecture.

### 2.1 Main project directories

The documented project structure includes:

```text
digital-library/
├── frontend/
├── backend/
├── database/
├── tests/
├── docs/
├── uploads/
└── README.md
```

Confirm the current repository structure before following path-specific instructions. Individual directories may contain additional subdirectories or may still be under development.

## 3. Prerequisites

Install and configure the software required by the current implementation.

| Requirement | Purpose |
|---|---|
| Windows or another supported operating system | Development environment |
| Node.js | Runs the backend |
| npm | Installs JavaScript dependencies |
| MySQL Server | Stores application data |
| Git | Source control and collaboration |
| Visual Studio Code or another editor | Code editing and debugging |
| Modern web browser | Frontend testing |
| PowerShell on Windows | Running commands and manual API tests |

Use the Node.js version supported by the repository and its dependencies. Do not assume that the newest available version is necessarily the compatible version.

## 4. Verify Installed Tools

Open PowerShell and check the installed versions:

```powershell
node --version
npm --version
git --version
```

Check whether the MySQL client is available:

```powershell
mysql --version
```

If a command is not recognized, verify that the software is installed and its executable directory is available through the system `PATH`.

The MySQL command-line client and the MySQL server are separate components. Confirm that the server is installed and running, not merely that the client command exists.

## 5. Obtain the Project

The documented GitHub repository is:

`https://github.com/ItsPrincekumar03/digital-library.git`

If the project has not already been cloned:

```powershell
git clone https://github.com/ItsPrincekumar03/digital-library.git
Set-Location .\digital-library
```

If the project is already present, navigate to the existing project root instead of cloning a second copy.

Confirm the current location and Git state:

```powershell
Get-Location
git status
git branch --show-current
```

Do not discard local changes simply to make the working tree clean.

## 6. Inspect the Repository Structure

From the project root:

```powershell
Get-ChildItem
Get-ChildItem .\backend
Get-ChildItem .\frontend
Get-ChildItem .\database
```

Some directories may not exist in a particular checkout. If a command reports that a path is missing, inspect the actual repository structure and update the instructions accordingly.

Review the backend package manifest:

```powershell
Get-Content .\backend\package.json
```

Identify:

- The project's configured start script.
- The test script, if one exists.
- Required dependencies.
- The required Node.js version, if specified.
- Any database setup or migration scripts.

Do not invent missing scripts or assume a command is supported without checking the manifest.

## 7. Install Backend Dependencies

Navigate to the backend directory:

```powershell
Set-Location .\backend
```

If `package-lock.json` exists and matches `package.json`, install dependencies reproducibly:

```powershell
npm ci
```

If the required lock file is absent, inspect the repository's dependency-management instructions before selecting another installation command.

Return to the project root when needed:

```powershell
Set-Location ..
```

Do not routinely update dependency versions while preparing an environment. Dependency changes should be reviewed and tested separately.

## 8. Configure Environment Variables

The backend may use a `.env` file for local configuration. Confirm the actual variable names by inspecting the backend configuration code and the project's environment example file, if available.

Potential configuration categories include:

| Configuration | Purpose |
|---|---|
| Runtime environment | Selects development or production behavior |
| Server port | Defines the application listening port |
| Database host | Identifies the MySQL server |
| Database port | Identifies the MySQL connection port |
| Database name | Selects the application database |
| Database username | Identifies the application database account |
| Database password | Authenticates the database connection |
| Authentication secret | Supports the implemented authentication mechanism |
| CORS origin | Restricts permitted browser origins |
| Upload path | Identifies storage for supported uploaded files |

These are configuration categories, not confirmation that the application uses any particular variable names.

### 8.1 Environment file safety

- Use the exact names expected by the application.
- Keep real credentials out of source control.
- Do not publish `.env` contents in screenshots or logs.
- Use separate credentials for development and deployment.
- Never commit production secrets.
- Avoid copying another developer's private credentials.
- Use strong, unique authentication secrets where applicable.

If the repository provides `.env.example`, inspect it and create a local `.env` using the documented values and placeholders.

Do not overwrite an existing `.env` file without reviewing it.

## 9. Configure MySQL

Ensure that MySQL Server is installed, running, and accessible to the development machine.

### 9.1 Create a development database

First inspect the existing database scripts and schema documentation. Select the database name expected by the application.

If the project requires a new database, a general example is:

```sql
CREATE DATABASE digital_library
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;
```

Execute this only when appropriate for the current setup. Do not recreate or overwrite an existing database without checking its contents.

### 9.2 Database account

Prefer a dedicated development account with only the permissions required by the application.

Avoid using a database administrator account for routine application requests.

The exact account-creation SQL and privileges depend on the application's setup and schema-management process.

### 9.3 Apply the schema

Review the available SQL scripts, migrations, or database setup instructions.

Apply the verified setup procedure and confirm that:

- Required tables exist.
- Primary keys and foreign keys are present where required.
- Unique constraints are applied correctly.
- Required indexes exist.
- The application account has suitable privileges.

Do not assume a particular schema filename or migration command exists until it has been inspected.

## 10. Start the Backend

Return to the backend directory:

```powershell
Set-Location .\backend
```

Inspect the `scripts` section of `package.json` and use the configured development or start command.

For example, if the manifest defines a development script named `dev`:

```powershell
npm run dev
```

This example is conditional. Use the actual script name defined by the project.

Check the terminal output for:

- Successful startup.
- The configured listening port.
- Database connection status, if logged.
- Missing environment variables.
- Dependency errors.
- MySQL connection failures.

Keep the server terminal open while testing unless the process is managed by another configured mechanism.

## 11. Verify Backend Availability

Use the actual health-check endpoint documented in the current API specification.

If the project confirms that `GET /api/v1/health` is still supported, it can be checked from another PowerShell window:

```powershell
Invoke-RestMethod -Method Get -Uri "http://localhost:3000/api/v1/health"
```

Replace the port with the actual configured port.

Do not assume that this endpoint or port exists in every version. Check the current routes and environment configuration first.

A successful health check confirms only what that endpoint tests. It does not automatically prove that authentication, database writes, file handling, or all application modules work correctly.

## 12. Frontend Setup

Inspect the `frontend/` directory to determine how the current frontend is served.

The application may serve frontend files through Express or use another documented static-serving arrangement.

For a Vanilla JavaScript frontend:

1. Identify the intended entry HTML file.
2. Confirm linked CSS and JavaScript files exist.
3. Check that relative asset paths resolve correctly.
4. Confirm API requests target the intended backend.
5. Inspect browser developer tools for console and network errors.
6. Verify that the frontend does not expose secrets.
7. Confirm protected content is not accessible through an unintended public file path.

Do not assume a frontend development server or build tool is required. HTML, CSS, and Vanilla JavaScript can be served as static files when the implementation is configured accordingly.

## 13. Manual API Testing with PowerShell

PowerShell's `Invoke-RestMethod` can be used for manual API testing without Postman.

A basic example:

```powershell
$baseUrl = "http://localhost:3000"

Invoke-RestMethod `
    -Method Get `
    -Uri "$baseUrl/api/v1/health"
```

Replace the sample endpoint with a verified route if the health route differs.

For JSON requests, use the actual request body defined by the API specification:

```powershell
$body = @{
    exampleField = "example-value"
} | ConvertTo-Json

Invoke-RestMethod `
    -Method Post `
    -Uri "$baseUrl/replace-with-verified-route" `
    -ContentType "application/json" `
    -Body $body
```

The field name and route above are placeholders, not real API definitions.

For authentication-protected endpoints, use the authentication mechanism actually implemented by the application. Do not paste live passwords, tokens, or cookies into shared documentation.

## 14. Running Tests

Inspect the project's test scripts before executing tests.

From the backend directory:

```powershell
Get-Content .\package.json
```

If a test script exists, run the configured command. For example:

```powershell
npm test
```

Do not assume this command is available unless `package.json` defines it.

Record:

- The tested commit.
- The environment.
- The command executed.
- The actual result.
- Any failures or blocked tests.
- The location of relevant evidence.

A successful installation or startup does not establish that the test suite passes.

## 15. Common Problems and Troubleshooting

### 15.1 `node` or `npm` is not recognized

Possible causes:

- Node.js is not installed.
- The terminal was opened before installation completed.
- The executable directory is missing from `PATH`.

Actions:

1. Confirm Node.js installation.
2. Open a new terminal.
3. Run `node --version` and `npm --version`.
4. Correct the system `PATH` if necessary.

### 15.2 MySQL connection fails

Possible causes:

- MySQL Server is stopped.
- Host or port is incorrect.
- Database name is wrong.
- Credentials are incorrect.
- The database account lacks required privileges.

Actions:

1. Confirm the MySQL server is running.
2. Check the actual environment-variable names.
3. Verify connectivity using an authorized account.
4. Review sanitized backend error messages.
5. Confirm that the target database exists.

Do not print database passwords while troubleshooting.

### 15.3 Environment variables are missing

Possible causes:

- The `.env` file is absent.
- Variable names do not match the application.
- The environment loader is not configured.
- The application was started from an unexpected working directory.

Actions:

1. Inspect the configuration module.
2. Confirm the required variable names.
3. Check how and when environment variables are loaded.
4. Restart the application after safe configuration changes.

### 15.4 Port already in use

Identify which process is listening on the configured port:

```powershell
Get-NetTCPConnection -LocalPort 3000 -State Listen -ErrorAction SilentlyContinue
```

Replace `3000` with the actual port.

Determine which process owns the port before taking action. Do not terminate an unknown process blindly.

### 15.5 Dependency installation fails

Actions:

1. Confirm the supported Node.js version.
2. Check whether the lock file matches the package manifest.
3. Read the complete npm error output.
4. Check network and package-registry availability.
5. Avoid deleting lock files as a first troubleshooting step.

### 15.6 API returns an unexpected error

Actions:

1. Confirm the backend is running.
2. Verify the route and HTTP method.
3. Check request headers and JSON structure.
4. Review sanitized server logs.
5. Confirm authentication and authorization requirements.
6. Inspect database constraints and validation rules.
7. Record the reproduction steps.

### 15.7 Frontend does not load correctly

Actions:

1. Confirm the configured frontend serving method.
2. Inspect browser console errors.
3. Check failed network requests.
4. Verify asset paths and API URLs.
5. Check CORS configuration if frontend and backend origins differ.

## 16. Safe Development Practices

- Use a dedicated development database.
- Never run destructive tests against production data.
- Keep secrets out of Git.
- Use parameterized database queries.
- Validate untrusted input on the backend.
- Enforce authorization on the server.
- Protect private file resources.
- Keep dependencies reviewed and reproducible.
- Avoid logging passwords, tokens, or sensitive documents.
- Back up important local work before risky database or Git operations.
- Document configuration changes that affect other team members.

## 17. Environment Setup Checklist

### Software and repository

- [ ] Required runtime is installed.
- [ ] npm and Git are available.
- [ ] MySQL Server is available.
- [ ] The repository has been obtained.
- [ ] The correct project directory is open.
- [ ] The backend package scripts have been inspected.

### Backend

- [ ] Dependencies are installed.
- [ ] Required environment variables are configured.
- [ ] Secrets are excluded from version control.
- [ ] The configured server command is known.
- [ ] The application starts without fatal errors.

### Database

- [ ] MySQL is running.
- [ ] The development database exists.
- [ ] The current schema has been applied.
- [ ] The application database account has suitable privileges.
- [ ] Database connectivity has been verified.

### Frontend and testing

- [ ] The frontend serving method is documented.
- [ ] Required assets load correctly.
- [ ] API URLs point to the correct environment.
- [ ] A verified health check has been tested, if available.
- [ ] Relevant API workflows have been tested.
- [ ] Test results and blockers have been recorded.

## 18. Team Onboarding

Each team member should be able to:

1. Obtain the approved repository revision.
2. Install the required dependencies.
3. configure their own local environment.
4. Run the application using the documented commands.
5. Connect to an isolated development database.
6. Execute relevant tests.
7. reproduce and document a reported defect.
8. Follow the team's Git workflow.
9. Avoid sharing private credentials.
10. Explain any local configuration differences.

Before assigning development tasks, confirm that all team members can start the project and access the resources required for their responsibilities.

## 19. Maintenance

Update this guide whenever:

- The supported Node.js version changes.
- Dependency-management instructions change.
- Database setup or schema migration procedures change.
- Required environment variables change.
- Startup or test scripts change.
- Frontend serving configuration changes.
- File-storage requirements change.
- Deployment or security requirements change.

Keep this document consistent with `deployment-plan.md`, `production-checklist.md`, `rollback-plan.md`, the technical architecture, and the project's security documentation.

This guide describes the intended setup process. Actual environment readiness must be established by following the steps and recording the observed results.
