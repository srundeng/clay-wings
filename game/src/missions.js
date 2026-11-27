// Pure mission definitions and progress rules. Three goals, 1-3 star results.

const HOME_RINGS = [
  { x: 0, y: 170, z: 350, r: 60 },
  { x: 140, y: 115, z: 620, r: 65 },
  { x: 320, y: 145, z: 380, r: 65 },
  { x: 250, y: 105, z: 80, r: 60 },
  { x: 60, y: 65, z: -180, r: 60 },
];

export const MISSIONS = [
  {
    id: "first-flight", name: "First Flight", fuelScale: 0.45,
    land: "home", rings: HOME_RINGS,
  },
  {
    id: "mail-run", name: "Mail Run", fuelScale: 0.7,
    land: "harbour",
    drop: { x: 720, y: 110, z: -470, r: 70, maxAlt: 150, maxSpeed: 90 },
    rings: [],
  },
  {
    id: "beacon-sweep", name: "Beacon Sweep", fuelScale: 0.6,
    land: "home",
    beacons: [
      { x: -380, y: 90, z: 420, r: 75 },
      { x: 340, y: 120, z: 700, r: 75 },
      { x: 650, y: 110, z: -180, r: 75 },
      { x: -620, y: 130, z: -420, r: 75 },
      { x: 180, y: 80, z: -320, r: 75 },
    ],
    rings: [],
  },
];

export function missionTargets(id) {
  const mission = getMission(id);
  return mission.rings.length ? mission.rings : (mission.drop ? [mission.drop] : mission.beacons);
}

export function getMission(id) {
  return MISSIONS.find((m) => m.id === id) || MISSIONS[0];
}

export function createMissionState(id = "first-flight") {
  const mission = getMission(id);
  return {
    id: mission.id, phase: "TAKEOFF", ringIndex: 0, visited: [], dropped: false,
    complete: false, failed: false, stars: 0, lastEvent: null,
  };
}

export function objectiveText(progress) {
  if (progress.complete) return "Mission complete";
  if (progress.failed) return "Mission failed - press R to retry";
  if (progress.phase === "TAKEOFF") return "Take off from Home Runway";
  if (progress.phase === "RINGS") {
    return "Fly through ring " + (progress.ringIndex + 1) + " of " + getMission(progress.id).rings.length;
  }
  if (progress.phase === "DROP") return "Fly to the Harbour drop ring";
  if (progress.phase === "BEACONS") return "Beacons " + progress.visited.length + "/5 - fly over any beacon";
  if (progress.phase === "LAND") {
    return progress.id === "mail-run" ? "Land on Harbour Runway" : "Land on Home Runway";
  }
  return "";
}

export function ringCountText(progress) {
  if (progress.id === "mail-run") return progress.dropped ? "DROPPED" : "0/1";
  if (progress.id === "beacon-sweep") return progress.visited.length + "/5";
  return progress.ringIndex + "/" + getMission(progress.id).rings.length;
}

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

export function activeRing(progress) {
  const mission = getMission(progress.id);
  if (progress.phase === "RINGS") return mission.rings[progress.ringIndex] || null;
  if (progress.phase === "DROP") return mission.drop || null;
  if (progress.phase === "BEACONS") {
    const next = mission.beacons.find((b, i) => !progress.visited.includes(i));
    return next || null;
  }
  return null;
}

export function activeIndex(progress) {
  if (progress.phase === "TAKEOFF") return 0;
  if (progress.phase === "RINGS") return progress.ringIndex;
  if (progress.phase === "DROP") return 0;
  if (progress.phase === "BEACONS") {
    const mission = getMission(progress.id);
    return mission.beacons.findIndex((b, i) => !progress.visited.includes(i));
  }
  return -1;
}

export function dropParcel(progress, state) {
  if (progress.id !== "mail-run" || progress.phase !== "DROP" || progress.dropped) {
    return { ok: false, text: "No parcel to drop" };
  }
  const ring = getMission(progress.id).drop;
  const inside = Math.hypot(state.x - ring.x, state.z - ring.z) < ring.r;
  if (!inside || state.y > ring.maxAlt || state.speed > ring.maxSpeed) {
    return { ok: false, text: "DROP: under 150 m and 90 m/s inside ring" };
  }
  progress.dropped = true;
  progress.phase = "LAND";
  progress.lastEvent = "drop";
  return { ok: true, text: "PARCEL DROPPED" };
}

function finish(progress, state, landing, landedAt) {
  const mission = getMission(progress.id);
  const wrongField = landedAt && landedAt !== "home" && landedAt !== "harbour";
  const wrongRunway = landedAt && mission.land && landedAt !== mission.land;
  if (!landing || landing.rating === "CRASH" || wrongField || wrongRunway) {
    progress.failed = true;
    progress.lastEvent = "failed";
    return;
  }
  progress.complete = true;
  progress.stars = 1;
  if (landing.rating === "SMOOTH" || landing.rating === "FIRM") progress.stars += 1;
  if (state.fuel > 35 && state.hull > 70) progress.stars += 1;
  progress.lastEvent = "complete";
}

export function advanceMission(progress, state, agl, justLanded, landing, prev, landedAt) {
  progress.lastEvent = null;
  const mission = getMission(progress.id);
  if (progress.complete || progress.failed) return progress;

  if (progress.phase === "TAKEOFF") {
    if (!state.onGround && agl > 30) {
      progress.phase = mission.id === "first-flight" ? "RINGS" : (mission.id === "mail-run" ? "DROP" : "BEACONS");
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

  if (progress.phase === "BEACONS") {
    for (let i = 0; i < mission.beacons.length; i += 1) {
      if (progress.visited.includes(i)) continue;
      const b = mission.beacons[i];
      if (crossedRing(prev, state, b) || Math.hypot(state.x - b.x, state.z - b.z) < b.r) {
        progress.visited.push(i);
        progress.lastEvent = "beacon";
        if (progress.visited.length >= mission.beacons.length) progress.phase = "LAND";
        break;
      }
    }
    return progress;
  }

  if (progress.phase === "DROP") return progress;
  if (justLanded) finish(progress, state, landing, landedAt);
  return progress;
}
