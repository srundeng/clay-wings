import * as THREE from "three";
import { createFlightState, stepFlight } from "./flight-model.js";
import { createInput } from "./input.js";
import { createHud } from "./hud/hud.js";
import { assembleScene } from "./render/scene.js";
import { buildCockpit } from "./render/cockpit.js";
import { createInstruments } from "./hud/instruments.js";
import { stepFuel, damageHull, engineOut, crashed } from "./fuel-and-damage.js";
import { classifyLanding } from "./landing.js";
import { createMissionState, advanceMission, objectiveText, activeRing, getMission } from "./missions.js";
import { buildRings } from "./world/rings.js";
import { createScreens } from "./hud/screens.js";
import { RUNWAYS } from "./world/terrain.js";

const canvas = document.getElementById("game");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 4000);
camera.position.set(0, 20, -20);
camera.near = 0.1;
scene.add(camera);

const seedParam = new URLSearchParams(location.search).get("seed");
const seed = Number(seedParam) || 7;
const shotMode = new URLSearchParams(location.search).get("shot") || "play";
const isShotScene = new URLSearchParams(location.search).has("shot");
const world = assembleScene(THREE, scene, document, seed);
const cockpit = buildCockpit(THREE, document, camera);
const instruments = createInstruments(document);
const groundHeightAt = world.groundHeightAt;

const startY = groundHeightAt(0, 0) + 1.6;
const state = createFlightState({ x: 0, y: startY, z: 0, heading: 0 });
const input = createInput(window);
const hud = createHud(document);
const rings = buildRings(THREE, "first-flight");
scene.add(rings.group);
const screens = createScreens(document);
let missionState = createMissionState("first-flight");
let phase = "TITLE";
let prevOnGround = true;
let landingText = "";

function setPhase(next, data) {
  phase = next;
  if (next === "TITLE") screens.show("TITLE");
  else if (next === "BRIEFING") screens.show("BRIEFING", data);
  else if (next === "RESULT") screens.show("RESULT", data);
  else if (next === "CRASH") screens.show("CRASH", data);
  else screens.hide();
}

const hintEl = document.createElement("div");
hintEl.id = "controls-hint";
hintEl.innerHTML =
  "Z/Shift throttle up &middot; X/Ctrl down &middot; W/S pitch &middot; A/D roll &middot; Q/E rudder &middot; B brake &middot; G gear &middot; C camera &middot; P pause &middot; R restart &middot; M mouse &middot; I invert &middot; T assist &middot; H hint &middot; click to steer";
if (!isShotScene) document.body.appendChild(hintEl);

function resize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", resize);

const clock = new THREE.Clock();
const startedAt = performance.now();
let frames = 0;
let elapsed = 0;
let propAngle = 0;
let paused = false;
let cameraMode = shotMode === "cockpit" ? 1 : 0;
if (isShotScene) setPhase("FLYING"); else setPhase("TITLE", { name: "First Flight", objective: objectiveText(missionState) });
let restarts = 0;
let hintForced = false;
const camPos = new THREE.Vector3(state.x, state.y + 8, state.z - 16);
const camLook = new THREE.Vector3(state.x, state.y, state.z);
const EYE = new THREE.Vector3(0, 0.55, 0.3);
const COCKPIT_YAW = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);

function resetMission() {
  Object.assign(state, createFlightState({ x: 0, y: groundHeightAt(0, 0) + 1.6, z: 0, heading: 0 }));
  missionState = createMissionState("first-flight");
  prevOnGround = true;
  landingText = "";
  hud.flash("");
  setPhase("FLYING");
  restarts += 1;
}

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const c = input.sample();

  if (c.start && (phase === "TITLE" || phase === "BRIEFING")) setPhase("FLYING");
  if (c.pauseToggle) paused = !paused;
  if (c.cameraToggle) cameraMode = 1 - cameraMode;
  if (c.restart) resetMission();
  if (c.hintToggle) hintForced = true;

  let landing = null;
  if (!paused && phase === "FLYING") {
    const sinkBefore = -state.verticalSpeed;
    const groundBefore = groundHeightAt(state.x, state.z);
    const flightC = {
      pitch: c.pitch,
      roll: c.roll,
      yaw: c.yaw,
      throttleDelta: engineOut(state) ? -1 : (c.throttleUp ? 1 : 0) - (c.throttleDown ? 1 : 0),
      brake: c.brake,
    };
    stepFlight(state, flightC, dt, groundHeightAt);
    if (engineOut(state)) state.throttle = 0;
    stepFuel(state, dt, state.ceilingFactor, getMission(missionState.id).fuelScale || 1);
    if (c.gearToggle) state.gearDown = !state.gearDown;
    if (!state.onGround && c.assist && c.pitch === 0 && c.roll === 0) {
      state.roll *= Math.max(0, 1 - 2 * dt);
      const lvl = 0.5 * dt;
      if (Math.abs(state.pitch) <= lvl) state.pitch = 0;
      else state.pitch -= Math.sign(state.pitch) * lvl;
    }
    const onRunway = RUNWAYS.some((r) => Math.abs(state.x - r.cx) <= r.halfW && Math.abs(state.z - r.cz) <= r.halfL);
    const surface = onRunway ? "runway" : (groundBefore <= 0.5 ? "water" : "grass");
    if (!prevOnGround && state.onGround) {
      landing = classifyLanding({ sink: sinkBefore, speed: state.speed, gearDown: state.gearDown, bank: state.roll, surface });
      landingText = landing.text;
      damageHull(state, landing.damage);
      hud.flash(landing.text);
      if (crashed(state)) setPhase("CRASH", { detail: landing.text });
    }
    prevOnGround = state.onGround;
    propAngle += (6 + state.throttle * 60) * dt;
    elapsed += dt;
  }

  const showHint = !isShotScene && (paused || hintForced || (!paused && performance.now() - startedAt < 10000));
  hintEl.classList.toggle("show", showHint);

  const agl = state.y - 1.6 - groundHeightAt(state.x, state.z);
  advanceMission(missionState, state, agl, landing !== null, landing);
  rings.setActive(missionState.phase === "RINGS" ? missionState.ringIndex : -1);
  hud.setObjective(objectiveText(missionState));
  if (missionState.lastEvent === "ring") hud.flash("RING " + missionState.ringIndex + "/5");
  if (missionState.lastEvent === "complete") {
    setPhase("RESULT", { detail: landingText + " | " + missionState.stars + " stars" });
    hud.flash("");
  }
  if (missionState.lastEvent === "failed") setPhase("CRASH", { detail: landingText || "Mission failed" });
  const ring = activeRing(missionState);
  if (ring) hud.setTarget(Math.hypot(ring.x - state.x, ring.z - state.z), Math.atan2(ring.x - state.x, ring.z - state.z) - state.heading);
  else hud.setTarget(null, 0);
  const air = world.aircraft;
  air.position.set(state.x, state.y - 0.5, state.z);
  air.rotation.order = "YXZ";
  air.rotation.y = state.heading;
  air.rotation.x = -state.pitch;
  air.rotation.z = state.roll;
  world.prop.rotation.z = propAngle;
  world.wheels.visible = state.gearDown;
  const cockpitMode = cameraMode === 1;
  const wantFov = cockpitMode ? 75 : 60;
  if (camera.fov !== wantFov) {
    camera.fov = wantFov;
    camera.updateProjectionMatrix();
  }
  air.visible = !cockpitMode;
  cockpit.group.visible = cockpitMode;
  if (window.__CW_HIDE_COCKPIT_PARTS__) cockpit.group.visible = false;
  document.body.classList.toggle("cockpit", cockpitMode);

  if (shotMode === "start") {
    camera.position.set(0, 120, -800);
    camera.lookAt(0, 25, -150);
  } else if (shotMode === "end") {
    camera.position.set(
      state.x - Math.sin(state.heading) * 72,
      state.y + 34,
      state.z - Math.cos(state.heading) * 72,
    );
    camera.lookAt(state.x, state.y + 2, state.z);
  } else if (cameraMode === 0) {
    const back = 16;
    const up = 6;
    const desired = new THREE.Vector3(
      state.x - Math.sin(state.heading) * Math.cos(state.pitch) * back,
      state.y + up - Math.sin(state.pitch) * back,
      state.z - Math.cos(state.heading) * Math.cos(state.pitch) * back,
    );
    camPos.lerp(desired, 1 - Math.pow(0.0015, dt));
    const floor = groundHeightAt(camPos.x, camPos.z) + 3;
    if (camPos.y < floor) camPos.y = floor;
    camera.position.copy(camPos);
    const look = new THREE.Vector3(state.x, state.y + 1, state.z);
    camLook.lerp(look, 1 - Math.pow(0.0002, dt));
    camera.lookAt(camLook);
  } else {
    air.updateMatrixWorld(true);
    camera.position.copy(EYE).applyMatrix4(air.matrixWorld);
    camera.quaternion.copy(air.quaternion).multiply(COCKPIT_YAW);
  }

  hud.update(state, agl);
  if (cockpitMode) {
    cockpit.update(propAngle);
    instruments.update(state, agl);
  }
  if (paused) hud.el.classList.add("paused"); else hud.el.classList.remove("paused");

  window.__DEBUG__ = { controls: c, state: state, cameraMode: cameraMode, cockpit: cockpitMode, exteriorVisible: air.visible, near: camera.near, fov: camera.fov, hintShown: showHint, cloud: world.sky.cloudMat.color.getHex(), cloudEmissive: world.sky.cloudMat.emissiveIntensity, hemiGround: world.sky.hemi.groundColor.getHex(), phase: phase, mission: { phase: missionState.phase, ringIndex: missionState.ringIndex, complete: missionState.complete, failed: missionState.failed, stars: missionState.stars }, landing: landingText, lampPosts: !!scene.getObjectByName("lamp-posts"), restarts: restarts, keys: Array.from(input.keys), agl: agl, calls: renderer.info.render.calls };

  renderer.render(scene, camera);
  frames += 1;
  if (frames === 10) window.__READY__ = true;
  requestAnimationFrame(tick);
}

tick();