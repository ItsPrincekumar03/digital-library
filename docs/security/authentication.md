# Authentication

## Method
JSON Web Tokens (JWT) stored in an httpOnly cookie named token.

## Registration
- Endpoint: POST /api/auth/register
- Password is hashed with bcrypt (10 salt rounds) before storage.
- Plaintext passwords are never stored or logged.
- New accounts are assigned the USER role by default.
- Duplicate emails are rejected with 409.

## Login
- Endpoint: POST /api/auth/login
- Credentials are verified against the bcrypt hash.
- On success, a JWT is signed with the user id and role, then set as an httpOnly, sameSite=lax cookie.
- Failed login due to wrong password and failed login due to unknown email return the identical message Invalid email or password, to avoid revealing which emails are registered.
- Disabled accounts (is_active = 0) are rejected with 403.

## Logout
- Endpoint: POST /api/auth/logout
- The current token is added to an in-memory blacklist and the cookie is cleared.
- Limitation: the blacklist is in-memory only, so it resets on server restart. This is acceptable for a student project; a production system would use Redis or a database table instead.

## Session verification
- Middleware: auth.middleware.js
- Reads the token cookie, verifies the JWT signature and expiry, checks the blacklist, and re-fetches the user from the database on every request. This means a disabled account is rejected immediately, even if its token has not expired.

## Rate limiting
See rate-limiting.md. Login and registration are both rate limited per IP.
