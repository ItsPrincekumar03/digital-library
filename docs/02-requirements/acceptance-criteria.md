# Digital Library — Acceptance Criteria

**Project:** Digital Library  
**Project Type:** BTech Final-Year Software Project  
**Release:** Version 1 (V1)  
**Document Version:** 1.0  
**Status:** Active  
**Parent Document:** `docs/02-requirements/SRS.md`

---

## 1. Purpose

This document defines the acceptance criteria for the Digital Library application.

Acceptance criteria describe the observable conditions that must be satisfied for a requirement or feature to be accepted.

They connect product requirements to implementation and verification:

Requirement → Feature → Acceptance Criteria → Test Case → Evidence → Acceptance Decision

These criteria define what must be checked. They do not establish that the current implementation already satisfies the criteria.

Acceptance decisions must be supported by actual application behavior, relevant test results, and recorded evidence.

---

## 2. Scope

These acceptance criteria cover the intended Version 1 functionality of the Digital Library application, including:

- User registration and authentication.
- User profile and password management.
- Role-based authorization.
- Book, author, category, and chapter management.
- Publishing and content visibility.
- Book discovery and navigation.
- Online reading and reader customization.
- Private PDF management.
- PDF processing.
- Text-to-speech.
- Input validation and error handling.
- Security and data protection.
- Testing and release readiness.

Chapter translation, AI-assisted semantic search, AI recommendations, and refresh-token functionality remain future-scope items according to the existing product feature inventory. They are not mandatory V1 acceptance requirements unless an approved scope change states otherwise.

---

## 3. Acceptance Rules

A feature may be accepted only when its applicable criteria have been evaluated.

The following rules apply:

1. Criteria must describe observable behavior.
2. Expected behavior must match the approved requirements.
3. Tests must use controlled and appropriate test data.
4. Positive cases and relevant negative cases must be considered.
5. Security-sensitive behavior must be checked at the backend.
6. Test results must be recorded accurately.
7. Failed or blocked criteria must not be marked as passed.
8. Future-scope functionality must not be treated as a mandatory V1 feature.
9. A completed module does not automatically establish that the whole application is ready for release.
10. Changes to requirements must be reflected in the relevant acceptance criteria and test cases.

---

## 4. Acceptance Status Definitions

| Status | Meaning |
|---|---|
| PASS | The criterion was tested and the observed result matched the expected result. |
| FAIL | The criterion was tested and the observed result did not match the expected result. |
| NOT TESTED | No sufficient test evidence is available. |
| BLOCKED | Testing or acceptance cannot proceed because a documented dependency or issue remains unresolved. |
| NOT APPLICABLE | The criterion does not apply to the approved scope or implementation being evaluated. |

Use these statuses in actual test records.

Do not pre-mark the criteria in this document as passed. Record execution results in the relevant test cases, test plan, and module-status documentation.

---

## 5. Authentication and Account Management

### AC-AUTH-001 — User Registration

**Requirement:** A new user can register an account.

Acceptance criteria:

- Given valid registration information, when the user submits the registration form, the system creates an account if all registration rules are satisfied.
- Given an email address that already exists, the system rejects the duplicate registration.
- Given missing or invalid required fields, the system rejects the request with an appropriate validation response.
- A newly registered account receives the standard USER role unless an explicitly authorized administrative process provides otherwise.
- Passwords are not stored in plaintext.

**Evidence:** Registration API test results and database verification.

### AC-AUTH-002 — User Login

**Requirement:** A registered user can authenticate.

Acceptance criteria:

- Given valid credentials for an active account, the login operation succeeds.
- Given an incorrect password or an unknown email address, authentication fails.
- Failed login responses do not reveal whether a particular email address is registered.
- Successful authentication establishes the authentication state required by protected endpoints.
- Authentication credentials are not unnecessarily exposed in responses or logs.

**Evidence:** Positive and negative authentication tests.

### AC-AUTH-003 — Protected Resources

**Requirement:** Protected resources require authentication.

Acceptance criteria:

- Given a request without valid authentication, the system denies access to a protected resource.
- Given valid authentication and sufficient permission, the request proceeds according to the endpoint's rules.
- Invalid, expired, or otherwise unacceptable authentication tokens are rejected according to the implemented authentication design.
- The frontend cannot bypass backend authentication by directly requesting a protected API.

**Evidence:** Protected-route API tests.

### AC-AUTH-004 — Logout

**Requirement:** A user can log out.

Acceptance criteria:

- The logout operation clears the authentication cookie or performs the applicable logout behavior.
- Subsequent requests using the logged-out authentication state are rejected according to the token-invalidation implementation.
- The implementation's token-blacklist limitations are documented accurately.
- The logout operation does not falsely report successful persistent revocation if that behavior is not supported.

**Evidence:** Logout and subsequent protected-request tests.

### AC-USER-001 — Profile Retrieval

**Requirement:** An authenticated user can retrieve their profile.

Acceptance criteria:

- Given a valid authenticated user, the profile endpoint returns the profile permitted for that user.
- The response does not disclose another user's private account information.
- Unauthenticated requests are rejected.

**Evidence:** Profile API tests.

### AC-USER-002 — Profile Update

**Requirement:** An authenticated user can update permitted profile information.

Acceptance criteria:

- Valid permitted fields can be updated.
- Invalid or missing required information is handled according to validation rules.
- A user cannot modify their role, administrative privileges, or account activation status through ordinary profile updates.
- The updated information can be retrieved after the update succeeds.

**Evidence:** Profile update and authorization tests.

### AC-USER-003 — Password Change

**Requirement:** A user can change their password securely.

Acceptance criteria:

- The current password must be verified before the password is changed.
- An incorrect current password results in rejection.
- A valid password change updates the stored password hash.
- The new password is never stored or returned as plaintext.
- Password-change requests follow the configured validation and rate-limiting rules.

**Evidence:** Password-change API tests and relevant database verification.

---

## 6. Authorization and Access Control

### AC-ACL-001 — Role-Based Access

**Requirement:** USER and ADMIN operations are separated.

Acceptance criteria:

- A USER can perform only operations permitted by the approved access rules.
- An ADMIN can perform authorized administrative operations.
- A USER cannot gain ADMIN privileges by changing frontend data or supplying unauthorized role values.
- Administrative API endpoints enforce permissions on the server.
- Invalid or insufficient permissions result in an appropriate denial response.

**Evidence:** Tests using separate USER and ADMIN accounts.

### AC-ACL-002 — Content Visibility

**Requirement:** Restricted and unpublished content is protected.

Acceptance criteria:

- Published content is available only according to the approved authentication and visibility rules.
- Unpublished or restricted content is not disclosed to unauthorized users.
- Direct requests using a book, chapter, or resource identifier do not bypass the visibility rules.
- The frontend, backend, and API documentation use consistent access rules.

**Evidence:** Tests for published, unpublished, archived, and otherwise restricted content where those states exist.

The exact status handling must follow the implemented schema and approved business rules.

---

## 7. Library Catalogue Management

### AC-BOOK-001 — Book Management

**Requirement:** Authorized operations can manage book records.

Acceptance criteria:

- An authorized administrator can create a book using valid information.
- A book can be retrieved according to access permissions.
- Authorized update operations persist valid changes.
- Authorized deletion or archiving follows the implemented business rules.
- Invalid inputs are rejected appropriately.
- Unauthorized users cannot modify protected book records.

**Evidence:** Book API tests and database checks.

### AC-AUTHOR-001 — Author Management

**Requirement:** Authorized operations can manage author records.

Acceptance criteria:

- Valid author records can be created and retrieved.
- Supported update and archive operations follow the implemented rules.
- Invalid input and unauthorized requests are handled correctly.
- Related book records remain consistent with the approved relationship rules.

**Evidence:** Author API and relationship tests.

### AC-CATEGORY-001 — Category Management

**Requirement:** Authorized operations can manage categories.

Acceptance criteria:

- Valid categories can be created and retrieved.
- Supported update, deletion, or archival operations follow the implemented rules.
- Invalid category input is rejected.
- Category relationships are maintained consistently.
- Unauthorized administrative operations are denied.

**Evidence:** Category API and relationship tests.

### AC-REL-001 — Book-Author Relationships

**Requirement:** Books and authors are associated correctly.

Acceptance criteria:

- Authorized operations establish valid book-author relationships.
- A book can be associated with its permitted author records according to the data model.
- Invalid identifiers are rejected.
- Duplicate relationships are handled according to the database constraints and application rules.
- Relationship retrieval returns the correct associated records.

**Evidence:** Relationship API tests and database queries.

### AC-REL-002 — Book-Category Relationships

**Requirement:** Books and categories are associated correctly.

Acceptance criteria:

- Authorized operations establish valid book-category relationships.
- Invalid book or category identifiers are rejected.
- Duplicate relationships are handled according to the implemented constraints.
- Category-based discovery uses the correct relationship data.

**Evidence:** Relationship API and database tests.

### AC-CHAPTER-001 — Chapter Management

**Requirement:** Authorized users can manage chapters according to their permissions.

Acceptance criteria:

- Valid chapters can be created and retrieved for the appropriate book.
- Supported update and deletion operations follow authorization rules.
- Invalid chapter data and invalid book references are rejected.
- Chapter content is returned according to the applicable content-visibility rules.
- Changes to chapters do not expose restricted content.

**Evidence:** Chapter API tests.

### AC-CHAPTER-002 — Chapter Ordering

**Requirement:** Supported chapter-reordering operations preserve a valid order.

Acceptance criteria:

- A valid reorder request updates the intended chapter ordering.
- Invalid chapter identifiers or invalid order values are rejected.
- Chapters not included in an operation are handled according to the documented request contract.
- The saved ordering can be retrieved after the update.

**Evidence:** Reordering API tests and database verification.

---

## 8. Publishing and Archiving

### AC-PUB-001 — Publishing Workflow

**Requirement:** Authorized operations manage the publication status of library content.

Acceptance criteria:

- Only authorized roles can execute restricted publication operations.
- Valid publishing operations update the relevant publication state.
- Unauthorized requests cannot publish or modify restricted content.
- The resulting visibility of content follows the approved publishing rules.
- Invalid state transitions are rejected where the workflow defines such restrictions.

**Evidence:** Publishing-workflow tests.

### AC-PUB-002 — Archived Content

**Requirement:** Archived content follows the approved visibility and management rules.

Acceptance criteria:

- Supported archival operations can be performed by authorized users.
- Archived content is presented or hidden according to the defined product rules.
- Archiving does not inadvertently grant public access to restricted content.
- Related records remain consistent with the approved data-retention rules.

**Evidence:** Archival API tests and visibility checks.

---

## 9. Book Discovery

### AC-DISC-001 — Paginated Browsing

**Requirement:** Users can browse available catalogue content.

Acceptance criteria:

- A valid browsing request returns the applicable page of results.
- Pagination parameters follow the documented defaults and limits.
- Invalid or unsupported parameters are handled safely.
- Results respect the visibility rules and authorization requirements.
- Empty result sets are handled without application failure.

**Evidence:** Catalogue API and pagination tests.

### AC-DISC-002 — Search and Filtering

**Requirement:** Implemented search and filtering behave as documented.

Acceptance criteria:

- Search input is validated and processed safely.
- Category filtering uses the correct category relationships.
- Search and filtering operate over the intended result set rather than incorrectly claiming to cover records that were never queried.
- Pagination remains consistent with filtering.
- Invalid filters and unusual input do not cause SQL errors or expose unauthorized content.

**Evidence:** Search, category-filter, pagination, and validation tests.

If a particular search or filter feature is not implemented, record it as NOT TESTED, BLOCKED, or outside the approved scope as appropriate.

---

## 10. Online Reader

### AC-READ-001 — Open Book

**Requirement:** An authorized user can open accessible book content.

Acceptance criteria:

- An accessible book can be opened in the reader.
- A missing or restricted book produces an appropriate response.
- The reader displays the available book and chapter information.
- Direct navigation cannot bypass authentication or content visibility checks.

**Evidence:** End-to-end reader tests.

### AC-READ-002 — Chapter Navigation

**Requirement:** Users can navigate available chapters.

Acceptance criteria:

- Selecting an available chapter displays the corresponding content.
- Previous and next navigation follows the actual chapter ordering.
- The reader does not navigate to a nonexistent chapter before the first chapter or beyond the last chapter.
- Missing or inaccessible chapters are handled safely.

**Evidence:** Reader navigation tests.

### AC-READ-003 — Reading Customization

**Requirement:** Implemented reader settings behave as intended.

Acceptance criteria:

- Supported font-size, font-family, line-height, and reading-width controls apply their changes.
- Supported light, dark, and sepia themes display correctly.
- The reader remains usable at supported screen sizes.
- Unsupported settings are not presented as working features.
- Preference persistence is accepted only if the relevant persistence behavior is implemented and verified.

**Evidence:** Reader functionality checks and responsive UI tests.

### AC-READ-004 — Auto-Scroll

**Requirement:** The implemented auto-scroll feature operates predictably.

Acceptance criteria:

- Available start, pause, resume, stop, and speed controls perform their documented operations.
- Auto-scroll does not unexpectedly prevent ordinary reading or navigation.
- State changes are handled when the reader or chapter changes.

**Evidence:** Manual reader tests where auto-scroll is implemented.

---

## 11. Private PDF Library

### AC-PDF-001 — PDF Upload

**Requirement:** An authorized user can upload a personal PDF.

Acceptance criteria:

- An authenticated user can upload a permitted PDF within the configured size limit.
- Invalid file types and files exceeding applicable limits are rejected.
- Uploaded files are stored using safe filenames and paths.
- Upload errors do not expose sensitive server details.
- The user receives an appropriate result when processing succeeds or fails.

**Evidence:** Upload API tests and controlled sample files.

### AC-PDF-002 — Personal File Listing

**Requirement:** Users can list their own private documents.

Acceptance criteria:

- An authenticated user receives the private documents belonging to that user.
- Another user's private files are not included.
- Invalid authentication is rejected.
- Empty private libraries are handled appropriately.

**Evidence:** Tests using multiple distinct test users.

### AC-PDF-003 — Private File Access

**Requirement:** Private PDF access is limited to authorized owners.

Acceptance criteria:

- An authorized owner can retrieve or stream their own permitted file.
- Another user cannot access the file by changing its identifier or request URL.
- Unauthenticated requests are rejected.
- Private files are not accessible through an unrestricted public static-file route.
- Missing files are handled safely.

**Evidence:** Cross-user authorization tests and file-access checks.

### AC-PDF-004 — File Deletion

**Requirement:** Users can delete their own private files.

Acceptance criteria:

- An authorized owner can delete a permitted file.
- Another user cannot delete the file.
- Attempts to delete nonexistent or inaccessible files receive appropriate responses.
- Database metadata and stored files remain consistent with the implemented deletion rules.

**Evidence:** Deletion tests and storage verification.

### AC-PDF-005 — PDF Processing

**Requirement:** Supported PDF documents are processed safely.

Acceptance criteria:

- A supported PDF can be processed using the implemented PDF-processing library.
- Invalid or corrupted documents are handled without crashing the application.
- Extracted content is handled according to the existing processing and storage design.
- Processing failures do not bypass access controls.
- PDFs containing only scanned page images are not assumed to support text extraction unless OCR is implemented.

**Evidence:** Tests using representative valid and invalid sample PDFs.

---

## 12. Text-to-Speech

### AC-TTS-001 — Speech Playback

**Requirement:** Supported document text can be read aloud.

Acceptance criteria:

- Text-to-speech can start for supported content in a compatible browser.
- Available pause, resume, and stop controls behave according to the implementation.
- Changing or closing the reading context does not leave an unintended speech operation running.
- Speech failure does not prevent normal visual reading.
- Browser limitations are reported without falsely claiming that every browser supports identical behavior.

**Evidence:** Manual tests in documented browser environments.

### AC-TTS-002 — Speed, Pitch, and Voice

**Requirement:** Implemented speech controls operate correctly.

Acceptance criteria:

- Available speed controls update speech behavior as implemented.
- A maximum speed of 4x is claimed only if the configured implementation supports it.
- Pitch adjustment and voice selection are verified where implemented and supported by the browser.
- Unsupported settings do not cause the reader to fail.

**Evidence:** Text-to-speech tests and supported-browser records.

### AC-TTS-003 — Chapter Changes and Long Text

**Requirement:** Speech handles changes in reading context appropriately.

Acceptance criteria:

- Previous speech is stopped or cleared when chapter changes require it.
- Duplicate or stale speech queues are avoided.
- Long chapters are handled according to the implemented browser speech strategy.
- Normal reading remains available if speech is unavailable.

**Evidence:** Long-content and chapter-transition tests.

---

## 13. Security and Validation

### AC-SEC-001 — SQL Injection Protection

**Requirement:** User-controlled input must not alter SQL command structure.

Acceptance criteria:

- User-controlled values are passed through appropriate parameterized database operations.
- Invalid or unexpected input is handled safely.
- Security tests do not produce unauthorized database access.
- Database errors do not expose sensitive internal details.

**Evidence:** Code review and appropriate API security tests.

### AC-SEC-002 — Cross-Site Scripting Protection

**Requirement:** Untrusted content must not execute as unintended script.

Acceptance criteria:

- Book titles, descriptions, author information, and chapter content are rendered safely by the frontend.
- Untrusted text is not inserted into executable HTML without appropriate handling.
- User-controlled values cannot bypass authorization or security checks.
- Relevant malicious-input tests demonstrate the expected safe behavior.

**Evidence:** Frontend rendering tests and input-security checks.

### AC-SEC-003 — Input Validation

**Requirement:** Invalid data is rejected or safely handled.

Acceptance criteria:

- Required fields are validated.
- Invalid identifiers and unsupported values are handled consistently.
- Invalid requests do not bypass authorization.
- Validation errors provide useful messages without exposing sensitive details.
- Validation rules match the documented API contract.

**Evidence:** API validation tests.

### AC-SEC-004 — Error Handling

**Requirement:** Application failures are handled consistently.

Acceptance criteria:

- Expected validation failures return an appropriate status and error response.
- Missing and inaccessible resources are handled according to the API contract.
- Unhandled failures do not expose stack traces or secrets in production responses.
- A failure in an optional feature does not unnecessarily disable unrelated core functionality.

**Evidence:** Error-response and integration tests.

### AC-SEC-005 — Configuration and Secrets

**Requirement:** Sensitive configuration is protected.

Acceptance criteria:

- Production secrets are supplied through appropriate environment configuration.
- Example configuration files contain placeholders rather than real credentials.
- Sensitive values are not committed to source control.
- Missing required configuration is handled explicitly.
- Logs and API responses do not disclose secrets.

**Evidence:** Configuration review and repository checks.

### AC-SEC-006 — Rate Limiting and Security Headers

**Requirement:** Configured protection middleware behaves as intended.

Acceptance criteria:

- Sensitive endpoints apply the intended rate limits.
- Requests exceeding configured limits receive an appropriate response.
- Security headers match the application's documented configuration.
- Production CORS settings allow only the intended origins.

**Evidence:** Middleware tests and deployed-response inspection where applicable.

---

## 14. Database Integrity and Reliability

### AC-DATA-001 — Referential Integrity

**Requirement:** Database relationships remain consistent.

Acceptance criteria:

- Required relationships use the implemented database constraints or equivalent validated application rules.
- Invalid foreign-key references are rejected.
- Updates and deletions follow the defined relationship rules.
- Related records remain consistent after supported operations.

**Evidence:** Database inspection and integration tests.

### AC-DATA-002 — Data Persistence

**Requirement:** Successful operations persist as designed.

Acceptance criteria:

- Successfully created or updated records can be retrieved afterwards.
- A failed operation does not falsely report success.
- Operations involving multiple related changes preserve the intended consistency rules.
- Uploaded documents persist according to the configured storage design.

**Evidence:** Database and storage verification.

### AC-REL-001 — Graceful Failure

**Requirement:** Common failures do not cause uncontrolled application behavior.

Acceptance criteria:

- Invalid requests receive appropriate responses.
- Missing resources are handled safely.
- Database or storage failures are logged and handled according to the application's error-handling design.
- The application does not expose sensitive internal information.
- Relevant failures can be investigated using available logs.

**Evidence:** Error handling and integration tests.

---

## 15. Usability and Compatibility

### AC-UX-001 — Responsive Interface

**Requirement:** The implemented interface supports its intended screen sizes.

Acceptance criteria:

- Required pages remain usable on supported desktop and mobile layouts.
- Important controls remain reachable and usable.
- Content does not become inaccessible because of unnecessary horizontal overflow.
- Forms and errors remain understandable on smaller screens.

**Evidence:** Responsive UI checks.

### AC-UX-002 — User Feedback

**Requirement:** The application provides understandable feedback.

Acceptance criteria:

- Users receive suitable feedback for successful operations.
- Loading operations provide appropriate progress or waiting states where necessary.
- Validation, network, authorization, and processing errors are handled clearly.
- Empty results are distinguishable from failed requests.

**Evidence:** Manual UI tests.

### AC-UX-003 — Accessibility Basics

**Requirement:** The interface supports reasonable accessibility practices.

Acceptance criteria:

- Form fields have appropriate labels.
- Buttons have understandable accessible names.
- Keyboard navigation works for relevant controls.
- Focus states are visible.
- Text and interface contrast are usable.
- Semantic HTML and ARIA attributes are used appropriately.

**Evidence:** Manual accessibility checks and suitable automated tooling where available.

---

## 16. Testing and Verification Acceptance

### AC-TEST-001 — Test Evidence

**Requirement:** Acceptance decisions are based on real test evidence.

Acceptance criteria:

- Relevant test cases are documented.
- Executed test commands and actual results are recorded.
- Failed tests remain identified until resolved or formally assessed.
- Skipped, blocked, and untested cases are not marked as passed.
- Regression tests are run after relevant fixes.
- Test evidence identifies the feature or requirement being evaluated.

**Evidence:** Test reports and documented execution results.

### AC-TEST-002 — Integrated Application

**Requirement:** Connected components work together.

Acceptance criteria:

- Core frontend workflows communicate with the actual backend.
- Backend operations interact correctly with the database.
- Authentication and authorization remain consistent across components.
- Private-file handling works through the integrated application.
- Critical end-to-end workflows have recorded outcomes.

**Evidence:** Integration and end-to-end test results.

---

## 17. Release Readiness Acceptance

### AC-REL-002 — Staging Verification

**Requirement:** The application is checked in a staging environment before public release.

Acceptance criteria:

- The application starts with the intended configuration.
- The backend connects to the intended staging database.
- Frontend-to-backend communication works.
- Critical user journeys are tested.
- Private-file permissions are checked.
- The storage configuration is verified for persistence.
- Relevant application errors are investigated.
- Test outcomes and unresolved issues are documented.

**Evidence:** Staging deployment and acceptance report.

### AC-REL-003 — Public Release Decision

**Requirement:** Public release follows a documented readiness review.

Acceptance criteria:

- Critical and high-priority known blockers have been addressed or explicitly assessed.
- Core functionality has been tested against the approved requirements.
- Production secrets and environment configuration are prepared appropriately.
- HTTPS, CORS, database access, and private-file storage are configured for the target environment.
- Backups and recovery procedures are documented.
- Release readiness is based on verified evidence rather than module completion alone.

**Evidence:** Production checklist, test reports, and deployment records.

---

## 18. Traceability to Test Cases

The test-case document should map each acceptance criterion to its corresponding verification scenario.

| Acceptance criterion group | Primary verification area |
|---|---|
| AC-AUTH | Registration, login, logout, protected routes |
| AC-USER | Profile retrieval, profile updates, password changes |
| AC-ACL | Role permissions and restricted content |
| AC-BOOK | Book management |
| AC-AUTHOR | Author management |
| AC-CATEGORY | Category management |
| AC-REL | Book-author and book-category relationships |
| AC-CHAPTER | Chapter operations and ordering |
| AC-PUB | Publishing, archiving, and visibility |
| AC-DISC | Browsing, pagination, search, and filtering |
| AC-READ | Online reading, navigation, and customization |
| AC-PDF | Private upload, listing, access, processing, and deletion |
| AC-TTS | Speech playback and reader-context changes |
| AC-SEC | Input validation and security controls |
| AC-DATA | Database integrity and persistence |
| AC-UX | Responsive behavior, feedback, and accessibility |
| AC-TEST | Test execution and integration evidence |
| AC-REL | Staging and public-release readiness |

The individual test cases must specify their setup, input, execution steps, expected result, and actual outcome.

Do not treat this mapping as proof that the tests have already been executed.

---

## 19. Acceptance Record Template

Use the following format when recording the outcome of a criterion.

| Field | Description |
|---|---|
| Criterion ID | Unique acceptance-criterion identifier |
| Feature | Feature being evaluated |
| Test reference | Test case or test execution identifier |
| Expected result | Behavior required by the criterion |
| Actual result | Behavior observed during testing |
| Status | PASS, FAIL, NOT TESTED, BLOCKED, or NOT APPLICABLE |
| Evidence | Test output, relevant log, or verification record |
| Known limitations | Remaining issue or constraint |
| Verification date | Date of actual verification, if recorded |

Populate this record with observed facts. Do not invent test execution dates, results, or evidence.

---

## 20. Requirements Change Management

When an approved requirement changes:

1. Identify the affected requirement.
2. Review its acceptance criteria.
3. Review the implementation and dependencies.
4. Update relevant test cases.
5. Update related documentation.
6. Execute the necessary tests.
7. Record the acceptance outcome.

Changes affecting product scope must be recorded through the project's change-management process.

Future-scope functionality must remain separate from mandatory V1 acceptance unless an approved change establishes otherwise.

---

## 21. Document Maintenance

Review this document when:

- Product requirements change.
- User roles or permissions change.
- API contracts change.
- Database relationships change.
- Private PDF handling changes.
- Reader or text-to-speech behavior changes.
- New acceptance criteria are introduced.
- Features are moved between V1 and future releases.
- Release-readiness requirements change.

Keep this document aligned with:

- `docs/01-product/PRD.md`
- `docs/01-product/feature-list.md`
- `docs/02-requirements/SRS.md`
- `docs/02-requirements/functional-requirements.md`
- `docs/02-requirements/non-functional-requirements.md`
- `docs/03-technical/api-specification.md`
- `docs/06-development/module-status.md`
- `docs/07-testing/test-cases.md`
- `docs/07-testing/test-plan.md`
- `docs/08-deployment/production-checklist.md`

---

## 22. Summary

The acceptance criteria define how Digital Library requirements should be evaluated.

They cover authentication, permissions, catalogue management, publishing, reading, private PDF handling, text-to-speech, security, data integrity, testing, and release readiness.

Acceptance decisions must be based on observable behavior and recorded evidence.

This document defines the acceptance conditions; it does not claim that all criteria have already passed.
