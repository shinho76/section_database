import { describe, it, expect } from 'vitest';
import {
  minFilletWeldMm, filletWeldKgPerM, totalWeldKgPerM, plateKgPerM,
} from './weldAndCutlist.js';

describe('minFilletWeldMm (AISC Table J2.4 minimum fillet size)', () => {
  it('steps at the documented thickness breakpoints (6/13/19mm)', () => {
    expect(minFilletWeldMm(6)).toBe(3);
    expect(minFilletWeldMm(6.1)).toBe(5);
    expect(minFilletWeldMm(13)).toBe(5);
    expect(minFilletWeldMm(13.1)).toBe(6);
    expect(minFilletWeldMm(19)).toBe(6);
    expect(minFilletWeldMm(19.1)).toBe(8);
  });

  it('falls back to the minimum (3mm) for invalid/non-positive input', () => {
    expect(minFilletWeldMm(0)).toBe(3);
    expect(minFilletWeldMm(-5)).toBe(3);
    expect(minFilletWeldMm(NaN)).toBe(3);
  });
});

describe('filletWeldKgPerM (right-triangle fillet weld weight)', () => {
  it('matches the hand-computed value for a 5mm fillet at 7850 kg/m³', () => {
    // area = 0.5*5*5 = 12.5mm²; kg/m = 12.5mm² * 1000mm/m * 7850kg/m³ / 1e9 = 0.098125
    expect(filletWeldKgPerM(5)).toBeCloseTo(0.098125, 6);
  });

  it('is zero for non-positive size (no weld)', () => {
    expect(filletWeldKgPerM(0)).toBe(0);
    expect(filletWeldKgPerM(-1)).toBe(0);
  });

  it('scales with the square of the leg size', () => {
    expect(filletWeldKgPerM(10)).toBeCloseTo(4 * filletWeldKgPerM(5), 6);
  });
});

describe('totalWeldKgPerM (sum of parallel weld lines)', () => {
  it('sums lines * per-line weight across weld groups', () => {
    const total = totalWeldKgPerM([{ sizeMm: 5, lines: 4 }]);
    expect(total).toBeCloseTo(4 * filletWeldKgPerM(5), 6);
  });

  it('handles multiple weld-size groups and an empty list', () => {
    expect(totalWeldKgPerM([{ sizeMm: 5, lines: 2 }, { sizeMm: 8, lines: 2 }]))
      .toBeCloseTo(2 * filletWeldKgPerM(5) + 2 * filletWeldKgPerM(8), 6);
    expect(totalWeldKgPerM([])).toBe(0);
  });
});

describe('plateKgPerM (7.85 kg/m² per mm thickness rule)', () => {
  it('matches the standard rule for a 1m-wide, 10mm plate (78.5 kg/m)', () => {
    expect(plateKgPerM(1000, 10)).toBeCloseTo(78.5, 6);
  });

  it('scales linearly with both width and thickness', () => {
    expect(plateKgPerM(2000, 10)).toBeCloseTo(2 * plateKgPerM(1000, 10), 6);
    expect(plateKgPerM(1000, 20)).toBeCloseTo(2 * plateKgPerM(1000, 10), 6);
  });
});
