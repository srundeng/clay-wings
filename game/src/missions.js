// Pure mission rules. One completable mission for now; others are skipped.

export const MISSIONS = [
  {
    id: "first-flight",
    name: "First Flight",
    fuelScale: 0.45,
    rings: [
      { x: 0, y: 75, z: 350, r: 60 },
      { x: 140, y: 115, z: 620, r: 65 },
      { x: 320, y: 145, z: 380, r: 65 },
      { x: 250, y: 105, z: 80, r: 60 },
      { x: 60, y: 65, z: -180, r: 60 },
    ],
  },
];

// Swept segment-versus-disc test: closest approach of the flight segment to
// the ring centre, with a tolerance multiplier. Works from either direction.

export function segmentDistance(a, b, p) {
  if (!a) return Math.hypot(p.x - b.x, p.y - b.y, p.z - b.z);
  const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
  const apx = p.x - a.x, apy = p.y - a.y, apz = p.z - a.z;
  const len2 = abx * abx + aby * aby + abz * abz;
  const t = len2 > 0 ? Math.max(0, Math.min(1, (apx * abx + apy * aby + apz * abz) / len2)) : 0;
  return Math.hypot(a.x + abx * t - p.x, a.y + aby * t - p.y, a.z + abz * t - p.z);
}

export function crossedRing(prev, cur, ring, tolerance = 1.15) {
  return segmentDistance(prev, cur, ring) <= ring.r * tolerance;
}

export function ringCountText(progress) {
  return progress.ringIndex + "/" + getMission(progress.id).rings.length;
}

export function getMission(id) {
  return MISSIONS.find((m) => m.id === id) || MISSIONS[0];
}

export function createMissionState(id = "first-flight") {
  const mission = getMission(id);
  return {
    id: mission.id,
    phase: "TAKEOFF",
    ringIndex: 0,
    complete: false,
    failed: false,
    stars: 0,
    lastEvent: null,
  };
}

export function objectiveText(progress) {
  if (progress.complete) return "Mission complete";
  if (progress.failed) return "Mission failed - press R to retry";
  if (progress.phase === "TAKEOFF") return "Take off from Home Runway";
  if (progress.phase === "RINGS") {
    return "Fly through ring " + (progress.ringIndex + 1) + " of " + getMission(progress.id).rings.length;
  }
  return "Land on Home Runway";
}

export function activeRing(progress) {
  if (progress.phase !== "RINGS") return null;
  return getMission(progress.id).rings[progress.ringIndex] || null;
}

export function advanceMission(progress, state, agl, justLanded, landing, prev) {
  progress.lastEvent = null;
  const mission = getMission(progress.id);
  if (progress.complete || progress.failed) return progress;

  if (progress.phase === "TAKEOFF") {
    if (!state.onGround && agl > 30) {
      progress.phase = "RINGS";
      progress.lastEvent = "rings";
    }
    return progress;
  }

  if (progress.phase === "RINGS") {
    const ring = mission.rings[progress.ringIndex];
    if (ring && crossedRing(prev, state, ring)) {
      progress.ringIndex += 1;
      progress.lastEvent = "ring";
      if (progress.ringIndex >= mission.rings.length) progress.phase = "LAND";
    }
    return progress;
  }

  if (justLanded) {
    if (!landing || landing.rating === "CRASH") {
      progress.failed = true;
      progress.lastEvent = "failed";
    } else {
      progress.complete = true;
      progress.stars = 1;
      if (landing.rating === "SMOOTH" || landing.rating === "FIRM") progress.stars += 1;
      if (state.fuel > 40 && state.hull > 70) progress.stars += 1;
      progress.lastEvent = "complete";
    }
  }
  return progress;
}
