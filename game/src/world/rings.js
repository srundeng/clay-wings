// Ring beacons for the active mission. Emissive intensity marks the next ring.

import { getMission } from "../missions.js";

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
      roughness: 0.75,
      metalness: 0,
    });
    const mesh = new THREE.Mesh(new THREE.TorusGeometry(ring.r, 1.4, 8, 24), material);
    mesh.position.set(ring.x, ring.y, ring.z);
    mesh.rotation.y = Math.atan2(ring.x - prev.x, ring.z - prev.z);
    group.add(mesh);
    meshes.push(mesh);
    prev = ring;
  }

  return {
    group,
    meshes,
    setActive(index) {
      for (let i = 0; i < meshes.length; i += 1) {
        const active = i === index;
        meshes[i].material.emissiveIntensity = active ? 1.4 : 0.25;
        meshes[i].material.color.setHex(active ? 0xffe08a : 0xc9a86a);
      }
    },
  };
}
