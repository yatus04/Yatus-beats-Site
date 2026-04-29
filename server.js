const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const rootDir = __dirname;
const dataDir = path.join(rootDir, "data");
const dataFile = path.join(dataDir, "site.json");
const port = Number(process.env.PORT || 3000);
const adminPassword = process.env.ADMIN_PASSWORD || "yatus-admin";
const databaseUrl = process.env.DATABASE_URL || "";

let dbPool = null;

const defaultState = {
  beats: [
    {
      id: "9tq_dURbYuo",
      title: "India",
      style: "African Drill Mbalakh",
      bpm: 152,
      key: "Non precisee",
      mood: "Percutant, africain, drill",
      youtube: "https://youtu.be/9tq_dURbYuo",
      audio: "assets/audio/india-preview-short.wav",
      popular: true
    },
    {
      id: "nwEaxBznCD8",
      title: "Mali",
      style: "African Drill",
      bpm: null,
      key: "Non precisee",
      mood: "Lourd, tribal, sombre",
      youtube: "https://youtu.be/nwEaxBznCD8",
      audio: "assets/audio/mali-preview.mp3",
      popular: true
    },
    {
      id: "hbyxp2dGqc8",
      title: "Maroc",
      style: "Drill Mbalakh",
      bpm: 147,
      key: "Non precisee",
      mood: "Mystique, drill, mbalakh",
      youtube: "https://youtu.be/hbyxp2dGqc8",
      audio: "assets/audio/maroc-preview.mp3",
      popular: true
    }
  ],
  stats: {},
  visits: []
};

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ico": "image/x-icon"
};

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(defaultState));
}

function normalizeState(state) {
  return {
    beats: Array.isArray(state?.beats) ? state.beats : defaultState.beats,
    stats: state?.stats && typeof state.stats === "object" ? state.stats : {},
    visits: Array.isArray(state?.visits) ? state.visits : []
  };
}

function getPool() {
  if (!databaseUrl) return null;
  if (!dbPool) {
    const { Pool } = require("pg");
    dbPool = new Pool({
      connectionString: databaseUrl,
      ssl: process.env.DATABASE_SSL === "false" ? false : { rejectUnauthorized: false }
    });
  }
  return dbPool;
}

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dataFile)) {
    writeJsonState(defaultState);
  }
}

function readJsonState() {
  ensureDataFile();
  try {
    return normalizeState(JSON.parse(fs.readFileSync(dataFile, "utf8")));
  } catch (error) {
    return cloneDefaultState();
  }
}

function writeJsonState(state) {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(dataFile, `${JSON.stringify(normalizeState(state), null, 2)}\n`);
}

async function initDatabase() {
  const pool = getPool();
  if (!pool) {
    ensureDataFile();
    return;
  }

  await pool.query(`
    create table if not exists app_state (
      id text primary key,
      data jsonb not null,
      updated_at timestamptz not null default now()
    )
  `);

  await pool.query(
    `
      insert into app_state (id, data)
      values ($1, $2::jsonb)
      on conflict (id) do nothing
    `,
    ["site", JSON.stringify(defaultState)]
  );
}

async function readState() {
  const pool = getPool();
  if (!pool) return readJsonState();

  const result = await pool.query("select data from app_state where id = $1", ["site"]);
  return normalizeState(result.rows[0]?.data || defaultState);
}

async function writeState(state) {
  const pool = getPool();
  const normalizedState = normalizeState(state);

  if (!pool) {
    writeJsonState(normalizedState);
    return;
  }

  await pool.query(
    `
      insert into app_state (id, data, updated_at)
      values ($1, $2::jsonb, now())
      on conflict (id)
      do update set data = excluded.data, updated_at = now()
    `,
    ["site", JSON.stringify(normalizedState)]
  );
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  response.end(JSON.stringify(body));
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
      }
    });
    request.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function isAdmin(request) {
  const password = String(request.headers["x-admin-password"] || "");
  if (password.length !== adminPassword.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(password), Buffer.from(adminPassword));
}

async function trackEvent(eventName, beatId = null, metadata = {}) {
  const state = await readState();
  state.stats[eventName] = (state.stats[eventName] || 0) + 1;
  if (beatId) {
    const key = `${eventName}:${beatId}`;
    state.stats[key] = (state.stats[key] || 0) + 1;
  }
  if (eventName === "otherBeatRequests") {
    state.stats.otherBeatLinks = Array.isArray(state.stats.otherBeatLinks) ? state.stats.otherBeatLinks : [];
    state.stats.otherBeatLinks.unshift({
      at: new Date().toISOString(),
      link: metadata.link || "",
      license: metadata.license || "",
      artist: metadata.artist || ""
    });
    state.stats.otherBeatLinks = state.stats.otherBeatLinks.slice(0, 50);
  }
  await writeState(state);
  return state.stats;
}

function serveStatic(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const cleanPath = decodeURIComponent(requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname);
  const filePath = path.normalize(path.join(rootDir, cleanPath));
  const relativePath = path.relative(rootDir, filePath);

  if (
    !filePath.startsWith(rootDir) ||
    relativePath.startsWith("data") ||
    ["server.js", "package.json", "render.yaml"].includes(relativePath)
  ) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": mimeTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff"
    });
    response.end(content);
  });
}

async function handleApi(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  const state = await readState();

  if (request.method === "GET" && requestUrl.pathname === "/api/beats") {
    sendJson(response, 200, { beats: state.beats });
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/events") {
    const body = await readBody(request);
    sendJson(response, 200, { stats: await trackEvent(body.name, body.beatId, body.metadata || {}) });
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/visits") {
    const body = await readBody(request);
    state.stats.visits = (state.stats.visits || 0) + 1;
    state.stats.lastVisitAt = new Date().toISOString();
    state.visits.unshift({
      sessionId: body.sessionId || crypto.randomUUID(),
      at: new Date().toISOString(),
      page: body.page || "/",
      referrer: body.referrer || "Direct",
      browser: body.browser || "Unknown"
    });
    state.visits = state.visits.slice(0, 500);
    await writeState(state);
    sendJson(response, 200, { ok: true });
    return;
  }

  if (!isAdmin(request)) {
    sendJson(response, 401, { error: "Mot de passe admin invalide." });
    return;
  }

  if (request.method === "GET" && requestUrl.pathname === "/api/admin") {
    sendJson(response, 200, state);
    return;
  }

  if (request.method === "PUT" && requestUrl.pathname === "/api/beats") {
    const body = await readBody(request);
    state.beats = Array.isArray(body.beats) ? body.beats : state.beats;
    await writeState(state);
    sendJson(response, 200, { beats: state.beats });
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/import") {
    const body = await readBody(request);
    await writeState({
      beats: Array.isArray(body.beats) ? body.beats : state.beats,
      stats: body.stats && typeof body.stats === "object" ? body.stats : state.stats,
      visits: Array.isArray(body.visits) ? body.visits : state.visits
    });
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "DELETE" && requestUrl.pathname === "/api/stats") {
    state.stats = {};
    state.visits = [];
    await writeState(state);
    sendJson(response, 200, { ok: true });
    return;
  }

  sendJson(response, 404, { error: "API route not found" });
}

const server = http.createServer((request, response) => {
  if (request.url === "/health") {
    sendJson(response, 200, { ok: true, storage: databaseUrl ? "postgres" : "json" });
    return;
  }

  if (request.url.startsWith("/api/")) {
    handleApi(request, response).catch((error) => {
      console.error(error);
      sendJson(response, 500, { error: "Erreur serveur" });
    });
    return;
  }

  serveStatic(request, response);
});

initDatabase()
  .then(() => {
    server.listen(port, () => {
      console.log(`Yatus Beats running on http://localhost:${port}`);
      console.log(`Storage: ${databaseUrl ? "Postgres/Supabase" : "JSON file"}`);
      console.log(`Admin password: ${adminPassword}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize storage", error);
    process.exit(1);
  });
