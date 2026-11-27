// HTML/CSS instrument cluster shown only in cockpit mode. Four live clay dials:
// airspeed, artificial horizon, altimeter and compass. Pure canvas drawing.

export function createInstruments(doc) {
  const bar = doc.createElement("div");
  bar.id = "instruments";

  const ids = ["inst-airspeed", "inst-horizon", "inst-altimeter", "inst-compass"];
  const canvases = {};
  for (const id of ids) {
    const wrap = doc.createElement("div");
    wrap.className = "inst";
    const c = doc.createElement("canvas");
    c.id = id;
    c.width = 160;
    c.height = 160;
    wrap.appendChild(c);
    bar.appendChild(wrap);
    canvases[id] = c;
  }
  doc.body.appendChild(bar);

  function face(ctx, rim) {
    ctx.clearRect(0, 0, 160, 160);
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.arc(80, 80, 79, 0, Math.PI * 2);
    ctx.fill();
    const g = ctx.createRadialGradient(62, 52, 8, 80, 80, 74);
    g.addColorStop(0, "#f6e9cf");
    g.addColorStop(1, "#c4a77f");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(80, 80, 70, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  function text(ctx, value, label) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#59402e";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText(label, 80, 40);
    ctx.fillStyle = "#33251b";
    ctx.font = "bold 38px sans-serif";
    ctx.fillText(String(value), 80, 94);
  }

  return {
    el: bar,
    update(state, agl) {
      const air = canvases["inst-airspeed"].getContext("2d");
      face(air, "#8a5a3c");
      text(air, Math.round(state.speed * 3.6), "SPD");
      air.fillStyle = "#7a5a40";
      air.font = "bold 14px sans-serif";
      air.fillText("km/h", 80, 120);

      const hz = canvases["inst-horizon"].getContext("2d");
      hz.clearRect(0, 0, 160, 160);
      hz.save();
      hz.beginPath();
      hz.arc(80, 80, 70, 0, Math.PI * 2);
      hz.clip();
      hz.translate(80, 80);
      hz.rotate(-state.roll);
      const off = Math.max(-55, Math.min(55, state.pitch * 92));
      hz.translate(0, off);
      hz.fillStyle = "#6aa7cf";
      hz.fillRect(-90, -90, 180, 90);
      hz.fillStyle = "#a87544";
      hz.fillRect(-90, 0, 180, 90);
      hz.strokeStyle = "#fff4d6";
      hz.lineWidth = 3;
      hz.beginPath();
      hz.moveTo(-90, 0);
      hz.lineTo(90, 0);
      hz.stroke();
      hz.restore();
      hz.strokeStyle = "#8a5a3c";
      hz.lineWidth = 9;
      hz.beginPath();
      hz.arc(80, 80, 74, 0, Math.PI * 2);
      hz.stroke();
      hz.strokeStyle = "#ffd23f";
      hz.lineWidth = 4;
      hz.beginPath();
      hz.moveTo(43, 80);
      hz.lineTo(62, 80);
      hz.moveTo(98, 80);
      hz.lineTo(117, 80);
      hz.stroke();

      const alt = canvases["inst-altimeter"].getContext("2d");
      face(alt, "#8a5a3c");
      text(alt, Math.max(0, Math.round(agl)), "ALT");
      alt.fillStyle = "#7a5a40";
      alt.font = "bold 14px sans-serif";
      alt.fillText("m AGL", 80, 120);

      const cmp = canvases["inst-compass"].getContext("2d");
      face(cmp, "#8a5a3c");
      cmp.save();
      cmp.beginPath();
      cmp.arc(80, 80, 66, 0, Math.PI * 2);
      cmp.clip();
      cmp.translate(80, 80);
      cmp.rotate(-state.heading);
      cmp.textAlign = "center";
      cmp.font = "bold 18px sans-serif";
      cmp.fillStyle = "#59402e";
      for (const [label, angle] of [["N", 0], ["E", Math.PI / 2], ["S", Math.PI], ["W", Math.PI * 1.5]]) {
        cmp.fillText(label, Math.sin(angle) * 42, -Math.cos(angle) * 42 + 6);
      }
      cmp.restore();
      cmp.fillStyle = "#d9745a";
      cmp.beginPath();
      cmp.arc(80, 80, 9, 0, Math.PI * 2);
      cmp.fill();
      cmp.fillStyle = "rgba(28,20,14,0.88)";
      cmp.beginPath();
      cmp.rect(50, 124, 60, 26);
      cmp.fill();
      cmp.fillStyle = "#fff1d2";
      cmp.font = "bold 16px sans-serif";
      cmp.textAlign = "center";
      cmp.fillText(String(((Math.round(state.heading * 180 / Math.PI) % 360) + 360) % 360) + "\u00b0", 80, 143);
    },
  };
}
