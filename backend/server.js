const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
try {
  require("dotenv").config();
} catch (_error) {
  // dotenv is optional in cloud environments where env vars are injected.
}

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "data", "entries.json");
const RESULTS_FILE = path.join(__dirname, "data", "results.json");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin2026";

if (!process.env.DATABASE_URL) {
  throw new Error("Falta DATABASE_URL en variables de entorno.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
  }),
);
app.use(express.json());
// app.use(express.static('public')); // Deshabilitado: El frontend es independiente.

// Log temporal para diagnosticar el 404 en borrado
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

async function isAdminAuthorized(req) {
  const auth = req.headers.authorization;
  if (!auth) {
    console.log("--- Auth Failure: No Auth Header ---");
    return false;
  }

  // Soporte para contraseña maestra (legacy)
  if (auth === ADMIN_PASSWORD) return true;

  // Soporte para "usuario:password"
  if (auth.includes(":")) {
    const [username, password] = auth.split(":");
    try {
      const result = await pool.query(
        "SELECT password_hash FROM users WHERE username = $1",
        [username],
      );
      if (result.rows.length === 0) {
        console.log(`--- Auth Failure: User "${username}" not found ---`);
        return false;
      }
      const match = await bcrypt.compare(
        password,
        result.rows[0].password_hash,
      );
      if (!match)
        console.log(
          `--- Auth Failure: Incorrect password for "${username}" ---`,
        );
      return match;
    } catch (err) {
      console.error("Auth error:", err);
      return false;
    }
  }

  console.log('--- Auth Failure: Invalid format (missing ":") ---');
  return false;
}

async function ensureSchema() {
  // Ensure submissions has password_hash and role for participant auth
  await pool.query(`
        CREATE TABLE IF NOT EXISTS submissions (
            id BIGSERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT NOT NULL UNIQUE,
            password_hash TEXT,
            role TEXT DEFAULT 'participant',
            submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

  // Migration for existing tables - ensure columns exist
  try {
    await pool.query("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS password_hash TEXT;");
    await pool.query("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'participant';");
    console.log("✅ Submissions table migration checked/applied.");
  } catch (err) {
    console.error("❌ Migration error (submissions):", err.message);
  }

  await pool.query(`
        CREATE TABLE IF NOT EXISTS predictions (
            id BIGSERIAL PRIMARY KEY,
            submission_id BIGINT NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
            match_id TEXT NOT NULL,
            team1 TEXT NOT NULL,
            score1 INTEGER NOT NULL CHECK (score1 >= 0),
            team2 TEXT NOT NULL,
            score2 INTEGER NOT NULL CHECK (score2 >= 0)
        );
    `);

  await pool.query(`
        CREATE TABLE IF NOT EXISTS official_results (
            match_id TEXT PRIMARY KEY,
            score1 INTEGER NOT NULL CHECK (score1 >= 0),
            score2 INTEGER NOT NULL CHECK (score2 >= 0),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

  await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `);
}

async function importLegacyJsonIfNeeded() {
  const countResult = await pool.query(
    "SELECT COUNT(*)::int AS count FROM submissions;",
  );
  const hasData = countResult.rows[0].count > 0;
  if (hasData) return;

  if (fs.existsSync(DATA_FILE)) {
    const rawEntries = fs.readFileSync(DATA_FILE, "utf8");
    const entries = rawEntries ? JSON.parse(rawEntries) : [];
    for (const entry of entries) {
      const submissionInsert = await pool.query(
        "INSERT INTO submissions (name, phone, submitted_at) VALUES ($1, $2, $3) RETURNING id;",
        [entry.name, entry.phone, entry.timestamp || new Date().toISOString()],
      );
      const submissionId = submissionInsert.rows[0].id;

      const predictions = Array.isArray(entry.predictions)
        ? entry.predictions
        : [];
      for (const p of predictions) {
        await pool.query(
          `INSERT INTO predictions (submission_id, match_id, team1, score1, team2, score2)
                     VALUES ($1, $2, $3, $4, $5, $6);`,
          [
            submissionId,
            p.matchId,
            p.team1,
            parseInt(p.score1, 10),
            p.team2,
            parseInt(p.score2, 10),
          ],
        );
      }
    }
  }

  if (fs.existsSync(RESULTS_FILE)) {
    const rawResults = fs.readFileSync(RESULTS_FILE, "utf8");
    const results = rawResults ? JSON.parse(rawResults) : {};
    for (const [matchId, result] of Object.entries(results)) {
      await pool.query(
        `INSERT INTO official_results (match_id, score1, score2)
                 VALUES ($1, $2, $3)
                 ON CONFLICT (match_id)
                 DO UPDATE SET score1 = EXCLUDED.score1, score2 = EXCLUDED.score2, updated_at = NOW();`,
        [matchId, parseInt(result.score1, 10), parseInt(result.score2, 10)],
      );
    }
  }
}

app.get("/api/ping", (req, res) => {
  res.json({
    status: "ok",
    version: "2.1",
    message: "Servidor actualizado y detectando duplicados",
  });
});

// API Endpoints
app.post("/api/predict", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.includes(":")) return res.status(401).json({ error: "No autorizado" });

  const [phone, password] = auth.split(":");
  const cleanPhone = String(phone).replace(/\D/g, "");

  const { predictions } = req.body;
  if (!Array.isArray(predictions) || predictions.length === 0) {
    return res.status(400).json({ error: "Faltan predicciones" });
  }

  const client = await pool.connect();
  try {
    // Verificar usuario
    const userRes = await client.query(
      "SELECT id, password_hash FROM submissions WHERE phone = $1",
      [cleanPhone]
    );

    if (userRes.rows.length === 0) return res.status(401).json({ error: "Usuario no encontrado" });
    const user = userRes.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Token inválido" });

    // Verificar si ya tiene predicciones
    const existing = await client.query(
      "SELECT id FROM predictions WHERE submission_id = $1",
      [user.id]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: "Ya has registrado tus predicciones" });
    }

    await client.query("BEGIN");

    for (const p of predictions) {
      await client.query(
        `INSERT INTO predictions (submission_id, match_id, team1, score1, team2, score2)
                 VALUES ($1, $2, $3, $4, $5, $6);`,
        [
          user.id,
          p.matchId,
          p.team1,
          parseInt(p.score1, 10),
          p.team2,
          parseInt(p.score2, 10),
        ]
      );
    }
    await client.query("COMMIT");
    res.status(201).json({ message: "Predicciones guardadas con éxito" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error al guardar predicciones:", error);
    res.status(500).json({ error: "Error al guardar datos" });
  } finally {
    client.release();
  }
});

// Participant Registry & Login
app.post("/api/register", async (req, res) => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const cleanPhone = String(phone).replace(/\D/g, "");
  const hash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      "INSERT INTO submissions (name, phone, password_hash) VALUES ($1, $2, $3) RETURNING id, name, phone",
      [name, cleanPhone, hash]
    );
    res.status(201).json({ 
      message: "Registro exitoso", 
      user: result.rows[0],
      token: `${cleanPhone}:${password}`
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ error: "Este número de teléfono ya está registrado" });
    }
    console.error("REGISTRATION ERROR:", err);
    res.status(500).json({ error: "Error al registrar usuario: " + err.message });
  }
});

app.post("/api/login", async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) return res.status(400).json({ error: "Faltan credenciales" });

  const cleanPhone = String(phone).replace(/\D/g, "");

  try {
    const result = await pool.query(
      "SELECT id, name, phone, password_hash FROM submissions WHERE phone = $1",
      [cleanPhone]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Usuario no encontrado" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Contraseña incorrecta" });

    res.json({ 
      message: "Login exitoso", 
      user: { id: user.id, name: user.name, phone: user.phone },
      token: `${cleanPhone}:${password}`
    });
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

app.get("/api/user/me", async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.includes(":")) return res.status(401).json({ error: "No autorizado" });

  const [phone, password] = auth.split(":");
  const cleanPhone = String(phone).replace(/\D/g, "");

  try {
    const result = await pool.query(
      "SELECT id, name, phone, password_hash FROM submissions WHERE phone = $1",
      [cleanPhone]
    );

    if (result.rows.length === 0) return res.status(401).json({ error: "Usuario no encontrado" });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Token inválido" });

    // Buscar si ya tiene predicciones
    const predictionsRes = await pool.query(
      "SELECT match_id, team1, score1, team2, score2 FROM predictions WHERE submission_id = $1",
      [user.id]
    );

    res.json({
      user: { id: user.id, name: user.name, phone: user.phone },
      predictions: predictionsRes.rows
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener perfil" });
  }
});

app.post("/api/admin/login", async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Faltan credenciales" });

  try {
    const result = await pool.query(
      "SELECT password_hash FROM users WHERE username = $1",
      [username],
    );
    if (result.rows.length === 0)
      return res.status(401).json({ error: "Usuario no encontrado" });

    const match = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!match) return res.status(401).json({ error: "Contraseña incorrecta" });

    res.json({ token: `${username}:${password}`, username });
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

app.post("/api/admin/set-result", async (req, res) => {
  if (!(await isAdminAuthorized(req)))
    return res.status(401).json({ error: "No autorizado" });
  const { matchId, score1, score2 } = req.body;
  if (!matchId || score1 === undefined || score2 === undefined) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  try {
    await pool.query(
      `INSERT INTO official_results (match_id, score1, score2)
             VALUES ($1, $2, $3)
             ON CONFLICT (match_id)
             DO UPDATE SET score1 = EXCLUDED.score1, score2 = EXCLUDED.score2, updated_at = NOW();`,
      [matchId, parseInt(score1, 10), parseInt(score2, 10)],
    );
    res.json({ message: "Resultado oficial actualizado" });
  } catch (error) {
    res.status(500).json({ error: "Error al guardar resultado" });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const leaderboardQuery = `
            SELECT
                s.name,
                COALESCE(SUM(
                    CASE
                        WHEN r.match_id IS NULL THEN 0
                        WHEN p.score1 = r.score1 AND p.score2 = r.score2 THEN 3
                        WHEN
                            CASE
                                WHEN p.score1 > p.score2 THEN 1
                                WHEN p.score1 < p.score2 THEN 2
                                ELSE 0
                            END
                            =
                            CASE
                                WHEN r.score1 > r.score2 THEN 1
                                WHEN r.score1 < r.score2 THEN 2
                                ELSE 0
                            END
                        THEN 1
                        ELSE 0
                    END
                ), 0)::int AS points
                ,
                COALESCE(SUM(
                    CASE
                        WHEN r.match_id IS NOT NULL
                             AND p.score1 = r.score1
                             AND p.score2 = r.score2
                        THEN 1
                        ELSE 0
                    END
                ), 0)::int AS exact_hits,
                COALESCE(SUM(
                    CASE
                        WHEN r.match_id IS NULL THEN 0
                        WHEN p.score1 = r.score1 AND p.score2 = r.score2 THEN 0
                        WHEN
                            CASE
                                WHEN p.score1 > p.score2 THEN 1
                                WHEN p.score1 < p.score2 THEN 2
                                ELSE 0
                            END
                            =
                            CASE
                                WHEN r.score1 > r.score2 THEN 1
                                WHEN r.score1 < r.score2 THEN 2
                                ELSE 0
                            END
                        THEN 1
                        ELSE 0
                    END
                ), 0)::int AS outcome_hits,
                COALESCE(SUM(CASE WHEN r.match_id IS NOT NULL THEN 1 ELSE 0 END), 0)::int AS matches_scored
            FROM submissions s
            LEFT JOIN predictions p ON p.submission_id = s.id
            LEFT JOIN official_results r ON r.match_id = p.match_id
            GROUP BY s.id, s.name
            ORDER BY points DESC, s.name ASC;
        `;
    const { rows } = await pool.query(leaderboardQuery);
    const enriched = rows.map((r) => ({
      name: r.name,
      points: Number(r.points) || 0,
      exact_hits: Number(r.exact_hits) || 0,
      outcome_hits: Number(r.outcome_hits) || 0,
      matches_scored: Number(r.matches_scored) || 0,
      misses: Math.max(
        0,
        (Number(r.matches_scored) || 0) -
          (Number(r.exact_hits) || 0) -
          (Number(r.outcome_hits) || 0),
      ),
    }));
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: "Error al calcular tabla" });
  }
});

app.get("/api/admin/entries", async (req, res) => {
  if (!(await isAdminAuthorized(req)))
    return res.status(401).json({ error: "No autorizado" });

  try {
    const entriesQuery = `
            SELECT
                s.id,
                s.name,
                s.phone,
                s.submitted_at AS timestamp,
                COALESCE(SUM(
                    CASE
                        WHEN r.match_id IS NULL THEN 0
                        WHEN p.score1 = r.score1 AND p.score2 = r.score2 THEN 3
                        WHEN
                            CASE
                                WHEN p.score1 > p.score2 THEN 1
                                WHEN p.score1 < p.score2 THEN 2
                                ELSE 0
                            END
                            =
                            CASE
                                WHEN r.score1 > r.score2 THEN 1
                                WHEN r.score1 < r.score2 THEN 2
                                ELSE 0
                            END
                        THEN 1
                        ELSE 0
                    END
                ), 0)::int AS "currentPoints"
            FROM submissions s
            LEFT JOIN predictions p ON p.submission_id = s.id
            LEFT JOIN official_results r ON r.match_id = p.match_id
            GROUP BY s.id
            ORDER BY s.submitted_at DESC;
        `;
    const entriesRows = await pool.query(entriesQuery);

    const predictionsRows = await pool.query(`
            SELECT submission_id, match_id, team1, score1, team2, score2
            FROM predictions
            ORDER BY submission_id ASC, id ASC;
        `);

    const predMap = new Map();
    for (const p of predictionsRows.rows) {
      if (!predMap.has(p.submission_id)) predMap.set(p.submission_id, []);
      predMap.get(p.submission_id).push({
        matchId: p.match_id,
        team1: p.team1,
        score1: String(p.score1),
        team2: p.team2,
        score2: String(p.score2),
      });
    }

    const entries = entriesRows.rows.map((entry) => ({
      id: Number(entry.id),
      name: entry.name,
      phone: entry.phone,
      timestamp: entry.timestamp,
      currentPoints: entry.currentPoints,
      predictions: predMap.get(entry.id) || [],
    }));

    const officialResultsRows = await pool.query(
      "SELECT match_id, score1, score2 FROM official_results;",
    );
    const officialResults = {};
    for (const row of officialResultsRows.rows) {
      officialResults[row.match_id] = {
        score1: row.score1,
        score2: row.score2,
      };
    }

    res.json({ entries, officialResults });
  } catch (error) {
    res.status(500).json({ error: "Error al leer los datos" });
  }
});

app.delete("/api/admin/submissions/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`Intentando borrar participante con ID: ${id}`);

  if (!(await isAdminAuthorized(req))) {
    console.log(`Intento de borrado NO AUTORIZADO para ID: ${id}`);
    return res.status(401).json({ error: "No autorizado" });
  }

  try {
    const result = await pool.query("DELETE FROM submissions WHERE id = $1", [
      id,
    ]);
    if (result.rowCount === 0) {
      console.log(`No se encontró participante con ID: ${id} para borrar.`);
      return res
        .status(404)
        .json({ error: "No se encontró el participante o ya fue borrado" });
    }
    console.log(`✅ Participante con ID: ${id} borrado con éxito.`);
    res.json({ message: "Participante eliminado con éxito" });
  } catch (error) {
    console.error("Error al borrar participante en BD:", error);
    res.status(500).json({ error: "Error al borrar el participante" });
  }
});

app.post("/api/admin/reset-results", async (req, res) => {
  if (!(await isAdminAuthorized(req)))
    return res.status(401).json({ error: "No autorizado" });
  try {
    await pool.query("DELETE FROM official_results;");
    res.json({ message: "Resultados oficiales restablecidos" });
  } catch (error) {
    res.status(500).json({ error: "Error al resetear resultados" });
  }
});

app.post("/api/admin/reset-all", async (req, res) => {
  if (!(await isAdminAuthorized(req)))
    return res.status(401).json({ error: "No autorizado" });
  try {
    await pool.query("DELETE FROM official_results;");
    await pool.query("DELETE FROM predictions;");
    await pool.query("DELETE FROM submissions;");
    res.json({ message: "Toda la competencia ha sido restablecida" });
  } catch (error) {
    res.status(500).json({ error: "Error al resetear todo" });
  }
});

async function createInitialUser() {
  const userCheck = await pool.query(
    "SELECT * FROM users WHERE username = $1",
    ["carlos"],
  );
  if (userCheck.rows.length === 0) {
    const hash = await bcrypt.hash("admin2026", 10);
    await pool.query(
      "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)",
      ["carlos", hash, "admin"],
    );
    console.log("✅ Usuario administrador creado con éxito");
  }
}

async function start() {
  try {
    await ensureSchema();

    //await createInitialUser();

    const hash = await bcrypt.hash("admin2026", 10);
    await pool.query(
      "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) " +
        "ON CONFLICT (username) DO UPDATE SET password_hash = EXCLUDED.password_hash",
      ["carlos", hash, "admin"],
    );

    await importLegacyJsonIfNeeded();
    app.listen(PORT, () => {
      console.log(
        `Servidor de la Quiniela corriendo en http://localhost:${PORT}`,
      );
    });
  } catch (error) {
    console.error("Error al iniciar servidor:", error);
    process.exit(1);
  }
}

start();
