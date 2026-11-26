// Keyboard + mouse to a controls object. All steering values are in -1..1.
// Mouse steers pitch/roll by position relative to the window centre (6% dead
// zone); the keyboard works without the mouse. Click once to enable the mouse.

const DEAD_ZONE = 0.06;

export function createInput(window) {
  const keys = new Set();
  const controls = {
    pitch: 0,
    roll: 0,
    yaw: 0,
    throttleDelta: 0,
    brake: false,
    gearToggle: false,
    cameraToggle: false,
    pauseToggle: false,
    restart: false,
    confirm: false,
    pickMission: 0,
  };
  const mouse = { enabled: false, x: 0, y: 0 };
  const events = { gearToggle: false, cameraToggle: false, pauseToggle: false, restart: false, confirm: false, pickMission: 0 };

  function onKeyDown(event) {
    const code = event.code;
    keys.add(code);
    if (code === "KeyG") events.gearToggle = true;
    if (code === "KeyC") events.cameraToggle = true;
    if (code === "KeyP") events.pauseToggle = true;
    if (code === "KeyR") events.restart = true;
    if (code === "Enter") events.confirm = true;
    if (code === "Digit1") events.pickMission = 1;
    if (code === "Digit2") events.pickMission = 2;
    if (code === "Digit3") events.pickMission = 3;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(code)) event.preventDefault();
  }
  function onKeyUp(event) {
    keys.delete(event.code);
  }
  function onMouseMove(event) {
    if (!mouse.enabled) return;
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (event.clientY / window.innerHeight) * 2 - 1;
  }
  function onPointerDown() {
    mouse.enabled = true;
  }

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("pointerdown", onPointerDown);

  function dead(v) {
    return Math.abs(v) < DEAD_ZONE ? 0 : (v - Math.sign(v) * DEAD_ZONE) / (1 - DEAD_ZONE);
  }

  function sample() {
    const up = keys.has("KeyW") || keys.has("ArrowUp") ? 1 : 0;
    const down = keys.has("KeyS") || keys.has("ArrowDown") ? 1 : 0;
    const left = keys.has("KeyA") || keys.has("ArrowLeft") ? 1 : 0;
    const right = keys.has("KeyD") || keys.has("ArrowRight") ? 1 : 0;
    const rudderLeft = keys.has("KeyQ") ? 1 : 0;
    const rudderRight = keys.has("KeyE") ? 1 : 0;

    let pitch = up - down;
    let roll = right - left;
    let yaw = rudderRight - rudderLeft;

    // Mouse steers pitch (up/down) and roll (left/right) once enabled.
    if (mouse.enabled) {
      pitch += -dead(mouse.y);
      roll += dead(mouse.x);
    }

    if (keys.has("ShiftLeft") || keys.has("ShiftRight")) controls.throttleDelta = 1;
    else if (keys.has("ControlLeft") || keys.has("ControlRight")) controls.throttleDelta = -1;
    else controls.throttleDelta = 0;
    if (keys.has("KeyX")) controls.throttleDelta = -1;

    controls.pitch = clamp(pitch);
    controls.roll = clamp(roll);
    controls.yaw = clamp(yaw);
    controls.brake = keys.has("KeyB");
    controls.gearToggle = events.gearToggle;
    controls.cameraToggle = events.cameraToggle;
    controls.pauseToggle = events.pauseToggle;
    controls.restart = events.restart;
    controls.confirm = events.confirm;
    controls.pickMission = events.pickMission;

    events.gearToggle = false;
    events.cameraToggle = false;
    events.pauseToggle = false;
    events.restart = false;
    events.confirm = false;
    events.pickMission = 0;

    return controls;
  }

  return { controls, sample, mouse };
}

const clamp = (v) => Math.min(1, Math.max(-1, v));