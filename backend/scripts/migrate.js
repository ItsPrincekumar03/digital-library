const { pool } = require('../src/config/database');

async function columnExists(tableName, columnName) {
    const [rows] = await pool.query(
        `SELECT COLUMN_NAME
         FROM information_schema.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND COLUMN_NAME = ?`,
        [tableName, columnName]
    );
    return rows.length > 0;
}

async function tableExists(tableName) {
    const [rows] = await pool.query(
        `SELECT TABLE_NAME
         FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?`,
        [tableName]
    );
    return rows.length > 0;
}

async function indexExists(tableName, indexName) {
    const [rows] = await pool.query(
        `SELECT INDEX_NAME
         FROM information_schema.STATISTICS
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME = ?
           AND INDEX_NAME = ?`,
        [tableName, indexName]
    );
    return rows.length > 0;
}

async function migrate() {
    console.log('[MIGRATE] Checking database schema for required columns and tables...');

    // 1. Authors table - is_archived column
    const hasAuthorArchived = await columnExists('authors', 'is_archived');
    if (!hasAuthorArchived) {
        console.log('[MIGRATE] Adding is_archived column to authors table...');
        await pool.query('ALTER TABLE authors ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0');
    } else {
        console.log('[MIGRATE] authors.is_archived already exists.');
    }
    if (!(await indexExists('authors', 'idx_authors_is_archived'))) {
        await pool.query('CREATE INDEX idx_authors_is_archived ON authors (is_archived)');
        console.log('[MIGRATE] Added index idx_authors_is_archived to authors.');
    }

    // 2. Categories table - is_archived column
    const hasCategoryArchived = await columnExists('categories', 'is_archived');
    if (!hasCategoryArchived) {
        console.log('[MIGRATE] Adding is_archived column to categories table...');
        await pool.query('ALTER TABLE categories ADD COLUMN is_archived TINYINT(1) NOT NULL DEFAULT 0');
    } else {
        console.log('[MIGRATE] categories.is_archived already exists.');
    }
    if (!(await indexExists('categories', 'idx_categories_is_archived'))) {
        await pool.query('CREATE INDEX idx_categories_is_archived ON categories (is_archived)');
        console.log('[MIGRATE] Added index idx_categories_is_archived to categories.');
    }

    // 3. Books table - cover_path, publication_date, and PDF columns
    const bookColumns = [
        { name: 'cover_path', sql: 'ALTER TABLE books ADD COLUMN cover_path VARCHAR(255) NULL' },
        { name: 'publication_date', sql: 'ALTER TABLE books ADD COLUMN publication_date DATE NULL' },
        { name: 'pdf_original_name', sql: 'ALTER TABLE books ADD COLUMN pdf_original_name VARCHAR(255) NULL' },
        { name: 'pdf_stored_name', sql: 'ALTER TABLE books ADD COLUMN pdf_stored_name VARCHAR(255) NULL' },
        { name: 'pdf_size', sql: 'ALTER TABLE books ADD COLUMN pdf_size BIGINT UNSIGNED NULL' },
        { name: 'pdf_uploaded_at', sql: 'ALTER TABLE books ADD COLUMN pdf_uploaded_at DATETIME NULL' },
        { name: 'pdf_path', sql: 'ALTER TABLE books ADD COLUMN pdf_path VARCHAR(500) NULL' },
        { name: 'processed_content_path', sql: 'ALTER TABLE books ADD COLUMN processed_content_path VARCHAR(255) NULL' },
    ];

    for (const col of bookColumns) {
        if (!(await columnExists('books', col.name))) {
            console.log(`[MIGRATE] Adding ${col.name} column to books table...`);
            await pool.query(col.sql);
        } else {
            console.log(`[MIGRATE] books.${col.name} already exists.`);
        }
    }

    if (!(await indexExists('books', 'idx_books_pdf_stored_name'))) {
        await pool.query('CREATE INDEX idx_books_pdf_stored_name ON books (pdf_stored_name)');
        console.log('[MIGRATE] Added index idx_books_pdf_stored_name to books.');
    }

    // 4. Private library files table
    const hasPrivateLibrary = await tableExists('private_library_files');
    if (!hasPrivateLibrary) {
        console.log('[MIGRATE] Creating private_library_files table...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS private_library_files (
                private_file_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
                owner_id BIGINT UNSIGNED NOT NULL,
                title VARCHAR(255) NOT NULL,
                description VARCHAR(1000) NULL,
                original_file_name VARCHAR(255) NOT NULL,
                stored_file_name VARCHAR(255) NOT NULL,
                storage_path VARCHAR(500) NOT NULL,
                mime_type VARCHAR(100) NOT NULL,
                file_size BIGINT UNSIGNED NOT NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

                CONSTRAINT fk_private_library_files_owner
                    FOREIGN KEY (owner_id) REFERENCES users(user_id)
                    ON DELETE CASCADE ON UPDATE CASCADE,

                CONSTRAINT uq_private_library_files_stored_name
                    UNIQUE (stored_file_name),

                INDEX idx_private_library_files_owner_id (owner_id),
                INDEX idx_private_library_files_created_at (created_at)
            ) ENGINE=InnoDB;
        `);
    } else {
        console.log('[MIGRATE] private_library_files table already exists.');
    }

    console.log('[MIGRATE] Database schema migrations completed successfully.');
    await pool.end();
}

migrate().catch((err) => {
    console.error('[MIGRATE] Migration failed:', err);
    process.exit(1);
});
