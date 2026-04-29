const defaultBeats = [
  {
    id: "9tq_dURbYuo",
    title: "India",
    style: "African Drill Mbalakh",
    bpm: 152,
    key: "Non precisee",
    mood: "Percutant, africain, drill",
    youtube: "https://youtu.be/9tq_dURbYuo",
    audio: "assets/audio/india-preview-short.wav",
    popular: true,
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
    popular: true,
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
    popular: true,
  },
];

const form = document.querySelector("#beatForm");
const beatsTable = document.querySelector("#beatsTable");
const visitsTable = document.querySelector("#visitsTable");
const importBox = document.querySelector("#importBox");

const fields = {
  editIndex: document.querySelector("#beatEditIndex"),
  title: document.querySelector("#beatTitle"),
  id: document.querySelector("#beatId"),
  style: document.querySelector("#beatStyle"),
  bpm: document.querySelector("#beatBpm"),
  key: document.querySelector("#beatKey"),
  mood: document.querySelector("#beatMood"),
  youtube: document.querySelector("#beatYoutube"),
  audio: document.querySelector("#beatAudio"),
  popular: document.querySelector("#beatPopular"),
};

let adminPassword = sessionStorage.getItem("yatus.adminPassword") || "";
let adminState = {
  beats: [],
  stats: {},
  visits: [],
};

function askPassword() {
  if (!adminPassword) {
    adminPassword = prompt("Mot de passe admin") || "";
    sessionStorage.setItem("yatus.adminPassword", adminPassword);
  }
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Admin-Password": adminPassword,
      ...(options.headers || {}),
    },
  });

  if (response.status === 401) {
    sessionStorage.removeItem("yatus.adminPassword");
    adminPassword = "";
    throw new Error("Mot de passe admin invalide.");
  }

  if (!response.ok) {
    let details = "";
    try {
      const errorBody = await response.json();
      details = errorBody.error ? ` ${errorBody.error}` : "";
    } catch (error) {
      details = "";
    }

    if (response.status === 404) {
      throw new Error("API introuvable. Ouvre l'admin avec http://localhost:3000/admin.html apres avoir lance npm start.");
    }

    throw new Error(`Erreur API ${response.status}.${details}`);
  }

  return response.json();
}

async function loadAdminState() {
  askPassword();
  adminState = await api("/api/admin");
  renderAdmin();
}

async function saveBeats(beats) {
  const data = await api("/api/beats", {
    method: "PUT",
    body: JSON.stringify({ beats }),
  });
  adminState.beats = data.beats;
}

function getBeats() {
  return Array.isArray(adminState.beats) && adminState.beats.length ? adminState.beats : defaultBeats;
}

function getStats() {
  return adminState.stats || {};
}

function getVisits() {
  return Array.isArray(adminState.visits) ? adminState.visits : [];
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function renderMetrics() {
  const stats = getStats();
  const beats = getBeats();
  document.querySelector("#metricVisits").textContent = stats.visits || 0;
  document.querySelector("#metricPlays").textContent = stats.plays || 0;
  document.querySelector("#metricCartAdds").textContent = stats.cartAdds || 0;
  document.querySelector("#metricBeats").textContent = beats.length;
}

function renderBeatsTable() {
  const stats = getStats();
  beatsTable.innerHTML = getBeats()
    .map(
      (beat, index) => `
        <tr>
          <td>
            <strong>${beat.title}</strong>
            <small>${beat.youtube}</small>
          </td>
          <td>${beat.style}</td>
          <td>${beat.bpm || "-"}</td>
          <td>${beat.popular ? "Oui" : "Non"}</td>
          <td>
            ${stats[`plays:${beat.id}`] || 0} ecoutes
            <small>${stats[`cartAdds:${beat.id}`] || 0} ajouts panier</small>
          </td>
          <td>
            <div class="table-actions">
              <button class="mini-button" type="button" data-edit="${index}">Modifier</button>
              <button class="mini-button" type="button" data-delete="${index}">Supprimer</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");
}

function renderVisits() {
  const visits = getVisits();
  visitsTable.innerHTML = visits.length
    ? visits
        .map(
          (visit) => `
            <tr>
              <td>${formatDate(visit.at)}</td>
              <td>${String(visit.sessionId).slice(0, 8)}</td>
              <td>${visit.page}</td>
              <td>${visit.referrer}</td>
            </tr>
          `
        )
        .join("")
    : '<tr><td colspan="4">Aucune visite enregistree pour le moment.</td></tr>';
}

function renderAdmin() {
  renderMetrics();
  renderBeatsTable();
  renderVisits();
}

function fillForm(beat, index) {
  fields.editIndex.value = index;
  fields.title.value = beat.title || "";
  fields.id.value = beat.id || "";
  fields.style.value = beat.style || "";
  fields.bpm.value = beat.bpm || "";
  fields.key.value = beat.key || "";
  fields.mood.value = beat.mood || "";
  fields.youtube.value = beat.youtube || "";
  fields.audio.value = beat.audio || "";
  fields.popular.checked = Boolean(beat.popular);
  fields.title.focus();
}

function clearForm() {
  form.reset();
  fields.editIndex.value = "";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const beats = [...getBeats()];
  const beat = {
    title: fields.title.value.trim(),
    id: fields.id.value.trim(),
    style: fields.style.value.trim(),
    bpm: fields.bpm.value ? Number(fields.bpm.value) : null,
    key: fields.key.value.trim() || "Non precisee",
    mood: fields.mood.value.trim() || "A confirmer",
    youtube: fields.youtube.value.trim(),
    audio: fields.audio.value.trim(),
    popular: fields.popular.checked,
  };

  const editIndex = fields.editIndex.value;
  if (editIndex === "") {
    beats.push(beat);
  } else {
    beats[Number(editIndex)] = beat;
  }

  await saveBeats(beats);
  clearForm();
  renderAdmin();
});

beatsTable.addEventListener("click", async (event) => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  const beats = [...getBeats()];

  if (editButton) {
    fillForm(beats[Number(editButton.dataset.edit)], Number(editButton.dataset.edit));
  }

  if (deleteButton) {
    beats.splice(Number(deleteButton.dataset.delete), 1);
    await saveBeats(beats);
    renderAdmin();
  }
});

document.querySelector("#cancelEdit").addEventListener("click", clearForm);

document.querySelector("#resetBeats").addEventListener("click", async () => {
  await saveBeats(defaultBeats);
  clearForm();
  renderAdmin();
});

document.querySelector("#clearStats").addEventListener("click", async () => {
  await api("/api/stats", { method: "DELETE" });
  await loadAdminState();
});

document.querySelector("#exportData").addEventListener("click", () => {
  const data = {
    ...adminState,
    exportedAt: new Date().toISOString(),
  };
  importBox.value = JSON.stringify(data, null, 2);
  importBox.focus();
});

document.querySelector("#importData").addEventListener("click", async () => {
  const data = JSON.parse(importBox.value);
  await api("/api/import", {
    method: "POST",
    body: JSON.stringify(data),
  });
  await loadAdminState();
});

loadAdminState().catch((error) => {
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<div class="admin-error">Impossible de charger l'admin : ${error.message}<br>Commande : <code>npm start</code><br>URL admin : <code>http://localhost:3000/admin.html</code></div>`
  );
});
