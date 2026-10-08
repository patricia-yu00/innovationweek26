for (let index = localStorage.length - 1; index >= 0; index -= 1) {
  const key = localStorage.key(index);
  if (key?.startsWith("sweetmeatz-")) {
    const renamed = key.replace("sweetmeatz-", "charmz-");
    if (localStorage.getItem(renamed) === null) localStorage.setItem(renamed, localStorage.getItem(key));
    localStorage.removeItem(key);
  }
}

const canvas = document.querySelector("#world");
const ctx = canvas.getContext("2d");
const toast = document.querySelector("#toast");
const agentList = document.querySelector("#agent-list");
const agentDialog = document.querySelector("#agent-dialog");
const dialogAvatar = document.querySelector("#dialog-avatar");
const dialogRole = document.querySelector("#dialog-role");
const dialogName = document.querySelector("#agent-name");
const dialogStatus = document.querySelector("#dialog-status");
const dialogTask = document.querySelector("#dialog-task");
const dialogNote = document.querySelector("#dialog-note");
const joinAgentButton = document.querySelector("#join-agent");
const dashboardAgents = document.querySelector("#dashboard-agents");
const dashboard = document.querySelector("#dashboard");
const village = document.querySelector("#village");
const venueDesigner = document.querySelector("#venue-designer");
const collabBubble = document.querySelector("#collab-bubble");
const collabDialog = document.querySelector("#collab-dialog");
const designerProducts = document.querySelector("#designer-products");
const designerRoomFurniture = document.querySelector("#venue-room-furniture");
const designerRoomStage = document.querySelector("#venue-room-stage");
const designerSelectedCount = document.querySelector("#designer-item-count");
const designerTotal = document.querySelector("#designer-total");
const designerReturnButton = document.querySelector("#designer-back");
const designerFullscreenButton = document.querySelector("#designer-fullscreen");
const villageAudio = new VillageAudio({
  button: document.querySelector("#village-mute"),
  onError: (message) => showToast(message),
});

const world = { width: 1800, height: 1100 };
const venueOptions = {
  "ember-supper-club": { name: "Ember Supper Club", meta: "60 guests · open kitchen · $$", style: "ember", photo: "./assets/photos/venue-ember.jpg" },
  "pages-and-pantry": { name: "Pages & Pantry Books", meta: "45 guests · reading nook · $", style: "bookshop", photo: "./assets/photos/venue-pages.jpg" },
  "rooftop-greenhouse": { name: "Rooftop Greenhouse", meta: "80 guests · string lights · $$$", style: "greenhouse", photo: "./assets/photos/venue-greenhouse.jpg", room: "./assets/photos/room-greenhouse.jpg" },
};
const furnitureCatalog = [
  { id: "floral-arch", name: "Floral arch", detail: "Blush roses · photo backdrop", price: 145, group: "Florals & greenery", width: 26, height: 38 },
  { id: "florals", name: "Low floral centerpiece", detail: "Seasonal · table-safe", price: 32, group: "Florals & greenery", width: 15, height: 18 },
  { id: "pampas-vase", name: "Pampas floor vase", detail: "Dried grasses · ceramic", price: 38, group: "Florals & greenery", width: 13, height: 26 },
  { id: "greenery", name: "Hanging greenery", detail: "Eucalyptus garland · 12 ft", price: 48, group: "Florals & greenery", width: 36, height: 18 },
  { id: "string-lights", name: "String lights", detail: "Warm white · 20 ft", price: 36, group: "Lights & glow", width: 38, height: 14 },
  { id: "paper-lanterns", name: "Paper lanterns", detail: "Set of 5 · warm glow", price: 42, group: "Lights & glow", width: 34, height: 18 },
  { id: "candles", name: "Pillar candle trio", detail: "LED flicker · brass tray", price: 24, group: "Lights & glow", width: 13, height: 13 },
  { id: "neon-sign", name: "Neon sign", detail: "“let's party” · pink", price: 65, group: "Lights & glow", width: 26, height: 12 },
  { id: "floor-lamp", name: "Warm floor lamp", detail: "Ambient light · brass", price: 28, group: "Lights & glow", width: 14, height: 20 },
  { id: "balloon-garland", name: "Balloon garland", detail: "Blush, cream & gold", price: 58, group: "Party touches", width: 34, height: 16 },
  { id: "welcome-sign", name: "Welcome sign", detail: "Easel · hand-lettered", price: 30, group: "Party touches", width: 13, height: 25 },
  { id: "area-rug", name: "Woven area rug", detail: "8 × 10 ft · natural", price: 65, group: "Party touches", width: 35, height: 31 },
  { id: "banquet-table", name: "Banquet table", detail: "Seats 8 · wood", price: 85, group: "Furniture", width: 24, height: 25 },
  { id: "bistro-table", name: "Round bistro table", detail: "Seats 4 · oak", price: 55, group: "Furniture", width: 19, height: 22 },
  { id: "chair-set", name: "Bistro chairs", detail: "Set of 4 · walnut", price: 40, group: "Furniture", width: 18, height: 20 },
  { id: "lounge-sofa", name: "Lounge sofa", detail: "Seats 3 · rust velvet", price: 120, group: "Furniture", width: 25, height: 19 },
];
const svgDecor = new Set(["floral-arch", "pampas-vase", "greenery", "paper-lanterns", "candles", "neon-sign", "balloon-garland", "welcome-sign"]);
const FURNITURE_KEY = "charmz-venue-furniture";
const SPRITE_SIZE = 112;
const SPRITE_ROWS = { down: 0, up: 1, left: 2, right: 2 };
const player = {
  id: "social-butterfly",
  name: "Social butterfly",
  role: "Finds new audiences",
  status: "Fluttering into new feeds",
  task: "“I'm finding new audiences who'd love your cookbook, from home bakers to weeknight-dinner crowds.”",
  note: "I'm mapping which communities are already talking about recipes like yours and where you should show up next.",
  portrait: "./assets/sprites/social-butterfly-portrait.png",
  walkSheet: "./assets/sprites/social-butterfly-walk.png",
  color: "#d9b8ff",
  ink: "#2a1446",
  homeX: world.width / 2,
  homeY: world.height / 2,
  x: world.width / 2,
  y: world.height / 2,
  playerSpeed: 205,
  speed: 34,
  direction: "down",
  frame: 0,
  sprite: null,
  targetX: world.width / 2,
  targetY: world.height / 2,
  pause: 0,
};

const walkers = [
  makeWalker("Matchmaker", 560, 430, {
    role: "Finds your perfect partners",
    status: "Making the right introductions",
    task: "“I'm reaching out to contractors and brands who'd be a perfect match for your cookbook.”",
    note: "I'm shortlisting photographers, caterers, and kitchen brands that fit your vibe, then starting the first conversations.",
    walkSheet: "./assets/sprites/matchmaker-walk.png",
    portrait: "./assets/sprites/matchmaker-portrait.png",
    color: "#ff9ccc",
    ink: "#3d0a24",
  }),
  makeWalker("Trendsetter", 1320, 330, {
    role: "Spots what's next",
    status: "Reading the room (and the algorithm)",
    task: "“I'm spotting the food trends your audience is about to fall for, so your next post lands first.”",
    note: "Matcha everything and tiny dinner parties are rising. I'm pairing them with recipes from your book.",
    walkSheet: "./assets/sprites/trendsetter-walk.png",
    portrait: "./assets/sprites/trendsetter-portrait.png",
    color: "#b8a6ff",
    ink: "#1d1450",
  }),
  makeWalker("Party pillbug", 1180, 760, {
    id: "party-curator",
    role: "Plans unforgettable events",
    status: "Scouting launch-party venues",
    task: "“I'm finding venues where your cookbook launch can bring people together around the table.”",
    note: "I'm comparing supper-club spaces, bookstores, and pop-up kitchens on capacity, vibe, and availability.",
    walkSheet: "./assets/sprites/party-curator-walk.png",
    portrait: "./assets/sprites/party-curator-portrait.png",
    color: "#ffb47a",
    ink: "#3d1a05",
  }),
  makeWalker("Wing worm", 420, 760, {
    role: "Guides big decisions",
    status: "Reviewing your offers",
    task: "“I'm weighing your partnership offers and contractor quotes so you only say yes to the good ones.”",
    note: "I'm comparing rates, timelines, and terms, and flagging anything that doesn't fit your goals.",
    walkSheet: "./assets/sprites/wing-worm-walk.png",
    portrait: "./assets/sprites/wing-worm-portrait.png",
    color: "#d8f08a",
    ink: "#26300a",
  }),
  makeWalker("Hype star", 860, 280, {
    role: "Turns content into buzz",
    status: "Cooking up launch content",
    task: "“I'm turning recipes from your book into reels, carousels, and teasers people can't stop saving.”",
    note: "I'm drafting this week's posting plan and lining up a countdown to your launch event.",
    walkSheet: "./assets/sprites/hype-star-walk.png",
    portrait: "./assets/sprites/hype-star-portrait.png",
    color: "#ffa08a",
    ink: "#3d1008",
  }),
  makeWalker("Vibe jelly", 1500, 620, {
    id: "vibe-checker",
    role: "Keeps you on track",
    status: "Checking your success goals",
    task: "“I'm checking your metrics against your goals and spotting the little wins that move you forward.”",
    note: "Cookbook sales are at 50% of goal and followers are up 12%. I'm watching what's driving it.",
    walkSheet: "./assets/sprites/vibe-checker-walk.png",
    portrait: "./assets/sprites/vibe-checker-portrait.png",
    color: "#a8d8ff",
    ink: "#0a2540",
  }),
];
for (const agent of [player, ...walkers]) {
  if (agent.walkSheet) {
    const sheet = new Image();
    sheet.addEventListener("load", () => {
      agent.sprite = { image: sheet, rows: 4, columns: 4, frameWidth: 128, frameHeight: 128 };
    });
    sheet.src = agent.walkSheet;
    agent.drawWidth = SPRITE_SIZE;
    agent.drawHeight = SPRITE_SIZE;
    continue;
  }
  agent.portrait = agent.cutout;
  const image = new Image();
  image.addEventListener("load", () => {
    agent.cutoutImage = image;
    agent.drawWidth = agent.drawHeight * (image.width / image.height);
  });
  image.src = agent.cutout;
}
const controlledCharacter = null;
const camera = { x: (world.width - 1200) / 2, y: (world.height - 760) / 2, drag: null, moved: false };
const PAN_SPEED = 520;
const VILLAGE_BG_KEY = "charmz-village-background";
const villageThemes = {
  night: { base: "#070607", edge: "#050405", glows: ["rgba(255, 90, 60, 0.11)", "rgba(99, 224, 216, 0.08)", "rgba(123, 107, 255, 0.10)", "rgba(200, 255, 92, 0.06)"], path: "rgba(255, 255, 255, 0.035)", trees: true },
  meadow: { base: "#5f8a4a", edge: "#3f6232", glows: ["rgba(255, 236, 150, 0.22)", "rgba(160, 210, 110, 0.18)", "rgba(80, 130, 60, 0.25)", "rgba(255, 255, 210, 0.15)"], path: "rgba(214, 186, 132, 0.55)", trees: true },
  sunset: { base: "#3a1d2c", edge: "#22111b", glows: ["rgba(255, 130, 70, 0.28)", "rgba(255, 79, 139, 0.18)", "rgba(255, 196, 110, 0.16)", "rgba(140, 70, 160, 0.2)"], path: "rgba(255, 210, 170, 0.12)", trees: true },
  ocean: { base: "#0d2f45", edge: "#08202f", glows: ["rgba(99, 224, 216, 0.2)", "rgba(80, 150, 255, 0.16)", "rgba(180, 255, 240, 0.1)", "rgba(40, 90, 160, 0.25)"], path: "rgba(230, 245, 255, 0.1)", trees: false },
};
let villageBackground = { theme: "night", image: null };
const villageBgImage = new Image();
try {
  const saved = JSON.parse(localStorage.getItem(VILLAGE_BG_KEY) || "null");
  if (saved && (villageThemes[saved.theme] || (saved.theme === "custom" && saved.image))) villageBackground = saved;
} catch {}
if (villageBackground.image) villageBgImage.src = villageBackground.image;
let selectedAgent = null;
const keys = new Set();

let lastTime = 0;
let selectedVenueId = null;
let designerReturnAgent = null;
let venueFurniture = {};
try {
  const savedFurniture = JSON.parse(localStorage.getItem(FURNITURE_KEY) || "{}");
  if (savedFurniture && typeof savedFurniture === "object" && !Array.isArray(savedFurniture)) venueFurniture = savedFurniture;
} catch { /* Keep the designer usable when saved layouts are unavailable. */ }
let toastTimer;
let viewportWidth = 0;
let viewportHeight = 0;
let villageElapsed = 0;
let collaboration = null;
let nextCollaborationAt = 9;


function makeWalker(name, x, y, details) {
  return {
    ...details,
    id: details.id || name.toLowerCase().replace(/\s+/g, "-"),
    name,
    homeX: x,
    homeY: y,
    x,
    y,
    speed: 26 + Math.random() * 12,
    playerSpeed: 205,
    direction: "down",
    frame: Math.random() * 4,
    targetX: x,
    targetY: y,
    pause: Math.random() * 2,
    sprite: null,
  };
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  viewportWidth = rect.width;
  viewportHeight = rect.height;
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2300);
}

function allAgents() {
  return [player, ...walkers];
}

function furnitureIllustration(id) {
  return `<img src="./assets/photos/furniture/${id}.${svgDecor.has(id) ? "svg" : "png"}" alt="" draggable="false" loading="lazy">`;
}

function saveVenueFurniture() {
  try {
    localStorage.setItem(FURNITURE_KEY, JSON.stringify(venueFurniture));
  } catch {
    showToast("This layout could not be saved in this browser.");
  }
}

function renderDesignerProducts() {
  if (!selectedVenueId) return;
  const selected = venueFurniture[selectedVenueId] || [];
  designerSelectedCount.textContent = `${selected.length} selected`;
  designerTotal.textContent = `$${selected.reduce((total, placed) => {
    const product = furnitureCatalog.find(({ id }) => id === placed.id);
    return total + (product?.price || 0);
  }, 0)}`;
  const groups = [...new Set(furnitureCatalog.map(({ group }) => group))];
  designerProducts.innerHTML = groups.map((group) => `
    <section class="designer-product-group" aria-label="${group}">
      <h3>${group}</h3>
      ${furnitureCatalog.filter((product) => product.group === group).map((product) => {
        const isSelected = selected.some(({ id }) => id === product.id);
        return `<button class="designer-product${isSelected ? " is-selected" : ""}" type="button" data-furniture-id="${product.id}" aria-pressed="${isSelected}">
          <span class="designer-product-art art-${product.id}">${furnitureIllustration(product.id)}</span>
          <span class="designer-product-copy"><strong>${product.name}</strong><small>${product.detail}</small><b>$${product.price} rental</b></span>
          <span class="designer-product-check" aria-hidden="true">${isSelected ? "✓" : "+"}</span>
        </button>`;
      }).join("")}
    </section>`).join("");
}

function renderVenueFurniture() {
  if (!selectedVenueId) return;
  const selected = venueFurniture[selectedVenueId] || [];
  const positions = {
    "banquet-table": [50, 57],
    "bistro-table": [30, 42],
    "chair-set": [70, 57],
    "lounge-sofa": [25, 72],
    "area-rug": [50, 66],
    florals: [50, 45],
    "floor-lamp": [83, 39],
    "string-lights": [50, 22],
    "floral-arch": [50, 40],
    "pampas-vase": [12, 55],
    greenery: [30, 18],
    "paper-lanterns": [70, 20],
    candles: [60, 50],
    "neon-sign": [50, 12],
    "balloon-garland": [22, 30],
    "welcome-sign": [88, 62],
  };
  designerRoomFurniture.innerHTML = selected.map((placed) => {
    const product = furnitureCatalog.find(({ id }) => id === placed.id);
    if (!product) return "";
    const [x, y] = positions[placed.id] || [50, 50];
    return `<div class="room-furniture-item art-${placed.id}" data-placed-id="${placed.id}" style="left:${placed.x ?? x}%;top:${placed.y ?? y}%;--item-width:${product.width}%;--item-height:${product.height}%" tabindex="0" role="group" aria-label="${product.name}; drag to move, or remove with the button">
      ${furnitureIllustration(placed.id)}
      <button class="room-furniture-remove" type="button" data-remove-furniture="${placed.id}" aria-label="Remove ${product.name}">×</button>
      <span class="room-furniture-name">${product.name}</span>
    </div>`;
  }).join("");
  document.querySelector("#venue-room-empty").hidden = selected.length > 0;
  renderDesignerProducts();
}

function openVenueDesigner(venueId) {
  const venue = venueOptions[venueId];
  if (!venue) return;
  selectedVenueId = venueId;
  designerReturnAgent = selectedAgent;
  document.querySelector("#venue-designer-title").textContent = venue.name;
  document.querySelector("#designer-venue-name").textContent = venue.name;
  document.querySelector("#designer-venue-meta").textContent = venue.meta;
  document.querySelector("#venue-room-label").textContent = venue.name;
  designerRoomStage.dataset.venueStyle = venue.style;
  designerRoomStage.querySelector(".venue-room-backdrop").src = venue.room || "./assets/photos/venue-room.jpg";
  if (!Array.isArray(venueFurniture[venueId])) venueFurniture[venueId] = [];
  renderVenueFurniture();
  agentDialog.close();
  showView("venue-designer");
}

function removeFurniture(placedId) {
  const selected = venueFurniture[selectedVenueId] || [];
  venueFurniture[selectedVenueId] = selected.filter(({ id }) => id !== placedId);
  saveVenueFurniture();
  renderVenueFurniture();
}

function updateFullscreenButton() {
  const isFullscreen = document.fullscreenElement === venueDesigner || venueDesigner.classList.contains("is-fullscreen");
  designerFullscreenButton.setAttribute("aria-pressed", String(isFullscreen));
  designerFullscreenButton.querySelector("span").textContent = isFullscreen ? "Exit full screen" : "Full screen";
}

function agentStatus(agent) {
  const loadout = agentLoadouts[agent.id];
  if (!loadout) return { text: agent.role, progress: 0 };
  const active = loadout.quests.find(([, state]) => state === "active") || loadout.quests[0];
  return { text: active[0], progress: loadout.progress };
}

function agentAlert(agent) {
  if (agent.awaitingDecision) {
    const decision = decisions.find((candidate) => candidate.agentId === agent.id);
    return { type: "needs", decision, icon: "❗", label: "Needs your call", text: decision ? decision.topic : "Waiting on you", action: "Decide" };
  }
  const item = deliverables.find((candidate) => candidate.agentId === agent.id);
  if (item) return { type: "ready", item, icon: "📦", label: "Deliverable ready", text: item.title, action: "Review" };
  return null;
}

function handleAgentAlert(agent) {
  const alert = agentAlert(agent);
  if (alert?.type === "needs" && alert.decision) openDecision(alert.decision.id);
  else if (alert?.type === "ready") pickUpDeliverable(alert.item.id);
  else openAgentDetails(agent);
}

function renderAgents() {
  agentList.innerHTML = allAgents().map((agent) => {
    const status = agentStatus(agent);
    const alert = agentAlert(agent);
    const isYou = agent === controlledCharacter;
    const statusText = alert ? `${alert.label}: ${alert.text}` : status.text;
    const progress = alert?.type === "ready" ? 100 : status.progress;
    return `
    <button class="agent-card${isYou ? " is-controlled" : ""}${alert ? ` has-alert is-${alert.type}` : ""}" type="button" data-agent-id="${agent.id}" style="--agent-color:${agent.color}" aria-label="${agent.name}: ${escapeText(statusText)}, ${progress}% done" aria-pressed="${isYou}" title="${escapeText(statusText)}">
      <span class="agent-avatar" style="--avatar-background:${agent.color};--avatar-ink:${agent.ink}" aria-hidden="true"><img src="${agent.portrait}" alt="" /></span>
      <span class="agent-card-copy">
        <span class="agent-name-line">${agent.name}${isYou ? '<span class="agent-you">You</span>' : alert ? "" : '<span class="agent-card-dot" aria-hidden="true"></span>'}</span>
        <span class="agent-role">${alert ? `<b>${alert.label}</b> · ` : ""}${escapeText(alert ? alert.text : status.text)}</span>
        <span class="agent-meter" aria-hidden="true"><i style="width:${progress}%"></i></span>
      </span>
      ${alert ? `<span class="agent-card-alert" aria-hidden="true">${alert.icon}</span>` : ""}
    </button>`;
  }).join("");
  renderAgentNotifications();
}

const notifyButton = document.querySelector("#notify-button");
const notifyPanel = document.querySelector("#notify-panel");

function renderAgentNotifications() {
  if (!notifyButton || !notifyPanel) return;
  const rows = allAgents().map((agent) => ({ agent, alert: agentAlert(agent), status: agentStatus(agent) }));
  const order = { needs: 0, ready: 1 };
  rows.sort((a, b) => (order[a.alert?.type] ?? 2) - (order[b.alert?.type] ?? 2));
  const needs = rows.filter((row) => row.alert?.type === "needs").length;
  const ready = rows.filter((row) => row.alert?.type === "ready").length;
  const count = needs + ready;
  notifyButton.querySelector(".notify-count").textContent = count;
  notifyButton.classList.toggle("has-alerts", count > 0);
  notifyButton.classList.toggle("has-needs", needs > 0);
  notifyButton.setAttribute("aria-label", count ? `Agent progress: ${needs} need you, ${ready} deliverables ready` : "Agent progress: all agents working");
  notifyPanel.querySelector(".notify-summary").innerHTML = count
    ? `${needs ? `<span class="notify-pill is-needs">❗ ${needs} need${needs === 1 ? "s" : ""} you</span>` : ""}${ready ? `<span class="notify-pill is-ready">📦 ${ready} ready to review</span>` : ""}`
    : `<span class="notify-pill">All charmz are working — nothing to review yet</span>`;
  notifyPanel.querySelector(".notify-list").innerHTML = rows.map(({ agent, alert, status }) => {
    const progress = alert?.type === "ready" ? 100 : status.progress;
    return `<li class="notify-row${alert ? ` is-${alert.type}` : ""}" style="--agent-color:${agent.color}">
      <span class="agent-avatar" style="--avatar-background:${agent.color};--avatar-ink:${agent.ink}" aria-hidden="true"><img src="${agent.portrait}" alt="" /></span>
      <span class="notify-copy">
        <span class="notify-name"><strong>${escapeText(agent.name)}</strong><small>${alert ? `${alert.icon} ${alert.label}` : `Working · ${progress}%`}</small></span>
        <span class="notify-text">${escapeText(alert ? alert.text : status.text)}</span>
        <span class="agent-meter" aria-hidden="true"><i style="width:${progress}%"></i></span>
      </span>
      <button class="notify-action" type="button" data-notify-agent="${agent.id}">${alert ? alert.action : "View"}</button>
    </li>`;
  }).join("");
}

function setNotifyOpen(open) {
  if (!notifyPanel) return;
  notifyPanel.hidden = !open;
  notifyButton.setAttribute("aria-expanded", String(open));
}

notifyButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  setNotifyOpen(notifyPanel.hidden);
});
notifyPanel?.addEventListener("click", (event) => {
  event.stopPropagation();
  const button = event.target.closest("[data-notify-agent]");
  if (!button) return;
  const agent = allAgents().find((candidate) => candidate.id === button.dataset.notifyAgent);
  setNotifyOpen(false);
  if (agent) handleAgentAlert(agent);
});
document.addEventListener("click", () => { if (notifyPanel && !notifyPanel.hidden) setNotifyOpen(false); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && notifyPanel && !notifyPanel.hidden) setNotifyOpen(false); });

function renderDashboardAgents() {
  dashboardAgents.innerHTML = allAgents().map((agent) => `
    <button class="charmz-row" type="button" data-agent-id="${agent.id}" aria-label="Learn more about ${agent.name}, ${agent.role}">
      <span class="agent-avatar" style="--avatar-background:${agent.color};--avatar-ink:${agent.ink}" aria-hidden="true"><img src="${agent.portrait}" alt="" /></span>
      <span class="charmz-copy">
        <span class="charmz-title"><strong>${agent.name}</strong><span class="charmz-role">${agent.role}</span></span>
        <span class="charmz-task">${escapeText(agentTasks[agent.id] || agent.task.replace(/[“”]/g, ""))}</span>
      </span>
      <span class="charmz-badge${agent.awaitingDecision ? " is-needs-you" : hasPendingDeliverable(agent.id) ? " is-ready" : ""}">${agent.awaitingDecision ? "❗ Needs you" : hasPendingDeliverable(agent.id) ? "📦 Ready" : "Working"}</span>
    </button>
  `).join("");
  renderAgents();
  if (selectedAgent && agentDialog.open) renderAgentAlertBanner(selectedAgent);
}

function renderAgentAlertBanner(agent) {
  wsBody.querySelector(".agent-alert-banner")?.remove();
  wsBody.querySelector(".deliverable-next")?.remove();
  const alert = agentAlert(agent);
  dialogStatus.textContent = alert ? `${alert.icon} ${alert.label}` : agent.status;
  agentDialog.classList.toggle("has-alert", Boolean(alert));
  if (!alert) return;
  const pickedUp = wsBody.querySelector(".deliverable-banner");
  if (pickedUp) {
    (pickedUp.querySelector(".deliverable-review-head") || pickedUp).insertAdjacentHTML("beforeend", `<button class="deliverable-next" type="button" data-alert-action="${agent.id}">${alert.type === "ready" ? "Next up" : "Then decide"}: ${escapeText(alert.text)} →</button>`);
    return;
  }
  wsBody.insertAdjacentHTML("afterbegin", `<div class="agent-alert-banner is-${alert.type}" style="--agent-color:${agent.color}">
    <span class="deliverable-banner-icon" aria-hidden="true">${alert.icon}</span>
    <span><small>${alert.type === "ready" ? "Deliverable ready · waiting in the village" : "Paused · needs your decision"}</small><strong>${escapeText(alert.text)}</strong></span>
    <button class="primary-button" type="button" data-alert-action="${agent.id}">${alert.type === "ready" ? "Review deliverable" : "Decide now"}</button>
  </div>`);
}

document.querySelector("#ws-body").addEventListener("click", (event) => {
  const button = event.target.closest("[data-alert-action]");
  if (!button) return;
  const agent = allAgents().find((candidate) => candidate.id === button.dataset.alertAction);
  if (!agent) return;
  const alert = agentAlert(agent);
  if (alert?.type === "needs") agentDialog.close();
  handleAgentAlert(agent);
});

const AGENT_TASKS_KEY = "charmz-agent-tasks";
let agentTasks = {};
try { agentTasks = JSON.parse(localStorage.getItem(AGENT_TASKS_KEY)) || {}; } catch { agentTasks = {}; }

const GOALS_KEY = "charmz-business-goals";
const initialGoals = [
  { title: "Grow revenue", target: "$20,000 monthly revenue", progress: 50 },
  { title: "Reach more customers", target: "10,000 customers", progress: 83 },
  { title: "Build partnerships", target: "2 new partnerships", progress: 50 },
];
let businessGoals = [];
try {
  const savedGoals = JSON.parse(localStorage.getItem(GOALS_KEY));
  businessGoals = Array.isArray(savedGoals) ? savedGoals : initialGoals.map((goal) => ({ ...goal }));
} catch {
  businessGoals = initialGoals.map((goal) => ({ ...goal }));
}

function saveBusinessGoals() {
  localStorage.setItem(GOALS_KEY, JSON.stringify(businessGoals));
  renderBusinessGoals();
}

function renderBusinessGoals() {
  const homeGoals = document.querySelector("#home-goal-list");
  const editor = document.querySelector("#goal-editor-list");
  homeGoals.innerHTML = businessGoals.slice(0, 4).map((goal) => `
    <li><span>${escapeText(goal.title)}</span><b>${goal.progress}%</b><i style="--value:${goal.progress}%"></i></li>
  `).join("") || "<li class=\"empty-state\">Add a goal to start tracking progress.</li>";
  editor.innerHTML = businessGoals.map((goal, index) => `
    <article class="panel goal-editor" data-goal-index="${index}">
      <label><span>Goal</span><input class="goal-title-input" type="text" value="${escapeText(goal.title)}" aria-label="Goal name" /></label>
      <label><span>Target</span><input class="goal-target-input" type="text" value="${escapeText(goal.target)}" aria-label="Goal target" /></label>
      <label class="goal-progress-input"><span>Progress</span><input type="number" min="0" max="100" value="${goal.progress}" aria-label="Goal progress percentage" /><b>%</b></label>
      <button class="ghost-button remove-goal" type="button" aria-label="Remove goal">Remove</button>
      <i class="goal-editor-meter" style="--value:${goal.progress}%"></i>
    </article>
  `).join("") || "<p class=\"empty-state\">No goals yet. Add one to start tracking progress.</p>";
}

function renderAgentWorkList() {
  document.querySelector("#agent-work-list").innerHTML = allAgents().map((agent) => {
    const status = agentStatus(agent);
    return `<article class="panel agent-work-card">
      <button class="agent-work-overview" type="button" data-agent-id="${agent.id}">
        <span class="agent-avatar" style="--avatar-background:${agent.color};--avatar-ink:${agent.ink}" aria-hidden="true"><img src="${agent.portrait}" alt="" /></span>
        <span class="charmz-copy"><span class="charmz-title"><strong>${escapeText(agent.name)}</strong><span class="charmz-role">${escapeText(agent.role)}</span></span><span class="charmz-task">${escapeText(agentTasks[agent.id] || status.text)}</span></span>
        <span class="charmz-badge">${status.progress}%</span>
      </button>
      <form class="agent-task-form" data-agent-task="${agent.id}">
        <label class="visually-hidden" for="task-${agent.id}">New task for ${escapeText(agent.name)}</label>
        <input id="task-${agent.id}" name="task" type="text" maxlength="180" placeholder="Give ${escapeText(agent.name)} a task…" />
        <button class="primary-button" type="submit">Assign task</button>
      </form>
    </article>`;
  }).join("");
}

function showDashboardTab(tab) {
  const validTabs = new Set(["home", "agents", "goals", "collaborators", "content", "metrics"]);
  if (!validTabs.has(tab)) return;
  document.querySelectorAll("[data-tab-panel]").forEach((panel) => {
    const active = panel.dataset.tabPanel === tab;
    panel.hidden = !active;
    panel.classList.toggle("is-active", active);
  });
  document.querySelectorAll("[data-dashboard-tab]").forEach((link) => {
    const active = link.dataset.dashboardTab === tab;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  if (document.body.dataset.view === "dashboard") history.replaceState(null, "", `#${tab}`);
}

function showView(view) {
  const isVillage = view === "village";
  const isTitle = view === "title";
  const isVenueDesigner = view === "venue-designer";
  titleScreen.hidden = !isTitle;
  quitScreen.hidden = view !== "quit";
  aboutScreen.hidden = view !== "about";
  projectsScreen.hidden = view !== "projects";
  if (view === "about") renderAboutCast();
  dashboard.hidden = view !== "dashboard";
  onboarding.hidden = view !== "onboarding";
  village.hidden = !isVillage;
  villageAudio.setActive(isVillage);
  venueDesigner.hidden = !isVenueDesigner;
  if (isTitle) startTitle();
  else stopTitle();
  document.body.dataset.view = view;
  keys.clear();
  if (agentDialog.open) agentDialog.close();
  window.scrollTo(0, 0);
  if (isVillage) {
    resizeCanvas();
    canvas.focus?.();
  }
}


const titleScreen = document.querySelector("#title-screen");
const titleStage = document.querySelector("#title-stage");
const titlePlanet = document.querySelector("#title-planet");
const quitScreen = document.querySelector("#quit-screen");
const onboarding = document.querySelector("#onboarding");
const aboutScreen = document.querySelector("#about-screen");
const projectsScreen = document.querySelector("#projects-screen");

function renderAboutCast() {
  const cast = document.querySelector("#about-cast");
  if (cast.childElementCount) return;
  cast.innerHTML = allAgents().map((agent, i) => `
    <figure style="--agent-color:${agent.color || "#ff6f9c"};--i:${i}">
      <img src="${agent.portrait}" alt="" />
      <figcaption>${escapeText(agent.name)}</figcaption>
    </figure>`).join("");
}
const menuButtons = [...document.querySelectorAll("#title-menu .menu-button")];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let titleFloaters = [];
let titleFrame = 0;
let menuIndex = 0;

function buildTitleFloaters() {
  const agents = allAgents();
  titleFloaters = agents.map((agent, index) => {
    const img = document.createElement("img");
    img.className = "title-charmz";
    img.src = agent.portrait;
    img.alt = "";
    const ratio = agent.drawWidth && agent.drawHeight ? agent.drawWidth / agent.drawHeight : 0.8;
    img.style.setProperty("--w", `${Math.round(78 * Math.min(1.2, Math.max(0.7, ratio)))}px`);
    img.style.setProperty("--glow", agent.color || "rgba(255,140,120,.35)");
    titleStage.append(img);
    return {
      img,
      phase: (index / agents.length) * Math.PI * 2,
      speed: 0.11 + (index % 3) * 0.035,
      radius: 0.62 + (index % 2) * 0.16,
      tilt: -0.28 + (index % 4) * 0.08,
      bob: 6 + (index % 3) * 4,
      spin: index % 2 ? 1 : -1,
    };
  });
}

function animateTitle(time = 0) {
  const t = reduceMotion ? 0 : time / 1000;
  const rect = document.querySelector("#title-planet").getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const span = rect.width * 0.5;
  for (const f of titleFloaters) {
    const a = f.phase + t * f.speed * Math.PI * 2 * 0.25;
    const depth = Math.sin(a);
    const ox = Math.cos(a) * span * f.radius * 1.35;
    const oy = depth * span * f.radius * 0.38 + Math.cos(a) * span * f.tilt;
    const bob = Math.sin(t * 1.6 + f.phase * 3) * f.bob;
    const scale = 0.78 + (depth + 1) * 0.2;
    const rot = Math.sin(t * 0.9 + f.phase) * 8 * f.spin;
    const w = f.img.offsetWidth;
    const h = f.img.offsetHeight;
    f.img.style.transform = `translate(${cx + ox - w / 2}px, ${cy + oy + bob - h / 2}px) scale(${scale}) rotate(${rot}deg)`;
    f.img.style.zIndex = depth > 0 ? 10 : 2;
    f.img.style.opacity = depth > 0 ? 1 : 0.55 + (depth + 1) * 0.4;
  }
  if (!reduceMotion) titleFrame = requestAnimationFrame(animateTitle);
}

function startTitle() {
  if (!titleFloaters.length) buildTitleFloaters();
  titleScreen.classList.remove("is-leaving");
  window.PixelPlanet?.start(document.querySelector("#title-planet"));
  cancelAnimationFrame(titleFrame);
  titleFrame = requestAnimationFrame(animateTitle);
  selectMenu(0, false);
}

function stopTitle() {
  cancelAnimationFrame(titleFrame);
  window.PixelPlanet?.stop(document.querySelector("#title-planet"));
}

function selectMenu(index, focus = true) {
  menuIndex = (index + menuButtons.length) % menuButtons.length;
  menuButtons.forEach((button, i) => button.classList.toggle("is-selected", i === menuIndex));
  if (focus) menuButtons[menuIndex].focus();
}

function createVillage() {
  if (!aboutScreen.hidden) { startOnboarding(); return; }
  titleScreen.classList.add("is-leaving");
  setTimeout(() => startOnboarding(), 420);
}

menuButtons.forEach((button, i) => {
  button.addEventListener("mouseenter", () => selectMenu(i, false));
  button.addEventListener("focus", () => selectMenu(i, false));
});
document.querySelector("#menu-create").addEventListener("click", createVillage);
document.querySelector("#menu-learn").addEventListener("click", () => showView("about"));
document.querySelector("#menu-load").addEventListener("click", () => openProjects("title"));
const SHOP_URL = "https://charmz.entapp.adproto.com";
document.querySelector("#menu-shop").addEventListener("click", () => {
  const tab = window.open(SHOP_URL, "_blank");
  if (tab) tab.opener = null;
  else window.location.href = SHOP_URL;
});
document.querySelector("#menu-quit").addEventListener("click", () => showView("quit"));
document.querySelector("#quit-back").addEventListener("click", () => showView("title"));
document.querySelector("#about-back").addEventListener("click", () => showView("title"));
document.querySelector("#learn-start").addEventListener("click", createVillage);
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !aboutScreen.hidden) showView("title");
});
document.querySelectorAll(".logo").forEach((logo) => logo.addEventListener("click", (event) => {
  event.preventDefault();
  showView("title");
}));
window.addEventListener("keydown", (event) => {
  if (titleScreen.hidden) return;
  if (event.key === "ArrowDown" || event.key === "s") { event.preventDefault(); selectMenu(menuIndex + 1); }
  else if (event.key === "ArrowUp" || event.key === "w") { event.preventDefault(); selectMenu(menuIndex - 1); }
  else if (event.key === "Enter" && document.activeElement?.tagName !== "BUTTON") { event.preventDefault(); menuButtons[menuIndex].click(); }
});

const warp = document.querySelector("#warp");
const warpMessage = document.querySelector("#warp-message");
const warpBar = document.querySelector("#warp-bar");
const warpMessages = [
  "Curating your agents…",
  "Waking up the charmz…",
  "Packing Brie's cookbook goals…",
  "Lighting up the village paths…",
  "Landing in the village…",
];
let warpTimer = 0;
let warpCastFrame = 0;
const warpCast = document.querySelector("#warp-cast");

function startWarpCast() {
  const agents = allAgents();
  warpCast.innerHTML = agents.map((agent, i) => `
    <figure class="warp-chef" style="--agent-color:${agent.color || "#ff6f9c"};--i:${i}">
      <img class="warp-chef-body" src="${agent.portrait}" alt="" />
      <img class="warp-chef-hat" src="${chefHatSrc}" alt="" />
    </figure>`).join("");
  const chefs = [...warpCast.children];
  const planet = document.querySelector("#warp-planet");
  const startedAt = performance.now();
  const tick = (now) => {
    const t = reduceMotion ? 0 : (now - startedAt) / 1000;
    const rect = planet.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const span = rect.width * 0.5;
    chefs.forEach((chef, i) => {
      const a = (i / chefs.length) * Math.PI * 2 + t * 0.45;
      const depth = Math.sin(a);
      const x = cx + Math.cos(a) * span * 0.95;
      const y = cy + depth * span * 0.32 + Math.sin(t * 2 + i) * 6;
      const scale = 0.75 + (depth + 1) * 0.18;
      chef.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${scale})`;
      chef.style.zIndex = depth > 0 ? 3 : 1;
      chef.style.opacity = depth > 0 ? 1 : 0.6;
    });
    if (!reduceMotion) warpCastFrame = requestAnimationFrame(tick);
  };
  warpCastFrame = requestAnimationFrame(tick);
}

function stopWarpCast() {
  cancelAnimationFrame(warpCastFrame);
  warpCast.innerHTML = "";
}

function dressAgentsAsChefs() {
  for (const agent of allAgents()) costumeChoices[agent.id] = "chef";
  localStorage.setItem(COSTUME_KEY, JSON.stringify(costumeChoices));
}

function travelToVillage(onArrive) {
  runWarp({ messages: warpMessages, view: "village", onArrive, label: "Traveling to the village" });
}

function runWarp({ messages, view, onArrive, label, duration = 3600, cast = false }) {
  if (!warp.hidden) return;
  if (agentDialog.open) agentDialog.close();
  warp.setAttribute("aria-label", label);
  warp.hidden = false;
  warp.classList.remove("is-leaving");
  window.PixelPlanet?.start(document.querySelector("#warp-planet"));
  if (cast) startWarpCast();
  const startedAt = performance.now();
  let lastIndex = -1;
  clearInterval(warpTimer);
  warpTimer = setInterval(() => {
    const progress = Math.min(1, (performance.now() - startedAt) / duration);
    warpBar.style.width = `${Math.round(progress * 100)}%`;
    const index = Math.min(messages.length - 1, Math.floor(progress * messages.length));
    if (index !== lastIndex) {
      lastIndex = index;
      warpMessage.textContent = messages[index];
      warpMessage.style.animation = "none";
      void warpMessage.offsetWidth;
      warpMessage.style.animation = "";
    }
    if (progress < 1) return;
    clearInterval(warpTimer);
    showView(view);
    onArrive?.();
    warp.classList.add("is-leaving");
    setTimeout(() => {
      warp.hidden = true;
      warp.classList.remove("is-leaving");
      warpBar.style.width = "0";
      window.PixelPlanet?.stop(document.querySelector("#warp-planet"));
      stopWarpCast();
    }, 500);
  }, 100);
}

// Per-agent function sheet: category, about, current quest, quest log, and skills (name, what it does, level, state).
const agentLoadouts = {
  matchmaker: {
    category: "Partnership & collaboration",
    about: "Finds creators, restaurants, chefs, brands, and other collaborators that fit Brie's vibe, goals, and audience, and helps identify the best opportunities to pursue.",
    task: "“I'm scouting chefs and kitchen brands whose audience overlaps with yours, then checking which ones are a true fit.”",
    progress: 48,
    quests: [["Scouted 12 potential collaborators", "done"], ["Checking brand & audience fit", "active"], ["Brainstorm 3 collab ideas", "next"], ["Lock in a first partner", "locked"]],
    skills: [["Collab scout", "Finds potential collaborators and partners", 88, "done"], ["Compatibility check", "Evaluates brand/audience fit", 80, "active"], ["Collab brainstorm", "Suggests ways to work together", 72, "next"]],
  },
  trendsetter: {
    category: "Trends & culture",
    about: "Spots emerging food, culture, content, and social trends early, then helps Brie understand which ones are actually worth jumping on.",
    task: "“Tiny dinner parties are rising fast. I'm checking whether it fits your brand before we jump in.”",
    progress: 72,
    quests: [["Scouted 6 emerging trends", "done"], ["Checking which trends fit you", "active"], ["Remix a trend with your recipes", "next"], ["Be first on the next wave", "locked"]],
    skills: [["Trend scout", "Finds relevant emerging trends", 94, "done"], ["Trend fit", "Identifies what fits the brand and audience", 82, "active"], ["Trend remix", "Finds an original spin", 70, "next"]],
  },
  "party-curator": {
    category: "IRL experiences",
    about: "Dreams up memorable events and activations, then brings them to life by finding the right venues, restaurants, vendors, partners, and experiences.",
    task: "“I'm comparing supper-club spaces and bookstores for your cookbook launch party.”",
    progress: 35,
    quests: [["Pitched 4 launch-event concepts", "done"], ["Scouting venues & spaces", "active"], ["Coordinate vendors & partners", "next"], ["Throw the launch party", "locked"]],
    skills: [["Event ideation", "Develops IRL concepts", 92, "done"], ["Location scout", "Finds venues and spaces", 78, "active"], ["Event planner", "Coordinates the pieces needed to bring it together", 66, "next"]],
  },
  "social-butterfly": {
    category: "Audience growth",
    about: "Finds new audiences and communities that could connect with Brie, and identifies where her content and brand could resonate beyond her current following.",
    task: "“I'm finding home-baker and weeknight-dinner communities who'd love your cookbook.”",
    progress: 64,
    quests: [["Found 3 promising new audiences", "done"], ["Mapping where they gather", "active"], ["Find authentic ways to reach them", "next"], ["Grow beyond your current following", "locked"]],
    skills: [["Audience scout", "Finds promising new audiences", 90, "done"], ["Community finder", "Identifies where they gather", 84, "active"], ["Expansion opportunities", "Finds authentic ways to reach them", 68, "next"]],
  },
  "wing-worm": {
    category: "Business guidance",
    about: "Guides Brie through unfamiliar business opportunities like publishing, helping her understand the process, evaluate offers, spot red flags, and feel confident she's getting a fair deal.",
    task: "“I'm reviewing a brand deal for you: weighing the tradeoffs and flagging anything that looks off.”",
    progress: 56,
    quests: [["Explained how the deal process works", "done"], ["Evaluating 4 offers & tradeoffs", "active"], ["Flag unfavorable terms", "next"], ["Prep your questions before deciding", "locked"]],
    skills: [["Industry guide", "Explains unfamiliar processes", 86, "done"], ["Offer check", "Evaluates opportunities and tradeoffs", 80, "active"], ["Red-flag check", "Flags potentially unfavorable terms", 74, "next"], ["Prep & questions", "Identifies what to ask before making a decision", 64, "next"]],
  },
  "hype-star": {
    category: "Amplification",
    about: "Makes sure big moments don't end when everyone goes home. Spots content moments, UGC, follow-up stories, and opportunities to turn IRL buzz into sustained digital growth.",
    task: "“I'm collecting fan posts from your launch and planning follow-up content to keep the buzz going.”",
    progress: 81,
    quests: [["Captured 12 launch moments", "done"], ["Finding audience-created content", "active"], ["Plan follow-up stories", "next"], ["Measure what drove growth", "locked"]],
    skills: [["Content catcher", "Moments worth capturing", 94, "done"], ["UGC scout", "Finds audience-created content", 82, "active"], ["Momentum planner", "Turns moments into follow-up content", 72, "next"], ["Impact check", "Measures what actually drove growth", 60, "next"]],
  },
  "vibe-checker": {
    category: "Brand consistency",
    about: "Keeps everything true to brand during growth, making sure new content, partnerships, opportunities, and experiences still look, sound, and feel like Brie.",
    task: "“I'm reviewing this week's ideas and posts to make sure they still look, sound, and feel like you.”",
    progress: 50,
    quests: [["Reviewed 8 ideas for fit", "done"], ["Checking voice on new captions", "active"], ["Audit the launch visuals", "next"], ["Update your brand memory", "locked"]],
    skills: [["Brand check", "Reviews ideas for fit", 92, "done"], ["Voice check", "Maintains a consistent voice", 84, "active"], ["Visual check", "Maintains a recognizable aesthetic", 76, "next"], ["Brand memory", "Keeps track of evolving style, preferences, and boundaries", 70, "next"]],
  },
};

const invSlots = document.querySelector("#inv-slots");
const invQuests = document.querySelector("#inv-quests");
const invSkills = document.querySelector("#inv-skills");
const invProgressBar = document.querySelector("#inv-progress-bar");
const invProgressLabel = document.querySelector("#inv-progress-label");
const invCount = document.querySelector("#inv-count");
const questTitle = document.querySelector("#quest-title");
const sourceList = document.querySelector("#source-list");
const costumeGrid = document.querySelector("#costume-grid");
const wsEyebrow = document.querySelector("#ws-eyebrow");
const wsTitle = document.querySelector("#ws-title");
const wsSub = document.querySelector("#ws-sub");
const wsBody = document.querySelector("#ws-body");

// Per-agent workspace: quest headline, the artifact they're working on, and the memory/source files they draw from.
const sparkline = (points, color) => {
  const max = Math.max(...points), min = Math.min(...points);
  const d = points.map((p, i) => `${(i / (points.length - 1)) * 100},${28 - ((p - min) / (max - min || 1)) * 24}`).join(" ");
  return `<svg class="spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true"><polyline points="${d}" style="stroke:${color}" /></svg>`;
};
const agentWorkspaces = {
  "vibe-checker": {
    quest: "Reviewing invitation branding",
    title: "Launch party invitation mockups",
    sub: "3 drafts checked against Brie's brand memory",
    sources: [["brand-voice.md", "doc"], ["visual-style-guide.md", "doc"], ["cookbook-cover-final.png", "image"], ["past-invites/", "folder", "8 files"]],
    body: () => `<div class="ws-invites">
      ${[
        ["is-warm", "Supper at Brie's", "An evening of small plates & big stories", "Sat · Nov 14 · 7pm", "On brand", 94, "good", "Warm palette and handwritten type feel just like the cookbook."],
        ["is-formal", "The Cookbook Launch Gala", "Cordially inviting you to celebrate", "Saturday, November 14th", "Needs a tweak", 68, "warn", "Too formal: Brie never says “cordially.” Soften the headline."],
        ["is-neon", "BRIE DROPS THE BOOK", "Tasting · DJ · Merch", "11.14 — 7PM", "Off vibe", 41, "bad", "Neon and all-caps clash with her cozy, homey aesthetic."],
      ].map(([style, h, sub, date, verdict, score, tone, note]) => `
        <figure class="ws-invite">
          <div class="invite-card ${style}"><span class="invite-kicker">You're invited</span><strong>${h}</strong><span>${sub}</span><em>${date}</em></div>
          <figcaption><span class="verdict is-${tone}">${verdict} · ${score}%</span><p>${note}</p></figcaption>
        </figure>`).join("")}
    </div>`,
  },
  matchmaker: {
    quest: "Checking chef & brand fit",
    title: "Collaborator shortlist",
    sub: "Ranked by audience overlap and brand fit",
    sources: [["audience-insights.md", "doc"], ["brand-values.md", "doc"], ["collab-history.csv", "sheet"], ["creator-directory/", "folder", "40 profiles"]],
    body: () => `<ul class="ws-matches">
      ${[
        ["MR", "Chef Marco Ruiz", "Weeknight Mexican · 210k", 92, ["Shared audience", "Similar warmth"], "Strong fit"],
        ["H&", "Hearth & Co. cookware", "Kitchen brand · 1.2M", 84, ["Gifting angle", "Values align"], "Strong fit"],
        ["DC", "The Dumpling Club", "Supper club · 38k", 77, ["IRL events", "Local to Brie"], "Worth a chat"],
        ["SG", "SnackGlow energy bars", "CPG brand · 900k", 31, ["Off-brand product"], "Pass"],
      ].map(([initials, name, meta, fit, tags, verdict]) => `
        <li class="match-card">
          <span class="match-avatar">${initials}</span>
          <div class="match-info"><strong>${name}</strong><span>${meta}</span><div class="match-tags">${tags.map((t) => `<span>${t}</span>`).join("")}</div></div>
          <div class="match-fit"><b>${fit}%</b><span>${verdict}</span><div class="mini-bar"><span style="width:${fit}%"></span></div></div>
        </li>`).join("")}
    </ul>`,
  },
  trendsetter: {
    quest: "Checking which trends fit Brie",
    title: "Trend radar",
    sub: "Emerging food & culture trends this month",
    sources: [["trend-feed-oct.md", "doc"], ["brand-voice.md", "doc"], ["top-posts-2026.csv", "sheet"], ["saved-tiktoks/", "folder", "23 links"]],
    body: () => `<ul class="ws-trends">
      ${[
        ["Tiny dinner parties", "+212%", [3, 4, 4, 6, 9, 14, 22], "Great fit", "good"],
        ["Tinned-fish boards", "+88%", [5, 6, 6, 8, 9, 11, 13], "Remix it", "warn"],
        ["Cookbook clubs", "+64%", [4, 5, 5, 6, 7, 8, 10], "Great fit", "good"],
        ["Butter boards", "−40%", [14, 13, 11, 9, 7, 6, 5], "Fading · skip", "bad"],
      ].map(([name, delta, pts, fit, tone]) => `
        <li class="trend-row"><div><strong>${name}</strong><span class="trend-delta is-${tone}">${delta} mentions</span></div>
          ${sparkline(pts, tone === "bad" ? "#ff6b6b" : "#c8ff5c")}<span class="verdict is-${tone}">${fit}</span></li>`).join("")}
    </ul>`,
  },
  "party-curator": {
    quest: "Scouting launch-party venues",
    title: "Venue shortlist & run of show",
    sub: "Cookbook launch party · ~60 guests",
    sources: [["event-brief.md", "doc"], ["guest-list.csv", "sheet"], ["budget.xlsx", "sheet"], ["venue-photos/", "folder", "31 images"]],
    body: () => `<div class="ws-venues">
      ${[
        ["ember-supper-club", "Ember Supper Club", "60 guests · open kitchen", "$$", "Top pick", "./assets/photos/venue-ember.jpg", "Warmly lit supper club dining room with set tables"],
        ["pages-and-pantry", "Pages & Pantry Books", "45 guests · reading nook", "$", "Cozy", "./assets/photos/venue-pages.jpg", "Cozy bookshop with tall wooden shelves"],
        ["rooftop-greenhouse", "Rooftop Greenhouse", "80 guests · string lights", "$$$", "Stretch", "./assets/photos/venue-greenhouse.jpg", "Leafy glass greenhouse filled with plants"],
      ].map(([id, name, meta, price, tag, image, alt]) => `
        <button class="venue-card" type="button" data-venue-id="${id}" aria-label="Design furniture for ${name}">
          <div class="venue-photo"><img src="${image}" alt="" loading="lazy" /><span>${tag}</span></div>
          <strong>${name}</strong><p>${meta} · ${price}</p><small class="venue-card-action">Design this space <span aria-hidden="true">→</span></small>
        </button>`).join("")}
    </div>
    <ol class="ws-timeline">
      ${[["7:00", "Doors · welcome spritz"], ["7:30", "Brie's tasting menu"], ["8:15", "Reading & Q&A"], ["8:45", "Book signing"]].map(([t, d]) => `<li><b>${t}</b><span>${d}</span></li>`).join("")}
    </ol>`,
  },
  "social-butterfly": {
    quest: "Mapping where new audiences gather",
    title: "Audience map",
    sub: "Communities likely to love Brie's cookbook",
    sources: [["audience-insights.md", "doc"], ["follower-survey.csv", "sheet"], ["community-notes.md", "doc"], ["reddit-threads/", "folder", "15 links"]],
    body: () => `<div class="ws-audience">
      <div class="audience-map" aria-hidden="true">
        <span class="aud-core">Brie's<br/>followers</span>
        ${[["Home bakers", 92, 18, 22], ["Weeknight cooks", 84, 70, 18], ["Cookbook clubs", 66, 76, 70], ["Dinner-party hosts", 74, 16, 72], ["Food students", 46, 46, 88]].map(([n, s, x, y]) => `<span class="aud-bubble" style="left:${x}%;top:${y}%;--s:${s}">${n}</span>`).join("")}
      </div>
      <ul class="aud-list">
        ${[["Home bakers", "r/Breadit · IG #homebaking", "1.4M"], ["Weeknight cooks", "TikTok #easydinner", "3.2M"], ["Cookbook clubs", "Local libraries · Discord", "120k"]].map(([n, w, s]) => `<li><strong>${n}</strong><span>${w}</span><b>${s}</b></li>`).join("")}
      </ul>
    </div>`,
  },
  "wing-worm": {
    quest: "Reviewing a brand deal",
    title: "Deal review · Hearth & Co. sponsorship",
    sub: "4 clauses flagged for Brie to look at",
    sources: [["hearth-co-contract.pdf", "pdf"], ["publishing-basics.md", "doc"], ["rate-card-2026.md", "doc"], ["past-deals/", "folder", "6 files"]],
    body: () => `<div class="ws-contract">
      ${[
        ["good", "Fee", "$8,000 for 3 posts + 1 reel", "Fair: right in line with your rate card."],
        ["warn", "Usage rights", "Brand may use content for 24 months", "Long. Ask for 12 months or more money."],
        ["bad", "Exclusivity", "No other cookware brands for 1 year", "Red flag: this blocks other kitchen deals."],
        ["warn", "Payment terms", "Net 90 after posting", "Slow. Ask for net 30 or 50% upfront."],
      ].map(([tone, clause, text, note]) => `
        <div class="clause is-${tone}"><span class="clause-flag">${{ good: "✓", warn: "!", bad: "⚑" }[tone]}</span><div><strong>${clause}</strong><p>“${text}”</p><em>${note}</em></div></div>`).join("")}
      <div class="clause-ask"><strong>Ask before signing</strong><span>Can exclusivity cover only the product category I'm promoting?</span></div>
    </div>`,
  },
  "hype-star": {
    quest: "Gathering launch signals into one board",
    title: "Signal board",
    sub: "Every sign of buzz from the launch, pinned in one place",
    sources: [["launch-recap.md", "doc"], ["tagged-posts.csv", "sheet"], ["follower-growth.csv", "sheet"], ["ugc-clips/", "folder", "27 clips"]],
    body: () => {
      const types = {
        tagged: ["Tagged post", "#ff6f9c"],
        ugc: ["UGC", "#63e0d8"],
        recipe: ["Most-saved recipe", "#c8ff5c"],
        followers: ["New followers", "#ffb35c"],
        creators: ["Creator connection", "#a99bff"],
        requests: ["Event request", "#ffa08a"],
      };
      const photo = (src, alt, tall) => `<div class="pin-photo${tall ? " is-tall" : ""}"><img src="./assets/photos/${src}.jpg" alt="${alt}" loading="lazy"></div>`;
      const pins = [
        ["recipe", `${photo("ugc-cookies", "Miso brown-butter cookies", true)}<div class="pin-body"><strong>Miso brown-butter cookies</strong><p>Saved 3,420 times this week · 4× your average recipe</p><span class="pin-stat">🔖 3.4k saves</span></div>`],
        ["tagged", `${photo("ugc-cookbook", "Fan holding a signed cookbook")}<div class="pin-body"><b>@dinnerwithdee</b><p>“signed copy!! can't wait to cook the whole book”</p><span class="pin-stat">♥ 2.8k</span></div>`],
        ["followers", `<div class="pin-body pin-big"><span class="pin-number">+1,284</span><p>new followers since the launch</p>${sparkline([120, 140, 180, 260, 410, 690, 980, 1284], "#ffb35c")}<small>Top source: tagged launch reels (62%)</small></div>`],
        ["requests", `<div class="pin-body pin-quote"><p>“Please do another supper club! I missed this one and I'm so sad 😭”</p><b>@jules.cooks</b><small>+46 similar comments & DMs</small></div>`],
        ["ugc", `${photo("ugc-bookclub", "Book club with the cookbook", true)}<div class="pin-body"><b>@cookbookclubla</b><p>Picked your book for their November meeting ✨</p><span class="pin-stat">♥ 1.9k</span></div>`],
        ["creators", `<div class="pin-body"><strong>Creators reaching out</strong><ul class="pin-people">${[["partner-marco", "Chef Marco", "Wants a joint pasta night"], ["partner-dumpling", "Dumpling House", "Offered a pop-up collab"], ["partner-pages", "Pages & Co.", "Asked to host a signing"]].map(([img, name, note]) => `<li><img src="./assets/photos/${img}.jpg" alt=""><span><b>${name}</b>${note}</span></li>`).join("")}</ul></div>`],
        ["tagged", `${photo("ugc-tasting", "Tasting menu plates")}<div class="pin-body"><b>@mo_eats</b><p>“that tasting menu… I'm still thinking about it”</p><span class="pin-stat">♥ 1.2k</span></div>`],
        ["ugc", `${photo("content-weeknight", "Fan cooking a weeknight recipe")}<div class="pin-body"><b>@sam.bakes</b><p>Recreated your weeknight noodles in a reel</p><span class="pin-stat">▶ 18k views</span></div>`],
        ["requests", `<div class="pin-body pin-quote"><p>“Would love a version of this in Brooklyn. Take my money!”</p><b>@nyc.eats.daily</b><small>12 requests from NYC</small></div>`],
        ["recipe", `${photo("content-maker", "Charred citrus salad")}<div class="pin-body"><strong>Charred citrus salad</strong><p>Second most saved · trending with new followers</p><span class="pin-stat">🔖 1.6k saves</span></div>`],
        ["creators", `${photo("collab-gather", "Creators at the launch")}<div class="pin-body"><strong>3 creators tagged you together</strong><p>@platedbyp, @hungryhana and @thebreadfriend posted from the launch</p></div>`],
        ["followers", `<div class="pin-body pin-big"><span class="pin-number">38%</span><p>of new followers are home bakers, a new audience for you</p><small>Social butterfly is mapping where they gather</small></div>`],
      ];
      const counts = Object.fromEntries(Object.keys(types).map((k) => [k, pins.filter(([t]) => t === k).length]));
      return `<div class="pin-filters" role="toolbar" aria-label="Filter signals">
        <button type="button" class="pin-chip" data-pin-filter="all" aria-pressed="true">All <span>${pins.length}</span></button>
        ${Object.entries(types).map(([key, [label, color]]) => `<button type="button" class="pin-chip" data-pin-filter="${key}" aria-pressed="false" style="--pin:${color}">${label} <span>${counts[key]}</span></button>`).join("")}
      </div>
      <div class="pin-board">
        ${pins.map(([type, inner]) => `<article class="pin" data-pin-type="${type}" style="--pin:${types[type][1]}"><span class="pin-tag">${types[type][0]}</span>${inner}</article>`).join("")}
      </div>`;
    },
  },
};

const sourceIcons = {
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>',
  pdf: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 15h6"/>',
  sheet: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 10h16M4 15h16M10 4v16"/>',
  image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 17-5-5-8 7"/>',
  folder: '<path d="M3 6h6l2 2h10v11H3z"/>',
};

// No chef's-hat emoji exists, so the toque is an SVG used both in the DOM and on the village canvas.
const CHEF_HAT = "chef-hat";
const chefHatSrc = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 56"><g stroke="#2a2230" stroke-width="2.5" stroke-linejoin="round"><path d="M16 34c-8 0-13-6-12-13 1-8 9-12 16-9 2-7 8-10 13-10s11 3 13 10c7-3 15 1 16 9 1 7-4 13-12 13z" fill="#fffaf2"/><rect x="15" y="32" width="34" height="18" rx="3" fill="#fffaf2"/></g><path d="M18 40h28" stroke="#e8dccb" stroke-width="2.5"/><path d="M24 22c1-4 4-6 8-6" stroke="#e8dccb" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>`)}`;
const chefHatImage = new Image();
chefHatImage.src = chefHatSrc;
const hatMarkup = (hat, className) => hat === CHEF_HAT
  ? `<img class="${className} is-toque" src="${chefHatSrc}" alt="" aria-hidden="true" />`
  : `<span class="${className}" aria-hidden="true">${hat}</span>`;

const costumes = [
  ["none", "Classic", ""],
  ["chef", "Chef's hat", CHEF_HAT],
  ["pan", "Skillet", "🍳"],
  ["spoon", "Spoon", "🥄"],
  ["chopsticks", "Chopsticks", "🥢"],
  ["cupcake", "Cupcake", "🧁"],
  ["croissant", "Croissant", "🥐"],
  ["chili", "Chili", "🌶️"],
  ["garlic", "Garlic", "🧄"],
  ["cherry", "Cherry", "🍒"],
];
const COSTUME_KEY = "charmz-costumes";
let costumeChoices = {};
try { costumeChoices = JSON.parse(localStorage.getItem(COSTUME_KEY)) || {}; } catch { costumeChoices = {}; }
const costumeFor = (agent) => costumes.find(([id]) => id === costumeChoices[agent.id]) || costumes[0];

function renderAvatar(agent) {
  const [, , emoji] = costumeFor(agent);
  dialogAvatar.innerHTML = `<img src="${agent.portrait}" alt="" />${emoji ? hatMarkup(emoji, "costume-hat") : ""}`;
}

function renderCostumes(agent) {
  const current = costumeFor(agent)[0];
  costumeGrid.innerHTML = costumes.map(([id, label, emoji]) => `
    <button class="costume${id === current ? " is-selected" : ""}" type="button" role="radio" aria-checked="${id === current}" data-costume="${id}" title="${label}">
      ${emoji ? hatMarkup(emoji, "costume-icon") : `<span aria-hidden="true">∅</span>`}<small>${label}</small>
    </button>`).join("");
}

costumeGrid.addEventListener("click", (event) => {
  const button = event.target.closest("[data-costume]");
  if (!button || !selectedAgent) return;
  costumeChoices[selectedAgent.id] = button.dataset.costume;
  localStorage.setItem(COSTUME_KEY, JSON.stringify(costumeChoices));
  renderAvatar(selectedAgent);
  renderCostumes(selectedAgent);
});

function renderInventorySlots(agent) {
  const agents = allAgents();
  invCount.textContent = `${agents.indexOf(agent) + 1} / ${agents.length}`;
  invSlots.innerHTML = agents.map((a) => `
    <button class="inv-slot${a === agent ? " is-selected" : ""}${a === controlledCharacter ? " is-controlled" : ""}" type="button" role="option" aria-selected="${a === agent}" data-inv-id="${a.id}" style="--slot:${a.color}" title="${a.name}">
      <img src="${a.portrait}" alt="${a.name}" />
    </button>`).join("");
}

function openAgentDetails(agent) {
  selectedAgent = agent;
  const loadout = agentLoadouts[agent.id] || { category: agent.role, about: agent.note, task: agent.task, progress: 40, quests: [], skills: [] };
  const workspace = agentWorkspaces[agent.id] || { quest: loadout.category, title: "Workspace", sub: "", sources: [], body: () => "" };
  agentDialog.style.setProperty("--agent-color", agent.color);
  renderAvatar(agent);
  dialogAvatar.classList.remove("is-swapping");
  void dialogAvatar.offsetWidth;
  dialogAvatar.classList.add("is-swapping");
  dialogRole.textContent = loadout.category;
  dialogName.textContent = agent.name;
  dialogStatus.textContent = agent.status;
  dialogTask.textContent = agentTasks[agent.id] || loadout.task;
  dialogNote.textContent = agent.role;
  wsEyebrow.textContent = `The ${agent.name} workspace`;
  wsTitle.textContent = workspace.title;
  wsSub.textContent = workspace.sub;
  wsBody.innerHTML = workspace.body();
  renderAgentAlertBanner(agent);
  wsBody.scrollTop = 0;
  questTitle.textContent = workspace.quest;
  invProgressLabel.textContent = `${loadout.progress}%`;
  invProgressBar.style.width = `${loadout.progress}%`;
  invQuests.innerHTML = loadout.quests.map(([text, state]) => `
    <li class="quest is-${state}"><span class="quest-icon" aria-hidden="true">${{ done: "✓", active: "▶", next: "○", locked: "🔒" }[state]}</span><span>${text}</span><span class="visually-hidden"> (${state})</span></li>`).join("");
  invSkills.innerHTML = loadout.skills.map(([name, detail, level, state]) => `
    <li class="inv-skill is-${state}" title="${detail}">
      <div class="inv-skill-top"><strong>${name}</strong><span class="inv-skill-state">${{ done: "Mastered", active: "In use", next: "Up next" }[state]}</span></div>
      <div class="inv-skill-bar" aria-hidden="true"><span style="width:${level}%"></span></div>
    </li>`).join("");
  sourceList.innerHTML = workspace.sources.map(([name, type, meta]) => `
    <li class="source is-${type}"><svg class="inline-icon" viewBox="0 0 24 24" aria-hidden="true">${sourceIcons[type]}</svg><span>${name}</span>${meta ? `<small>${meta}</small>` : ""}</li>`).join("");
  renderCostumes(agent);
  renderInventorySlots(agent);
  joinAgentButton.hidden = true;
  if (!agentDialog.open) agentDialog.showModal();
}

function cycleAgent(step) {
  const agents = allAgents();
  const index = agents.indexOf(selectedAgent);
  openAgentDetails(agents[(index + step + agents.length) % agents.length]);
}

invSlots.addEventListener("click", (event) => {
  const slot = event.target.closest("[data-inv-id]");
  if (!slot) return;
  const agent = allAgents().find((candidate) => candidate.id === slot.dataset.invId);
  if (agent) openAgentDetails(agent);
});
document.querySelector("#inv-prev").addEventListener("click", () => cycleAgent(-1));
document.querySelector("#inv-next").addEventListener("click", () => cycleAgent(1));
agentDialog.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") { event.preventDefault(); cycleAgent(-1); }
  else if (event.key === "ArrowRight") { event.preventDefault(); cycleAgent(1); }
});

const bubblePalettes = [
  ["#1d2c8f", "#ff4f3a", "#ff9a4a", "rgba(255, 130, 200, 0.55)"],
  ["#2f5dbf", "#63e0d8", "#c8ff5c", "rgba(200, 255, 92, 0.35)"],
  ["#ffe9c9", "#ff6f9c", "#7b6bff", "rgba(80, 70, 255, 0.4)"],
  ["#fff1d6", "#ff8a3d", "#ff4fa3", "rgba(255, 79, 163, 0.45)"],
  ["#173a8a", "#ff5ab0", "#ffb04a", "rgba(255, 176, 74, 0.4)"],
];

function drawBubble(x, y, radius, palette, alpha = 1) {
  const [core, mid, outer, halo] = palette;
  const gradient = ctx.createRadialGradient(x - radius * 0.12, y - radius * 0.08, 0, x, y, radius);
  gradient.addColorStop(0, core);
  gradient.addColorStop(0.28, core);
  gradient.addColorStop(0.5, mid);
  gradient.addColorStop(0.74, outer);
  gradient.addColorStop(0.9, halo);
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.globalAlpha = alpha;
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawDefaultBackground(cameraX, cameraY, time = 0) {
  const isCustom = villageBackground.theme === "custom" && villageBgImage.complete && villageBgImage.naturalWidth;
  const theme = villageThemes[villageBackground.theme] || villageThemes.night;
  ctx.fillStyle = isCustom ? "#050405" : theme.edge;
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);

  ctx.save();
  ctx.translate(-cameraX, -cameraY);
  if (isCustom) {
    const scale = Math.max(world.width / villageBgImage.naturalWidth, world.height / villageBgImage.naturalHeight);
    const w = villageBgImage.naturalWidth * scale;
    const h = villageBgImage.naturalHeight * scale;
    ctx.drawImage(villageBgImage, (world.width - w) / 2, (world.height - h) / 2, w, h);
    ctx.restore();
    return;
  }
  ctx.fillStyle = theme.base;
  ctx.fillRect(0, 0, world.width, world.height);

  const glows = [
    [850, 545, 720, theme.glows[0]],
    [1340, 310, 440, theme.glows[1]],
    [380, 860, 420, theme.glows[2]],
    [1450, 900, 360, theme.glows[3]],
  ];
  for (const [gx, gy, radius, color] of glows) {
    const gradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(gx - radius, gy - radius, radius * 2, radius * 2);
  }

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const tracePaths = () => {
    ctx.beginPath();
    ctx.moveTo(95, 610);
    ctx.bezierCurveTo(405, 530, 575, 652, 890, 570);
    ctx.bezierCurveTo(1170, 498, 1305, 570, 1720, 438);
    ctx.moveTo(900, 575);
    ctx.bezierCurveTo(810, 710, 865, 855, 742, 1045);
  };
  ctx.strokeStyle = theme.path;
  ctx.lineWidth = 66;
  tracePaths();
  ctx.stroke();
  const pathGlow = ctx.createLinearGradient(95, 0, 1720, 0);
  pathGlow.addColorStop(0, "rgba(200, 255, 92, 0.4)");
  pathGlow.addColorStop(0.35, "rgba(99, 224, 216, 0.4)");
  pathGlow.addColorStop(0.65, "rgba(255, 79, 163, 0.4)");
  pathGlow.addColorStop(1, "rgba(255, 122, 61, 0.4)");
  ctx.strokeStyle = pathGlow;
  ctx.lineWidth = 2;
  ctx.setLineDash([2, 16]);
  tracePaths();
  ctx.stroke();
  ctx.setLineDash([]);

  for (let i = 0; i < 70; i += 1) {
    const x = 60 + ((i * 317) % (world.width - 120));
    const y = 70 + ((i * 193) % (world.height - 140));
    if (Math.abs(y - (590 - x * 0.09)) < 75) continue;
    const pulse = 0.45 + 0.35 * Math.sin(time / 900 + i);
    drawBubble(x, y, 3 + (i % 4) * 1.6, bubblePalettes[i % bubblePalettes.length], pulse);
  }

  if (theme.trees) {
    drawTree(300, 390, 1.1, 0, time);
    drawTree(480, 750, 0.9, 1, time);
    drawTree(1320, 790, 1.15, 2, time);
    drawTree(1510, 500, 0.8, 3, time);
    drawTree(1020, 230, 0.75, 4, time);
  }
  ctx.restore();
}

function drawTree(x, y, scale, paletteIndex = 0, time = 0) {
  const palette = bubblePalettes[paletteIndex % bubblePalettes.length];
  const bob = Math.sin(time / 1400 + paletteIndex) * 4 * scale;
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.beginPath();
  ctx.ellipse(x + 4, y + 26 * scale, 30 * scale, 9 * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  drawBubble(x, y - 10 * scale + bob, 62 * scale, [palette[3], palette[3], "rgba(0,0,0,0)", "rgba(0,0,0,0)"], 0.35);
  drawBubble(x, y - 10 * scale + bob, 34 * scale, palette);
  drawBubble(x - 30 * scale, y + 10 * scale + bob * 0.6, 13 * scale, palette, 0.9);
  drawBubble(x + 27 * scale, y - 34 * scale - bob * 0.5, 9 * scale, bubblePalettes[(paletteIndex + 2) % bubblePalettes.length], 0.85);
}

function drawPerson(actor, isControlled, cameraX, cameraY) {
  const x = actor.x - cameraX;
  const groundY = actor.y - cameraY;
  const y = groundY - (actor.collabJumpOffset || 0);
  const moving = actor.collaborating || (isControlled
    ? keys.has("ArrowUp") || keys.has("w") || keys.has("ArrowDown") || keys.has("s") ||
      keys.has("ArrowLeft") || keys.has("a") || keys.has("ArrowRight") || keys.has("d")
    : Math.hypot(actor.targetX - actor.x, actor.targetY - actor.y) > 3);

  if (actor.collaborating) {
    const glow = ctx.createRadialGradient(x, groundY - 28, 4, x, groundY - 28, 54);
    glow.addColorStop(0, "rgba(255, 111, 156, 0.28)");
    glow.addColorStop(0.55, "rgba(123, 107, 255, 0.14)");
    glow.addColorStop(1, "rgba(123, 107, 255, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, groundY - 28, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 180, 220, 0.76)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x, groundY + 2, 36, 10, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (isControlled) {
    ctx.fillStyle = "rgba(255, 122, 61, 0.16)";
    ctx.beginPath();
    ctx.ellipse(x, y + 1, actor.sprite || actor.cutoutImage ? 31 : 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(200, 255, 92, 0.85)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x, y + 1, actor.sprite || actor.cutoutImage ? 31 : 22, 8, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (actor.sprite) {
    const { image, rows, columns } = actor.sprite;
    const row = SPRITE_ROWS[actor.direction] ?? 0;
    const col = moving ? Math.floor(actor.frame) % columns : 0;
    const bob = moving ? 0 : Math.sin(performance.now() / 380 + actor.homeX) * 1.5;
    const frameWidth = actor.sprite.frameWidth || image.width / columns;
    const frameHeight = actor.sprite.frameHeight || image.height / rows;
    const drawWidth = SPRITE_SIZE;
    const drawHeight = SPRITE_SIZE;
    ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
    ctx.beginPath();
    ctx.ellipse(x, y + 1, 28, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    const drawFrame = () => ctx.drawImage(
      image,
      col * frameWidth,
      row * frameHeight,
      frameWidth,
      frameHeight,
      x - drawWidth / 2,
      y - drawHeight + 6 + bob,
      drawWidth,
      drawHeight,
    );
    if (actor.direction === "right") {
      ctx.save();
      ctx.translate(2 * x, 0);
      ctx.scale(-1, 1);
      drawFrame();
      ctx.restore();
    } else {
      drawFrame();
    }
    drawCostume(actor, x, y - drawHeight + 6 + bob, drawHeight, row, frameWidth, frameHeight);
    drawAgentName(actor, x, y + 11, isControlled);
    return;
  }

  if (actor.cutoutImage) {
    drawCutout(actor, x, y, moving);
    drawAgentName(actor, x, y + 11, isControlled);
    return;
  }

  const bob = moving ? Math.sin(actor.frame * Math.PI) * 1.5 : 0;
  const legSwing = moving ? Math.sin(actor.frame * Math.PI) * 4 : 0;
  const shirt = actor.shirt;
  const trousers = actor.trousers;

  ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
  ctx.beginPath();
  ctx.ellipse(x, y + 1, 16, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = trousers;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 5, y - 14 + bob);
  ctx.lineTo(x - 6 - legSwing, y - 2);
  ctx.moveTo(x + 5, y - 14 + bob);
  ctx.lineTo(x + 6 + legSwing, y - 2);
  ctx.stroke();

  ctx.fillStyle = shirt;
  ctx.beginPath();
  ctx.roundRect(x - 12, y - 37 + bob, 24, 27, 8);
  ctx.fill();

  ctx.fillStyle = "#e7c7a7";
  ctx.beginPath();
  ctx.arc(x, y - 43 + bob, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3a2240";
  ctx.beginPath();
  ctx.arc(x, y - 47 + bob, 10, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1b1020";
  ctx.beginPath();
  ctx.arc(x - 4, y - 42 + bob, 1, 0, Math.PI * 2);
  ctx.arc(x + 4, y - 42 + bob, 1, 0, Math.PI * 2);
  ctx.fill();
  drawAgentName(actor, x, y + 15, isControlled);
}

const headTopCache = new Map();
// Fraction of the frame height where the sprite's first opaque pixel (top of head) sits.
function spriteHeadTop(image, row, frameWidth, frameHeight) {
  const key = `${image.src}|${row}`;
  if (headTopCache.has(key)) return headTopCache.get(key);
  let top = 0.1;
  try {
    const probe = document.createElement("canvas");
    probe.width = frameWidth;
    probe.height = frameHeight;
    const pctx = probe.getContext("2d");
    pctx.drawImage(image, 0, row * frameHeight, frameWidth, frameHeight, 0, 0, frameWidth, frameHeight);
    const data = pctx.getImageData(0, 0, frameWidth, frameHeight).data;
    outer: for (let py = 0; py < frameHeight; py++) {
      for (let px = 0; px < frameWidth; px++) {
        if (data[(py * frameWidth + px) * 4 + 3] > 60) { top = py / frameHeight; break outer; }
      }
    }
  } catch { /* keep default */ }
  headTopCache.set(key, top);
  return top;
}

function drawCostume(actor, x, frameTop, drawHeight, row, frameWidth, frameHeight) {
  const emoji = costumeFor(actor)[2];
  if (!emoji) return;
  const headY = frameTop + spriteHeadTop(actor.sprite.image, row, frameWidth, frameHeight) * drawHeight;
  if (emoji === CHEF_HAT) {
    if (chefHatImage.complete && chefHatImage.naturalWidth) ctx.drawImage(chefHatImage, x - 13, headY - 18, 26, 23);
    return;
  }
  ctx.save();
  ctx.font = "20px 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText(emoji, x, headY + 7);
  ctx.restore();
}

function drawCutout(actor, x, y, moving) {
  const time = performance.now() / 1000;
  const step = Math.sin(actor.frame * Math.PI);
  const hop = moving ? Math.abs(step) * 7 : 0;
  const tilt = moving ? step * 0.07 : Math.sin(time * 1.6 + actor.homeX) * 0.015;
  const squash = moving ? 1 - Math.abs(Math.cos(actor.frame * Math.PI)) * 0.06 : 1 + Math.sin(time * 2.2 + actor.homeY) * 0.015;
  const width = actor.drawWidth;
  const height = actor.drawHeight;

  ctx.fillStyle = "rgba(0, 0, 0, 0.42)";
  ctx.beginPath();
  ctx.ellipse(x, y + 1, width * 0.32 * (1 - hop / 30), 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(x, y - hop);
  ctx.rotate(tilt);
  ctx.scale(actor.direction === "left" ? -1 / squash : 1 / squash, squash);
  ctx.drawImage(actor.cutoutImage, -width / 2, -height + 4, width, height);
  ctx.restore();
}

function drawAgentName(actor, x, y, isControlled) {
  ctx.save();
  ctx.font = "600 11px 'DM Sans', sans-serif";
  const width = ctx.measureText(actor.name).width + 18;
  ctx.fillStyle = isControlled ? "rgba(255, 95, 110, 0.95)" : "rgba(14, 11, 13, 0.88)";
  ctx.beginPath();
  ctx.roundRect(x - width / 2, y - 9, width, 19, 8);
  ctx.fill();
  ctx.fillStyle = isControlled ? "#fff" : "#f4e8de";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(actor.name, x, y + 0.5);
  ctx.restore();
}

function updateCameraPan(delta) {
  let dx = 0;
  let dy = 0;
  if (keys.has("ArrowLeft") || keys.has("a")) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("d")) dx += 1;
  if (keys.has("ArrowUp") || keys.has("w")) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("s")) dy += 1;
  if (!dx && !dy) return;
  const length = Math.hypot(dx, dy);
  camera.x += (dx / length) * PAN_SPEED * delta;
  camera.y += (dy / length) * PAN_SPEED * delta;
}

function collaborationMembers() {
  return ["matchmaker", "social-butterfly", "trendsetter"]
    .map((id) => allAgents().find((agent) => agent.id === id))
    .filter(Boolean);
}

function startCollaboration() {
  const members = collaborationMembers();
  if (members.length !== 3) return;
  if (members.some((agent) => agent.awaitingDecision)) {
    nextCollaborationAt = villageElapsed + 8;
    return;
  }
  const centerX = members.reduce((sum, agent) => sum + agent.x, 0) / members.length;
  const centerY = members.reduce((sum, agent) => sum + agent.y, 0) / members.length;
  const offsets = [[-104, 10], [0, -26], [104, 10]];
  collaboration = {
    elapsed: 0,
    members: members.map((agent, index) => ({
      agent,
      targetX: Math.max(90, Math.min(world.width - 90, centerX + offsets[index][0])),
      targetY: Math.max(120, Math.min(world.height - 100, centerY + offsets[index][1])),
    })),
  };
  for (const { agent, targetX, targetY } of collaboration.members) {
    agent.collaborating = true;
    agent.targetX = targetX;
    agent.targetY = targetY;
    agent.pause = 0;
  }
  collabBubble.hidden = false;
}

function updateCollaboration(delta) {
  villageElapsed += delta;
  if (!collaboration) {
    if (villageElapsed >= nextCollaborationAt) startCollaboration();
    return;
  }
  collaboration.elapsed += delta;
  for (const [index, member] of collaboration.members.entries()) {
    const { agent, targetX, targetY } = member;
    const dx = targetX - agent.x;
    const dy = targetY - agent.y;
    const distance = Math.hypot(dx, dy);
    if (distance > 3) {
      const step = Math.min(distance, 150 * delta);
      agent.x += (dx / distance) * step;
      agent.y += (dy / distance) * step;
      agent.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
      agent.frame += delta * 8;
    } else {
      agent.frame += delta * 8;
    }
    agent.collabJumpOffset = distance < 18
      ? Math.max(0, Math.sin(collaboration.elapsed * 7 + index * 0.25)) * 15
      : 0;
  }
  if (collaboration.elapsed < 11) return;
  for (const { agent } of collaboration.members) {
    agent.collaborating = false;
    agent.collabJumpOffset = 0;
    agent.targetX = agent.x;
    agent.targetY = agent.y;
    agent.pause = 0;
  }
  collaboration = null;
  collabBubble.hidden = true;
  nextCollaborationAt = villageElapsed + 20 + Math.random() * 12;
}

function updateWalkers(delta) {
  for (const walker of [player, ...walkers]) {
    if (walker.collaborating) continue;
    if (walker.awaitingDecision) {
      walker.frame = 0;
      continue;
    }
    walker.pause -= delta;
    const dx = walker.targetX - walker.x;
    const dy = walker.targetY - walker.y;
    const distance = Math.hypot(dx, dy);
    if (distance < 5 || walker.pause > 0) {
      if (distance < 5 && walker.pause <= 0) {
        walker.pause = 1 + Math.random() * 2.2;
        const wanderRadius = walker.wanderSpeed || walker.speed;
        walker.targetX = Math.max(80, Math.min(world.width - 80, walker.homeX + (Math.random() * 2 - 1) * wanderRadius * 3));
        walker.targetY = Math.max(100, Math.min(world.height - 100, walker.homeY + (Math.random() * 2 - 1) * wanderRadius * 2));
      }
      continue;
    }

    const step = Math.min(distance, walker.speed * delta);
    walker.x += (dx / distance) * step;
    walker.y += (dy / distance) * step;
    walker.direction = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "right" : "left") : (dy > 0 ? "down" : "up");
    walker.frame += delta * 6;
  }
}

function getCamera() {
  const hud = document.querySelector(".village-hud")?.offsetHeight || 0;
  const axis = (target, min, max) => (max < min ? (min + max) / 2 : Math.max(min, Math.min(max, target)));
  camera.x = axis(camera.x, 0, world.width - viewportWidth);
  camera.y = axis(camera.y, -hud, world.height - viewportHeight);
  return { x: camera.x, y: camera.y };
}

function draw() {
  const { x: cameraX, y: cameraY } = getCamera();
  drawDefaultBackground(cameraX, cameraY, performance.now());

  const actors = [...walkers, player].sort((a, b) => a.y - b.y);
  drawDeliverables(cameraX, cameraY, performance.now());
  drawDecisionRings(cameraX, cameraY, performance.now());
  for (const actor of actors) drawPerson(actor, actor === controlledCharacter, cameraX, cameraY);
  positionCollaborationBubble(cameraX, cameraY);
  positionDeliverableBubbles(cameraX, cameraY);
  positionDecisionBubbles(cameraX, cameraY);
}

function positionCollaborationBubble(cameraX, cameraY) {
  if (!collaboration) return;
  const highest = Math.min(...collaboration.members.map(({ agent }) => agent.y));
  const centerX = collaboration.members.reduce((sum, { agent }) => sum + agent.x, 0) / collaboration.members.length;
  const x = Math.max(72, Math.min(viewportWidth - 72, centerX - cameraX));
  const y = Math.max(54, highest - cameraY - 136);
  collabBubble.style.left = `${x}px`;
  collabBubble.style.top = `${y}px`;
}

const DELIVERABLES_KEY = "charmz-deliverables";
const deliverableLayer = document.querySelector("#deliverable-layer");
const deliverableCatalog = {
  matchmaker: [["🤝", "Partner shortlist"], ["💌", "Collab pitch drafts"], ["📇", "Vendor contact sheet"]],
  trendsetter: [["🪑", "Decor & furniture picks"], ["📈", "Trend report"], ["🎨", "Event moodboard"]],
  "party-curator": [["🎉", "Event run-of-show"], ["📍", "Venue comparison"], ["🍽️", "Tasting menu plan"]],
  "social-butterfly": [["🎯", "Audience & platform plan"], ["📣", "Promo schedule"], ["👥", "Community shortlist"]],
  "wing-worm": [["📸", "Content calendar"], ["✍️", "Caption pack"], ["🎬", "Reel storyboard"]],
  "hype-star": [["📌", "Signal board digest"], ["💬", "Top UGC roundup"], ["⭐", "New follower highlights"]],
  "vibe-checker": [["💖", "Sentiment check-in"], ["📝", "Guest feedback summary"], ["🌡️", "Brand vibe report"]],
};
let deliverables = [];
try { deliverables = JSON.parse(localStorage.getItem(DELIVERABLES_KEY)) || []; } catch { deliverables = []; }
const deliveryTimers = {};
const queuedDeliveries = {};
let firstDeliveryAt = 6;

function saveDeliverables() {
  localStorage.setItem(DELIVERABLES_KEY, JSON.stringify(deliverables));
}

function scheduleNextDelivery(agentId, soon = false) {
  deliveryTimers[agentId] = villageElapsed + (soon ? 18 : 35 + Math.random() * 45);
}

function hasPendingDeliverable(agentId) {
  return deliverables.some((item) => item.agentId === agentId);
}

function dropDeliverable(agent, title, icon) {
  const catalog = deliverableCatalog[agent.id] || [["🎁", "Finished task"]];
  const [defaultIcon, defaultTitle] = catalog[Math.floor(Math.random() * catalog.length)];
  const item = {
    id: `${agent.id}-${Date.now()}`,
    agentId: agent.id,
    title: title || defaultTitle,
    icon: icon || defaultIcon,
    x: Math.max(70, Math.min(world.width - 70, agent.x + (agent.direction === "left" ? -34 : 34))),
    y: Math.max(110, Math.min(world.height - 50, agent.y + 6)),
    createdAt: Date.now(),
  };
  deliverables.push(item);
  saveDeliverables();
  villageAudio.deliver(agent.id);
  agent.pause = Math.max(agent.pause || 0, 1.6);
  agent.targetX = agent.x;
  agent.targetY = agent.y;
  renderDeliverableBubbles();
  renderDashboardAgents();
  showToast(`${item.icon} ${agent.name} finished “${item.title}” — pick it up in the village!`);
  return item;
}

function updateDeliveries() {
  if (villageElapsed < firstDeliveryAt) return;
  const busy = new Set((collaboration?.members || []).map(({ agent }) => agent.id));
  for (const agent of allAgents()) {
    if (deliveryTimers[agent.id] === undefined) {
      deliveryTimers[agent.id] = firstDeliveryAt + Math.random() * 30;
      if (agent.id === "matchmaker") deliveryTimers[agent.id] = firstDeliveryAt;
    }
    if (villageElapsed < deliveryTimers[agent.id] || busy.has(agent.id) || agent.awaitingDecision) continue;
    if (hasPendingDeliverable(agent.id) || deliverables.length >= 4) {
      deliveryTimers[agent.id] = villageElapsed + 10;
      continue;
    }
    const queued = queuedDeliveries[agent.id];
    delete queuedDeliveries[agent.id];
    dropDeliverable(agent, queued, queued ? "✅" : undefined);
    scheduleNextDelivery(agent.id);
  }
}

function deliverableAt(x, y) {
  return [...deliverables].reverse().find((item) => Math.abs(x - item.x) < 22 && y > item.y - 44 && y < item.y + 10);
}

function drawDeliverables(cameraX, cameraY, time) {
  const context = ctx;
  for (const item of deliverables) {
    const agent = allAgents().find((candidate) => candidate.id === item.agentId);
    const color = agent?.color || "#ff7fa8";
    const x = item.x - cameraX;
    const y = item.y - cameraY;
    const bob = Math.sin(time / 320 + item.createdAt) * 3;
    const age = Math.min(1, (Date.now() - item.createdAt) / 450);
    const drop = (1 - age) * -40;
    context.save();
    context.fillStyle = "rgba(0,0,0,.28)";
    context.beginPath();
    context.ellipse(x, y + 2, 17 - bob * 0.6, 5, 0, 0, Math.PI * 2);
    context.fill();
    const glow = context.createRadialGradient(x, y - 16, 2, x, y - 16, 34);
    glow.addColorStop(0, "rgba(255,240,170,.55)");
    glow.addColorStop(1, "rgba(255,240,170,0)");
    context.fillStyle = glow;
    context.fillRect(x - 36, y - 52, 72, 72);
    context.translate(x, y - 4 + bob + drop);
    context.fillStyle = color;
    context.strokeStyle = "#3a2430";
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(-13, -22, 26, 22, 4);
    context.fill();
    context.stroke();
    context.beginPath();
    context.roundRect(-15, -28, 30, 8, 3);
    context.fill();
    context.stroke();
    context.fillStyle = "#fff6e8";
    context.fillRect(-3, -28, 6, 28);
    context.fillRect(-15, -26, 30, 4);
    context.strokeStyle = "#fff6e8";
    context.lineWidth = 3;
    context.beginPath();
    context.ellipse(-6, -32, 6, 4, -0.5, 0, Math.PI * 2);
    context.ellipse(6, -32, 6, 4, 0.5, 0, Math.PI * 2);
    context.stroke();
    context.restore();
    for (let index = 0; index < 3; index += 1) {
      const phase = time / 500 + index * 2.1 + item.createdAt;
      const alpha = (Math.sin(phase * 2) + 1) / 2;
      context.fillStyle = `rgba(255,248,200,${alpha})`;
      const sx = x + Math.cos(phase) * 22;
      const sy = y - 20 + Math.sin(phase * 1.3) * 16;
      context.beginPath();
      context.moveTo(sx, sy - 4);
      context.lineTo(sx + 1.2, sy - 1.2);
      context.lineTo(sx + 4, sy);
      context.lineTo(sx + 1.2, sy + 1.2);
      context.lineTo(sx, sy + 4);
      context.lineTo(sx - 1.2, sy + 1.2);
      context.lineTo(sx - 4, sy);
      context.lineTo(sx - 1.2, sy - 1.2);
      context.fill();
    }
  }
}

function renderDeliverableBubbles() {
  if (!deliverableLayer) return;
  deliverableLayer.innerHTML = deliverables.map((item) => {
    const agent = allAgents().find((candidate) => candidate.id === item.agentId);
    return `<button class="deliverable-bubble" type="button" data-deliverable-id="${item.id}" style="--agent-color:${agent?.color || "#ff7fa8"}" aria-label="Pick up ${escapeText(agent?.name || "agent")}'s deliverable: ${escapeText(item.title)}">
      <span class="deliverable-bubble-badge" aria-hidden="true">${item.icon}</span>
      <span class="deliverable-bubble-copy"><strong>${escapeText(agent?.name || "Your charmz")} is done!</strong><small>${escapeText(item.title)} · tap to pick up</small></span>
    </button>`;
  }).join("");
}

function positionDeliverableBubbles(cameraX, cameraY) {
  if (!deliverableLayer) return;
  for (const button of deliverableLayer.children) {
    const item = deliverables.find((candidate) => candidate.id === button.dataset.deliverableId);
    if (!item) continue;
    const x = item.x - cameraX;
    const y = item.y - cameraY - 50;
    const visible = x > -80 && x < viewportWidth + 80 && y > -20 && y < viewportHeight + 60;
    button.style.visibility = visible ? "visible" : "hidden";
    button.style.left = `${Math.max(90, Math.min(viewportWidth - 90, x))}px`;
    button.style.top = `${Math.max(64, y)}px`;
  }
}

const deliverableDetails = {
  "Partner shortlist": ["4 local partners that fit Brie's cookbook launch", ["Hearth & Grain Bakery · co-host the tasting table", "Field Day Farms · supply seasonal produce", "Lumen Wine Bar · pairing flight for guests"]],
  "Collab pitch drafts": ["3 outreach emails ready to send", ["Bakery pitch · shared brunch pop-up", "Farm pitch · produce box giveaway", "Wine bar pitch · pairing night co-promo"]],
  "Vendor contact sheet": ["6 vetted vendors with rates and availability", ["Florist · $420, free Oct 18", "Photographer · $650, half day", "Rentals · tables + linens, $310"]],
  "Decor & furniture picks": ["A warm, rustic look for 40 guests", ["Long oak tables with linen runners", "Rattan pendants + candle clusters", "Herb centerpieces guests can take home"]],
  "Trend report": ["What's resonating with home cooks this month", ["Supper-club style tastings · up 38%", "Seasonal squash recipes trending", "Cook-along reels outperform photos 2×"]],
  "Event moodboard": ["Moodboard: autumn harvest supper", ["Palette: terracotta, sage, cream", "Textures: linen, wood, stoneware", "Lighting: low, warm, candlelit"]],
  "Event run-of-show": ["2-hour cookbook tasting, minute by minute", ["6:00 · welcome drinks + signing", "6:30 · three-course tasting with Brie", "7:30 · Q&A and raffle"]],
  "Venue comparison": ["3 venues compared on cost, size and vibe", ["Garden courtyard · best vibe, $1.2k", "Loft studio · best value, $850", "Wine bar back room · cozy, $980"]],
  "Tasting menu plan": ["3-course menu pulled from the cookbook", ["Roasted squash soup with sage", "Braised short rib, herb polenta", "Brown butter apple galette"]],
  "Audience & platform plan": ["Who to reach and where", ["Home cooks 25–40 · Instagram Reels", "Local foodies · TikTok + newsletters", "Gift buyers · Pinterest boards"]],
  "Promo schedule": ["2-week countdown across channels", ["Day 14 · announce + early-bird link", "Day 7 · recipe teaser reel", "Day 1 · last seats story + reminder"]],
  "Community shortlist": ["Communities likely to love Brie's cookbook", ["Brooklyn Home Cooks · 18k members", "Seasonal Kitchen Club · 9k members", "Supper Club NYC · 24k followers"]],
  "Content calendar": ["12 posts scheduled over 3 weeks", ["Mon · recipe reel", "Wed · behind-the-scenes story", "Fri · guest spotlight carousel"]],
  "Caption pack": ["10 on-brand captions, ready to paste", ["“Fall tastes like this 🍂”", "“Pull up a chair — seats are going fast”", "“The galette everyone asks about”"]],
  "Reel storyboard": ["30-second reel, 6 shots", ["Hook · butter browning close-up", "Middle · plating the galette", "End · guests' first bite + CTA"]],
  "Signal board digest": ["This week's strongest signals", ["212 tagged posts · up 41%", "Most-saved: brown butter galette", "37 requests for another event"]],
  "Top UGC roundup": ["8 guest posts worth resharing", ["@lena.bakes · galette remake", "@nycfoodie · tasting night recap", "@sam_cooks · soup cook-along"]],
  "New follower highlights": ["+1,240 followers this week", ["3 creators with 50k+ audiences", "Biggest source: tasting reel", "Top city: Brooklyn"]],
  "Sentiment check-in": ["Overall sentiment: 92% positive", ["Love: warmth and storytelling", "Ask: more vegetarian options", "Watch: ticket price comments"]],
  "Guest feedback summary": ["48 responses from the last event", ["4.8 / 5 average rating", "Favorite: the apple galette", "Request: a longer Q&A"]],
  "Brand vibe report": ["How Brie comes across online", ["Cozy, generous, a little playful", "Voice is consistent across 94% of posts", "Opportunity: more of Brie on camera"]],
};

function deliverableReviewCard(agent, item) {
  const [summary, points] = deliverableDetails[item.title] || [`${agent.name} finished this for Brie`, ["Ready for your review"]];
  return `<div class="deliverable-banner deliverable-review" data-review-id="${item.id}" style="--agent-color:${agent.color}">
    <div class="deliverable-review-head">
      <span class="deliverable-banner-icon" aria-hidden="true">${item.icon}</span>
      <span><small>New deliverable · ready for your review</small><strong>${escapeText(item.title)}</strong></span>
    </div>
    <p class="deliverable-review-summary">${escapeText(summary)}</p>
    <ul class="deliverable-review-points">${points.map((point) => `<li>${escapeText(point)}</li>`).join("")}</ul>
    <div class="deliverable-review-actions">
      <button class="review-approve" type="button" data-review-action="approve">✓ Approve &amp; use</button>
      <button class="review-changes" type="button" data-review-action="changes">Request changes</button>
      <button class="review-more" type="button" data-review-action="more">See full work ↓</button>
    </div>
    <form class="deliverable-review-feedback" hidden>
      <textarea rows="2" placeholder="What should ${escapeText(agent.name)} change?"></textarea>
      <button type="submit">Send back</button>
    </form>
  </div>`;
}

document.querySelector("#ws-body").addEventListener("click", (event) => {
  const button = event.target.closest("[data-review-action]");
  if (!button) return;
  const card = button.closest(".deliverable-review");
  const agent = selectedAgent;
  const title = card.querySelector("strong").textContent;
  const action = button.dataset.reviewAction;
  if (action === "more") {
    const next = card.nextElementSibling;
    (next?.classList.contains("agent-alert-banner") ? next.nextElementSibling : next)?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (action === "changes") {
    const form = card.querySelector(".deliverable-review-feedback");
    form.hidden = false;
    form.querySelector("textarea").focus();
    return;
  }
  card.classList.add("is-done");
  card.querySelector(".deliverable-review-actions").outerHTML = `<p class="deliverable-review-status">✓ Approved — ${escapeText(agent?.name || "your charm")} is adding it to Brie's plan.</p>`;
  card.querySelector(".deliverable-review-feedback").remove();
  showToast(`Approved “${title}”.`);
});

document.querySelector("#ws-body").addEventListener("submit", (event) => {
  const form = event.target.closest(".deliverable-review-feedback");
  if (!form) return;
  event.preventDefault();
  const card = form.closest(".deliverable-review");
  const agent = selectedAgent;
  const note = form.querySelector("textarea").value.trim();
  card.classList.add("is-done");
  card.querySelector(".deliverable-review-actions").outerHTML = `<p class="deliverable-review-status">↺ Sent back to ${escapeText(agent?.name || "your charm")}${note ? ` — “${escapeText(note)}”` : ""}. A revised version will drop in the village soon.</p>`;
  form.remove();
  if (agent) scheduleNextDelivery(agent.id, true);
  showToast(`${agent?.name || "Your charm"} is revising “${card.querySelector("strong").textContent}”.`);
});

function pickUpDeliverable(id) {
  const item = deliverables.find((candidate) => candidate.id === id);
  if (!item) return;
  deliverables = deliverables.filter((candidate) => candidate.id !== id);
  saveDeliverables();
  renderDeliverableBubbles();
  renderDashboardAgents();
  const agent = allAgents().find((candidate) => candidate.id === item.agentId);
  if (!agent) return;
  scheduleNextDelivery(agent.id);
  openAgentDetails(agent);
  wsBody.insertAdjacentHTML("afterbegin", deliverableReviewCard(agent, item));
  renderAgentAlertBanner(agent);
  showToast(`Picked up ${agent.name}'s ${item.title}.`);
}

const decisionLayer = document.querySelector("#decision-layer");
const decisionDialog = document.querySelector("#decision-dialog");
const decisionCatalog = {
  "party-curator": { topic: "Venue hold", icon: "📍", result: "Venue booking", recommended: 0, question: "Two venues are open on Sat, Nov 14. Which one should I hold for the pop-up?", options: [["Loft on 5th", "80 guests · $1,800 · exposed brick, natural light", "Place a 48-hr hold and send the floor plan to Trendsetter"], ["Garden courtyard", "120 guests · $2,600 · string lights, rain plan needed", "Hold it and price out a backup tent"], ["Rooftop bar", "60 guests · $1,200 · sunset views, tight kitchen", "Hold it and plan a smaller, no-cook menu"]] },
  matchmaker: { topic: "Partner pitch", icon: "🤝", result: "Partner pitch", recommended: 2, question: "Three local brands said yes to a collab. Who should I pitch first?", options: [["Golden Crumb Bakery", "4.8★ · 12k followers · co-hosted 3 events", "Draft a co-hosted tasting pitch"], ["Bloom & Stem florals", "4.9★ · 8k followers · wedding crowd", "Pitch florals in exchange for a vendor shout-out"], ["Third Wave coffee", "4.7★ · 21k followers · morning foot traffic", "Propose a morning pop-up and shared promo"]] },
  trendsetter: { topic: "Event theme", icon: "🎨", result: "Theme moodboard", recommended: 0, question: "Which theme should the next event lean into?", options: [["Cozy harvest", "Trending +42% · warm wood, candles, plaid", "Build a moodboard and furniture list"], ["Retro diner", "Trending +31% · checkerboard, neon, milkshakes", "Source props and a neon sign rental"], ["Minimal Scandi", "Trending +18% · linen, pale oak, greenery", "Pull a pared-back decor list under budget"]] },
  "social-butterfly": { topic: "Promo budget", icon: "📣", result: "Promo plan", recommended: 0, question: "Where should I spend this week's $300 promo budget?", options: [["Instagram Reels", "Best reach · est. 18k views", "Boost two Reels to local food lovers"], ["TikTok creators", "Best for new audiences · 3 micro-creators", "Send briefs to three creators"], ["Local newsletter", "Best conversion · 6k neighborhood readers", "Book next week's featured slot"]] },
  "wing-worm": { topic: "Caption tone", icon: "✍️", result: "Caption pack", recommended: 1, question: "Which voice should Friday's launch post use?", options: [["Warm & cozy", "“Pull up a chair — dinner's on us.”", "Write 5 captions + story copy in this voice"], ["Playful & punny", "“Lettuce celebrate, you deserve it.”", "Write 5 captions + a pun-filled reel script"], ["Bold & direct", "“Tickets drop Friday. 80 seats. Go.”", "Write a countdown series with clear CTAs"]] },
  "hype-star": { topic: "Repost request", icon: "📌", result: "Creator collab", recommended: 1, question: "A creator with 40k followers wants to repost your recipe video. How should I reply?", options: [["Yes, with credit", "Quick win · tag + link in bio", "Reply yes and send the credit line"], ["Yes + pitch a collab", "Bigger upside · propose a joint live", "Say yes and pitch a joint cook-along"], ["Not right now", "Politely decline, keep the door open", "Send a kind no and save them to contacts"]] },
  "vibe-checker": { topic: "Guest review", icon: "💬", result: "Review reply", recommended: 1, question: "A guest left a mixed 3★ review about wait times. How should I respond?", options: [["Thank + small discount", "10% off next visit · public reply", "Post the reply and issue a code"], ["Thank + invite back", "Personal note, no discount", "Post a warm public reply"], ["Reply privately", "DM to learn more first", "Message the guest and report back"]] },
};
const decisions = [];
let decisionTimer = 12;
let activeDecision = null;
let decisionTypeTimer = null;

function agentHeadY(agent) {
  if (agent.sprite) return agent.y - SPRITE_SIZE * 0.9;
  if (agent.cutoutImage) return agent.y - agent.drawHeight - 4;
  return agent.y - 70;
}

function requestDecision(agent) {
  const template = decisionCatalog[agent.id];
  if (!template || agent.awaitingDecision) return null;
  const decision = { id: `${agent.id}-decision-${Date.now()}`, agentId: agent.id, ...template };
  decisions.push(decision);
  villageAudio.deliver(agent.id);
  agent.awaitingDecision = true;
  agent.direction = "down";
  agent.targetX = agent.x;
  agent.targetY = agent.y;
  renderDecisionBubbles();
  renderDashboardAgents();
  showToast(`❗ ${agent.name} needs your call on “${template.topic}”.`);
  return decision;
}

function updateDecisions() {
  if (villageElapsed < decisionTimer) return;
  decisionTimer = villageElapsed + 40 + Math.random() * 35;
  if (decisions.length >= 2) return;
  const busy = new Set((collaboration?.members || []).map(({ agent }) => agent.id));
  const firstPick = decisions.length === 0 && villageElapsed < 30 ? allAgents().find((agent) => agent.id === "party-curator") : null;
  const candidates = allAgents().filter((agent) => !agent.awaitingDecision && !busy.has(agent.id) && decisionCatalog[agent.id]);
  const agent = firstPick && candidates.includes(firstPick) ? firstPick : candidates[Math.floor(Math.random() * candidates.length)];
  if (agent) requestDecision(agent);
}

function drawDecisionRings(cameraX, cameraY, time) {
  for (const decision of decisions) {
    const agent = allAgents().find((candidate) => candidate.id === decision.agentId);
    if (!agent) continue;
    const pulse = (Math.sin(time / 260) + 1) / 2;
    ctx.save();
    ctx.strokeStyle = `rgba(255, 214, 74, ${0.5 + pulse * 0.5})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = "rgba(255, 214, 74, .9)";
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.ellipse(agent.x - cameraX, agent.y - cameraY + 2, 30 + pulse * 6, 10 + pulse * 2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function renderDecisionBubbles() {
  if (!decisionLayer) return;
  decisionLayer.innerHTML = decisions.map((decision) => {
    const agent = allAgents().find((candidate) => candidate.id === decision.agentId);
    return `<button class="decision-bubble" type="button" data-decision-id="${decision.id}" style="--agent-color:${agent?.color || "#ffd64a"}" aria-label="${escapeText(agent?.name || "An agent")} needs your decision: ${escapeText(decision.topic)}">
      <span class="decision-bubble-mark" aria-hidden="true">!</span>
      <span class="decision-bubble-copy"><strong>Needs your call</strong><small>${escapeText(decision.topic)}</small></span>
    </button>`;
  }).join("");
}

function positionDecisionBubbles(cameraX, cameraY) {
  if (!decisionLayer) return;
  for (const button of decisionLayer.children) {
    const decision = decisions.find((candidate) => candidate.id === button.dataset.decisionId);
    const agent = decision && allAgents().find((candidate) => candidate.id === decision.agentId);
    if (!agent) continue;
    const x = agent.x - cameraX;
    const y = agentHeadY(agent) - cameraY - 8;
    const visible = x > -80 && x < viewportWidth + 80 && y > -20 && y < viewportHeight + 60;
    button.style.visibility = visible ? "visible" : "hidden";
    button.style.left = `${Math.max(80, Math.min(viewportWidth - 80, x))}px`;
    button.style.top = `${Math.max(64, y)}px`;
  }
}

function decisionAt(x, y) {
  const agent = characterAt(x, y);
  return agent && decisions.find((decision) => decision.agentId === agent.id);
}

function typeDecisionText(element, text) {
  clearInterval(decisionTypeTimer);
  element.textContent = "";
  let index = 0;
  decisionTypeTimer = setInterval(() => {
    index += 2;
    element.textContent = text.slice(0, index);
    if (index >= text.length) clearInterval(decisionTypeTimer);
  }, 22);
}

function openDecision(id) {
  const decision = decisions.find((candidate) => candidate.id === id);
  const agent = decision && allAgents().find((candidate) => candidate.id === decision.agentId);
  if (!agent) return;
  activeDecision = decision;
  const status = agentStatus(agent);
  decisionDialog.style.setProperty("--agent-color", agent.color);
  document.querySelector("#battle-agent-img").src = agent.portrait;
  document.querySelector("#battle-agent-img").alt = agent.name;
  document.querySelector("#battle-topic-icon").textContent = decision.icon;
  document.querySelector("#battle-topic").textContent = decision.topic;
  document.querySelector("#battle-name").textContent = agent.name;
  document.querySelector("#battle-role").textContent = agent.role;
  document.querySelector("#battle-progress").style.width = `${status.progress}%`;
  document.querySelector("#battle-progress-label").textContent = `${status.progress}%`;
  document.querySelector("#battle-options").innerHTML = decision.options.map(([label, detail, next], index) => `
    <button class="battle-option" type="button" data-option-index="${index}">
      <span class="battle-option-head"><span class="battle-option-num">${index + 1}</span>${index === decision.recommended ? '<span class="battle-option-tag">Recommended</span>' : ""}</span>
      <strong>${escapeText(label)}</strong>
      <small>${escapeText(detail)}</small>
      <span class="battle-option-next"><em>Next step</em>${escapeText(next || "Continue with this option")}</span>
    </button>`).join("") + `
    <button class="battle-later" type="button" data-option-index="later">Ask me later — keep this waiting in the village</button>`;
  decisionDialog.classList.remove("is-entering");
  void decisionDialog.offsetWidth;
  decisionDialog.classList.add("is-entering");
  if (!decisionDialog.open) decisionDialog.showModal();
  typeDecisionText(document.querySelector("#battle-prompt"), decision.question);
  const recommended = document.querySelectorAll("#battle-options .battle-option")[decision.recommended || 0];
  recommended?.focus();
}

function resolveDecision(optionIndex) {
  const decision = activeDecision;
  if (!decision) return;
  const agent = allAgents().find((candidate) => candidate.id === decision.agentId);
  const index = decisions.indexOf(decision);
  if (index >= 0) decisions.splice(index, 1);
  activeDecision = null;
  if (agent) {
    agent.awaitingDecision = false;
    agent.pause = 0.6;
    const [label, , next] = decision.options[optionIndex];
    queuedDeliveries[agent.id] = `${decision.result}: ${label}`;
    scheduleNextDelivery(agent.id, true);
    showToast(`${agent.name} is on it — ${next ? next.charAt(0).toLowerCase() + next.slice(1) : `going with “${label}”`}.`);
  }
  clearInterval(decisionTypeTimer);
  decisionDialog.close();
  renderDecisionBubbles();
  renderDashboardAgents();
}

function showDecisionConfirm(optionIndex) {
  const decision = activeDecision;
  if (!decision) return;
  const agent = allAgents().find((candidate) => candidate.id === decision.agentId);
  const [label, , next] = decision.options[optionIndex];
  const container = document.querySelector("#battle-options");
  container.classList.add("is-confirming");
  container.querySelectorAll(".battle-option").forEach((button, index) => {
    button.classList.toggle("is-selected", index === optionIndex);
    button.setAttribute("aria-pressed", String(index === optionIndex));
  });
  container.querySelector(".battle-confirm")?.remove();
  container.querySelector(".battle-later").hidden = true;
  container.insertAdjacentHTML("beforeend", `<div class="battle-confirm" role="alertdialog" aria-label="Confirm decision">
    <span class="battle-confirm-copy"><small>Confirm your choice</small><strong>Go with “${escapeText(label)}”?</strong><span>${escapeText(agent?.name || "Your charm")} will ${escapeText(next ? next.charAt(0).toLowerCase() + next.slice(1) : "continue with this option")}.</span></span>
    <span class="battle-confirm-actions">
      <button class="battle-confirm-back" type="button" data-confirm-action="back">Change choice</button>
      <button class="battle-confirm-go" type="button" data-confirm-action="go" data-confirm-index="${optionIndex}">Confirm &amp; continue</button>
    </span>
  </div>`);
  container.querySelector(".battle-confirm-go").focus();
}

function clearDecisionConfirm() {
  const container = document.querySelector("#battle-options");
  container.classList.remove("is-confirming");
  container.querySelector(".battle-confirm")?.remove();
  container.querySelectorAll(".battle-option").forEach((button) => { button.classList.remove("is-selected"); button.removeAttribute("aria-pressed"); });
  const later = container.querySelector(".battle-later");
  if (later) later.hidden = false;
}

document.querySelector("#battle-options").addEventListener("click", (event) => {
  const confirm = event.target.closest("[data-confirm-action]");
  if (confirm) {
    if (confirm.dataset.confirmAction === "go") resolveDecision(Number(confirm.dataset.confirmIndex));
    else {
      const selected = document.querySelector("#battle-options .battle-option.is-selected");
      clearDecisionConfirm();
      selected?.focus();
    }
    return;
  }
  const option = event.target.closest("[data-option-index]");
  if (!option) return;
  if (option.dataset.optionIndex === "later") {
    activeDecision = null;
    clearInterval(decisionTypeTimer);
    decisionDialog.close();
    return;
  }
  showDecisionConfirm(Number(option.dataset.optionIndex));
});
document.querySelector("#battle-options").addEventListener("keydown", (event) => {
  const buttons = [...document.querySelectorAll("#battle-options [data-option-index]")];
  const current = buttons.indexOf(document.activeElement);
  if (current < 0) return;
  const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: 1, ArrowUp: -1 }[event.key];
  if (!step) return;
  event.preventDefault();
  buttons[(current + step + buttons.length) % buttons.length].focus();
});
decisionDialog.querySelector("[data-close-decision]").addEventListener("click", () => decisionDialog.close());
decisionDialog.addEventListener("close", () => {
  activeDecision = null;
  clearInterval(decisionTypeTimer);
});
decisionLayer?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-decision-id]");
  if (button) openDecision(button.dataset.decisionId);
});

function characterAt(x, y) {
  const actors = [...walkers, player].sort((a, b) => b.y - a.y);
  return actors.find((actor) => {
    const hasSprite = Boolean(actor.sprite);
    const halfWidth = hasSprite ? SPRITE_SIZE * 0.4 : actor.cutoutImage ? actor.drawWidth / 2 : 23;
    const top = actor.y - (hasSprite ? SPRITE_SIZE * 0.9 : actor.cutoutImage ? actor.drawHeight + 4 : 70);
    return x >= actor.x - halfWidth && x <= actor.x + halfWidth && y >= top && y <= actor.y + 8;
  });
}

function canvasToWorld(event) {
  const rect = canvas.getBoundingClientRect();
  const { x: cameraX, y: cameraY } = getCamera();
  return {
    x: ((event.clientX - rect.left) / rect.width) * viewportWidth + cameraX,
    y: ((event.clientY - rect.top) / rect.height) * viewportHeight + cameraY,
  };
}

function animate(time) {
  const delta = Math.min((time - lastTime) / 1000 || 0, 0.04);
  lastTime = time;
  if (village.hidden) {
    requestAnimationFrame(animate);
    return;
  }
  if (agentDialog.open || collabDialog.open || decisionDialog.open) {
    draw();
    requestAnimationFrame(animate);
    return;
  }
  updateCollaboration(delta);
  updateDeliveries();
  updateDecisions();
  updateCameraPan(delta);
  updateWalkers(delta);
  const walkingAgentIds = allAgents().filter((agent) =>
    !agent.collaborating && !agent.awaitingDecision && agent.pause <= 0 &&
    Math.hypot(agent.targetX - agent.x, agent.targetY - agent.y) >= 5
  ).map(({ id }) => id);
  villageAudio.updateIdle(delta, walkingAgentIds);
  draw();
  requestAnimationFrame(animate);
}

window.addEventListener("keydown", (event) => {
  if (agentDialog.open || decisionDialog.open || village.hidden) return;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(key)) event.preventDefault();
  keys.add(key);
});
window.addEventListener("keyup", (event) => {
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  keys.delete(key);
});
window.addEventListener("blur", () => keys.clear());
window.addEventListener("resize", resizeCanvas);

canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  camera.drag = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, camX: camera.x, camY: camera.y };
  camera.moved = false;
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (camera.drag && camera.drag.pointerId === event.pointerId) {
    const rect = canvas.getBoundingClientRect();
    const dx = (event.clientX - camera.drag.startX) * (viewportWidth / rect.width);
    const dy = (event.clientY - camera.drag.startY) * (viewportHeight / rect.height);
    if (Math.hypot(dx, dy) > 5) camera.moved = true;
    if (camera.moved) {
      camera.x = camera.drag.camX - dx;
      camera.y = camera.drag.camY - dy;
      canvas.style.cursor = "grabbing";
      return;
    }
  }
  const point = canvasToWorld(event);
  canvas.style.cursor = deliverableAt(point.x, point.y) || characterAt(point.x, point.y) ? "pointer" : "grab";
});
const endCameraDrag = (event) => {
  if (!camera.drag || camera.drag.pointerId !== event.pointerId) return;
  camera.drag = null;
  canvas.style.cursor = "grab";
};
canvas.addEventListener("pointerup", endCameraDrag);
canvas.addEventListener("pointercancel", endCameraDrag);
canvas.addEventListener("click", (event) => {
  if (camera.moved) {
    camera.moved = false;
    return;
  }
  const point = canvasToWorld(event);
  const item = deliverableAt(point.x, point.y);
  if (item) {
    pickUpDeliverable(item.id);
    return;
  }
  const pendingDecision = decisionAt(point.x, point.y);
  if (pendingDecision) {
    openDecision(pendingDecision.id);
    return;
  }
  const character = characterAt(point.x, point.y);
  if (character) openAgentDetails(character);
});
deliverableLayer?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-deliverable-id]");
  if (button) pickUpDeliverable(button.dataset.deliverableId);
});

const villageSettings = document.querySelector("#village-settings");
const villageSettingsToggle = document.querySelector("#village-settings-toggle");
const villageBgUpload = document.querySelector("#village-bg-upload");
function saveVillageBackground() {
  try {
    localStorage.setItem(VILLAGE_BG_KEY, JSON.stringify(villageBackground));
  } catch {
    showToast("That image is too large to remember, but it's showing for now.");
  }
}
function renderVillageSettings() {
  for (const option of villageSettings.querySelectorAll("[data-village-theme]")) {
    option.setAttribute("aria-pressed", String(option.dataset.villageTheme === villageBackground.theme));
  }
}
villageSettingsToggle.addEventListener("click", () => {
  villageSettings.hidden = !villageSettings.hidden;
  villageSettingsToggle.setAttribute("aria-expanded", String(!villageSettings.hidden));
  renderVillageSettings();
});
villageSettings.addEventListener("click", (event) => {
  const option = event.target.closest("[data-village-theme]");
  if (!option) return;
  if (option.dataset.villageTheme === "custom" && !villageBackground.image) {
    villageBgUpload.click();
    return;
  }
  villageBackground.theme = option.dataset.villageTheme;
  saveVillageBackground();
  renderVillageSettings();
});
villageBgUpload.addEventListener("change", () => {
  const file = villageBgUpload.files?.[0];
  villageBgUpload.value = "";
  if (!file) return;
  const source = new Image();
  const url = URL.createObjectURL(file);
  source.addEventListener("load", () => {
    const scale = Math.min(1, 1800 / source.width);
    const resized = document.createElement("canvas");
    resized.width = Math.round(source.width * scale);
    resized.height = Math.round(source.height * scale);
    resized.getContext("2d").drawImage(source, 0, 0, resized.width, resized.height);
    URL.revokeObjectURL(url);
    villageBackground = { theme: "custom", image: resized.toDataURL("image/jpeg", 0.82) };
    villageBgImage.src = villageBackground.image;
    saveVillageBackground();
    renderVillageSettings();
  });
  source.src = url;
});
document.addEventListener("click", (event) => {
  if (!villageSettings.hidden && !event.target.closest(".village-settings-wrap")) {
    villageSettings.hidden = true;
    villageSettingsToggle.setAttribute("aria-expanded", "false");
  }
});

dashboardAgents.addEventListener("click", (event) => {
  const card = event.target.closest("[data-agent-id]");
  if (!card) return;
  const agent = allAgents().find((candidate) => candidate.id === card.dataset.agentId);
  if (agent) openAgentDetails(agent);
});
collabBubble.addEventListener("click", () => {
  if (!collabDialog.open) collabDialog.showModal();
});
document.querySelector("#ws-body").addEventListener("click", (event) => {
  const chip = event.target.closest("[data-pin-filter]");
  if (!chip) return;
  const filter = chip.dataset.pinFilter;
  for (const other of wsBody.querySelectorAll("[data-pin-filter]")) other.setAttribute("aria-pressed", String(other === chip));
  for (const pin of wsBody.querySelectorAll(".pin")) pin.hidden = filter !== "all" && pin.dataset.pinType !== filter;
});
document.querySelector("#collab-close").addEventListener("click", () => collabDialog.close());
collabDialog.addEventListener("click", (event) => {
  if (event.target === collabDialog) collabDialog.close();
});
document.querySelector(".dash-main").addEventListener("click", (event) => {
  const tabLink = event.target.closest("[data-dashboard-tab]");
  if (!tabLink) return;
  event.preventDefault();
  showDashboardTab(tabLink.dataset.dashboardTab);
});
document.querySelector("#agent-work-list").addEventListener("click", (event) => {
  if (event.target.closest("form")) return;
  const card = event.target.closest("[data-agent-id]");
  if (!card) return;
  const agent = allAgents().find((candidate) => candidate.id === card.dataset.agentId);
  if (agent) openAgentDetails(agent);
});
document.querySelector("#agent-work-list").addEventListener("submit", (event) => {
  const form = event.target.closest("[data-agent-task]");
  if (!form) return;
  event.preventDefault();
  const task = String(new FormData(form).get("task") || "").trim();
  if (!task) return;
  const agentId = form.dataset.agentTask;
  agentTasks[agentId] = task;
  localStorage.setItem(AGENT_TASKS_KEY, JSON.stringify(agentTasks));
  queuedDeliveries[agentId] = task;
  scheduleNextDelivery(agentId, true);
  renderDashboardAgents();
  renderAgentWorkList();
  const agent = allAgents().find((candidate) => candidate.id === agentId);
  showToast(`Task assigned to ${agent?.name || "your agent"}.`);
});
document.querySelector(".dash-nav").addEventListener("click", (event) => {
  const tabLink = event.target.closest("[data-dashboard-tab]");
  if (!tabLink) return;
  event.preventDefault();
  showDashboardTab(tabLink.dataset.dashboardTab);
});
document.querySelector("#goal-editor-list").addEventListener("change", (event) => {
  const row = event.target.closest("[data-goal-index]");
  if (!row) return;
  const index = Number(row.dataset.goalIndex);
  if (event.target.matches(".goal-title-input")) businessGoals[index].title = event.target.value.trim() || "New business goal";
  else if (event.target.matches(".goal-target-input")) businessGoals[index].target = event.target.value.trim();
  else if (event.target.type === "number") businessGoals[index].progress = Math.max(0, Math.min(100, Number(event.target.value) || 0));
  saveBusinessGoals();
});
document.querySelector("#goal-editor-list").addEventListener("click", (event) => {
  const removeButton = event.target.closest(".remove-goal");
  if (!removeButton) return;
  const row = removeButton.closest("[data-goal-index]");
  businessGoals.splice(Number(row.dataset.goalIndex), 1);
  saveBusinessGoals();
});
document.querySelector("#add-goal").addEventListener("click", () => {
  businessGoals.push({ title: "New business goal", target: "", progress: 0 });
  saveBusinessGoals();
  document.querySelector("#goal-editor-list .goal-editor:last-child .goal-title-input")?.focus();
});
document.querySelector("#enter-village").addEventListener("click", () => travelToVillage());
document.querySelector("#back-to-dashboard").addEventListener("click", () => showView("dashboard"));

agentList.addEventListener("click", (event) => {
  const card = event.target.closest("[data-agent-id]");
  if (!card) return;
  const agent = allAgents().find((candidate) => candidate.id === card.dataset.agentId);
  if (agent) handleAgentAlert(agent);
});

agentDialog.addEventListener("close", () => {
  selectedAgent = null;
  keys.clear();
});
agentDialog.addEventListener("click", (event) => {
  if (event.target === agentDialog) agentDialog.close();
});
document.querySelector("#dialog-close").addEventListener("click", () => agentDialog.close());
document.querySelector("#ws-body").addEventListener("click", (event) => {
  const venueCard = event.target.closest("[data-venue-id]");
  if (venueCard) openVenueDesigner(venueCard.dataset.venueId);
});
designerProducts.addEventListener("click", (event) => {
  const button = event.target.closest("[data-furniture-id]");
  if (!button || !selectedVenueId) return;
  const id = button.dataset.furnitureId;
  const selected = venueFurniture[selectedVenueId] || [];
  if (selected.some((item) => item.id === id)) {
    venueFurniture[selectedVenueId] = selected.filter((item) => item.id !== id);
  } else {
    const positions = {
      "banquet-table": [50, 57], "bistro-table": [30, 42], "chair-set": [70, 57],
      "lounge-sofa": [25, 72], "area-rug": [50, 66], florals: [50, 45],
      "floor-lamp": [83, 39], "string-lights": [50, 22],
    };
    const [x, y] = positions[id] || [50, 50];
    venueFurniture[selectedVenueId] = [...selected, { id, x, y }];
  }
  saveVenueFurniture();
  renderVenueFurniture();
});
designerRoomStage.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-furniture]");
  if (removeButton) removeFurniture(removeButton.dataset.removeFurniture);
});
let draggedFurniture = null;
designerRoomStage.addEventListener("pointerdown", (event) => {
  const item = event.target.closest(".room-furniture-item");
  if (!item || event.target.closest(".room-furniture-remove") || event.button !== 0) return;
  const record = (venueFurniture[selectedVenueId] || []).find(({ id }) => id === item.dataset.placedId);
  if (!record) return;
  draggedFurniture = { item, record, pointerId: event.pointerId };
  item.classList.add("is-dragging");
  item.setPointerCapture(event.pointerId);
  event.preventDefault();
});
designerRoomStage.addEventListener("pointermove", (event) => {
  if (!draggedFurniture || draggedFurniture.pointerId !== event.pointerId) return;
  const bounds = designerRoomStage.getBoundingClientRect();
  draggedFurniture.record.x = Math.min(92, Math.max(8, ((event.clientX - bounds.left) / bounds.width) * 100));
  draggedFurniture.record.y = Math.min(89, Math.max(12, ((event.clientY - bounds.top) / bounds.height) * 100));
  draggedFurniture.item.style.left = `${draggedFurniture.record.x}%`;
  draggedFurniture.item.style.top = `${draggedFurniture.record.y}%`;
});
designerRoomStage.addEventListener("pointerup", (event) => {
  if (!draggedFurniture || draggedFurniture.pointerId !== event.pointerId) return;
  draggedFurniture.item.classList.remove("is-dragging");
  draggedFurniture.item.releasePointerCapture(event.pointerId);
  draggedFurniture = null;
  saveVenueFurniture();
});
designerRoomStage.addEventListener("pointercancel", () => {
  draggedFurniture?.item.classList.remove("is-dragging");
  draggedFurniture = null;
});
designerRoomStage.addEventListener("keydown", (event) => {
  const item = event.target.closest(".room-furniture-item");
  if (!item || !selectedVenueId) return;
  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    removeFurniture(item.dataset.placedId);
    return;
  }
  const record = (venueFurniture[selectedVenueId] || []).find(({ id }) => id === item.dataset.placedId);
  if (!record || !["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)) return;
  event.preventDefault();
  const step = event.shiftKey ? 5 : 2;
  if (event.key === "ArrowLeft") record.x = Math.max(8, record.x - step);
  if (event.key === "ArrowRight") record.x = Math.min(92, record.x + step);
  if (event.key === "ArrowUp") record.y = Math.max(12, record.y - step);
  if (event.key === "ArrowDown") record.y = Math.min(89, record.y + step);
  item.style.left = `${record.x}%`;
  item.style.top = `${record.y}%`;
  saveVenueFurniture();
});
designerReturnButton.addEventListener("click", async () => {
  if (document.fullscreenElement === venueDesigner) await document.exitFullscreen();
  venueDesigner.classList.remove("is-fullscreen");
  updateFullscreenButton();
  const agent = designerReturnAgent;
  showView("village");
  designerReturnAgent = null;
  if (agent) openAgentDetails(agent);
});
document.querySelector("#designer-reset").addEventListener("click", () => {
  if (!selectedVenueId) return;
  venueFurniture[selectedVenueId] = [];
  saveVenueFurniture();
  renderVenueFurniture();
});
designerFullscreenButton.addEventListener("click", async () => {
  if (document.fullscreenElement === venueDesigner) {
    await document.exitFullscreen();
    venueDesigner.classList.remove("is-fullscreen");
    updateFullscreenButton();
    return;
  }
  if (venueDesigner.classList.contains("is-fullscreen")) {
    venueDesigner.classList.remove("is-fullscreen");
    updateFullscreenButton();
    return;
  }
  venueDesigner.classList.add("is-fullscreen");
  updateFullscreenButton();
  try {
    await venueDesigner.requestFullscreen();
    if (document.fullscreenElement === venueDesigner) venueDesigner.classList.remove("is-fullscreen");
  } catch {
    document.querySelector("#designer-feedback").textContent = "Full screen isn't available here; the planner still fills the page.";
  }
  updateFullscreenButton();
});
document.addEventListener("fullscreenchange", updateFullscreenButton);
document.querySelector("#venue-room-furniture").addEventListener("dblclick", (event) => {
  const item = event.target.closest(".room-furniture-item");
  if (item && !event.target.closest(".room-furniture-remove")) removeFurniture(item.dataset.placedId);
});

document.querySelector("#reset-button").addEventListener("click", () => {
  camera.x = (world.width - viewportWidth) / 2;
  camera.y = (world.height - viewportHeight) / 2;
  for (const agent of allAgents()) {
    agent.x = agent.homeX;
    agent.y = agent.homeY;
    agent.targetX = agent.homeX;
    agent.targetY = agent.homeY;
    agent.direction = "down";
    agent.frame = 0;
    agent.pause = 0.2 + Math.random() * 1.5;
  }
  keys.clear();
  renderAgents();
  if (agentDialog.open) agentDialog.close();
  showToast("A fresh little village, ready to grow.");
});

resizeCanvas();
renderAgents();
renderDeliverableBubbles();
renderDashboardAgents();
renderAgentWorkList();
renderBusinessGoals();
showDashboardTab("home");
showView("title");
requestAnimationFrame(animate);


// First-time setup wizard: goals → what to improve → dashboard.
const onboardingSteps = [...onboarding.querySelectorAll(".onboarding-step")];
const onboardingDots = [...onboarding.querySelectorAll(".onboarding-steps i")];
const onboardingNext = document.querySelector("#onboarding-next");
const onboardingBack = document.querySelector("#onboarding-back");
const onboardingPicked = document.querySelector("#onboarding-picked");
const onboardingCount = document.querySelector("#onboarding-count");
let onboardingStep = 0;
const villageSetup = { goals: [], improve: [], note: "" };

function selectedIn(step) {
  return [...onboardingSteps[step].querySelectorAll('[aria-checked="true"]')];
}

const problemInput = document.querySelector("#onboarding-note");
const micButton = document.querySelector("#mic-button");
const micLabel = document.querySelector("#mic-label");
const problemStatus = document.querySelector("#problem-status");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognizer = null;
let recordingBase = "";

function stopRecording() {
  recognizer?.stop();
}

function setRecording(on) {
  micButton.classList.toggle("is-recording", on);
  micButton.setAttribute("aria-pressed", String(on));
  micLabel.textContent = on ? "Stop" : "Record";
  problemStatus.textContent = on ? "Listening… speak naturally" : "";
}

if (!SpeechRecognition) {
  micButton.disabled = true;
  micButton.title = "Voice input isn't supported in this browser";
} else {
  micButton.addEventListener("click", () => {
    if (recognizer) return stopRecording();
    recognizer = new SpeechRecognition();
    recognizer.continuous = true;
    recognizer.interimResults = true;
    recognizer.lang = navigator.language || "en-US";
    recordingBase = problemInput.value.trim();
    recognizer.onresult = (event) => {
      const spoken = [...event.results].map((r) => r[0].transcript).join("").trim();
      problemInput.value = [recordingBase, spoken].filter(Boolean).join(" ");
      renderOnboarding();
    };
    recognizer.onerror = (event) => {
      problemStatus.textContent = event.error === "not-allowed" ? "Microphone access was blocked" : "Couldn't hear that, try again";
    };
    recognizer.onend = () => {
      const message = problemStatus.textContent.startsWith("Listening") ? "" : problemStatus.textContent;
      recognizer = null;
      setRecording(false);
      problemStatus.textContent = message;
    };
    recognizer.start();
    setRecording(true);
  });
}
problemInput.addEventListener("input", () => renderOnboarding());

function renderOnboarding() {
  onboardingSteps.forEach((el, i) => { el.hidden = i !== onboardingStep; });
  onboardingDots.forEach((dot, i) => {
    dot.classList.toggle("is-active", i === onboardingStep);
    dot.classList.toggle("is-done", i < onboardingStep);
  });
  onboardingCount.textContent = `Step ${onboardingStep + 1} of ${onboardingSteps.length}`;
  const last = onboardingStep === onboardingSteps.length - 1;
  if (last) {
    const ready = problemInput.value.trim().length >= 3;
    onboardingNext.disabled = !ready;
    onboardingPicked.textContent = ready ? "" : "Type or record your problem";
  } else {
    const count = selectedIn(onboardingStep).length;
    onboardingNext.disabled = count === 0;
    onboardingPicked.textContent = count ? `${count} selected` : "Pick at least one";
  }
  onboardingNext.innerHTML = last ? 'Get started <span aria-hidden="true">✦</span>' : 'Continue <span aria-hidden="true">→</span>';
  onboardingBack.textContent = onboardingStep ? "← Back" : "← Title";
}

function startOnboarding() {
  onboardingStep = 0;
  onboarding.querySelectorAll("[role=checkbox]").forEach((el) => el.setAttribute("aria-checked", "false"));
  stopRecording();
  document.querySelector("#onboarding-note").value = "";
  problemStatus.textContent = "";
  showView("onboarding");
  renderOnboarding();
}

onboarding.querySelectorAll("[role=checkbox]").forEach((option) => {
  option.addEventListener("click", () => {
    option.setAttribute("aria-checked", String(option.getAttribute("aria-checked") !== "true"));
    renderOnboarding();
  });
});

onboardingBack.addEventListener("click", () => {
  stopRecording();
  if (onboardingStep === 0) return showView("title");
  onboardingStep -= 1;
  renderOnboarding();
});

onboardingNext.addEventListener("click", () => {
  if (onboardingNext.disabled) return;
  if (onboardingStep < onboardingSteps.length - 1) {
    onboardingStep += 1;
    renderOnboarding();
    return;
  }
  stopRecording();
  villageSetup.goals = selectedIn(0).map((el) => el.querySelector("strong").textContent);
  villageSetup.note = problemInput.value.trim();
  villageSetup.improve = [];
  businessGoals = villageSetup.goals.map((title) => ({ title, target: "", progress: 0 }));
  saveBusinessGoals();
  const project = {
    id: `village-${Date.now()}`,
    name: `${villageSetup.goals[0]} village`,
    goals: villageSetup.goals,
    swatch: "linear-gradient(135deg, #ff7a3d, #ff4f8b 55%, #7b6cff)",
  };
  saveProjects([project, ...loadProjects()]);
  const focus = (list) => list.slice(0, 2).join(" & ").toLowerCase();
  const snippet = villageSetup.note.length > 70 ? `${villageSetup.note.slice(0, 70).trim()}…` : villageSetup.note;
  dressAgentsAsChefs();
  runWarp({
    label: "Building your dashboard",
    view: "dashboard",
    duration: 5200,
    cast: true,
    onArrive: () => openProject(project),
    messages: [
      `Taking your opportunity space into consideration: ${focus(villageSetup.goals)}…`,
      `Weighing the problem you described: “${snippet}”`,
      "Building your dashboard around what matters most…",
      "Suiting up your agents in chef whites for Brie's kitchen…",
      "Your village is almost ready…",
    ],
  });
});

// Projects: saved villages you can load from the title screen or switch to from the dashboard.
const PROJECTS_KEY = "charmz-projects";
const defaultProjects = [
  { id: "cookbook-launch", name: "Brie's cookbook launch", goals: ["Grow revenue", "Reach more customers"], swatch: "linear-gradient(135deg, #ff7a3d, #ff4f8b)" },
  { id: "summer-popups", name: "Summer pop-up dinners", goals: ["Host events", "Build partnerships"], swatch: "linear-gradient(135deg, #ffb347, #ff5c8c)" },
  { id: "holiday-guide", name: "Holiday gift guide", goals: ["Create effective content", "Track business performance"], swatch: "linear-gradient(135deg, #7b6cff, #43d9c8)" },
];
const projectList = document.querySelector("#project-list");
let currentProjectId = "cookbook-launch";
let projectsReturnView = "title";

function loadProjects() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROJECTS_KEY));
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {}
  return defaultProjects.map((project) => ({ ...project }));
}

function saveProjects(projects) {
  try { localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects)); } catch {}
}

function escapeText(text) {
  return String(text).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
}

function openProjects(returnView = document.body.dataset.view === "dashboard" ? "dashboard" : "title") {
  projectsReturnView = returnView;
  projectList.innerHTML = loadProjects().map((project) => `
    <li><button class="project-card${project.id === currentProjectId ? " is-current" : ""}" type="button" data-project-id="${escapeText(project.id)}">
      <span class="project-swatch" style="--swatch: ${escapeText(project.swatch || "")}" aria-hidden="true"></span>
      <span><strong>${escapeText(project.name)}</strong><small>${escapeText((project.goals || []).join(" · "))}</small></span>
      <span class="project-meta">${project.id === currentProjectId ? "Current" : "7 charmz"}</span>
    </button></li>`).join("");
  document.querySelector("#projects-back").textContent = returnView === "dashboard" ? "← Back to dashboard" : "← Back to title";
  showView("projects");
}

function openProject(project) {
  currentProjectId = project.id;
  document.querySelector("#dash-project-name").textContent = project.name;
  const sub = document.querySelector(".dash-header p");
  if (sub && project.goals?.length) sub.textContent = `${project.name} · focused on ${project.goals.join(", ").toLowerCase()}.`;
  if (!titleScreen.hidden) {
    titleScreen.classList.add("is-leaving");
    setTimeout(() => showView("dashboard"), 420);
  } else {
    showView("dashboard");
  }
}

projectList.addEventListener("click", (event) => {
  const card = event.target.closest("[data-project-id]");
  if (!card) return;
  const project = loadProjects().find((p) => p.id === card.dataset.projectId);
  if (project) openProject(project);
});
document.querySelector("#projects-back").addEventListener("click", () => showView(projectsReturnView));
document.querySelector("#projects-new").addEventListener("click", () => startOnboarding());
document.querySelector("#dash-menu").addEventListener("click", (event) => { event.preventDefault(); showView("title"); });
document.querySelector("#dash-switch").addEventListener("click", (event) => { event.preventDefault(); openProjects("dashboard"); });
