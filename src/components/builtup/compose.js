// Parallel-axis composite section properties for the BH (Built-up) builder.
// All calculations are in US units (in, in^2, in^4, lb/ft); mm/kg-m are derived by conversion.

export const STEEL_DENSITY_LB_FT3 = 490; // A36/A992 steel, ~7850 kg/m3

// AISC F2-7 / F2-8: rts = sqrt( sqrt(Iy*Cw) / Sx ), the effective radius of
// gyration used for the plateau/inelastic LTB length limits (Lp/Lr).
function rtsFrom(Iy, Cw, Sx) {
  if (!(Iy > 0) || !(Cw > 0) || !(Sx > 0)) return null;
  return Math.sqrt(Math.sqrt(Iy * Cw) / Sx);
}

/** General plastic section modulus about a horizontal (x-x) axis for any
 * stack of rectangular plates: finds the equal-area axis (splitting any
 * plate straddling it), then sums Ai*|distance from that axis to plate i's
 * own centroid| over every (sub-)plate. `rects`: [{ yBot, yTop, width }],
 * absolute y, yTop > yBot. Works regardless of how many plates or how the
 * PNA falls relative to their boundaries - this is what makes it reusable
 * for both a plain built-up H and an H with T-bars welded on top/bottom. */
export function plasticModulusX(rects) {
  const totalArea = rects.reduce((s, r) => s + r.width * (r.yTop - r.yBot), 0);
  if (!(totalArea > 0)) return null;
  const halfArea = totalArea / 2;
  const sorted = [...rects].sort((a, b) => a.yBot - b.yBot);

  let areaBelow = 0;
  let pna = sorted[sorted.length - 1].yTop;
  for (const r of sorted) {
    const rArea = r.width * (r.yTop - r.yBot);
    if (areaBelow + rArea >= halfArea) {
      pna = r.yBot + (halfArea - areaBelow) / r.width;
      break;
    }
    areaBelow += rArea;
  }

  let Zx = 0;
  for (const r of sorted) {
    const pieces = (r.yTop <= pna || r.yBot >= pna)
      ? [r]
      : [{ yBot: r.yBot, yTop: pna, width: r.width }, { yBot: pna, yTop: r.yTop, width: r.width }];
    for (const p of pieces) {
      const A = p.width * (p.yTop - p.yBot);
      const yc = (p.yTop + p.yBot) / 2;
      Zx += A * Math.abs(yc - pna);
    }
  }
  return { Zx, pna };
}

/** Rectangular-plate breakdown of a symmetric H (2 equal flanges + web),
 * relative to the shape's own centroid (y=0 at mid-depth) - used both for
 * this shape's own Zx and, via composeSection, as part of a taller stack's
 * Zx (each layer's plates get shifted by its yOffset and merged). */
export function hPlates({ d, bf, tw, tf }) {
  return [
    { yBot: -d / 2, yTop: -d / 2 + tf, width: bf },
    { yBot: -d / 2 + tf, yTop: d / 2 - tf, width: tw },
    { yBot: d / 2 - tf, yTop: d / 2, width: bf },
  ];
}

/** Same, for a T-bar (one flange + stem), relative to the shape's own
 * centroid. Works for any T-shaped props object - manually computed or
 * pulled from the AISC/KS catalog - as long as it carries d/bf/tw/tf and
 * yTopExtent/yBotExtent (every T-bar prop object in this file does). */
export function tPlates({ bf, tw, tf, yTopExtent, yBotExtent }) {
  return [
    { yBot: yTopExtent - tf, yTop: yTopExtent, width: bf },
    { yBot: -yBotExtent, yTop: yTopExtent - tf, width: tw },
  ];
}

/** Flips a plate list upside-down about its own centroid (y -> -y) - for a
 * bottom T-bar, whose natural orientation (flange up, stem down) has to be
 * turned over so the flange sits at the bottom, stem facing up into the H
 * above it. Must be applied together with swapping yTopExtent/yBotExtent
 * (composite construction in HPlusTPanel.jsx already does that part). */
export function mirrorPlates(plates) {
  return plates.map((p) => ({ yBot: -p.yTop, yTop: -p.yBot, width: p.width }));
}

export function manualHProps({ d, bf, tw, tf }) {
  const A = 2 * bf * tf + (d - 2 * tf) * tw;
  const Ix = (bf * d ** 3) / 12 - ((bf - tw) * (d - 2 * tf) ** 3) / 12;
  const Iy = (2 * tf * bf ** 3) / 12 + ((d - 2 * tf) * tw ** 3) / 12;
  const W = A * (STEEL_DENSITY_LB_FT3 / 144); // lb/ft

  // Plastic section modulus (doubly symmetric: PNA = centroid).
  const Zx = bf * tf * (d - tf) + (tw * (d - 2 * tf) ** 2) / 4;
  const Zy = (bf ** 2 * tf) / 2 + (tw ** 2 * (d - 2 * tf)) / 4;
  // Open-section (no-fillet) torsional constant - appropriate for a welded
  // built-up shape, which has square flange-web corners unlike a hot-rolled
  // W-shape's filleted root (that fillet's small contribution is why AISC's
  // tabulated J for rolled shapes runs a bit higher than this formula).
  const J = (2 * bf * tf ** 3 + (d - 2 * tf) * tw ** 3) / 3;
  const ho = d - tf;
  const Cw = (Iy * ho ** 2) / 4; // doubly symmetric I: Cw = Iy*ho^2/4
  const Sx = Ix / (d / 2);
  const rts = rtsFrom(Iy, Cw, Sx);

  return { A, Ix, Iy, W, d, bf, tw, tf, Zx, Zy, J, Cw, ho, rts, Sx, plates: hPlates({ d, bf, tw, tf }) };
}

/** H-section with independently-sized top/bottom flanges (built-up, welded).
 * d = overall depth, tw = web thickness (constant), bfTop/tfTop = top flange,
 * bfBot/tfBot = bottom flange. Centroid is not at mid-depth in general, so
 * yTopExtent/yBotExtent are reported for use by composeSection/SVG layout. */
export function manualHUnequalProps({ d, tw, bfTop, tfTop, bfBot, tfBot }) {
  const hWeb = d - tfTop - tfBot;
  const Atop = bfTop * tfTop;
  const Abot = bfBot * tfBot;
  const Aweb = hWeb * tw;
  const A = Atop + Abot + Aweb;

  // y measured from the bottom face upward
  const yTop = d - tfTop / 2;
  const yBot = tfBot / 2;
  const yWeb = tfBot + hWeb / 2;
  const ybar = (Atop * yTop + Abot * yBot + Aweb * yWeb) / A;

  const ITop = (bfTop * tfTop ** 3) / 12 + Atop * (yTop - ybar) ** 2;
  const IBot = (bfBot * tfBot ** 3) / 12 + Abot * (yBot - ybar) ** 2;
  const IWeb = (tw * hWeb ** 3) / 12 + Aweb * (yWeb - ybar) ** 2;
  const Ix = ITop + IBot + IWeb;
  const Iy = (tfTop * bfTop ** 3) / 12 + (tfBot * bfBot ** 3) / 12 + (hWeb * tw ** 3) / 12;

  const W = A * (STEEL_DENSITY_LB_FT3 / 144);
  const yTopExtent = d - ybar;
  const yBotExtent = ybar;

  const { Zx } = plasticModulusX([
    { yBot: 0, yTop: tfBot, width: bfBot },
    { yBot: tfBot, yTop: tfBot + hWeb, width: tw },
    { yBot: tfBot + hWeb, yTop: d, width: bfTop },
  ]);
  // Weak-axis PNA is x=0 by symmetry (every plate here is centered on the
  // same vertical axis), so Zy reduces to a plain sum - no search needed.
  const Zy = (bfTop ** 2 * tfTop) / 4 + (bfBot ** 2 * tfBot) / 4 + (tw ** 2 * hWeb) / 4;
  const J = (bfTop * tfTop ** 3 + bfBot * tfBot ** 3 + hWeb * tw ** 3) / 3;

  // Singly-symmetric I warping constant (Salmon & Johnson / AISC DG25):
  // Cw = Iyc*Iyt/(Iyc+Iyt) * ho^2, where Iyc/Iyt are each flange's OWN Iy
  // (web's Iy contribution is neglected, same simplification the doubly-
  // symmetric Cw=Iy*ho^2/4 formula makes). Reduces to that formula when the
  // two flanges match.
  const IyTop = (tfTop * bfTop ** 3) / 12;
  const IyBot = (tfBot * bfBot ** 3) / 12;
  const ho = d - tfTop / 2 - tfBot / 2;
  const Cw = (IyTop + IyBot) > 0 ? (IyTop * IyBot) / (IyTop + IyBot) * ho ** 2 : null;
  const SxTop = yTopExtent > 0 ? Ix / yTopExtent : null;
  const SxBot = yBotExtent > 0 ? Ix / yBotExtent : null;
  // Conservative: rts uses the smaller Sx (the more critical flange).
  const Sx = SxTop != null && SxBot != null ? Math.min(SxTop, SxBot) : (SxTop ?? SxBot);
  const rts = Cw != null ? rtsFrom(Iy, Cw, Sx) : null;

  const plates = [
    { yBot: -ybar, yTop: tfBot - ybar, width: bfBot },
    { yBot: tfBot - ybar, yTop: tfBot + hWeb - ybar, width: tw },
    { yBot: tfBot + hWeb - ybar, yTop: d - ybar, width: bfTop },
  ];

  return {
    A, Ix, Iy, W, d, tw, bfTop, tfTop, bfBot, tfBot,
    bf: Math.max(bfTop, bfBot), tf: (tfTop + tfBot) / 2,
    yTopExtent, yBotExtent, ybar,
    Zx, Zy, J, Cw, ho, rts, SxTop, SxBot, plates,
  };
}

/** T-bar (flange bf×tf on top, stem tw hanging down by d-tf), own centroid. */
export function manualTProps({ d, bf, tw, tf }) {
  const A1 = bf * tf;
  const A2 = tw * (d - tf);
  const A = A1 + A2;
  const y1 = tf / 2;
  const y2 = tf + (d - tf) / 2;
  const yTop = (A1 * y1 + A2 * y2) / A; // centroid distance from top of flange
  const yBot = d - yTop;                // centroid distance from stem tip
  const I1 = (bf * tf ** 3) / 12 + A1 * (yTop - y1) ** 2;
  const I2 = (tw * (d - tf) ** 3) / 12 + A2 * (y2 - yTop) ** 2;
  const Ix = I1 + I2;
  const Iy = (tf * bf ** 3) / 12 + ((d - tf) * tw ** 3) / 12;
  const W = A * (STEEL_DENSITY_LB_FT3 / 144);

  const { Zx } = plasticModulusX([
    { yBot: -yBot, yTop: yTop - tf, width: tw },
    { yBot: yTop - tf, yTop, width: bf },
  ]);
  const Zy = (bf ** 2 * tf) / 4 + (tw ** 2 * (d - tf)) / 4; // one flange only, unlike the H's two
  const J = (bf * tf ** 3 + (d - tf) * tw ** 3) / 3;

  return {
    A, Ix, Iy, W, d, bf, tw, tf, yTopExtent: yTop, yBotExtent: yBot, Zx, Zy, J,
    plates: tPlates({ bf, tw, tf, yTopExtent: yTop, yBotExtent: yBot }),
  };
}

/** layer: { id, kind:'db'|'manual', props:{A,Ix,Iy,W,d,bf,tw,tf,yTopExtent?,yBotExtent?}, yOffset, label } */
export function composeSection(layers) {
  const valid = layers.filter((l) => l.props && l.props.A > 0);
  if (!valid.length) return null;

  const Atot = valid.reduce((sum, l) => sum + l.props.A, 0);
  const ybar = valid.reduce((sum, l) => sum + l.props.A * l.yOffset, 0) / Atot;

  const Ix = valid.reduce((sum, l) => {
    const dy = l.yOffset - ybar;
    return sum + l.props.Ix + l.props.A * dy * dy;
  }, 0);
  const Iy = valid.reduce((sum, l) => sum + l.props.Iy, 0);

  const yTop = Math.max(...valid.map((l) => l.yOffset + (l.props.yTopExtent ?? l.props.d / 2))) - ybar;
  const yBot = ybar - Math.min(...valid.map((l) => l.yOffset - (l.props.yBotExtent ?? l.props.d / 2)));

  const Sx_top = yTop > 0 ? Ix / yTop : null;
  const Sx_bot = yBot > 0 ? Ix / yBot : null;
  const rx = Math.sqrt(Ix / Atot);
  const ry = Math.sqrt(Iy / Atot);
  const W = valid.reduce((sum, l) => sum + l.props.W, 0);

  // Zx: merge every layer's own plate breakdown (shifted to absolute y by
  // that layer's yOffset) and re-run the equal-area-axis search across the
  // whole stack - this is what makes it work for an H alone, an H+one
  // T-bar, or an H with T-bars both sides without special-casing any of
  // them. Falls back to null if a layer predates the `plates` field.
  const allPlates = valid.every((l) => l.props.plates)
    ? valid.flatMap((l) => l.props.plates.map((p) => ({ yBot: p.yBot + l.yOffset, yTop: p.yTop + l.yOffset, width: p.width })))
    : null;
  const Zx = allPlates ? plasticModulusX(allPlates)?.Zx ?? null : null;
  // Zy/J are simple sums - position along the member's depth doesn't affect
  // either (weak-axis PNA is x=0 for every layer here by symmetry, and J is
  // additive over any collection of thin rectangular plates regardless of
  // where they sit).
  const Zy = valid.every((l) => l.props.Zy != null) ? valid.reduce((sum, l) => sum + l.props.Zy, 0) : null;
  const J = valid.every((l) => l.props.J != null) ? valid.reduce((sum, l) => sum + l.props.J, 0) : null;

  return { A: Atot, Ix, Iy, ybar, Sx_top, Sx_bot, rx, ry, W, yTop, yBot, Zx, Zy, J };
}

export const IN_TO_MM = 25.4;
export const IN2_TO_MM2 = 645.16;
export const IN3_TO_MM3 = 25.4 ** 3;
export const IN4_TO_MM4 = 416231.4256;
export const IN6_TO_MM6 = 25.4 ** 6;
export const LBFT_TO_KGM = 1.48816;
