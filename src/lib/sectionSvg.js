// Cross-section SVG renderer, ported from aisc-section-finder-prototype.html
const num = (v) => (v === undefined || v === '' || v === null ? null : parseFloat(v));

export function drawShapeSVG(s, u) {
  const p = s[u];
  const g = (k) => num(p[k]);
  const W = 460, H = 330, cx = W / 2, cy = H / 2 + 6;
  const box = 190;
  const t = s.type;
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
  const k = box / Math.max(ow, oh);
  const sx = (v) => v * k;

  const fill = 'var(--steel-fill)', stroke = 'var(--steel-line)';
  let body = '';

  if (isRound) {
    const R = sx(g('OD')) / 2, r = sx(g('OD') - 2 * (g('tdes') || g('tnom'))) / 2;
    body = `<path d="M${cx - R},${cy} a${R},${R} 0 1,0 ${2 * R},0 a${R},${R} 0 1,0 ${-2 * R},0
              M${cx - r},${cy} a${r},${r} 0 1,1 ${2 * r},0 a${r},${r} 0 1,1 ${-2 * r},0"
              fill="${fill}" fill-rule="evenodd" stroke="${stroke}" stroke-width="1.5"/>`;
  } else if (isBox) {
    const bw = sx(g('B')), bh = sx(g('Ht')), th = sx(g('tdes') || g('tnom'));
    body = `<path d="M${cx - bw / 2},${cy - bh / 2} h${bw} v${bh} h${-bw} Z
              M${cx - bw / 2 + th},${cy - bh / 2 + th} v${bh - 2 * th} h${bw - 2 * th} v${-(bh - 2 * th)} Z"
              fill="${fill}" fill-rule="evenodd" stroke="${stroke}" stroke-width="1.5"/>`;
  } else if (isAng) {
    const lw = sx(g('b')), lh = sx(g('d')), th = sx(g('t'));
    const one = (ox, flip) => {
      const x0 = ox, y0 = cy - lh / 2;
      return flip
        ? `M${x0},${y0} h${-th} v${lh - th} h${-(lw - th)} v${th} h${lw} Z`
        : `M${x0},${y0} h${th} v${lh - th} h${lw - th} v${th} h${-lw} Z`;
    };
    if (t === '2L') {
      const gap = Math.max(4, sx(0.375));
      body = `<path d="${one(cx + gap / 2, false)}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
              <path d="${one(cx - gap / 2, true)}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
    } else {
      body = `<path d="${one(cx - lw / 2, false)}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
    }
  } else if (isTee) {
    const bw = sx(g('bf')), bh = sx(g('d')), tw = sx(g('tw')), tf = sx(g('tf'));
    const x0 = cx - bw / 2, y0 = cy - bh / 2;
    body = `<path d="M${x0},${y0} h${bw} v${tf} h${-(bw - tw) / 2} v${bh - tf} h${-tw} v${-(bh - tf)} Z"
              fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  } else if (isChan) {
    const bw = sx(g('bf')), bh = sx(g('d')), tw = sx(g('tw')), tf = sx(g('tf'));
    const x0 = cx - bw / 2, y0 = cy - bh / 2;
    body = `<path d="M${x0},${y0} h${bw} v${tf} h${-(bw - tw)} v${bh - 2 * tf} h${bw - tw} v${tf} h${-bw} Z"
              fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  } else {
    const bw = sx(g('bf')), bh = sx(g('d')), tw = sx(g('tw')), tf = sx(g('tf'));
    const x0 = cx - bw / 2, y0 = cy - bh / 2, sh = (bw - tw) / 2;
    body = `<path d="M${x0},${y0} h${bw} v${tf} h${-sh} v${bh - 2 * tf} h${sh} v${tf} h${-bw}
              v${-tf} h${sh} v${-(bh - 2 * tf)} h${-sh} Z"
              fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  }

  const dim = [];
  const unit = u === 'us' ? 'in' : 'mm';
  const vDim = (x, y1, y2, label) => {
    dim.push(`<line class="dl" x1="${x}" y1="${y1}" x2="${x}" y2="${y2}"/>
      <line class="tick" x1="${x - 4}" y1="${y1}" x2="${x + 4}" y2="${y1}"/>
      <line class="tick" x1="${x - 4}" y1="${y2}" x2="${x + 4}" y2="${y2}"/>
      <text class="dt" x="${x - 7}" y="${(y1 + y2) / 2}" text-anchor="end"
        dominant-baseline="middle">${label}</text>`);
  };
  const hDim = (y, x1, x2, label) => {
    dim.push(`<line class="dl" x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"/>
      <line class="tick" x1="${x1}" y1="${y - 4}" x2="${x1}" y2="${y + 4}"/>
      <line class="tick" x1="${x2}" y1="${y - 4}" x2="${x2}" y2="${y + 4}"/>
      <text class="dt" x="${(x1 + x2) / 2}" y="${y - 8}" text-anchor="middle">${label}</text>`);
  };
  const lead = (x, y, tx, ty, label, anchor = 'start') => {
    dim.push(`<line class="dl" x1="${x}" y1="${y}" x2="${tx}" y2="${ty}"/>
      <circle class="dot" cx="${x}" cy="${y}" r="2"/>
      <text class="dt" x="${tx + (anchor === 'end' ? -4 : 4)}" y="${ty}" text-anchor="${anchor}"
        dominant-baseline="middle">${label}</text>`);
  };

  if (isRound) {
    const R = sx(g('OD')) / 2;
    hDim(cy - R - 22, cx - R, cx + R, `OD=${p.OD}${unit}`);
    lead(cx + R - sx((g('tdes') || g('tnom')) / 2), cy + R * 0.55, cx + R + 34, cy + R * 0.75,
      `t=${p.tdes || p.tnom}${unit}`);
  } else if (isBox) {
    const bw = sx(g('B')), bh = sx(g('Ht'));
    hDim(cy - bh / 2 - 22, cx - bw / 2, cx + bw / 2, `B=${p.B}${unit}`);
    vDim(cx - bw / 2 - 16, cy - bh / 2, cy + bh / 2, `Ht=${p.Ht}${unit}`);
    lead(cx + bw / 2 - sx((g('tdes') || g('tnom')) / 2), cy, cx + bw / 2 + 30, cy - 14,
      `t=${p.tdes || p.tnom}${unit}`);
  } else if (isAng) {
    const lw = sx(g('b')), lh = sx(g('d')), tw = t === '2L' ? lw * 2 : lw;
    hDim(cy - lh / 2 - 22, cx - tw / 2, cx + tw / 2, `b=${p.b}${unit}`);
    vDim(cx - tw / 2 - 16, cy - lh / 2, cy + lh / 2, `d=${p.d}${unit}`);
    lead(cx - tw / 2 + sx(g('t') / 2), cy - lh / 4, cx - tw / 2 - 30, cy + lh / 4, `t=${p.t}${unit}`, 'end');
  } else {
    const bw = sx(g('bf')), bh = sx(g('d')), tw = sx(g('tw')), tf = sx(g('tf'));
    hDim(cy - bh / 2 - 22, cx - bw / 2, cx + bw / 2, `bf=${p.bf}${unit}`);
    vDim(cx - bw / 2 - 18, cy - bh / 2, cy + bh / 2, `d=${p.d}${unit}`);
    lead(cx, cy, cx + bw / 2 + 24, cy + 6, `tw=${p.tw}${unit}`);
    lead(cx + bw / 4, cy - bh / 2 + tf / 2, cx + bw / 2 + 24, cy - bh / 2 - 4, `tf=${p.tf}${unit}`);
    if (p.T && !isTee) vDim(cx + bw / 2 + 70, cy - sx(g('T')) / 2, cy + sx(g('T')) / 2, `T=${p.T}${unit}`);
    if (p.k1) lead(cx + tw / 2 + sx(g('k1')) - sx(g('tw') / 2), cy - bh / 2 + tf + 3,
      cx - bw / 2 - 26, cy - bh / 2 + tf + 22, `k1=${p.k1}${unit}`, 'end');
  }

  return `<svg viewBox="0 0 ${W} ${H}" class="section-svg" role="img"
    aria-label="${s.name} cross section in ${unit}">${body}${dim.join('')}</svg>`;
}

/** Simple circular bar (Rebar): diameter dimension line only. */
export function drawBarSVG(diaValue, unit) {
  const W = 460, H = 330, cx = W / 2, cy = H / 2;
  const R = 90;
  const fill = 'var(--steel-fill)', stroke = 'var(--steel-line)';
  const body = `<circle cx="${cx}" cy="${cy}" r="${R}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`;
  const dim = `<line class="dl" x1="${cx - R}" y1="${cy - R - 22}" x2="${cx + R}" y2="${cy - R - 22}"/>
    <line class="tick" x1="${cx - R}" y1="${cy - R - 26}" x2="${cx - R}" y2="${cy - R - 18}"/>
    <line class="tick" x1="${cx + R}" y1="${cy - R - 26}" x2="${cx + R}" y2="${cy - R - 18}"/>
    <text class="dt" x="${cx}" y="${cy - R - 30}" text-anchor="middle">D=${diaValue}${unit}</text>`;
  return `<svg viewBox="0 0 ${W} ${H}" class="section-svg" role="img"
    aria-label="rebar cross section in ${unit}">${body}${dim}</svg>`;
}
