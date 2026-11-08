'use strict';

const mysql = require('mysql2/promise');
const dbConfig = require('./db.config');

if (!dbConfig.database || typeof dbConfig.database !== 'string' || !dbConfig.database.trim()) {
    throw new Error('Database configuration error: DB_NAME must be set before the database pool is created.');
}

const pool = mysql.createPool({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

/**
 * Verify connectivity and confirm that MySQL selected the configured schema.
 * The borrowed connection is released on both success and failure.
 */
async function testConnection() {
    let connection;

    try {
        connection = await pool.getConnection();
        await connection.ping();

        const [rows] = await connection.query('SELECT DATABASE() AS current_db, @@lower_case_table_names AS lower_case_table_names');
        const currentDatabase = rows[0]?.current_db;

        const caseInsensitive = [1, 2].includes(Number(rows[0]?.lower_case_table_names));
        const namesMatch = typeof currentDatabase === 'string' && (caseInsensitive
            ? currentDatabase.toLowerCase() === dbConfig.database.toLowerCase()
            : currentDatabase === dbConfig.database);

        if (!namesMatch) {
            return {
                success: false,
                message: 'Database connection failed: selected database does not match DB_NAME.',
            };
        }

        return {
            success: true,
            message: 'Database connected successfully.',
        };
    } catch (error) {
        // Do not expose connection strings, usernames, hosts, or passwords in health output.
        return {
            success: false,
            message: 'Database connection failed.',
            error: error.code || 'DATABASE_CONNECTION_ERROR',
        };
    } finally {
        if (connection) connection.release();
    }
}

module.exports = { pool, testConnection };