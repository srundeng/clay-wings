// Full-screen HTML overlays for title, briefing, result and crash states.

export function createScreens(doc) {
  const el = doc.createElement("div");
  el.id = "screens";
  el.className = "hidden";
  el.innerHTML =
    '<div id="screen-title" class="screen-card"><h1>CLAY WINGS</h1><p>Fly a plasticine plane over a sunset archipelago.</p><p class="screen-key">Press Enter to begin</p></div>' +
    '<div id="screen-brief" class="screen-card"><h2 id="brief-name">First Flight</h2><p id="brief-objective">Take off from Home Runway</p><p class="screen-key">Enter to fly &middot; W/S pitch &middot; A/D roll &middot; Z/X throttle</p></div>' +
    '<div id="screen-result" class="screen-card"><h2>MISSION COMPLETE</h2><p id="result-detail"></p><p class="screen-key">R to fly again</p></div>' +
    '<div id="screen-crash" class="screen-card"><h2>CRASHED</h2><p id="crash-detail"></p><p class="screen-key">R to retry</p></div>';
  doc.body.appendChild(el);
  const cards = ["screen-title", "screen-brief", "screen-result", "screen-crash"];
  for (const id of cards) el.querySelector("#" + id).style.display = "none";

  return {
    el,
    show(kind, data) {
      el.className = "";
      for (const id of cards) el.querySelector("#" + id).style.display = "none";
      if (kind === "TITLE") el.querySelector("#screen-title").style.display = "block";
      else if (kind === "BRIEFING") {
        el.querySelector("#screen-brief").style.display = "block";
        el.querySelector("#brief-name").textContent = (data && data.name) || "First Flight";
        el.querySelector("#brief-objective").textContent = (data && data.objective) || "";
      } else if (kind === "RESULT") {
        el.querySelector("#screen-result").style.display = "block";
        el.querySelector("#result-detail").textContent = (data && data.detail) || "";
      } else if (kind === "CRASH") {
        el.querySelector("#screen-crash").style.display = "block";
        el.querySelector("#crash-detail").textContent = (data && data.detail) || "";
      }
    },
    hide() {
      el.className = "hidden";
    },
  };
}
