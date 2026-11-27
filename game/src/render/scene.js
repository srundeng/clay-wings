// Assemble the whole world: sky, terrain, sea, runways, props and aircraft.
// Returns handles the main loop needs, including the shared groundHeightAt.

import { buildTerrainMesh, groundHeightAt } from "../world/terrain.js";
import { buildRunways } from "../world/runway.js";
import { buildWater } from "../world/water.js";
import { buildSky } from "../world/sky.js";
import { buildProps } from "../world/props.js";
import { buildAircraft } from "./aircraft-model.js";
import { makeRandom } from "../random.js";
import { createClayMaterials } from "./clay-materials.js";

export function assembleScene(THREE, scene, doc, seed) {
  const clay = createClayMaterials(THREE, doc, seed);
  const matFactory = clay.mat;

  const sky = buildSky(THREE, scene, doc);
  const terrain = buildTerrainMesh(THREE, matFactory);
  scene.add(terrain);
  scene.add(buildWater(THREE, matFactory));
  const runways = buildRunways(THREE, matFactory);
  scene.add(runways);
  scene.add(buildProps(THREE, matFactory, makeRandom(seed || 7)));

  const aircraft = buildAircraft(THREE, matFactory);
  scene.add(aircraft.group);

  return {
    terrain,
    sky,
    runwayInfo: runways.userData.runwayInfo,
    mat: matFactory,
    clayInfo: clay.info,
    aircraft: aircraft.group,
    prop: aircraft.prop,
    wheels: aircraft.wheels,
    groundHeightAt,
  };
}