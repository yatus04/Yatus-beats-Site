const channelUrl = "https://www.youtube.com/@Yatus_Beats/";

const storageKeys = {
  beats: "yatus.beats",
  stats: "yatus.stats",
  visits: "yatus.visits",
};

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

const licensePrices = {
  MP3: 15000,
  WAV: 25000,
  Stems: 45000,
  Exclusive: 150000,
};

const contact = {
  whatsappNumber: "221778502444",
  email: "contact.yatusbeats@gmail.com",
};

const beatGrid = document.querySelector("#beatGrid");
const popularGrid = document.querySelector("#popularGrid");
const cartItems = document.querySelector("#cartItems");
const cartTotal = document.querySelector("#cartTotal");
const clearCart = document.querySelector("#clearCart");
const whatsappCheckout = document.querySelector("#whatsappCheckout");
const emailCheckout = document.querySelector("#emailCheckout");
const currentTitle = document.querySelector("#currentTitle");
const currentMeta = document.querySelector("#currentMeta");
const currentCover = document.querySelector("#currentCover");
const audioPlayer = document.querySelector("#audioPlayer");
const filterButtons = document.querySelectorAll("[data-filter]");
const youtubeStatus = document.querySelector("#youtubeStatus");
const otherBeatForm = document.querySelector("#otherBeatForm");
const otherBeatLink = document.querySelector("#otherBeatLink");
const otherBeatLicense = document.querySelector("#otherBeatLicense");
const otherBeatArtist = document.querySelector("#otherBeatArtist");
const otherBeatMessage = document.querySelector("#otherBeatMessage");

let activeFilter = "all";
let recentBeats = [...defaultBeats];
let cart = [];

async function loadBeats() {
  try {
    const response = await fetch("/api/beats", { cache: "no-store" });
    if (!response.ok) throw new Error("API unavailable");
    const data = await response.json();
    return Array.isArray(data.beats) && data.beats.length ? data.beats : defaultBeats;
  } catch (error) {
    return loadLocalBeats();
  }
}

function loadLocalBeats() {
  try {
    const storedBeats = JSON.parse(localStorage.getItem(storageKeys.beats));
    return Array.isArray(storedBeats) && storedBeats.length ? storedBeats : defaultBeats;
  } catch (error) {
    return defaultBeats;
  }
}

function readStats() {
  try {
    return JSON.parse(localStorage.getItem(storageKeys.stats)) || {};
  } catch (error) {
    return {};
  }
}

function writeStats(stats) {
  localStorage.setItem(storageKeys.stats, JSON.stringify(stats));
}

function trackEvent(name, beatId = null) {
  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, beatId }),
  }).catch(() => {});

  const stats = readStats();
  stats[name] = (stats[name] || 0) + 1;

  if (beatId) {
    const key = `${name}:${beatId}`;
    stats[key] = (stats[key] || 0) + 1;
  }

  writeStats(stats);
}

function trackVisit() {
  const sessionId =
    sessionStorage.getItem("yatus.session") ||
    (crypto.randomUUID ? crypto.randomUUID() : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  sessionStorage.setItem("yatus.session", sessionId);

  fetch("/api/visits", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      page: location.pathname || "index.html",
      referrer: document.referrer || "Direct",
      browser: navigator.userAgent,
    }),
  }).catch(() => {});

  const stats = readStats();
  stats.visits = (stats.visits || 0) + 1;
  stats.lastVisitAt = new Date().toISOString();
  writeStats(stats);

  const visits = JSON.parse(localStorage.getItem(storageKeys.visits) || "[]");
  visits.unshift({
    sessionId,
    at: new Date().toISOString(),
    page: location.pathname || "index.html",
    referrer: document.referrer || "Direct",
    browser: navigator.userAgent,
  });

  localStorage.setItem(storageKeys.visits, JSON.stringify(visits.slice(0, 100)));
}

function formatPrice(value) {
  return `${value.toLocaleString("fr-FR")} F CFA`;
}

function getThumbnail(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

function renderAllBeats() {
  youtubeStatus.textContent = "Catalogue gere par le backend. Le bouton Ecouter lance le preview dans le site.";
  renderBeats();
  renderPopularBeats();
}

function renderBeats() {
  const visibleBeats = activeFilter === "all" ? recentBeats : recentBeats.filter((beat) => beat.style === activeFilter);
  beatGrid.innerHTML = visibleBeats.map(renderBeatCard).join("");
}

function renderPopularBeats() {
  const popularBeats = recentBeats.filter((beat) => beat.popular).slice(0, 6);
  popularGrid.innerHTML = popularBeats.map(renderBeatCard).join("");
}

function renderBeatCard(beat) {
  const meta = [beat.bpm ? `${beat.bpm} BPM` : "BPM a confirmer", beat.key, beat.mood].join("</span><span>");

  return `
    <article class="beat-card">
      <div class="beat-cover" style="background-image: linear-gradient(180deg, transparent, rgba(0,0,0,.68)), url('${getThumbnail(beat.id)}')">
        <span>${beat.style}</span>
      </div>
      <div class="beat-body">
        <div>
          <h3>${beat.title}</h3>
          <div class="beat-meta">
            <span>${meta}</span>
          </div>
        </div>
        <div class="price-row">
          <label>
            <span class="sr-only">Licence pour ${beat.title}</span>
            <select data-license="${beat.id}">
              <option value="MP3">MP3 - ${formatPrice(licensePrices.MP3)}</option>
              <option value="WAV">WAV - ${formatPrice(licensePrices.WAV)}</option>
              <option value="Stems">Stems - ${formatPrice(licensePrices.Stems)}</option>
              <option value="Exclusive">Exclusive - ${formatPrice(licensePrices.Exclusive)}</option>
            </select>
          </label>
        </div>
        <div class="beat-actions">
          <button class="button secondary" type="button" data-preview="${beat.id}">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m8 5 11 7-11 7V5Z"/></svg>
            Ecouter
          </button>
          <a class="button secondary" href="${beat.youtube}" target="_blank" rel="noreferrer">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M23 7.1a3 3 0 0 0-2.1-2.1C19 4.5 12 4.5 12 4.5s-7 0-8.9.5A3 3 0 0 0 1 7.1 31.8 31.8 0 0 0 .5 12 31.8 31.8 0 0 0 1 16.9a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31.8 31.8 0 0 0 .5-4.9 31.8 31.8 0 0 0-.5-4.9ZM9.8 15.2V8.8l5.7 3.2-5.7 3.2Z"/></svg>
            YouTube
          </a>
          <button class="button primary" type="button" data-add="${beat.id}">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M6.5 6.5h15l-2 8h-11l-2-8Zm0 0L5.8 4H3m6.2 14.5h.1m8 0h.1"/><circle cx="9.2" cy="18.5" r="1.2"/><circle cx="17.3" cy="18.5" r="1.2"/></svg>
            Ajouter
          </button>
        </div>
      </div>
    </article>
  `;
}

function findBeat(beatId) {
  return recentBeats.find((item) => item.id === beatId);
}

function renderCart() {
  if (!cart.length) {
    cartItems.innerHTML = '<p class="empty">Aucun beat selectionne.</p>';
  } else {
    cartItems.innerHTML = cart
      .map(
        (item) => `
          <div class="cart-line">
            <div>
              <strong>${item.title}</strong>
              <span>${item.license} / ${item.style}</span>
            </div>
            <strong>${formatPrice(item.price)}</strong>
          </div>
        `
      )
      .join("");
  }

  const total = cart.reduce((sum, item) => sum + item.price, 0);
  cartTotal.textContent = formatPrice(total);
  updateCheckoutLinks(total);
}

function updateCheckoutLinks(total) {
  const orderText = cart.length
    ? cart.map((item) => `- ${item.title} (${item.license}) : ${formatPrice(item.price)}`).join("%0A")
    : "Je veux commander une instrumentale Yatus Beats.";

  const message = `Bonjour Yatus Beats,%0A%0AJe veux commander :%0A${orderText}%0A%0ATotal : ${formatPrice(total)}%0A%0AMon nom d'artiste :`;

  whatsappCheckout.href = `https://wa.me/${contact.whatsappNumber}?text=${message}`;
  emailCheckout.href = `mailto:${contact.email}?subject=Commande%20Yatus%20Beats&body=${message}`;
}

function buildOtherBeatMessage() {
  const license = otherBeatLicense.value;
  const price = licensePrices[license];
  const artist = otherBeatArtist.value.trim() || "A preciser";
  const note = otherBeatMessage.value.trim() || "Aucun message supplementaire";

  return [
    "Bonjour Yatus Beats,",
    "",
    "Je veux acheter un beat vu sur ta chaine YouTube :",
    `Lien : ${otherBeatLink.value.trim()}`,
    `Licence : ${license} - ${formatPrice(price)}`,
    `Nom d'artiste : ${artist}`,
    `Message : ${note}`,
  ].join("\n");
}

function previewBeat(beatId) {
  const beat = findBeat(beatId);
  if (!beat) return;

  currentTitle.textContent = beat.title;
  currentMeta.textContent = `${beat.style} / ${beat.bpm ? `${beat.bpm} BPM` : "BPM a confirmer"} / ${beat.key} / ${beat.mood}`;
  currentCover.style.background = `center / cover url('${getThumbnail(beat.id)}')`;
  audioPlayer.src = beat.audio;
  audioPlayer.play().catch(() => {
    audioPlayer.controls = true;
  });
  trackEvent("plays", beatId);
}

function addToCart(beatId, selectedLicense) {
  const beat = findBeat(beatId);
  if (!beat || !selectedLicense) return;

  cart.push({
    id: `${beat.id}-${selectedLicense}-${Date.now()}`,
    title: beat.title,
    style: beat.style,
    license: selectedLicense,
    price: licensePrices[selectedLicense],
  });

  trackEvent("cartAdds", beatId);
  renderCart();
}

document.addEventListener("click", (event) => {
  const previewButton = event.target.closest("[data-preview]");
  const addButton = event.target.closest("[data-add]");

  if (previewButton) {
    previewBeat(previewButton.dataset.preview);
  }

  if (addButton) {
    const select = addButton.closest(".beat-card").querySelector("select");
    addToCart(addButton.dataset.add, select.value);
  }
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.toggle("active", item === button));
    renderBeats();
  });
});

clearCart.addEventListener("click", () => {
  cart = [];
  trackEvent("cartClears");
  renderCart();
});

otherBeatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const submitter = event.submitter;
  const message = buildOtherBeatMessage();

  trackEvent("otherBeatRequests");

  if (submitter?.dataset.orderChannel === "email") {
    window.location.href = `mailto:${contact.email}?subject=Commande%20autre%20beat%20Yatus%20Beats&body=${encodeURIComponent(message)}`;
    return;
  }

  window.open(`https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
});

audioPlayer.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

async function initSite() {
  recentBeats = await loadBeats();
  trackVisit();
  renderAllBeats();
  renderCart();
}

initSite();
