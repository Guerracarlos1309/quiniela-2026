const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL no está definida en .env');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function createAdmin(username, password) {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'admin',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        const passwordHash = await bcrypt.hash(password, 10);
        await pool.query(
            'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash;',
            [username, passwordHash, 'admin']
        );
        console.log(`✅ Usuario administrador '${username}' creado/actualizado con éxito.`);
    } catch (error) {
        console.error('❌ Error al crear usuario:', error);
    } finally {
        await pool.end();
    }
}

const args = process.argv.slice(2);
if (args.length < 2) {
    console.log('Uso: node scripts/create-admin.js <usuario> <contraseña>');
    process.exit(1);
}

createAdmin(args[0], args[1]);
