// WebAudio-only synthesized engine, wind and short cues. Starts on first
// input and stays silent (never throws) when audio is unavailable.

export function createAudio(window) {
  let ctx = null;
  let engine = null;
  let filter = null;
  let engineGain = null;
  let windGain = null;

  function start() {
    if (ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      engine = ctx.createOscillator();
      engine.type = "sawtooth";
      filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      engineGain = ctx.createGain();
      engineGain.gain.value = 0.03;
      engine.connect(filter);
      filter.connect(engineGain);
      engineGain.connect(ctx.destination);
      engine.start();

      const wind = ctx.createBufferSource();
      const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
      wind.buffer = buf;
      wind.loop = true;
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.frequency.value = 700;
      windGain = ctx.createGain();
      windGain.gain.value = 0;
      wind.connect(band);
      band.connect(windGain);
      windGain.connect(ctx.destination);
      wind.start();
      if (ctx.state === "suspended" && ctx.resume) ctx.resume();
    } catch (_e) {
      ctx = null;
    }
  }

  window.addEventListener("pointerdown", start, { once: true });
  window.addEventListener("keydown", start, { once: true });

  function tone(freq, seconds, type, volume) {
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type || "sine";
      osc.frequency.value = freq;
      const now = ctx.currentTime;
      gain.gain.setValueAtTime(volume || 0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + seconds);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + seconds);
    } catch (_e) { /* audio stays silent */ }
  }

  return {
    ready() { return !!ctx; },
    update(state) {
      if (!ctx) return;
      try {
        const now = ctx.currentTime;
        engine.frequency.setTargetAtTime(45 + state.throttle * 90 + state.speed * 0.35, now, 0.05);
        filter.frequency.setTargetAtTime(280 + state.throttle * 1200, now, 0.05);
        engineGain.gain.setTargetAtTime(0.02 + state.throttle * 0.06, now, 0.05);
        windGain.gain.setTargetAtTime(Math.min(0.08, state.speed * 0.0012), now, 0.1);
      } catch (_e) { /* ignore */ }
    },
    ring() { tone(880, 0.16, "sine", 0.09); },
    beacon() { tone(660, 0.2, "triangle", 0.08); },
    drop() { tone(520, 0.25, "triangle", 0.09); },
    touchdown(rating) { tone(rating === "CRASH" ? 90 : 180, 0.18, "square", 0.07); },
    crash() { tone(70, 0.5, "sawtooth", 0.1); },
    warning() { tone(1200, 0.08, "square", 0.035); },
  };
}
