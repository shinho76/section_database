import { describe, it, expect } from 'vitest';
import {
  manualHProps, manualHUnequalProps, manualTProps, plasticModulusX, composeSection,
} from './compose.js';

// Catalog reference: AISC v16.0 W18X50 (d=18, bf=7.5, tw=0.355, tf=0.57 in).
// manualHProps ignores the rolled fillet, so its output should sit a little
// BELOW the catalog value (less material than the real filleted section) -
// not equal to it. These bounds catch both a broken formula (way off) and
// an accidentally-inverted one (came out above the catalog value).
describe('manualHProps (built-up H, no fillet)', () => {
  const p = manualHProps({ d: 18, bf: 7.5, tw: 0.355, tf: 0.57 });

  it('area is close to but below the filleted catalog value (14.7 in²)', () => {
    expect(p.A).toBeCloseTo(14.5353, 3);
    expect(p.A).toBeLessThan(14.7);
    expect(p.A).toBeGreaterThan(14.4);
  });

  it('Ix is close to but below the catalog value (800 in⁴)', () => {
    expect(p.Ix).toBeCloseTo(791.396, 2);
    expect(p.Ix).toBeLessThan(800);
  });

  it('Iy barely differs from the catalog value (fillet mostly affects Ix, not Iy)', () => {
    expect(p.Iy).toBeCloseTo(40.1, 1);
  });

  it('Zx is close to but below the catalog value (101 in³)', () => {
    expect(p.Zx).toBeCloseTo(99.741, 2);
    expect(p.Zx).toBeLessThan(101);
  });

  it('W (unit weight) is close to the catalog value (50 lb/ft)', () => {
    expect(p.W).toBeCloseTo(49.46, 1);
  });

  it('doubly-symmetric Cw/rts formulas produce finite, positive values', () => {
    expect(p.Cw).toBeGreaterThan(0);
    expect(p.rts).toBeGreaterThan(0);
  });
});

describe('manualHUnequalProps (unequal-flange built-up H)', () => {
  it('reduces to manualHProps exactly when both flanges match', () => {
    const sym = manualHUnequalProps({ d: 18, tw: 0.355, bfTop: 7.5, tfTop: 0.57, bfBot: 7.5, tfBot: 0.57 });
    const h = manualHProps({ d: 18, bf: 7.5, tw: 0.355, tf: 0.57 });
    expect(sym.A).toBeCloseTo(h.A, 6);
    expect(sym.Ix).toBeCloseTo(h.Ix, 6);
    expect(sym.Iy).toBeCloseTo(h.Iy, 6);
    expect(sym.Zx).toBeCloseTo(h.Zx, 6);
    // Symmetric case: centroid sits at mid-depth.
    expect(sym.ybar).toBeCloseTo(9, 6);
  });

  it('shifts the centroid toward the larger flange when flanges differ', () => {
    const asym = manualHUnequalProps({ d: 18, tw: 0.355, bfTop: 10, tfTop: 0.75, bfBot: 7.5, tfBot: 0.57 });
    // Bigger/heavier flange is on top, so the centroid should sit above mid-depth (9in).
    expect(asym.ybar).toBeGreaterThan(9);
  });
});

describe('manualTProps (T-bar)', () => {
  it('matches a hand-computed tee (bf=7.5, tf=0.4, d=9, tw=0.25)', () => {
    const t = manualTProps({ d: 9, bf: 7.5, tw: 0.25, tf: 0.4 });
    expect(t.A).toBeCloseTo(5.15, 6); // 7.5*0.4 + 0.25*8.6
    expect(t.yTopExtent + t.yBotExtent).toBeCloseTo(9, 6); // centroid splits the full depth
    expect(t.Ix).toBeGreaterThan(0);
  });
});

describe('plasticModulusX (equal-area-axis plastic modulus)', () => {
  it('matches the textbook formula b*h²/4 for a single rectangle', () => {
    // 4 wide x 4 tall rectangle centered at y=0: Zx = b*h^2/4 = 4*16/4 = 16.
    const { Zx, pna } = plasticModulusX([{ yBot: -2, yTop: 2, width: 4 }]);
    expect(Zx).toBeCloseTo(16, 6);
    expect(pna).toBeCloseTo(0, 6);
  });

  it('finds the plastic neutral axis inside a plate that straddles it (unequal split)', () => {
    // A single 10-tall, 1-wide plate from y=0 to y=10: half-area axis is at y=5.
    const { pna } = plasticModulusX([{ yBot: 0, yTop: 10, width: 1 }]);
    expect(pna).toBeCloseTo(5, 6);
  });
});

describe('composeSection (parallel-axis stacking)', () => {
  it('doubles A/W and applies the parallel-axis theorem for two identical stacked H layers', () => {
    const h = manualHProps({ d: 18, bf: 7.5, tw: 0.355, tf: 0.57 });
    const comp = composeSection([
      { yOffset: 9, props: h },
      { yOffset: -9, props: h },
    ]);
    expect(comp.A).toBeCloseTo(2 * h.A, 6);
    expect(comp.W).toBeCloseTo(2 * h.W, 6);
    // Parallel-axis: Ix = 2 * (h.Ix + h.A * 9^2)
    expect(comp.Ix).toBeCloseTo(2 * (h.Ix + h.A * 81), 4);
    expect(comp.rx).toBeCloseTo(Math.sqrt(comp.Ix / comp.A), 6);
  });

  it('returns null when given no valid layers', () => {
    expect(composeSection([])).toBeNull();
    expect(composeSection([{ yOffset: 0, props: null }])).toBeNull();
  });
});
