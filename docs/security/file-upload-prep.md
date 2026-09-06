# File Upload Preparation

No file upload feature is implemented in this module. This document only records the requirements a future book-cover or chapter-attachment upload feature must satisfy, so later modules can build on a clear, agreed plan rather than deciding security rules ad hoc.

## File type validation
- Uploads must be restricted to an explicit allow-list of MIME types and file extensions (for example image/jpeg, image/png for covers). The check must inspect the actual file content signature, not just the client-supplied filename or Content-Type header, since both can be spoofed.
- Executable file types, HTML, and SVG (which can contain embedded scripts) must never be accepted for cover images.

## File size limits
- A maximum upload size must be enforced at the middleware level (for example using multer's limits option) before the file is fully read into memory or disk, to prevent large-file denial-of-service attempts.
- A sensible starting limit for a cover image would be in the low single-digit megabytes.

## Safe file names
- The original client-supplied filename must never be used directly as the stored filename, since it may contain path traversal sequences (../) or unsafe characters.
- A generated, unpredictable filename (for example a UUID plus the validated extension) should be used instead, with the original filename retained only as metadata if needed.

## Safe storage location
- Uploaded files must be stored outside of any directory that could be interpreted as executable by the server, and ideally outside the web-served static directory entirely, with access mediated through an API endpoint rather than direct static file serving.
- The storage path must be built from the generated safe filename only, never by concatenating user input into a file system path.

## Association with existing data
- Once implemented, an uploaded file's path would be stored in the existing cover_path column already added to the books table in Module 5/6, keeping the schema unchanged for this preparatory step.
