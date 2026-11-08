-- =====================================================
-- Digital Library: Seed Data (name-based, safe to re-run)
-- Targets the database named in USE below. Development use only.
-- Password hashes are placeholders and cannot be used to log in.
-- Demo logins are created separately by: npm run seed:dev
-- =====================================================

USE digital_library;

-- Roles: role_name is unique, IDs are never hard-coded.
INSERT IGNORE INTO roles (role_name, description) VALUES
('ADMIN', 'Full administrative access'),
('AUTHOR', 'Can create and submit books'),
('READER', 'Can read and interact with published books'),
('USER', 'Registered user with standard access');

-- Users: role looked up by name; each email inserted once.
INSERT INTO users (role_id, full_name, email, password_hash, is_active)
SELECT (SELECT role_id FROM roles WHERE role_name = 'ADMIN'),
       'Admin User', 'admin@example.com',
       '$2b$10$examplePlaceholderHashAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@example.com');

INSERT INTO users (role_id, full_name, email, password_hash, is_active)
SELECT (SELECT role_id FROM roles WHERE role_name = 'AUTHOR'),
       'Sample Author', 'author@example.com',
       '$2b$10$examplePlaceholderHashBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'author@example.com');

INSERT INTO users (role_id, full_name, email, password_hash, is_active)
SELECT (SELECT role_id FROM roles WHERE role_name = 'READER'),
       'Sample Reader', 'reader@example.com',
       '$2b$10$examplePlaceholderHashCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC', 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'reader@example.com');

-- Authors
INSERT INTO authors (name, bio)
SELECT 'R. K. Sharma', 'Fiction and short story writer.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM authors WHERE name = 'R. K. Sharma');

INSERT INTO authors (name, bio)
SELECT 'A. Verma', 'Non-fiction and academic author.' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM authors WHERE name = 'A. Verma');

-- Categories
INSERT INTO categories (name, description)
SELECT 'Fiction', 'Fictional literary works' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Fiction');

INSERT INTO categories (name, description)
SELECT 'Non-Fiction', 'Factual and educational works' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Non-Fiction');

INSERT INTO categories (name, description)
SELECT 'Technology', 'Books about technology and programming' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Technology');

INSERT INTO categories (name, description)
SELECT 'Poetry', 'Poems and verse collections' FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Poetry');

-- Books (owner looked up by email)
INSERT INTO books (owner_id, title, description, status)
SELECT (SELECT user_id FROM users WHERE email = 'author@example.com'),
       'The Silent River', 'A fictional journey along a quiet river.', 'PUBLISHED'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM books WHERE title = 'The Silent River'
  AND owner_id = (SELECT user_id FROM users WHERE email = 'author@example.com'));

INSERT INTO books (owner_id, title, description, status)
SELECT (SELECT user_id FROM users WHERE email = 'author@example.com'),
       'Learning Node.js', 'A practical guide to backend development.', 'DRAFT'
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM books WHERE title = 'Learning Node.js');

-- Book <-> Authors
INSERT INTO book_authors (book_id, author_id)
SELECT b.book_id, a.author_id
FROM books b
JOIN authors a ON a.name = 'R. K. Sharma'
WHERE b.title = 'The Silent River'
  AND b.owner_id = (SELECT user_id FROM users WHERE email = 'author@example.com')
  AND NOT EXISTS (SELECT 1 FROM book_authors x WHERE x.book_id = b.book_id AND x.author_id = a.author_id);

INSERT INTO book_authors (book_id, author_id)
SELECT b.book_id, a.author_id
FROM books b
JOIN authors a ON a.name = 'A. Verma'
WHERE b.title = 'Learning Node.js'
  AND NOT EXISTS (SELECT 1 FROM book_authors x WHERE x.book_id = b.book_id AND x.author_id = a.author_id);

-- Book <-> Categories
INSERT INTO book_categories (book_id, category_id)
SELECT b.book_id, c.category_id
FROM books b
JOIN categories c ON c.name = 'Fiction'
WHERE b.title = 'The Silent River'
  AND b.owner_id = (SELECT user_id FROM users WHERE email = 'author@example.com')
  AND NOT EXISTS (SELECT 1 FROM book_categories x WHERE x.book_id = b.book_id AND x.category_id = c.category_id);

INSERT INTO book_categories (book_id, category_id)
SELECT b.book_id, c.category_id
FROM books b
JOIN categories c ON c.name = 'Technology'
WHERE b.title = 'Learning Node.js'
  AND NOT EXISTS (SELECT 1 FROM book_categories x WHERE x.book_id = b.book_id AND x.category_id = c.category_id);

-- Chapters
INSERT INTO chapters (book_id, chapter_number, title, content, status)
SELECT b.book_id, 1, 'The Beginning', 'It was a quiet morning by the river...', 'PUBLISHED'
FROM books b
WHERE b.title = 'The Silent River'
  AND b.owner_id = (SELECT user_id FROM users WHERE email = 'author@example.com')
  AND NOT EXISTS (SELECT 1 FROM chapters c WHERE c.book_id = b.book_id AND c.chapter_number = 1);

INSERT INTO chapters (book_id, chapter_number, title, content, status)
SELECT b.book_id, 2, 'The Journey', 'The current grew stronger as the day went on...', 'PUBLISHED'
FROM books b
WHERE b.title = 'The Silent River'
  AND b.owner_id = (SELECT user_id FROM users WHERE email = 'author@example.com')
  AND NOT EXISTS (SELECT 1 FROM chapters c WHERE c.book_id = b.book_id AND c.chapter_number = 2);

INSERT INTO chapters (book_id, chapter_number, title, content, status)
SELECT b.book_id, 1, 'Introduction', 'Node.js is a JavaScript runtime...', 'DRAFT'
FROM books b
WHERE b.title = 'Learning Node.js'
  AND NOT EXISTS (SELECT 1 FROM chapters c WHERE c.book_id = b.book_id AND c.chapter_number = 1);

-- Book submissions
INSERT INTO book_submissions (book_id, submitted_by, reviewed_by, status, rejection_reason, reviewed_at)
SELECT b.book_id,
       (SELECT user_id FROM users WHERE email = 'author@example.com'),
       (SELECT user_id FROM users WHERE email = 'admin@example.com'),
       'APPROVED', NULL, NOW()
FROM books b
WHERE b.title = 'The Silent River'
  AND b.owner_id = (SELECT user_id FROM users WHERE email = 'author@example.com')
  AND NOT EXISTS (SELECT 1 FROM book_submissions s WHERE s.book_id = b.book_id);

-- Reader activity (reader@example.com)
INSERT INTO favorites (user_id, book_id)
SELECT u.user_id, b.book_id
FROM users u
JOIN books b ON b.title = 'The Silent River'
  AND b.owner_id = (SELECT user_id FROM users WHERE email = 'author@example.com')
WHERE u.email = 'reader@example.com'
  AND NOT EXISTS (SELECT 1 FROM favorites f WHERE f.user_id = u.user_id AND f.book_id = b.book_id);

INSERT INTO bookmarks (user_id, book_id, chapter_id, note)
SELECT u.user_id, b.book_id, c.chapter_id, 'Interesting turning point here.'
FROM users u
JOIN books b ON b.title = 'The Silent River'
  AND b.owner_id = (SELECT user_id FROM users WHERE email = 'author@example.com')
JOIN chapters c ON c.book_id = b.book_id AND c.chapter_number = 2
WHERE u.email = 'reader@example.com'
  AND NOT EXISTS (SELECT 1 FROM bookmarks m WHERE m.user_id = u.user_id AND m.book_id = b.book_id AND m.chapter_id = c.chapter_id);

INSERT INTO reading_progress (user_id, book_id, chapter_id, progress_percent)
SELECT u.user_id, b.book_id, c.chapter_id, 55.00
FROM users u
JOIN books b ON b.title = 'The Silent River'
  AND b.owner_id = (SELECT user_id FROM users WHERE email = 'author@example.com')
JOIN chapters c ON c.book_id = b.book_id AND c.chapter_number = 2
WHERE u.email = 'reader@example.com'
  AND NOT EXISTS (SELECT 1 FROM reading_progress p WHERE p.user_id = u.user_id AND p.book_id = b.book_id);

INSERT INTO reading_history (user_id, book_id, chapter_id)
SELECT u.user_id, b.book_id, c.chapter_id
FROM users u
JOIN books b ON b.title = 'The Silent River'
  AND b.owner_id = (SELECT user_id FROM users WHERE email = 'author@example.com')
JOIN chapters c ON c.book_id = b.book_id AND c.chapter_number = 1
WHERE u.email = 'reader@example.com'
  AND NOT EXISTS (SELECT 1 FROM reading_history h WHERE h.user_id = u.user_id AND h.book_id = b.book_id AND h.chapter_id = c.chapter_id);

INSERT INTO reading_history (user_id, book_id, chapter_id)
SELECT u.user_id, b.book_id, c.chapter_id
FROM users u
JOIN books b ON b.title = 'The Silent River'
  AND b.owner_id = (SELECT user_id FROM users WHERE email = 'author@example.com')
JOIN chapters c ON c.book_id = b.book_id AND c.chapter_number = 2
WHERE u.email = 'reader@example.com'
  AND NOT EXISTS (SELECT 1 FROM reading_history h WHERE h.user_id = u.user_id AND h.book_id = b.book_id AND h.chapter_id = c.chapter_id);

INSERT INTO reader_settings (user_id, theme, font_size, preferences)
SELECT u.user_id, 'SEPIA', 18, JSON_OBJECT('lineSpacing', 1.5, 'fontFamily', 'serif')
FROM users u
WHERE u.email = 'reader@example.com'
  AND NOT EXISTS (SELECT 1 FROM reader_settings s WHERE s.user_id = u.user_id);

-- Audit logs (admin@example.com)
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
SELECT u.user_id, 'BOOK_APPROVED', 'book', b.book_id, JSON_OBJECT('note', 'Approved after review')
FROM users u
JOIN books b ON b.title = 'The Silent River'
  AND b.owner_id = (SELECT user_id FROM users WHERE email = 'author@example.com')
WHERE u.email = 'admin@example.com'
  AND NOT EXISTS (SELECT 1 FROM audit_logs a WHERE a.user_id = u.user_id AND a.action = 'BOOK_APPROVED' AND a.entity_id = b.book_id);

INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details)
SELECT u.user_id, 'BOOK_PUBLISHED', 'book', b.book_id, JSON_OBJECT('note', 'Published to catalog')
FROM users u
JOIN books b ON b.title = 'The Silent River'
  AND b.owner_id = (SELECT user_id FROM users WHERE email = 'author@example.com')
WHERE u.email = 'admin@example.com'
  AND NOT EXISTS (SELECT 1 FROM audit_logs a WHERE a.user_id = u.user_id AND a.action = 'BOOK_PUBLISHED' AND a.entity_id = b.book_id);