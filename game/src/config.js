export const FLIGHT = {
  // Stall speed (m/s). Below this the nose drops and sink increases.
  stallSpeed: 28,
  // Cruise speed (m/s).
  cruiseSpeed: 55,
  // Maximum speed (m/s).
  maxSpeed: 95,
  // Speed target = baseSpeed + spanSpeed * throttle.
  baseSpeed: 20,
  spanSpeed: 75,
  // dv/dt = (vTarget - v) * speedDrag - gravity * sin(pitch) * pitchFactor.
  speedDrag: 0.35,
  gravity: 9.81,
  pitchFactor: 0.6,
  // Control authority = clamp((v - lo) / (hi - lo), min, 1).
  authorityLo: 18,
  authorityHi: 55,
  authorityMin: 0.25,
  // Max body rates at full authority (rad/s).
  pitchRate: 1.1,
  rollRate: 2.0,
  // Coordinated turn: headingRate = g * tan(roll) / max(v, turnMinSpeed).
  turnMinSpeed: 20,
  // Below-stall extra sink (m/s^2) per m/s of speed deficit.
  stallSink: 0.8,
  // Takeoff: rotate at about this ground speed (m/s).
  rotateSpeed: 38,
  // Ground steering rate with rudder (rad/s).
  groundSteerRate: 0.6,
  // Throttle spool rate (per second).
  throttleRate: 0.8,
  // Ground rolling drag (per second) and brake deceleration.
  groundFriction: 0.15,
  brakeFriction: 8,
  // Landing gear transition time (s).
  gearTime: 1.2,
};

export const FUEL = {
  // Tank capacity (units).
  capacity: 100,
  // Burn per second = idleBurn + throttleBurn * throttle.
  idleBurn: 0.25,
  throttleBurn: 1.35,
  // LOW FUEL warning threshold.
  warningLevel: 20,
};

export const DAMAGE = {
  // Hull integrity (units).
  capacity: 100,
  // DAMAGE warning threshold.
  warningLevel: 40,
};

export const STOP_MOTION = {
  // Stop-motion frames per second for props, clouds, water crash.
  fps: 12,
};
