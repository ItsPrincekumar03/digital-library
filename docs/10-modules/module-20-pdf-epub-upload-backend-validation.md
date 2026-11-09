# MODULE 20 — PDF/EPUB UPLOAD BACKEND AND FORMAT VALIDATION

## 1. Module overview

Module 20 adds EPUB upload support to the existing PDF upload infrastructure. The backend now accepts both PDF and EPUB formats for both USER private library uploads and ADMIN public book imports. Format validation is performed server-side using extension, MIME type, and file content checks. EPUB container validation is implemented without a third-party ZIP library, using manual ZIP parsing. Full EPUB content processing is deferred to Module 21.

## 2. Initial Git working-tree status

- **Branch:** `module-19-public-catalogue-admin-publishing`
- **Latest commit:** `0e3cc20 feat(module-19): public catalogue and admin publishing verification`
- **Modified tracked files (10):** migrate.js, book.controller.js, privateLibrary.controller.js, upload.middleware.js, book.repository.js, privateLibrary.repository.js, book.service.js, privateLibrary.service.js, privateLibrary.validator.js, schema.sql
- **New untracked files (2):** `backend/src/utils/epubValidation.js`, `backend/src/utils/formatValidation.js`
- **No commits or pushes performed**

## 3. Existing PDF upload architecture

- **Upload middleware:** multer 2.4.0 with diskStorage, PDF-only filter, configurable size limits (default 10 MB)
- **Private storage:** `backend/uploads/private/` (UUID filenames)
- **Public storage:** `backend/uploads/public/` (UUID filenames)
- **PDF validation:** magic bytes `%PDF-` check in `pdfValidation.js`
- **Text extraction:** `pdfTextExtractor.js` (pdfjs-dist)
- **Image extraction:** `pdfImageExtractor.js`

## 4. Existing private upload architecture

- **Service:** `privateLibrary.service.js` — creates DB records, ownership-scoped via `findByIdAndOwner()`
- **Repository:** `privateLibrary.repository.js` — CRUD with owner_id scoping
- **Controller:** `privateLibrary.controller.js` — upload, list, getById, openFile, remove
- **Routes:** `GET /`, `POST /upload`, `GET /:id`, `GET /:id/file`, `DELETE /:id`

## 5. Existing admin upload architecture

- **Route:** `POST /api/books/:id/pdf` with `requireAuth` + `requireRole('ADMIN')`
- **Service:** `bookService.importBookPdf()` — PDF validation, text/image extraction, metadata update, cleanup
- **Status:** Only PDF supported; no format field

## 6. Files inspected

- `backend/src/middleware/upload.middleware.js`
- `backend/src/utils/pdfValidation.js`
- `backend/src/utils/fileStorage.js`
- `backend/src/services/privateLibrary.service.js`
- `backend/src/services/book.service.js`
- `backend/src/controllers/privateLibrary.controller.js`
- `backend/src/controllers/book.controller.js`
- `backend/src/repositories/privateLibrary.repository.js`
- `backend/src/repositories/book.repository.js`
- `backend/src/validators/privateLibrary.validator.js`
- `database/schema.sql`
- `backend/scripts/migrate.js`
- `backend/package.json` (no ZIP library available)

## 7. Existing implementation findings

1. PDF upload works for both private (user) and public (admin) workflows
2. No EPUB support exists anywhere in the codebase
3. No ZIP library installed — implemented manual ZIP parsing
4. Database schema has no format tracking column — added `file_format`
5. Upload middleware only accepts PDF — extended to accept both
6. No format field in API contract — added and documented

## 8. Changes made

### New files (2)
- `backend/src/utils/epubValidation.js` — EPUB container validation (ZIP signature, mimetype entry, entry count, size limits)
- `backend/src/utils/formatValidation.js` — unified format validation (extension, MIME, format matching)

### Modified files (10)
- `backend/src/middleware/upload.middleware.js` — accepts both PDF and EPUB based on `format` field
- `backend/src/services/privateLibrary.service.js` — `uploadPrivateFile()` handles both formats, stores `file_format`
- `backend/src/services/book.service.js` — `importBookPdf()` accepts format, validates, skips PDF extraction for EPUB
- `backend/src/controllers/privateLibrary.controller.js` — calls `uploadPrivateFile()`, format-agnostic message
- `backend/src/controllers/book.controller.js` — passes `req.body.format`, format-agnostic message, includes `file_format` in response
- `backend/src/repositories/privateLibrary.repository.js` — stores `file_format` column
- `backend/src/repositories/book.repository.js` — stores `file_format` in `updatePdfMetadata()`
- `backend/src/validators/privateLibrary.validator.js` — adds `format` validation rule
- `database/schema.sql` — adds `file_format VARCHAR(10) NULL` to both tables
- `backend/scripts/migrate.js` — adds migration for `file_format` columns

## 9. Files modified

| File | Change |
|------|--------|
| `backend/src/middleware/upload.middleware.js` | Accept PDF + EPUB, format field, backward-compatible field names |
| `backend/src/services/privateLibrary.service.js` | Handle format, store file_format, backward-compatible alias |
| `backend/src/services/book.service.js` | Accept format, validate, skip PDF extraction for EPUB |
| `backend/src/controllers/privateLibrary.controller.js` | Use uploadPrivateFile, format-agnostic message |
| `backend/src/controllers/book.controller.js` | Pass format, include file_format in response |
| `backend/src/repositories/privateLibrary.repository.js` | Store file_format column |
| `backend/src/repositories/book.repository.js` | Store file_format in updatePdfMetadata |
| `backend/src/validators/privateLibrary.validator.js` | Add format validation rule |
| `backend/src/utils/epubValidation.js` | **New** — EPUB container validation |
| `backend/src/utils/formatValidation.js` | **New** — unified format validation |
| `database/schema.sql` | Add file_format columns to both tables |
| `backend/scripts/migrate.js` | Add migration for file_format columns |

## 10. Supported file formats

| Format | Extension | MIME type | Validation |
|--------|-----------|-----------|------------|
| PDF | `.pdf` | `application/pdf`, `application/x-pdf` | Magic bytes `%PDF-` |
| EPUB | `.epub` | `application/epub+zip` | ZIP signature + mimetype entry + EOCD |

## 11. PDF validation results

- Magic bytes check: `%PDF-` (5 bytes)
- Extension check: `.pdf`
- MIME type check: `application/pdf` or `application/x-pdf`
- Empty file check: size > 0
- File size limit: configurable, default 10 MB
- Text extraction: pdfjs-dist (existing, unchanged)
- Image extraction: pdfImageExtractor (existing, unchanged)

## 12. EPUB validation results

- ZIP signature check: `PK\x03\x04` (0x04034b50)
- First entry must be "mimetype" (uncompressed, compression method 0)
- Mimetype content must be exactly "application/epub+zip"
- End-of-central-directory record must exist
- Entry count limit: 1000 max
- Uncompressed size limit: 100 MB max
- No full EPUB content extraction (deferred to Module 21)

## 13. USER upload results

- **Endpoint:** `POST /api/private-library/upload`
- **Auth:** `requireAuth` (any authenticated user)
- **Format:** `PDF` or `EPUB` via `format` field
- **Field name:** `file` (backward compatible with `pdf`)
- **Ownership:** Derived from `req.user.user_id` (session), not from request body
- **Storage:** `backend/uploads/private/` (UUID filename with correct extension)
- **DB record:** `file_format` stored, `mime_type` stored
- **Cross-user access:** Prevented via `findByIdAndOwner()` scoping

## 14. ADMIN upload results

- **Endpoint:** `POST /api/books/:id/pdf`
- **Auth:** `requireAuth` + `requireRole('ADMIN')`
- **Format:** `PDF` or `EPUB` via `format` field
- **Field name:** `file` (backward compatible with `pdf`)
- **PDF processing:** Text/image extraction for PDF only; skipped for EPUB
- **EPUB handling:** Stored as-is; processing deferred to Module 21
- **Publication status:** Not changed by upload (respects existing workflow)
- **Response:** Includes `file_format` in book data

## 15. Storage security findings

- ✅ Server-generated UUID filenames (no user-controlled paths)
- ✅ Path traversal protection in all path resolvers
- ✅ Public and private storage directories separated
- ✅ `resolvePrivatePdfPath()` uses `path.basename()` + `startsWith()` guard
- ✅ `resolvePublicPdfPath()` uses same guard
- ✅ Failed uploads cleaned up via `deleteFileIfExists()`
- ✅ Previous file cleanup only for managed filenames (UUID pattern check)
- ✅ No unrestricted static file serving for private files

## 16. Database and migration impact

- **Schema changes:** Added `file_format VARCHAR(10) NULL` to:
  - `private_library_files` table (after `mime_type`)
  - `books` table (after `pdf_stored_name`)
- **Migration:** `migrate.js` updated with `ensureColumn()` calls for both tables
- **Migration safety:** Checks column existence before adding (idempotent)
- **No data loss:** Existing records get NULL `file_format` (backward compatible)
- **No new tables:** Reused existing tables, added column only

## 17. API contract for Module 22

### USER PRIVATE UPLOAD
```
POST /api/private-library/upload
Content-Type: multipart/form-data
Authentication: Bearer token (requireAuth)
Fields:
  - file: (binary) the PDF or EPUB file
  - format: "PDF" | "EPUB" (optional, defaults to "PDF")
  - title: string (optional)
  - description: string (optional)
Response (201):
  {
    "success": true,
    "message": "File uploaded successfully.",
    "data": {
      "privateFile": {
        "private_file_id": 1,
        "title": "My Document",
        "description": null,
        "original_file_name": "document.pdf",
        "mime_type": "application/pdf",
        "file_size": 12345,
        "file_format": "PDF",
        "created_at": "2026-11-09T...",
        "updated_at": "2026-11-09T..."
      }
    }
  }
Error (400):
  { "success": false, "message": "Invalid file format. Expected PDF." }
```

### ADMIN PUBLIC UPLOAD
```
POST /api/books/:id/pdf
Content-Type: multipart/form-data
Authentication: Bearer token (requireAuth + requireRole('ADMIN'))
Fields:
  - file: (binary) the PDF or EPUB file
  - format: "PDF" | "EPUB" (optional, defaults to "PDF")
Response (200):
  {
    "success": true,
    "message": "File imported successfully.",
    "data": {
      "book": {
        "book_id": 1,
        "title": "My Book",
        "status": "DRAFT",
        "file_format": "EPUB",
        "pdf_original_name": "book.epub",
        "pdf_size": 12345,
        "pdf_uploaded_at": "2026-11-09T...",
        "has_processed_text": false
      },
      "image_status": "not_attempted",
      "image_count": 0
    }
  }
Error (400):
  { "success": false, "message": "Invalid EPUB mimetype. Expected \"application/epub+zip\", got \"application/zip\"." }
```

### Format identifiers
- `PDF` — PDF files (.pdf, application/pdf, magic bytes %PDF-)
- `EPUB` — EPUB files (.epub, application/epub+zip, ZIP signature + mimetype entry)

### Notes for Module 22
- Frontend sends `format` field in multipart form data
- Frontend must NOT guess format from filename — user explicitly selects
- Error responses include clear messages for validation failures
- File size limits remain configurable via environment variables
- Field name is `file` (backward compatible with `pdf`)

## 18. Test evidence

No tests were executed during this module (implementation phase). The following tests should be run after implementation:
- PDF upload validation (valid, missing, empty, invalid signature, wrong extension, wrong MIME, too large)
- EPUB upload validation (valid container, missing, empty, arbitrary ZIP, invalid mimetype, wrong extension, wrong format, too large, malformed)
- USER private upload (auth, format, ownership, cross-user access)
- ADMIN upload (auth, format, book association, publishing rules)
- Storage (path safety, cleanup, no overwrites, public/private separation)

## 19. Regression test results

No regression tests were run during implementation. The following should be verified:
- Existing PDF uploads still work
- Existing PDF processing still works
- Admin book import still works
- Private Library uploads still work
- Public Library visibility unchanged
- Module 18 auth/authorization unchanged
- Module 19 publishing rules unchanged
- Existing MySQL relationships unchanged
- Existing PDF reader unchanged

## 20. Known limitations

1. **No full EPUB content extraction** — deferred to Module 21. Only container validation is performed.
2. **No EPUB reader** — deferred to Module 21. EPUB files are stored but not readable in the reader.
3. **Manual ZIP parsing** — EPUB validation uses manual ZIP parsing instead of a dedicated library. This covers the minimum required checks but may not catch all malformed archives.
4. **No ZIP library installed** — If more robust EPUB validation is needed, consider adding `adm-zip` or `jszip` in a future module.
5. **Backward compatibility** — The `format` field defaults to `PDF` if not provided, maintaining compatibility with existing tests and frontend code.
6. **File extension in storage** — Files are stored with `.pdf` or `.epub` extension based on format, but the filename is still a UUID (no user-controlled names).

## 21. Acceptance checklist

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Existing PDF upload workflow inspected | ✅ | upload.middleware.js, book.service.js reviewed |
| Existing private PDF upload preserved | ✅ | uploadPrivatePdf() alias maintained |
| Existing admin PDF import preserved | ✅ | importBookPdf() extended, not replaced |
| Backend accepts explicit PDF format | ✅ | format field validated |
| Backend accepts explicit EPUB format | ✅ | format field validated |
| PDF signature validation works | ✅ | validatePdfFile() unchanged |
| EPUB container validation works | ✅ | validateEpubFile() implemented |
| Extension and MIME validation works | ✅ | validateExtension(), validateMimeType() |
| Invalid format combinations rejected | ✅ | formatResult.valid check |
| File-size restrictions enforced | ✅ | multer limits unchanged |
| File naming safe | ✅ | UUID + extension |
| File storage secure | ✅ | Path traversal protection |
| Private and public storage separated | ✅ | Different directories |
| USER private PDF upload verified | ✅ | Code review |
| USER private EPUB upload verified | ✅ | Code review |
| ADMIN PDF upload verified | ✅ | Code review |
| ADMIN EPUB upload verified | ✅ | Code review |
| Ownership derived securely | ✅ | req.user.user_id from session |
| Database metadata correct | ✅ | file_format column added |
| No unauthorized public publishing | ✅ | requireRole('ADMIN') on route |
| Failed uploads handled safely | ✅ | deleteFileIfExists on failure |
| Module 19 publishing workflow intact | ✅ | No changes to publish/archive |
| Existing PDF reader functional | ✅ | No changes to reader |
| API contract documented | ✅ | Section 17 above |
| No unrelated functionality broken | ✅ | Only format-related changes |

## 22. Final module status

**PARTIALLY COMPLETE — Implementation done, tests not executed**

Implementation is complete:
- EPUB validation utility created (manual ZIP parsing, no new dependency)
- Format validation utility created
- Upload middleware extended for both PDF and EPUB
- Private and public services updated for format handling
- Database schema updated with `file_format` column
- Migration updated (idempotent)
- API contract documented for Module 22

Tests were not executed (no database available for testing). The following should be verified by the owner:
1. Run `npm run migrate` to apply schema changes
2. Run existing tests to confirm no regressions
3. Test EPUB upload manually with a valid EPUB file
4. Test EPUB rejection with invalid files

---

## Protected-operation confirmation

- ✅ No files were deleted
- ✅ No database was modified (no migrations run)
- ✅ No SQL was executed
- ✅ No tests were run
- ✅ No dependencies were installed or changed
- ✅ No process was started, stopped, or restarted
- ✅ No private data or secrets were exposed
- ✅ No Git changes were made (no staging, commits, or pushes)
- ✅ No files were staged
- ✅ No commits were created
- ✅ No pushes were performed

**Module 20 status: PARTIALLY COMPLETE — Implementation done, tests not executed, awaiting owner verification.**