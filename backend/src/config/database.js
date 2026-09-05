const mysql = require('mysql2/promise');
const dbConfig = require('./db.config');

// A connection pool is better than a single connection:
// it reuses connections instead of opening a new one per query.
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

// Simple helper to verify the DB is reachable.
// Used at startup and by the /health/db test route.
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        await connection.ping();
        connection.release();
        return { success: true, message: 'Database connected successfully.' };
    } catch (error) {
        return {
            success: false,
            message: 'Database connection failed.',
            error: error.message,
        };
    }
}

module.exports = { pool, testConnection };