const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const rootDir = __dirname;
const dataDir = path.join(rootDir, "data");
const dataFile = path.join(dataDir, "site.json");
const port = Number(process.env.PORT || 3000);
const adminPassword = process.env.ADMIN_PASSWORD || "yatus-admin";

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
      audio: "assets/audio/india-preview.wav",
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

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(dataFile)) {
    writeState(defaultState);
  }
}

function readState() {
  ensureDataFile();
  try {
    const state = JSON.parse(fs.readFileSync(dataFile, "utf8"));
    return {
      beats: Array.isArray(state.beats) ? state.beats : defaultState.beats,
      stats: state.stats && typeof state.stats === "object" ? state.stats : {},
      visits: Array.isArray(state.visits) ? state.visits : []
    };
  } catch (error) {
    return JSON.parse(JSON.stringify(defaultState));
  }
}

function writeState(state) {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(dataFile, `${JSON.stringify(state, null, 2)}\n`);
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

function trackEvent(eventName, beatId = null) {
  const state = readState();
  state.stats[eventName] = (state.stats[eventName] || 0) + 1;
  if (beatId) {
    const key = `${eventName}:${beatId}`;
    state.stats[key] = (state.stats[key] || 0) + 1;
  }
  writeState(state);
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
    ["server.js", "package.json"].includes(relativePath)
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
  const state = readState();

  if (request.method === "GET" && requestUrl.pathname === "/api/beats") {
    sendJson(response, 200, { beats: state.beats });
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/events") {
    const body = await readBody(request);
    sendJson(response, 200, { stats: trackEvent(body.name, body.beatId) });
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
    writeState(state);
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
    writeState(state);
    sendJson(response, 200, { beats: state.beats });
    return;
  }

  if (request.method === "POST" && requestUrl.pathname === "/api/import") {
    const body = await readBody(request);
    writeState({
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
    writeState(state);
    sendJson(response, 200, { ok: true });
    return;
  }

  sendJson(response, 404, { error: "API route not found" });
}

const server = http.createServer((request, response) => {
  if (request.url === "/health") {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (request.url.startsWith("/api/")) {
    handleApi(request, response).catch(() => {
      sendJson(response, 500, { error: "Erreur serveur" });
    });
    return;
  }

  serveStatic(request, response);
});

ensureDataFile();
server.listen(port, () => {
  console.log(`Yatus Beats running on http://localhost:${port}`);
  console.log(`Admin password: ${adminPassword}`);
});
