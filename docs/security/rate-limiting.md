# Rate Limiting

## Library
express-rate-limit, applied as Express middleware in backend/src/middleware/rateLimiter.js.

## Configured limiters
- authLimiter: 10 requests per 15 minutes per IP. Applied to POST /api/auth/register and POST /api/auth/login.
- passwordLimiter: 5 requests per 15 minutes per IP. Applied to PUT /api/users/change-password.

## Response when limited
A blocked request receives HTTP 429 with a JSON body: success: false and a message explaining that too many attempts were made and to try again later. Standard rate-limit headers (RateLimit-*) are included; legacy X-RateLimit-* headers are disabled.

## Rationale for these limits
The values are intentionally moderate for a student project: strict enough to demonstrate protection against brute-force login attempts and registration spam, without being so strict that normal manual testing during development gets blocked immediately.

## Testing performed
Twelve rapid login attempts with an invalid password were sent from the same IP. The first several returned 401 Invalid email or password as expected; after the configured threshold was reached, subsequent attempts returned 429 instead, confirming the limiter engages correctly.
