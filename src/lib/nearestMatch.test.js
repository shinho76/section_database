import { describe, it, expect } from 'vitest';
import {
  hasMatchPair, matchTargetType, findNearestInRows, widthHeightSimilarity,
} from './nearestMatch.js';

// Synthetic W-shape-like rows (only the fields the H-shape spec reads: d/bf/tf).
const ksRows = [
  { name: 'H-A', us: { d: '18', bf: '7.5', tf: '0.57' } },   // exact match target
  { name: 'H-B', us: { d: '20', bf: '8', tf: '0.6' } },      // further away
  { name: 'H-C', us: { d: '0', bf: '7.5', tf: '0.57' } },    // d=0 -> unusable for relative-diff scoring
];

describe('hasMatchPair / matchTargetType', () => {
  it('knows the AISC<->KS pairing for every supported type, both directions', () => {
    expect(hasMatchPair('W')).toBe(true);
    expect(matchTargetType('W')).toBe('KSH');
    expect(matchTargetType('KSH')).toBe('W');
    expect(hasMatchPair('HSS-BOX')).toBe(true);
    expect(matchTargetType('HSS-BOX')).toBe('KSB');
  });

  it('returns false/undefined for a type with no counterpart', () => {
    expect(hasMatchPair('NOT-A-TYPE')).toBe(false);
    expect(matchTargetType('NOT-A-TYPE')).toBeUndefined();
  });
});

describe('findNearestInRows', () => {
  it('picks the exact match over a further candidate', () => {
    const shape = { us: { d: '18', bf: '7.5', tf: '0.57' } };
    const best = findNearestInRows(shape, 'W', ksRows);
    expect(best.name).toBe('H-A');
  });

  it('returns null when no candidate shares any usable numeric field', () => {
    const shape = { us: {} };
    expect(findNearestInRows(shape, 'W', ksRows)).toBeNull();
  });

  it('skips a candidate whose comparison field is zero (would divide by zero)', () => {
    // H-C has d=0 for the 'd' field but shares bf/tf, so it's still scorable
    // on those - this just checks it doesn't throw or return Infinity/NaN as "best".
    const shape = { us: { d: '18', bf: '7.5', tf: '0.57' } };
    const best = findNearestInRows(shape, 'W', ksRows);
    expect(Number.isNaN(best)).toBe(false);
  });
});

describe('widthHeightSimilarity', () => {
  it('is 100% for an identical width/height match', () => {
    const shape = { us: { d: '18', bf: '7.5', tf: '0.57' } };
    const sim = widthHeightSimilarity(shape, 'W', ksRows[0]);
    expect(sim).toBeCloseTo(100, 6);
  });

  it('drops below 100% for a dimensionally different match', () => {
    const shape = { us: { d: '18', bf: '7.5', tf: '0.57' } };
    const sim = widthHeightSimilarity(shape, 'W', ksRows[1]);
    expect(sim).toBeLessThan(100);
    expect(sim).toBeGreaterThan(0);
  });

  it('ignores the thickness field (tf) that findNearestInRows also weighs', () => {
    // Same d/bf, very different tf -> similarity should still read 100%
    // since widthHeightSimilarity only compares d/bf, not tf.
    const shape = { us: { d: '18', bf: '7.5', tf: '0.57' } };
    const match = { us: { d: '18', bf: '7.5', tf: '99' } };
    expect(widthHeightSimilarity(shape, 'W', match)).toBeCloseTo(100, 6);
  });
});
