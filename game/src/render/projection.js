// Project ring/beacon centres into screen space for overlap checks and HUD.

export function projectTargets(THREE, camera, targets, width, height) {
  const focal = height / (2 * Math.tan(camera.fov * Math.PI / 360));
  return targets.map((t) => {
    const world = new THREE.Vector3(t.x, t.y, t.z);
    const v = world.clone().project(camera);
    return {
      x: (v.x * 0.5 + 0.5) * width,
      y: (0.5 - v.y * 0.5) * height,
      z: v.z,
      radius: t.r / Math.max(1, camera.position.distanceTo(world)) * focal,
    };
  });
}
