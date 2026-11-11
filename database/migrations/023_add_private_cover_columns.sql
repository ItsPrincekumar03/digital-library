-- Module 27.5: Persist cover filename and resource path on private_library_files
-- Safe additive migration; preserves all existing private library records.

USE digital_library;

ALTER TABLE private_library_files
    ADD COLUMN cover_image VARCHAR(255) NULL AFTER file_format,
    ADD COLUMN cover_path VARCHAR(255) NULL AFTER cover_image;
