// HUD built from DOM nodes. One job: show flight instruments at screen size.
// Digits are kept large (>= 28 px) so they read well shrunk to 400 px wide.
// All text is English per the language policy.

import { FLIGHT, FUEL, DAMAGE } from "../config.js";

export function createHud(doc) {
  const el = doc.createElement("div");
  el.id = "hud";

  const t = (id, label, unit) => {
    const row = doc.createElement("div");
    row.className = "hud-cell";
    const lab = doc.createElement("span");
    lab.className = "hud-label";
    lab.textContent = label;
    const val = doc.createElement("span");
    val.id = id;
    val.className = "hud-value";
    val.textContent = "0";
    const uni = doc.createElement("span");
    uni.className = "hud-unit";
    uni.textContent = unit;
    row.appendChild(lab);
    row.appendChild(val);
    row.appendChild(uni);
    el.appendChild(row);
    return val;
  };

  t("hud-speed", "SPD", "km/h");
  t("hud-alt", "ALT", "m");
  t("hud-heading", "HDG", "\u00b0");
  t("hud-vsi", "V/S", "m/s");
  t("hud-throttle", "THR", "%");
  const fuel = t("hud-fuel", "FUEL", "%");
  const hull = t("hud-hull", "HULL", "%");
  const gear = t("hud-gear", "GEAR", "");
  const warning = doc.createElement("div");
  warning.id = "hud-warning";
  warning.className = "hud-warning";
  warning.textContent = "";
  el.appendChild(warning);
  const objective = doc.createElement("div");
  objective.id = "hud-objective";
  objective.className = "hud-objective";
  objective.textContent = "Take off, then land on the runway";
  el.appendChild(objective);

  const compass = doc.createElement("div");
  compass.id = "hud-compass";
  compass.className = "hud-compass";
  el.appendChild(compass);

  doc.body.appendChild(el);
  fuel.parentNode; // mark used
  hull.parentNode;
  return {
    el,
    update(state, agl) {
      const deg = state.heading * 180 / Math.PI;
      const hdg = ((Math.round(deg) % 360) + 360) % 360;
      const alt = Math.max(0, Math.round(agl !== undefined ? agl : state.y));
      document.getElementById("hud-speed").textContent = Math.round(state.speed * 3.6).toString();
      document.getElementById("hud-alt").textContent = alt.toString();
      document.getElementById("hud-heading").textContent = hdg;
      document.getElementById("hud-vsi").textContent = state.onGround ? "0" : state.verticalSpeed.toFixed(0);
      document.getElementById("hud-throttle").textContent = Math.round(state.throttle * 100).toString();
      document.getElementById("hud-fuel").textContent = Math.round(state.fuel).toString();
      document.getElementById("hud-hull").textContent = Math.round(state.hull).toString();
      document.getElementById("hud-gear").textContent = state.gearDown ? "DN" : "UP";
      const warnings = [];
      if (state.y >= FLIGHT.ceilingStart) warnings.push("CEILING");
      if (state.fuel < FUEL.warningLevel) warnings.push("LOW FUEL");
      if (state.hull < DAMAGE.warningLevel) warnings.push("DAMAGE");
      if (!state.onGround && state.speed < FLIGHT.stallSpeed) warnings.push("STALL");
      warning.textContent = warnings.join("  ");
      this.renderCompass(hdg);
    },
    renderCompass(hdg) {
      const el2 = document.getElementById("hud-compass");
      if (!el2) return;
      const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
      const idx = Math.round(hdg / 45) % 8;
      el2.textContent = dirs[idx] + "  " + hdg + "\u00b0";
    },
  };
}