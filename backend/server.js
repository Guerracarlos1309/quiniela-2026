const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

try {
  require("dotenv").config();
} catch (_error) {
  // dotenv is optional in cloud environments where env vars are injected.
}

const JWT_SECRET = process.env.JWT_SECRET || "quiniela_secret_2026_default";

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
  ssl: process.env.DATABASE_URL.includes("localhost") || process.env.DATABASE_URL.includes("127.0.0.1")
    ? false
    : { rejectUnauthorized: false },
});

pool.on("error", (err) => {
  console.error("❌ Error inesperado en el pool de PostgreSQL:", err);
});

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : "*",
  }),
);
app.use(express.json());
// app.use(express.static('public')); // Deshabilitado: El frontend es independiente.

// Cache memory for leaderboard
let leaderboardCache = {
  data: null,
  timestamp: 0,
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function clearLeaderboardCache() {
  leaderboardCache.data = null;
}

// Authentication Middlewares
async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader; // Currently frontend sends it direct

  if (!token) return res.status(401).json({ error: "No autorizado" });

  // Support for legacy "phone:password" to avoid breaking things immediately
  if (token.includes(":")) {
    const [phone, password] = token.split(":");
    const cleanPhone = String(phone).replace(/\D/g, "");
    try {
      const result = await pool.query(
        "SELECT id, name, phone, password_hash, is_active FROM submissions WHERE phone = $1",
        [cleanPhone]
      );
      if (result.rows.length === 0) return res.status(401).json({ error: "Número de teléfono no registrado" });
      const user = result.rows[0];
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) return res.status(401).json({ error: "Credenciales inválidas" });
      req.user = { id: user.id, phone: user.phone, role: "participant", is_active: user.is_active };
      return next();
    } catch (err) {
      return res.status(500).json({ error: "Error de auth" });
    }
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Token inválido o expirado" });
    req.user = user;
    next();
  });
}

async function authenticateAdmin(req, res, next) {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).json({ error: "No autorizado" });

  // Legacy support for admin
  if (token === ADMIN_PASSWORD) {
    req.user = { role: "admin" };
    return next();
  }

  if (token.includes(":")) {
    const [username, password] = token.split(":");
    try {
      const result = await pool.query(
        "SELECT password_hash FROM users WHERE username = $1",
        [username]
      );
      if (result.rows.length > 0) {
        const match = await bcrypt.compare(password, result.rows[0].password_hash);
        if (match) {
          req.user = { username, role: "admin" };
          return next();
        }
      }
    } catch (err) {}
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err || user.role !== "admin") return res.status(403).json({ error: "No autorizado" });
    req.user = user;
    next();
  });
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
            is_active BOOLEAN DEFAULT FALSE,
            submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
    `);

  // Migration for existing tables - ensure columns exist
  try {
    await pool.query("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS password_hash TEXT;");
    await pool.query("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'participant';");
    await pool.query("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE;");
    await pool.query("ALTER TABLE submissions ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT FALSE;");
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

  await pool.query(`
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );
    `);

  // Initialize settings
  await pool.query(`
        INSERT INTO settings (key, value)
        VALUES ('predictions_locked', 'false')
        ON CONFLICT (key) DO NOTHING;
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

app.get("/api/settings", async (req, res) => {
  try {
    const result = await pool.query("SELECT key, value FROM settings");
    const settings = {};
    result.rows.forEach((row) => {
      settings[row.key] = row.value;
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener configuraciones" });
  }
});

// API Endpoints
app.post("/api/predict", authenticateToken, async (req, res) => {
  const { predictions } = req.body;
  if (!Array.isArray(predictions) || predictions.length === 0) {
    return res.status(400).json({ error: "Faltan predicciones" });
  }

  const client = await pool.connect();
  try {
    const lockRes = await client.query("SELECT value FROM settings WHERE key = 'predictions_locked'");
    const isLocked = lockRes.rows[0]?.value === "true";

    if (isLocked) {
      return res.status(403).json({ error: "Las predicciones están cerradas debido al comienzo del torneo." });
    }

    // Re-verificar estado de activación real en BD (por si cambió desde el login)
    const userStatusRes = await client.query("SELECT is_active FROM submissions WHERE id = $1", [req.user.id]);
    if (userStatusRes.rows.length === 0 || !userStatusRes.rows[0].is_active) {
      return res.status(403).json({ error: "Estás siendo revisado, espera hasta que activen tu cuenta" });
    }

    await client.query("BEGIN");

    // Borrar predicciones anteriores si existen
    await client.query("DELETE FROM predictions WHERE submission_id = $1", [req.user.id]);

    // OPTIMIZATION: BATCH INSERT
    if (predictions.length > 0) {
      const values = [];
      const params = [req.user.id];
      let placeholderIdx = 2;
      
      const insertQuery = `
        INSERT INTO predictions (submission_id, match_id, team1, score1, team2, score2)
        VALUES ${predictions.map(p => {
          const start = placeholderIdx;
          placeholderIdx += 5;
          values.push(p.matchId, p.team1, parseInt(p.score1, 10), p.team2, parseInt(p.score2, 10));
          return `($1, $${start}, $${start+1}, $${start+2}, $${start+3}, $${start+4})`;
        }).join(", ")}
      `;
      await client.query(insertQuery, params.concat(values));
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
      "INSERT INTO submissions (name, phone, password_hash) VALUES ($1, $2, $3) RETURNING id, name, phone, is_active",
      [name, cleanPhone, hash]
    );
    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: "participant" }, 
      JWT_SECRET, 
      { expiresIn: "7d" }
    );

    res.status(201).json({ 
      message: "Registro exitoso", 
      user,
      token
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
  
  if (!cleanPhone) {
    return res.status(401).json({ error: "Número de teléfono no registrado" });
  }

  try {
    const result = await pool.query(
      "SELECT id, name, phone, password_hash, is_active, must_change_password FROM submissions WHERE phone = $1",
      [cleanPhone]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Número de teléfono no registrado" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign(
      { id: user.id, phone: user.phone, role: "participant" }, 
      JWT_SECRET, 
      { expiresIn: "7d" }
    );

    res.json({ 
      message: "Login exitoso", 
      user: { 
        id: user.id, 
        name: user.name, 
        phone: user.phone, 
        is_active: user.is_active,
        must_change_password: user.must_change_password
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

app.get("/api/user/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, phone, is_active, must_change_password FROM submissions WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) return res.status(401).json({ error: "Número de teléfono no registrado" });
    const user = result.rows[0];

    // Buscar si ya tiene predicciones
    const predictionsRes = await pool.query(
      "SELECT match_id, team1, score1, team2, score2 FROM predictions WHERE submission_id = $1",
      [user.id]
    );

    res.json({
      user: { 
        id: user.id, 
        name: user.name, 
        phone: user.phone, 
        is_active: user.is_active,
        must_change_password: user.must_change_password
      },
      predictions: predictionsRes.rows
    });
  } catch (error) {
    res.status(500).json({ error: "Error al obtener perfil" });
  }
});

app.post("/api/user/change-password", authenticateToken, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ error: "Nueva contraseña requerida" });

  try {
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      "UPDATE submissions SET password_hash = $1, must_change_password = FALSE WHERE id = $2",
      [hash, req.user.id]
    );
    res.json({ message: "Contraseña actualizada con éxito" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar la contraseña" });
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
      return res.status(401).json({ error: "Usuario administrador no encontrado" });

    const match = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!match) return res.status(401).json({ error: "Contraseña incorrecta" });

    const token = jwt.sign(
      { username, role: "admin" }, 
      JWT_SECRET, 
      { expiresIn: "24h" }
    );

    res.json({ token, username });
  } catch (error) {
    res.status(500).json({ error: "Error en el servidor" });
  }
});

app.post("/api/admin/settings", authenticateAdmin, async (req, res) => {

  const { key, value } = req.body;
  if (!key || value === undefined) {
    return res.status(400).json({ error: "Faltan datos" });
  }

  try {
    await pool.query(
      "INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value",
      [key, String(value)]
    );
    res.json({ message: "Configuración actualizada" });
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar configuración" });
  }
});

app.post("/api/admin/set-result", authenticateAdmin, async (req, res) => {
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
  // Check cache
  const now = Date.now();
  if (leaderboardCache.data && (now - leaderboardCache.timestamp < CACHE_DURATION)) {
    return res.json(leaderboardCache.data);
  }

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
    
    // Update cache
    leaderboardCache = {
      data: enriched,
      timestamp: Date.now()
    };
    
    res.json(enriched);
  } catch (error) {
    res.status(500).json({ error: "Error al calcular tabla" });
  }
});

app.get("/api/admin/entries", authenticateAdmin, async (req, res) => {

  try {
    const entriesQuery = `
            SELECT
                s.id,
                s.name,
                s.phone,
                s.is_active,
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
      is_active: entry.is_active,
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

app.delete("/api/admin/submissions/:id", authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  console.log(`Intentando borrar participante con ID: ${id}`);

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

app.post("/api/admin/submissions/:id/toggle-active", authenticateAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "UPDATE submissions SET is_active = NOT is_active WHERE id = $1 RETURNING is_active",
      [id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ message: "Estado de usuario actualizado", is_active: result.rows[0].is_active });
  } catch (err) {
    res.status(500).json({ error: "Error al actualizar estado" });
  }
});

app.post("/api/admin/submissions/:id/reset-password", authenticateAdmin, async (req, res) => {
  const { id } = req.params;
  const { newPassword } = req.body;
  if (!newPassword) return res.status(400).json({ error: "Nueva contraseña requerida" });

  try {
    const hash = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      "UPDATE submissions SET password_hash = $1, must_change_password = TRUE WHERE id = $2 RETURNING id",
      [hash, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Usuario no encontrado" });
    res.json({ message: "Contraseña restablecida. El usuario deberá cambiarla al ingresar." });
  } catch (err) {
    res.status(500).json({ error: "Error al restablecer contraseña" });
  }
});

app.post("/api/admin/reset-results", authenticateAdmin, async (req, res) => {
  clearLeaderboardCache();
  try {
    await pool.query("DELETE FROM official_results;");
    res.json({ message: "Resultados oficiales restablecidos" });
  } catch (error) {
    res.status(500).json({ error: "Error al resetear resultados" });
  }
});

app.post("/api/admin/reset-all", authenticateAdmin, async (req, res) => {
  clearLeaderboardCache();
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
    // Probar conexión inicial
    const res = await pool.query("SELECT NOW()");
    console.log("✅ Conexión a PostgreSQL establecida:", res.rows[0].now);

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
