// Camera-attached clay cockpit: instrument panel, three lit dials (artificial
// horizon, airspeed, altitude) and a canopy frame. Kept out of the near plane.

export function buildCockpit(THREE, doc, camera) {
  const group = new THREE.Group();
  group.name = "cockpit";
  const clay = (color) => new THREE.MeshStandardMaterial({ color, roughness: 0.92, metalness: 0 });

  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 0.16), clay(0x6b4a35));
  panel.position.set(0, -0.64, -1.2);
  panel.rotation.x = -0.24;
  group.add(panel);

  const shield = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.13, 0.34), clay(0x4a3325));
  shield.position.set(0, -0.38, -1.08);
  group.add(shield);

  function makeDial(x, radius, draw) {
    const canvas = doc.createElement("canvas");
    canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d");
    const tex = new THREE.CanvasTexture(canvas);
    const mesh = new THREE.Mesh(
      new THREE.CircleGeometry(radius, 32),
      new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide }),
    );
    mesh.position.set(x, -0.62, -1.05);
    mesh.rotation.x = -0.24;
    group.add(mesh);
    return { ctx, tex, draw };
  }

  const horizon = makeDial(0, 0.18, (ctx, state) => {
    ctx.clearRect(0, 0, 128, 128);
    ctx.save();
    ctx.translate(64, 64);
    ctx.rotate(-state.roll);
    const off = Math.max(-58, Math.min(58, state.pitch * 92));
    ctx.translate(0, off);
    ctx.fillStyle = "#5a9fd0";
    ctx.fillRect(-100, -100, 200, 100);
    ctx.fillStyle = "#a87544";
    ctx.fillRect(-100, 0, 200, 100);
    ctx.strokeStyle = "#fff4d6";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-100, 0);
    ctx.lineTo(100, 0);
    ctx.stroke();
    ctx.restore();
    ctx.strokeStyle = "#ffd23f";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(45, 64);
    ctx.lineTo(57, 64);
    ctx.moveTo(71, 64);
    ctx.lineTo(83, 64);
    ctx.stroke();
  });

  const speed = makeDial(-0.48, 0.11, (ctx, state) => {
    ctx.fillStyle = "#2a211c";
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = "#d9c9a8";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(64, 64, 54, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#f4ead2";
    ctx.font = "bold 28px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(Math.round(state.speed * 3.6)), 64, 74);
  });

  const alt = makeDial(0.48, 0.11, (ctx, state, agl) => {
    ctx.fillStyle = "#2a211c";
    ctx.fillRect(0, 0, 128, 128);
    ctx.strokeStyle = "#d9c9a8";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(64, 64, 54, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#f4ead2";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(Math.max(0, Math.round(agl))), 64, 74);
  });

  const frameMat = clay(0x7a6555);
  for (const sx of [-1, 1]) {
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.95, 0.045), frameMat);
    bar.position.set(sx * 0.65, 0.08, -0.92);
    group.add(bar);
  }
  const top = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.045, 0.045), frameMat);
  top.position.set(0, 0.56, -0.92);
  group.add(top);

  camera.add(group);

  return {
    group,
    update(state, agl) {
      horizon.draw(horizon.ctx, state);
      horizon.tex.needsUpdate = true;
      speed.draw(speed.ctx, state);
      speed.tex.needsUpdate = true;
      alt.draw(alt.ctx, state, agl);
      alt.tex.needsUpdate = true;
    },
  };
}
