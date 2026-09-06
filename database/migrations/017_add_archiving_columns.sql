USE digital_library;

ALTER TABLE authors
  ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE categories
  ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0;

ALTER TABLE books
  ADD COLUMN cover_path VARCHAR(255) NULL,
  ADD COLUMN publication_date DATE NULL;