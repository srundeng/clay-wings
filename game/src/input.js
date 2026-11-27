// Keyboard + mouse -> controls object. All steering values in -1..1.
// Keys are read with event.code only (never event.key, because holding Shift
// changes event.key for letters). Mouse steering engages after one click;
// while any key of an axis is held, the keyboard owns that axis. KeyM toggles
// mouse steering, KeyI inverts pitch (keyboard and mouse).

const DEAD_ZONE = 0.1;

const GAME_KEYS = new Set([
  "KeyW", "KeyA", "KeyS", "KeyD", "KeyQ", "KeyE", "KeyZ", "KeyX", "KeyG",
  "KeyC", "KeyR", "KeyP", "KeyB", "KeyM", "KeyI", "KeyT", "KeyH",
  "ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight",
  "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space", "Enter",
]);

const ONE_SHOT = new Set(["KeyG", "KeyC", "KeyR", "KeyP", "KeyM", "KeyI", "KeyT", "KeyH", "Enter"]);

export function createInput(window) {
  const doc = window.document;
  const keys = new Set();
  const events = { gearToggle: 0, cameraToggle: 0, restart: 0, pauseToggle: 0, mouseToggle: 0, invertToggle: 0, assistToggle: 0, hintToggle: 0, start: 0 };

  const controls = {
    pitch: 0,
    roll: 0,
    yaw: 0,
    throttleUp: false,
    throttleDown: false,
    brake: false,
    gearToggle: false,
    cameraToggle: false,
    pauseToggle: false,
    restart: false,
    mouseSteer: false,
    invertPitch: false,
    assist: true,
    hintToggle: false,
    start: false,
  };

  const mouse = { enabled: false, x: 0, y: 0 };
  let mouseSteerOn = false;
  let invert = false;

  function onKeyDown(event) {
    const code = event.code;
    if (GAME_KEYS.has(code)) event.preventDefault();
    if (event.repeat && ONE_SHOT.has(code)) return;
    keys.add(code);
    if (ONE_SHOT.has(code) && !event.repeat) {
      if (code === "KeyG") events.gearToggle += 1;
      else if (code === "KeyC") events.cameraToggle += 1;
      else if (code === "KeyR") events.restart += 1;
      else if (code === "KeyP") events.pauseToggle += 1;
      else if (code === "KeyM") events.mouseToggle += 1;
      else if (code === "KeyI") events.invertToggle += 1;
      else if (code === "KeyT") events.assistToggle += 1;
      else if (code === "KeyH") events.hintToggle += 1;
      else if (code === "Enter") events.start += 1;
    }
  }
  function onKeyUp(event) {
    keys.delete(event.code);
  }
  function clearAll() {
    keys.clear();
    mouse.x = 0;
    mouse.y = 0;
  }
  function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (event.clientY / window.innerHeight) * 2 - 1;
  }
  function onPointerDown() {
    mouse.enabled = true;
    window.focus();
    const el = doc.getElementById("game");
    if (el && el.focus) { try { el.focus(); } catch (_e) { /* ignore */ } }
  }
  function onVisibility() {
    if (doc.hidden) clearAll();
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  doc.addEventListener("keydown", onKeyDown);
  doc.addEventListener("keyup", onKeyUp);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("pointerdown", onPointerDown);
  doc.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("blur", clearAll);
  doc.addEventListener("visibilitychange", onVisibility);

  function dead(v) {
    const a = Math.abs(v);
    if (a < DEAD_ZONE) return 0;
    return (v - Math.sign(v) * DEAD_ZONE) / (1 - DEAD_ZONE);
  }
  const clamp = (v) => Math.min(1, Math.max(-1, v));

  function sample() {
    const up = keys.has("KeyW") || keys.has("ArrowUp");
    const down = keys.has("KeyS") || keys.has("ArrowDown");
    const left = keys.has("KeyA") || keys.has("ArrowLeft");
    const right = keys.has("KeyD") || keys.has("ArrowRight");
    const rudderLeft = keys.has("KeyQ");
    const rudderRight = keys.has("KeyE");

    let pitch = (up ? 1 : 0) - (down ? 1 : 0);
    let roll = (right ? 1 : 0) - (left ? 1 : 0);
    let yaw = (rudderRight ? 1 : 0) - (rudderLeft ? 1 : 0);

    const keyPitch = pitch !== 0;
    const keyRoll = roll !== 0;

    if (mouse.enabled && mouseSteerOn) {
      if (!keyPitch) pitch = -dead(mouse.y);
      if (!keyRoll) roll = dead(mouse.x);
    }

    if (invert) pitch = -pitch;

    controls.pitch = clamp(pitch);
    controls.roll = clamp(roll);
    controls.yaw = clamp(yaw);
    controls.throttleUp = keys.has("KeyZ") || keys.has("ShiftLeft") || keys.has("ShiftRight");
    controls.throttleDown = keys.has("KeyX") || keys.has("ControlLeft") || keys.has("ControlRight");
    controls.brake = keys.has("KeyB");

    if (events.mouseToggle > 0) { mouseSteerOn = !mouseSteerOn; events.mouseToggle = 0; }
    if (events.invertToggle > 0) { invert = !invert; events.invertToggle = 0; }
    if (events.assistToggle > 0) { controls.assist = !controls.assist; events.assistToggle = 0; }

    controls.gearToggle = events.gearToggle > 0;
    controls.cameraToggle = events.cameraToggle > 0;
    controls.restart = events.restart > 0;
    controls.pauseToggle = events.pauseToggle > 0;
    controls.hintToggle = events.hintToggle > 0;
    controls.start = events.start > 0;
    controls.mouseSteer = mouseSteerOn;
    controls.invertPitch = invert;

    events.gearToggle = 0;
    events.cameraToggle = 0;
    events.restart = 0;
    events.pauseToggle = 0;
    events.hintToggle = 0;
    events.start = 0;

    return controls;
  }

  return { controls, sample, mouse, keys };
}