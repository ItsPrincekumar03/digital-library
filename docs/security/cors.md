# Cross-Origin Resource Sharing (CORS)

## 1. Purpose

This document defines Cross-Origin Resource Sharing (CORS) security requirements for the Digital Library application.

The application uses HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL in a monolithic architecture.

CORS is a browser security mechanism that controls whether a web page from one origin may make certain requests to a server on another origin.

**Implementation status:** This document describes configuration requirements and verification procedures. The actual allowed origins, HTTP methods, request headers, credentials policy, and middleware configuration must be verified against the current backend source code and deployment settings.

## 2. Scope

This document covers:

- Frontend-to-backend cross-origin requests.
- Allowed frontend origins.
- Permitted HTTP methods and headers.
- Credentialed requests.
- Cookie-based authentication considerations.
- CORS preflight requests.
- Error handling.
- Local development and production configuration.
- CORS security testing.

CORS does not replace authentication, authorization, input validation, or protection against cross-site request forgery.

## 3. Key Concepts

### Origin

An origin consists of a scheme, hostname, and port.

For example:

```text
http://localhost:5500
http://localhost:3000
```

These are different origins because their ports differ.

The following are also different origins:

```text
http://localhost:5500
https://localhost:5500
```

The scheme differs.

### Same-origin request

A request is same-origin when the requesting page and target URL share the same scheme, hostname, and port.

### Cross-origin request

A request is cross-origin when one or more of those origin components differ.

The browser may perform a CORS preflight request before sending certain cross-origin requests.

## 4. Security Objectives

The CORS configuration should:

1. Permit only the frontend origins that require access.
2. Avoid unrestricted cross-origin access to sensitive APIs.
3. Allow only the HTTP methods required by the application.
4. Allow only the request headers required by the application.
5. Configure credentialed requests deliberately.
6. Handle preflight requests correctly.
7. Keep development and production settings separate.
8. Avoid reflecting arbitrary request origins without validation.
9. Preserve authentication and authorization checks on the backend.
10. Avoid exposing internal server details through error responses.

## 5. Allowed Origins

The backend should use an explicit list of trusted frontend origins where practical.

Example development origins might include:

```text
http://localhost:5500
http://127.0.0.1:5500
```

These are examples only. The actual frontend development server may use a different port or origin.

Production should use the approved HTTPS frontend origin.

Requirements:

- Configure origins through an appropriate environment setting when practical.
- Match origins precisely.
- Do not assume that two different ports represent the same origin.
- Avoid accepting arbitrary origins.
- Do not use wildcard origin access when credentialed requests are required.
- Review allowed origins whenever the frontend deployment changes.

The actual allowed-origin list must match the current configuration.

## 6. Express.js Configuration

If the project uses the Express `cors` middleware, configuration should follow the installed library's supported API.

The following is an illustrative example, not a replacement for reviewing the current backend setup.

```javascript
const cors = require("cors");

const allowedOrigins = [
  "http://localhost:5500"
];

app.use(cors({
  origin: function (origin, callback) {
    // Requests without an Origin header may include non-browser clients.
    // Authentication and authorization must still be enforced separately.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Origin not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false
}));
```

Important considerations:

- Verify that the `cors` package is installed before using this example.
- Adjust the allowed methods to the actual API.
- Add only the headers the application requires.
- Set `credentials` according to the authentication design.
- If cookies are used cross-origin, configure credentialed requests and CSRF protection deliberately.
- Handle rejected origins through safe error handling.
- Confirm the middleware's position in the Express middleware stack.

The example uses `credentials: false` as a conservative default. It must be changed if the verified application design requires credentialed cross-origin cookies.

Requests without an `Origin` header are not automatically trusted. They must still pass the application's authentication and authorization controls.

## 7. Credentialed Requests

Credentialed cross-origin requests may include cookies or other browser-managed credentials.

If the application uses cookies for authentication and the frontend and backend are cross-origin, both client and server configuration may need to allow credentials.

Server-side requirements:

- Use an explicit trusted origin rather than `*`.
- Enable credentials only for origins that require them.
- Use appropriate cookie attributes.
- Review SameSite behavior.
- Apply CSRF protection where required.

Client-side example:

```javascript
fetch("https://api.example.com/api/v1/users/me", {
  method: "GET",
  credentials: "include"
});
```

The URL above is illustrative. Replace it with the application's actual API URL.

Do not enable credentialed requests simply because the frontend and backend are on different origins. First verify the authentication mechanism.

## 8. Authorization Header

If the application uses bearer-token authentication, requests may include an `Authorization` header.

Illustrative example:

```javascript
fetch("http://localhost:PORT/api/v1/REPLACE_WITH_ROUTE", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

The example must be adapted to the application's actual authentication mechanism.

The backend should allow the `Authorization` header only if it is required.

CORS permission to send an authorization header does not prove that the token is valid. Authentication middleware must verify the credential independently.

Avoid placing authentication tokens in URLs or logs.

## 9. Preflight Requests

A browser may send an `OPTIONS` request to determine whether a cross-origin request is permitted.

Preflight requests may ask about:

- The requested HTTP method.
- The requested headers.
- The requesting origin.

The backend should respond consistently with the configured CORS policy.

Requirements:

- Permit legitimate preflight requests.
- Allow only required methods and headers.
- Avoid authentication middleware configurations that incorrectly reject valid preflight requests.
- Do not treat successful preflight as authorization to access the resource.
- Confirm that actual requests still pass all applicable security checks.

Preflight behavior should be tested with the same frontend origin and request headers used by the application.

## 10. HTTP Methods and Headers

Allow only the methods and headers required by the implemented API.

Potential methods include:

- `GET`
- `POST`
- `PUT`
- `PATCH`
- `DELETE`
- `OPTIONS`

The application may not need all of these methods on every route.

Potential headers include:

- `Content-Type`
- `Authorization`

Other headers should be added only when required by the actual frontend or backend.

The allowed-method list does not grant permission to execute every listed operation. Route configuration and authorization middleware must independently restrict operations.

## 11. Development and Production

### Development

Development may require separate frontend origins for local tools or servers.

Requirements:

- Use the actual development origin.
- Avoid broad wildcard access as a substitute for correct configuration.
- Do not assume that a port change is harmless.
- Keep local secrets out of source control.
- Test the frontend against the intended backend URL.

### Production

Production configuration should:

- Permit only approved production origins.
- Use HTTPS.
- Avoid unnecessary development origins.
- Restrict credentialed access.
- Review proxy and deployment behavior.
- Keep configuration values outside committed source files when appropriate.

The actual production deployment model must be documented before finalizing the origin policy.

## 12. CORS and Authentication

CORS is enforced by browsers. It is not an access-control mechanism for every HTTP client.

A command-line tool, server-side client, or malicious script outside the browser's CORS enforcement model may still send requests to the API.

Therefore:

- Protected routes must enforce authentication.
- Restricted operations must enforce authorization.
- Private resources must enforce ownership checks.
- Input validation must be applied independently.
- CORS must not be used as the only protection for sensitive data.

A request from an allowed origin must not automatically be treated as a trusted or authorized user.

## 13. CORS and CSRF

Cross-site request forgery (CSRF) is relevant when browsers automatically attach authentication credentials, particularly cookies.

If the application uses cookie-based authentication:

- Review SameSite cookie attributes.
- Determine whether CSRF tokens or another appropriate defense are needed.
- Validate request origins or referers where appropriate as an additional control.
- Restrict credentialed CORS access to trusted origins.
- Avoid unsafe state-changing operations through `GET` requests.

CORS alone should not be treated as a complete CSRF defense.

If the application uses a different authentication mechanism, evaluate the relevant CSRF risks for that design.

## 14. Error Handling

CORS-related errors should be handled consistently.

The backend should avoid returning:

- Stack traces.
- Internal filesystem paths.
- Environment secrets.
- Database credentials.
- Detailed implementation internals.

A rejected origin should not cause the server to crash.

Do not assume that a CORS rejection always produces a readable JSON error in the browser. Browser CORS enforcement may hide the response from frontend JavaScript.

The actual error behavior should be verified using server logs and direct HTTP tests where appropriate.

## 15. Testing Requirements

Test the actual CORS configuration with the application's configured origins.

Recommended scenarios:

1. Request from an approved frontend origin.
2. Request from an unapproved origin.
3. Preflight request using a required HTTP method.
4. Preflight request using an allowed header.
5. Preflight request using a disallowed header.
6. Credentialed request, if supported.
7. Authentication header request, if supported.
8. Request to a public endpoint.
9. Request to a protected endpoint without credentials.
10. Request to a protected endpoint with invalid credentials.
11. Request using the production origin configuration.
12. Verify that the backend continues to enforce authorization.
13. Verify that invalid origins do not crash the application.

Record the origin, method, headers, expected result, actual result, and test evidence.

Do not report a test as passed until it has been executed.

## 16. Manual Testing with PowerShell

Use the actual backend port and configured frontend origin.

Illustrative preflight request:

```powershell
$apiUrl = "http://localhost:PORT/api/v1/REPLACE_WITH_ROUTE"
$origin = "http://localhost:5500"

Invoke-WebRequest `
    -Method Options `
    -Uri $apiUrl `
    -Headers @{
        Origin = $origin
        "Access-Control-Request-Method" = "GET"
        "Access-Control-Request-Headers" = "content-type"
    }
```

Replace the placeholders with verified values.

Inspect the response headers for the expected CORS policy. A successful PowerShell request does not by itself prove that a browser will accept every cross-origin request.

## 17. Implementation Verification Checklist

- [ ] Actual CORS middleware and package version verified.
- [ ] Allowed frontend origins identified.
- [ ] Development and production policies separated.
- [ ] Allowed methods match implemented requirements.
- [ ] Allowed headers match actual frontend requests.
- [ ] Credentialed-request policy verified.
- [ ] Preflight behavior verified.
- [ ] Authentication remains enforced independently.
- [ ] Authorization remains enforced independently.
- [ ] CSRF risks reviewed for cookie-based authentication.
- [ ] Rejected origins are handled safely.
- [ ] Relevant CORS tests executed.

## 18. Related Documentation

- `authentication.md`
- `authorization.md`
- `environment.md`
- `error-handling.md`
- `validation.md`
- `../api/auth.md`
- `../api/README.md`
- `../03-technical/architecture.md`
- `../03-technical/api-specification.md`
- `../05-security/security-design.md`
- `../07-testing/security-testing.md`

## 19. Maintenance

Update this document whenever frontend origins, API deployment URLs, authentication mechanisms, cookie settings, allowed headers, or middleware configuration changes.

Keep documented CORS behavior aligned with the current Express configuration and test evidence.
