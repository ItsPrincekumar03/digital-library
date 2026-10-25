# Rate Limiting and Abuse Prevention

## 1. Purpose

This document defines rate-limiting and abuse-prevention requirements for the Digital Library application.

The project uses HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL within a monolithic architecture.

Rate limiting restricts how frequently a client can make requests during a defined period. It helps reduce brute-force attempts, automated abuse, excessive resource consumption, and accidental request overload.

**Implementation status:** This document describes security requirements and verification procedures. The actual rate-limiting package, configuration, storage mechanism, route coverage, and thresholds must be verified against the current backend.

## 2. Scope

This document covers:

- Login and registration endpoints.
- Password-related endpoints, if implemented.
- Public API endpoints.
- Search operations.
- Content creation and modification.
- File uploads, if supported.
- Private-library access.
- Request-size and resource-consumption limits.
- Rate-limit responses.
- Monitoring and testing.

## 3. Security Objectives

The application should:

1. Restrict excessive requests.
2. Protect authentication endpoints against brute-force attempts.
3. Reduce automated abuse.
4. Limit resource-intensive operations.
5. Return consistent responses when limits are exceeded.
6. Avoid blocking legitimate users unnecessarily.
7. Apply limits appropriate to each endpoint's risk.
8. Keep rate-limiting configuration outside hardcoded production assumptions where practical.
9. Avoid trusting spoofable client identifiers.
10. Test rate limits under controlled conditions.

Rate limiting is one layer of defense. It does not replace authentication, authorization, validation, or database security.

## 4. Rate-Limiting Concepts

### Request window

A request window defines the period during which requests are counted.

For example, a policy might permit a limited number of requests during a one-minute interval.

### Request limit

The maximum number of requests permitted under the selected policy.

### Rate-limit key

The identifier used to group requests, such as an IP address, authenticated user identifier, or a combination of signals.

### Rate-limit response

The response returned when a request exceeds its configured limit.

The exact algorithm and configuration depend on the selected middleware or implementation.

## 5. Endpoint Risk Categories

Different endpoints have different risk profiles.

| Endpoint category | Recommended approach |
|---|---|
| Login | Strict limit appropriate to authentication risk |
| Registration | Restrict automated account creation |
| Password reset | Strict limit, if implemented |
| Public catalogue browsing | Moderate limit based on expected usage |
| Search | Limit excessive or expensive queries |
| Content creation | Limit abusive repeated submissions |
| File uploads | Apply request-rate and file-size limits |
| Administrative operations | Apply suitable user and role controls |
| Health checks | Use a limit appropriate to monitoring requirements |

These are recommended categories, not confirmation that all listed endpoints exist.

## 6. Authentication Endpoint Protection

Login endpoints are frequent targets for automated password guessing.

Recommended controls include:

- Apply rate limits to repeated login attempts.
- Validate request structure.
- Limit request-body size.
- Use generic authentication failure messages where appropriate.
- Monitor repeated failures.
- Avoid permanent account lockout policies that attackers could abuse.
- Consider different limits for different authentication operations.
- Protect registration and recovery endpoints against automated abuse.

Rate limiting should not expose whether a particular account exists.

The actual login and registration paths must be verified before configuring route-specific limits.

## 7. Public API Protection

Public endpoints can also be abused through automated requests.

Examples include:

- Book catalogue retrieval.
- Category listing.
- Author listing.
- Search operations.
- Public book or chapter retrieval.

Recommended controls:

- Apply limits according to endpoint cost and expected traffic.
- Use pagination for collection endpoints.
- Validate query parameters.
- Restrict maximum page sizes.
- Avoid unnecessarily expensive database queries.
- Monitor repeated requests and abnormal traffic patterns.

Do not use the same threshold for every endpoint without considering its behavior and risk.

## 8. Resource-Intensive Operations

Some operations can consume more resources than ordinary read requests.

Potential examples include:

- Large file uploads.
- PDF parsing or processing.
- Complex searches.
- Bulk administrative operations.
- Expensive database queries.

Apply suitable limits to:

- Request frequency.
- Request-body size.
- File size.
- Processing time.
- Concurrent operations, where appropriate.
- Pagination and query complexity.

Rate limiting alone does not prevent a single oversized or computationally expensive request. Separate resource limits are also required.

## 9. Selecting a Rate-Limiting Key

The rate-limiting key should reflect the risk of the endpoint.

Potential keys include:

- Client IP address.
- Authenticated user identifier.
- A combination of user identity and IP address.

Important considerations:

- IP-based limits can affect multiple legitimate users behind the same network.
- User-based limits require a trustworthy authenticated identity.
- Anonymous requests may require IP-based limits.
- Client-supplied identity headers must not be trusted without appropriate validation.
- Reverse-proxy configuration can affect the IP address observed by Express.

Avoid trusting arbitrary forwarding headers from untrusted clients.

If the application runs behind a reverse proxy, configure Express proxy trust settings carefully. Incorrect configuration can allow clients to spoof IP addresses used for rate limiting.

## 10. Express.js Implementation

An Express application may use a maintained middleware package, such as `express-rate-limit`, if selected and installed.

The following example illustrates the concept. It is not confirmation that the package is installed or used by the current project.

```javascript
const rateLimit = require("express-rate-limit");

const exampleLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  }
});

// Apply only to the intended route group after reviewing
// the application's existing middleware configuration.
app.use("/api/v1", exampleLimiter);
```

This example permits up to 60 requests per minute under the configured limiter, subject to the installed package's behavior and counting rules.

The value is illustrative, not a recommended universal production threshold.

Before implementation:

- Verify the package and installed version.
- Confirm the supported option names.
- Select limits based on endpoint risk.
- Review the response format used by the existing API.
- Decide whether limits should be global or route-specific.
- Review the storage strategy for the deployment environment.

A broad global limiter should not be adopted without considering legitimate catalogue browsing, administrative workflows, and frontend request patterns.

## 11. Route-Specific Limits

Different route groups may require different policies.

For example, a project may define separate limits for authentication, search, uploads, and general API access.

Illustrative design:

```text
General API
    |
    +-- Public catalogue: usage-appropriate limit
    |
    +-- Search: stricter limit for expensive queries
    |
    +-- Authentication: strict abuse-prevention limit
    |
    +-- Uploads: request limit plus file-size limit
    |
    +-- Administrative actions: suitable per-user controls
```

The exact route names and thresholds must be determined from the actual API specification and observed usage.

Avoid unintentionally counting a single logical operation multiple times through overlapping middleware.

## 12. Storage and Multiple Server Instances

Rate-limiting state may be stored in memory or in a shared store.

### In-memory storage

Advantages:

- Simple to configure.
- Suitable for local development and some single-process deployments.

Limitations:

- State may reset when the process restarts.
- Multiple server instances may maintain separate counters.
- It may not provide consistent enforcement across a distributed deployment.

### Shared storage

A shared store may provide consistent rate-limit state across multiple application instances.

Its suitability depends on deployment complexity, availability requirements, and operational cost.

The project should not introduce additional infrastructure without a clear requirement. For a beginner-friendly monolithic deployment, a simpler approach may be appropriate initially.

The actual storage strategy must be documented accurately.

## 13. HTTP 429 Response

When a request exceeds the configured limit, the server should return `429 Too Many Requests` where appropriate.

Illustrative response:

```json
{
  "success": false,
  "message": "Too many requests. Please try again later."
}
```

The actual response structure must match the application's established API conventions.

Where supported, the server may provide rate-limit headers indicating the configured policy or remaining allowance.

A `Retry-After` header may help clients determine when to retry.

Do not reveal internal configuration or sensitive abuse-detection details unnecessarily.

## 14. Frontend Behavior

The frontend should handle rate-limit responses gracefully.

Recommended behavior:

- Display a clear message.
- Avoid immediately repeating a request that was rate-limited.
- Respect `Retry-After` when available.
- Prevent accidental duplicate form submissions.
- Disable repeated submission controls when appropriate.
- Avoid retry loops.
- Preserve user input when safe to do so.

Frontend controls improve usability but are not security controls. An attacker can bypass the browser interface and call the API directly.

## 15. Interaction with Authentication and Authorization

Rate limiting should complement the application's authentication and authorization controls.

Requirements:

- Protected routes must still require authentication.
- Administrative routes must still enforce permissions.
- Private resources must still enforce ownership.
- Rate-limit keys must not rely on untrusted role claims.
- Invalid credentials must not be accepted merely because the request is below the limit.
- Requests from an allowed CORS origin must still be subject to appropriate limits.

Rate limiting must never be treated as proof that a requester is trusted.

## 16. Monitoring and Logging

Monitoring should help identify excessive or abusive traffic without exposing sensitive information.

Potential signals include:

- Repeated login failures.
- Repeated `429` responses.
- Abnormally frequent search requests.
- Repeated oversized upload attempts.
- Unexpected request spikes.
- Repeated access-denial attempts.

Logging requirements:

- Never log passwords or password hashes.
- Never log full authentication tokens.
- Avoid logging unnecessary personal information.
- Protect access to operational logs.
- Avoid allowing untrusted log fields to create misleading entries.
- Define appropriate retention practices.

Do not automatically treat every rate-limited user as malicious. Legitimate users can exceed a limit accidentally.

## 17. Testing Requirements

Test the rate-limiting behavior of implemented endpoints.

Recommended scenarios:

1. Send requests below the configured threshold.
2. Exceed the threshold in a controlled test.
3. Confirm that the expected request is rejected.
4. Verify the response status is `429` where configured.
5. Verify the error response format.
6. Verify applicable rate-limit headers.
7. Test authentication endpoint limits.
8. Test limits for search or upload endpoints, if supported.
9. Confirm that legitimate users are not blocked unexpectedly.
10. Verify counters behave as expected after the request window.
11. Test behavior after a server restart when using in-memory storage.
12. Test behavior across multiple instances if the deployment uses them.
13. Verify reverse-proxy configuration when IP-based limits are used.
14. Confirm that rate limiting does not replace authentication or authorization.

Run these tests only in a safe environment. Avoid load testing production without explicit authorization and a controlled plan.

Record actual results and evidence. Do not mark unexecuted tests as passed.

## 18. Manual Testing with PowerShell

Use the actual API base URL and a verified endpoint.

Illustrative example:

```powershell
$baseUrl = "http://localhost:PORT/api/v1/REPLACE_WITH_ROUTE"

for ($i = 1; $i -le 10; $i++) {
    try {
        $response = Invoke-WebRequest `
            -Method Get `
            -Uri $baseUrl `
            -SkipHttpErrorCheck

        Write-Host "Request $i : HTTP $([int]$response.StatusCode)"
    }
    catch {
        Write-Host "Request $i failed: $($_.Exception.Message)"
    }
}
```

Replace the placeholders with the actual backend port and route.

The `-SkipHttpErrorCheck` parameter requires a compatible PowerShell version. If it is unavailable, handle HTTP errors through the `catch` block and inspect the response status using the available response object.

This test is useful only if the selected endpoint is covered by a rate limiter. A small test loop does not establish that all endpoints are protected.

## 19. Implementation Verification Checklist

- [ ] Actual rate-limiting package and version verified.
- [ ] Authentication endpoints have suitable limits.
- [ ] Public endpoints have appropriate policies.
- [ ] Resource-intensive operations have additional limits.
- [ ] Rate-limit keys use trustworthy information.
- [ ] Reverse-proxy settings are reviewed where applicable.
- [ ] Storage behavior is documented.
- [ ] `429` responses follow the API convention.
- [ ] Frontend behavior avoids uncontrolled retries.
- [ ] Sensitive information is excluded from logs.
- [ ] Relevant tests have been executed.

## 20. Related Documentation

- `authentication.md`
- `authorization.md`
- `password-security.md`
- `environment.md`
- `error-handling.md`
- `validation.md`
- `../api/auth.md`
- `../api/README.md`
- `../03-technical/api-specification.md`
- `../08-deployment/production-checklist.md`
- `../07-testing/security-testing.md`
- `../07-testing/test-cases.md`

## 21. Maintenance

Review this document whenever API routes, authentication workflows, upload behavior, deployment architecture, proxy settings, or rate-limiting configuration changes.

Keep the documented limits aligned with the actual implementation and executed tests.
