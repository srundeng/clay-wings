// Ring beacons with three visual states: active (bright pulsing, 6 m tube),
// upcoming (thin teal) and passed (fades out and hides within one second).

import { getMission } from "../missions.js";

const ACTIVE_TUBE = 6;
const THIN_TUBE = 2.5;

export function buildRings(THREE, missionId, mat) {
  const group = new THREE.Group();
  group.name = "mission-rings";
  const rings = getMission(missionId).rings;
  const entries = [];
  const passAt = rings.map(() => null);
  const stateInfo = rings.map(() => ({ visible: false, opacity: 0, tube: ACTIVE_TUBE, color: 0x000000 }));
  let prev = { x: 0, z: 0 };

  for (const ring of rings) {
    const thickMat = (mat || ((c, o) => new THREE.MeshStandardMaterial({ color: c, ...o })))(
      0xfff6d2, { emissive: 0xffd45a, emissiveIntensity: 1.4, transparent: true, opacity: 1 },
    );
    const thinMat = (mat || ((c, o) => new THREE.MeshStandardMaterial({ color: c, ...o })))(
      0x66d7d0, { emissive: 0x1f8f8a, emissiveIntensity: 0.55, transparent: true, opacity: 0.7 },
    );
    const rotation = Math.atan2(ring.x - prev.x, ring.z - prev.z);
    const thick = new THREE.Mesh(new THREE.TorusGeometry(ring.r, ACTIVE_TUBE, 10, 32), thickMat);
    thick.position.set(ring.x, ring.y, ring.z);
    thick.rotation.y = rotation;
    const thin = new THREE.Mesh(new THREE.TorusGeometry(ring.r, THIN_TUBE, 8, 32), thinMat);
    thin.position.copy(thick.position);
    thin.rotation.copy(thick.rotation);
    group.add(thick);
    group.add(thin);
    entries.push({ thick, thin });
    prev = ring;
  }

  return {
    group,
    stateInfo,
    info: rings.map((r, i) => ({
      radius: r.r,
      tube: ACTIVE_TUBE,
      thinTube: THIN_TUBE,
      gap: Math.hypot(r.x - (i ? rings[i - 1].x : 0), r.z - (i ? rings[i - 1].z : 0)),
    })),
    reset() {
      for (let i = 0; i < passAt.length; i += 1) passAt[i] = null;
    },
    update(index, time, hideNext) {
      for (let i = 0; i < entries.length; i += 1) {
        const e = entries[i];
        const passed = index === -1 || i < index;
        if (passed) {
          if (passAt[i] === null) passAt[i] = time;
          const alpha = 1 - (time - passAt[i]);
          e.thick.visible = alpha > 0;
          e.thin.visible = false;
          e.thick.material.opacity = Math.max(0, alpha);
          stateInfo[i].visible = e.thick.visible;
          stateInfo[i].opacity = e.thick.material.opacity;
          stateInfo[i].tube = ACTIVE_TUBE;
          stateInfo[i].color = e.thick.material.color.getHex();
        } else if (i === index) {
          e.thick.visible = true;
          e.thin.visible = false;
          e.thick.material.opacity = 1;
          e.thick.material.emissiveIntensity = 1.35 + 0.45 * Math.sin(time * 4);
          stateInfo[i].visible = true;
          stateInfo[i].opacity = 1;
          stateInfo[i].tube = ACTIVE_TUBE;
          stateInfo[i].color = e.thick.material.color.getHex();
        } else {
          e.thick.visible = false;
          e.thin.visible = i !== index + 1 || !hideNext;
          e.thin.material.opacity = i === index + 1 ? 0.75 : 0.45;
          if (!e.thin.visible) {
            stateInfo[i].visible = false;
            continue;
          }
          stateInfo[i].visible = true;
          stateInfo[i].opacity = e.thin.material.opacity;
          stateInfo[i].tube = THIN_TUBE;
          stateInfo[i].color = e.thin.material.color.getHex();
        }
      }
    },
  };
}
