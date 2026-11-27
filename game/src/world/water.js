// Sea plane at y = 0 with a gentle clay-blue colour. Sits under the terrain.

import { WORLD_HALF } from "./terrain.js";

export function buildWater(THREE, mat) {
  const water = new THREE.Mesh(
    new THREE.PlaneGeometry(WORLD_HALF * 4, WORLD_HALF * 4, 24, 24),
    new THREE.MeshStandardMaterial({ color: 0x2f7d8c, roughness: 0.4, metalness: 0.1, transparent: true, opacity: 0.92 }),
  );
  water.rotation.x = -Math.PI / 2;
  water.position.y = 0.4;
  water.name = "sea";
  const attr = water.geometry.attributes.position;
  water.userData.updateWaves = (t) => {
    for (let i = 0; i < attr.count; i += 1) {
      const x = attr.getX(i);
      const y = attr.getY(i);
      attr.setZ(i, Math.sin(x * 0.004 + t * 0.6) * 0.5 + Math.cos(y * 0.005 + t * 0.45) * 0.35);
    }
    attr.needsUpdate = true;
  };
  return water;
}