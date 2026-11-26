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

// controls: { pitch, roll, yaw, throttleDelta, brake }.
// pitch/roll/yaw/brake in -1..1. throttleDelta: +1 spools up, -1 down.
// groundHeightAt(x, z) -> ground height in metres.
// Mutates state, applying control + physics for dt seconds.
export function stepFlight(state, controls, dt, groundHeightAt) {
  const c = controls || {};
  const g = FLIGHT;
  const ground = groundHeightAt || (() => 0);

  // Throttle spool (rate-limited).
  const wantThrottle = clamp(state.throttle + (c.throttleDelta ?? 0) * g.throttleRate * dt, 0, 1);
  state.throttle = wantThrottle;

  // Target speed and long. acceleration.
  const vTarget = g.baseSpeed + g.spanSpeed * state.throttle;
  let dv = (vTarget - state.speed) * g.speedDrag;

  if (!state.onGround) {
    dv -= g.gravity * Math.sin(state.pitch) * g.pitchFactor;
    const auth = authority(state.speed);
    state.pitch = clamp(state.pitch + (c.pitch ?? 0) * g.pitchRate * auth * dt, -1.2, 1.2);
    state.roll = clamp(state.roll + (c.roll ?? 0) * g.rollRate * auth * dt, -1.5, 1.5);
    state.heading += (c.yaw ?? 0) * 0.5 * auth * dt;
    state.heading += (g.gravity * Math.tan(state.roll)) / Math.max(state.speed, g.turnMinSpeed) * dt;
  } else {
    state.pitch = 0;
    state.roll = 0;
    state.heading += (c.yaw ?? 0) * g.groundSteerRate * dt;
    dv -= state.speed * g.groundFriction + (c.brake ? g.brakeFriction : 0);
  }

  state.speed = clamp(state.speed + dv * dt, 0, g.maxSpeed);

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
    state.y += vs * dt;
    state.x += Math.sin(state.heading) * state.speed * dt;
    state.z += Math.cos(state.heading) * state.speed * dt;
  } else {
    state.verticalSpeed = 0;
    const gy = ground(state.x, state.z);
    state.y = gy + 1.6;
    state.x += Math.sin(state.heading) * state.speed * dt;
    state.z += Math.cos(state.heading) * state.speed * dt;
    if (state.y < gy + 1.6) state.y = gy + 1.6;
  }
}
