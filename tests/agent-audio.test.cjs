const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "assets/agent-audio.js"), "utf8");
const flush = async () => {
  for (let index = 0; index < 12; index += 1) await Promise.resolve();
};

function setup({ muted = false, fail = false } = {}) {
  const storage = new Map([["charmz-audio-muted", String(muted)]]);
  const documentEvents = {};
  const windowEvents = {};
  const attrs = {};
  const label = {};
  const warnings = [];
  const errors = [];
  const sources = [];
  const fetches = [];
  const button = {
    setAttribute: (key, value) => { attrs[key] = value; },
    querySelector: () => label,
    addEventListener: () => {},
  };
  class AudioContext {
    constructor() {
      this.state = "suspended";
      this.destination = {};
    }
    addEventListener() {}
    resume() { this.state = "running"; return Promise.resolve(); }
    decodeAudioData(data) { return Promise.resolve({ url: data }); }
    createBufferSource() {
      const node = {
        connect() {},
        disconnect() { this.disconnected = true; },
        start() { this.started = true; },
        stop() { this.stopped = true; },
      };
      sources.push(node);
      return node;
    }
    createGain() {
      return { gain: {}, connect() {}, disconnect() {} };
    }
  }
  const sandbox = {
    window: { AudioContext, addEventListener: (event, cb) => { windowEvents[event] = cb; } },
    document: { hidden: false, addEventListener: (event, cb) => { documentEvents[event] = cb; } },
    localStorage: { getItem: (key) => storage.get(key), setItem: (key, value) => storage.set(key, value) },
    console: { warn: (...args) => warnings.push(args) },
    fetch: async (url) => {
      fetches.push(url);
      return { ok: !fail, status: fail ? 404 : 200, arrayBuffer: async () => url };
    },
    button,
    onError: (message) => errors.push(message),
  };
  vm.createContext(sandbox);
  vm.runInContext(`${source}\nthis.audio = new VillageAudio({button, onError});`, sandbox);
  return { ...sandbox, attrs, label, errors, warnings, sources, fetches, storage, documentEvents, windowEvents };
}

async function enabled() {
  const state = setup();
  state.audio.setActive(true);
  state.documentEvents.pointerdown({ isTrusted: true });
  await flush();
  return state;
}

test("audio unlocks only after a real gesture and loads the five supplied pairs", async () => {
  const state = setup();
  state.documentEvents.pointerdown({ isTrusted: false });
  assert.equal(state.audio.context, null);
  state.documentEvents.keydown({ isTrusted: true });
  await flush();
  assert.equal(state.fetches.length, 10);
  state.fetches.forEach((url) => assert.ok(fs.existsSync(path.join(root, url.split("?")[0]))));
  assert.equal(state.audio.context.state, "running");
});

test("idle sounds are occasional, require a walking recorded agent, and avoid repeats", async () => {
  const state = await enabled();
  state.audio.idleRemaining = 1;
  await state.audio.updateIdle(0.5, ["matchmaker"]);
  assert.equal(state.sources.length, 0);
  await state.audio.updateIdle(1, ["trendsetter"]);
  assert.equal(state.sources.length, 0);
  await state.audio.updateIdle(0.1, ["matchmaker"]);
  assert.match(state.sources[0].buffer.url, /matchmaker-idle\.wav\?v=2$/);
  state.sources[0].onended();
  state.audio.idleRemaining = 0;
  await state.audio.updateIdle(0.1, ["matchmaker", "hype-star"]);
  assert.match(state.sources[1].buffer.url, /hype-star-idle\.wav\?v=2$/);
  assert.ok(state.audio.idleRemaining >= 5 && state.audio.idleRemaining <= 9);
});

test("deliverable sounds preempt idle audio and serialize simultaneous completions", async () => {
  const state = await enabled();
  state.audio.idleRemaining = 0;
  await state.audio.updateIdle(0.1, ["matchmaker"]);
  state.audio.deliver("party-curator");
  state.audio.deliver("social-butterfly");
  await flush();
  assert.equal(state.sources[0].stopped, true);
  assert.match(state.sources[1].buffer.url, /party-curator-active\.m4a\?v=2$/);
  assert.equal(state.sources.length, 2);
  state.sources[1].onended();
  await flush();
  assert.match(state.sources[2].buffer.url, /social-butterfly-active\.m4a\?v=2$/);
});

test("mute stops playback, discards pending sounds, and persists accessible button state", async () => {
  const state = await enabled();
  state.audio.deliver("hype-star");
  await flush();
  state.audio.deliver("matchmaker");
  state.audio.toggleMute();
  assert.equal(state.sources[0].stopped, true);
  assert.equal(state.storage.get("charmz-audio-muted"), "true");
  assert.equal(state.attrs["aria-pressed"], "true");
  assert.equal(state.attrs["aria-label"], "Unmute village sounds");
  assert.equal(state.label.textContent, "Sound off");
  state.audio.deliver("vibe-checker");
  await state.audio.updateIdle(60, ["vibe-checker"]);
  state.audio.toggleMute();
  await flush();
  assert.equal(state.sources.length, 1);
  assert.equal(state.storage.get("charmz-audio-muted"), "false");
  assert.equal(state.label.textContent, "Sound on");
});

test("a saved mute preference prevents gesture unlock", () => {
  const state = setup({ muted: true });
  state.documentEvents.pointerdown({ isTrusted: true });
  assert.equal(state.audio.context, null);
  assert.equal(state.attrs["aria-pressed"], "true");
});

test("leaving the village cancels even an in-flight audio load", async () => {
  const state = await enabled();
  let resolve;
  state.audio.clips.set("matchmaker-active", new Promise((done) => { resolve = done; }));
  state.audio.deliver("matchmaker");
  state.audio.setActive(false);
  resolve({ url: "late recording" });
  await flush();
  assert.equal(state.sources.length, 0);
  state.audio.deliver("hype-star");
  assert.equal(state.audio.queue.length, 0);
});

test("hiding the tab stops sound and does not replay old completions on return", async () => {
  const state = await enabled();
  state.audio.deliver("matchmaker");
  await flush();
  state.document.hidden = true;
  state.documentEvents.visibilitychange();
  state.audio.deliver("hype-star");
  assert.equal(state.sources[0].stopped, true);
  state.document.hidden = false;
  await state.audio.updateIdle(1, ["hype-star"]);
  assert.equal(state.sources.length, 1);
});

test("agents without supplied recordings remain silent", async () => {
  const state = await enabled();
  state.audio.deliver("trendsetter");
  state.audio.deliver("wing-worm");
  state.audio.idleRemaining = 0;
  await state.audio.updateIdle(1, ["trendsetter", "wing-worm"]);
  assert.equal(state.sources.length, 0);
});

test("load failures are reported without breaking the game or repeated notifications", async () => {
  const state = setup({ fail: true });
  state.audio.setActive(true);
  state.documentEvents.pointerdown({ isTrusted: true });
  await flush();
  assert.equal(state.warnings.length, 10);
  assert.equal(state.errors.length, 1);
  state.audio.deliver("matchmaker");
  await flush();
  assert.equal(state.sources.length, 0);
});

test("the deliverable creation hook emits once without requiring pickup or review", () => {
  const game = fs.readFileSync(path.join(root, "game.js"), "utf8");
  const start = game.indexOf("function dropDeliverable(");
  const end = game.indexOf("\nfunction updateDeliveries()", start);
  const events = [];
  const state = {
    deliverableCatalog: { matchmaker: [["gift", "Finished task"]] },
    world: { width: 1800, height: 1100 },
    deliverables: [],
    saveDeliverables() {},
    renderDeliverableBubbles() {},
    renderDashboardAgents() {},
    showToast() {},
    villageAudio: { deliver: (id) => events.push(id) },
  };
  vm.createContext(state);
  vm.runInContext(game.slice(start, end), state);
  state.dropDeliverable({ id: "matchmaker", name: "Matchmaker", x: 500, y: 400, direction: "left", pause: 0 });
  assert.deepEqual(events, ["matchmaker"]);
  assert.equal(state.deliverables.length, 1);
  assert.equal((game.match(/villageAudio\.deliver\(/g) || []).length, 2);
});

test("idle rotation covers every recorded agent and allows concurrent idle clips", async () => {
  const state = await enabled();
  const ids = [...state.audio.agentIds];
  for (let index = 0; index < ids.length * 2; index += 1) {
    state.audio.idleRemaining = 0;
    await state.audio.updateIdle(0.1, ids);
  }
  assert.equal(state.audio.idleSources.size, 10);
  const played = state.sources.map((node) => node.buffer.url);
  assert.equal(new Set(played.slice(0, 5)).size, 5);
  assert.deepEqual(played.slice(0, 5), played.slice(5));
  state.audio.deliver("matchmaker");
  await flush();
  assert.ok(state.sources.slice(0, 10).every((node) => node.stopped));
  assert.equal(state.audio.idleSources.size, 0);
  assert.equal(state.audio.gain.gain.value, 1);
  state.audio.toggleMute();
  assert.ok(state.sources.every((node) => node.stopped));
});

test("rotation skips paused agents without starving others and includes them when they resume", async () => {
  const state = await enabled();
  for (let index = 0; index < 3; index += 1) {
    state.audio.idleRemaining = 0;
    await state.audio.updateIdle(0.1, ["matchmaker"]);
  }
  state.audio.idleRemaining = 0;
  await state.audio.updateIdle(0.1, [...state.audio.agentIds]);
  assert.match(state.sources[3].buffer.url, /hype-star-idle/);
});

test("a new needs-your-call event plays that agent's active recording only once", () => {
  const game = fs.readFileSync(path.join(root, "game.js"), "utf8");
  const start = game.indexOf("function requestDecision(");
  const end = game.indexOf("\nfunction updateDecisions()", start);
  const events = [];
  const state = {
    decisionCatalog: { "party-curator": { topic: "Venue hold" } },
    decisions: [],
    renderDecisionBubbles() {},
    renderDashboardAgents() {},
    showToast() {},
    villageAudio: { deliver: (id) => events.push(id) },
  };
  vm.createContext(state);
  vm.runInContext(game.slice(start, end), state);
  const agent = { id: "party-curator", name: "Party pillbug", x: 500, y: 400 };
  state.requestDecision(agent);
  state.requestDecision(agent);
  assert.deepEqual(events, ["party-curator"]);
  assert.equal(state.decisions.length, 1);
});

test("corrected display names retain saved agent IDs and their existing behavior", () => {
  const game = fs.readFileSync(path.join(root, "game.js"), "utf8");
  const start = game.indexOf("const walkers = [");
  const end = game.indexOf("\nfor (const agent of", start);
  const state = {
    makeWalker: (name, x, y, details) => ({
      ...details,
      id: details.id || name.toLowerCase().replace(/\s+/g, "-"),
      name,
    }),
  };
  vm.createContext(state);
  vm.runInContext(`${game.slice(start, end)}\nthis.agents = walkers;`, state);
  assert.equal(state.agents.find(({ id }) => id === "party-curator").name, "Party pillbug");
  assert.equal(state.agents.find(({ id }) => id === "vibe-checker").name, "Vibe jelly");
  for (const id of ["matchmaker", "trendsetter"]) {
    const agent = state.agents.find((candidate) => candidate.id === id);
    assert.equal(agent.walkSheet, `./assets/sprites/${id}-walk.png`);
    assert.equal(agent.portrait, `./assets/sprites/${id}-portrait.png`);
  }
  assert.doesNotMatch(game, /Party curator|Vibe checker/i);
});

test("all idle WAVs last at most 1.8 seconds and have faded endpoints", () => {
  const files = fs.readdirSync(path.join(root, "assets/audio")).filter((file) => file.endsWith("-idle.wav"));
  assert.equal(files.length, 5);
  for (const file of files) {
    const data = fs.readFileSync(path.join(root, "assets/audio", file));
    let rate, channels, bytes, samples;
    for (let offset = 12; offset + 8 <= data.length;) {
      const kind = data.toString("ascii", offset, offset + 4);
      const size = data.readUInt32LE(offset + 4);
      const chunk = offset + 8;
      if (kind === "fmt ") {
        channels = data.readUInt16LE(chunk + 2);
        rate = data.readUInt32LE(chunk + 4);
        bytes = data.readUInt16LE(chunk + 14) / 8;
      }
      if (kind === "data") samples = data.subarray(chunk, chunk + size);
      offset = chunk + size + (size % 2);
    }
    assert.ok(samples.length / (rate * channels * bytes) <= 1.8, file);
    assert.equal(samples.readInt16LE(0), 0, file);
    assert.equal(samples.readInt16LE(samples.length - 2), 0, file);
  }
});
