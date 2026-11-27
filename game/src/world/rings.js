// Ring/beacon beacons for all missions. Only the selected mission's group is
// shown: active = warm pulsing 6 m tube, next = thin teal, passed = 1 s fade.

import { MISSIONS } from "../missions.js";

const ACTIVE_TUBE = 6;
const THIN_TUBE = 2.5;

export function buildRings(THREE, mat) {
  const group = new THREE.Group();
  group.name = "mission-rings";
  const records = new Map();
  const fallback = (c, o) => new THREE.MeshStandardMaterial({ color: c, ...o });
  const makeMat = mat || fallback;

  for (const mission of MISSIONS) {
    const targets = mission.rings.length ? mission.rings : (mission.drop ? [mission.drop] : mission.beacons);
    const sub = new THREE.Group();
    sub.name = "rings-" + mission.id;
    sub.visible = false;
    group.add(sub);
    const entries = [];
    const passAt = targets.map(() => null);
    const stateInfo = targets.map(() => ({ visible: false, opacity: 0, tube: ACTIVE_TUBE, color: 0x000000 }));
    const info = [];
    let prev = { x: 0, z: 0 };
    for (const target of targets) {
      const thickMat = makeMat(0xfff6d2, { emissive: 0xffd45a, emissiveIntensity: 1.4, transparent: true, opacity: 1 });
      const thinMat = makeMat(0x66d7d0, { emissive: 0x1f8f8a, emissiveIntensity: 0.55, transparent: true, opacity: 0.7 });
      const rotation = Math.atan2(target.x - prev.x, target.z - prev.z);
      const thick = new THREE.Mesh(new THREE.TorusGeometry(target.r, ACTIVE_TUBE, 10, 32), thickMat);
      thick.position.set(target.x, target.y, target.z);
      thick.rotation.y = rotation;
      const thin = new THREE.Mesh(new THREE.TorusGeometry(target.r, THIN_TUBE, 8, 32), thinMat);
      thin.position.copy(thick.position);
      thin.rotation.copy(thick.rotation);
      sub.add(thick);
      sub.add(thin);
      entries.push({ thick, thin });
      info.push({
        radius: target.r, tube: ACTIVE_TUBE, thinTube: THIN_TUBE,
        gap: Math.hypot(target.x - prev.x, target.z - prev.z),
      });
      prev = target;
    }
    records.set(mission.id, { sub, entries, passAt, stateInfo, info });
  }

  let current = records.get(MISSIONS[0].id);

  return {
    group,
    setMission(id) {
      for (const [key, rec] of records) rec.sub.visible = key === id;
      current = records.get(id) || records.get(MISSIONS[0].id);
    },
    info() { return current.info; },
    get stateInfo() { return current.stateInfo; },
    reset() { current.passAt.fill(null); },
    update(index, time, hideNext) {
      current.stateInfo.forEach((s) => { s.visible = false; });
      for (let i = 0; i < current.entries.length; i += 1) {
        const e = current.entries[i];
        const passed = index === -1 || i < index;
        if (passed) {
          if (current.passAt[i] === null) current.passAt[i] = time;
          const alpha = 1 - (time - current.passAt[i]);
          e.thick.visible = alpha > 0;
          e.thin.visible = false;
          e.thick.material.opacity = Math.max(0, alpha);
          current.stateInfo[i] = { visible: e.thick.visible, opacity: e.thick.material.opacity, tube: ACTIVE_TUBE, color: e.thick.material.color.getHex() };
        } else if (i === index) {
          e.thick.visible = true;
          e.thin.visible = false;
          e.thick.material.opacity = 1;
          e.thick.material.emissiveIntensity = 1.35 + 0.45 * Math.sin(time * 4);
          current.stateInfo[i] = { visible: true, opacity: 1, tube: ACTIVE_TUBE, color: e.thick.material.color.getHex() };
        } else {
          e.thick.visible = false;
          e.thin.visible = i !== index + 1 || !hideNext;
          e.thin.material.opacity = i === index + 1 ? 0.75 : 0.45;
          current.stateInfo[i] = { visible: e.thin.visible, opacity: e.thin.material.opacity, tube: THIN_TUBE, color: e.thin.material.color.getHex() };
        }
      }
    },
  };
}
