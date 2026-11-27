// Sunset sky helpers: sun light + cotton-ball clouds as instanced spheres.

export function buildSky(THREE, scene, doc) {
  scene.background = new THREE.Color(0xffb98a);
  scene.fog = new THREE.Fog(new THREE.Color(0xffc6a0), 400, 1500);

  const domeCanvas = doc.createElement("canvas");
  domeCanvas.width = 4;
  domeCanvas.height = 256;
  const g = domeCanvas.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#6f3a86");
  grad.addColorStop(0.34, "#c05f88");
  grad.addColorStop(0.58, "#f28a6b");
  grad.addColorStop(0.74, "#ffc48c");
  grad.addColorStop(1, "#8f6270");
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(1800, 32, 16),
    new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(domeCanvas), side: THREE.BackSide, depthWrite: false, fog: false }),
  );
  dome.name = "sky-dome";
  scene.add(dome);

  const hemi = new THREE.HemisphereLight(0xffd9e6, 0xb98a86, 1.15);
  scene.add(hemi);
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

  const cloudMat = new THREE.MeshStandardMaterial({ color: 0xfff2f4, roughness: 1, metalness: 0, emissive: 0x5a2f42, emissiveIntensity: 0.5 });
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
  return { sun, clouds, cloudMat, hemi };
}