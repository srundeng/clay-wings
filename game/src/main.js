import * as THREE from "three";
import { createFlightState, stepFlight } from "./flight-model.js";
import { createInput } from "./input.js";

const canvas = document.getElementById("game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
const sky = new THREE.Color(1.0, 0.72, 0.62);
scene.background = sky;
scene.fog = new THREE.Fog(sky, 60, 240);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 400);
camera.position.set(0, 6, -14);

scene.add(new THREE.HemisphereLight(0xffd9c0, 0x6a4a48, 0.9));
const sun = new THREE.DirectionalLight(0xffeecc, 2.0);
sun.position.set(40, 60, 20);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

// END_OF_HEAD

function makeClayMat(color, bumpTex) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.82, metalness: 0.02, bumpMap: bumpTex, bumpScale: 0.03 });
}

function clayBump(size) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgb(140,140,140)";
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 5) {
    for (let x = 0; x < size; x += 5) {
      const shade = 110 + Math.random() * 60;
      ctx.fillStyle = "rgb(" + shade + "," + shade + "," + shade + ")";
      ctx.beginPath();
      ctx.arc(x + 2, y + 2, 1.5 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 8);
  return tex;
}

// END_BUILD

const clayTex = clayBump(128);

const ground = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000), makeClayMat(0x5f8a4a, clayTex));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const runway = new THREE.Mesh(new THREE.PlaneGeometry(14, 500), makeClayMat(0x8a8f7c, clayTex));
runway.rotation.x = -Math.PI / 2;
runway.position.set(0, 0.02, 150);
runway.receiveShadow = true;
scene.add(runway);

const dashMat = makeClayMat(0xf0e6cf, clayTex);
for (let i = 0; i < 14; i += 1) {
  const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 8), dashMat);
  dash.rotation.x = -Math.PI / 2;
  dash.position.set(0, 0.04, -20 + i * 22);
  scene.add(dash);
}

// placeholder clay plane
const plane = new THREE.Group();
const fusMat = makeClayMat(0xe4633d, clayTex);
const wingMat = makeClayMat(0xf0c96a, clayTex);
const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, 1.6, 6, 12), fusMat);
body.rotation.x = Math.PI / 2;
body.castShadow = true;
plane.add(body);
const nose = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.8, 12), fusMat);
nose.rotation.x = Math.PI / 2;
nose.position.z = 1.5;
plane.add(nose);
const wing = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.12, 0.8), wingMat);
wing.position.z = 0.15;
wing.castShadow = true;
plane.add(wing);
const tailW = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.1, 0.5), wingMat);
tailW.position.set(0, 0.1, -1.05);
plane.add(tailW);
const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.5), wingMat);
fin.position.set(0, 0.3, -1.05);
plane.add(fin);
const prop = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.08, 0.04), makeClayMat(0x333333, clayTex));
prop.position.z = 1.95;
plane.add(prop);
scene.add(plane);

// END_WORLD

const state = createFlightState({ y: 1.6 });
const input = createInput(window);

const hud = document.createElement("div");
hud.id = "hud";
document.body.appendChild(hud);

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", resize);

const clock = new THREE.Clock();
let frames = 0;
let propAngle = 0;
const camPos = new THREE.Vector3(0, 6, -14);
const camLook = new THREE.Vector3(0, 2, 0);

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const c = input.sample();

  stepFlight(state, c, dt, function () { return 0; });
  if (state.onGround && c.gearToggle) state.gearDown = !state.gearDown;
  propAngle += (6 + state.throttle * 60) * dt;

  plane.position.set(state.x, state.y, state.z);
  plane.rotation.order = "YXZ";
  plane.rotation.y = state.heading;
  plane.rotation.x = -state.pitch;
  plane.rotation.z = state.roll;
  prop.rotation.z = propAngle;

  const back = 13;
  const up = 4.5;
  const desired = new THREE.Vector3(
    state.x - Math.sin(state.heading) * Math.cos(state.pitch) * back,
    state.y + up - Math.sin(state.pitch) * back,
    state.z - Math.cos(state.heading) * Math.cos(state.pitch) * back,
  );
  camPos.lerp(desired, 1 - Math.pow(0.001, dt));
  camera.position.copy(camPos);

  const look = new THREE.Vector3(state.x, state.y + 1, state.z);
  camLook.lerp(look, 1 - Math.pow(0.0001, dt));
  camera.lookAt(camLook);

  hud.textContent =
    "SPD " + state.speed.toFixed(0) + " ALT " + state.y.toFixed(0) + " THR " + Math.round(state.throttle * 100) + "%" +
    (state.onGround ? " GROUND" : "");

  renderer.render(scene, camera);
  frames += 1;
  if (frames === 10) window.__READY__ = true;
  requestAnimationFrame(tick);
}

tick();
