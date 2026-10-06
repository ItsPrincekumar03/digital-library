const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

async function migrate() {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'digital_library'
    });

    try {
        await pool.query('ALTER TABLE books ADD COLUMN processed_content_path varchar(500) NULL');
        console.log('Added processed_content_path to books');
    } catch (e) { console.log('books column may exist:', e.message); }

    try {
        await pool.query('ALTER TABLE private_library_files ADD COLUMN processed_content_path varchar(500) NULL');
        console.log('Added processed_content_path to private_library_files');
    } catch (e) { console.log('private_library_files column may exist:', e.message); }
    
    pool.end();
}
migrate();
