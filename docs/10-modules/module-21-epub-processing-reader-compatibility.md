# MODULE 21 — EPUB PROCESSING AND READER COMPATIBILITY

## 1. Module Overview

Module 21 completes full EPUB processing, archive security, and continuous reader compatibility for the Digital Library project. Building on the format validation foundation established in Module 20, Module 21 introduces secure extraction, robust XML/XHTML parsing, strict HTML/CSS sanitization, hierarchical table-of-contents generation, internal image handling, and seamless integration with the existing continuous reader without requiring frontend reader redesigns.

Both EPUB 2 and EPUB 3 formats are fully supported across both Public Library (ADMIN-managed publishing) and Private Library (user-owned personal documents) pipelines.

---

## 2. Actual Architecture

```
                          [ Client / Reader UI ]
                                    │
                                    ▼
                          [ Express Web Server ]
                                    │
        ┌───────────────────────────┴───────────────────────────┐
        ▼                                                       ▼
 [ Public Books API ]                                  [ Private Library API ]
   /api/books/:id/document                               /api/private-library/:id/document
   /api/books/:id/toc                                    /api/private-library/:id/file
   /api/books/:id/chapters/:idx
   /api/books/:id/images/:name
        │                                                       │
        ▼                                                       ▼
 [ bookService.js ]                                  [ privateLibraryService.js ]
        │                                                       │
        └───────────────────────────┬───────────────────────────┘
                                    │
                                    ▼
                         [ epubProcessor.js ]
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                           ▼                           ▼
  [ unzipper ]               [ htmlparser2 ]             [ sanitize-html ]
  • Safe streaming           • Standard XML parser       • Strict tag whitelist
  • Byte counter limits      • Attribute-order agnostic  • URL scheme whitelist
  • ZIP64 rejection          • EPUB 2 NCX / EPUB 3 nav   • CSS property whitelist
  • CRC-32 verification      • Spine order extraction    • Script / event stripping
  • Path traversal guard     • Block classification      • Overlay / spoof defense
```

### Key Architectural Decisions:
1. **Zero Frontend Reader Redesign:** EPUB content is transformed into the standard continuous reader schema (`pages` array containing classified blocks: `heading`, `subheading`, `paragraph`, `list-item`, `caption`, along with `textChars` for Text-to-Speech). The existing reader (`read.js`, `read-settings.js`, `read-tts.js`, `read-chapters.js`) renders EPUB documents out of the box with custom font scaling, themes, dyslexia-friendly typography, and 1x–4x audio playback.
2. **Standard XML/DOM Parsing:** Rather than fragile regex-based string extraction, standard XML parsing is handled by `htmlparser2` in XML mode. All attribute ordering, XML namespace prefixes (`dc:title`, `xmlns:dc`), and whitespace variances are supported.
3. **Actual Streaming Decompression Enforcement:** Memory and zip-bomb attacks are mitigated by attaching an in-flight byte counter to entry decompression streams. If an individual entry emits >50 MB or the running total emits >500 MB, the stream is aborted immediately before heap exhaustion occurs.
4. **Strict CSS & HTML Policy:** Inline styling is locked down via `sanitize-html`'s `allowedStyles`. Dangerous CSS properties such as `position: fixed`, `position: absolute`, `z-index`, `overflow`, `opacity: 0`, and display overlays are completely stripped, preventing reader UI hijacking.

---

## 3. Implemented Processing Flow

1. **Upload & Format Validation (Module 20):**
   - File extension, MIME type, and ZIP container validation are verified.
   - Raw archive is written to disk under a server-generated UUID: `<uuid>.epub`.
2. **Archive Pre-Inspection (`epubProcessor.js`):**
   - Validates that compressed file size $\le 100\text{ MB}$.
   - Scans the archive end-record buffer for ZIP64 signatures (`PK\x06\x07` locator and `PK\x06\x06` EOCD) and explicitly rejects ZIP64.
   - Normalizes all entry paths (replacing `\` with `/`).
   - Verifies entry count $\le 1,000$.
   - Enforces case-insensitive duplicate normalized entry detection.
   - Rejects relative path traversal segments (`..`), absolute paths, and leading slashes.
3. **Rootfile & Package Document Discovery:**
   - Reads `META-INF/container.xml` using streaming byte limits.
   - Parses `container.xml` using `htmlparser2` in XML mode and extracts the `rootfile`'s `full-path` attribute.
   - Reads the package document (`.opf`) from the resolved rootfile path.
4. **OPF Manifest, Metadata & Spine Parsing:**
   - Extracts metadata: `title`, `creator`, `language`, `identifier`, `description`, `publisher`, `date`.
   - Populates manifest item map: `id -> { id, href, mediaType, properties, fullPath }`.
   - Parses `<spine>` itemrefs and establishes the strict reading order.
5. **Table of Contents (TOC) Extraction:**
   - **EPUB 3:** Locates `<nav epub:type="toc">` in `nav.xhtml` (identified by manifest `properties="nav"` or XHTML document with `nav`). Recursively parses nested `<ol>` and `<li>` elements, preserving hierarchical nesting levels (`subitems`).
   - **EPUB 2:** Locates `toc.ncx` (identified by manifest `application/x-dtbncx+xml` or spine `toc="ncx"`). Recursively parses `<navMap>` and nested `<navPoint>` elements.
6. **Chapter Extraction & Reader Transformation:**
   - Iterates through the spine entries in reading order.
   - Decompresses each chapter XHTML document under streaming limit guards and verifies CRC-32 against declared header values.
   - Passes XHTML through `sanitizeHtml` with strict tag, attribute, URL scheme, and CSS property allowlists.
   - Parses sanitized HTML into structured reader blocks:
     - `<h1>`, `<h2>` $\rightarrow$ `{ kind: 'heading', text }`
     - `<h3>`, `<h4>`, `<h5>`, `<h6>` $\rightarrow$ `{ kind: 'subheading', text }`
     - `<p>`, `<blockquote>` $\rightarrow$ `{ kind: 'paragraph', text }`
     - `<li>` $\rightarrow$ `{ kind: 'list-item', text }`
     - `<figcaption>` $\rightarrow$ `{ kind: 'caption', text }`
   - Accumulates total text and character counts for Text-to-Speech (TTS).
7. **Image Extraction & Delivery:**
   - Resolves chapter image references (`<img src="...">`) relative to the chapter file's directory within the EPUB.
   - Verifies PNG magic bytes (`[137, 80, 78, 71, 13, 10, 26, 10]`).
   - Writes valid PNG images to the public document image directory: `<uuid>.images/p<page>-<seq>.png`.
   - Records images in `document.images` with `{ file, pages, mimeType }`.
8. **Persistence & Database Linkage:**
   - Writes processed document payload to `uploads/public/<uuid>.processed.json`.
   - Updates `books.processed_content_path` in MySQL.
   - If an error occurs during extraction, the error is logged and the book retains its uploaded file while `processed_content_path` remains `NULL`, leaving existing records consistent.

---

## 4. API Contract

### 4.1 Public Reader APIs

#### `GET /api/books/:id/document`
- **Authentication:** `requireAuth` (Cookie or Bearer token).
- **Authorization:** Regular users can only access `PUBLISHED` books (draft books return 404). Administrators can access any book.
- **Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "document": {
      "version": 1,
      "bookId": 42,
      "fileFormat": "EPUB",
      "metadata": {
        "title": "Moby Dick",
        "creator": "Herman Melville",
        "language": "en",
        "identifier": "urn:uuid:..."
      },
      "sourceFile": "Moby Dick",
      "pageCount": 135,
      "textChars": 1254300,
      "extractedAt": "2026-11-09T18:50:00.000Z",
      "pages": [
        {
          "pageNumber": 1,
          "chapterId": "ch01",
          "chapterTitle": "Chapter 1: Loomings",
          "text": "Call me Ishmael...",
          "paragraphs": ["Call me Ishmael..."],
          "blocks": [
            { "kind": "heading", "text": "Chapter 1: Loomings" },
            { "kind": "paragraph", "text": "Call me Ishmael..." }
          ],
          "html": "<h2>Chapter 1: Loomings</h2><p>Call me Ishmael...</p>"
        }
      ],
      "toc": [
        {
          "title": "Chapter 1: Loomings",
          "href": "chapter1.xhtml",
          "level": 1,
          "subitems": []
        }
      ],
      "images": [
        {
          "file": "550e8400-e29b-41d4-a716-446655440000.images/p1-1.png",
          "pages": [1],
          "mimeType": "image/png"
        }
      ],
      "imageStatus": {
        "status": "completed",
        "extractedCount": 1,
        "pageReferences": 1,
        "totalBytes": 0,
        "message": "Successfully extracted 1 image(s)."
      }
    }
  }
}
```

#### `GET /api/books/:id/toc`
- **Authentication:** `requireAuth`.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "toc": [
      {
        "title": "Part 1: The Journey",
        "href": "ch1.xhtml",
        "level": 1,
        "subitems": [
          {
            "title": "Section 1.1",
            "href": "ch1.xhtml#s1",
            "level": 2,
            "subitems": []
          }
        ]
      }
    ]
  }
}
```

#### `GET /api/books/:id/chapters/:chapterIndex`
- **Authentication:** `requireAuth`.
- **Parameters:** `chapterIndex` (integer $\ge 1$).
- **Response (200 OK):** Returns single page object containing `pageNumber`, `blocks`, and `html`.

#### `GET /api/books/:id/images/:imageName`
- **Authentication:** `requireAuth`.
- **Validation:** `imageName` must match regex `^p\d+-\d+\.png$`.
- **Response (200 OK):** Raw PNG stream (`Content-Type: image/png`, `Cache-Control: private, max-age=86400`).

---

### 4.2 Private Library Reading APIs

#### `GET /api/private-library/:id/document`
- **Authentication:** `requireAuth`.
- **Ownership:** Scoped strictly to requesting user via `findByIdAndOwner()`. Intruder or non-owner requests return `404 Not Found` (never 403, preventing resource enumeration).
- **Response (200 OK):** Processed document payload for user's uploaded EPUB or PDF.

#### `GET /api/private-library/:id/file`
- **Authentication:** `requireAuth`.
- **Response (200 OK):** Raw download stream of uploaded file with correct MIME type.

---

## 5. Security Controls Summary

| Security Domain | Enforced Mechanism | Implementation Location |
| :--- | :--- | :--- |
| **Archive Size Limits** | Max 100 MB compressed (`stat.size`) | `epubProcessor.js:218–223` |
| **Archive Entry Limits** | Max 1,000 entries (`directory.files.length`) | `epubProcessor.js:231–235` |
| **ZIP64 Protection** | Scans archive tail for `PK\x06\x07` and `PK\x06\x06` signatures; explicitly rejects | `epubProcessor.js:82–105` |
| **Streaming Byte Counter** | In-flight tracking on stream chunks; max 50 MB per entry, max 500 MB total | `epubProcessor.js:111–145` |
| **CRC-32 Integrity** | Software CRC-32 verification on decompressed buffers against declared entry CRC | `epubProcessor.js:147–156` |
| **Path Traversal Guard** | Rejects `..`, `\`, leading `/`, drive letters, and non-canonical relative paths | `epubProcessor.js:247–258` |
| **Duplicate Entry Guard** | Case-insensitive Set tracking normalized entry names; duplicate causes rejection | `epubProcessor.js:238–246` |
| **XSS & Script Injection** | Strips `<script>`, event handlers (`on*`), and `javascript:` URLs via `sanitize-html` | `epubProcessor.js:46–77` |
| **Active Embedded Content** | Strips `<iframe>`, `<object>`, `<embed>`, `<svg>`, `<math>` | `epubProcessor.js:46–54` |
| **CSS Overlay & Spoofing** | Strict `allowedStyles` allowlist; drops `position`, `z-index`, `overflow`, `opacity` | `epubProcessor.js:61–75` |
| **Access Control** | Enforces `requireAuth`, book visibility rules, and private document ownership | `book.service.js`, `privateLibrary.service.js` |

---

## 6. Test Evidence

Automated testing was conducted against the isolated test database `digital_library_test` using synthetic EPUB fixtures under `tests/fixtures/epub/`.

### Executed Test Commands:
```powershell
$env:TEST_DB_NAME='digital_library_test'; $env:DB_NAME='digital_library_test'; node tests/module21-epub-processing.test.js
$env:TEST_DB_NAME='digital_library_test'; $env:DB_NAME='digital_library_test'; node tests/module20-upload-verification.test.js
$env:TEST_DB_NAME='digital_library_test'; $env:DB_NAME='digital_library_test'; $env:BASE_URL='http://localhost:5001'; node tests/reader-availability.test.js
$env:TEST_DB_NAME='digital_library_test'; $env:DB_NAME='digital_library_test'; node tests/archival-verification.js
```

### Execution Results:
- `tests/module21-epub-processing.test.js`: **54 passed, 0 failed** (Exit code: 0).
- `tests/module20-upload-verification.test.js`: **12 passed, 0 failed** (Exit code: 0).
- `tests/reader-availability.test.js`: **29 passed, 0 failed** (Exit code: 0).
- `tests/archival-verification.js`: **All repository checks passed** (Exit code: 0).

---

## 7. Known Limitations

1. **External Stylesheets:** External CSS stylesheets (`<link rel="stylesheet">`) and internal `<style>` blocks are stripped to ensure consistent reader theming and prevent UI hijacking. Inline styling is permitted for typography and alignment properties (`color`, `text-align`, `font-size`, `font-style`, `font-weight`, `line-height`, `margin`, `padding`).
2. **Fixed-Layout EPUBs:** Fixed-layout comics or manga designed with pixel-absolute positioning are rendered as continuous linear chapters in keeping with the QuickNovel continuous reader model.
3. **Internal Images:** Only valid PNG image assets extracted from EPUB packages are currently registered in `document.images` and served via `/images/:imageName` to comply with the existing frontend reader's `^p\d+-\d+\.png$` contract. Non-PNG images remain accessible within the raw downloadable archive.
