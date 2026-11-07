-- Migration 016: USER role (registration requires it).
-- Safe to re-run: role_name is UNIQUE, so INSERT IGNORE skips an existing row
-- and never changes it. Description matches database/seed.sql and migrate.js.
USE digital_library;

INSERT IGNORE INTO roles (role_name, description)
VALUES ('USER', 'Registered user with standard access');