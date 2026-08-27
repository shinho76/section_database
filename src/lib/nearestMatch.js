// Nearest-match lookup between an AISC type and its KS counterpart (KS D
// 3502 for H/L/T/C, KS D 3568 for KSB, KS D 3566 for KSP, KS D 3507 for
// KSPP — see KS_STANDARD in store.js), used to cross-reference W<->KSH,
// WT<->KST, HSS-BOX<->KSB, HSS-ROUND<->KSP, PIPE<->KSPP, L<->KSL, C<->KSC
// in the shape list. Distance is a weighted relative difference over
// depth/OD (highest priority), width, then thickness — matching the
// user's stated priority order.
//
// HSS is split into two sidebar entries (HSS-BOX / HSS-ROUND) since a
// single "HSS" list otherwise mixes rectangular/square tube (which should
// compare against KSB) with round tube (which should compare against
// KSP). AISC PIPE is matched against KSPP (KS D 3507, piping-use) rather
// than KSP (KS D 3566, structural-use) since both PIPE and KSPP share the
// same piping-derived material spec and intended use.

const PAIR = {
  W: 'KSH', KSH: 'W',
  WT: 'KST', KST: 'WT',
  L: 'KSL', KSL: 'L',
  C: 'KSC', KSC: 'C',
  'HSS-BOX': 'KSB', KSB: 'HSS-BOX',
  'HSS-ROUND': 'KSP', KSP: 'HSS-ROUND',
  PIPE: 'KSPP', KSPP: 'PIPE',
};

const SPEC = {
  W: [['d', 3], ['bf', 2], ['tf', 1]],
  KSH: [['d', 3], ['bf', 2], ['tf', 1]],
  WT: [['d', 3], ['bf', 2], ['tf', 1]],
  KST: [['d', 3], ['bf', 2], ['tf', 1]],
  L: [['d', 3], ['b', 2], ['t', 1]],
  KSL: [['d', 3], ['b', 2], ['t', 1]],
  C: [['d', 3], ['bf', 2], ['tf', 1]],
  KSC: [['d', 3], ['bf', 2], ['tf', 1]],
  'HSS-BOX': [['Ht', 3], ['B', 2], ['tdes', 1]],
  KSB: [['Ht', 3], ['B', 2], ['tdes', 1]],
  ROUND: [['OD', 3], ['tdes', 1]], // HSS-ROUND, PIPE, KSP, KSPP
};

export function hasMatchPair(type) {
  return type in PAIR;
}

export function matchTargetType(sourceType) {
  return PAIR[sourceType];
}

const ROUND_TYPES = new Set(['HSS-ROUND', 'PIPE', 'KSP', 'KSPP']);

function specFor(sourceType) {
  if (ROUND_TYPES.has(sourceType)) return SPEC.ROUND;
  return SPEC[sourceType];
}

/** Find the single nearest shape in `targetRows` for `shape`. Returns null
 * if no candidate shares any usable numeric field with `shape`. */
export function findNearestInRows(shape, sourceType, targetRows) {
  const spec = specFor(sourceType);
  let best = null, bestScore = Infinity;
  for (const cand of targetRows) {
    let score = 0, n = 0;
    for (const [f, w] of spec) {
      const a = parseFloat(shape.us[f]);
      const b = parseFloat(cand.us[f]);
      if (!Number.isFinite(a) || !Number.isFinite(b) || a === 0) continue;
      score += w * Math.abs(a - b) / a;
      n++;
    }
    if (!n) continue;
    if (score < bestScore) { bestScore = score; best = cand; }
  }
  return best;
}

/** Width/height-only fields for similarity display (drops the thickness
 * field that `SPEC` also weighs in for the match search itself). Round
 * tube/pipe only has one size field (OD), so it's compared alone. */
function widthHeightFields(sourceType) {
  return specFor(sourceType).filter(([f]) => f !== 'tf' && f !== 't' && f !== 'tdes');
}

/** Similarity between `shape` and `match`, 0-100%, based only on the
 * horizontal/vertical size dimensions (depth/OD and width/leg — no
 * thickness), equally weighted. */
export function widthHeightSimilarity(shape, sourceType, match) {
  const fields = widthHeightFields(sourceType);
  let sumRel = 0, n = 0;
  for (const [f] of fields) {
    const a = parseFloat(shape.us[f]);
    const b = parseFloat(match.us[f]);
    if (!Number.isFinite(a) || !Number.isFinite(b) || a === 0) continue;
    sumRel += Math.abs(a - b) / a;
    n++;
  }
  if (!n) return null;
  return Math.max(0, 100 * (1 - sumRel / n));
}
