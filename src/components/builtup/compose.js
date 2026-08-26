// Parallel-axis composite section properties for the BH (Built-up) builder.
// All calculations are in US units (in, in^2, in^4, lb/ft); mm/kg-m are derived by conversion.

export const STEEL_DENSITY_LB_FT3 = 490; // A36/A992 steel, ~7850 kg/m3

export function manualHProps({ d, bf, tw, tf }) {
  const A = 2 * bf * tf + (d - 2 * tf) * tw;
  const Ix = (bf * d ** 3) / 12 - ((bf - tw) * (d - 2 * tf) ** 3) / 12;
  const Iy = (2 * tf * bf ** 3) / 12 + ((d - 2 * tf) * tw ** 3) / 12;
  const W = A * (STEEL_DENSITY_LB_FT3 / 144); // lb/ft
  return { A, Ix, Iy, W, d, bf, tw, tf };
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
  return {
    A, Ix, Iy, W, d, tw, bfTop, tfTop, bfBot, tfBot,
    bf: Math.max(bfTop, bfBot), tf: (tfTop + tfBot) / 2,
    yTopExtent, yBotExtent, ybar,
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
  return { A, Ix, Iy, W, d, bf, tw, tf, yTopExtent: yTop, yBotExtent: yBot };
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

  return { A: Atot, Ix, Iy, ybar, Sx_top, Sx_bot, rx, ry, W, yTop, yBot };
}

export const IN_TO_MM = 25.4;
export const IN2_TO_MM2 = 645.16;
export const IN4_TO_MM4 = 416231.4256;
export const LBFT_TO_KGM = 1.48816;
