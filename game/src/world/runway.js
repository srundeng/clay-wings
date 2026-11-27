// Runway meshes that sit exactly on the flat terrain core (same RUNWAYS data
// that groundHeightAt flattens). Markings, edge lights and a windsock.

import { RUNWAYS } from "./terrain.js";

export function buildRunways(THREE, mat) {
  const group = new THREE.Group();
  group.name = "runways";
  const info = [];

  for (let i = 0; i < RUNWAYS.length; i += 1) {
    const r = RUNWAYS[i];
    const y = r.flat + 0.15;

    const shoulder = new THREE.Mesh(new THREE.PlaneGeometry((r.halfW + 4) * 2, (r.halfL + 2) * 2), mat(0xd9c7a8));
    shoulder.rotation.x = -Math.PI / 2;
    shoulder.position.set(r.cx, r.flat + 0.1, r.cz);
    shoulder.receiveShadow = true;
    group.add(shoulder);

    const surface = new THREE.Mesh(new THREE.PlaneGeometry(r.halfW * 2, r.halfL * 2), mat(0x3d4246));
    surface.rotation.x = -Math.PI / 2;
    surface.position.set(r.cx, y, r.cz);
    surface.receiveShadow = true;
    group.add(surface);

    // Centreline dashes.
    const dashCount = Math.floor(r.halfL / 12);
    for (let d = 0; d < dashCount; d += 1) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 5), mat(0xf2ead6));
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(r.cx, y + 0.01, r.cz - r.halfL + 8 + d * 12);
      group.add(dash);
    }

    // Edge lights along both sides, as one instanced mesh.
    const lampGeo = new THREE.SphereGeometry(0.45, 6, 6);
    const lampMat = new THREE.MeshStandardMaterial({ color: 0xfff2b0, emissive: 0xffcc55, emissiveIntensity: 0.9 });
    const perSide = Math.floor(r.halfL / 10);
    const lights = new THREE.InstancedMesh(lampGeo, lampMat, perSide * 2);
    const dummy = new THREE.Object3D();
    let k = 0;
    for (let side = -1; side <= 1; side += 2) {
      for (let s = 0; s < perSide; s += 1) {
        dummy.position.set(r.cx + side * (r.halfW + 1.2), y + 0.3, r.cz - r.halfL + 5 + s * 10);
        dummy.updateMatrix();
        lights.setMatrixAt(k, dummy.matrix);
        k += 1;
      }
    }
    lights.instanceMatrix.needsUpdate = true;
    group.add(lights);

    // Windsock: pole + orange cone near the start.
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 6, 6), mat(0x8a8f7c));
    pole.position.set(r.cx + r.halfW + 6, y + 3, r.cz - r.halfL + 10);
    group.add(pole);
    const sock = new THREE.Mesh(new THREE.ConeGeometry(1.1, 3.2, 10), mat(0xe6772e));
    sock.rotation.z = Math.PI / 2;
    sock.position.set(r.cx + r.halfW + 7.6, y + 5.6, r.cz - r.halfL + 10);
    group.add(sock);
    info.push({ flat: r.flat, surfaceY: y, halfW: r.halfW, halfL: r.halfL, shoulderW: r.halfW + 4 });
  }
  group.userData.runwayInfo = info;
  return group;
}