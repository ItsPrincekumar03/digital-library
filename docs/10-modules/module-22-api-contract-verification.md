# MODULE 22 — EPUB/PDF BACKEND CONTRACT VERIFICATION REPORT

**Project:** Digital Library  
**Repository:** `https://github.com/ItsPrincekumar03/digital-library`  
**Module:** Module 22 — PDF/EPUB Upload Interface  
**Assigned Developer:** Mukesh  
**Main Developer:** Prince Kumar  
**Date:** 2026-11-09  

---

## 1. Executive Summary & Repository Status

### 1.1 Git Status & Branch Inspection
- **Current branch:** `main` (commit `0d2724c`).
- **Working tree status:** Clean.
- **Local modifications / backups:** All developer stashes and backup branches (`backup-local-work-20261025`, `backup-local-work-20261109_182034`, and stash `stash@{0}`) are preserved.
- **Branches examined:**
  - `main` (commit `0d2724c`: *"Merge pull request #16 from ItsPrincekumar03/module-19-public-catalogue-admin-publishing"*)
  - `origin/module-20-pdf-epub-upload` (commit `1cd479e`: *"feat(module-20): add PDF and EPUB upload support"*)
  - All feature and documentation branches in Git history.
- **Findings on Module 20 vs Module 21:**
  - **Module 20:** Implemented on branch `origin/module-20-pdf-epub-upload` (commit `1cd479e`). It implements format-agnostic upload middleware (`upload.middleware.js`), container validation (`epubValidation.js`), and format validation (`formatValidation.js`). It has **not yet been merged** into `main`.
  - **Module 21:** **Not implemented** across any branch in the repository.

---

## 2. EPUB Validation Limits Verification

| Validation Limit Item | Prince's Specification | Actual Code Implementation | Source Location & Line Reference | Verification Status |
|---|---|---|---|---|
| **Compressed Archive Max Size** | 100 MB | Default: **10 MB** (`10 * 1024 * 1024` bytes). Overridable via `PRIVATE_LIBRARY_MAX_FILE_SIZE_BYTES` and `PUBLIC_LIBRARY_MAX_FILE_SIZE_BYTES`. | `backend/src/middleware/upload.middleware.js:16, 28, 42` | `Needs clarification` |
| **Maximum ZIP Entries** | 1,000 | **1,000 entries** (`MAX_ZIP_ENTRIES = 1000`). Enforces `totalEntries <= 1000` via End of Central Directory record check. | `backend/src/utils/epubValidation.js:10, 81-86` | `Verified` |
| **Maximum Uncompressed Size** | 500 MB | **100 MB** (`MAX_UNCOMPRESSED_SIZE = 100 * 1024 * 1024`). Checked against first entry (`mimetype`) header rather than accumulated total extracted size. | `backend/src/utils/epubValidation.js:11, 41-44` | `Needs clarification` |
| **EPUB Magic Bytes / ZIP Signature** | `PK\x03\x04` | Verified: `ZIP_LOCAL_FILE_HEADER_SIGNATURE = 0x04034b50` at offset 0. | `backend/src/utils/epubValidation.js:8, 25-30` | `Verified` |
| **MIME Type Entry Stored Uncompressed** | Required | Verified: `compressionMethod === 0` for `mimetype` entry. | `backend/src/utils/epubValidation.js:37-40` | `Verified` |
| **First Entry Named `mimetype`** | Required | Verified: `fileName === 'mimetype'` at offset 30. | `backend/src/utils/epubValidation.js:52-56` | `Verified` |
| **MIME Content Value** | `application/epub+zip` | Verified: exact ascii check against `'application/epub+zip'`. | `backend/src/utils/epubValidation.js:12, 63-67` | `Verified` |
| **End of Central Directory Record** | Required | Verified: searches for `0x06054b50` in the last 65,557 bytes. | `backend/src/utils/epubValidation.js:9, 70-93` | `Verified` |
| **`container.xml` & OPF Package Parsing** | Required | **Not present** in `epubValidation.js` (deferred to Module 21). | `backend/src/utils/epubValidation.js:3-6` | `Not implemented` |
| **Decompressed-Size Cumulative Enforcement (ZIP Bomb)** | Sum of all entries $\le 500$ MB | **Partially implemented** (only inspects uncompressed size of the `mimetype` entry in the local header, does not sum all central directory uncompressed sizes). | `backend/src/utils/epubValidation.js:35, 41-44` | `Partially implemented` |

### Detailed Discrepancies on Limits:
1. **HTTP / Multer Upload Size Limit:**
   - In `backend/src/middleware/upload.middleware.js:16`, `DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024` (10 MB).
   - If a 100 MB EPUB file is uploaded without setting `PRIVATE_LIBRARY_MAX_FILE_SIZE_BYTES=104857600`, Multer triggers `LIMIT_FILE_SIZE` and rejects it with HTTP 400 (`"File size must be 10485760 bytes or less."`).
2. **Uncompressed Size Limit:**
   - In `backend/src/utils/epubValidation.js:11`, `MAX_UNCOMPRESSED_SIZE` is defined as `100 * 1024 * 1024` (100 MB), whereas the specification states 500 MB.
   - Line 35 reads `headerBuffer.readUInt32LE(22)` from the *first local header* (`mimetype` file header), which is ~20 bytes, and tests `if (uncompressedSize > MAX_UNCOMPRESSED_SIZE)`. It does not calculate the total uncompressed size across all ZIP entries.

---

## 3. Multipart Fields and Format Parameter Verification

| Field Name / Parameter | Purpose | Implementation Reality | Source Location & Line Reference | Verification Status |
|---|---|---|---|---|
| **File Field: `file`** | Multipart file upload | **Accepted.** Handled via `upload.fields([{ name: 'file', maxCount: 1 }, { name: 'pdf', maxCount: 1 }])`. | `backend/src/middleware/upload.middleware.js:97-98, 156-157` | `Verified` |
| **File Field: `pdf`** | Multipart file upload (legacy / backward compatibility) | **Accepted.** Handled via `upload.fields([{ name: 'file', maxCount: 1 }, { name: 'pdf', maxCount: 1 }])`. Normalized to `req.file`. | `backend/src/middleware/upload.middleware.js:97-108, 156-167` | `Verified` |
| **File Field: `epub`** | Multipart file upload (proposed in prompt) | **NOT ACCEPTED.** Not declared in Multer `fields()`. If client passes `epub`, Multer will reject it or ignore it, causing `req.file` to be missing. | `backend/src/middleware/upload.middleware.js:96-108, 155-167` | `Needs clarification` |
| **Same Field for PDF & EPUB** | Compatibility | **Yes.** Both `file` and `pdf` accept `.pdf` and `.epub` files indiscriminately. | `backend/src/middleware/upload.middleware.js:87-94, 146-153` | `Verified` |
| **Format Parameter: `format`** | Specifies file format | **Required/Validated.** Value is checked via `validateFormat(req.body.format)`. Accepted values: `'PDF'` or `'EPUB'` (case-insensitive, trimmed). Defaults to `'PDF'` if omitted. | `backend/src/utils/formatValidation.js:19-27`, `backend/src/services/privateLibrary.service.js:63-71`, `backend/src/services/book.service.js:150-158` | `Verified` |
| **USER Metadata: `title`** | Book title in private library | Optional. Trimmed string up to 255 chars. If omitted, falls back to original filename base name. | `backend/src/services/privateLibrary.service.js:28-40, 89` | `Verified` |
| **USER Metadata: `description`** | Note/description | Optional. Trimmed string up to 1000 chars. | `backend/src/services/privateLibrary.service.js:91-94` | `Verified` |
| **ADMIN Metadata** | Metadata fields on upload | No metadata fields required; book metadata is managed via existing book CRUD routes. | `backend/src/controllers/book.controller.js:116-152` | `Verified` |

---

## 4. Module 21 Verification (EPUB Processing & Reader Pipeline)

An exhaustive search was conducted across all local branches, remote branches, reflogs, and commit logs:

| Item | Search Criteria | Status | Details |
|---|---|---|---|
| **`epubProcessor.js`** | Filename search across all trees | `Not implemented` | File does not exist anywhere in the repository. |
| **EPUB Metadata Extraction** | Functions extracting dc:title, dc:creator, cover | `Not implemented` | No parser or extractor exists. |
| **OPF Document Parsing** | XML / OPF manifest, spine, metadata | `Not implemented` | No OPF parsing logic exists. |
| **Container XML Parsing** | Reading `META-INF/container.xml` | `Not implemented` | No container XML parsing exists. |
| **EPUB Chapter Processing** | Splitting EPUB into reader chapters | `Not implemented` | No chapter splitting or HTML extraction exists. |
| **EPUB Reader Interface** | Frontend reader compatibility for EPUB | `Not implemented` | Existing reader in `frontend/read.html` and `frontend/js/pages/read.js` only consumes JSON document structures generated from PDFs or manual chapters. |

**Conclusion on Module 21:**  
Module 21 has **not been started**. No partial code, branches, or PRs exist for it. As stated in `docs/10-modules/module-20-pdf-epub-upload-backend-validation.md:14`:  
> *"Full EPUB content processing is deferred to Module 21. Only container validation is performed."*

---

## 5. API Paths, Routing, and Frontend Construction Verification

### 5.1 Backend Route Definitions and Express Mounts
In `backend/src/app.js`:
- Line 68: `app.use('/api/books', bookRoutes);`
- Line 70: `app.use('/api/private-library', privateLibraryRoutes);`

In `backend/src/routes/privateLibrary.routes.js`:
- Line 15-22: `router.post('/upload', requireAuth, handlePrivatePdfUpload, uploadRules, handleValidation, privateLibraryController.upload);`
  - **Full Backend Route:** `POST /api/private-library/upload`
  - **Proposed Route `POST /private-library/upload/epub`:** `Not implemented`. The single route handles both formats via `format: 'PDF'` or `format: 'EPUB'`.

In `backend/src/routes/book.routes.js`:
- Line 28: `router.post('/:id/pdf', requireAuth, requireRole('ADMIN'), idParamRule, handleValidation, handlePublicPdfUpload, bookController.importPdf);`
  - **Full Backend Route:** `POST /api/books/:id/pdf`
  - **Proposed Route `POST /book/:id/epub`:** `Not implemented`. The route `POST /api/books/:id/pdf` handles both formats via `format: 'PDF'` or `format: 'EPUB'`.
  - **Note on Route Name:** In Express, the route is mounted at `/api/books`, so the path is `/api/books/:id/pdf` (plural), NOT `/api/book/:id/pdf`.

### 5.2 Frontend Request Construction
In `frontend/js/config.js:3`:
```javascript
export const API_BASE_URL = `http://${hostname}:5000/api`;
```
In `frontend/js/api.js:220-222`:
```javascript
response = await fetch(
    `${API_BASE_URL}${path}`,
    requestOptions
);
```
Therefore, in the frontend page scripts:
- **USER Private Upload:**  
  Calling `api.post("/private-library/upload", formData)` produces:  
  `http://localhost:5000/api` + `/private-library/upload` = `http://localhost:5000/api/private-library/upload` (`Verified`).
- **ADMIN Public Upload:**  
  Calling `api.post(`/books/${bookId}/pdf`, formData)` produces:  
  `http://localhost:5000/api` + `/books/${bookId}/pdf` = `http://localhost:5000/api/books/${bookId}/pdf` (`Verified`).

### 5.3 Request and Response Structure

#### USER Private Upload
- **Request:**
  - Method: `POST`
  - URL: `/api/private-library/upload`
  - Content-Type: `multipart/form-data`
  - Headers: `Authorization: Bearer <token>` or HTTP cookie (`credentials: "include"`)
  - Form Data:
    - `file` (or `pdf`): Binary file (.pdf or .epub)
    - `format`: `'PDF'` or `'EPUB'`
    - `title`: String (optional)
    - `description`: String (optional)
- **Success Response (HTTP 201 Created):**
  ```json
  {
    "success": true,
    "message": "File uploaded successfully.",
    "data": {
      "privateFile": {
        "private_file_id": 1,
        "title": "Uploaded Title",
        "description": "Optional note",
        "original_file_name": "sample.epub",
        "mime_type": "application/epub+zip",
        "file_size": 1048576,
        "file_format": "EPUB",
        "created_at": "2026-11-09T18:00:00.000Z",
        "updated_at": "2026-11-09T18:00:00.000Z"
      }
    }
  }
  ```
- **Error Response (HTTP 400 Bad Request):**
  ```json
  {
    "success": false,
    "message": "File extension does not match format EPUB. Expected .epub."
  }
  ```

#### ADMIN Public Book Upload
- **Request:**
  - Method: `POST`
  - URL: `/api/books/:id/pdf`
  - Content-Type: `multipart/form-data`
  - Headers: `Authorization: Bearer <token>` or HTTP cookie (`credentials: "include"`)
  - Form Data:
    - `file` (or `pdf`): Binary file (.pdf or .epub)
    - `format`: `'PDF'` or `'EPUB'`
- **Success Response (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "File imported successfully.",
    "data": {
      "book": {
        "book_id": 10,
        "title": "Existing Book Title",
        "status": "DRAFT",
        "file_format": "EPUB",
        "pdf_original_name": "sample.epub",
        "pdf_size": 1048576,
        "pdf_uploaded_at": "2026-11-09T18:00:00.000Z",
        "has_processed_text": false,
        "image_status": "not_attempted",
        "image_count": 0
      }
    }
  }
  ```
- **Error Response (HTTP 400 / 403 / 404):**
  ```json
  {
    "success": false,
    "message": "Uploaded file is not a valid EPUB container."
  }
  ```

---

## 6. Security, Ownership, and Publishing Permissions Verification

| Security Requirement | Implementation Finding | Source Location & Line Reference | Verification Status |
|---|---|---|---|---|
| **USER Upload Ownership Derivation** | `ownerId` is populated strictly from `user.user_id` (`req.user`), which is set by `requireAuth`. Any client-supplied `owner_id` in `req.body` is completely ignored. | `backend/src/services/privateLibrary.service.js:98-109`, `backend/src/middleware/auth.middleware.js:44` | `Verified` |
| **USER Upload Storage Isolation** | Stored in `uploads/private/` with random UUID (`crypto.randomUUID() + safeExt`). Never accessible via public URLs. | `backend/src/middleware/upload.middleware.js:68-71`, `backend/src/services/privateLibrary.service.js:101-102` | `Verified` |
| **USER Upload Query Scoping** | All queries (`findByIdAndOwner`, `findAllByOwner`, `deleteByIdAndOwner`) enforce `WHERE owner_id = ?`. Cross-user access returns 404. | `backend/src/repositories/privateLibrary.repository.js:20, 28, 48` | `Verified` |
| **USER Cannot Publish Publicly** | Private uploads are inserted into `user_pdf_books`, not the `books` table. No publishing routes exist for private files. | `backend/src/repositories/privateLibrary.repository.js:10-18` | `Verified` |
| **ADMIN Authorization Enforced** | Route requires `requireRole('ADMIN')`. Service layer additionally executes `assertAdmin(requestingUser)`. | `backend/src/routes/book.routes.js:28`, `backend/src/services/book.service.js:46-50, 125` | `Verified` |
| **ADMIN Upload Book Association** | Upload requires a valid `:id` parameter (`idParamRule`). Service verifies book exists (`bookRepository.findById(bookId)`). | `backend/src/routes/book.routes.js:28`, `backend/src/services/book.service.js:127-130` | `Verified` |
| **Upload Does Not Auto-Publish** | `updatePdfMetadata()` updates only `pdf_original_name`, `pdf_stored_name`, `pdf_size`, `pdf_uploaded_at`, `file_format`, `updated_at`. `status` remains `DRAFT`. Publishing requires an explicit `PATCH /api/books/:id/publish`. | `backend/src/repositories/book.repository.js:61-71`, `backend/src/controllers/book.controller.js:132` | `Verified` |

---

## 7. Status Classification Summary

### Summary Table

| Category | Item | Status |
|---|---|---|
| **API Path (USER)** | `POST /api/private-library/upload` | `Verified` |
| **API Path (USER proposed)** | `POST /private-library/upload/epub` | `Not implemented` |
| **API Path (ADMIN)** | `POST /api/books/:id/pdf` | `Verified` |
| **API Path (ADMIN proposed)** | `POST /book/:id/epub` | `Not implemented` |
| **Multipart Field** | `file` (accepted for PDF and EPUB) | `Verified` |
| **Multipart Field** | `pdf` (accepted for PDF and EPUB) | `Verified` |
| **Multipart Field** | `epub` (proposed field name) | `Needs clarification` |
| **Format Parameter** | `format` = `'PDF'` or `'EPUB'` | `Verified` |
| **Size Limit (Multer)** | Default 10 MB (env configurable) | `Needs clarification` (spec was 100 MB) |
| **ZIP Entry Limit** | 1,000 entries max | `Verified` |
| **Uncompressed Size Limit** | Checked against `MAX_UNCOMPRESSED_SIZE` (100 MB) | `Needs clarification` (spec was 500 MB) |
| **Ownership Isolation** | USER upload strictly bound to `req.user.user_id` | `Verified` |
| **Public Safety** | USER cannot publish to public catalogue | `Verified` |
| **Admin Association** | Attached to existing book ID | `Verified` |
| **Publishing State** | Upload does NOT auto-publish (stays DRAFT) | `Verified` |
| **Module 21 Engine** | `epubProcessor.js` / OPF / Reader parsing | `Not implemented` |
| **Branch Integration** | Module 20 code merged into `main` | `Partially implemented` (in `origin/module-20-pdf-epub-upload`, not in `main`) |

---

## 8. Frontend Integration Blueprint for Module 22

When authorized to proceed with the frontend implementation:

1. **User Private Library:**
   - Modify [`frontend/private-library.html`](file:///c:/Myproject/digital-library/frontend/private-library.html) to add format selector pills: `[ PDF ] [ EPUB ]`.
   - Update [`frontend/js/pages/private-library.js`](file:///c:/Myproject/digital-library/frontend/js/pages/private-library.js) to:
     - Track active format (`'PDF'` or `'EPUB'`).
     - Update input `accept` attribute (`.pdf,application/pdf` vs `.epub,application/epub+zip`).
     - Perform frontend extension/format matching validation.
     - Append `format: selectedFormat` to `FormData`.
     - Append file using field name `file` (or `pdf`).
     - Send request to `/private-library/upload` via `api.post()`.

2. **Admin Book Management:**
   - Modify [`frontend/admin-book.html`](file:///c:/Myproject/digital-library/frontend/admin-book.html) to add the format selector pills: `[ PDF ] [ EPUB ]`.
   - Update [`frontend/js/pages/admin-book.js`](file:///c:/Myproject/digital-library/frontend/js/pages/admin-book.js) to:
     - Implement the missing form submit handler for `book-pdf-form`.
     - Track selected format (`'PDF'` or `'EPUB'`).
     - Append `format: selectedFormat` to `FormData`.
     - Send request to `/books/${bookId}/pdf` via `api.post()`.
     - Handle loading, success, and error display without modifying publishing state.

3. **Backend Prerequisite:**
   - Ensure `origin/module-20-pdf-epub-upload` is active or merged, as current `main` branch rejects non-PDF files in `upload.middleware.js`.
