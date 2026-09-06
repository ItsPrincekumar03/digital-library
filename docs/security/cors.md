# CORS

## Configuration
CORS is configured explicitly in app.js using the cors package, rather than left at Express defaults:

origin: process.env.CORS_ORIGIN or http://localhost:3000 as a fallback
credentials: true

## Why explicit configuration matters
Because this API uses cookies for authentication (credentials: true), a wildcard origin (*) is not permitted by browsers when credentials are involved, and would be a security risk if it were. Restricting origin to a single configured value ensures only the intended frontend can make authenticated cross-origin requests with cookies attached.

## Environment-based configuration
The allowed origin is read from CORS_ORIGIN in .env, so the production frontend URL can be configured without touching code. In development it defaults to http://localhost:3000 to keep local frontend development working out of the box.

## Future adjustment
When the project is deployed, CORS_ORIGIN must be set to the real deployed frontend URL (or a comma separated list handled with a small code change) rather than left at the localhost default.
