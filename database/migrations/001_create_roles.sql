USE digital_library;

CREATE TABLE IF NOT EXISTS roles (
    role_id     BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    role_name   VARCHAR(50) NOT NULL,
    description VARCHAR(255) NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_roles_role_name UNIQUE (role_name)
) ENGINE=InnoDB;