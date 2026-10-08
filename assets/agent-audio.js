class VillageAudio {
  constructor({ button, onError }) {
    this.button = button;
    this.onError = onError;
    this.muted = localStorage.getItem("charmz-audio-muted") === "true";
    this.active = false;
    this.context = null;
    this.clips = new Map();
    this.source = null;
    this.gain = null;
    this.sourceKind = null;
    this.idleSources = new Map();
    this.idlePending = new Set();
    this.idleRotation = [];
    this.queue = [];
    this.draining = false;
    this.generation = 0;
    this.lastIdleAgent = null;
    this.idleRemaining = this.idleDelay();
    this.reportedError = false;
    this.agentIds = new Set(["hype-star", "matchmaker", "party-curator", "social-butterfly", "vibe-checker"]);
    this.renderButton();
    button.addEventListener("click", () => this.toggleMute());
    const unlock = (event) => {
      if (event.isTrusted && !this.muted) this.unlock();
    };
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.stop();
    });
    window.addEventListener("pagehide", () => this.stop());
  }

  idleDelay() {
    return 5 + Math.random() * 4;
  }

  reportError(message, error) {
    console.warn(message, error);
    if (!this.reportedError) {
      this.reportedError = true;
      this.onError("Village audio couldn't play. You can keep playing or mute sounds.");
    }
  }

  unlock() {
    if (!this.context) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) {
        this.reportError("Web Audio is unavailable in this browser.");
        return;
      }
      try {
        this.context = new AudioContextClass();
      } catch (error) {
        this.reportError("Couldn't initialize village audio.", error);
        return;
      }
      this.context.addEventListener("statechange", () => {
        if (this.context.state !== "running") this.stop();
      });
      for (const id of this.agentIds) {
        for (const kind of ["idle", "active"]) {
          const extension = kind === "idle" ? "wav" : "m4a";
          const url = `./assets/audio/${id}-${kind}.${extension}?v=2`;
          const clip = fetch(url)
            .then((response) => {
              if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
              return response.arrayBuffer();
            })
            .then((data) => this.context.decodeAudioData(data))
            .catch((error) => {
              this.reportError(`Couldn't load agent recording: ${url}`, error);
              return null;
            });
          this.clips.set(`${id}-${kind}`, clip);
        }
      }
    }
    if (this.context.state === "suspended") {
      this.context.resume().catch((error) => this.reportError("Couldn't enable village audio.", error));
    }
  }

  renderButton() {
    this.button.setAttribute("aria-pressed", String(this.muted));
    this.button.setAttribute("aria-label", this.muted ? "Unmute village sounds" : "Mute village sounds");
    this.button.title = this.muted ? "Unmute village sounds" : "Mute village sounds";
    this.button.querySelector("[data-sound-label]").textContent = this.muted ? "Sound off" : "Sound on";
  }

  toggleMute() {
    this.muted = !this.muted;
    this.stop();
    try {
      localStorage.setItem("charmz-audio-muted", String(this.muted));
    } catch (error) {
      console.warn("Couldn't save village sound preference.", error);
      this.onError("Sound preference couldn't be saved for your next visit.");
    }
    this.renderButton();
    if (!this.muted) {
      this.unlock();
      this.idleRemaining = 2;
    }
  }

  setActive(active) {
    this.active = active;
    this.stop();
    if (active) this.idleRemaining = 4;
  }

  canPlay() {
    return this.active && !this.muted && !document.hidden && this.context?.state === "running";
  }

  stopPlayback() {
    if (this.source) {
      this.source.onended = null;
      this.source.stop();
      this.source.disconnect();
      this.gain.disconnect();
      this.source = null;
      this.gain = null;
      this.sourceKind = null;
    }
  }

  stopIdlePlayback() {
    for (const [source, gain] of this.idleSources) {
      source.onended = null;
      source.stop();
      source.disconnect();
      gain.disconnect();
    }
    this.idleSources.clear();
  }

  stop() {
    this.generation += 1;
    this.queue.length = 0;
    this.draining = false;
    this.idleRemaining = this.idleDelay();
    this.stopPlayback();
    this.stopIdlePlayback();
    this.idlePending.clear();
  }

  play(buffer, kind) {
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = buffer;
    gain.gain.value = kind === "idle" ? 0.32 : 1;
    source.connect(gain);
    gain.connect(this.context.destination);
    if (kind === "idle") {
      this.idleSources.set(source, gain);
    } else {
      this.source = source;
      this.gain = gain;
      this.sourceKind = kind;
    }
    source.onended = () => {
      source.disconnect();
      gain.disconnect();
      if (kind === "idle") {
        this.idleSources.delete(source);
        return;
      }
      if (this.source !== source) return;
      this.source = null;
      this.gain = null;
      this.sourceKind = null;
      this.drain();
    };
    source.start();
  }

  deliver(agentId) {
    if (!this.agentIds.has(agentId) || !this.canPlay()) return;
    this.stopIdlePlayback();
    this.queue.push(agentId);
    this.drain();
  }

  async drain() {
    if (this.draining || this.source || !this.canPlay() || !this.queue.length) return;
    this.draining = true;
    const generation = this.generation;
    const agentId = this.queue.shift();
    const buffer = await this.clips.get(`${agentId}-active`);
    if (generation !== this.generation) return;
    this.draining = false;
    if (!this.canPlay()) return;
    if (buffer) this.play(buffer, "active");
    else this.drain();
  }

  async updateIdle(delta, walkingAgentIds) {
    if (!this.canPlay() || this.source || this.draining || this.queue.length) return;
    this.idleRemaining -= delta;
    if (this.idleRemaining > 0) return;
    const candidates = walkingAgentIds.filter((id) => this.agentIds.has(id) && !this.idlePending.has(id));
    if (!candidates.length) return;
    if (!this.idleRotation.length) this.idleRotation = [...this.agentIds];
    const agentId = this.idleRotation.find((id) => candidates.includes(id));
    if (!agentId) return;
    this.idleRotation = [...this.idleRotation.filter((id) => id !== agentId), agentId];
    this.idlePending.add(agentId);
    this.idleRemaining = this.idleDelay();
    const generation = this.generation;
    const buffer = await this.clips.get(`${agentId}-idle`);
    if (generation !== this.generation) return;
    this.idlePending.delete(agentId);
    if (!this.canPlay() || this.source || this.draining || this.queue.length) return;
    if (buffer) {
      this.lastIdleAgent = agentId;
      this.play(buffer, "idle");
    }
  }
}
