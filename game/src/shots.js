// Deterministic screenshot scenes. Each shot sets a flight state and returns
// the camera/assist flags main.js needs; no screenshot is edited after capture.

export function applyShotScene(shotMode, state, missionState) {
  let cameraMode = shotMode === "cockpit" ? 1 : 0;
  let assistOff = false;
  let airborneStart = false;
  if (shotMode === "chase-ring") {
    Object.assign(state, { x: 0, y: 250, z: 120, heading: 0, speed: 55, throttle: 0.55, fuel: 70, onGround: false, pitch: -0.087, roll: 0.02 });
    missionState.phase = "RINGS";
  } else if (shotMode === "cockpit") {
    Object.assign(state, { x: 620, y: 120, z: 200, heading: -1.65, speed: 55, throttle: 0.5, fuel: 75, onGround: false, pitch: 0, roll: -0.08 });
    missionState.phase = "RINGS";
    missionState.ringIndex = 1;
  } else if (shotMode === "landing") {
    Object.assign(state, { x: 0, y: 45, z: -250, heading: 0, speed: 45, throttle: 0.2, fuel: 60, onGround: false, pitch: -0.05, verticalSpeed: -4, gearDown: true });
    missionState.phase = "LAND";
    assistOff = true;
  } else if (shotMode === "touchdown") {
    Object.assign(state, { x: 0, y: 13.62, z: 0, heading: 0, speed: 42, throttle: 0, fuel: 60, onGround: false, pitch: -0.03, verticalSpeed: -1.2, gearDown: true });
    missionState.phase = "RINGS";
    assistOff = true;
    airborneStart = true;
  }
  return { cameraMode, assistOff, airborneStart };
}

export function seedChaseCamera(shotMode, camPos, camLook, state) {
  if (shotMode !== "chase-ring") return;
  camPos.set(state.x, state.y + 6 - Math.sin(state.pitch) * 16, state.z - 16 * Math.cos(state.pitch));
  camLook.set(state.x, state.y + 4, state.z);
}
