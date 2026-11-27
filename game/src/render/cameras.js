// Chase and cockpit camera placement. Chase never clips under terrain and
// always tilts slightly downward; cockpit rides the aircraft orientation.

export function updateCameras(THREE, camera, mode, state, camPos, camLook, eye, yaw180, air, dt, groundHeightAt, shotMode) {
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
  } else if (mode === 0) {
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
    const lookY = shotMode === "chase-ring" ? state.y + 4 : state.y + 1;
    const look = new THREE.Vector3(state.x, Math.min(lookY, camera.position.y - 2), state.z);
    camLook.lerp(look, 1 - Math.pow(0.0002, dt));
    camera.lookAt(camLook);
  } else {
    air.updateMatrixWorld(true);
    camera.position.copy(eye).applyMatrix4(air.matrixWorld);
    camera.quaternion.copy(air.quaternion).multiply(yaw180);
  }
}
