// Archipelago heightfield. This module is the single source of ground truth:
// groundHeightAt(x, z) drives BOTH the visible terrain mesh and the flight
// model's ground collision, so they can never disagree.

import { fbm } from "./noise.js";

export const WORLD_HALF = 1200;
export const GRID = 257;

// Islands: broad low home island, a tall mountain island, and a harbour island.
// multiplier keeps the mountain peak inside 300..500 m.
const ISLANDS = [
  { cx: 0, cz: 150, radius: 700, peak: 34, seed: 11, lo: 0.7, hi: 0.4 },
  { cx: -820, cz: -700, radius: 520, peak: 400, seed: 27, lo: 0.75, hi: 0.35 },
  { cx: 720, cz: -320, radius: 460, peak: 30, seed: 41, lo: 0.7, hi: 0.4 },
];

// Axis-aligned runways. The core rectangle is exactly flat; a margin outside
// blends to the natural terrain so the edges look like clay plateaus.
export const RUNWAYS = [
  { name: "Home", cx: 0, cz: 150, halfW: 9, halfL: 250, flat: 12, margin: 40 },
  { name: "Harbour", cx: 720, cz: -300, halfW: 8, halfL: 150, flat: 14, margin: 36 },
];

export const SEA_LEVEL = 0;

function islandHeight(x, z, isl) {
  const dx = x - isl.cx;
  const dz = z - isl.cz;
  const d = Math.hypot(dx, dz);
  if (d >= isl.radius) return 0;
  const t = 1 - d / isl.radius;
  const shape = t * t * (3 - 2 * t);
  const n = fbm(x * 0.0042 + 100, z * 0.0042 + 100, isl.seed, 5, 2.1, 0.5);
  const mult = isl.lo + isl.hi * n;
  return isl.peak * shape * mult;
}

function baseHeight(x, z) {
  let h = 0;
  for (let i = 0; i < ISLANDS.length; i += 1) {
    const v = islandHeight(x, z, ISLANDS[i]);
    if (v > h) h = v;
  }
  return h;
}

export function groundHeightAt(x, z) {
  const b = baseHeight(x, z);
  for (let i = 0; i < RUNWAYS.length; i += 1) {
    const r = RUNWAYS[i];
    const dx = Math.abs(x - r.cx);
    const dz = Math.abs(z - r.cz);
    if (dx <= r.halfW && dz <= r.halfL) return r.flat;
    const ox = dx > r.halfW ? dx - r.halfW : 0;
    const oz = dz > r.halfL ? dz - r.halfL : 0;
    const dOut = Math.hypot(ox, oz);
    if (dOut < r.margin) {
      const k = dOut / r.margin;
      return r.flat * (1 - k) + b * k;
    }
  }
  return b;
}

// Colour by elevation and slope, as clay-looking vertex colours.
function colorFor(h, slope, out) {
  const sand = [0.9, 0.8, 0.6];
  const grass = [0.52, 0.66, 0.4];
  const rock = [0.64, 0.56, 0.52];
  const snow = [0.93, 0.93, 0.95];
  let c;
  if (h < 2.5) c = sand;
  else if (h < 90) c = grass;
  else if (h < 260) c = rock;
  else c = snow;
  // Steep slopes turn rocky.
  const steep = Math.min(1, Math.max(0, (slope - 0.6) * 1.6));
  c = [c[0] * (1 - steep) + rock[0] * steep, c[1] * (1 - steep) + rock[1] * steep, c[2] * (1 - steep) + rock[2] * steep];
  out[0] = c[0];
  out[1] = c[1];
  out[2] = c[2];
}

export function buildTerrainMesh(THREE, mat) {
  const n = GRID;
  const span = 2 * WORLD_HALF;
  const step = span / (n - 1);
  const positions = new Float32Array(n * n * 3);
  const colors = new Float32Array(n * n * 3);
  const rgb = [0, 0, 0];
  const dx = 4;
  for (let iz = 0; iz < n; iz += 1) {
    const z = -WORLD_HALF + iz * step;
    for (let ix = 0; ix < n; ix += 1) {
      const x = -WORLD_HALF + ix * step;
      const y = groundHeightAt(x, z);
      const i3 = (iz * n + ix) * 3;
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      const sx = (groundHeightAt(x + dx, z) - groundHeightAt(x - dx, z)) / (2 * dx);
      const sz = (groundHeightAt(x, z + dx) - groundHeightAt(x, z - dx)) / (2 * dx);
      const slope = Math.hypot(sx, sz);
      colorFor(y, slope, rgb);
      colors[i3] = rgb[0];
      colors[i3 + 1] = rgb[1];
      colors[i3 + 2] = rgb[2];
    }
  }
  const indices = [];
  for (let iz = 0; iz < n - 1; iz += 1) {
    for (let ix = 0; ix < n - 1; ix += 1) {
      const a = iz * n + ix;
      const b = a + 1;
      const c = a + n;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const material = mat ? mat(0xffffff, { vertexColors: true }) : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  mesh.name = "terrain";
  return mesh;
}