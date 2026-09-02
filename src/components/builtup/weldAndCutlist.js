// Weld-metal weight and plate cut-list helpers for the Built-up (BH) panels.
// Everything here works in mm/kg (not the in/lb-ft the rest of compose.js
// uses) since that's what a fab shop actually orders and welds in.

const STEEL_DENSITY_KG_M3 = 7850;

/** AISC Table J2.4 minimum fillet weld size, keyed off the thinner of the
 * two parts being joined (mm) - a starting suggestion, not a substitute for
 * an actual connection design (throat/strength is not checked here). */
export function minFilletWeldMm(thinnerPartMm) {
  if (!(thinnerPartMm > 0)) return 3;
  if (thinnerPartMm <= 6) return 3;
  if (thinnerPartMm <= 13) return 5;
  if (thinnerPartMm <= 19) return 6;
  return 8;
}

/** Weight per meter of one continuous equal-leg fillet weld of leg size
 * `sMm`, assuming a plain right-triangle profile (no reinforcement/convexity
 * - real deposited weight typically runs 10-20% over this). */
export function filletWeldKgPerM(sMm) {
  if (!(sMm > 0)) return 0;
  const areaMm2 = 0.5 * sMm * sMm;
  return (areaMm2 * 1000 * STEEL_DENSITY_KG_M3) / 1e9; // mm^3/m -> kg/m
}

/** Total weld metal per meter of member length for a list of
 * { sizeMm, lines } weld groups (`lines` = number of parallel continuous
 * weld lines of that size running the full member length, e.g. a flange
 * welded to a web from both sides = 2 lines). */
export function totalWeldKgPerM(welds) {
  return welds.reduce((sum, w) => sum + (w.lines || 0) * filletWeldKgPerM(w.sizeMm), 0);
}

/** One cut-list row's unit weight (kg per meter of plate length), from its
 * cross-section - the standard "7.85 kg per m^2 per mm thickness" rule
 * (e.g. a 1m-wide, 10mm-thick plate: 1000 x 10 x 7850 / 1e6 = 78.5 kg/m). */
export function plateKgPerM(widthMm, thicknessMm) {
  return (widthMm * thicknessMm * STEEL_DENSITY_KG_M3) / 1e6;
}
