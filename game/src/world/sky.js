// Sunset sky helpers: sun light + cotton-ball clouds as instanced spheres.

export function buildSky(THREE, scene) {
  scene.background = new THREE.Color(0xffb98a);
  scene.fog = new THREE.Fog(new THREE.Color(0xffc6a0), 400, 1500);

  scene.add(new THREE.HemisphereLight(0xffe0c0, 0x5a4a48, 0.85));
  const sun = new THREE.DirectionalLight(0xfff0d0, 2.1);
  sun.position.set(300, 380, 200);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -160;
  sun.shadow.camera.right = 160;
  sun.shadow.camera.top = 160;
  sun.shadow.camera.bottom = -160;
  scene.add(sun);
  scene.add(sun.target);

  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xfff4ea, roughness: 1, metalness: 0 });
  const puff = new THREE.SphereGeometry(1, 8, 8);
  const clusters = 26;
  const perCluster = 5;
  const clouds = new THREE.InstancedMesh(puff, cloudMat, clusters * perCluster);
  const dummy = new THREE.Object3D();
  let i = 0;
  let seed = 1234;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  for (let c = 0; c < clusters; c += 1) {
    const bx = (rnd() - 0.5) * 1600;
    const by = 260 + rnd() * 220;
    const bz = (rnd() - 0.5) * 1600;
    for (let p = 0; p < perCluster; p += 1) {
      const s = 12 + rnd() * 16;
      dummy.position.set(bx + (rnd() - 0.5) * 40, by + (rnd() - 0.5) * 10, bz + (rnd() - 0.5) * 40);
      dummy.scale.set(s, s * 0.7, s);
      dummy.updateMatrix();
      clouds.setMatrixAt(i, dummy.matrix);
      i += 1;
    }
  }
  clouds.instanceMatrix.needsUpdate = true;
  clouds.name = "clouds";
  scene.add(clouds);
  return { sun, clouds };
}