# Cross-Site Scripting (XSS) Prevention

## 1. Purpose

This document defines security requirements for preventing Cross-Site Scripting (XSS) vulnerabilities in the Digital Library application.

The project uses HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL in a monolithic architecture.

XSS occurs when an application handles untrusted content in a way that allows it to execute as browser-side code. Attackers may attempt to exploit user-controlled content such as book titles, descriptions, author names, chapter text, profile information, or search results.

**Implementation status:** This document specifies security requirements and verification criteria. Actual protections must be confirmed by inspecting the current frontend, backend, templates, and response handling.

## 2. Scope

These requirements apply to:

- User registration and profile data.
- Book titles and descriptions.
- Author names and biographies.
- Category names and descriptions.
- Chapter titles and content.
- Search results and filters.
- Administrative interfaces.
- Private-library metadata.
- API responses rendered by the frontend.
- Error messages and notification components.
- Uploaded or imported content, where supported.

All user-controlled content must be treated as untrusted, including content stored in the database or received from an otherwise authenticated user.

## 3. Types of XSS

### 3.1 Stored XSS

Stored XSS occurs when malicious content is saved and later rendered to users.

Example attack input:

```html
<script>alert('XSS')</script>
```

Potentially affected areas include book descriptions, chapter content, and profile information.

Storing a string in MySQL does not make it safe to display.

### 3.2 Reflected XSS

Reflected XSS occurs when untrusted request data is returned in a response and interpreted as executable content.

Potential sources include search terms, query parameters, and error messages.

### 3.3 DOM-Based XSS

DOM-based XSS occurs when frontend JavaScript places untrusted data into the page using unsafe DOM operations.

Potentially dangerous operations include assigning untrusted values to `innerHTML` or using `document.write()` with attacker-controlled content.

## 4. Core Security Principles

The application should:

1. Treat all external and user-controlled content as untrusted.
2. Prefer safe DOM APIs for rendering text.
3. Apply context-appropriate output encoding.
4. Avoid inserting untrusted strings as HTML.
5. Sanitize HTML only when rich HTML is an intentional feature.
6. Validate inputs on the backend.
7. Use Content Security Policy as a defense-in-depth measure.
8. Keep frontend dependencies and browser-facing code appropriately maintained.
9. Avoid exposing sensitive information in error messages.
10. Test security behavior for every relevant content-rendering path.

Input validation is useful but does not replace output encoding or sanitization.

## 5. Safe DOM Rendering

When displaying ordinary text, use APIs that treat the value as text rather than HTML.

Preferred approach:

```javascript
const titleElement = document.createElement("h2");
titleElement.textContent = book.title;
container.appendChild(titleElement);
```

Avoid:

```javascript
container.innerHTML = book.title;
```

The second example can interpret HTML contained in `book.title`.

Additional requirements:

- Prefer `textContent` for plain text.
- Use `createElement()` to construct DOM elements.
- Set form values through appropriate element properties.
- Avoid dynamically constructing HTML strings from untrusted values.
- Do not assume API responses are safe merely because they originate from the application's backend.

If an HTML insertion operation is genuinely necessary, use a reviewed sanitization approach appropriate to the supported content.

## 6. Context-Specific Output Handling

Encoding must match the context in which data is used.

| Output context | Required approach |
|---|---|
| HTML text | Use safe text rendering or HTML-context encoding |
| HTML attribute | Use safe DOM properties or correct attribute-context handling |
| URL | Validate allowed schemes and destinations |
| JavaScript | Avoid inserting untrusted data into executable JavaScript |
| CSS | Avoid constructing CSS declarations from untrusted input |
| Rich HTML | Apply a maintained, allowlist-based HTML sanitizer |

Encoding suitable for one context may be insufficient in another.

Do not create executable JavaScript by concatenating user-controlled values into script strings.

## 7. Rich Text and Chapter Content

The Digital Library may contain book descriptions, chapter text, and other reading content.

If the application supports plain text:

- Render content as text.
- Preserve intended line breaks through safe rendering techniques.
- Do not interpret user-provided markup as HTML.

If rich HTML is intentionally supported:

- Define the exact permitted HTML elements and attributes.
- Use a maintained HTML sanitization library appropriate to the execution environment.
- Remove scripts, event-handler attributes, and unsafe URL schemes.
- Reject or remove unsafe embedded content.
- Test sanitized output in the actual browser rendering path.
- Keep the sanitizer configuration consistent across relevant entry points.

Do not introduce rich HTML support merely to make formatting easier without considering its security implications.

## 8. URL and Link Safety

User-controlled links must not be inserted into clickable elements without appropriate validation.

Requirements:

- Allow only approved URL schemes.
- Reject unsafe schemes such as `javascript:`.
- Define whether external links are supported.
- Use safe DOM properties to assign validated destinations.
- Consider the risks of opening external links in new tabs.
- Apply suitable `rel` attributes when opening external destinations in a new tab.
- Do not assume that escaping a URL makes its destination trustworthy.

The permitted URL schemes and link behavior should follow the application's requirements.

## 9. Backend Responsibilities

The Express.js backend should:

- Validate incoming data.
- Apply appropriate request-size limits.
- Avoid returning untrusted values inside executable HTML or JavaScript.
- Use consistent, safe error responses.
- Avoid exposing stack traces or internal details.
- Store data according to the approved content model.
- Keep authorization checks separate from content validation.

For JSON APIs, return correctly serialized JSON with the appropriate content type. The frontend must still render returned values safely.

JSON serialization alone does not make data safe for arbitrary HTML insertion.

## 10. Content Security Policy

Content Security Policy (CSP) can reduce the impact of certain XSS vulnerabilities.

The project has previously included Helmet in its backend setup, but the exact current CSP configuration must be verified in the source code.

Recommended review areas:

- `default-src`
- `script-src`
- `style-src`
- `img-src`
- `font-src`
- `connect-src`
- `object-src`
- `base-uri`
- `frame-ancestors`
- `form-action`

Recommended practices:

- Restrict resource sources to those actually required.
- Avoid enabling `unsafe-eval`.
- Avoid enabling `unsafe-inline` for scripts where practical.
- Prefer nonces or hashes when inline scripts are required and the framework supports them.
- Test the policy against legitimate application functionality.
- Consider report-only deployment when introducing a new policy to an existing application.

Do not copy a generic CSP into production without checking frontend behavior, required assets, and API connections.

## 11. Browser Security Headers

Review security headers provided by the Express.js application and Helmet configuration.

Relevant controls may include:

- Content Security Policy.
- `X-Content-Type-Options`.
- Clickjacking protections through CSP `frame-ancestors` or suitable alternatives.
- Referrer Policy.
- HTTPS-related settings for production.

Header configuration must be verified in the running application. The presence of Helmet in a dependency list does not prove that every header is enabled or correctly configured.

## 12. Error Messages and Notifications

Error messages may include values originating from requests or backend responses.

Requirements:

- Render messages as text.
- Avoid inserting server messages directly into `innerHTML`.
- Do not expose stack traces or database errors.
- Avoid including passwords, session tokens, or other sensitive data.
- Use consistent error-message handling.
- Do not trust content merely because it comes from an API error response.

## 13. Testing Strategy

Test all relevant places where user-controlled content is displayed.

### 13.1 Basic Payload Tests

Use harmless test strings such as:

```html
<script>alert('XSS')</script>
```

```html
<img src=x onerror=alert('XSS')>
```

```html
"><svg onload=alert('XSS')>
```

These are test inputs, not content that should execute. Use them only in the local development or authorized testing environment.

### 13.2 Test Scenarios

1. Enter an HTML-like string as a book title.
2. Enter a script-like string in a description.
3. Submit event-handler attributes in a text field.
4. Include unsafe markup in chapter content.
5. Search for strings containing HTML special characters.
6. Render API error messages containing special characters.
7. Attempt to provide an unsafe URL scheme.
8. Reload a page containing stored test content.
9. View the same content through different frontend components.
10. Confirm that the browser does not execute the supplied payload.

### 13.3 Expected Results

- Plain-text fields display payloads as text.
- No injected script or event handler executes.
- Unsafe URL schemes are rejected or safely handled.
- Stored content remains safe when revisited.
- The application continues to render legitimate content.
- Errors do not reveal internal implementation details.

A successful HTTP response does not prove that XSS prevention works. Verify the rendered browser behavior.

## 14. Manual Verification

Use the following process in the local development environment:

1. Identify an implemented endpoint that accepts a text field.
2. Submit a harmless XSS test string using the actual request schema.
3. Confirm the API response and stored value, where applicable.
4. Open the relevant frontend page.
5. Inspect the rendered DOM.
6. Confirm that the string is treated as text or safely sanitized.
7. Check the browser console for unexpected execution.
8. Repeat for other relevant content types.

Use the browser developer tools to inspect the actual DOM. Do not conclude that a value is safe solely because the API returns JSON.

## 15. Security Checklist

- [ ] Plain-text values are rendered using safe DOM APIs.
- [ ] Untrusted data is not inserted directly into `innerHTML`.
- [ ] `document.write()` is not used with untrusted data.
- [ ] Output handling is appropriate to each context.
- [ ] Rich HTML, if supported, is sanitized with an explicit allowlist.
- [ ] Unsafe URL schemes are rejected.
- [ ] Error messages are rendered safely.
- [ ] CSP is configured and tested.
- [ ] Security headers are verified in the running application.
- [ ] Stored-content rendering has been tested.
- [ ] Search results and query parameters have been tested.
- [ ] API responses are handled as untrusted data.
- [ ] Security tests have documented results.

## 16. Implementation Verification

Before marking an XSS control as implemented:

1. Locate the relevant frontend rendering code.
2. Identify the source of the displayed value.
3. Trace how the value reaches the DOM.
4. Confirm the encoding, safe DOM API, or sanitizer used.
5. Check relevant backend validation and response behavior.
6. Inspect the effective security headers.
7. Execute an appropriate regression test.
8. Record evidence and any remaining limitations.

Do not claim that the entire application is XSS-safe based on a single passing test.

## 17. Related Documentation

- `validation.md`
- `sql-injection.md`
- `error-handling.md`
- `cors.md`
- `environment.md`
- `../05-security/security-design.md`
- `../05-security/security-checklist.md`
- `../05-security/threat-model.md`
- `../07-testing/security-testing.md`
- `../07-testing/test-cases.md`
- `../03-technical/api-specification.md`

## 18. Maintenance

Review this document whenever frontend rendering logic, content formats, API responses, third-party dependencies, or security headers change.

Keep security claims aligned with the current source code and executed tests. Clearly distinguish planned controls from verified implementation.
