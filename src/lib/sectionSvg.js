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

  // Flange/web (or leg) fillet radius, in the shape's own unit: AISC/KS
  // tables don't publish a bare fillet radius for most types, but `kdes`
  // (design distance from the outer face to the web/leg toe) already
  // includes the material thickness, so r = kdes - thickness recovers it.
  // KST/KSL/KSC/HSS/KSB rows have neither field, so this returns 0 (sharp).
  const filletIn = (thicknessKey) => {
    const kdesVal = g('kdes');
    const th = g(thicknessKey);
    if (!kdesVal || !th) return 0;
    const v = kdesVal - th;
    return v > 0 ? v : 0;
  };

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
    // HSS/KSB corner radii aren't tabulated in this dataset; ASTM A500's
    // standard approximation (outer ≈ 2t, inner ≈ outer − t = t) is used
    // instead of the fixed `rx` attribute this used to carry — `rx` has no
    // effect on a <path> (only <rect>/<ellipse> support it), so corners were
    // silently rendering sharp despite that attribute being present.
    const ro = Math.max(0, Math.min(2 * th, bw / 2 - 1, bh / 2 - 1));
    const ri = Math.max(0, Math.min(ro - th, (bw - 2 * th) / 2 - 1, (bh - 2 * th) / 2 - 1));
    body = `<path d="${roundedRectPath(x0, y0, bw, bh, ro)}
              ${roundedRectPath(x0 + th, y0 + th, bw - 2 * th, bh - 2 * th, ri)}"
              fill="${fill}" fill-rule="evenodd" stroke="${stroke}" stroke-width="1.5"/>`;
    hDim(dim, id, x0, x0 + bw, y0 - 22, y0, `B=${p.B}${unit}`);
    vDim(dim, id, y0, y0 + bh, x0 - 24, x0, `Ht=${p.Ht}${unit}`);
    microV(dim, id, y0, y0 + th, x0 + bw + 26, `t=${p.tdes || p.tnom}${unit}`);
    centerlines(dim, cx, cy, bw / 2, bh / 2);
  } else if (isAng) {
    const lw = sx(g('b')), lh = sx(g('d')), th = sx(g('t'));
    const totalW = t === '2L' ? lw * 2 + Math.max(6, sx(0.375)) : lw;
    const x0 = cx - totalW / 2, y0 = cy - lh / 2;
    // Heel fillet at the inside corner where the two legs meet.
    const rc = Math.max(0, Math.min(sx(filletIn('t')), th - 1, Math.min(lh, lw) - th - 1));
    const one = (ox, flip) => {
      const x = ox, y = y0;
      if (rc > 0.75) {
        return flip
          ? `M${x},${y} h${-th} v${lh - th - rc} a${rc},${rc} 0 0,1 ${-rc},${rc} h${-(lw - th - rc)} v${th} h${lw} Z`
          : `M${x},${y} h${th} v${lh - th - rc} a${rc},${rc} 0 0,0 ${rc},${rc} h${lw - th - rc} v${th} h${-lw} Z`;
      }
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
    body = tBodyStemDownPath(x0, y0, bw, bh, twpx, tfpx, sx(filletIn('tf')), fill, stroke);
    hDim(dim, id, x0, x0 + bw, y0 - 22, y0, `bf=${p.bf}${unit}`);
    vDim(dim, id, y0, y0 + bh, x0 - 24, x0, `d=${p.d}${unit}`);
    microV(dim, id, y0, y0 + tfpx, x0 + bw + 26, `tf=${p.tf}${unit}`);
    microH(dim, id, cx - twpx / 2, cx + twpx / 2, y0 + bh + 22, `tw=${p.tw}${unit}`, 1);
    centerlines(dim, cx, cy, bw / 2, bh / 2);
  } else if (isChan) {
    const bw = sx(g('bf')), bh = sx(g('d')), twpx = sx(g('tw')), tfpx = sx(g('tf'));
    const x0 = cx - bw / 2, y0 = cy - bh / 2;
    body = channelBodyPath(x0, y0, bw, bh, twpx, tfpx, sx(filletIn('tf')), fill, stroke);
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
    const r = sx(filletIn('tf'));
    body = t === 'S'
      ? sShapeBodyPath(x0, y0, bw, bh, twpx, tfpx, r, fill, stroke)
      : iBodyPath(x0, y0, bw, bh, twpx, tfpx, r, fill, stroke);
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

/** Rectangle outline with all four corners rounded to radius `r` (falls back
 * to a sharp rectangle when r is too small to render). Used for HSS/KSB box
 * sections — SVG's `rx`/`ry` attributes only work on <rect>/<ellipse>, not
 * on a <path>, so a real rounded-corner path is needed instead. */
function roundedRectPath(x, y, w, h, r) {
  const rc = Math.max(0, Math.min(r, w / 2 - 0.5, h / 2 - 0.5));
  if (rc < 0.75) return `M${x},${y} h${w} v${h} h${-w} Z`;
  return `M${x + rc},${y} H${x + w - rc} A${rc},${rc} 0 0 1 ${x + w},${y + rc}
    V${y + h - rc} A${rc},${rc} 0 0 1 ${x + w - rc},${y + h}
    H${x + rc} A${rc},${rc} 0 0 1 ${x},${y + h - rc}
    V${y + rc} A${rc},${rc} 0 0 1 ${x + rc},${y} Z`;
}

/** Channel (C/MC/KSC) outline: web at the left (x0..x0+tw), flanges spanning
 * the full width top and bottom, open on the right. Fillets only apply on
 * the left (closed) side where the flanges meet the web — the right side is
 * just the flanges' free tips, always sharp. Same corner convention as
 * iBodyPath (clockwise outline, concave corners use sweep-flag 0). */
function channelBodyPath(x0, y0, bw, bh, tw, tf, r, fill, stroke) {
  const shoulder = bw - tw;
  const rc = Math.max(0, Math.min(r, shoulder - 1, (bh - 2 * tf) / 2 - 1));
  if (rc > 0.75) {
    const webSpan = bh - 2 * tf - 2 * rc;
    return `<path d="M${x0},${y0} h${bw} v${tf} h${-(shoulder - rc)}
      a${rc},${rc} 0 0,0 ${-rc},${rc}
      v${webSpan}
      a${rc},${rc} 0 0,0 ${rc},${rc}
      h${shoulder - rc} v${tf} h${-bw} Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  }
  return `<path d="M${x0},${y0} h${bw} v${tf} h${-shoulder} v${bh - 2 * tf} h${shoulder} v${tf} h${-bw} Z"
    fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
}

/** S-shape (American Standard Beam) outline: like iBodyPath, but the flange's
 * inner face (facing the web cavity) slopes from a thinner tip up to the
 * full tabulated tf at the web, using the standard 1:6 (16-2/3%) S-shape
 * flange slope. AISC's shape tables don't publish a separate tip thickness
 * or the exact reference point tf is measured at, so this is a labeled
 * VISUAL APPROXIMATION for the drawing only — dimension lines still show
 * the tabulated tf/bf/d/tw values unchanged, and section properties (Ix,
 * Sx, W, …) come from the tabulated values too, not from this geometry. */
function sShapeBodyPath(x0, yTop, bw, bh, tw, tf, r, fill, stroke) {
  const sh = (bw - tw) / 2;
  const rc = Math.max(0, Math.min(r, sh - 1, (bh - 2 * tf) / 2 - 1));
  const slope = 1 / 6;
  const tipDrop = Math.min(tf * 0.5, slope * sh);
  const tfTip = tf - tipDrop;
  const webSpan = bh - 2 * tf - 2 * rc;
  const shRun = sh - rc;
  return `<path d="M${x0},${yTop} h${bw} v${tfTip}
    l${-shRun},${tipDrop}
    a${rc},${rc} 0 0,0 ${-rc},${rc}
    v${webSpan}
    a${rc},${rc} 0 0,0 ${rc},${rc}
    l${shRun},${tipDrop}
    v${tfTip} h${-bw} v${-tfTip}
    l${shRun},${-tipDrop}
    a${rc},${rc} 0 0,0 ${rc},${-rc}
    v${-webSpan}
    a${rc},${rc} 0 0,0 ${-rc},${-rc}
    l${-shRun},${-tipDrop} Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
}

/** Symmetric I-shape outline (both flanges equal), with rounded flange/web
 * fillets when `r` is large enough to render (same corner convention as the
 * validated fillet code in drawShapeSVG's I-shape branch: clockwise outline,
 * all four concave corners use sweep-flag 0). Falls back to sharp corners
 * when r is ~0 (built-up welded plates have no rolled fillet). */
function iBodyPath(x0, yTop, bw, bh, tw, tf, r, fill, stroke) {
  const sh = (bw - tw) / 2;
  const rc = Math.max(0, Math.min(r, sh - 1, (bh - 2 * tf) / 2 - 1));
  if (rc > 0.75) {
    const webSpan = bh - 2 * tf - 2 * rc;
    return `<path d="M${x0},${yTop} h${bw} v${tf} h${-(sh - rc)}
      a${rc},${rc} 0 0,0 ${-rc},${rc}
      v${webSpan}
      a${rc},${rc} 0 0,0 ${rc},${rc}
      h${sh - rc} v${tf} h${-bw}
      v${-tf} h${sh - rc}
      a${rc},${rc} 0 0,0 ${rc},${-rc}
      v${-webSpan}
      a${rc},${rc} 0 0,0 ${-rc},${-rc}
      h${-(sh - rc)} Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  }
  return `<path d="M${x0},${yTop} h${bw} v${tf} h${-sh} v${bh - 2 * tf} h${sh} v${tf} h${-bw}
    v${-tf} h${sh} v${-(bh - 2 * tf)} h${-sh} Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
}

/** T outline, flange on top and stem hanging down (used for the optional
 * 상부 T welded stem-down onto the H's top flange). Fillets at the two
 * shoulder/stem corners; sharp free end at the stem tip. */
function tBodyStemDownPath(x0, yTop, bw, bh, tw, tf, r, fill, stroke) {
  const sh = (bw - tw) / 2;
  const rc = Math.max(0, Math.min(r, sh - 1, bh - tf - 1));
  if (rc > 0.75) {
    const stemRun = bh - tf - rc;
    return `<path d="M${x0},${yTop} h${bw} v${tf} h${-(sh - rc)}
      a${rc},${rc} 0 0,0 ${-rc},${rc}
      v${stemRun} h${-tw} v${-stemRun}
      a${rc},${rc} 0 0,0 ${-rc},${-rc}
      h${-(sh - rc)} Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  }
  return `<path d="M${x0},${yTop} h${bw} v${tf} h${-sh} v${bh - tf} h${-tw}
    v${-(bh - tf)} h${-sh} Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
}

/** T outline, flange on bottom and stem rising up (used for the required
 * 하부 T welded stem-up onto the H's bottom flange), anchored at the stem's
 * top-left corner. Mirrors tBodyStemDownPath's fillet corners. */
function tBodyStemUpPath(xStem0, yTop, bw, bh, tw, tf, r, fill, stroke) {
  const sh = (bw - tw) / 2;
  const rc = Math.max(0, Math.min(r, sh - 1, bh - tf - 1));
  if (rc > 0.75) {
    const stemRun = bh - tf - rc;
    return `<path d="M${xStem0},${yTop} h${tw} v${stemRun}
      a${rc},${rc} 0 0,0 ${rc},${rc}
      h${sh - rc} v${tf} h${-bw} v${-tf} h${sh - rc}
      a${rc},${rc} 0 0,0 ${rc},${-rc}
      v${-stemRun} Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  }
  return `<path d="M${xStem0},${yTop} h${tw} v${bh - tf} h${sh}
    v${tf} h${-bw} v${-tf} h${sh} v${-(bh - tf)} Z" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
}

/** H-shape with an optional T-bar welded stem-up onto its BOTTOM flange and
 * an optional second T-bar welded stem-down onto its TOP flange (BH modes
 * 3/4's 상부/중앙부/하부 layout). Any of hDims/botDims/topDims may be null —
 * whichever pieces are present are stacked top-to-bottom in that order and
 * drawn; at least one must be non-null. All dims are plain {d,bf,tw,tf,r?}
 * in the target unit — `r` is the flange/web fillet radius (0/undefined
 * draws sharp corners, as for built-up welded plates with no rolled fillet). */
export function drawHBotTopTSVG(hDims, botDims, topDims, unit) {
  const id = nextId('dtt');
  const gutter = { l: 58, t: 40, r: 60, b: 40 };
  const bboxW = W - gutter.l - gutter.r;
  const bboxH = H - gutter.t - gutter.b;
  const hasH = !!hDims, hasBot = !!botDims, hasTop = !!topDims;
  const ow = Math.max(hDims?.bf || 0, botDims?.bf || 0, topDims?.bf || 0);
  const oh = (hDims?.d || 0) + (botDims?.d || 0) + (topDims?.d || 0);
  const k = Math.min(bboxW / ow, bboxH / oh);
  const sx = (v) => v * k;
  const cx = gutter.l + bboxW / 2;
  const topY = gutter.t + (bboxH - oh * k) / 2;

  const bwTop = hasTop ? sx(topDims.bf) : 0, bhTop = hasTop ? sx(topDims.d) : 0;
  const twTop = hasTop ? sx(topDims.tw) : 0, tfTop = hasTop ? sx(topDims.tf) : 0;
  const rTop = hasTop ? sx(topDims.r || 0) : 0;

  const bwH = hasH ? sx(hDims.bf) : 0, bhH = hasH ? sx(hDims.d) : 0;
  const twH = hasH ? sx(hDims.tw) : 0, tfH = hasH ? sx(hDims.tf) : 0, rH = hasH ? sx(hDims.r || 0) : 0;

  const bwBot = hasBot ? sx(botDims.bf) : 0, bhBot = hasBot ? sx(botDims.d) : 0;
  const twBot = hasBot ? sx(botDims.tw) : 0, tfBot = hasBot ? sx(botDims.tf) : 0, rBot = hasBot ? sx(botDims.r || 0) : 0;

  const yHtop = topY + bhTop;
  const yHbot = yHtop + bhH;
  const yBotEnd = yHbot + bhBot;
  const x0H = cx - bwH / 2;
  const x0Bot = cx - bwBot / 2;
  const x0Top = cx - bwTop / 2;

  const fill = `url(#hatch-${id})`, stroke = 'var(--steel-line)';
  const bodyH = hasH ? iBodyPath(x0H, yHtop, bwH, bhH, twH, tfH, rH, fill, stroke) : '';
  // bottom T, stem-up (anchored at its stem's top-left corner, touching whatever sits above it)
  const bodyBot = hasBot ? tBodyStemUpPath(cx - twBot / 2, yHbot, bwBot, bhBot, twBot, tfBot, rBot, fill, stroke) : '';
  const bodyTop = hasTop ? tBodyStemDownPath(x0Top, topY, bwTop, bhTop, twTop, tfTop, rTop, fill, stroke) : '';

  // Weld marks at each junction that actually exists between two present pieces.
  let weld = '';
  if (hasBot && (hasH || hasTop)) {
    const refTw = hasH ? twH : twTop;
    const wfBot = Math.min(8, Math.max(refTw, 2) / 2);
    weld += `<path d="M${cx - twBot / 2 - wfBot},${yHbot} L${cx - twBot / 2},${yHbot + wfBot} L${cx - twBot / 2},${yHbot} Z
      M${cx + twBot / 2 + wfBot},${yHbot} L${cx + twBot / 2},${yHbot + wfBot} L${cx + twBot / 2},${yHbot} Z"
      fill="var(--val-warn)" opacity=".85"/>`;
  }
  if (hasTop && (hasH || hasBot)) {
    const refTw = hasH ? twH : twBot;
    const wfTop = Math.min(8, Math.max(refTw, 2) / 2);
    weld += `<path d="M${cx - twTop / 2 - wfTop},${yHtop} L${cx - twTop / 2},${yHtop - wfTop} L${cx - twTop / 2},${yHtop} Z
      M${cx + twTop / 2 + wfTop},${yHtop} L${cx + twTop / 2},${yHtop - wfTop} L${cx + twTop / 2},${yHtop} Z"
      fill="var(--val-warn)" opacity=".85"/>`;
  }

  const dim = [];
  const totalD = (hDims?.d || 0) + (botDims?.d || 0) + (topDims?.d || 0);
  const xs = [hasH && x0H, hasBot && x0Bot, hasTop && x0Top].filter((v) => v !== false);
  const extX = Math.min(...xs);
  vDim(dim, id, topY, yBotEnd, extX - 26, extX, `D=${fmtDim(totalD, unit)}${unit}`);
  if (hasH) {
    hDim(dim, id, x0H, x0H + bwH, yHbot + 24, yHbot, `bf(H)=${fmtDim(hDims.bf, unit)}${unit}`);
    microV(dim, id, yHtop, yHtop + tfH, x0H + bwH + 20, `tf(H)=${fmtDim(hDims.tf, unit)}${unit}`);
    microH(dim, id, cx - twH / 2, cx + twH / 2, (yHtop + yHbot) / 2, `tw(H)=${fmtDim(hDims.tw, unit)}${unit}`, 1);
    if (hDims.r) dim.push(text(x0H + (bwH - twH) / 4, yHtop + tfH + Math.max(rH, 10) * 0.6, `r(H)=${fmtDim(hDims.r, unit)}${unit}`));
  }
  if (hasBot) {
    hDim(dim, id, x0Bot, x0Bot + bwBot, yBotEnd + 24, yBotEnd, `bf(bot)=${fmtDim(botDims.bf, unit)}${unit}`);
    microV(dim, id, yBotEnd - tfBot, yBotEnd, x0Bot + bwBot + 20, `tf(bot)=${fmtDim(botDims.tf, unit)}${unit}`, 1);
    microH(dim, id, cx - twBot / 2, cx + twBot / 2, yHbot + (bhBot - tfBot) / 2, `tw(bot)=${fmtDim(botDims.tw, unit)}${unit}`, 1);
    if (botDims.r) dim.push(text(x0Bot + (bwBot - twBot) / 4, yHbot + bhBot - tfBot - Math.max(rBot, 10) * 0.6, `r(bot)=${fmtDim(botDims.r, unit)}${unit}`));
  }
  if (hasTop) {
    hDim(dim, id, x0Top, x0Top + bwTop, topY - 22, topY, `bf(top)=${fmtDim(topDims.bf, unit)}${unit}`);
    microV(dim, id, topY, topY + tfTop, x0Top - 20, `tf(top)=${fmtDim(topDims.tf, unit)}${unit}`, -1);
    microH(dim, id, cx - twTop / 2, cx + twTop / 2, topY + tfTop + (bhTop - tfTop) / 2, `tw(top)=${fmtDim(topDims.tw, unit)}${unit}`, -1);
    if (topDims.r) dim.push(text(x0Top + (bwTop - twTop) / 4, topY + tfTop + Math.max(rTop, 10) * 0.6, `r(top)=${fmtDim(topDims.r, unit)}${unit}`));
  }

  return `<svg viewBox="0 0 ${W} ${H}" class="section-svg" role="img"
    aria-label="H with top/bottom T-bar built-up cross section in ${unit}">${defsBlock(id)}${bodyH}${bodyBot}${bodyTop}${weld}${dim.join('')}</svg>`;
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

  // Dimension lines stack below the shape in increasing order of span
  // (valley sub-feature closest, then the full pitch period, then the
  // overall width outermost) so none of them cross the profile or each
  // other's extension lines.
  const dim = [];
  vDim(dim, id, yTop, yBot, x0 - 26, yTop, `D=${fmtDim(disp.depthIn, unit)}${unit}`);
  const cx0 = x0 + vPx / 2 + rPx;
  hDim(dim, id, cx0, cx0 + cPx, yTop - 18, yTop, `crest=${fmtDim(disp.crestIn, unit)}${unit}`);
  if (reps > 1) {
    const vLabelX0 = x0 + pPx; // start of a full valley segment (2nd rib onward)
    hDim(dim, id, vLabelX0, vLabelX0 + vPx, yBot + 18, yBot, `valley=${fmtDim(disp.valleyIn, unit)}${unit}`);
  }
  hDim(dim, id, x0, x0 + pPx, yBot + 40, yBot, `pitch=${fmtDim(disp.pitchIn, unit)}${unit}`);
  hDim(dim, id, x0, xEnd, yBot + 62, yBot, `Width=${fmtDim(disp.widthIn, unit)}${unit}`);

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
