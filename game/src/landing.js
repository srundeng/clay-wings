// Pure touchdown judging. Angles in radians, speeds in m/s, sink in m/s.

export function classifyLanding({ sink, speed, gearDown, bank, surface }) {
  const bankDeg = Math.abs(bank) * 180 / Math.PI;
  const rate = Math.max(0, sink);
  const crash = (reason) => ({
    rating: "CRASH",
    damage: 100,
    text: "TOUCHDOWN: CRASH " + rate.toFixed(1) + " m/s (" + reason + ")",
  });
  if (surface === "water") return crash("water");
  if (!gearDown && speed > 40) return crash("gear up");
  if (bankDeg > 25) return crash("bank");
  if (rate >= 6) return crash("sink");

  if (surface === "runway") {
    if (rate < 2 && gearDown && bankDeg < 8 && speed < 55) {
      return { rating: "SMOOTH", damage: 0, text: "TOUCHDOWN: SMOOTH " + rate.toFixed(1) + " m/s" };
    }
    if (rate < 4) return { rating: "FIRM", damage: 3, text: "TOUCHDOWN: FIRM " + rate.toFixed(1) + " m/s" };
    return { rating: "HARD", damage: 14, text: "TOUCHDOWN: HARD " + rate.toFixed(1) + " m/s" };
  }
  if (rate < 2) return { rating: "FIRM", damage: 5, text: "TOUCHDOWN: FIRM " + rate.toFixed(1) + " m/s" };
  return { rating: "HARD", damage: 18, text: "TOUCHDOWN: HARD " + rate.toFixed(1) + " m/s" };
}
