const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('--- Iniciando Limpieza de Duplicados ---');
        
        // 1. Identificar y eliminar duplicados (mantener el ID menor)
        const findDuplicates = await client.query(`
            SELECT phone, array_agg(id ORDER BY id ASC) as ids 
            FROM submissions 
            GROUP BY phone 
            HAVING count(*) > 1;
        `);

        if (findDuplicates.rows.length === 0) {
            console.log('No se encontraron duplicados.');
        } else {
            console.log(`Se encontraron ${findDuplicates.rows.length} números con duplicados.`);
            for (const row of findDuplicates.rows) {
                const toDelete = row.ids.slice(1); // Todos excepto el primero
                console.log(`Borrando duplicados para ${row.phone}: IDs [${toDelete.join(', ')}]`);
                await client.query('DELETE FROM submissions WHERE id = ANY($1)', [toDelete]);
            }
        }

        // 2. Añadir restricción UNIQUE física
        console.log('Aplicando restricción UNIQUE a la columna phone...');
        try {
            await client.query('ALTER TABLE submissions DROP CONSTRAINT IF EXISTS phone_unique;');
            await client.query('ALTER TABLE submissions ADD CONSTRAINT phone_unique UNIQUE (phone);');
            console.log('✅ Restricción UNIQUE aplicada con éxito.');
        } catch (err) {
            console.error('❌ Error al aplicar restricción (¿siguen habiendo duplicados?):', err.message);
        }

    } catch (error) {
        console.error('❌ Error fatal durante la migración:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
