# Module 18: Authentication and Role-Permission Verification

## 1. Module Overview

- **Project:** Digital Library
- **Module:** 18 — Authentication and Role-Permission Verification
- **Status:** COMPLETED & VERIFIED
- **Owner:** Prince Kumar
- **Target Audience:** Digital Library Core Platform

---

## 2. Objectives & Scope

Module 18 audits, verifies, and hardens the authentication and role-based access control (RBAC) mechanisms of Digital Library. 

### Key Scope Items
1. **HttpOnly Cookie Authentication (D1):**
   - JWT token is delivered strictly as an `HttpOnly` cookie.
   - Response body for `/api/auth/login` does not return the raw JWT token.
   - Frontend `auth.js` does not store the token in `sessionStorage` or expose it to client scripts.
2. **Persistent Token Revocation (D2):**
   - Logout persists across backend server restarts.
   - Revoked tokens are recorded in the database table `revoked_tokens` using a SHA-256 hash.
   - Raw tokens are never stored in the database.
3. **Role Enforcement & Privilege Escalation Protection:**
   - Registration assigns the `USER` role by default.
   - Role injection attacks (e.g. attempting to pass `role: "ADMIN"` in registration body) are ignored.
   - Admin-only routes (e.g. `/api/auth/admin-check`) enforce `ADMIN` role with HTTP 403 Forbidden for standard users.
4. **Credential & Profile Sanitization:**
   - Profile responses (`/api/users/profile`) omit sensitive credential hashes (`password_hash`).

---

## 3. Implementation Details

### 3.1 Backend Controller & Middleware Changes
- `backend/src/controllers/auth.controller.js`:
  - Login delivers the JWT via `res.cookie('token', token, COOKIE_OPTIONS)` and omits `token` from `res.json()`.
  - Logout extracts the token, computes expiration, and calls `tokenBlacklist.revoke()`.
- `backend/src/middleware/auth.middleware.js`:
  - Authenticates incoming requests from cookie or `Authorization: Bearer` header.
  - Queries `tokenBlacklist.isRevoked(token)`.
- `backend/src/utils/tokenBlacklist.js`:
  - Persistent database-backed implementation using SHA-256 token hashing against `revoked_tokens`.
- `backend/scripts/migrate.js`:
  - Added incremental check/migration for `revoked_tokens` table.
- `database/migrations/020_create_revoked_tokens.sql`:
  - DDL for `revoked_tokens` table storing `token_hash CHAR(64) PRIMARY KEY`, `user_id`, `revoked_at`, and `expires_at`.

### 3.2 Frontend Client Changes
- `frontend/js/auth.js`:
  - Clears token from `sessionStorage` upon login and relies on browser cookie handling with `credentials: 'include'`.

---

## 4. Verification Evidence

### 4.1 Demo Accounts Verification
```sql
SELECT u.email, r.role_name 
FROM users u 
JOIN roles r ON r.role_id = u.role_id 
WHERE u.email IN ('demouser@example.com','demoadmin@exmaple.com');
```
**Result:**
- `demoadmin@exmaple.com` → `ADMIN`
- `demouser@example.com` → `USER`

### 4.2 Automated Test Suite Results (17/17 PASS)
1. Valid login returns 200: **PASS**
2. Login sets HttpOnly token cookie: **PASS**
3. Login body has no token (D1): **PASS**
4. Wrong password returns 401: **PASS**
5. Unknown user returns 401 with same message: **PASS**
6. /me with cookie returns 200: **PASS**
7. Logout returns 200: **PASS**
8. Revoked token is rejected (401): **PASS**
9. Malformed token returns 401: **PASS**
10. No credentials returns 401: **PASS**
11. USER on ADMIN route returns 403: **PASS**
12. ADMIN on ADMIN route returns 200: **PASS**
13. Registration returns 201: **PASS**
14. Injected role ignored: new user is USER: **PASS**
15. Duplicate registration returns 409: **PASS**
16. Own profile returns 200: **PASS**
17. Profile response has no password_hash: **PASS**

### 4.3 Persistent Logout Across Process Restart (Step 4)
- **Step 4d (Rejection in same process):** `401`
- **Step 4f (Rejection after backend server restart):** `401`
- **Revoked Tokens Hash Check:**
  - `revoked_count`: `>= 1`
  - `hash_length`: `64`
