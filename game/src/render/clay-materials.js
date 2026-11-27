// Procedural clay surface: a tiling canvas bump map with layered noise,
// thumbprint swirls and small dents, plus a MeshStandardMaterial factory that
// gives each object a slight colour jitter.

import { makeRandom } from "../random.js";

export function createClayMaterials(THREE, doc, seed = 7) {
  const rnd = makeRandom(seed);
  const canvas = doc.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgb(138,138,138)";
  ctx.fillRect(0, 0, 512, 512);

  for (let layer = 0; layer < 3; layer += 1) {
    for (let i = 0; i < 700; i += 1) {
      const v = 100 + Math.floor(rnd() * 78);
      ctx.fillStyle = "rgba(" + v + "," + v + "," + v + ",0.35)";
      ctx.beginPath();
      ctx.arc(rnd() * 512, rnd() * 512, 1 + rnd() * 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.lineWidth = 2;
  for (let k = 0; k < 18; k += 1) {
    const cx = rnd() * 512;
    const cy = rnd() * 512;
    const v = 110 + Math.floor(rnd() * 60);
    for (let ring = 1; ring <= 5; ring += 1) {
      ctx.strokeStyle = "rgba(" + v + "," + v + "," + v + ",0.4)";
      ctx.beginPath();
      ctx.arc(cx, cy, ring * 6 + rnd() * 3, rnd() * 2, rnd() * 2 + Math.PI * 1.2);
      ctx.stroke();
    }
  }

  for (let k = 0; k < 220; k += 1) {
    ctx.fillStyle = "rgba(70,70,70,0.35)";
    ctx.beginPath();
    ctx.arc(rnd() * 512, rnd() * 512, 1 + rnd() * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  const bump = new THREE.CanvasTexture(canvas);
  bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  bump.repeat.set(6, 6);

  function mat(color, opts) {
    const jitter = 1 + (rnd() - 0.5) * 0.08;
    const base = new THREE.Color(color).multiplyScalar(jitter);
    return new THREE.MeshStandardMaterial({
      color: base,
      roughness: 0.9,
      metalness: 0,
      bumpMap: bump,
      bumpScale: 0.025,
      ...(opts || {}),
    });
  }

  return { mat, bump, info: { bumpSize: canvas.width, roughness: 0.9, repeat: 6 } };
}
