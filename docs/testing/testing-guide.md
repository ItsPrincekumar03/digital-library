# Module 8 Testing Guide

The following testing and verification have been completed for Module 8 (Final Backend Integration, Testing & Stabilization):

## 1. Authentication & Authorization
- **Authentication**: Validated user registration, login, logout, and token retrieval via `/me`. Ensured that duplicate emails throw validation errors and bad passwords reject login gracefully.
- **Authorization**: Validated that `ADMIN` specific routes (like `/authors` creation and book archiving) correctly deny access to `USER` role accounts.

## 2. Profile Management
- Checked `/profile` retrieval and update.
- Checked password change endpoint with both valid and invalid current passwords.

## 3. Ownership Testing
- Verified that a user can update only the books they own.
- Verified that modifying another user's book results in a `403 Forbidden` response.

## 4. Input Validation & Error Handling
- Validated all endpoints use `express-validator` to intercept missing fields, badly formatted emails, or values out of bounds (e.g. `chapterNumber`).
- Confirmed the central error handler masks unhandled exception stack traces in production and properly returns structured JSON `{ success: false, message: ... }`.

## 5. Security & Rate Limiting
- **SQL Injection**: `mysql2` parameterized queries are strictly used. No raw string interpolation is present in SQL statements.
- **XSS**: Input validators trim data. The UI must render untrusted input safely.
- **Rate Limits**: Configured limiters for authentication endpoints and password changing endpoints to mitigate brute force attacks.
- **CORS & Headers**: `helmet` applies essential HTTP security headers. CORS restricts origins as defined in `.env`.

## 6. Postman Collection
A complete Postman collection is generated (`Digital Library API.postman_collection.json`) at the project root covering all endpoints grouped systematically.
