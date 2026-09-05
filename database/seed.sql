-- =====================================================
-- Digital Library — Seed Data
-- No real passwords/secrets. All hashes are placeholders.
-- =====================================================

USE digital_library;

-- ---------- Roles ----------
INSERT INTO roles (role_name, description) VALUES
('ADMIN', 'Full administrative access'),
('AUTHOR', 'Can create and submit books'),
('READER', 'Can read and interact with published books');

-- ---------- Users ----------
-- password_hash values below are placeholders only (e.g. bcrypt of "changeme"),
-- NOT real credentials. Replace via proper registration/hashing flow later.
INSERT INTO users (role_id, full_name, email, password_hash, is_active) VALUES
(1, 'Admin User',   'admin@example.com',   '$2b$10$examplePlaceholderHashAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 1),
(2, 'Sample Author', 'author@example.com', '$2b$10$examplePlaceholderHashBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', 1),
(3, 'Sample Reader', 'reader@example.com', '$2b$10$examplePlaceholderHashCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', 1);

-- ---------- Authors ----------
INSERT INTO authors (name, bio) VALUES
('R. K. Sharma', 'Fiction and short story writer.'),
('A. Verma', 'Non-fiction and academic author.');

-- ---------- Categories ----------
INSERT INTO categories (name, description) VALUES
('Fiction', 'Fictional literary works'),
('Non-Fiction', 'Factual and educational works'),
('Technology', 'Books about technology and programming'),
('Poetry', 'Poems and verse collections');

-- ---------- Books ----------
INSERT INTO books (owner_id, title, description, status) VALUES
(2, 'The Silent River', 'A fictional journey along a quiet river.', 'PUBLISHED'),
(2, 'Learning Node.js', 'A practical guide to backend development.', 'DRAFT');

-- ---------- Book <-> Authors ----------
INSERT INTO book_authors (book_id, author_id) VALUES
(1, 1),
(2, 2);

-- ---------- Book <-> Categories ----------
INSERT INTO book_categories (book_id, category_id) VALUES
(1, 1),
(2, 3);

-- ---------- Chapters ----------
INSERT INTO chapters (book_id, chapter_number, title, content, status) VALUES
(1, 1, 'The Beginning', 'It was a quiet morning by the river...', 'PUBLISHED'),
(1, 2, 'The Journey', 'The current grew stronger as the day went on...', 'PUBLISHED'),
(2, 1, 'Introduction', 'Node.js is a JavaScript runtime...', 'DRAFT');

-- ---------- Book Submissions ----------
INSERT INTO book_submissions (book_id, submitted_by, reviewed_by, status, rejection_reason, reviewed_at) VALUES
(1, 2, 1, 'APPROVED', NULL, NOW());

-- ---------- Favorites ----------
INSERT INTO favorites (user_id, book_id) VALUES
(3, 1);

-- ---------- Bookmarks ----------
INSERT INTO bookmarks (user_id, book_id, chapter_id, note) VALUES
(3, 1, 2, 'Interesting turning point here.');

-- ---------- Reading Progress ----------
INSERT INTO reading_progress (user_id, book_id, chapter_id, progress_percent) VALUES
(3, 1, 2, 55.00);

-- ---------- Reading History ----------
INSERT INTO reading_history (user_id, book_id, chapter_id) VALUES
(3, 1, 1),
(3, 1, 2);

-- ---------- Reader Settings ----------
INSERT INTO reader_settings (user_id, theme, font_size, preferences) VALUES
(3, 'SEPIA', 18, JSON_OBJECT('lineSpacing', 1.5, 'fontFamily', 'serif'));

-- ---------- Audit Logs ----------
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details) VALUES
(1, 'BOOK_APPROVED', 'book', 1, JSON_OBJECT('note', 'Approved after review')),
(1, 'BOOK_PUBLISHED', 'book', 1, JSON_OBJECT('note', 'Published to catalog'));