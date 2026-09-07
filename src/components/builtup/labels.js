// KS-style and US-style dimensional designations for a custom H-shape,
// e.g. mm(400,200,8,12) -> KS "H-400X200X8X12", US "H15.75X7.87X0.315X0.472".
function fmtNum(x, decimals) {
  const r = Math.round(x * 10 ** decimals) / 10 ** decimals;
  if (Number.isInteger(r)) return String(r);
  return r.toFixed(decimals).replace(/0+$/, '').replace(/\.$/, '');
}

// tw/tf keep 1 decimal place instead of rounding to the nearest whole mm -
// a plate ordered at 7.9mm (5/16") is not the same as 8mm, and silently
// rounding the KS-style label made every non-integer thickness look like a
// clean standard size it isn't (see BH-1/2 non-standard-thickness warning).
export function ksLabel({ d, bf, tw, tf }) {
  return `H-${fmtNum(d, 0)}X${fmtNum(bf, 0)}X${fmtNum(tw, 1)}X${fmtNum(tf, 1)}`;
}

export function usLabel({ d, bf, tw, tf }) {
  return `H${fmtNum(d, 2)}X${fmtNum(bf, 2)}X${fmtNum(tw, 3)}X${fmtNum(tf, 3)}`;
}
