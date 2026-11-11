-- Migration 021: persistent authentication event log (Module 27 SEC-04).
-- Stores registration, login success/failure, logout, and password-change events.
-- Separate table avoids modifying the audit_logs ENUM.
-- Target database: digital_library (apply only after owner approval).
-- Safe to re-run: IF NOT EXISTS.
USE digital_library;

CREATE TABLE IF NOT EXISTS auth_events (
    event_id    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    event_type  ENUM(
                    'REGISTER_SUCCESS',
                    'LOGIN_SUCCESS',
                    'LOGIN_FAILURE',
                    'LOGOUT',
                    'PASSWORD_CHANGED',
                    'PASSWORD_CHANGE_FAILED'
                ) NOT NULL,
    user_id     BIGINT UNSIGNED NULL,          -- NULL for failed logins (unknown user)
    ip_address  VARCHAR(45) NULL,              -- IPv4 or IPv6
    user_agent  VARCHAR(500) NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_auth_events_user
        FOREIGN KEY (user_id) REFERENCES users(user_id)
        ON DELETE SET NULL ON UPDATE CASCADE,

    INDEX idx_auth_events_user_id (user_id),
    INDEX idx_auth_events_event_type (event_type),
    INDEX idx_auth_events_created_at (created_at)
) ENGINE=InnoDB;
