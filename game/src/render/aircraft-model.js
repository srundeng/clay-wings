// Recognizable clay aircraft: capsule fuselage, tapered wings, tail, canopy,
// spinning propeller and retractable-looking wheels. Returns handles for anim.

export function buildAircraft(THREE, mat) {
  const group = new THREE.Group();
  group.name = "aircraft";

  const fus = new THREE.Mesh(new THREE.CapsuleGeometry(0.55, 2.2, 8, 16), mat(0xe4633d));
  fus.rotation.x = Math.PI / 2;
  fus.castShadow = true;
  group.add(fus);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.0, 16), mat(0xd8542f));
  nose.rotation.x = Math.PI / 2;
  nose.position.z = 2.1;
  group.add(nose);

  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), new THREE.MeshStandardMaterial({ color: 0x9fd6e6, roughness: 0.2, metalness: 0.1, transparent: true, opacity: 0.85 }));
  canopy.scale.set(0.9, 0.8, 1.6);
  canopy.position.set(0, 0.5, 0.2);
  group.add(canopy);

  const wing = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.16, 1.1), mat(0xf0c96a));
  wing.position.z = 0.1;
  wing.castShadow = true;
  group.add(wing);

  const tail = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.12, 0.6), mat(0xf0c96a));
  tail.position.set(0, 0.15, -1.5);
  group.add(tail);

  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.7, 0.6), mat(0xf0c96a));
  fin.position.set(0, 0.5, -1.5);
  group.add(fin);

  const prop = new THREE.Group();
  prop.position.z = 2.7;
  const blade = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 0.06), mat(0x2f2f2f));
  const blade2 = blade.clone();
  blade2.rotation.z = Math.PI / 2;
  prop.add(blade);
  prop.add(blade2);
  group.add(prop);

  const wheels = new THREE.Group();
  wheels.name = "wheels";
  const wheelGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.18, 10);
  const wheelMat = mat(0x2b2b2b);
  for (const sx of [-0.9, 0.9]) {
    const w = new THREE.Mesh(wheelGeo, wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(sx, -0.75, 0.2);
    wheels.add(w);
  }
  const noseWheel = new THREE.Mesh(wheelGeo, wheelMat);
  noseWheel.rotation.z = Math.PI / 2;
  noseWheel.position.set(0, -0.75, 1.7);
  wheels.add(noseWheel);
  group.add(wheels);

  return { group, prop, wheels };
}