import * as THREE from "three";

const canvas = document.getElementById("game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const sky = new THREE.Color(1.0, 0.72, 0.62);
scene.background = sky;

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(3, 2, 5);
camera.lookAt(0, 0, 0);

const directional = new THREE.DirectionalLight(0xffffff, 2.2);
directional.position.set(4, 6, 5);
scene.add(directional);
scene.add(new THREE.AmbientLight(0xffeedd, 0.7));

function bumpTexture(size) {
  const canvas2d = document.createElement("canvas");
  canvas2d.width = size;
  canvas2d.height = size;
  const ctx = canvas2d.getContext("2d");
  ctx.fillStyle = "rgb(120,120,120)";
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 6) {
    for (let x = 0; x < size; x += 6) {
      const r = 2 + Math.random() * 3;
      const shade = 90 + Math.random() * 80;
      ctx.fillStyle = `rgb(${shade},${shade},${shade})`;
      ctx.beginPath();
      ctx.arc(x + 3 + Math.random() * 3, y + 3 + Math.random() * 3, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas2d);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

const clayColor = new THREE.Color(0.92, 0.55, 0.35);
const material = new THREE.MeshStandardMaterial({
  color: clayColor,
  roughness: 0.85,
  bumpMap: bumpTexture(256),
  bumpScale: 0.05,
});

const blobby = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 40), material);
const squash = new THREE.Group();
squash.scale.set(1, 0.85, 1.15);
squash.add(blobby);
scene.add(squash);

const occluder = new THREE.Mesh(new THREE.CircleGeometry(1, 4), material);
occluder.position.y = -1.4;
occluder.rotation.x = -Math.PI / 2;
occluder.visible = false;
scene.add(occluder);

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", resize);

let frames = 0;
function tick() {
  squash.rotation.y += 0.012;
  squash.rotation.x = Math.sin(frames * 0.02) * 0.1;
  squash.position.y = Math.sin(frames * 0.05) * 0.15;
  renderer.render(scene, camera);
  frames += 1;
  if (frames === 20) window.__READY__ = true;
  requestAnimationFrame(tick);
}
tick();