// Deterministic scattered props: palm trunks + fronds and a few rocks, placed on
// island slopes (never on a runway), as instanced meshes to keep draw calls low.

import { groundHeightAt, RUNWAYS } from "./terrain.js";

function onRunway(x, z) {
  for (let i = 0; i < RUNWAYS.length; i += 1) {
    const r = RUNWAYS[i];
    if (Math.abs(x - r.cx) <= r.halfW + r.margin && Math.abs(z - r.cz) <= r.halfL + r.margin) return true;
  }
  return false;
}

export function buildProps(THREE, mat, random) {
  const group = new THREE.Group();
  group.name = "props";
  const rnd = random;
  const MAX = 160;
  const spots = [];
  let tries = 0;
  while (spots.length < MAX && tries < MAX * 40) {
    tries += 1;
    const x = (rnd() - 0.5) * 2200;
    const z = (rnd() - 0.5) * 2200;
    const h = groundHeightAt(x, z);
    if (h < 3 || h > 120) continue;
    if (onRunway(x, z)) continue;
    spots.push([x, h, z]);
  }

  const trunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 8, 6);
  const trunk = new THREE.InstancedMesh(trunkGeo, mat(0x7a4a2b), spots.length);
  const frondGeo = new THREE.ConeGeometry(4.5, 3, 8);
  const frond = new THREE.InstancedMesh(frondGeo, mat(0x3f7a3a), spots.length);
  const dummy = new THREE.Object3D();
  for (let i = 0; i < spots.length; i += 1) {
    const [x, h, z] = spots[i];
    dummy.position.set(x, h + 4, z);
    dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    trunk.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, h + 8.6, z);
    dummy.rotation.set(0, rnd() * Math.PI * 2, 0);
    dummy.updateMatrix();
    frond.setMatrixAt(i, dummy.matrix);
  }
  trunk.instanceMatrix.needsUpdate = true;
  frond.instanceMatrix.needsUpdate = true;
  group.add(trunk);
  group.add(frond);

  // Rocks near the mountains.
  const rockGeo = new THREE.IcosahedronGeometry(3, 0);
  const rocks = new THREE.InstancedMesh(rockGeo, mat(0x6d6660), 60);
  let ri = 0;
  let rt = 0;
  while (ri < 60 && rt < 2000) {
    rt += 1;
    const x = (rnd() - 0.5) * 2200;
    const z = (rnd() - 0.5) * 2200;
    const h = groundHeightAt(x, z);
    if (h < 150 || h > 360) continue;
    dummy.position.set(x, h + 1.5, z);
    dummy.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    const s = 0.6 + rnd() * 1.2;
    dummy.scale.set(s, s, s);
    dummy.updateMatrix();
    rocks.setMatrixAt(ri, dummy.matrix);
    ri += 1;
  }
  rocks.count = ri;
  rocks.instanceMatrix.needsUpdate = true;
  group.add(rocks);

  // Houses: tinted bodies + roofs on the settled lowlands.
  const houseSpots = [];
  let ht = 0;
  while (houseSpots.length < 26 && ht < 4000) {
    ht += 1;
    const x = (rnd() - 0.5) * 2000;
    const z = (rnd() - 0.5) * 2000;
    const h = groundHeightAt(x, z);
    if (h < 8 || h > 70) continue;
    if (onRunway(x, z)) continue;
    houseSpots.push([x, h, z]);
  }
  const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(5, 4, 4.5), mat(0xffffff), houseSpots.length);
  const roofs = new THREE.InstancedMesh(new THREE.ConeGeometry(4.2, 2.6, 4), mat(0xffffff), houseSpots.length);
  const bodyPal = [0xd9b08c, 0xc9a06f, 0xe0c39a, 0xb98f6a];
  const roofPal = [0xb5523e, 0x8a4b3a, 0xa35a42];
  const col = new THREE.Color();
  for (let i = 0; i < houseSpots.length; i += 1) {
    const [x, h, z] = houseSpots[i];
    const rot = rnd() * Math.PI;
    dummy.position.set(x, h + 2, z);
    dummy.rotation.set(0, rot, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    bodies.setMatrixAt(i, dummy.matrix);
    bodies.setColorAt(i, col.setHex(bodyPal[i % bodyPal.length]));
    dummy.position.set(x, h + 5.3, z);
    dummy.rotation.set(0, rot + Math.PI / 4, 0);
    dummy.updateMatrix();
    roofs.setMatrixAt(i, dummy.matrix);
    roofs.setColorAt(i, col.setHex(roofPal[i % roofPal.length]));
  }
  bodies.instanceMatrix.needsUpdate = true;
  roofs.instanceMatrix.needsUpdate = true;
  if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
  if (roofs.instanceColor) roofs.instanceColor.needsUpdate = true;
  group.add(bodies);
  group.add(roofs);

  // Landmark spires (home, mountain, harbour).
  const spireGeo = new THREE.ConeGeometry(2.2, 16, 8);
  for (const [sx, sz] of [[120, 150], [-820, -700], [820, -320]]) {
    const sp = new THREE.Mesh(spireGeo, mat(0xeee6d0));
    sp.position.set(sx, groundHeightAt(sx, sz) + 8, sz);
    group.add(sp);
  }

  // A small pier reaching into the sea from the home island's south shore.
  const planks = new THREE.InstancedMesh(new THREE.BoxGeometry(9, 0.4, 5), mat(0x9c7a52), 7);
  for (let i = 0; i < 7; i += 1) {
    dummy.position.set(0, 1.1, -548 - i * 6);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.set(1, 1, 1);
    dummy.updateMatrix();
    planks.setMatrixAt(i, dummy.matrix);
  }
  planks.instanceMatrix.needsUpdate = true;
  group.add(planks);

  return group;
}
