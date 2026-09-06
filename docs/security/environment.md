# Environment Variables

## What lives in .env
Database credentials (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME), the JWT signing secret and expiry (JWT_SECRET, JWT_EXPIRES_IN), the server port, and the allowed CORS origin (CORS_ORIGIN).

## What lives in .env.example
Only variable names, with empty or placeholder values. No real credentials, passwords, or secrets are ever committed to this file.

## Git exclusion
.env is listed in .gitignore at the project root and has never been committed. This was verified manually before every commit throughout the project by running git status and confirming .env does not appear in the list of tracked or staged files.

## No hardcoded secrets
No source file contains a hardcoded database password, JWT secret, or API key. Every secret is read through process.env, loaded via dotenv at startup in server.js.

## JWT secret strength
The JWT secret was generated using Node's crypto.randomBytes(48).toString(hex), producing a long random value rather than a guessable string.
