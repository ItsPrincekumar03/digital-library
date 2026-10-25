# File Upload Security Preparation

## 1. Purpose

This document defines security requirements for preparing, validating, storing, and serving uploaded files in the Digital Library application.

The project uses HTML, CSS, Vanilla JavaScript, Node.js, Express.js, and MySQL within a monolithic architecture.

Potential file-related features include book documents, PDF reading, and private-library resources. The actual upload capabilities and supported file types must be verified against the current backend implementation.

**Implementation status:** This document describes security requirements and preparation guidance. It does not confirm that every upload feature or safeguard is currently implemented.

## 2. Scope

This document covers:

- Upload authorization.
- File type and size validation.
- File name handling.
- File storage.
- File metadata in MySQL.
- Malicious file prevention.
- Private file access.
- Temporary file cleanup.
- Upload error handling.
- Testing and operational controls.

## 3. Security Principles

The application should:

1. Require appropriate authorization before accepting uploads.
2. Validate uploaded files on the backend.
3. Apply a configurable maximum file size.
4. Allow only explicitly supported file types.
5. Treat file names and metadata as untrusted input.
6. Generate safe server-side storage names.
7. Prevent path traversal.
8. Keep private files outside unrestricted public access.
9. Avoid executing uploaded content.
10. Maintain consistency between database records and stored files.

Frontend validation may improve usability but must not replace backend validation.

## 4. Define Supported File Types

Before implementing upload handling, define which formats are required by the product.

Potential formats include:

- PDF documents for reading.
- Images used for book covers, if supported.
- Other explicitly approved formats.

Do not automatically permit every file type merely because the upload library accepts it.

The allowed formats must match the approved requirements and actual reader functionality.

A file extension alone is not sufficient proof that a file contains the expected format.

## 5. Authorization Requirements

Before processing an upload, the backend should determine whether the requester is allowed to create the associated resource.

Requirements:

- Authenticate requests where required.
- Apply role-based permissions.
- Verify ownership for user-specific resources.
- Restrict administrative operations.
- Reject unauthorized uploads before persisting files.
- Avoid trusting a client-supplied owner identifier.
- Enforce authorization again when retrieving or deleting private files.

The exact permissions must follow the approved application requirements.

## 6. File Size Limits

Define an explicit maximum size for each supported upload category.

The limit should consider:

- Application requirements.
- Available storage.
- Memory consumption.
- Request-processing behavior.
- Database metadata requirements.
- Expected reader performance.

Enforce size limits at the request-parsing or upload-middleware layer and, where necessary, during stream processing.

Do not rely exclusively on the size reported by the browser.

Oversized uploads should be rejected with an appropriate response, such as `413 Content Too Large`, when consistent with the application's error conventions.

Avoid loading unnecessarily large files entirely into memory.

## 7. File Type Validation

Use multiple checks appropriate to the supported formats.

Recommended checks include:

1. Validate the file extension against an allowlist.
2. Inspect the reported MIME type as an initial signal.
3. Inspect the actual file signature or content where practical.
4. Reject malformed or unsupported files.
5. Validate that the intended reader can process the accepted format.
6. Prevent file content from being interpreted as executable server code.

The client-provided MIME type can be forged and must not be trusted alone.

PDF signature checks can help identify obvious mismatches but do not establish that a PDF is safe or structurally valid.

Do not accept HTML, JavaScript, executable files, or other active content unless there is an explicit, reviewed product requirement and appropriate isolation.

## 8. Safe File Names

Original file names must be treated as untrusted input.

Requirements:

- Generate a unique server-side storage name.
- Do not use a submitted file name directly as a filesystem path.
- Reject or normalize unsafe path components.
- Prevent path traversal sequences.
- Avoid collisions between uploaded files.
- Store the original display name separately only if required.
- Escape file names when displaying them in the frontend.
- Avoid exposing internal storage names unnecessarily.

A generated storage name should not be interpreted as authorization to access a resource.

## 9. Storage Location

Select a storage location appropriate to the application's deployment model.

Potential options include:

- A dedicated local upload directory.
- A protected directory outside the public web root.
- An approved external storage service in a future deployment.

For a beginner-friendly monolithic implementation, a dedicated local directory may be appropriate if its permissions and access controls are configured correctly.

Requirements:

- Restrict filesystem permissions.
- Avoid storing private files in an unrestricted public directory.
- Prevent uploaded files from being executed.
- Validate configured storage paths.
- Avoid returning absolute server paths to clients.
- Monitor disk usage.
- Include important files in the backup and recovery plan.

The actual storage design must be confirmed before documenting it as implemented.

## 10. Database Metadata

If uploaded files are represented in MySQL, store only the metadata required by the approved schema.

Potential metadata includes:

- Resource identifier.
- Associated book or user identifier, where applicable.
- Generated storage name or controlled storage reference.
- Original display name, if needed.
- Detected file type.
- File size.
- Creation timestamp.
- Processing status, if applicable.

These fields are illustrative. Actual names and relationships must match the current database schema.

Do not store filesystem paths that permit users to control arbitrary server-side locations.

Database metadata must not be treated as proof that the requesting user is authorized to access the file.

## 11. File and Database Consistency

Filesystem operations and MySQL transactions do not automatically form one atomic transaction.

An upload workflow should define how it handles partial failures.

Recommended workflow:

1. Authenticate and authorize the request.
2. Validate the incoming file.
3. Store it under a generated name in a controlled location.
4. Validate or process the file as required.
5. Create the corresponding database record.
6. Return a safe resource representation.
7. Clean up temporary or incomplete files if a later step fails.

The exact order may vary based on the implementation.

If database persistence fails after file storage, remove the unreferenced file when safe to do so.

If cleanup fails, record the failure securely and provide a controlled recovery procedure.

Do not delete an existing file merely because an unrelated request failed.

## 12. PDF-Specific Considerations

If PDF uploads are supported, apply additional safeguards.

Requirements:

- Verify that the file is an acceptable PDF.
- Reject malformed files safely.
- Limit file size and processing time.
- Avoid exposing internal storage paths.
- Restrict access to private PDFs.
- Handle parser errors without crashing the server.
- Consider resource consumption during rendering or extraction.
- Keep PDF processing libraries appropriately maintained.
- Avoid assuming that a valid PDF is harmless.

If `pdfjs-dist` is used for browser-side reading, verify the actual dependency and implementation before describing it as a current feature.

PDF parsing, text extraction, and OCR are separate capabilities. OCR should not be assumed to exist unless implemented.

## 13. Private File Access

Private files must not become publicly accessible merely because they have a URL or file identifier.

The backend should:

1. Authenticate the requester where required.
2. Retrieve the resource metadata.
3. Apply the relevant ownership or role policy.
4. Confirm the resource is available.
5. Resolve the stored file using a controlled path.
6. Return the file only after authorization succeeds.

Apply access checks to downloads, streaming, previews, and other file-serving operations.

Avoid direct public links to private filesystem paths.

Where supported by the deployment architecture, use safe response headers and prevent browser content sniffing.

## 14. Malware and Malicious Content

Uploaded documents may contain malicious or malformed content.

Risk-reduction measures may include:

- File-type allowlists.
- File signature inspection.
- Updated file-processing dependencies.
- Antivirus scanning where available and appropriate.
- Processing limits.
- Restricted storage permissions.
- Safe download behavior.
- Isolation of high-risk processing workloads where justified.

Do not claim malware scanning is available unless a scanner is configured and its behavior has been verified.

File validation reduces risk but cannot guarantee that a file is harmless.

## 15. Authentication and Rate Limiting

Upload endpoints should have appropriate authentication and abuse controls.

Requirements:

- Require the intended role or ownership permission.
- Apply rate limits where appropriate.
- Restrict request sizes.
- Avoid accepting unlimited concurrent uploads.
- Prevent unauthorized repeated upload attempts.
- Return safe error messages.
- Avoid logging credentials or file contents.

Rate limits should complement, not replace, size and storage controls.

## 16. Error Handling

Potential upload errors include:

- No file provided.
- Unsupported format.
- Invalid file content.
- File too large.
- Unauthorized request.
- Storage unavailable.
- Disk space exhausted.
- Database persistence failure.
- File-processing failure.

The API should return appropriate status codes and follow the established response format.

Do not expose:

- Absolute filesystem paths.
- Internal server configuration.
- Stack traces.
- Database credentials.
- Private document contents.

Temporary files should be cleaned up safely when processing fails.

## 17. Logging and Privacy

Logs should support investigation without unnecessarily exposing uploaded content.

Requirements:

- Do not log file contents.
- Avoid logging authentication tokens.
- Avoid logging sensitive personal information unnecessarily.
- Record useful failure details.
- Restrict access to logs.
- Define appropriate retention practices.
- Avoid exposing private storage locations to clients.

If audit events are required, record the relevant resource identifier and action without copying the document itself into logs.

## 18. Testing Requirements

Test the upload features that actually exist.

Recommended scenarios:

1. Upload an accepted file.
2. Upload an unsupported extension.
3. Upload a file with a forged MIME type.
4. Upload malformed PDF content.
5. Upload a file exceeding the configured size limit.
6. Submit a request without a file.
7. Attempt an upload without required authentication.
8. Attempt an upload without the required role.
9. Submit a filename containing path traversal sequences.
10. Upload two files with the same original name.
11. Simulate a storage failure.
12. Simulate a database failure after storage.
13. Verify incomplete files are cleaned up.
14. Attempt to access another user's private file.
15. Verify file-processing errors are handled safely.
16. Verify uploaded files cannot execute as server-side code.

Use isolated test files and a safe test environment. Do not run destructive tests against production data.

Record actual outcomes and evidence. Do not mark unexecuted tests as passed.

## 19. Implementation Verification Checklist

- [ ] Supported file formats are documented.
- [ ] Upload authorization is enforced.
- [ ] File-size limits are configured.
- [ ] File type validation is performed on the backend.
- [ ] File names are handled safely.
- [ ] Storage paths are controlled.
- [ ] Private files are protected.
- [ ] Database metadata matches the actual schema.
- [ ] Partial failures are handled safely.
- [ ] Temporary files are cleaned up where appropriate.
- [ ] PDF-processing behavior is verified, if supported.
- [ ] Logging does not expose sensitive content.
- [ ] Relevant tests have been executed.

## 20. Related Documentation

- `authentication.md`
- `authorization.md`
- `content-model.md`
- `environment.md`
- `error-handling.md`
- `validation.md`
- `sql-injection.md`
- `xss.md`
- `../api/private-library.md`
- `../api/books.md`
- `../03-technical/database-design.md`
- `../08-deployment/production-checklist.md`
- `../07-testing/security-testing.md`

## 21. Maintenance

Update this document when upload formats, storage architecture, file-size limits, private-file access rules, processing libraries, or file metadata change.

Keep these requirements aligned with the current backend implementation, approved product scope, and executed security tests.
