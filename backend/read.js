// leer_partidos.js
require("dotenv").config();
const { Client } = require("pg");

async function obtenerIdsPartidos() {
  if (!process.env.DATABASE_URL) {
    console.error(
      "❌ Error: No se encontró la variable DATABASE_URL en el archivo .env",
    );
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log("✅ Conexión segura establecida.");
    console.log("Obteniendo identificadores de partidos...\n");

    // CORRECCIÓN: Agregamos las columnas al SELECT y al GROUP BY
    const query = `
      SELECT 
        match_id AS partido_id,
        team1 AS equipo1,
        team2 AS equipo2,
        COUNT(*) AS total_predicciones
      FROM predictions
      GROUP BY match_id, team1, team2
      ORDER BY total_predicciones DESC;
    `;

    const res = await client.query(query);

    if (res.rowCount > 0) {
      console.log("📌 Lista de partidos disponibles en la base de datos:");
      console.table(res.rows);
    } else {
      console.log(
        "⚠ No se encontró ningún match_id registrado en la tabla 'predictions'.",
      );
    }
  } catch (err) {
    console.error("❌ Error al leer los IDs de los partidos:", err.message);
  } finally {
    await client.end();
    console.log("🔌 Conexión cerrada.");
  }
}

obtenerIdsPartidos();
