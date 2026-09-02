import { useEffect, useMemo, useState } from 'react';
import { manualHProps, manualTProps, composeSection, hPlates, tPlates, mirrorPlates, IN_TO_MM, IN2_TO_MM2, IN3_TO_MM3, IN4_TO_MM4, LBFT_TO_KGM } from './compose.js';
import { displayType } from '../../store.js';
import { loadType } from '../../lib/dataLoader.js';
import { drawHBotTopTSVG } from '../../lib/sectionSvg.js';
import BHDimTable from './BHDimTable.jsx';
import ShapeAutocomplete from './ShapeAutocomplete.jsx';
import NumUnit from '../NumUnit.jsx';
import BuiltupExtras from './BuiltupExtras.jsx';

const MM_TO_IN = 1 / 25.4;
const H_TYPES = ['W', 'M', 'S', 'KSH'];
const T_TYPES = ['WT', 'MT', 'ST', 'KST'];

// Representative default pair shown on first load so the panel isn't empty
// before the user has searched for anything (W18X50 + its cut-T WT9X25).
const DEFAULT_H_NAME = 'W18X50';
const DEFAULT_T_NAME = 'WT9X25';

const H_FIELDS = [
  { key: 'd', label: 'D (높이)' },
  { key: 'bf', label: 'Bf (폭)' },
  { key: 'tw', label: 'Tw (두께)', thickness: true },
  { key: 'tf', label: 'Tf (두께)', thickness: true },
];
const T_FIELDS = [
  { key: 'd', label: 'T D (높이)' },
  { key: 'bf', label: 'T Bf (폭)' },
  { key: 'tw', label: 'T Tw (두께)', thickness: true },
  { key: 'tf', label: 'T Tf (두께)', thickness: true },
];

/** Section properties for a T pulled straight from the database. AISC WT/MT/ST
 * rows carry real Ix/Iy/y (distance from flange face to centroid); KST rows
 * only carry W/A, so its geometry (and therefore Ix/Iy/centroid) is derived
 * from d/bf/tw/tf via the same formula used for the fully-custom T-bar - the
 * real tabulated W/A are kept over the formula's estimate either way. */
/** `overrideDIn`, when given, is a field-trimmed stem height (in) that
 * replaces the catalog `d` — since trimming the stem changes the cross-
 * section, the tabulated A/Ix/Iy/W no longer apply and are recomputed
 * geometrically via manualTProps instead (same formula already used for
 * fully-custom T-bars below). Fillet radius is untouched: trimming happens
 * at the free tip of the stem, not at the flange-web root. */
function tPropsFromDbShape(t, overrideDIn) {
  const dCat = parseFloat(t.us.d), bf = parseFloat(t.us.bf), tw = parseFloat(t.us.tw), tf = parseFloat(t.us.tf);
  const A = parseFloat(t.us.A), W = parseFloat(t.us.W);
  const d = overrideDIn != null ? overrideDIn : dCat;
  if (overrideDIn == null && t.us.Ix !== undefined && t.us.y !== undefined) {
    const y = parseFloat(t.us.y);
    const yTopExtent = y, yBotExtent = d - y;
    // Ix/Iy are the catalog's real tabulated values, but the plate geometry
    // (and therefore Zx/Zy/J, which depend on shape, not on Ix/Iy) is exact
    // either way since d/bf/tw/tf are the real dimensions regardless of
    // where Ix/Iy came from.
    const Zy = (bf ** 2 * tf) / 4 + (tw ** 2 * (d - tf)) / 4;
    const J = (bf * tf ** 3 + (d - tf) * tw ** 3) / 3;
    return {
      A, Ix: parseFloat(t.us.Ix), Iy: parseFloat(t.us.Iy), W, d, bf, tw, tf, yTopExtent, yBotExtent,
      Zy, J, plates: tPlates({ bf, tw, tf, yTopExtent, yBotExtent }),
    };
  }
  const geo = manualTProps({ d, bf, tw, tf });
  return { ...geo, A: overrideDIn == null ? (A || geo.A) : geo.A, W: overrideDIn == null ? (W || geo.W) : geo.W, d, bf, tw, tf };
}

/** Compact IN/MM-synced pair for the T-bar height override, sized to sit
 * inline next to the shape search box (unlike BHDimTable's full card, which
 * is too wide to fit alongside the Type select + search combo on one row). */
function HeightOverrideMini({ mm, onChange, placeholderMm }) {
  const inVal = mm != null ? mm * MM_TO_IN : '';
  const onTypeIn = (e) => {
    const raw = e.target.value;
    if (raw === '') { onChange(null); return; }
    const x = parseFloat(raw);
    if (Number.isFinite(x) && x > 0) onChange(x * IN_TO_MM);
  };
  const onTypeMm = (e) => {
    const raw = e.target.value;
    if (raw === '') { onChange(null); return; }
    const x = parseFloat(raw);
    if (Number.isFinite(x) && x > 0) onChange(x);
  };
  return (
    <span className="t-height-mini">
      <span className="unit-input">
        <input
          type="number" step={0.1} placeholder={placeholderMm ? (placeholderMm * MM_TO_IN).toFixed(1) : ''}
          value={inVal === '' ? '' : +inVal.toFixed(1)} onChange={onTypeIn}
        />
        <span className="unit-suffix">in</span>
      </span>
      <span className="unit-input">
        <input
          type="number" step={1} placeholder={placeholderMm ? placeholderMm.toFixed(0) : ''}
          value={mm == null ? '' : +mm.toFixed(1)} onChange={onTypeMm}
        />
        <span className="unit-suffix">mm</span>
      </span>
    </span>
  );
}

/** Rolled-shape flange/web fillet radius for the cross-section drawing. KSH
 * rows publish `r` directly; AISC W/M/S/WT/MT/ST rows don't, but their `kdes`
 * (flange-face-to-web-toe design distance) already includes tf, so r ≈
 * kdes - tf is the standard approximation. Returns 0 (sharp corner) when
 * neither is available (KST, and every built-up/custom plate — which is
 * physically correct since welded plates have no rolled fillet). */
function filletR(rec) {
  if (!rec) return 0;
  if (rec.r !== undefined) return parseFloat(rec.r) || 0;
  if (rec.kdes !== undefined && rec.tf !== undefined) {
    const v = parseFloat(rec.kdes) - parseFloat(rec.tf);
    return v > 0 ? v : 0;
  }
  return 0;
}

/** BH modes 3 & 4: T-bar(s) welded onto an H-shape's flange(s), both laid out
 * as 상부(optional, top flange) / 중앙부(required H) / 하부(required, bottom
 * flange). baseKind 'db' (BH-3) picks real AISC/KS shapes via search;
 * 'custom' (BH-4) uses free-input plate dimensions for all three pieces. */
export default function HPlusTPanel({ baseKind }) {
  const [hType, setHType] = useState('W');
  const [hShape, setHShape] = useState(null);
  const [hGen, setHGen] = useState(0);
  const [botType, setBotType] = useState('WT');
  const [botShape, setBotShape] = useState(null);
  const [botGen, setBotGen] = useState(0);
  const [topType, setTopType] = useState('WT');
  const [topShape, setTopShape] = useState(null);
  const [topGen, setTopGen] = useState(0);

  const [customH, setCustomH] = useState({ d: 400, bf: 200, tw: 7.9375, tf: 12.7 });
  const [botBar, setBotBar] = useState({ d: 150, bf: 150, tw: 7.9375, tf: 12.7 });
  const [topBar, setTopBar] = useState({ d: 150, bf: 150, tw: 7.9375, tf: 12.7 });
  const [topBarEnabled, setTopBarEnabled] = useState(false);
  const [botBarEnabled, setBotBarEnabled] = useState(true);

  // Rolled T-bars (baseKind 'db') are field-trimmed from a catalog stem
  // height, so let the user override it — null means "use the catalog value".
  const [botHeightOverrideMm, setBotHeightOverrideMm] = useState(null);
  const [topHeightOverrideMm, setTopHeightOverrideMm] = useState(null);

  const setCustomField = (field) => (v) => setCustomH((m) => ({ ...m, [field]: v }));
  const setBotBarField = (field) => (v) => setBotBar((m) => ({ ...m, [field]: v }));
  const setTopBarField = (field) => (v) => setTopBar((m) => ({ ...m, [field]: v }));

  const onHTypeChange = (t) => { setHType(t); setHShape(null); };
  const onBotTypeChange = (t) => { setBotType(t); setBotShape(null); };
  const onTopTypeChange = (t) => { setTopType(t); setTopShape(null); };

  // Delete buttons next to each selected shape: clear the selection and force
  // the search box to remount (via the gen key) so its displayed text resets.
  const clearHShape = () => { setHShape(null); setHGen((g) => g + 1); };
  const clearBotShape = () => { setBotShape(null); setBotGen((g) => g + 1); setBotHeightOverrideMm(null); };
  const clearTopShape = () => { setTopShape(null); setTopGen((g) => g + 1); setTopHeightOverrideMm(null); };

  const onBotShapeSelect = (s) => { setBotShape(s); setBotHeightOverrideMm(null); };
  const onTopShapeSelect = (s) => { setTopShape(s); setTopHeightOverrideMm(null); };

  // Pre-select a representative H+bottom-T pair on first load (baseKind='db')
  // so the panel shows a real section immediately instead of an empty state.
  useEffect(() => {
    if (baseKind !== 'db') return;
    let cancelled = false;
    Promise.all([loadType('W'), loadType('WT')]).then(([hRows, tRows]) => {
      if (cancelled) return;
      const h = hRows.find((s) => s.name === DEFAULT_H_NAME);
      const bot = tRows.find((s) => s.name === DEFAULT_T_NAME);
      if (h) setHShape((cur) => cur ?? h);
      if (bot) setBotShape((cur) => cur ?? bot);
    });
    return () => { cancelled = true; };
  }, [baseKind]);

  // --- H (중앙부), required in both baseKinds ---------------------------
  const hDimsIn = useMemo(() => {
    if (baseKind === 'db') {
      if (!hShape) return null;
      return {
        d: parseFloat(hShape.us.d), bf: parseFloat(hShape.us.bf ?? hShape.us.B),
        tw: parseFloat(hShape.us.tw), tf: parseFloat(hShape.us.tf), r: filletR(hShape.us),
      };
    }
    return { d: customH.d * MM_TO_IN, bf: customH.bf * MM_TO_IN, tw: customH.tw * MM_TO_IN, tf: customH.tf * MM_TO_IN, r: 0 };
  }, [baseKind, hShape, customH]);

  const hDimsMm = useMemo(() => {
    if (baseKind === 'db') {
      if (!hShape) return null;
      return {
        d: parseFloat(hShape.mt.d), bf: parseFloat(hShape.mt.bf ?? hShape.mt.B),
        tw: parseFloat(hShape.mt.tw), tf: parseFloat(hShape.mt.tf), r: filletR(hShape.mt),
      };
    }
    return { ...customH, r: 0 };
  }, [baseKind, hShape, customH]);

  const hPropsIn = useMemo(() => {
    if (!hDimsIn) return null;
    if (baseKind === 'db') {
      const { d, bf, tw, tf } = hDimsIn;
      // Real catalog Ix/Iy, but Zy/J/plates only depend on d/bf/tw/tf (exact
      // regardless of source) - same reasoning as the T-bar catalog branch.
      const Zy = (bf ** 2 * tf) / 2 + (tw ** 2 * (d - 2 * tf)) / 4;
      const J = (2 * bf * tf ** 3 + (d - 2 * tf) * tw ** 3) / 3;
      return {
        A: parseFloat(hShape.us.A), Ix: parseFloat(hShape.us.Ix), Iy: parseFloat(hShape.us.Iy),
        W: parseFloat(hShape.us.W), d, bf, tw, tf, Zy, J, plates: hPlates({ d, bf, tw, tf }),
      };
    }
    return manualHProps(hDimsIn);
  }, [hDimsIn, baseKind, hShape]);

  // --- 하부 (db: optional via search selection, custom: optional via checkbox) --
  const botPropsIn = useMemo(() => {
    if (baseKind === 'db') return botShape ? tPropsFromDbShape(botShape, botHeightOverrideMm != null ? botHeightOverrideMm * MM_TO_IN : null) : null;
    if (!botBarEnabled) return null;
    const dims = { d: botBar.d * MM_TO_IN, bf: botBar.bf * MM_TO_IN, tw: botBar.tw * MM_TO_IN, tf: botBar.tf * MM_TO_IN };
    const valid = dims.d > dims.tf && dims.bf > dims.tw && dims.d > 0 && dims.bf > 0 && dims.tw > 0 && dims.tf > 0;
    return valid ? manualTProps(dims) : null;
  }, [baseKind, botShape, botBar, botBarEnabled, botHeightOverrideMm]);

  const botDimsIn = botPropsIn
    ? { d: botPropsIn.d, bf: botPropsIn.bf, tw: botPropsIn.tw, tf: botPropsIn.tf, r: baseKind === 'db' ? filletR(botShape.us) : 0 }
    : null;
  const botDimsMm = baseKind === 'db'
    ? (botShape ? { d: botHeightOverrideMm ?? parseFloat(botShape.mt.d), bf: parseFloat(botShape.mt.bf), tw: parseFloat(botShape.mt.tw), tf: parseFloat(botShape.mt.tf), r: filletR(botShape.mt) } : null)
    : (botPropsIn ? { ...botBar, r: 0 } : null);

  // --- 상부 (optional) -----------------------------------------------------
  const topActive = baseKind === 'db' ? !!topShape : topBarEnabled;
  const topPropsIn = useMemo(() => {
    if (!topActive) return null;
    if (baseKind === 'db') return topShape ? tPropsFromDbShape(topShape, topHeightOverrideMm != null ? topHeightOverrideMm * MM_TO_IN : null) : null;
    const dims = { d: topBar.d * MM_TO_IN, bf: topBar.bf * MM_TO_IN, tw: topBar.tw * MM_TO_IN, tf: topBar.tf * MM_TO_IN };
    const valid = dims.d > dims.tf && dims.bf > dims.tw && dims.d > 0 && dims.bf > 0 && dims.tw > 0 && dims.tf > 0;
    return valid ? manualTProps(dims) : null;
  }, [baseKind, topActive, topShape, topBar, topHeightOverrideMm]);

  const topDimsIn = topPropsIn
    ? { d: topPropsIn.d, bf: topPropsIn.bf, tw: topPropsIn.tw, tf: topPropsIn.tf, r: baseKind === 'db' ? filletR(topShape.us) : 0 }
    : null;
  const topDimsMm = baseKind === 'db'
    ? (topActive && topShape ? { d: topHeightOverrideMm ?? parseFloat(topShape.mt.d), bf: parseFloat(topShape.mt.bf), tw: parseFloat(topShape.mt.tw), tf: parseFloat(topShape.mt.tf), r: filletR(topShape.mt) } : null)
    : (topPropsIn ? { ...topBar, r: 0 } : null);

  // --- composite: any subset of 상부/중앙부/하부, stacked top-to-bottom -----
  // Pieces are placed by tracking the y-position of the next piece's top
  // surface (world-up positive), starting arbitrarily at 0 — a constant
  // shift of every yOffset doesn't change Ix/Sx/rx/ry/W (only the unused
  // absolute ybar), so this reduces to the exact same relative spacing as
  // the old H-anchored-at-0 formula when all three (or H+하부) are present.
  const composite = useMemo(() => {
    const layers = [];
    let cursor = 0;
    if (topPropsIn) {
      // natural orientation (flange up): top surface = flange face (yTopExtent away).
      const centroidY = cursor - topPropsIn.yTopExtent;
      layers.push({ yOffset: centroidY, props: topPropsIn });
      cursor = centroidY - topPropsIn.yBotExtent;
    }
    if (hPropsIn) {
      const half = hPropsIn.d / 2;
      const centroidY = cursor - half;
      layers.push({ yOffset: centroidY, props: hPropsIn });
      cursor = centroidY - half;
    }
    if (botPropsIn) {
      // mirrored orientation (flange down): top surface = stem tip (natural yBotExtent away).
      const centroidY = cursor - botPropsIn.yBotExtent;
      layers.push({
        yOffset: centroidY,
        props: {
          ...botPropsIn, yTopExtent: botPropsIn.yBotExtent, yBotExtent: botPropsIn.yTopExtent,
          plates: botPropsIn.plates ? mirrorPlates(botPropsIn.plates) : undefined,
        },
      });
      cursor = centroidY - botPropsIn.yTopExtent;
    }
    return layers.length ? composeSection(layers) : null;
  }, [hPropsIn, botPropsIn, topPropsIn]);

  const svgUs = hDimsIn || botDimsIn || topDimsIn ? drawHBotTopTSVG(hDimsIn, botDimsIn, topDimsIn, '"') : null;
  const svgMm = hDimsMm || botDimsMm || topDimsMm ? drawHBotTopTSVG(hDimsMm, botDimsMm, topDimsMm, 'mm') : null;

  // Cut list / weld lines: a rolled H or a catalog T-bar (baseKind 'db') is
  // mill stock, not something a shop cuts flat plate for, so only a custom
  // (baseKind 'custom') H or T-bar contributes cut-list plates and its own
  // flange-web weld. A T-bar welded onto an H's flange always adds 2 weld
  // lines (both edges of the stem) regardless of where the T-bar itself
  // came from - that joint is always field/shop-welded here either way.
  const cutlistPlates = [];
  let weldLines = 0;
  if (baseKind === 'custom' && hDimsMm) {
    cutlistPlates.push(
      { name: '중앙부 H 상부 플랜지', widthMm: hDimsMm.bf, thicknessMm: hDimsMm.tf },
      { name: '중앙부 H 웨브', widthMm: hDimsMm.d - 2 * hDimsMm.tf, thicknessMm: hDimsMm.tw },
      { name: '중앙부 H 하부 플랜지', widthMm: hDimsMm.bf, thicknessMm: hDimsMm.tf },
    );
    weldLines += 4;
  }
  if (topActive && topDimsMm) {
    if (baseKind === 'custom') {
      cutlistPlates.push(
        { name: '상부 T-BAR 플랜지', widthMm: topDimsMm.bf, thicknessMm: topDimsMm.tf },
        { name: '상부 T-BAR 스템', widthMm: topDimsMm.d - topDimsMm.tf, thicknessMm: topDimsMm.tw },
      );
    }
    weldLines += 2; // stem-to-flange joint, both sides
  }
  if (botPropsIn && botDimsMm) {
    if (baseKind === 'custom') {
      cutlistPlates.push(
        { name: '하부 T-BAR 플랜지', widthMm: botDimsMm.bf, thicknessMm: botDimsMm.tf },
        { name: '하부 T-BAR 스템', widthMm: botDimsMm.d - botDimsMm.tf, thicknessMm: botDimsMm.tw },
      );
    }
    weldLines += 2;
  }

  const title = baseKind === 'db' ? 'Rolled H-Section + T-Bar' : 'Built-up H-Shape + T-Bar';
  const emptyNote = '상부·중앙부·하부 중 하나 이상을 선택하면 단면도가 표시됩니다.';

  return (
    <>
      <div className="detail-head"><div><h1 className="mono">{title}</h1></div></div>

      {baseKind === 'db' ? (
        <div className="rolled-row">
          <div className="panel panel-combo">
            <div className="panel-head"><h2>상부 · 중앙부 · 하부 형강 선택</h2></div>
            <div className="field-row">
              <label className="t-type-col"><span className="field-label">T Type (상부, 선택)</span>
                <select value={topType} onChange={(e) => onTopTypeChange(e.target.value)}>
                  {T_TYPES.map((t) => <option key={t} value={t}>{displayType(t)}</option>)}
                </select>
              </label>
              <label className="t-search-col"><span className="field-label">상부 T-BAR (검색)</span>
                <div className="combo-with-delete">
                  <ShapeAutocomplete key={`${topType}-${topGen}`} type={topType} onSelect={onTopShapeSelect} initialName={topShape?.name} placeholder={`${topType} 검색… (선택 안 해도 됨)`} />
                  {topShape && <button type="button" className="combo-delete" title="상부 T-BAR 삭제" onClick={clearTopShape}>×</button>}
                </div>
              </label>
              {topShape && (
                <label className="t-height-col"><span className="field-label">T 높이 (선택)</span>
                  <HeightOverrideMini mm={topHeightOverrideMm} onChange={setTopHeightOverrideMm} placeholderMm={parseFloat(topShape.mt.d)} />
                </label>
              )}
            </div>
            <div className="field-row">
              <label className="t-type-col"><span className="field-label">H Type (중앙부, 선택)</span>
                <select value={hType} onChange={(e) => onHTypeChange(e.target.value)}>
                  {H_TYPES.map((t) => <option key={t} value={t}>{displayType(t)}</option>)}
                </select>
              </label>
              <label className="t-search-col"><span className="field-label">중앙부 H-SHAPE (검색)</span>
                <div className="combo-with-delete">
                  <ShapeAutocomplete key={`${hType}-${hGen}`} type={hType} onSelect={setHShape} initialName={hShape?.name} placeholder={`${hType} 형강 검색… (선택 안 해도 됨)`} />
                  {hShape && <button type="button" className="combo-delete" title="중앙부 H-SHAPE 삭제" onClick={clearHShape}>×</button>}
                </div>
              </label>
            </div>
            <div className="field-row">
              <label className="t-type-col"><span className="field-label">T Type (하부, 선택)</span>
                <select value={botType} onChange={(e) => onBotTypeChange(e.target.value)}>
                  {T_TYPES.map((t) => <option key={t} value={t}>{displayType(t)}</option>)}
                </select>
              </label>
              <label className="t-search-col"><span className="field-label">하부 T-BAR (검색)</span>
                <div className="combo-with-delete">
                  <ShapeAutocomplete key={`${botType}-${botGen}`} type={botType} onSelect={onBotShapeSelect} initialName={botShape?.name} placeholder={`${botType} 검색… (선택 안 해도 됨)`} />
                  {botShape && <button type="button" className="combo-delete" title="하부 T-BAR 삭제" onClick={clearBotShape}>×</button>}
                </div>
              </label>
              {botShape && (
                <label className="t-height-col"><span className="field-label">T 높이 (선택)</span>
                  <HeightOverrideMini mm={botHeightOverrideMm} onChange={setBotHeightOverrideMm} placeholderMm={parseFloat(botShape.mt.d)} />
                </label>
              )}
            </div>
            <p className="note">
              상부·중앙부·하부 모두 선택하지 않아도 됩니다 — 선택한 부재만으로 합성 단면을 계산합니다 (하나 이상 필요).
              하부 T-BAR는 위쪽 부재의 하부 플랜지(또는 바로 위 부재)에, 상부 T-BAR는 아래쪽 부재의 상부 플랜지(또는 바로 아래 부재)에 스템을 맞대어 용접되는 것으로 가정합니다.
              T 높이를 직접입력하면(현장 절단 등으로 스템이 카탈로그값과 다른 경우) 필렛(R)은 그대로 유지되고 단면적·관성모멘트는 절단된 형상 그대로 재계산됩니다.
            </p>
          </div>

          <figure className="panel draw">
            <figcaption className="draw-cap">Imperial<span>inch</span></figcaption>
            {svgUs ? (
              <>
                <div dangerouslySetInnerHTML={{ __html: svgUs }} />
                {composite && (
                  <div className="weight">
                    <span className="wv mono">{composite.W.toFixed(1)}</span><span className="wu">lb/ft</span>
                    <span className="wv mono" style={{ marginLeft: 14 }}>{composite.A.toFixed(2)}</span><span className="wu">in²</span>
                  </div>
                )}
              </>
            ) : <p className="note">{emptyNote}</p>}
          </figure>
          <figure className="panel draw">
            <figcaption className="draw-cap">Metric<span>mm</span></figcaption>
            {svgMm ? (
              <>
                <div dangerouslySetInnerHTML={{ __html: svgMm }} />
                {composite && (
                  <div className="weight val-conv">
                    <span className="wv mono">{(composite.W * LBFT_TO_KGM).toFixed(1)}</span><span className="wu">kg/m</span>
                    <span className="wv mono" style={{ marginLeft: 14 }}>{(composite.A * IN2_TO_MM2).toFixed(0)}</span><span className="wu">mm²</span>
                  </div>
                )}
              </>
            ) : <p className="note">{emptyNote}</p>}
          </figure>
        </div>
      ) : (
        <>
          <div className="panel panel-combo">
            <div className="panel-head"><h2>상부 · 중앙부 · 하부 플레이트 입력</h2></div>

            <div className="field-row" style={{ alignItems: 'center' }}>
              <label style={{ flex: 'none' }}>
                <input type="checkbox" checked={topBarEnabled} onChange={(e) => setTopBarEnabled(e.target.checked)} style={{ marginRight: 8 }} />
                상부 T-BAR 포함 (선택)
              </label>
              <label style={{ flex: 'none' }}>
                <input type="checkbox" checked={botBarEnabled} onChange={(e) => setBotBarEnabled(e.target.checked)} style={{ marginRight: 8 }} />
                하부 T-BAR 포함 (선택)
              </label>
            </div>

            <div className="bh-dim-group">
              {topBarEnabled && (
                <div className="bh-dim-piece">
                  <div className="bh-dim-piece-title">상부 T-BAR</div>
                  <BHDimTable fields={T_FIELDS} mm={topBar} onChangeMm={setTopBarField} />
                </div>
              )}
              <div className="bh-dim-piece">
                <div className="bh-dim-piece-title">중앙부 H-SHAPE</div>
                <BHDimTable fields={H_FIELDS} mm={customH} onChangeMm={setCustomField} />
              </div>
              {botBarEnabled && (
                <div className="bh-dim-piece">
                  <div className="bh-dim-piece-title">하부 T-BAR</div>
                  <BHDimTable fields={T_FIELDS} mm={botBar} onChangeMm={setBotBarField} />
                </div>
              )}
            </div>

            <p className="note">
              상부·하부는 선택하지 않아도 됩니다 — 선택한 조합(중앙부 H는 항상 포함)만으로 합성 단면을 계산합니다.
              하부 플레이트는 H의 하부 플랜지에, 상부 플레이트는 H의 상부 플랜지에 스템을 맞대어 용접하는 것으로 가정합니다 (자유 입력이므로 필렛 없음).
            </p>
          </div>

          <div className="draw-grid">
            <figure className="panel draw">
              <figcaption className="draw-cap">Imperial<span>inch</span></figcaption>
              {svgUs ? (
                <>
                  <div dangerouslySetInnerHTML={{ __html: svgUs }} />
                  {composite && (
                    <div className="weight">
                      <span className="wv mono">{composite.W.toFixed(1)}</span><span className="wu">lb/ft</span>
                      <span className="wv mono" style={{ marginLeft: 14 }}>{composite.A.toFixed(2)}</span><span className="wu">in²</span>
                    </div>
                  )}
                </>
              ) : <p className="note">{emptyNote}</p>}
            </figure>
            <figure className="panel draw">
              <figcaption className="draw-cap">Metric<span>mm</span></figcaption>
              {svgMm ? (
                <>
                  <div dangerouslySetInnerHTML={{ __html: svgMm }} />
                  {composite && (
                    <div className="weight">
                      <span className="wv mono">{(composite.W * LBFT_TO_KGM).toFixed(1)}</span><span className="wu">kg/m</span>
                      <span className="wv mono" style={{ marginLeft: 14 }}>{(composite.A * IN2_TO_MM2).toFixed(0)}</span><span className="wu">mm²</span>
                    </div>
                  )}
                </>
              ) : <p className="note">{emptyNote}</p>}
            </figure>
          </div>
        </>
      )}

      {composite && (
        <div className="panel">
          <div className="panel-head"><h2>합성 단면성능 (계산값)</h2></div>
          <table className="props">
            <thead><tr><th>Symbol</th><th className="r">Imperial</th><th className="r">Metric</th><th>Description</th></tr></thead>
            <tbody>
              <tr><td className="sym mono">A</td><td className="r mono"><NumUnit value={composite.A.toFixed(2)} unit="in²" /></td><td className="r mono val-conv">{(composite.A * IN2_TO_MM2).toFixed(0)} <em>mm²</em></td><td className="desc">단면적</td></tr>
              <tr><td className="sym mono">Ix</td><td className="r mono"><NumUnit value={composite.Ix.toFixed(1)} unit="in⁴" /></td><td className="r mono val-conv">{(composite.Ix * IN4_TO_MM4 / 1e6).toFixed(1)} <em>×10⁶ mm⁴</em></td><td className="desc">x축 관성모멘트 (합성 도심 기준)</td></tr>
              <tr><td className="sym mono">Iy</td><td className="r mono"><NumUnit value={composite.Iy.toFixed(1)} unit="in⁴" /></td><td className="r mono val-conv">{(composite.Iy * IN4_TO_MM4 / 1e6).toFixed(1)} <em>×10⁶ mm⁴</em></td><td className="desc">y축 관성모멘트</td></tr>
              <tr><td className="sym mono">rx</td><td className="r mono"><NumUnit value={composite.rx.toFixed(2)} unit="in" /></td><td className="r mono val-conv">{(composite.rx * IN_TO_MM).toFixed(0)} <em>mm</em></td><td className="desc">x축 회전반경</td></tr>
              <tr><td className="sym mono">ry</td><td className="r mono"><NumUnit value={composite.ry.toFixed(2)} unit="in" /></td><td className="r mono val-conv">{(composite.ry * IN_TO_MM).toFixed(0)} <em>mm</em></td><td className="desc">y축 회전반경</td></tr>
              {composite.Sx_top && <tr><td className="sym mono">Sx(top)</td><td className="r mono"><NumUnit value={composite.Sx_top.toFixed(1)} unit="in³" /></td><td className="r mono val-conv">{(composite.Sx_top * IN4_TO_MM4 / IN_TO_MM / 1e3).toFixed(1)} <em>×10³ mm³</em></td><td className="desc">상연 단면계수</td></tr>}
              {composite.Sx_bot && <tr><td className="sym mono">Sx(bot)</td><td className="r mono"><NumUnit value={composite.Sx_bot.toFixed(1)} unit="in³" /></td><td className="r mono val-conv">{(composite.Sx_bot * IN4_TO_MM4 / IN_TO_MM / 1e3).toFixed(1)} <em>×10³ mm³</em></td><td className="desc">하연 단면계수</td></tr>}
              {composite.Zx != null && <tr><td className="sym mono">Zx</td><td className="r mono"><NumUnit value={composite.Zx.toFixed(2)} unit="in³" /></td><td className="r mono val-conv">{(composite.Zx * IN3_TO_MM3 / 1e3).toFixed(1)} <em>×10³ mm³</em></td><td className="desc">x축 소성단면계수 (근사)</td></tr>}
              {composite.Zy != null && <tr><td className="sym mono">Zy</td><td className="r mono"><NumUnit value={composite.Zy.toFixed(2)} unit="in³" /></td><td className="r mono val-conv">{(composite.Zy * IN3_TO_MM3 / 1e3).toFixed(1)} <em>×10³ mm³</em></td><td className="desc">y축 소성단면계수 (근사)</td></tr>}
              {composite.J != null && <tr><td className="sym mono">J</td><td className="r mono"><NumUnit value={composite.J.toFixed(3)} unit="in⁴" /></td><td className="r mono val-conv">{(composite.J * IN4_TO_MM4 / 1e3).toFixed(1)} <em>×10³ mm⁴</em></td><td className="desc">비틀림상수 (근사, 필릿 무시)</td></tr>}
              <tr><td className="sym mono">W</td><td className="r mono"><NumUnit value={composite.W.toFixed(1)} unit="lb/ft" /></td><td className="r mono val-conv">{(composite.W * LBFT_TO_KGM).toFixed(1)} <em>kg/m</em></td><td className="desc">단위중량</td></tr>
            </tbody>
          </table>
          <p className="note">단위: Imperial은 실측/계산 기준값, <span className="val-conv" style={{ display: 'inline' }}>Metric(흐리게 표시)</span>은 이 앱이 단위 환산한 값입니다. Zx/Zy/J는 복합단면 전체에 대한 근사 계산이며(Cw/rts는 단순 I단면이 아니므로 제공하지 않음) 실제 설계 검토를 대체하지 않습니다.</p>
          {baseKind === 'db' ? (
            <p className="note">✓ H·T-BAR 모두 AISC/KS 카탈로그의 실측 단면성능(A·Ix·Iy·W)을 그대로 사용하므로 필렛(R)이 계산에 포함되어 있습니다 (KST만 예외 — 도표에 Ix/Iy가 없어 사각형 근사; A·W는 실측값 유지). 단면도의 필렛도 각 형강의 실제 R(=r 또는 kdes−tf)로 그려집니다. T-BAR는 H의 플랜지 외측면에 스템을 맞대어 용접하는 것으로 가정합니다.</p>
          ) : (
            <p className="note">⚠ 계산값입니다 (필렛·용접부 미고려 — 자유 입력 용접 플레이트이므로 실제로도 필렛이 없습니다). T-BAR는 H의 플랜지 외측면에 스템을 맞대어 용접하는 것으로 가정합니다.</p>
          )}
          <p className="note">A572 GR50/A36 표기는 두께에 따른 일반적 유통 규격 안내이며, 실제 조달 가능 여부는 제작사에 확인하시기 바랍니다.</p>
        </div>
      )}

      {composite && weldLines > 0 && (
        <BuiltupExtras
          plates={cutlistPlates}
          weldLines={weldLines}
          bomItem={{ name: title, type: baseKind === 'db' ? 'BH-3' : 'BH-4', unitWeightKgM: composite.W * LBFT_TO_KGM }}
        />
      )}
    </>
  );
}
