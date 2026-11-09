-- Migration 020: persistent JWT revocation (Module 18).
-- Stores a SHA-256 hash of each logged-out token, never the token itself.
-- Target database: digital_library (apply only after owner approval).
-- Safe to re-run: IF NOT EXISTS.
USE digital_library;

CREATE TABLE IF NOT EXISTS revoked_tokens (
    token_hash CHAR(64) NOT NULL PRIMARY KEY,
    user_id    BIGINT UNSIGNED NULL,
    revoked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    INDEX idx_revoked_tokens_expires_at (expires_at),
    CONSTRAINT fk_revoked_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB;