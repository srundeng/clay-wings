import { FLIGHT } from "./config.js";

// Pure flight model. Units: metres and seconds, angles in radians.
// No DOM, no three.js import; usable from Node tests and the browser alike.

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function authority(speed) {
  return clamp(
    (speed - FLIGHT.authorityLo) / (FLIGHT.authorityHi - FLIGHT.authorityLo),
    FLIGHT.authorityMin,
    1,
  );
}

export function createFlightState(overrides = {}) {
  return {
    x: 0,
    y: 4,
    z: 0,
    heading: 0,
    pitch: 0,
    roll: 0,
    speed: 0,
    verticalSpeed: 0,
    onGround: true,
    gearDown: true,
    throttle: 0,
    fuel: 100,
    hull: 100,
    ...overrides,
  };
}

// Reset motion to the runway when the state has gone non-finite. Fuel/hull
// are clamped separately so a bad frame cannot erase them silently.
function sanitize(state) {
  if (!Number.isFinite(state.fuel)) state.fuel = 0;
  if (!Number.isFinite(state.hull)) state.hull = 100;
  const fields = ["x", "y", "z", "heading", "pitch", "roll", "speed", "verticalSpeed", "throttle"];
  const bad = fields.some((k) => !Number.isFinite(state[k]));
  if (bad) {
    state.x = 0;
    state.y = 1.6;
    state.z = 0;
    state.heading = 0;
    state.pitch = 0;
    state.roll = 0;
    state.speed = 0;
    state.verticalSpeed = 0;
    state.throttle = 0;
    state.onGround = true;
  }
  return bad;
}

// controls: { pitch, roll, yaw, throttleDelta, brake }.
// pitch/roll/yaw/brake in -1..1. throttleDelta: +1 spools up, -1 down.
// groundHeightAt(x, z) -> ground height in metres.
// Mutates state, applying control + physics for dt seconds.
export function stepFlight(state, controls, dt, groundHeightAt) {
  const c = controls || {};
  const g = FLIGHT;
  const ground = groundHeightAt || (() => 0);

  // Guard the timestep so a stalled frame cannot tunnel through the ground,
  // and drop an already-invalid state instead of propagating NaN.
  const step = Number.isFinite(dt) && dt > 0 ? Math.min(dt, 0.05) : 0;
  if (step === 0) return;
  if (sanitize(state)) return;

  // Throttle spool (rate-limited).
  const wantThrottle = clamp(state.throttle + (c.throttleDelta ?? 0) * g.throttleRate * step, 0, 1);
  state.throttle = wantThrottle;

  // Target speed and long. acceleration.
  const vTarget = g.baseSpeed + g.spanSpeed * state.throttle;
  let dv = (vTarget - state.speed) * g.speedDrag;

  if (!state.onGround) {
    dv -= g.gravity * Math.sin(state.pitch) * g.pitchFactor;
    const auth = authority(state.speed);
    state.pitch = clamp(state.pitch + (c.pitch ?? 0) * g.pitchRate * auth * step, -1.2, 1.2);
    state.roll = clamp(state.roll + (c.roll ?? 0) * g.rollRate * auth * step, -1.5, 1.5);
    state.heading += (c.yaw ?? 0) * 0.5 * auth * step;
    state.heading += (g.gravity * Math.tan(state.roll)) / Math.max(state.speed, g.turnMinSpeed) * step;
  } else {
    state.pitch = 0;
    state.roll = 0;
    state.heading += (c.yaw ?? 0) * g.groundSteerRate * step;
    dv -= state.speed * g.groundFriction + (c.brake ? g.brakeFriction : 0);
  }

  state.speed = clamp(state.speed + dv * step, 0, g.maxSpeed);

  if (state.onGround && state.speed >= g.rotateSpeed && (c.pitch ?? 0) > 0.1) {
    state.onGround = false;
  }

  // Vertical speed: climb with pitch; stall sink below stall speed.
  if (!state.onGround) {
    let vs = state.speed * Math.sin(state.pitch);
    if (state.speed < g.stallSpeed) {
      vs -= (g.stallSpeed - state.speed) * g.stallSink;
      state.pitch = Math.max(state.pitch, -0.05);
    }
    state.verticalSpeed = vs;
    state.y += vs * step;
    state.x += Math.sin(state.heading) * state.speed * step;
    state.z += Math.cos(state.heading) * state.speed * step;
    // Never let the aircraft sink through the flat-world ground: clamp and
    // settle it on the surface (landing judging is a later checkpoint).
    const gy = ground(state.x, state.z);
    if (state.y < gy + 1.6) {
      state.y = gy + 1.6;
      state.verticalSpeed = 0;
      state.onGround = true;
    }
  } else {
    state.verticalSpeed = 0;
    const gy = ground(state.x, state.z);
    state.y = gy + 1.6;
    state.x += Math.sin(state.heading) * state.speed * step;
    state.z += Math.cos(state.heading) * state.speed * step;
  }

  // Final guard: if integration produced a non-finite value, reset safely.
  sanitize(state);
}
