// Assemble the whole world: sky, terrain, sea, runways, props and aircraft.
// Returns handles the main loop needs, including the shared groundHeightAt.

import { buildTerrainMesh, groundHeightAt } from "../world/terrain.js";
import { buildRunways } from "../world/runway.js";
import { buildWater } from "../world/water.js";
import { buildSky } from "../world/sky.js";
import { buildProps } from "../world/props.js";
import { buildAircraft } from "./aircraft-model.js";
import { makeRandom } from "../random.js";

function clayBump(THREE, doc, size) {
  const c = doc.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgb(140,140,140)";
  ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 5) {
    for (let x = 0; x < size; x += 5) {
      const s = 110 + Math.floor(Math.random() * 60);
      ctx.fillStyle = "rgb(" + s + "," + s + "," + s + ")";
      ctx.beginPath();
      ctx.arc(x + 2, y + 2, 1.5 + Math.random() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 6);
  return tex;
}

export function assembleScene(THREE, scene, doc, seed) {
  const bump = clayBump(THREE, doc, 128);
  const matFactory = (color) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.86, metalness: 0.02, bumpMap: bump, bumpScale: 0.02 });

  buildSky(THREE, scene, doc);
  const terrain = buildTerrainMesh(THREE);
  scene.add(terrain);
  scene.add(buildWater(THREE, matFactory));
  scene.add(buildRunways(THREE, matFactory));
  scene.add(buildProps(THREE, matFactory, makeRandom(seed || 7)));

  const aircraft = buildAircraft(THREE, matFactory);
  scene.add(aircraft.group);

  return {
    terrain,
    aircraft: aircraft.group,
    prop: aircraft.prop,
    wheels: aircraft.wheels,
    groundHeightAt,
  };
}