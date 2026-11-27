import * as THREE from "three";
import { createFlightState, stepFlight } from "./flight-model.js";
import { STOP_MOTION } from "./config.js";
import { createInput } from "./input.js";
import { createHud } from "./hud/hud.js";
import { assembleScene } from "./render/scene.js";
import { buildCockpit } from "./render/cockpit.js";
import { createInstruments } from "./hud/instruments.js";
import { stepFuel, damageHull, engineOut, crashed } from "./fuel-and-damage.js";
import { classifyLanding } from "./landing.js";
import { createMissionState, advanceMission, objectiveText, activeRing, activeIndex, dropParcel, getMission, missionTargets, ringCountText, MISSIONS } from "./missions.js";
import { buildRings } from "./world/rings.js";
import { createScreens } from "./hud/screens.js";
import { RUNWAYS } from "./world/terrain.js";
import { applyShotScene, seedChaseCamera } from "./shots.js";
import { projectTargets } from "./render/projection.js";
import { updateCameras } from "./render/cameras.js";

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
const rings = buildRings(THREE, world.mat);
rings.setMission("first-flight");
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
let quantizedTime = 0;
let qSteps = 0;
let hideNextRing = false;
let paused = false;
let cameraMode = 0;
if (isShotScene) {
  setPhase("FLYING");
  const shot = applyShotScene(shotMode, state, missionState);
  cameraMode = shot.cameraMode;
  if (shot.assistOff) input.controls.assist = false;
  if (shot.airborneStart) prevOnGround = false;
} else setPhase("TITLE", { name: "First Flight", objective: objectiveText(missionState) });
let restarts = 0;
let hintForced = false;
const camPos = new THREE.Vector3(state.x, state.y + 8, state.z - 16);
const camLook = new THREE.Vector3(state.x, state.y, state.z);
const EYE = new THREE.Vector3(0, 0.55, 0.3);
const COCKPIT_YAW = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
seedChaseCamera(shotMode, camPos, camLook, state);

function chooseMission(id) {
  missionState = createMissionState(id);
  rings.setMission(id);
  rings.reset();
  Object.assign(state, createFlightState({ x: 0, y: groundHeightAt(0, 0) + 1.6, z: 0, heading: 0 }));
  prevOnGround = true;
  landingText = "";
  hud.flash("");
  hud.setObjective(objectiveText(missionState));
  setPhase("BRIEFING", { name: getMission(id).name, objective: objectiveText(missionState) });
}

function resetMission() {
  Object.assign(state, createFlightState({ x: 0, y: groundHeightAt(0, 0) + 1.6, z: 0, heading: 0 }));
  missionState = createMissionState(missionState.id);
  rings.setMission(missionState.id);
  rings.reset();
  prevOnGround = true;
  landingText = "";
  hud.flash("");
  setPhase("FLYING");
  rings.reset();
  restarts += 1;
}

function tick() {
  const dt = Math.min(clock.getDelta(), 0.05);
  const c = input.sample();

  if (c.selectMission > 0 && phase !== "FLYING") {
    const picked = MISSIONS[c.selectMission - 1];
    if (picked) chooseMission(picked.id);
  }
  if (c.start && (phase === "TITLE" || phase === "BRIEFING")) setPhase("FLYING");
  if (c.drop && phase === "FLYING") {
    const result = dropParcel(missionState, state);
    hud.flash(result.text);
    if (result.ok) hud.setObjective(objectiveText(missionState));
  }
  if (c.pauseToggle) paused = !paused;
  if (c.cameraToggle) cameraMode = 1 - cameraMode;
  if (c.restart) resetMission();
  if (c.hintToggle) hintForced = true;

  let landing = null;
  let prevPos = null;
  let landedAt = null;
  if (!paused && phase === "FLYING") {
    const sinkBefore = -state.verticalSpeed;
    const groundBefore = groundHeightAt(state.x, state.z);
    prevPos = { x: state.x, y: state.y, z: state.z };
    const flightC = {
      pitch: c.pitch,
      roll: c.roll,
      yaw: c.yaw,
      throttleDelta: engineOut(state) ? -1 : (c.throttleUp ? 1 : 0) - (c.throttleDown ? 1 : 0),
      brake: c.brake,
      assist: c.assist,
    };
    stepFlight(state, flightC, dt, groundHeightAt);
    if (engineOut(state)) state.throttle = 0;
    stepFuel(state, dt, state.ceilingFactor, getMission(missionState.id).fuelScale || 1);
    if (c.gearToggle) state.gearDown = !state.gearDown;
    if (!state.onGround && shotMode !== "landing") state.roll *= Math.max(0, 1 - 2 * dt);
    const runway = RUNWAYS.find((r) => Math.abs(state.x - r.cx) <= r.halfW && Math.abs(state.z - r.cz) <= r.halfL);
    const surface = runway ? "runway" : (groundBefore <= 0.5 ? "water" : "grass");
    landedAt = runway ? (RUNWAYS.indexOf(runway) === 1 ? "harbour" : "home") : surface;
    if (!prevOnGround && state.onGround) {
      landing = classifyLanding({ sink: sinkBefore, speed: state.speed, gearDown: state.gearDown, bank: state.roll, surface });
      landingText = landing.text;
      damageHull(state, landing.damage);
      hud.flash(landing.text);
      if (crashed(state)) setPhase("CRASH", { detail: landing.text });
    }
    prevOnGround = state.onGround;
    elapsed += dt;
    const q = Math.floor(elapsed * STOP_MOTION.fps) / STOP_MOTION.fps;
    if (q !== quantizedTime) {
      quantizedTime = q;
      qSteps += 1;
      propAngle = q * (6 + state.throttle * 60);
      world.sky.updateClouds(q);
      world.water.userData.updateWaves(q);
      world.props.userData.update(q);
    }
  }

  const showHint = !isShotScene && (paused || hintForced || (!paused && performance.now() - startedAt < 10000));
  hintEl.classList.toggle("show", showHint);

  const agl = state.y - 1.6 - groundHeightAt(state.x, state.z);
  world.sky.updateSun(state.x, state.y, state.z);
  const ringScreen = projectTargets(THREE, camera, missionTargets(missionState.id), window.innerWidth, window.innerHeight);
  advanceMission(missionState, state, agl, landing !== null, landing, prevPos, landedAt);
  hud.setRingCount(ringCountText(missionState));
  const activeRingIndex = activeIndex(missionState);
  if (activeRingIndex >= 0 && activeRingIndex + 1 < ringScreen.length) {
    const a = ringScreen[activeRingIndex];
    const b = ringScreen[activeRingIndex + 1];
    hideNextRing = Math.hypot(a.x - b.x, a.y - b.y) < (a.radius + b.radius) * 0.95;
  } else hideNextRing = false;
  rings.update(activeRingIndex, elapsed, hideNextRing);
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

  updateCameras(THREE, camera, cameraMode, state, camPos, camLook, EYE, COCKPIT_YAW, air, dt, groundHeightAt, shotMode);

  hud.update(state, agl);
  hud.setSwitches(c);
  hud.setMouseMarker(c.mouseSteer && input.mouse.enabled, input.mouse.x, input.mouse.y);
  if (cockpitMode) {
    cockpit.update(propAngle);
    instruments.update(state, agl);
  }
  if (paused) hud.el.classList.add("paused"); else hud.el.classList.remove("paused");

  window.__DEBUG__ = { controls: c, state: state, cameraMode: cameraMode, cockpit: cockpitMode, exteriorVisible: air.visible, near: camera.near, fov: camera.fov, hintShown: showHint, cloud: world.sky.cloudMat.color.getHex(), cloudEmissive: world.sky.cloudMat.emissiveIntensity, cloudInfo: world.sky.cloudInfo, hemiGround: world.sky.hemi.groundColor.getHex(), phase: phase, mission: { id: missionState.id, dropped: missionState.dropped, visited: missionState.visited.length, phase: missionState.phase, ringIndex: missionState.ringIndex, complete: missionState.complete, failed: missionState.failed, stars: missionState.stars }, landing: landingText, clayInfo: world.clayInfo, skyInfo: world.skyInfo, stopMotion: { fps: STOP_MOTION.fps, steps: qSteps, time: quantizedTime, propAngle: propAngle }, runwayInfo: world.runwayInfo, ringStates: rings.stateInfo, ringInfo: rings.info(), ringScreen: ringScreen, lampPosts: !!scene.getObjectByName("lamp-posts"), restarts: restarts, keys: Array.from(input.keys), agl: agl, calls: renderer.info.render.calls };

  renderer.render(scene, camera);
  frames += 1;
  if (frames === 10) window.__READY__ = true;
  requestAnimationFrame(tick);
}

tick();