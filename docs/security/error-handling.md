# Error Handling

## Centralized handler
All errors flow through a single Express error-handling middleware, backend/src/middleware/errorHandler.js, registered last in app.js so every route benefits from it.

## Status codes
Errors carry an explicit status property set by the service layer (for example 400 for validation, 401 for authentication failures, 403 for authorization failures, 404 for missing resources, 409 for conflicts such as duplicate emails or category names). The handler reads this status and responds accordingly, defaulting to 500 when no status is set.

## Safe messages
For any error with status 500 or higher (an unexpected, unclassified failure), the handler returns a fixed generic message, An unexpected server error occurred, rather than the raw error message. This prevents raw MySQL error text, file paths, or internal exception details from ever reaching the client.

For expected errors below 500 (validation, authentication, authorization, not found, conflict), the handler returns the specific message set by the service, since these are intentional, safe-to-share messages such as Invalid email or password or Author not found.

## No stack traces
Stack traces are never included in any API response, in either the 4xx or 5xx case. They are only written to the server's own console log, and only for 500-level errors, via the shared logger utility.

## Logging behavior
Errors with status 500 or higher are logged at error level with the full error object, so real bugs are visible to whoever is running the server. Errors below 500 (expected validation or authorization failures) are logged at a lower info level with just the message, keeping the server log readable without hiding genuine problems.
