// Cross-section SVG renderer — engineering-drawing style (hatch fill, arrowed
// dimension lines with extension lines, halo text) inspired by
// https://calcs.app/steel/section-properties
const num = (v) => (v === undefined || v === '' || v === null ? null : parseFloat(v));

const W = 460, H = 320;
let uid = 0;
export const CANVAS_W = W;
export const CANVAS_H = H;
export const nextId = (prefix) => `${prefix}${uid++}`;

export function defsBlock(id) {
  return `<defs>
    <marker id="ar-${id}" markerWidth="9" markerHeight="9" refX="7.5" refY="4" orient="auto" markerUnits="strokeWidth">
      <path d="M1,1 L8,4 L1,7" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"/>
    </marker>
    <marker id="arr-${id}" markerWidth="9" markerHeight="9" refX="0.5" refY="4" orient="auto" markerUnits="strokeWidth">
      <path d="M8,1 L1,4 L8,7" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"/>
    </marker>
    <marker id="ars-${id}" markerWidth="6" markerHeight="6" refX="5" refY="2.7" orient="auto" markerUnits="strokeWidth">
      <path d="M0.7,0.7 L5.3,2.7 L0.7,4.7" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"/>
    </marker>
    <marker id="arrs-${id}" markerWidth="6" markerHeight="6" refX="0.3" refY="2.7" orient="auto" markerUnits="strokeWidth">
      <path d="M5.3,0.7 L0.7,2.7 L5.3,4.7" fill="none" stroke="currentColor" stroke-width="1" stroke-linejoin="round" stroke-linecap="round"/>
    </marker>
    <pattern id="hatch-${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="6" height="6" fill="var(--steel-fill)"/>
      <line x1="0" y1="0" x2="0" y2="6" stroke="var(--steel-line)" stroke-opacity=".5" stroke-width="1.2"/>
    </pattern>
  </defs>`;
}

/** Dimension-line label rounding for the BH builder: inch to 1 decimal,
 * mm to the nearest whole number. */
export function fmtDim(v, unit) {
  return unit === '"' ? v.toFixed(1) : String(Math.round(v));
}

export function text(x, y, label, anchor = 'middle') {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle"
    font-size="11.5" font-family="ui-monospace,monospace" stroke="var(--bg-card)" stroke-width="3.2"
    paint-order="stroke" fill="currentColor">${label}</text>`;
}

/** Full-span dimension: extension lines from the two feature points out to the
 * dimension line, then a double-arrow line between them with a centered label. */
export function hDim(dim, id, x1, x2, y, extFromY, label) {
  dim.push(`<line x1="${x1}" y1="${extFromY}" x2="${x1}" y2="${y}" stroke="currentColor" stroke-width=".7" opacity=".55"/>`);
  dim.push(`<line x1="${x2}" y1="${extFromY}" x2="${x2}" y2="${y}" stroke="currentColor" stroke-width=".7" opacity=".55"/>`);
  dim.push(`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="currentColor" stroke-width="1.2"
    marker-start="url(#arr-${id})" marker-end="url(#ar-${id})"/>`);
  dim.push(text((x1 + x2) / 2, y - 9, label));
}

export function vDim(dim, id, y1, y2, x, extFromX, label) {
  dim.push(`<line x1="${extFromX}" y1="${y1}" x2="${x}" y2="${y1}" stroke="currentColor" stroke-width=".7" opacity=".55"/>`);
  dim.push(`<line x1="${extFromX}" y1="${y2}" x2="${x}" y2="${y2}" stroke="currentColor" stroke-width=".7" opacity=".55"/>`);
  dim.push(`<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="currentColor" stroke-width="1.2"
    marker-start="url(#arr-${id})" marker-end="url(#ar-${id})"/>`);
  dim.push(text(x, (y1 + y2) / 2, label));
}

/** Short thickness callout: a tight double-arrow span across the feature, with
 * the label offset to the side (there isn't room to center it on the line). */
export function microV(dim, id, y1, y2, x, label, side = 1) {
  const mid = (y1 + y2) / 2;
  const lx = x + side * 20;
  // halo behind the arrow line so it stays legible over the hatch fill
  dim.push(`<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="var(--bg-card)" stroke-width="4" opacity=".85"/>`);
  dim.push(`<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="currentColor" stroke-width="1.4"
    marker-start="url(#arrs-${id})" marker-end="url(#ars-${id})"/>`);
  dim.push(`<line x1="${x}" y1="${mid}" x2="${lx - side * 4}" y2="${mid}" stroke="currentColor" stroke-width=".8" opacity=".8"/>`);
  dim.push(text(lx, mid, label, side > 0 ? 'start' : 'end'));
}

export function microH(dim, id, x1, x2, y, label, side = 1) {
  const mid = (x1 + x2) / 2;
  const ly = y + side * 17;
  dim.push(`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="var(--bg-card)" stroke-width="4" opacity=".85"/>`);
  dim.push(`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="currentColor" stroke-width="1.4"
    marker-start="url(#arrs-${id})" marker-end="url(#ars-${id})"/>`);
  dim.push(`<line x1="${mid}" y1="${y}" x2="${mid}" y2="${ly - side * 4}" stroke="currentColor" stroke-width=".8" opacity=".8"/>`);
  dim.push(text(mid, ly, label));
}

/** Engineering-drawing centerline: a dash-dot cross through (cx,cy), extending
 * slightly past the shape's half-extents on each axis (standard centerline
 * overrun convention). Sample use: the I-shape branch of drawShapeSVG. */
function centerlines(dim, cx, cy, halfW, halfH) {
  const over = 10;
  dim.push(`<line x1="${cx - halfW - over}" y1="${cy}" x2="${cx + halfW + over}" y2="${cy}" class="cl"/>`);
  dim.push(`<line x1="${cx}" y1="${cy - halfH - over}" x2="${cx}" y2="${cy + halfH + over}" class="cl"/>`);
}

/** Leader from a point on the shape to an offset label (used for round/OD walls). */
function leader(dim, id, x, y, tx, ty, label, anchor = 'start') {
  dim.push(`<line x1="${x}" y1="${y}" x2="${tx}" y2="${ty}" stroke="currentColor" stroke-width="1" marker-start="url(#arrs-${id})"/>`);
  dim.push(text(tx + (anchor === 'end' ? -5 : 5), ty, label, anchor));
}

export function drawShapeSVG(s, u) {
  const p = s[u];
  const g = (k) => num(p[k]);
  const t = s.type;
  const id = `dw${uid++}`;
  const unit = u === 'us' ? '"' : 'mm';

  const isRound = t === 'PIPE' || t === 'KSP' || (t === 'HSS' && p.OD);
  const isBox = t === 'KSB' || (t === 'HSS' && !p.OD);
  const isAng = t === 'L' || t === '2L' || t === 'KSL';
  const isTee = t === 'WT' || t === 'MT' || t === 'ST' || t === 'KST';
  const isChan = t === 'C' || t === 'MC' || t === 'KSC';

  let ow, oh;
  if (isRound) { ow = oh = g('OD'); }
  else if (isBox) { ow = g('B'); oh = g('Ht'); }
  else if (isAng) { ow = g('b') * (t === '2L' ? 2 : 1); oh = g('d'); }
  else { ow = g('bf'); oh = g('d'); }

  // drawing gutters reserved for dimension lines/labels around the shape bbox
  const gutter = { l: 56, t: 42, r: 150, b: 62 };
  const bboxW = W - gutter.l - gutter.r;
  const bboxH = H - gutter.t - gutter.b;
  const k = Math.min(bboxW / ow, bboxH / oh);
  const sx = (v) => v * k;
  const cx = gutter.l + bboxW / 2;
  const cy = gutter.t + bboxH / 2;

  const fill = `url(#hatch-${id})`, stroke = 'var(--steel-line)';
  let body = '';
  const dim = [];

  if (isRound) {
    const R = sx(g('OD')) / 2, tk = g('tdes') || g('tnom');
    const r = sx(g('OD') - 2 * tk) / 2;
    body = `<path d="M${cx - R},${cy} a${R},${R} 0 1,0 ${2 * R},0 a${R},${R} 0 1,0 ${-2 * R},0
              M${cx - r},${cy} a${r},${r} 0 1,1 ${2 * r},0 a${r},${r} 0 1,1 ${-2 * r},0"
              fill="${fill}" fill-rule="evenodd" stroke="${stroke}" stroke-width="1.5"/>`;
    hDim(dim, id, cx - R, cx + R, cy - R - 22, cy - R, `OD=${p.OD}${unit}`);
    leader(dim, id, cx + R * 0.72, cy - R * 0.72, cx + R + 34, cy - R - 4, `t=${p.tdes || p.tnom}${unit}`);
    centerlines(dim, cx, cy, R, R);
  } else if (isBox) {
    const bw = sx(g('B')), bh = sx(g('Ht')), th = sx(g('tdes') || g('tnom'));
    const x0 = cx - bw / 2, y0 = cy - bh / 2;
    body = `<path d="M${x0},${y0} h${bw} v${bh} h${-bw} Z
              M${x0 + th},${y0 + th} v${bh - 2 * th} h${bw - 2 * th} v${-(bh - 2 * th)} Z"
              fill="${fill}" fill-rule="evenodd" stroke="${stroke}" stroke-width="1.5" rx="${th * 1.4}"/>`;
    hDim(dim, id, x0, x0 + bw, y0 - 22, y0, `B=${p.B}${unit}`);
    vDim(dim, id, y0, y0 + bh, x0 - 24, x0, `Ht=${p.Ht}${unit}`);
    microV(dim, id, y0, y0 + th, x0 + bw + 26, `t=${p.tdes || p.tnom}${unit}`);
    centerlines(dim, cx, cy, bw / 2, bh / 2);
  } else if (isAng) {
    const lw = sx(g('b')), lh = sx(g('d')), th = sx(g('t'));
    const totalW = t === '2L' ? lw * 2 + Math.max(6, sx(0.375)) : lw;
    const x0 = cx - totalW / 2, y0 = cy - lh / 2;
    const one = (ox, flip) => {
      const x = ox, y = y0;
      return flip
        ? `M${x},${y} h${-th} v${lh - th} h${-(lw - th)} v${th} h${lw} Z`
        : `M${x},${y} h${th} v${lh - th} h${lw - th} v${th} h${-lw} Z`;
    };
    if (t === '2L') {
      const gap = Math.max(6, sx(0.375));
      body = `<path d="${one(x0 + lw + gap, false)}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
              <path d="${one(x0 + lw + gap - gap, true)}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
    } else {
      body = `<path d="${one(x0, false)}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
    }
    hDim(dim, id, x0, x0 + lw, y0 - 22, y0, `b=${p.b}${unit}`);
    vDim(dim, id, y0, y0 + lh, x0 - 24, x0, `d=${p.d}${unit}`);
    microH(dim, id, x0, x0 + th, y0 + lh + 40, `t=${p.t}${unit}`, 1);
    centerlines(dim, x0 + totalW / 2, y0 + lh / 2, totalW / 2, lh / 2);
  } else if (isTee) {
    const bw = sx(g('bf')), bh = sx(g('d')), twpx = sx(g('tw')), tfpx = sx(g('tf'));
    const x0 = cx - bw / 2, y0 = cy - bh / 2;
    body = `<path d="M${x0},${y0} h${bw} v${tfpx} h${-(bw - twpx) / 2} v${bh - tfpx} h${-twpx}
              v${-(bh - tfpx)} h${-(bw - twpx) / 2} Z"
              fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
    hDim(dim, id, x0, x0 + bw, y0 - 22, y0, `bf=${p.bf}${unit}`);
    vDim(dim, id, y0, y0 + bh, x0 - 24, x0, `d=${p.d}${unit}`);
    microV(dim, id, y0, y0 + tfpx, x0 + bw + 26, `tf=${p.tf}${unit}`);
    microH(dim, id, cx - twpx / 2, cx + twpx / 2, y0 + bh + 22, `tw=${p.tw}${unit}`, 1);
    centerlines(dim, cx, cy, bw / 2, bh / 2);
  } else if (isChan) {
    const bw = sx(g('bf')), bh = sx(g('d')), twpx = sx(g('tw')), tfpx = sx(g('tf'));
    const x0 = cx - bw / 2, y0 = cy - bh / 2;
    body = `<path d="M${x0},${y0} h${bw} v${tfpx} h${-(bw - twpx)} v${bh - 2 * tfpx} h${bw - twpx} v${tfpx} h${-bw} Z"
              fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
    hDim(dim, id, x0, x0 + bw, y0 - 22, y0, `bf=${p.bf}${unit}`);
    vDim(dim, id, y0, y0 + bh, x0 - 24, x0, `d=${p.d}${unit}`);
    microV(dim, id, y0, y0 + tfpx, x0 + bw + 26, `tf=${p.tf}${unit}`);
    microH(dim, id, x0, x0 + twpx, y0 + bh + 22, `tw=${p.tw}${unit}`, 1);
    centerlines(dim, cx, cy, bw / 2, bh / 2);
  } else {
    // I-shapes: W, M, S, HP
    const bw = sx(g('bf')), bh = sx(g('d')), twpx = sx(g('tw')), tfpx = sx(g('tf'));
    const x0 = cx - bw / 2, y0 = cy - bh / 2, sh = (bw - twpx) / 2;
    // Fillet radius at the flange/web junction, approximated as kdes - tf
    // (the AISC k-dimension already includes the flange thickness).
    const kdesVal = g('kdes');
    let r = kdesVal ? sx(kdesVal) - tfpx : 0;
    r = Math.max(0, Math.min(r, sh - 1, (bh - 2 * tfpx) / 2 - 1));
    if (r > 0.75) {
      const webSpan = bh - 2 * tfpx - 2 * r;
      body = `<path d="M${x0},${y0} h${bw} v${tfpx} h${-(sh - r)}
                a${r},${r} 0 0,0 ${-r},${r}
                v${webSpan}
                a${r},${r} 0 0,0 ${r},${r}
                h${sh - r} v${tfpx} h${-bw}
                v${-tfpx} h${sh - r}
                a${r},${r} 0 0,0 ${r},${-r}
                v${-webSpan}
                a${r},${r} 0 0,0 ${-r},${-r}
                h${-(sh - r)} Z"
                fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
    } else {
      body = `<path d="M${x0},${y0} h${bw} v${tfpx} h${-sh} v${bh - 2 * tfpx} h${sh} v${tfpx} h${-bw}
                v${-tfpx} h${sh} v${-(bh - 2 * tfpx)} h${-sh} Z"
                fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
    }
    hDim(dim, id, x0, x0 + bw, y0 - 22, y0, `bf=${p.bf}${unit}`);
    vDim(dim, id, y0, y0 + bh, x0 - 24, x0, `d=${p.d}${unit}`);
    // tf on the top flange, k mirrored onto the bottom flange — vertically
    // separated by the full web height so the two callouts never collide.
    microV(dim, id, y0, y0 + tfpx, x0 + bw + 26, `tf=${p.tf}${unit}`);
    if (p.kdes) {
      const kpx = sx(g('kdes'));
      microV(dim, id, y0 + bh - kpx, y0 + bh, x0 + bw + 26, `k=${p.kdes}${unit}`);
    }
    // tw threaded through the web at mid-height (inside the shape, like the
    // reference drawing), k1 below the shape — different zones from tf/k.
    microH(dim, id, cx - twpx / 2, cx + twpx / 2, cy, `tw=${p.tw}${unit}`, 1);
    if (p.k1) microH(dim, id, cx, cx + sx(g('k1')), y0 + bh + 24, `k1=${p.k1}${unit}`, 1);
    centerlines(dim, cx, cy, bw / 2, bh / 2);
  }

  return `<svg viewBox="0 0 ${W} ${H}" class="section-svg" role="img"
    aria-label="${s.name} cross section in ${unit}">${defsBlock(id)}${body}${dim.join('')}</svg>`;
}

/** Simple circular bar (Rebar): diameter dimension line only. */
export function drawBarSVG(diaValue, unit) {
  const id = `db${uid++}`;
  const cx = W / 2, cy = H / 2, R = 92;
  const fill = `url(#hatch-${id})`, stroke = 'var(--steel-line)';
  const body = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  const dim = [];
  hDim(dim, id, cx - R, cx + R, cy - R - 26, cy - R, `D=${diaValue}${unit}`);
  return `<svg viewBox="0 0 ${W} ${H}" class="section-svg" role="img"
    aria-label="rebar cross section in ${unit}">${defsBlock(id)}${body}${dim.join('')}</svg>`;
}

// Nominal design thickness by gauge (in.) — schematic wall thickness only;
// the source tables give gauge, not a tabulated thickness value.
const GAUGE_THICKNESS_IN = { 10: 0.1345, 12: 0.1017, 14: 0.0713, 16: 0.0566, 18: 0.0451 };

/** Cee/Zee/Easy-Lap-Zee light-gauge purlin, drawn as a lipped-channel
 * centerline (open thin-walled profile) with D/B/L dimension lines. */
export function drawPurlinSVG(row, kind, unit) {
  const id = `dp${uid++}`;
  const isMetric = unit === 'mm';
  const conv = isMetric ? 25.4 : 1; // row.d/b/l are in inches; convert for metric view
  const d = row.d * conv, l = row.l * conv;
  const b = kind === 'easyLap' ? Math.max(row.b1, row.b2) * conv : row.b * conv;
  const b1 = kind === 'easyLap' ? row.b1 * conv : row.b * conv;
  const b2 = kind === 'easyLap' ? row.b2 * conv : row.b * conv;
  const tIn = GAUGE_THICKNESS_IN[row.ga] || 0.06;
  const tw = tIn * (isMetric ? 25.4 : 1);

  const gutter = { l: 70, t: 50, r: 90, b: 60 };
  const bboxW = W - gutter.l - gutter.r;
  const bboxH = H - gutter.t - gutter.b;
  const ow = kind === 'zee' || kind === 'easyLap' ? b1 + b2 : b;
  const k = Math.min(bboxW / ow, bboxH / d);
  const sx = (v) => v * k;
  const cx = gutter.l + bboxW / 2;
  const cy = gutter.t + bboxH / 2;

  const D = sx(d), L = sx(l), B1 = sx(b1), B2 = sx(b2);
  const stroke = 'var(--steel-line)';
  const strokeW = Math.max(2.5, sx(tw));
  // x0 = the web's x-position; the shape's overall bbox is centered on cx.
  const x0 = kind === 'cee' ? cx - B1 / 2 : cx + (B2 - B1) / 2;
  const y0 = cy - D / 2;

  let pts;
  if (kind === 'cee') {
    pts = [[x0 + B1, y0 + L], [x0 + B1, y0], [x0, y0], [x0, y0 + D], [x0 + B1, y0 + D], [x0 + B1, y0 + D - L]];
  } else {
    // zee / easyLap: top flange extends right of the web, bottom flange left
    pts = [[x0 + B1, y0 + L], [x0 + B1, y0], [x0, y0], [x0, y0 + D],
           [x0 - B2, y0 + D], [x0 - B2, y0 + D - L]];
  }
  const d3 = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const body = `<path d="${d3}" fill="none" stroke="${stroke}" stroke-width="${strokeW}"
    stroke-linejoin="round" stroke-linecap="round"/>`;

  const dim = [];
  vDim(dim, id, y0, y0 + D, x0 - 30, x0, `D=${isMetric ? d.toFixed(0) : d}${unit}`);
  if (kind === 'cee') {
    hDim(dim, id, x0, x0 + B1, y0 - 26, y0, `B=${isMetric ? b.toFixed(0) : b}${unit}`);
  } else {
    hDim(dim, id, x0, x0 + B1, y0 - 26, y0, `B1=${isMetric ? b1.toFixed(0) : b1}${unit}`);
    hDim(dim, id, x0 - B2, x0, y0 + D + 26, y0 + D, `B2=${isMetric ? b2.toFixed(0) : b2}${unit}`);
  }
  microV(dim, id, y0, y0 + L, x0 + B1 + 20, `L=${isMetric ? l.toFixed(0) : l}${unit}`);
  dim.push(text(cx, y0 + D + (kind === 'cee' ? 46 : 50), `${row.ga}GA`, 'middle'));

  return `<svg viewBox="0 0 ${W} ${H}" class="section-svg" role="img"
    aria-label="${kind} purlin cross section in ${unit}">${defsBlock(id)}${body}${dim.join('')}</svg>`;
}

/** H-shape with a T-bar welded stem-down onto the top flange (BH modes 2/3).
 * hDims/tDims are plain {d,bf,tw,tf} objects already in the target unit. */
export function drawHPlusTSVG(hDims, tDims, unit) {
  const id = nextId('dt');
  const gutter = { l: 58, t: 40, r: 60, b: 40 };
  const bboxW = W - gutter.l - gutter.r;
  const bboxH = H - gutter.t - gutter.b;
  const ow = Math.max(hDims.bf, tDims.bf);
  const oh = hDims.d + tDims.d;
  const k = Math.min(bboxW / ow, bboxH / oh);
  const sx = (v) => v * k;
  const cx = gutter.l + bboxW / 2;
  const topY = gutter.t + (bboxH - oh * k) / 2;

  const bwH = sx(hDims.bf), bhH = sx(hDims.d), twH = sx(hDims.tw), tfH = sx(hDims.tf);
  const bwT = sx(tDims.bf), bhT = sx(tDims.d), twT = sx(tDims.tw), tfT = sx(tDims.tf);
  const shH = (bwH - twH) / 2;

  const yHtop = topY + bhT;
  const yHbot = yHtop + bhH;
  const x0H = cx - bwH / 2;
  const x0T = cx - bwT / 2;

  const fill = `url(#hatch-${id})`, stroke = 'var(--steel-line)';
  const bodyH = `<path d="M${x0H},${yHtop} h${bwH} v${tfH} h${-shH} v${bhH - 2 * tfH} h${shH} v${tfH} h${-bwH}
    v${-tfH} h${shH} v${-(bhH - 2 * tfH)} h${-shH} Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  const bodyT = `<path d="M${x0T},${topY} h${bwT} v${tfT} h${-(bwT - twT) / 2} v${bhT - tfT} h${-twT}
    v${-(bhT - tfT)} h${-(bwT - twT) / 2} Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  // weld fillet marks at the T-stem / H-flange junction
  const wf = Math.min(8, twH / 2);
  const weld = `<path d="M${cx - twT / 2 - wf},${yHtop} L${cx - twT / 2},${yHtop - wf} L${cx - twT / 2},${yHtop} Z
    M${cx + twT / 2 + wf},${yHtop} L${cx + twT / 2},${yHtop - wf} L${cx + twT / 2},${yHtop} Z"
    fill="var(--val-warn)" opacity=".85"/>`;

  const dim = [];
  vDim(dim, id, topY, yHbot, x0H - 26, Math.min(x0H, x0T), `D=${fmtDim(hDims.d + tDims.d, unit)}${unit}`);
  hDim(dim, id, x0H, x0H + bwH, yHbot + 24, yHbot, `bf(H)=${fmtDim(hDims.bf, unit)}${unit}`);
  hDim(dim, id, x0T, x0T + bwT, topY - 22, topY, `bf(T)=${fmtDim(tDims.bf, unit)}${unit}`);
  microV(dim, id, yHtop, yHtop + tfH, x0H + bwH + 20, `tf(H)=${fmtDim(hDims.tf, unit)}${unit}`);
  microH(dim, id, cx - twH / 2, cx + twH / 2, (yHtop + yHbot) / 2, `tw(H)=${fmtDim(hDims.tw, unit)}${unit}`, 1);
  microV(dim, id, topY, topY + tfT, x0T - 20, `tf(T)=${fmtDim(tDims.tf, unit)}${unit}`, -1);
  microH(dim, id, cx - twT / 2, cx + twT / 2, topY + tfT + (bhT - tfT) / 2, `tw(T)=${fmtDim(tDims.tw, unit)}${unit}`, -1);

  return `<svg viewBox="0 0 ${W} ${H}" class="section-svg" role="img"
    aria-label="H+T built-up cross section in ${unit}">${defsBlock(id)}${bodyH}${bodyT}${weld}${dim.join('')}</svg>`;
}

/** Repeating trapezoidal flute profile for a Vulcraft-style composite metal
 * deck "Nominal Dimensions" drawing. `p` = {depthIn,pitchIn,crestIn,valleyIn,
 * widthIn} always in inches (used for proportions); `unit` picks the label
 * unit ('"' or 'mm') and `disp` is the same shape already converted to that
 * unit for the printed labels. */
export function drawDeckProfileSVG(p, unit, disp) {
  const id = nextId('dk');
  const gutter = { l: 56, t: 56, r: 40, b: 70 };
  const bboxW = W - gutter.l - gutter.r;
  const kx = bboxW / p.widthIn;
  const depthPx = 46; // visually exaggerated, as in the source catalog drawings

  const reps = Math.max(1, Math.round(p.widthIn / p.pitchIn));
  const r = (p.pitchIn - p.valleyIn - p.crestIn) / 2; // slope horizontal run
  const pPx = p.pitchIn * kx, vPx = p.valleyIn * kx, cPx = p.crestIn * kx, rPx = r * kx;

  const x0 = gutter.l;
  const yBot = gutter.t + depthPx + 20;
  const yTop = yBot - depthPx;

  let x = x0, path = `M${x},${yBot} `;
  path += `l${vPx / 2},0 `;
  x += vPx / 2;
  for (let i = 0; i < reps; i++) {
    path += `l${rPx},${-depthPx} l${cPx},0 l${rPx},${depthPx} `;
    if (i < reps - 1) path += `l${vPx},0 `;
  }
  path += `l${vPx / 2},0`;
  const xEnd = x0 + reps * pPx + vPx / 2;

  const body = `<path d="${path}" fill="none" stroke="var(--steel-line)" stroke-width="2" stroke-linejoin="round"/>`;

  const dim = [];
  vDim(dim, id, yTop, yBot, x0 - 26, yTop, `D=${fmtDim(disp.depthIn, unit)}${unit}`);
  hDim(dim, id, x0, xEnd, yBot + 30, yBot, `Width=${fmtDim(disp.widthIn, unit)}${unit}`);
  const cx0 = x0 + vPx / 2 + rPx;
  hDim(dim, id, cx0, cx0 + cPx, yTop - 18, yTop, `crest=${fmtDim(disp.crestIn, unit)}${unit}`);
  if (reps > 1) {
    const vLabelX0 = x0 + pPx; // start of a full valley segment (2nd rib onward)
    hDim(dim, id, vLabelX0, vLabelX0 + vPx, yBot + 12, yBot, `valley=${fmtDim(disp.valleyIn, unit)}${unit}`);
  }
  microH(dim, id, x0, x0 + pPx, yBot - depthPx / 2, `pitch=${fmtDim(disp.pitchIn, unit)}${unit}`, 1);

  return `<svg viewBox="0 0 ${W} ${H}" class="section-svg" role="img"
    aria-label="metal deck nominal dimensions in ${unit}">${defsBlock(id)}${body}${dim.join('')}</svg>`;
}

/** Built-up H-section with independent top/bottom flanges (BH mode ②).
 * dims = {d,tw,bfTop,tfTop,bfBot,tfBot} in the target unit. Unit weight and
 * area are shown below the drawing (like every other shape), not overlaid
 * on the section itself. */
export function drawUnequalHSVG(dims, unit) {
  const id = nextId('du');
  const gutter = { l: 58, t: 44, r: 60, b: 44 };
  const bboxW = W - gutter.l - gutter.r;
  const bboxH = H - gutter.t - gutter.b;
  const ow = Math.max(dims.bfTop, dims.bfBot);
  const oh = dims.d;
  const k = Math.min(bboxW / ow, bboxH / oh);
  const sx = (v) => v * k;
  const cx = gutter.l + bboxW / 2;
  const topY = gutter.t + (bboxH - oh * k) / 2;

  const bwTop = sx(dims.bfTop), tfTop = sx(dims.tfTop);
  const bwBot = sx(dims.bfBot), tfBot = sx(dims.tfBot);
  const dpx = sx(dims.d), tw = sx(dims.tw);
  const botY = topY + dpx;
  const x0Top = cx - bwTop / 2, x0Bot = cx - bwBot / 2;

  // Absolute 12-point outline (top flange, web, bottom flange). The two
  // flanges generally differ in width, so the step from the web edge out to
  // each flange's outer edge must use that flange's OWN half-overhang — a
  // previous version collapsed both steps into a single (shTop - shBot)
  // relative offset, which mis-placed the bottom flange entirely.
  const xTopL = cx - bwTop / 2, xTopR = cx + bwTop / 2;
  const xBotL = cx - bwBot / 2, xBotR = cx + bwBot / 2;
  const xWebL = cx - tw / 2, xWebR = cx + tw / 2;
  const yTopFlangeBot = topY + tfTop, yBotFlangeTop = botY - tfBot;

  const fill = `url(#hatch-${id})`, stroke = 'var(--steel-line)';
  const body = `<path d="
    M${xTopL},${topY} L${xTopR},${topY} L${xTopR},${yTopFlangeBot} L${xWebR},${yTopFlangeBot}
    L${xWebR},${yBotFlangeTop} L${xBotR},${yBotFlangeTop} L${xBotR},${botY} L${xBotL},${botY}
    L${xBotL},${yBotFlangeTop} L${xWebL},${yBotFlangeTop} L${xWebL},${yTopFlangeBot} L${xTopL},${yTopFlangeBot} Z"
    fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;

  const dim = [];
  vDim(dim, id, topY, botY, x0Top - 26, Math.min(x0Top, x0Bot), `D=${fmtDim(dims.d, unit)}${unit}`);
  hDim(dim, id, x0Top, x0Top + bwTop, topY - 22, topY, `bf-top=${fmtDim(dims.bfTop, unit)}${unit}`);
  hDim(dim, id, x0Bot, x0Bot + bwBot, botY + 24, botY, `bf-bot=${fmtDim(dims.bfBot, unit)}${unit}`);
  microV(dim, id, topY, topY + tfTop, x0Top + bwTop + 20, `tf-top=${fmtDim(dims.tfTop, unit)}${unit}`);
  microV(dim, id, botY - tfBot, botY, x0Bot + bwBot + 20, `tf-bot=${fmtDim(dims.tfBot, unit)}${unit}`);
  microH(dim, id, cx - tw / 2, cx + tw / 2, (topY + botY) / 2, `tw=${fmtDim(dims.tw, unit)}${unit}`, -1);

  return `<svg viewBox="0 0 ${W} ${H}" class="section-svg" role="img"
    aria-label="Unequal-flange built-up H cross section in ${unit}">${defsBlock(id)}${body}${dim.join('')}</svg>`;
}
