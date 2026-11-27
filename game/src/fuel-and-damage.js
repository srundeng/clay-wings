// Pure fuel and hull rules. No DOM, no three.js.

import { FUEL, DAMAGE } from "./config.js";

const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function fuelBurnRate(throttle, ceilingFactor = 1) {
  return FUEL.idleBurn + FUEL.throttleBurn * clamp01(throttle) * clamp01(ceilingFactor);
}

export function stepFuel(state, dt, ceilingFactor = 1, burnScale = 1) {
  state.fuel = Math.max(0, state.fuel - fuelBurnRate(state.throttle, ceilingFactor) * burnScale * Math.max(0, dt));
  return state.fuel;
}

export function engineOut(state) {
  return state.fuel <= 0;
}

export function damageHull(state, amount) {
  state.hull = Math.max(0, Math.min(DAMAGE.capacity, state.hull - Math.max(0, amount)));
  return state.hull;
}

export function crashed(state) {
  return state.hull <= 0;
}
