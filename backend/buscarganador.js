// buscar_ganadores.js
require("dotenv").config();
const { Client } = require("pg");

async function listarPrediccionesPorPartido() {
  // Validamos que exista la variable de entorno antes de intentar conectar
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
    console.log("✅ Conexión segura establecida con Neon.");

    // --- CONFIGURA AQUÍ EL PARTIDO QUE DESEAS ANALIZAR ---
    const ID_PARTIDO = "GK_M1";

    console.log(
      `\n📊 Obteniendo todas las predicciones para el partido '${ID_PARTIDO}' ordenadas por marcador...`,
    );

    // Consulta modificada: Quitamos el filtro de score exacto y agregamos un ORDER BY inteligente
    const query = `
      SELECT 
        p.score1 AS pred_1,
        p.score2 AS pred_2,
        s.name AS nombre,
        s.phone AS telefono,
        p.team1 AS equipo1,
        p.team2 AS equipo2,
        s.is_active AS activo
      FROM predictions p
      JOIN submissions s ON p.submission_id = s.id
      WHERE p.match_id = $1
      ORDER BY p.score1 ASC, p.score2 ASC; -- <-- Aquí ocurre la magia del orden cronológico de goles
    `;

    const res = await client.query(query, [ID_PARTIDO]);

    if (res.rowCount > 0) {
      console.log(`\n📌 Se encontraron ${res.rowCount} predicciones en total:`);
      console.table(res.rows); // Te los mostrará ordenaditos por marcador en la consola
    } else {
      console.log(
        `\n⚠ Alerta: No se encontraron predicciones registradas para el partido '${ID_PARTIDO}'.`,
      );
    }
  } catch (err) {
    console.error("❌ Error controlado en la operación:", err.message);
  } finally {
    await client.end();
    console.log("🔌 Conexión cerrada correctamente.");
  }
}

listarPrediccionesPorPartido();
