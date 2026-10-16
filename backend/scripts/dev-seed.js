// Development-only seed. Creates two demo accounts in a LOCAL database.
// Run explicitly with: npm run seed:dev
// Never runs at application startup. Refuses to run in production.

require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('../src/config/database');

const SALT_ROUNDS = 10;

const DEMO_ACCOUNTS = [
    {
        email: 'demoadmin@example.com',
        password: 'Demoadmin@123',
        fullName: 'Demo Admin',
        roleName: 'ADMIN',
    },
    {
        email: 'demouser@example.com',
        password: 'Demouser@123',
        fullName: 'Demo User',
        roleName: 'USER',
    },
];

function refuseUnlessDevelopment() {
    const env = process.env.NODE_ENV;

    if (!env) {
        throw new Error('Refusing to seed: NODE_ENV is not set. Set NODE_ENV=development in your local .env.');
    }

    if (env === 'production') {
        throw new Error('Refusing to seed: NODE_ENV is production.');
    }
}

async function ensureRole(connection, roleName) {
    const [rows] = await connection.query(
        'SELECT role_id FROM roles WHERE role_name = ? LIMIT 1',
        [roleName]
    );

    if (rows.length > 0) {
        return rows[0].role_id;
    }

    const [result] = await connection.query(
        'INSERT INTO roles (role_name, description) VALUES (?, ?)',
        [roleName, `${roleName} role (created by dev seed)`]
    );

    return result.insertId;
}

async function seedAccount(connection, account) {
    const [existing] = await connection.query(
        `SELECT u.user_id, r.role_name
           FROM users u
           JOIN roles r ON r.role_id = u.role_id
          WHERE u.email = ?
          LIMIT 1`,
        [account.email]
    );

    if (existing.length > 0) {
        const row = existing[0];

        if (row.role_name !== account.roleName) {
            throw new Error(
                `Conflict: ${account.email} exists with role ${row.role_name}, expected ${account.roleName}. Nothing was changed.`
            );
        }

        console.warn(`Skipped: ${account.email} already exists with role ${row.role_name}. Password left unchanged.`);
        return 'skipped';
    }

    const roleId = await ensureRole(connection, account.roleName);
    const passwordHash = await bcrypt.hash(account.password, SALT_ROUNDS);

    await connection.query(
        `INSERT INTO users (role_id, full_name, email, password_hash, is_active)
         VALUES (?, ?, ?, ?, 1)`,
        [roleId, account.fullName, account.email, passwordHash]
    );

    console.log(`Created: ${account.email} (${account.roleName}).`);
    return 'created';
}

async function main() {
    refuseUnlessDevelopment();

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        for (const account of DEMO_ACCOUNTS) {
            await seedAccount(connection, account);
        }

        await connection.commit();
        console.log('Development seed finished.');
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

main()
    .catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    })
    .finally(() => {
        pool.end().catch(() => {});
    });
