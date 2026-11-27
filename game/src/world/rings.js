// Large, bright ring beacons. The active ring pulses warm yellow-white; the
// next one glows dim teal so a gentle turn always has a visible target.

import { getMission } from "../missions.js";

const TUBE = 6;

export function buildRings(THREE, missionId) {
  const group = new THREE.Group();
  group.name = "mission-rings";
  const rings = getMission(missionId).rings;
  const meshes = [];
  let prev = { x: 0, z: 0 };
  for (const ring of rings) {
    const material = new THREE.MeshStandardMaterial({
      color: 0xc9a86a,
      emissive: 0xff8a2b,
      emissiveIntensity: 0.25,
      roughness: 0.7,
      metalness: 0,
    });
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(ring.r, TUBE, 10, 32), material);
    mesh.position.set(ring.x, ring.y, ring.z);
    mesh.rotation.y = Math.atan2(ring.x - prev.x, ring.z - prev.z);
    group.add(mesh);
    meshes.push(mesh);
    prev = ring;
  }

  return {
    group,
    meshes,
    info: rings.map((r, i) => ({
      radius: r.r,
      tube: TUBE,
      gap: Math.hypot(r.x - (i ? rings[i - 1].x : 0), r.z - (i ? rings[i - 1].z : 0)),
    })),
    update(index, time) {
      for (let i = 0; i < meshes.length; i += 1) {
        const material = meshes[i].material;
        if (i === index) {
          material.color.setHex(0xfff6d2);
          material.emissive.setHex(0xffd45a);
          material.emissiveIntensity = 1.35 + 0.45 * Math.sin(time * 4);
        } else if (i === index + 1) {
          material.color.setHex(0x66d7d0);
          material.emissive.setHex(0x1f8f8a);
          material.emissiveIntensity = 0.55;
        } else {
          material.color.setHex(0x8f9d9a);
          material.emissive.setHex(0x244a48);
          material.emissiveIntensity = 0.18;
        }
      }
    },
  };
}
