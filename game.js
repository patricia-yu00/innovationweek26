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

const world = { width: 1800, height: 1100 };
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
  makeWalker("Party curator", 1180, 760, {
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
  makeWalker("Vibe checker", 1500, 620, {
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
let controlledCharacter = player;
let selectedAgent = null;
const keys = new Set();

let lastTime = 0;
let toastTimer;
let viewportWidth = 0;
let viewportHeight = 0;


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

function agentStatus(agent) {
  const loadout = agentLoadouts[agent.id];
  if (!loadout) return { text: agent.role, progress: 0 };
  const active = loadout.quests.find(([, state]) => state === "active") || loadout.quests[0];
  return { text: active[0], progress: loadout.progress };
}

function renderAgents() {
  agentList.innerHTML = allAgents().map((agent) => {
    const status = agentStatus(agent);
    const isYou = agent === controlledCharacter;
    return `
    <button class="agent-card${isYou ? " is-controlled" : ""}" type="button" data-agent-id="${agent.id}" style="--agent-color:${agent.color}" aria-label="${agent.name}: ${escapeText(status.text)}, ${status.progress}% done" aria-pressed="${isYou}" title="${escapeText(status.text)}">
      <span class="agent-avatar" style="--avatar-background:${agent.color};--avatar-ink:${agent.ink}" aria-hidden="true"><img src="${agent.portrait}" alt="" /></span>
      <span class="agent-card-copy">
        <span class="agent-name-line">${agent.name}${isYou ? '<span class="agent-you">You</span>' : '<span class="agent-card-dot" aria-hidden="true"></span>'}</span>
        <span class="agent-role">${escapeText(status.text)}</span>
        <span class="agent-meter" aria-hidden="true"><i style="width:${status.progress}%"></i></span>
      </span>
    </button>`;
  }).join("");
}

function renderDashboardAgents() {
  dashboardAgents.innerHTML = allAgents().map((agent) => `
    <button class="meatz-row" type="button" data-agent-id="${agent.id}" aria-label="Learn more about ${agent.name}, ${agent.role}">
      <span class="agent-avatar" style="--avatar-background:${agent.color};--avatar-ink:${agent.ink}" aria-hidden="true"><img src="${agent.portrait}" alt="" /></span>
      <span class="meatz-copy">
        <span class="meatz-title"><strong>${agent.name}</strong><span class="meatz-role">${agent.role}</span></span>
        <span class="meatz-task">${agent.task.replace(/[“”]/g, "")}</span>
      </span>
      <span class="meatz-badge">Working</span>
    </button>
  `).join("");
}

function showView(view) {
  const isVillage = view === "village";
  const isTitle = view === "title";
  titleScreen.hidden = !isTitle;
  quitScreen.hidden = view !== "quit";
  aboutScreen.hidden = view !== "about";
  if (view === "about") renderAboutCast();
  dashboard.hidden = view !== "dashboard";
  onboarding.hidden = view !== "onboarding";
  village.hidden = !isVillage;
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
    img.className = "title-meatz";
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
document.querySelector("#menu-load").addEventListener("click", () => openProjects());
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
  if (titleScreen.hidden || document.querySelector("#projects-dialog").open) return;
  if (event.key === "ArrowDown" || event.key === "s") { event.preventDefault(); selectMenu(menuIndex + 1); }
  else if (event.key === "ArrowUp" || event.key === "w") { event.preventDefault(); selectMenu(menuIndex - 1); }
  else if (event.key === "Enter" && document.activeElement?.tagName !== "BUTTON") { event.preventDefault(); menuButtons[menuIndex].click(); }
});

const warp = document.querySelector("#warp");
const warpMessage = document.querySelector("#warp-message");
const warpBar = document.querySelector("#warp-bar");
const warpMessages = [
  "Curating your agents…",
  "Waking up the meatz…",
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
        ["Ember Supper Club", "60 guests · open kitchen", "$$", "Top pick", "linear-gradient(135deg,#ff7a3d,#5a1c2c)"],
        ["Pages & Pantry Books", "45 guests · reading nook", "$", "Cozy", "linear-gradient(135deg,#ffcf7a,#6b3a1c)"],
        ["Rooftop Greenhouse", "80 guests · string lights", "$$$", "Stretch", "linear-gradient(135deg,#63e0d8,#1c3a3a)"],
      ].map(([name, meta, price, tag, bg]) => `
        <article class="venue-card"><div class="venue-photo" style="background:${bg}"><span>${tag}</span></div><strong>${name}</strong><p>${meta} · ${price}</p></article>`).join("")}
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
    quest: "Turning launch buzz into content",
    title: "Fan content wall",
    sub: "Posts from the launch worth resharing",
    sources: [["launch-recap.md", "doc"], ["tagged-posts.csv", "sheet"], ["content-calendar.md", "doc"], ["ugc-clips/", "folder", "27 clips"]],
    body: () => `<div class="ws-ugc">
      ${[
        ["@sam.bakes", "made the miso cookies 😍", "4.1k", "linear-gradient(135deg,#ff9a4a,#ff4f8b)"],
        ["@dinnerwithdee", "signed copy!!", "2.8k", "linear-gradient(135deg,#7b6bff,#63e0d8)"],
        ["@cookbookclubla", "our Nov pick ✨", "1.9k", "linear-gradient(135deg,#c8ff5c,#2f8f6b)"],
        ["@mo_eats", "that tasting menu…", "1.2k", "linear-gradient(135deg,#ffcf7a,#ff6f3d)"],
      ].map(([handle, cap, likes, bg]) => `<figure class="ugc-tile"><div class="ugc-img" style="background:${bg}"><span>♥ ${likes}</span></div><figcaption><b>${handle}</b>${cap}</figcaption></figure>`).join("")}
    </div>
    <ul class="ws-plan">${[["Mon", "Repost fan bakes as a carousel"], ["Wed", "Behind-the-scenes reel"], ["Fri", "Recipe from the book, live"]].map(([d, t]) => `<li><b>${d}</b>${t}</li>`).join("")}</ul>`,
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
const COSTUME_KEY = "sweetmeatz-costumes";
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
  dialogTask.textContent = loadout.task;
  dialogNote.textContent = agent.role;
  wsEyebrow.textContent = `The ${agent.name} workspace`;
  wsTitle.textContent = workspace.title;
  wsSub.textContent = workspace.sub;
  wsBody.innerHTML = workspace.body();
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
  joinAgentButton.disabled = agent === controlledCharacter;
  joinAgentButton.innerHTML = agent === controlledCharacter
    ? "You're already with them <span aria-hidden=\"true\">✓</span>"
    : "Go wander with them <span aria-hidden=\"true\">→</span>";
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
  ctx.fillStyle = "#050405";
  ctx.fillRect(0, 0, viewportWidth, viewportHeight);

  ctx.save();
  ctx.translate(-cameraX, -cameraY);
  ctx.fillStyle = "#070607";
  ctx.fillRect(0, 0, world.width, world.height);

  const glows = [
    [850, 545, 720, "rgba(255, 90, 60, 0.11)"],
    [1340, 310, 440, "rgba(99, 224, 216, 0.08)"],
    [380, 860, 420, "rgba(123, 107, 255, 0.10)"],
    [1450, 900, 360, "rgba(200, 255, 92, 0.06)"],
  ];
  for (const [gx, gy, radius, color] of glows) {
    const gradient = ctx.createRadialGradient(gx, gy, 0, gx, gy, radius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(5, 4, 5, 0)");
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
  ctx.strokeStyle = "rgba(255, 255, 255, 0.035)";
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

  drawTree(300, 390, 1.1, 0, time);
  drawTree(480, 750, 0.9, 1, time);
  drawTree(1320, 790, 1.15, 2, time);
  drawTree(1510, 500, 0.8, 3, time);
  drawTree(1020, 230, 0.75, 4, time);
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
  const y = actor.y - cameraY;
  const moving = isControlled
    ? keys.has("ArrowUp") || keys.has("w") || keys.has("ArrowDown") || keys.has("s") ||
      keys.has("ArrowLeft") || keys.has("a") || keys.has("ArrowRight") || keys.has("d")
    : Math.hypot(actor.targetX - actor.x, actor.targetY - actor.y) > 3;

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

function updatePlayer(delta) {
  let dx = 0;
  let dy = 0;
  if (keys.has("ArrowLeft") || keys.has("a")) dx -= 1;
  if (keys.has("ArrowRight") || keys.has("d")) dx += 1;
  if (keys.has("ArrowUp") || keys.has("w")) dy -= 1;
  if (keys.has("ArrowDown") || keys.has("s")) dy += 1;

  const actor = controlledCharacter;
  if (dx || dy) {
    const length = Math.hypot(dx, dy);
    actor.x += (dx / length) * actor.playerSpeed * delta;
    actor.y += (dy / length) * actor.playerSpeed * delta;
    if (Math.abs(dx) > Math.abs(dy)) actor.direction = dx > 0 ? "right" : "left";
    else actor.direction = dy > 0 ? "down" : "up";
    actor.frame += delta * 9;
  } else {
    actor.frame = 0;
  }
  actor.x = Math.max(45, Math.min(world.width - 45, actor.x));
  actor.y = Math.max(70, Math.min(world.height - 30, actor.y));
}

function updateWalkers(delta) {
  for (const walker of [player, ...walkers]) {
    if (walker === controlledCharacter) continue;
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
  return {
    x: axis(controlledCharacter.x - viewportWidth / 2, 0, world.width - viewportWidth),
    y: axis(controlledCharacter.y - (viewportHeight + hud) / 2, -hud, world.height - viewportHeight),
  };
}

function draw() {
  const { x: cameraX, y: cameraY } = getCamera();
  drawDefaultBackground(cameraX, cameraY, performance.now());

  const actors = [...walkers, player].sort((a, b) => a.y - b.y);
  for (const actor of actors) drawPerson(actor, actor === controlledCharacter, cameraX, cameraY);
}

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
  updatePlayer(delta);
  updateWalkers(delta);
  draw();
  requestAnimationFrame(animate);
}

window.addEventListener("keydown", (event) => {
  if (agentDialog.open || village.hidden) return;
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

canvas.addEventListener("click", (event) => {
  const point = canvasToWorld(event);
  const character = characterAt(point.x, point.y);
  if (character) openAgentDetails(character);
});
canvas.addEventListener("pointermove", (event) => {
  const point = canvasToWorld(event);
  canvas.style.cursor = characterAt(point.x, point.y) ? "pointer" : "default";
});

dashboardAgents.addEventListener("click", (event) => {
  const card = event.target.closest("[data-agent-id]");
  if (!card) return;
  const agent = allAgents().find((candidate) => candidate.id === card.dataset.agentId);
  if (agent) openAgentDetails(agent);
});
document.querySelector("#enter-village").addEventListener("click", () => travelToVillage());
document.querySelector("#back-to-dashboard").addEventListener("click", () => showView("dashboard"));

agentList.addEventListener("click", (event) => {
  const card = event.target.closest("[data-agent-id]");
  if (!card) return;
  const agent = allAgents().find((candidate) => candidate.id === card.dataset.agentId);
  if (agent) openAgentDetails(agent);
});

joinAgentButton.addEventListener("click", () => {
  if (!selectedAgent || selectedAgent === controlledCharacter) return;
  controlledCharacter = selectedAgent;
  controlledCharacter.targetX = controlledCharacter.x;
  controlledCharacter.targetY = controlledCharacter.y;
  controlledCharacter.pause = 0;
  keys.clear();
  renderAgents();
  agentDialog.close();
  const announce = () => showToast(`You're wandering with ${controlledCharacter.name}.`);
  if (village.hidden) travelToVillage(announce);
  else announce();
});

agentDialog.addEventListener("close", () => {
  selectedAgent = null;
  keys.clear();
});
agentDialog.addEventListener("click", (event) => {
  if (event.target === agentDialog) agentDialog.close();
});
document.querySelector("#dialog-close").addEventListener("click", () => agentDialog.close());

document.querySelector("#reset-button").addEventListener("click", () => {
  controlledCharacter = player;
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
renderDashboardAgents();
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
const PROJECTS_KEY = "sweetmeatz-projects";
const defaultProjects = [
  { id: "cookbook-launch", name: "Brie's cookbook launch", goals: ["Sell more cookbooks", "Grow my audience"], swatch: "linear-gradient(135deg, #ff7a3d, #ff4f8b)" },
  { id: "summer-popups", name: "Summer pop-up dinners", goals: ["Book events & venues", "Find brand partners"], swatch: "linear-gradient(135deg, #ffb347, #ff5c8c)" },
  { id: "holiday-guide", name: "Holiday gift guide", goals: ["Create more content", "Track my metrics"], swatch: "linear-gradient(135deg, #7b6cff, #43d9c8)" },
];
const projectsDialog = document.querySelector("#projects-dialog");
const projectList = document.querySelector("#project-list");
let currentProjectId = "cookbook-launch";

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

function openProjects() {
  projectList.innerHTML = loadProjects().map((project) => `
    <li><button class="project-card${project.id === currentProjectId ? " is-current" : ""}" type="button" data-project-id="${escapeText(project.id)}">
      <span class="project-swatch" style="--swatch: ${escapeText(project.swatch || "")}" aria-hidden="true"></span>
      <span><strong>${escapeText(project.name)}</strong><small>${escapeText((project.goals || []).join(" · "))}</small></span>
      <span class="project-meta">${project.id === currentProjectId ? "Current" : "7 meatz"}</span>
    </button></li>`).join("");
  if (!projectsDialog.open) projectsDialog.showModal();
}

function openProject(project) {
  currentProjectId = project.id;
  document.querySelector("#dash-project-name").textContent = project.name;
  const sub = document.querySelector(".dash-header p");
  if (sub && project.goals?.length) sub.textContent = `${project.name} · focused on ${project.goals.join(", ").toLowerCase()}.`;
  if (projectsDialog.open) projectsDialog.close();
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
document.querySelector("#projects-close").addEventListener("click", () => projectsDialog.close());
document.querySelector("#projects-new").addEventListener("click", () => { projectsDialog.close(); createVillage(); });
projectsDialog.addEventListener("click", (event) => { if (event.target === projectsDialog) projectsDialog.close(); });
document.querySelector("#dash-menu").addEventListener("click", (event) => { event.preventDefault(); showView("title"); });
document.querySelector("#dash-switch").addEventListener("click", (event) => { event.preventDefault(); openProjects(); });
