USE digital_library;

-- Module 13.1 — original PDF storage for admin-managed public books.
-- NOT APPLIED. Run manually during verification.
-- Verified 2026-10-12: pdf_original_name and pdf_size already exist in the
-- live database, so only the two missing columns are added here.
-- pdf_path and processed_content_path are legacy columns and are left untouched.
ALTER TABLE books
  ADD COLUMN pdf_stored_name VARCHAR(255) NULL,
  ADD COLUMN pdf_uploaded_at DATETIME NULL;

CREATE INDEX idx_books_pdf_stored_name ON books (pdf_stored_name);
