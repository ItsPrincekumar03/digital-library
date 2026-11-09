# DIGITAL LIBRARY — MASTER PROJECT HANDOVER & AI CONTEXT

**Document purpose:** A single source of context for another AI assistant, a new developer, or a project teammate. This document records the agreed shortened roadmap, team ownership, launch scope, architectural constraints, and acceptance rules.

**Plan baseline:** V1 has 30 modules. Modules 1–17 are treated as completed based on the project owner's confirmation. Modules 18–30 are the remaining V1 launch scope. V2–V4 contain 13 optional future modules, giving 43 modules across the proposed roadmap.

**Repository:** https://github.com/ItsPrincekumar03/digital-library  
**Primary branch:** `main` (verify current branch and state before any Git operation).  
**Project type:** BTech final-year project / web-based Digital Library.

---

## 1. Instructions to the AI assistant reading this document

You are helping continue an existing project, not starting a new one. Follow these instructions:

1. Read this handover before proposing code, architecture, modules, or changes.
2. Treat Modules 1–17 as completed because the project owner has declared them complete. Do not rebuild them by default. Verify existing code and tests before suggesting a change to those modules.
3. Keep the V1 launch plan to exactly 30 numbered modules. Do not restore the old 67-module roadmap as the active plan. V2, V3, and V4 are future versions and are not launch blockers.
4. Do not introduce microservices. Keep a beginner-appropriate **monolithic, layered application** with one Express backend and one MySQL database.
5. Do not replace the chosen technology stack or introduce a frontend framework unless the owner explicitly changes the requirement.
6. Preserve the existing reader interface and its customization. The supplied screenshot shows the current reading experience; treat it as a preservation reference, not permission to redesign it.
7. The existing TTS, speed-up-to-4x and pitch capabilities have previously been reported as implemented and tested. Do not rebuild them. Verify that they continue to work, especially in the Private Library.
8. Both User and Admin upload flows must offer a clear **PDF or EPUB** format choice. Keep role permissions intact: ordinary users' uploads are private; only Admin can manage and publish public catalogue books.
9. Private Library reading must offer the same supported reader customization as the public Library, including TTS, speed, pitch, layout, typography, themes and other existing settings.
10. The three students must be able to work in parallel without waiting for another student's feature to be completed. Use agreed API/interface contracts, mock responses, sample files and isolated branches. Integration testing is still required at the end.
11. Do not claim a feature is complete merely because it appears in this plan or documentation. Mark it complete only after inspecting implementation and recording test evidence.
12. Do not edit files, commit, push, merge, deploy, delete, or change repository settings unless the owner explicitly asks you to do that. Analysis and recommendations do not authorize repository changes.
13. When the owner asks for a prompt, module plan, or code task, keep it limited to the assigned module and avoid unrelated refactoring.
14. When current hosting-provider limits, prices, free tiers, or policies matter, verify them from current official sources before recommending a provider.

If information is missing, state what is unknown and inspect the repository or ask one focused question. Do not invent implementation details.

---

## 2. Project identity and fixed technology

**Project name:** Digital Library  
**Purpose:** A web application where visitors/users can discover and read public books, registered users can maintain a private library, and administrators manage and publish public books.

**Agreed technology stack:**

- Frontend: HTML5, CSS3 and Vanilla JavaScript.
- Backend: Node.js and Express.js.
- Database: MySQL 8.x.
- API style: REST API.
- Architecture: one monolithic application with clear layers/modules (routes, middleware, controllers, services, data access/configuration as already used by the repository).
- No microservices.
- No unnecessary framework migration or stack replacement.

**Repository:** https://github.com/ItsPrincekumar03/digital-library  
The public README describes JWT authentication, ADMIN/USER role authorization, author/category and book/chapter management, PDF ingestion using `pdfjs-dist`, private-library uploads, a custom reader, and TTS. Treat the README as a feature summary, not proof that every live deployment or workflow is fully verified.

---

## 3. Core business rules and permissions

### 3.1 Public Library

- Public catalogue books are managed by Admin.
- Admin can create/update book records and manage publishing/unpublishing.
- Users can browse and read books that are publicly available.
- A user must not be able to publish a private upload or modify the public catalogue through user-level routes.

### 3.2 Private Library

- A registered user may upload/import a book for their own private reading.
- A user's private upload remains private and associated with that user.
- A user must not be able to read, download, edit or delete another user's private file by changing an ID, URL, filename or request parameter.
- Admin upload capability must not silently grant unrestricted access to every user's private files. Admin public-content management and user-private ownership are separate concerns.

### 3.3 Upload format choice

Both upload experiences must visibly offer a format choice:

- **Normal PDF**
- **EPUB**

The frontend choice must be sent explicitly to the backend and validated server-side. Do not trust file extension or browser-provided MIME type alone. Validate the file content and enforce upload size limits. Use safe filenames/storage paths. Reject unsupported, malformed or mismatched files with understandable errors.

**Role distinction:**

- User chooses PDF or EPUB for a **private** upload.
- Admin chooses PDF or EPUB for an **admin-managed public book** (subject to the project's established publishing workflow).
- Do not let a User choose an upload mode that publishes the book publicly.

The exact EPUB parser/reader implementation should be selected only after inspecting the existing code and choosing a compatible approach. Do not claim EPUB works merely because the upload accepts `.epub` files; opening, navigation, content rendering and error handling must be tested.

---

## 4. Reader preservation requirements

The current reader customization is a protected project requirement.

**Do not remove or redesign the existing reader interface.** Preserve its visual structure and working behavior as closely as possible. The reference screenshot includes the book-reading area, page/progress information, top navigation and bottom reader controls.

Preserve and verify the existing supported capabilities, including:

- Text-to-Speech (TTS).
- Speech speed control up to 4x.
- Pitch control.
- Font/typography controls.
- Layout, line height and paragraph spacing controls.
- Reading themes/color modes such as light, sepia and dark where already implemented.
- Existing page/scroll/navigation controls and reader settings.
- Responsive behavior and any other reader controls already present.

**Public/Private parity:** The Private Library reader must expose the same supported customization as the public Library. Do not build a second reduced reader for private books. Reuse the existing reader behavior/components/scripts where the current architecture allows it, without introducing an unnecessary rewrite.

**Regression rule:** Since TTS, 4x speed and pitch have previously been reported as implemented/tested, the task is to preserve and regression-test these capabilities, not recreate them.

For EPUB, confirm that the existing reader can display the required EPUB content. If a separate rendering pathway is technically necessary, keep the same reader customization experience across formats and avoid changing the established PDF experience.

---

## 5. Version and module totals

| Version | Module numbers | Count | Goal |
|---|---:|---:|---|
| V1 — Launch | 1–30 | 30 | Minimum reliable public launch |
| V2 — Enhancements | 31–35 | 5 | Personal library and discovery improvements |
| V3 — Advanced reader/admin | 36–40 | 5 | Translation, administration and accessibility enhancements |
| V4 — Future capabilities | 41–43 | 3 | Optional AI and personalization |
| **Total** | **1–43** | **43** | **All proposed versions** |

Modules 1–17 are treated as completed by owner declaration. Modules 18–30 are the remaining V1 plan. Modules 31–43 are not required for the first launch unless the owner later changes the scope.

---

## 6. V1 — Launch roadmap (Modules 1–30)

### 6.1 Completed baseline (Modules 1–17)

The owner has confirmed that Modules 1–17 are completed. Do not invent or alter their titles if the owner has not supplied the final authoritative module register. Verify relevant code during audits; do not repeat already-completed work.

### 6.2 Remaining V1 modules (Modules 18–30)

| Module | Name | Owner | Scope / expected result |
|---:|---|---|---|
| 18 | Authentication and role-permission verification | Prince | Verify registration/login/logout/profile and ADMIN/USER access rules; confirm protected routes and role enforcement. |
| 19 | Public catalogue and admin publishing verification | Prince | Verify book/author/category/chapter workflows, public visibility, publish/unpublish and that users cannot publish public books. |
| 20 | PDF/EPUB upload backend and format validation | Prince | Implement/verify explicit format handling, backend validation, size limits, safe names and correct private/public upload paths. |
| 21 | EPUB processing and reader compatibility | Prince | Process and open valid EPUB files; verify rendering/navigation and malformed/unsupported EPUB errors. Preserve PDF behavior. |
| 22 | PDF/EPUB format selection in upload screens | Mukesh | Add clear PDF/EPUB choice to User private upload and Admin public-content upload screens; display correct validation/errors. |
| 23 | Preserve existing reader customization | Mukesh | Preserve the current reader UI and all existing customization controls; avoid redesign/regression. |
| 24 | Private Library reader customization parity | Mukesh | Make Private Library reader expose the same supported TTS, speed, pitch, layout, typography, themes and settings as public reading. |
| 25 | Responsive layout and navigation verification | Mukesh | Verify key pages, navigation, upload flows, public and private reading on desktop and mobile widths. |
| 26 | Automated test harness and reusable fixtures | Ritwiz | Prepare repeatable test setup, synthetic accounts, sample PDF/EPUB fixtures and API/workflow tests. Use an isolated test database. |
| 27 | Security, access-control and regression testing | Ritwiz | Test private-file ownership/isolation, role permissions, invalid uploads, authentication and critical existing reader/catalogue regressions. |
| 28 | Free-hosting deployment preparation | Ritwiz | Prepare environment/configuration checklist, production start/health-check process, deployment instructions and provider compatibility assessment. |
| 29 | Persistent storage, backup and recovery verification | Prince | Verify uploaded PDF/EPUB files persist on the chosen host; verify database plus file backup and a restore test. |
| 30 | Final integration, acceptance and launch approval | Prince leads; all three contribute | Integrate approved branches, run end-to-end acceptance, fix launch blockers, record release evidence and decide Go/No-Go. |

### 6.3 V1 ownership totals

| Student | Role | Modules owned | Number of owned modules |
|---|---|---|---:|
| Prince Kumar | Main developer / backend / integration | 18, 19, 20, 21, 29, 30 | 6 |
| Mukesh | Frontend / reader experience | 22, 23, 24, 25 | 4 |
| Ritwiz | Testing / security verification / deployment preparation | 26, 27, 28 | 3 |

Module 30 is a shared release gate. The owner count above counts it under Prince as release lead; all three must contribute evidence and resolve defects in their own areas.

---

## 7. V2 — Personal library and discovery enhancements (Modules 31–35)

These are post-launch enhancements and must not delay V1.

| Module | Name | Proposed owner | Scope |
|---:|---|---|---|
| 31 | Personal folders and tags | Mukesh | Optional organization of a user's private books using folders/tags. |
| 32 | Advanced personal library filtering and sorting | Mukesh | Additional private-library filters, sorting and convenience controls. |
| 33 | Bookmarks, notes and reading-history enhancements | Prince | More advanced reading annotations/history beyond the core reader needs. |
| 34 | Search relevance and advanced catalogue filters | Prince | Improve search ranking, filters and catalogue discovery. |
| 35 | Reading statistics and progress dashboard | Ritwiz | Optional personal reading analytics/progress summaries. |

---

## 8. V3 — Advanced reader and administration (Modules 36–40)

These are post-launch enhancements. Do not rebuild existing TTS, speed, pitch or layout functionality under these modules.

| Module | Name | Proposed owner | Scope |
|---:|---|---|---|
| 36 | Translation provider integration | Prince | Add/replace translation provider connectivity if approved. |
| 37 | Translation interface and reader controls | Mukesh | Add translation UI and reader interaction. |
| 38 | Translation caching and failure handling | Prince | Cache/retry/error behavior for translation features. |
| 39 | Enhanced admin dashboard and audit interface | Ritwiz | Optional additional admin dashboard views and audit browsing UI. |
| 40 | Advanced accessibility and multilingual reader verification | Mukesh | Further accessibility improvements and multilingual voice/reader compatibility. |

---

## 9. V4 — Optional future capabilities (Modules 41–43)

| Module | Name | Proposed owner | Scope |
|---:|---|---|---|
| 41 | AI-powered reading assistance | Prince | Optional AI assistance for reading/understanding books. Requires separate privacy, cost and provider review. |
| 42 | Personalized recommendations | Ritwiz | Optional recommendations based on permitted catalogue/user signals. |
| 43 | Advanced personalization and usage analytics | Mukesh | Optional personalization controls and additional usage analytics UI. |

Do not add AI features to V1 by default. Confirm provider costs, data privacy, API keys, limits and user consent before implementing any cloud AI integration.

---

## 10. Parallel work model — avoid student-to-student blocking

The intention is that Prince, Mukesh and Ritwiz can start and progress their assigned work independently. Do not create a plan where Mukesh must wait for Prince to finish the backend before writing the UI, or Ritwiz must wait for the complete frontend before creating tests.

### 10.1 Parallel workstreams

**Prince:** Modules 18–21 and 29–30. Own backend verification, PDF/EPUB upload/processing contracts, persistence/recovery and final integration leadership.

**Mukesh:** Modules 22–25. Own upload UI, reader preservation, Private Library reader parity and responsive UI. Use mocked API responses until backend endpoints are available.

**Ritwiz:** Modules 26–28. Own independent test infrastructure, fixtures, test cases and hosting preparation. Use agreed API examples and sample fixtures; test against a local mock or isolated test environment before integration.

### 10.2 Shared contracts that enable parallel development

Before implementation, agree and document the minimum interfaces. This is coordination, not a separate blocking module.

- Upload form fields: book metadata, selected format (`PDF` or `EPUB`), and file.
- Upload permissions: User upload targets private storage; Admin upload targets the established admin/public workflow.
- API response shape: stable success payload, validation errors, authentication/authorization errors and processing errors.
- Reader input contract: a normalized book/document identifier and a supported content source/format, while preserving the existing reader settings.
- Storage contract: private files are never exposed through unrestricted public static URLs; public assets and private files have distinct access rules.
- Test fixtures: one valid PDF, one valid EPUB, malformed files, oversized file, and synthetic User/Admin accounts.

The exact endpoint names and response fields must be taken from or agreed with the actual codebase. Do not invent routes and then assume the backend already supports them.

### 10.3 Git and file ownership

- Each student works on a separate feature branch.
- Avoid simultaneous edits to the same files.
- Mukesh should primarily own frontend/upload/reader presentation changes; Prince should primarily own backend/database/storage changes; Ritwiz should primarily own test and deployment documentation/scripts.
- If a shared file must change, coordinate the interface and review the diff before merging.
- Do not commit, push, merge or deploy unless the project owner explicitly authorizes that action.
- Use pull requests and review before integration; do not work directly on `main` for feature development.

### 10.4 Honest dependency note

The implementation tasks can be developed independently using contracts and mocks. However, the final integrated application necessarily depends on all parts being compatible. Module 30 must test the real frontend + backend + MySQL + file storage together. “Independent work” does not mean skipping final integration.

---

## 11. V1 launch acceptance checklist

The website is not ready for public launch simply because all module labels are checked. The following evidence is required.

### Functional acceptance

- [ ] User can register, log in, log out and access only User-authorized pages/routes.
- [ ] Admin can access administration functions; ordinary User cannot.
- [ ] Admin can manage and publish public catalogue books.
- [ ] User cannot publish a private upload to the public Library.
- [ ] Public catalogue and existing book/chapter reading workflows work.
- [ ] User upload screen offers PDF and EPUB selection and stores the user's upload privately.
- [ ] Admin upload screen offers PDF and EPUB selection and follows the admin public-content workflow.
- [ ] Valid PDF is processed and readable; invalid/mismatched PDF is rejected safely.
- [ ] Valid EPUB is processed and readable; malformed/unsupported EPUB fails gracefully.
- [ ] Existing PDF reading experience remains intact after EPUB support is added.
- [ ] Existing reader visual customization is preserved.
- [ ] TTS, speech speed up to 4x and pitch continue working.
- [ ] Private Library reader provides the same supported reader customization as public reading.
- [ ] Critical pages and reader work at supported desktop and mobile widths.

### Security and data protection

- [ ] User A cannot access User B's private PDF/EPUB by changing identifiers or URLs.
- [ ] Private file access requires authentication and ownership authorization.
- [ ] Upload content validation is server-side; extension/MIME-only checks are not treated as sufficient.
- [ ] File size/type limits, safe paths and error handling are tested.
- [ ] Production secrets are not committed to Git; environment variables are configured securely.
- [ ] HTTPS, CORS, cookie/JWT configuration and applicable CSRF protections are reviewed for the actual deployment.

### Deployment and operations

- [ ] Selected host supports the Node.js/Express backend and required runtime configuration.
- [ ] A reachable MySQL 8.x-compatible database is configured.
- [ ] Uploaded PDF/EPUB files are stored on persistent storage, not an ephemeral filesystem that loses files on restart/redeploy.
- [ ] Database backup and uploaded-file backup are both planned and tested.
- [ ] Restore test verifies both database records and corresponding uploaded files.
- [ ] Production startup command, environment variables and health checks are documented.
- [ ] Tests run against an isolated test database, never against production data.
- [ ] Final release commit/branch and test evidence are recorded.

**Go/No-Go rule:** Do not launch for general public use if private-file isolation, authorization, reliable uploads, persistent storage, or backup/recovery are failing. Optional V2–V4 features are not launch blockers.

---

## 12. Hosting guidance

The owner wants to launch on a free web-hosting platform. Do not select a host based only on a free static frontend tier. This application also needs:

1. A Node.js/Express backend process.
2. MySQL connectivity and a compatible database service.
3. Secure environment variables.
4. Persistent storage for public and private PDF/EPUB files, extracted content and any required assets.
5. HTTPS and correct CORS/cookie behavior.
6. A backup and restore plan for both database and uploaded files.

Before recommending a provider, verify the provider's current free-tier policies and whether it sleeps, removes files, limits outbound database access, or restricts persistent volumes. If persistent local storage is unavailable, evaluate object storage and the code changes required. Never imply that an ephemeral filesystem is safe for user uploads.

The deployment plan must be based on the existing monolithic project. Do not split it into microservices to fit a hosting provider.

---

## 13. Project status and evidence rules

Use these statuses precisely:

- **Completed — verified:** Implementation inspected and acceptance tests/evidence passed.
- **Completed — owner reported:** Owner says it is complete, but current evidence has not been independently reviewed.
- **In progress:** Work has started but acceptance criteria are not all met.
- **Pending:** Not started.
- **Blocked:** A specific external or technical dependency prevents progress; identify it clearly.
- **Deferred to V2/V3/V4:** Intentionally excluded from V1 launch scope.

At the start of a new AI conversation, the assistant should verify the current repository state and ask for or inspect relevant logs/files before upgrading a status from “owner reported” to “verified”. The statement that Modules 1–17 are complete is an owner-provided baseline, not a substitute for source/test evidence.

The repository README is a summary and can become stale. When source code, tests, documentation and owner statements disagree, report the discrepancy and ask which is authoritative instead of silently rewriting project history.

---

## 14. Known scope decisions and cautions

- The previous 67-module roadmap is superseded as the active delivery plan by this shortened 43-module, four-version proposal: V1 30 modules, V2 5, V3 5 and V4 3.
- Modules 1–17 are treated as complete per owner instruction. The precise titles/details of every historical module are not reconstructed here because the final authoritative historical module register has not been established in this handover.
- The module plan is a proposed work breakdown. Some work may already exist in code. Audit first; do not duplicate it.
- EPUB is an addition to the launch plan and must be tested end-to-end. File-extension acceptance alone is not EPUB support.
- Existing PDF reader customization is a preservation constraint. Do not redesign it to accommodate EPUB.
- Existing TTS, 4x speed and pitch are reported complete. Preserve and regression-test them.
- The future modules are optional proposals, not commitments or launch blockers.
- Exact hosting provider has not been finalized by this plan.

---

## 15. Suggested first prompt to give another AI

Copy the following prompt together with this document when starting a new AI chat:

> You are assisting with my existing BTech final-year project, Digital Library. Read the attached Master Project Handover & AI Context fully and follow it as the primary project instructions. My GitHub repository is https://github.com/ItsPrincekumar03/digital-library.
>
> The active plan is 43 modules across four versions: V1 Modules 1–30 (launch), V2 Modules 31–35, V3 Modules 36–40, and V4 Modules 41–43. Modules 1–17 are treated as completed based on my confirmation. The V1 remaining modules are 18–30. Do not restore the old 67-module roadmap as the active plan.
>
> Keep the existing technology stack: HTML, CSS, Vanilla JavaScript, Node.js, Express.js and MySQL 8.x. Use a single monolithic layered application. Do not introduce microservices, migrate frameworks or rewrite working features.
>
> Preserve the current reader design and customization. Existing TTS, speed up to 4x and pitch have been reported as implemented; do not rebuild them. Make the Private Library reader provide the same supported customization as the public Library. Both User and Admin upload flows must allow choosing PDF or EPUB, while maintaining the distinction between private User uploads and Admin-managed public books.
>
> The three developers must work independently in parallel: Prince owns Modules 18–21 and 29–30; Mukesh owns 22–25; Ritwiz owns 26–28. Use stable API/interface contracts, mocks and fixtures so nobody has to wait for another person to finish. Final end-to-end integration and testing are still mandatory.
>
> Start by inspecting the current repository and relevant documentation. Give me a concise audit of what is already implemented, what is genuinely missing, and which Modules 18–30 are already satisfied versus pending. Do not change code, edit files, commit, push, merge or deploy unless I explicitly authorize it. Do not claim anything is verified without evidence. Do not ask me to repeat information already in this handover.

---

## 16. Reference links

- GitHub repository: https://github.com/ItsPrincekumar03/digital-library
- Repository README: https://github.com/ItsPrincekumar03/digital-library/blob/main/README.md

**End of handover document.**
