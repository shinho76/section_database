// Parallel-axis composite section properties for the BH (Built-up) builder.
// All calculations are in US units (in, in^2, in^4, lb/ft); mm/kg-m are derived by conversion.

const STEEL_DENSITY_LB_FT3 = 490; // A36/A992 steel, ~7850 kg/m3

export function manualHProps({ d, bf, tw, tf }) {
  const A = 2 * bf * tf + (d - 2 * tf) * tw;
  const Ix = (bf * d ** 3) / 12 - ((bf - tw) * (d - 2 * tf) ** 3) / 12;
  const Iy = (2 * tf * bf ** 3) / 12 + ((d - 2 * tf) * tw ** 3) / 12;
  const W = A * (STEEL_DENSITY_LB_FT3 / 144); // lb/ft
  return { A, Ix, Iy, W, d, bf, tw, tf };
}

/** layer: { id, kind:'db'|'manual', props:{A,Ix,Iy,W,d,bf,tw,tf}, yOffset, label } */
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

  const yTop = Math.max(...valid.map((l) => l.yOffset + l.props.d / 2)) - ybar;
  const yBot = ybar - Math.min(...valid.map((l) => l.yOffset - l.props.d / 2));

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
