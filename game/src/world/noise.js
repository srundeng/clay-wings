// Seeded 2D value noise, pure (no DOM, no three.js). Deterministic for a seed.

export function hash2(ix, iz, seed) {
  let h = Math.imul(ix | 0, 374761393) + Math.imul(iz | 0, 668265263) + Math.imul(seed | 0, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const smooth = (t) => t * t * (3 - 2 * t);

export function valueNoise2(x, z, seed) {
  const x0 = Math.floor(x);
  const z0 = Math.floor(z);
  const fx = x - x0;
  const fz = z - z0;
  const a = hash2(x0, z0, seed);
  const b = hash2(x0 + 1, z0, seed);
  const c = hash2(x0, z0 + 1, seed);
  const d = hash2(x0 + 1, z0 + 1, seed);
  const u = smooth(fx);
  const v = smooth(fz);
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + d * u) * v;
}

export function fbm(x, z, seed, octaves, lacunarity, gain) {
  const oct = octaves ?? 4;
  const lac = lacunarity ?? 2;
  const g = gain ?? 0.5;
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < oct; i += 1) {
    sum += amp * valueNoise2(x * freq, z * freq, seed + i * 101);
    norm += amp;
    amp *= g;
    freq *= lac;
  }
  return sum / norm;
}