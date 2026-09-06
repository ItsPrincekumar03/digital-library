-- =====================================================
-- Digital Library — Module 2: Database Schema
-- MySQL 8.x | InnoDB | Normalized Relational Design
-- =====================================================

CREATE DATABASE IF NOT EXISTS digital_library
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE digital_library;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. roles
-- =====================================================
CREATE TABLE roles (
    role_id     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_name   VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_roles_role_name UNIQUE (role_name)
) ENGINE=InnoDB;

-- =====================================================
-- 2. users
-- =====================================================
CREATE TABLE users (
    user_id        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_id        BIGINT UNSIGNED NOT NULL,
    full_name      VARCHAR(150) NOT NULL,
    email          VARCHAR(191) NOT NULL,
    password_hash  VARCHAR(255) NOT NULL,
    is_active      TINYINT(1) NOT NULL DEFAULT 1,
    refresh_token  VARCHAR(255) NULL,
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                     ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_users_email UNIQUE (email),

    CONSTRAINT fk_users_role
        FOREIGN KEY (role_id) REFERENCES roles(role_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    INDEX idx_users_role_id (role_id),
    INDEX idx_users_is_active (is_active)
) ENGINE=InnoDB;

-- =====================================================
-- 3. authors
-- =====================================================
CREATE TABLE authors (
    author_id   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(150) NOT NULL,
    bio         TEXT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_authors_name (name)
) ENGINE=InnoDB;

-- =====================================================
-- 4. categories
-- =====================================================
CREATE TABLE categories (
    category_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(255) NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_categories_name UNIQUE (name)
) ENGINE=InnoDB;

-- =====================================================
-- 5. books
-- =====================================================
CREATE TABLE books (
    book_id       BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    owner_id      BIGINT UNSIGNED NOT NULL,
    title         VARCHAR(255) NOT NULL,
    description   TEXT NULL,
    cover_image   VARCHAR(255) NULL,
    status        ENUM(
                      'DRAFT',
                      'PENDING_REVIEW',
                      'APPROVED',
                      'REJECTED',
                      'PUBLISHED',
                      'ARCHIVED'
                  ) NOT NULL DEFAULT 'DRAFT',
    created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                     ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_books_owner
        FOREIGN KEY (owner_id) REFERENCES users(user_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    INDEX idx_books_owner_id (owner_id),
    INDEX idx_books_status (status),
    INDEX idx_books_title (title)
) ENGINE=InnoDB;

-- =====================================================
-- 6. book_authors (N:N books <-> authors)
-- =====================================================
CREATE TABLE book_authors (
    book_id    BIGINT UNSIGNED NOT NULL,
    author_id  BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (book_id, author_id),

    CONSTRAINT fk_book_authors_book
        FOREIGN KEY (book_id) REFERENCES books(book_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_book_authors_author
        FOREIGN KEY (author_id) REFERENCES authors(author_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_book_authors_author_id (author_id)
) ENGINE=InnoDB;

-- =====================================================
-- 7. book_categories (N:N books <-> categories)
-- =====================================================
CREATE TABLE book_categories (
    book_id     BIGINT UNSIGNED NOT NULL,
    category_id BIGINT UNSIGNED NOT NULL,

    PRIMARY KEY (book_id, category_id),

    CONSTRAINT fk_book_categories_book
        FOREIGN KEY (book_id) REFERENCES books(book_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_book_categories_category
        FOREIGN KEY (category_id) REFERENCES categories(category_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_book_categories_category_id (category_id)
) ENGINE=InnoDB;

-- =====================================================
-- 8. chapters
-- =====================================================
CREATE TABLE chapters (
    chapter_id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    book_id         BIGINT UNSIGNED NOT NULL,
    chapter_number  INT UNSIGNED NOT NULL,
    title           VARCHAR(255) NOT NULL,
    content         LONGTEXT NULL,
    status          ENUM(
                        'DRAFT',
                        'PUBLISHED',
                        'ARCHIVED'
                    ) NOT NULL DEFAULT 'DRAFT',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                      ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_chapters_book
        FOREIGN KEY (book_id) REFERENCES books(book_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT uq_chapters_book_number
        UNIQUE (book_id, chapter_number),

    INDEX idx_chapters_book_id (book_id),
    INDEX idx_chapters_status (status)
) ENGINE=InnoDB;

-- =====================================================
-- 9. book_submissions
-- =====================================================
CREATE TABLE book_submissions (
    submission_id    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    book_id          BIGINT UNSIGNED NOT NULL,
    submitted_by     BIGINT UNSIGNED NOT NULL,
    reviewed_by      BIGINT UNSIGNED NULL,
    status           ENUM(
                        'PENDING',
                        'APPROVED',
                        'REJECTED'
                     ) NOT NULL DEFAULT 'PENDING',
    rejection_reason VARCHAR(500) NULL,
    submitted_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reviewed_at      DATETIME NULL,

    CONSTRAINT fk_submissions_book
        FOREIGN KEY (book_id) REFERENCES books(book_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_submissions_submitted_by
        FOREIGN KEY (submitted_by) REFERENCES users(user_id)
        ON DELETE RESTRICT ON UPDATE CASCADE,

    CONSTRAINT fk_submissions_reviewed_by
        FOREIGN KEY (reviewed_by) REFERENCES users(user_id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_submissions_book_id (book_id),
    INDEX idx_submissions_status (status),
    INDEX idx_submissions_submitted_by (submitted_by)
) ENGINE=InnoDB;

-- =====================================================
-- 10. favorites
-- =====================================================
CREATE TABLE favorites (
    favorite_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    book_id     BIGINT UNSIGNED NOT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_favorites_user_book
        UNIQUE (user_id, book_id),

    CONSTRAINT fk_favorites_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_favorites_book
        FOREIGN KEY (book_id) REFERENCES books(book_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_favorites_book_id (book_id)
) ENGINE=InnoDB;

-- =====================================================
-- 11. bookmarks
-- =====================================================
CREATE TABLE bookmarks (
    bookmark_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    book_id     BIGINT UNSIGNED NOT NULL,
    chapter_id  BIGINT UNSIGNED NOT NULL,
    note        VARCHAR(500) NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_bookmarks_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_bookmarks_book
        FOREIGN KEY (book_id) REFERENCES books(book_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_bookmarks_chapter
        FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_bookmarks_user_id (user_id),
    INDEX idx_bookmarks_book_id (book_id),
    INDEX idx_bookmarks_chapter_id (chapter_id)
) ENGINE=InnoDB;

-- =====================================================
-- 12. reading_progress
-- =====================================================
CREATE TABLE reading_progress (
    progress_id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id          BIGINT UNSIGNED NOT NULL,
    book_id          BIGINT UNSIGNED NOT NULL,
    chapter_id       BIGINT UNSIGNED NOT NULL,
    progress_percent DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                       ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_reading_progress_user_book
        UNIQUE (user_id, book_id),

    CONSTRAINT fk_reading_progress_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_reading_progress_book
        FOREIGN KEY (book_id) REFERENCES books(book_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_reading_progress_chapter
        FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_reading_progress_book_id (book_id),
    INDEX idx_reading_progress_chapter_id (chapter_id)
) ENGINE=InnoDB;

-- =====================================================
-- 13. reading_history
-- =====================================================
CREATE TABLE reading_history (
    history_id  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    book_id     BIGINT UNSIGNED NOT NULL,
    chapter_id  BIGINT UNSIGNED NOT NULL,
    read_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reading_history_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_reading_history_book
        FOREIGN KEY (book_id) REFERENCES books(book_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_reading_history_chapter
        FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_reading_history_user_id (user_id),
    INDEX idx_reading_history_book_id (book_id),
    INDEX idx_reading_history_read_at (read_at)
) ENGINE=InnoDB;

-- =====================================================
-- 14. reader_settings
-- =====================================================
CREATE TABLE reader_settings (
    setting_id  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    theme       ENUM(
                    'LIGHT',
                    'DARK',
                    'SEPIA'
                ) NOT NULL DEFAULT 'LIGHT',
    font_size   INT UNSIGNED NOT NULL DEFAULT 16,
    preferences JSON NULL,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                   ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT uq_reader_settings_user
        UNIQUE (user_id),

    CONSTRAINT fk_reader_settings_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- =====================================================
-- 15. audit_logs
-- =====================================================
CREATE TABLE audit_logs (
    log_id      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id     BIGINT UNSIGNED NOT NULL,
    action      ENUM(
                    'BOOK_CREATED',
                    'BOOK_APPROVED',
                    'BOOK_REJECTED',
                    'BOOK_PUBLISHED',
                    'BOOK_ARCHIVED',
                    'USER_DISABLED',
                    'USER_ENABLED',
                    'CHAPTER_PUBLISHED'
                ) NOT NULL,
    entity_type VARCHAR(50) NULL,
    entity_id   BIGINT UNSIGNED NULL,
    details     JSON NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    INDEX idx_audit_logs_user_id (user_id),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_created_at (created_at)
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;