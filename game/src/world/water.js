// Sea plane at y = 0 with a gentle clay-blue colour. Sits under the terrain.

import { WORLD_HALF } from "./terrain.js";

export function buildWater(THREE, mat) {
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_HALF * 4, WORLD_HALF * 4),
    new THREE.MeshStandardMaterial({ color: 0x2f7d8c, roughness: 0.4, metalness: 0.1, transparent: true, opacity: 0.92 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.4;
  water.name = "sea";
  return water;
}