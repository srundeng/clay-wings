// Pure mission rules. One completable mission for now; others are skipped.

export const MISSIONS = [
  {
    id: "first-flight",
    name: "First Flight",
    rings: [
      { x: 0, y: 70, z: 350, r: 24 },
      { x: 140, y: 110, z: 620, r: 26 },
      { x: 320, y: 140, z: 380, r: 26 },
      { x: 250, y: 100, z: 80, r: 24 },
      { x: 80, y: 55, z: -160, r: 24 },
    ],
  },
];

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

export function advanceMission(progress, state, agl, justLanded, landing) {
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
    if (ring && Math.hypot(state.x - ring.x, state.z - ring.z) < ring.r && Math.abs(state.y - ring.y) < ring.r) {
      progress.ringIndex += 1;
      progress.lastEvent = "ring";
      if (progress.ringIndex >= mission.rings.length) {
        progress.phase = "LAND";
        progress.lastEvent = "land";
      }
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
