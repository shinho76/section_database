// Cross-section SVG renderer — engineering-drawing style (hatch fill, arrowed
// dimension lines with extension lines, halo text) inspired by
// https://calcs.app/steel/section-properties
const num = (v) => (v === undefined || v === '' || v === null ? null : parseFloat(v));

const W = 460, H = 320;
let uid = 0;

function defsBlock(id) {
  return `<defs>
    <marker id="ar-${id}" markerWidth="9" markerHeight="9" refX="7.5" refY="4" orient="auto" markerUnits="strokeWidth">
      <path d="M1,1 L8,4 L1,7" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"/>
    </marker>
    <marker id="arr-${id}" markerWidth="9" markerHeight="9" refX="0.5" refY="4" orient="auto" markerUnits="strokeWidth">
      <path d="M8,1 L1,4 L8,7" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round" stroke-linecap="round"/>
    </marker>
    <pattern id="hatch-${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="6" height="6" fill="var(--steel-fill)"/>
      <line x1="0" y1="0" x2="0" y2="6" stroke="var(--steel-line)" stroke-opacity=".5" stroke-width="1.2"/>
    </pattern>
  </defs>`;
}

function text(x, y, label, anchor = 'middle') {
  return `<text x="${x}" y="${y}" text-anchor="${anchor}" dominant-baseline="middle"
    font-size="11.5" font-family="ui-monospace,monospace" stroke="var(--bg-card)" stroke-width="3.2"
    paint-order="stroke" fill="currentColor">${label}</text>`;
}

/** Full-span dimension: extension lines from the two feature points out to the
 * dimension line, then a double-arrow line between them with a centered label. */
function hDim(dim, id, x1, x2, y, extFromY, label) {
  dim.push(`<line x1="${x1}" y1="${extFromY}" x2="${x1}" y2="${y}" stroke="currentColor" stroke-width=".7" opacity=".55"/>`);
  dim.push(`<line x1="${x2}" y1="${extFromY}" x2="${x2}" y2="${y}" stroke="currentColor" stroke-width=".7" opacity=".55"/>`);
  dim.push(`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="currentColor" stroke-width="1.2"
    marker-start="url(#arr-${id})" marker-end="url(#ar-${id})"/>`);
  dim.push(text((x1 + x2) / 2, y - 9, label));
}

function vDim(dim, id, y1, y2, x, extFromX, label) {
  dim.push(`<line x1="${extFromX}" y1="${y1}" x2="${x}" y2="${y1}" stroke="currentColor" stroke-width=".7" opacity=".55"/>`);
  dim.push(`<line x1="${extFromX}" y1="${y2}" x2="${x}" y2="${y2}" stroke="currentColor" stroke-width=".7" opacity=".55"/>`);
  dim.push(`<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="currentColor" stroke-width="1.2"
    marker-start="url(#arr-${id})" marker-end="url(#ar-${id})"/>`);
  dim.push(text(x, (y1 + y2) / 2, label));
}

/** Short thickness callout: a tight double-arrow span across the feature, with
 * the label offset to the side (there isn't room to center it on the line). */
function microV(dim, id, y1, y2, x, label, side = 1) {
  const mid = (y1 + y2) / 2;
  const lx = x + side * 18;
  dim.push(`<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="currentColor" stroke-width="1.1"
    marker-start="url(#arr-${id})" marker-end="url(#ar-${id})"/>`);
  dim.push(`<line x1="${x}" y1="${mid}" x2="${lx - side * 4}" y2="${mid}" stroke="currentColor" stroke-width=".7" opacity=".7"/>`);
  dim.push(text(lx, mid, label, side > 0 ? 'start' : 'end'));
}

function microH(dim, id, x1, x2, y, label, side = 1) {
  const mid = (x1 + x2) / 2;
  const ly = y + side * 17;
  dim.push(`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="currentColor" stroke-width="1.1"
    marker-start="url(#arr-${id})" marker-end="url(#ar-${id})"/>`);
  dim.push(`<line x1="${mid}" y1="${y}" x2="${mid}" y2="${ly - side * 4}" stroke="currentColor" stroke-width=".7" opacity=".7"/>`);
  dim.push(text(mid, ly, label));
}

/** Leader from a point on the shape to an offset label (used for round/OD walls). */
function leader(dim, id, x, y, tx, ty, label, anchor = 'start') {
  dim.push(`<line x1="${x}" y1="${y}" x2="${tx}" y2="${ty}" stroke="currentColor" stroke-width="1.1" marker-start="url(#arr-${id})"/>`);
  dim.push(text(tx + (anchor === 'end' ? -5 : 5), ty, label, anchor));
}

export function drawShapeSVG(s, u) {
  const p = s[u];
  const g = (k) => num(p[k]);
  const t = s.type;
  const id = `dw${uid++}`;
  const unit = u === 'us' ? '"' : 'mm';

  const isRound = t === 'PIPE' || (t === 'HSS' && p.OD);
  const isBox = t === 'HSS' && !p.OD;
  const isAng = t === 'L' || t === '2L';
  const isTee = t === 'WT' || t === 'MT' || t === 'ST';
  const isChan = t === 'C' || t === 'MC';

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
  } else if (isBox) {
    const bw = sx(g('B')), bh = sx(g('Ht')), th = sx(g('tdes') || g('tnom'));
    const x0 = cx - bw / 2, y0 = cy - bh / 2;
    body = `<path d="M${x0},${y0} h${bw} v${bh} h${-bw} Z
              M${x0 + th},${y0 + th} v${bh - 2 * th} h${bw - 2 * th} v${-(bh - 2 * th)} Z"
              fill="${fill}" fill-rule="evenodd" stroke="${stroke}" stroke-width="1.5" rx="${th * 1.4}"/>`;
    hDim(dim, id, x0, x0 + bw, y0 - 22, y0, `B=${p.B}${unit}`);
    vDim(dim, id, y0, y0 + bh, x0 - 24, x0, `Ht=${p.Ht}${unit}`);
    microV(dim, id, y0, y0 + th, x0 + bw + 26, `t=${p.tdes || p.tnom}${unit}`);
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
  } else if (isTee) {
    const bw = sx(g('bf')), bh = sx(g('d')), twpx = sx(g('tw')), tfpx = sx(g('tf'));
    const x0 = cx - bw / 2, y0 = cy - bh / 2;
    body = `<path d="M${x0},${y0} h${bw} v${tfpx} h${-(bw - twpx) / 2} v${bh - tfpx} h${-twpx} v${-(bh - tfpx)} Z"
              fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
    hDim(dim, id, x0, x0 + bw, y0 - 22, y0, `bf=${p.bf}${unit}`);
    vDim(dim, id, y0, y0 + bh, x0 - 24, x0, `d=${p.d}${unit}`);
    microV(dim, id, y0, y0 + tfpx, x0 + bw + 26, `tf=${p.tf}${unit}`);
    microH(dim, id, cx - twpx / 2, cx + twpx / 2, y0 + bh + 22, `tw=${p.tw}${unit}`, 1);
  } else if (isChan) {
    const bw = sx(g('bf')), bh = sx(g('d')), twpx = sx(g('tw')), tfpx = sx(g('tf'));
    const x0 = cx - bw / 2, y0 = cy - bh / 2;
    body = `<path d="M${x0},${y0} h${bw} v${tfpx} h${-(bw - twpx)} v${bh - 2 * tfpx} h${bw - twpx} v${tfpx} h${-bw} Z"
              fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
    hDim(dim, id, x0, x0 + bw, y0 - 22, y0, `bf=${p.bf}${unit}`);
    vDim(dim, id, y0, y0 + bh, x0 - 24, x0, `d=${p.d}${unit}`);
    microV(dim, id, y0, y0 + tfpx, x0 + bw + 26, `tf=${p.tf}${unit}`);
    microH(dim, id, x0, x0 + twpx, y0 + bh + 22, `tw=${p.tw}${unit}`, 1);
  } else {
    // I-shapes: W, M, S, HP
    const bw = sx(g('bf')), bh = sx(g('d')), twpx = sx(g('tw')), tfpx = sx(g('tf'));
    const x0 = cx - bw / 2, y0 = cy - bh / 2, sh = (bw - twpx) / 2;
    body = `<path d="M${x0},${y0} h${bw} v${tfpx} h${-sh} v${bh - 2 * tfpx} h${sh} v${tfpx} h${-bw}
              v${-tfpx} h${sh} v${-(bh - 2 * tfpx)} h${-sh} Z"
              fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
    hDim(dim, id, x0, x0 + bw, y0 - 22, y0, `bf=${p.bf}${unit}`);
    vDim(dim, id, y0, y0 + bh, x0 - 24, x0, `d=${p.d}${unit}`);
    microV(dim, id, y0, y0 + tfpx, x0 + bw + 26, `tf=${p.tf}${unit}`);
    if (p.kdes) microV(dim, id, y0, y0 + sx(g('kdes')), x0 + bw + 56, `k=${p.kdes}${unit}`);
    microH(dim, id, cx - twpx / 2, cx + twpx / 2, y0 + bh + 22, `tw=${p.tw}${unit}`, 1);
    if (p.k1) microH(dim, id, cx, cx + sx(g('k1')), y0 + bh + 44, `k1=${p.k1}${unit}`, 1);
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
