// update_admin.js
require("dotenv").config();
const { Client } = require("pg");
const bcrypt = require("bcryptjs"); // Usamos bcryptjs que es la que tienes instalada

async function cambiarClaveAdmin() {
  // Validamos que exista la variable de entorno para no intentar conectar a ciegas
  if (!process.env.DATABASE_URL) {
    console.error(
      "❌ Error: No se encontró la variable DATABASE_URL en el archivo .env",
    );
    return;
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    // Obligatorio para conectar de forma segura a Neon en producción
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log("✅ Conexión segura establecida con Neon.");

    const usuario = "carlos";
    const nuevaClavePlana = "Juan16052004"; // Cambia esto si quieres otra clave

    console.log(`Generando hash seguro para el administrador '${usuario}'...`);
    // Encriptamos usando la librería correcta bcryptjs
    const passwordHash = await bcrypt.hash(nuevaClavePlana, 10);

    // Esta consulta es ultra segura: SOLO actualiza el password_hash del usuario 'carlos'
    const query = `
      UPDATE users
      SET password_hash = $1
      WHERE username = $2
      RETURNING id, username, role;
    `;

    const res = await client.query(query, [passwordHash, usuario]);

    if (res.rowCount > 0) {
      console.log(`\n▲ ¡Contraseña de administrador actualizada con éxito!`);
      console.table(res.rows); // Te muestra id, username y role para confirmar
    } else {
      console.log(
        `\n⚠ Alerta: No se encontró al usuario '${usuario}' en la tabla 'users'.`,
      );
      console.log("No se modificó ningún dato.");
    }
  } catch (err) {
    console.error("❌ Error controlado en la operación:", err.message);
  } finally {
    await client.end();
    console.log("🔌 Conexión cerrada correctamente.");
  }
}

cambiarClaveAdmin();
