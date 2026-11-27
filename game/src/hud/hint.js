// Controls hint panel: top-right, hidden in screenshot scenes.

const TEXT =
  "Z/Shift throttle up &middot; X/Ctrl down &middot; W/S pitch &middot; A/D roll &middot; Q/E rudder &middot; B brake &middot; G gear &middot; C camera &middot; P pause &middot; R restart &middot; M mouse &middot; I invert &middot; T assist &middot; H hint &middot; Space drop &middot; 1/2/3 mission";

export function createHint(doc, isShotScene) {
  const el = doc.createElement("div");
  el.id = "controls-hint";
  el.innerHTML = TEXT;
  if (!isShotScene) doc.body.appendChild(el);
  return el;
}
