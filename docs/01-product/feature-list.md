# Digital Library — Feature List and Implementation Inventory

**Project:** Digital Library  
**Project Type:** BTech Final-Year Project  
**Release:** Version 1 (V1)  
**Document Type:** Product Feature Inventory  
**Status:** Active — implementation status must be supported by current evidence

---

## 1. Purpose

This document provides a structured inventory of the features associated with the Digital Library application.

It identifies the major product areas, describes their capabilities, and records the implementation status assigned to each feature.

This inventory supports product planning, development tracking, testing, integration, and release preparation.

A feature listed in this document is not automatically confirmed to be working. Implementation and verification claims must be supported by the current local source code, database structure, and relevant test results.

---

## 2. Feature Status Definitions

| Status | Definition |
|---|---|
| VERIFIED | Implementation and relevant verification evidence have been checked. |
| IMPLEMENTED | Implementation exists, but complete verification or hardening may remain. |
| IN_PROGRESS | Work is actively underway. |
| PLANNED | Approved or intended work has not yet started. |
| FUTURE_SCOPE | Work has been deferred to a later release. |
| BLOCKED | Work cannot proceed because a documented dependency or issue remains unresolved. |
| NOT_TESTED | Available evidence does not establish that the feature has been tested. |

Use these statuses consistently across the feature inventory and development records.

Do not mark a feature VERIFIED solely because its code or API route exists.

---

## 3. Authentication and User Management

| Feature | Description | Existing Inventory Status |
|---|---|---|
| User registration | Create a user account through `POST /api/auth/register`. | VERIFIED |
| User login | Authenticate a user through `POST /api/auth/login` using an HttpOnly JWT cookie. | VERIFIED |
| Current-user verification | Retrieve the authenticated user's identity through `GET /api/auth/me`. | VERIFIED |
| Authentication rate limiting | Apply rate limiting to authentication operations. | VERIFIED |
| Logout | Invalidate the current token using the implemented in-memory blacklist and clear the authentication cookie. | VERIFIED |
| Profile retrieval | Retrieve the authenticated user's profile through `GET /api/users/profile`. | VERIFIED |
| Profile update | Update permitted profile details. | VERIFIED |
| Password change | Change a password after verifying the current password using the existing bcrypt-based implementation. | VERIFIED |
| Refresh token | Provide a refresh-token workflow. | FUTURE_SCOPE |

### Verification considerations

- Confirm successful registration and login.
- Confirm invalid credentials are rejected.
- Confirm protected endpoints require valid authentication.
- Confirm users cannot modify their own role or administrative status through profile updates.
- Confirm logout behavior matches the existing token-blacklist implementation.
- Record the in-memory blacklist limitation in security and deployment documentation.

The refresh-token workflow is classified as future scope in the existing inventory.

---

## 4. Authorization and Content Access

| Feature | Description | Existing Inventory Status |
|---|---|---|
| Role-based access control | Separate USER and ADMIN permissions. | VERIFIED |
| Administrator-only catalogue management | Restrict protected content-management operations to authorized administrators. | VERIFIED |
| Published-content visibility | Restrict non-administrator access to published content according to the implemented visibility rules. | VERIFIED |
| Unpublished-content protection | Prevent unauthorized users from accessing unpublished or restricted content. | VERIFIED |

### Verification considerations

Authorization must be enforced by the backend, not only by frontend controls.

Test both permitted and denied operations. Verify that unpublished books, chapters, and other restricted resources are not disclosed through alternate endpoints or direct identifiers.

The precise behavior of each route must match the actual backend implementation and API documentation.

---

## 5. Shared Library Catalogue Management

| Feature | Description | Existing Inventory Status |
|---|---|---|
| Book management | Create, retrieve, update, and manage book records according to permissions. | VERIFIED |
| Book archiving | Archive books through the authorized content-management workflow. | VERIFIED |
| Author management | Manage author records according to permissions. | VERIFIED |
| Author archiving | Archive author records where supported by the implementation. | VERIFIED |
| Category management | Manage library categories according to permissions. | VERIFIED |
| Category archiving | Archive category records where supported by the implementation. | VERIFIED |
| Chapter management | Create, retrieve, update, and delete chapters according to permissions. | VERIFIED |
| Chapter publishing | Manage chapter publication status where supported. | VERIFIED |
| Chapter reordering | Update chapter order using the implemented reordering workflow. | VERIFIED |
| Book-author relationships | Associate books with their authors. | VERIFIED |
| Book-category relationships | Associate books with their categories. | VERIFIED |
| Public book PDF upload and processing | Upload and process book PDFs through `POST /api/books/:id/pdf`. | VERIFIED |

### Verification considerations

- Validate required book, author, category, and chapter fields.
- Confirm that relationship records remain consistent.
- Test publication and archiving permissions.
- Verify chapter ordering and persistence.
- Confirm the actual route behavior before treating any catalogue endpoint as publicly accessible.

---

## 6. Book Discovery and Online Reading

| Feature | Description | Existing Inventory Status |
|---|---|---|
| Paginated book browsing | Retrieve book listings through `GET /api/books` with supported pagination. | VERIFIED |
| Category associations | Associate and retrieve category information for books. | VERIFIED |
| Author associations | Associate and retrieve author information for books. | VERIFIED |
| Online document reader | Provide an online reading interface for accessible content. | VERIFIED |
| Continuous reading interface | Support the implemented continuous-reading behavior. | VERIFIED |
| Reader themes | Provide supported light, dark, and sepia themes. | VERIFIED |
| Typography customization | Allow supported font customization. | VERIFIED |
| Auto-scroll | Provide automatic scrolling where implemented. | VERIFIED |
| Responsive mobile layout | Adapt the interface for supported mobile screen sizes. | VERIFIED |

### Verification considerations

Confirm that the actual frontend supports each listed behavior and that it communicates correctly with the backend.

Check loading states, error handling, navigation between chapters, and access to unpublished or restricted content.

Do not infer that server-side search, filtering, reading-progress persistence, or offline functionality exists unless the current implementation demonstrates it.

---

## 7. Private PDF Library

| Feature | Description | Existing Inventory Status |
|---|---|---|
| Private PDF upload | Upload a personal PDF through `POST /api/private-library/upload`. | VERIFIED |
| Personal file listing | Retrieve the authenticated user's private files through `GET /api/private-library`. | VERIFIED |
| Private PDF streaming | Retrieve or stream an authorized file through `GET /api/private-library/:id/file`. | VERIFIED |
| Personal file deletion | Delete an owned file through `DELETE /api/private-library/:id`. | VERIFIED |
| Ownership enforcement | Restrict private-file operations to the authorized owner. | VERIFIED |

### Verification considerations

- Test upload validation and file-size restrictions.
- Verify that file paths and filenames are handled safely.
- Confirm that private files cannot be retrieved through unrestricted public URLs.
- Test that one user cannot read or delete another user's file.
- Verify that missing files and invalid file identifiers are handled safely.
- Confirm the actual storage behavior before deploying to an environment where local files may be temporary.

The user-owned PDF library must remain separate from the shared published-book catalogue.

---

## 8. Accessibility and Reading Enhancements

| Feature | Description | Existing Inventory Status |
|---|---|---|
| Browser text-to-speech | Read supported document text aloud using the Web Speech API. | VERIFIED |
| Playback controls | Support the implemented play, pause, resume, and stop controls. | VERIFIED |
| Speech speed | Provide the implemented speech-speed control. | VERIFIED |
| Pitch adjustment | Adjust speech pitch where supported. | VERIFIED |
| Voice selection | Select among available browser speech voices. | VERIFIED |
| Responsive reading interface | Support reading on compatible desktop and mobile browsers. | VERIFIED |
| Chapter translation | Translate chapter content into a selected language. | FUTURE_SCOPE |
| AI semantic search | Search for content by meaning using AI-assisted techniques. | FUTURE_SCOPE |
| AI recommendations | Recommend relevant reading material using AI-assisted methods. | FUTURE_SCOPE |

### Verification considerations

Browser speech capabilities can vary by browser, operating system, available voices, and language.

Verify speech behavior in the supported environments and ensure that speech failures do not prevent normal text reading.

Translation, semantic search, and AI recommendations must remain identified as future-scope features unless an approved scope change and verified implementation establish otherwise.

---

## 9. Security and Data Protection

The feature inventory identifies the following security capabilities as part of the application.

| Security capability | Purpose | Existing Inventory Status |
|---|---|---|
| Password hashing | Avoid storing passwords in plaintext. | VERIFIED |
| JWT authentication | Establish an authenticated user identity. | VERIFIED |
| HttpOnly authentication cookie | Reduce direct JavaScript access to the authentication cookie. | VERIFIED |
| Role-based authorization | Restrict operations according to user role. | VERIFIED |
| Parameterized SQL queries | Reduce SQL injection risks. | VERIFIED |
| Request validation | Validate inputs before processing. | VERIFIED |
| Authentication rate limiting | Restrict excessive authentication attempts. | VERIFIED |
| Security headers | Apply the configured HTTP security headers. | VERIFIED |
| Private-file ownership checks | Restrict private PDF access to authorized owners. | VERIFIED |
| File-upload restrictions | Enforce the implemented upload rules. | VERIFIED |
| Centralized error handling | Provide consistent error responses without exposing sensitive details. | VERIFIED |

### Verification considerations

The status labels in this table originate from the existing feature inventory and must be confirmed against the current code and test evidence.

These controls help reduce security risks but do not, individually or collectively, establish that an application is completely secure.

The in-memory token blacklist used for logout has a known restart-related limitation. Refer to the technical security documentation for the implementation details.

---

## 10. Feature Scope by Release

### Version 1

The existing inventory identifies the following as V1 feature areas:

- Authentication and user management
- Role-based authorization
- Shared library catalogue management
- Book, author, category, and chapter operations
- Publishing and content visibility
- Book browsing and online reading
- Private PDF library
- Reader customization
- Browser text-to-speech
- Security and validation controls

The complete V1 release status must be established through integrated testing and verification rather than by counting feature entries.

### Future scope

The existing inventory defers these capabilities:

- Refresh-token workflow
- Chapter translation
- AI semantic search
- AI-assisted recommendations

Future-scope features must not be represented as completed V1 features.

---

## 11. Verification and Evidence Requirements

Every feature status should be supported by appropriate evidence.

| Evidence type | What it establishes |
|---|---|
| Source-code inspection | The relevant implementation exists. |
| Database inspection | The required schema, constraints, or relationships exist. |
| API testing | The endpoint behaves as expected for tested requests. |
| Integration testing | Connected components work together for the tested workflow. |
| Security testing | Specific security scenarios were evaluated. |
| Manual testing | The feature was exercised in the application under the recorded conditions. |

For each feature that is tested, record:

- Feature name
- Test case or test command
- Expected behavior
- Actual result
- Verification status
- Known limitations
- Date of verification, when documented

Do not invent test commands, outcomes, dates, or evidence.

A successful server health check does not prove that the catalogue, private PDF library, reader, or authentication workflows work correctly.

---

## 12. Documentation Relationships

This feature inventory must remain consistent with the following documents:

- `docs/DOCUMENTATION-INDEX.md`
- `docs/AI-CONTEXT.md`
- `docs/01-product/PRD.md`
- `docs/01-product/roadmap.md`
- `docs/01-product/vision-and-scope.md`
- `docs/02-requirements/SRS.md`
- `docs/03-technical/TRD.md`
- `docs/03-technical/api-specification.md`
- `docs/06-development/module-status.md`
- `docs/07-testing/test-plan.md`
- `docs/08-deployment/production-checklist.md`
- `docs/api/`
- `docs/security/`
- `docs/testing/testing-guide.md`

When implementation or approved requirements change, update this inventory and all affected documents.

---

## 13. Maintenance Rules

1. Preserve the approved technology stack and monolithic architecture.
2. Verify feature claims against the current local implementation.
3. Keep V1 functionality separate from future scope.
4. Use consistent status definitions.
5. Update endpoint references when API contracts change.
6. Record known limitations instead of concealing them.
7. Avoid duplicating implementation details unnecessarily.
8. Keep the document readable and maintainable.
9. Do not mark features VERIFIED without supporting evidence.
10. Review the feature inventory before declaring V1 release-ready.

---

## 14. Summary

The Digital Library feature inventory covers authentication, authorization, catalogue management, discovery, online reading, private PDF management, text-to-speech, and security.

The existing inventory marks the core feature areas as VERIFIED and identifies refresh-token support, chapter translation, semantic search, and AI recommendations as FUTURE_SCOPE.

These status labels must be reconciled with the current local implementation and verification records before they are used as final release evidence.

The purpose of this document is to maintain an accurate, consistent, and evidence-based view of the project's features and their release status.
