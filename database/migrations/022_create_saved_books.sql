-- Module 27.5: Saved Public Books in Personal Private Library
-- Allows authenticated users to bookmark/save PUBLISHED public books to their
-- private library without duplicating PDF storage on disk.

USE digital_library;

CREATE TABLE IF NOT EXISTS private_saved_books (
    saved_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    book_id BIGINT UNSIGNED NOT NULL,
    saved_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_private_saved_books_user_book (user_id, book_id),
    INDEX idx_private_saved_books_user_saved_at (user_id, saved_at),
    CONSTRAINT fk_private_saved_books_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_private_saved_books_book
        FOREIGN KEY (book_id) REFERENCES books(book_id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;
