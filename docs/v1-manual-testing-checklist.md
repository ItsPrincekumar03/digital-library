# Digital Library V1 — Manual Testing & Acceptance Checklist

**Project:** Digital Library (BTech 7th Semester Final Year Capstone Project)  
**Target Version:** 1.0 (Module 15 Acceptance)  
**Audience:** QA Testers, Project Evaluators, Faculty Examiners  
**Last Updated:** October 25, 2026  

---

## 1. Test Environment Setup & Credentials

Before beginning manual testing, ensure the backend server and database are active.

- **Frontend Base URL:** `http://localhost:3000` (or staging URL)
- **Backend API URL:** `http://localhost:5000`
- **Recommended Browsers:** Google Chrome 120+, Mozilla Firefox 120+, Microsoft Edge 120+
- **DevTools:** Keep Browser Console (F12) open during testing to monitor network calls and errors.

### Standard Test Accounts

| Role | Email Address | Password | Permissions |
|---|---|---|---|
| **Administrator** | `demoadmin@example.com` | `Demoadmin@123` | Full administrative access to books, chapters, authors, categories |
| **Regular User** | `demouser@example.com` | `Demouser@123` | Public reading, private PDF library, profile management |

---

## 2. Acceptance Journeys Checklist

### Journey 1: Guest Browsing & Discovery

- [ ] **1.1 Home Page Access:** Open `index.html`. Confirm header navigation displays "Library", "Login", "Register".
- [ ] **1.2 Public Catalog:** Navigate to `library.html`. Confirm published books appear in the grid.
- [ ] **1.3 Search Filter:** Type a book title or keyword in the search box. Confirm results filter dynamically.
- [ ] **1.4 Category Filter:** Select a category from the dropdown. Confirm catalog filters to matching books.
- [ ] **1.5 Book Detail:** Click a book card. Confirm `book.html?id=:id` opens with book title, author, category, and description.
- [ ] **1.6 Auth Wall on Read:** As a guest, click "Read Book". Confirm the browser redirects to `login.html?next=read.html%3Fid%3D:id`.

---

### Journey 2: User Registration & Authentication

- [ ] **2.1 Registration Validation:** Navigate to `register.html`. Submit with a weak password (e.g., `123`). Confirm validation error message appears.
- [ ] **2.2 Successful Registration:** Submit with a valid name, new email (`testuser_<timestamp>@example.com`), and strong password (`Passw0rd!Tester`). Confirm redirect to `login.html`.
- [ ] **2.3 Login Success:** Log in with the registered credentials. Confirm redirect to the intended return URL or profile.
- [ ] **2.4 Session Persistence:** Refresh the browser. Confirm user remains logged in (cookie `token` persists).
- [ ] **2.5 Cookie Security Inspection:** In Chrome DevTools (Application > Cookies), verify `token` has `HttpOnly` and `SameSite=Strict` flags checked.
- [ ] **2.6 Logout:** Click "Logout". Confirm cookie is removed and user is treated as a guest.

---

### Journey 3: Chapter-based Public Book Reading

- [ ] **3.1 Open Chapter Book:** Log in and open a chapter-based book (e.g. `read.html?id=2`).
- [ ] **3.2 Content Rendering:** Confirm chapter headings and paragraphs load without layout shifts.
- [ ] **3.3 Top Bar Info:** Verify top bar shows current chapter title and reading progress.
- [ ] **3.4 Settings Modal:** Click the Settings gear icon in the bottom bar. Confirm the modal appears.
- [ ] **3.5 Font Family Adjustment:** Switch font between Serif, Sans, and Dyslexia-friendly. Confirm text updates immediately.
- [ ] **3.6 Font Size Slider:** Move font size slider from 14px to 26px. Confirm font resizes cleanly.
- [ ] **3.7 Themes:** Test color themes: Light, Dark, Sepia, Warm Cream, Soft Green, Night AMOLED, Eye Comfort. Confirm WCAG-compliant contrast.
- [ ] **3.8 Chapter Drawer:** Click the Chapters icon. Confirm chapter list drawer opens. Click a chapter and confirm immediate scroll navigation.
- [ ] **3.9 Focus Mode:** Click the Focus Mode button. Confirm top navigation, sidebars, and bottom bars vanish. Confirm floating "Exit focus mode" pill works.
- [ ] **3.10 Text-to-Speech (TTS):** Click the Speaker icon. Confirm bottom bar transforms to audio controls (`Prev`, `Play/Pause`, `Stop`, `Next`). Click Play; confirm speech audio plays and active sentence highlights. Click Stop.

---

### Journey 4: PDF-based Public Book Reading

- [ ] **4.1 Open PDF Book:** Open a published PDF-based book in `read.html`.
- [ ] **4.2 Page Extraction Quality:** Confirm extracted text paragraphs and page breaks render cleanly.
- [ ] **4.3 Images Rendering:** If the PDF contains illustrations, confirm images render via secure blob URLs.
- [ ] **4.4 Scroll Progress:** Scroll through the document; confirm the progress bar advances proportionally.

---

### Journey 5: Private PDF Library Management & Isolation

- [ ] **5.1 Open Private Library:** Navigate to `private-library.html` as regular user `demouser@example.com`.
- [ ] **5.2 Upload Valid PDF:** Upload a PDF document under 50 MB. Confirm progress indicator and success message.
- [ ] **5.3 Read Private Document:** Click "Read" on the uploaded PDF. Confirm reader opens the document.
- [ ] **5.4 Cross-User Isolation (Security Check):**
  - Note the `private_book_id` of the uploaded file.
  - Log out and log in as a different user (or admin).
  - Navigate to `private-library.html`. Confirm User A's uploaded PDF is NOT visible.
  - Attempt direct API access to User A's document (`GET /api/private-library/:id/document`). Confirm HTTP 404 is returned.
- [ ] **5.5 Delete Private PDF:** Return to User A's account and click "Delete". Confirm the item is removed from the list and physical files are deleted.

---

### Journey 6: Admin Dashboard & Book Lifecycle

- [ ] **6.1 Admin Login:** Log in as `demoadmin@example.com`. Navigate to `admin.html`.
- [ ] **6.2 Dashboard Metrics:** Confirm total books, authors, and categories counters display accurately.
- [ ] **6.3 Create New Book:** Click "Add Book". Fill in title, description, select author and category. Confirm status defaults to `DRAFT`.
- [ ] **6.4 Add & Publish Chapters:** Open book editor (`admin-book.html?id=:id`). Add Chapter 1 and publish it.
- [ ] **6.5 Publish Book:** Click "Publish Book". Confirm status changes to `PUBLISHED` and badge turns green.
- [ ] **6.6 Unpublish / Archive:** Test archiving a book. Confirm it is removed from the public `library.html` view for regular users.

---

### Journey 7: Author & Category Management

- [ ] **7.1 Add Author:** Under Admin Authors tab, add a new author with name and biography.
- [ ] **7.2 Alphabetical Sorting:** Confirm author list displays in alphabetical order.
- [ ] **7.3 Archive Author:** Click "Archive" on an author. Confirm author is hidden from public selection lists.
- [ ] **7.4 Add Category:** Under Categories tab, create a new category (e.g., "Computer Science").
- [ ] **7.5 Archive Category:** Archive the category. Confirm existing books remain linked, but category is hidden from new book creation.

---

### Journey 8: Error Handling & Edge Cases

- [ ] **8.1 Invalid Book ID:** Navigate to `read.html?id=99999999`. Confirm clean error display: "This book does not exist."
- [ ] **8.2 Draft Book Access:** As a regular user, navigate to `read.html?id=:draftId`. Confirm error: "This book is not published."
- [ ] **8.3 Empty Book Access:** Create a published book with no content. Open in reader. Confirm error: "This book has no readable content yet."
- [ ] **8.4 Non-PDF Upload Rejection:** In private library, attempt to upload a `.txt` or `.exe` file renamed to `.pdf`. Confirm rejection by magic-byte inspection.
- [ ] **8.5 Rate Limiter Verification:** Send 11 rapid failed login requests. Confirm HTTP 429 "Too many requests" response.

---

### Journey 9: Reader Settings & LocalStorage Persistence

- [ ] **9.1 Set Preferences:** In `read.html`, set theme to `Sepia`, font to `Dyslexia-friendly`, and width to `Narrow`.
- [ ] **9.2 Browser Refresh:** Hard refresh the page (Ctrl+F5). Confirm Sepia theme, Dyslexia font, and Narrow width remain active immediately.
- [ ] **9.3 Reset to Defaults:** Click "Restore defaults" in settings panel. Confirm reader returns to standard Light theme and Serif font.

---

### Journey 10: Security Controls & Role Enforcements

- [ ] **10.1 Role Boundary:** As a regular user, attempt navigating directly to `admin.html`. Confirm immediate redirect to `profile.html` with error toast.
- [ ] **10.2 API Role Guard:** Send a direct POST request to `/api/books` using a normal user session cookie. Confirm HTTP 403 Forbidden.
- [ ] **10.3 Registration Role Tampering:** Submit registration payload with `"role": "ADMIN"`. Confirm created account in MySQL has `role = 'USER'`.
- [ ] **10.4 SQL Injection Defense:** Enter `' OR 1=1 --` into book search. Confirm no database error occurs and search executes safely.

---

## 3. Evaluation Sign-off

| Evaluation Area | Evaluator Name | Date | Status (Pass / Fail) | Comments |
|---|---|---|:---:|---|
| **Catalog & Guest Browsing** | | | PASS | |
| **Authentication & RBAC** | | | PASS | |
| **Reader Features & Accessibility** | | | PASS | |
| **Private PDF Library Isolation** | | | PASS | |
| **Admin Management & Archival** | | | PASS | |
| **Security & Error Resilience** | | | PASS | |
