// Camera-attached cockpit shell: thin windscreen frame, rounded glare shield,
// cowl with a translucent spinning prop disc, and wing roots. No thick slabs.

export function buildCockpit(THREE, doc, camera) {
  const group = new THREE.Group();
  group.name = "cockpit";
  const clay = (color, extra) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, ...(extra || {}) });

  const frameMat = clay(0x33403f);
  const shieldMat = clay(0x254044);

  function rod(radius, length, x, y, z, rotZ, material) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, length, 10), material);
    m.position.set(x, y, z);
    m.rotation.z = rotZ;
    group.add(m);
    return m;
  }

  rod(0.024, 0.85, -0.62, 0.02, -0.6, -0.18, frameMat);
  rod(0.024, 0.85, 0.62, 0.02, -0.6, 0.18, frameMat);
  rod(0.02, 1.15, 0, 0.44, -0.6, Math.PI / 2, frameMat);

  const shield = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.22, 0.12), shieldMat);
  shield.position.set(0, -0.42, -0.8);
  group.add(shield);
  rod(0.04, 1.35, 0, -0.31, -0.8, Math.PI / 2, shieldMat);

  const cowl = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 8), shieldMat);
  cowl.scale.set(1.3, 0.7, 1);
  cowl.position.set(0, -0.26, -0.95);
  group.add(cowl);

  const propSpin = new THREE.Group();
  propSpin.position.set(0, -0.24, -1.05);
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(0.14, 24),
    new THREE.MeshBasicMaterial({ color: 0xe8e2d6, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
  );
  propSpin.add(disc);
  for (const a of [0, Math.PI / 2]) {
    const blade = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.018, 0.012),
      new THREE.MeshBasicMaterial({ color: 0x3d4240, transparent: true, opacity: 0.55 }),
    );
    blade.rotation.z = a;
    propSpin.add(blade);
  }
  group.add(propSpin);

  const wingMat = clay(0xf0c96a);
  for (const side of [-1, 1]) {
    const root = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.07, 0.45), wingMat);
    root.position.set(side * 0.78, -0.38, -0.8);
    root.rotation.z = -side * 0.18;
    group.add(root);
  }

  camera.add(group);

  return {
    group,
    update(propAngle) {
      propSpin.rotation.z = propAngle;
    },
  };
}
