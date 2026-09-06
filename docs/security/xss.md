# XSS Protection

## API-level posture
This backend is a pure JSON API. It never renders HTML from stored data on the server, so classic server-side reflected or stored XSS through HTML templating does not apply here. The risk moves to whichever frontend eventually consumes this API.

## What is done on the backend
- helmet() is applied globally in app.js, which sets a conservative set of HTTP security headers including X-Content-Type-Options: nosniff and a restrictive default Content-Security-Policy, reducing the chance that a browser will execute an unexpected script even if malicious content were ever served.
- Free-text fields such as book description, chapter content, and author bio are stored and returned exactly as submitted. They are not currently HTML-sanitized on write, because doing so could legitimately damage book or chapter content (for example stripping characters like less-than signs from a story). This is a deliberate tradeoff for this module.
- Error messages never reflect raw user input back into the response. Validation errors return a fixed field name and a fixed message defined in the validator, not the value the user submitted.

## Responsibility handed to the frontend
Any frontend that renders book/chapter/author content must escape it before inserting it into the DOM (for example using a framework's default text-binding rather than innerHTML, or a sanitization library if HTML formatting is ever supported). This requirement is documented here so later frontend modules build on this assumption rather than trusting API responses as safe HTML.

## Testing performed
Fields such as title, description, bio, and chapter content were submitted with values like a script tag containing alert(1), and with event-handler attributes such as onerror. In every case the API stored and returned the string unchanged as plain text data. No script executed anywhere in the backend, because the backend never interprets this data as HTML.
