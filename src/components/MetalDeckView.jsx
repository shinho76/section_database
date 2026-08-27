import { useEffect, useState } from 'react';
import { drawDeckProfileSVG } from '../lib/sectionSvg.js';

const IN_TO_MM = 25.4;
function toMmProfile(p) {
  return {
    depthIn: p.depthIn * IN_TO_MM, pitchIn: p.pitchIn * IN_TO_MM,
    crestIn: p.crestIn * IN_TO_MM, valleyIn: p.valleyIn * IN_TO_MM, widthIn: p.widthIn * IN_TO_MM,
  };
}

const SECTIONS = [
  { key: 'section', label: '단면성능' },
  { key: 'reinforcing', label: '철근/철섬유' },
];

const PSF_TO_KGM2 = 4.88243;
const FRAC = { '¼': 0.25, '½': 0.5, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };

function inToMm(s) {
  if (s == null) return null;
  const str = String(s).trim();
  const fracChar = [...str].find((c) => FRAC[c]);
  const whole = parseFloat(str) || 0;
  const val = whole + (fracChar ? FRAC[fracChar] : 0);
  return val * 25.4;
}

function SectionPropsTable({ rows }) {
  return (
    <table className="list">
      <thead>
        <tr>
          <th className="r">Gage</th><th className="r">Weight (psf)</th><th className="r">Weight (kg/m²)<span className="conv-flag">conv.</span></th>
          <th className="r">t (in)</th><th className="r">t (mm)<span className="conv-flag">conv.</span></th>
          <th className="r">Fy (ksi)</th><th className="r">Ie+ (in⁴/ft)</th><th className="r">Ie- (in⁴/ft)</th>
          <th className="r">Se+ (in³/ft)</th><th className="r">Se- (in³/ft)</th>
          <th className="r">φMn+ (lb-ft/ft)</th><th className="r">φMn- (lb-ft/ft)</th><th className="r">φVn (lb/ft)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.gauge}>
            <td className="r mono strong">{r.gauge}</td>
            <td className="r mono">{r.weightPsf}</td>
            <td className="r mono val-conv">{(r.weightPsf * PSF_TO_KGM2).toFixed(1)}</td>
            <td className="r mono">{r.thicknessIn}</td>
            <td className="r mono val-conv">{(r.thicknessIn * 25.4).toFixed(2)}</td>
            <td className="r mono">{r.fyKsi}</td>
            <td className="r mono">{r.iePlus}</td>
            <td className="r mono">{r.ieMinus}</td>
            <td className="r mono">{r.sePlus}</td>
            <td className="r mono">{r.seMinus}</td>
            <td className="r mono">{r.phiMnPlusLbFtFt}</td>
            <td className="r mono">{r.phiMnMinusLbFtFt}</td>
            <td className="r mono">{r.phiVnLbFt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ReinforcingTable({ rows }) {
  return (
    <div className="panel">
      <div className="panel-head"><h2>Normal Weight Concrete — 온도·수축 철근</h2></div>
      <table className="list">
        <thead>
          <tr>
            <th className="r" colSpan={2}>Slab Depth</th><th className="r" colSpan={2}>Cover Depth</th>
            <th className="r" colSpan={2}>Concrete Vol.</th><th className="r" colSpan={2}>Min. As</th>
            <th>WWR</th><th className="r" colSpan={2}>4D Fiber</th>
          </tr>
          <tr>
            <th className="r">in</th><th className="r">mm<span className="conv-flag">conv.</span></th>
            <th className="r">in</th><th className="r">mm<span className="conv-flag">conv.</span></th>
            <th className="r">yd³/100ft²</th><th className="r">L/m²<span className="conv-flag">conv.</span></th>
            <th className="r">in²</th><th className="r">mm²<span className="conv-flag">conv.</span></th>
            <th></th>
            <th className="r">lb/yd³</th><th className="r">kg/m³<span className="conv-flag">conv.</span></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="r mono">{r.slabDepthIn}″</td><td className="r mono val-conv">{inToMm(r.slabDepthIn).toFixed(0)}</td>
              <td className="r mono">{r.coverDepthIn}″</td><td className="r mono val-conv">{inToMm(r.coverDepthIn).toFixed(0)}</td>
              <td className="r mono">{r.concreteVolumeYd3per100ft2}</td>
              <td className="r mono val-conv">{(r.concreteVolumeYd3per100ft2 * 82.3).toFixed(1)}</td>
              <td className="r mono">{r.minAsIn2}</td><td className="r mono val-conv">{(r.minAsIn2 * 645.16).toFixed(0)}</td>
              <td className="mono">{r.wwr}</td>
              <td className="r mono">{r.fiber4DLbYd3}</td><td className="r mono val-conv">{(r.fiber4DLbYd3 * 0.593276).toFixed(0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MetalDeckView() {
  const [data, setData] = useState(null);
  const [section, setSection] = useState('section');
  const [profileName, setProfileName] = useState('1.5VLI-36');

  useEffect(() => {
    import('../data/metaldeck.json').then((m) => setData(m.default));
  }, []);

  if (!data) return <div className="empty">불러오는 중…</div>;

  const profileNames = data.nominalDimensions.profiles.map((p) => p.name);
  const dims = data.nominalDimensions.profiles.find((p) => p.name === profileName);
  const dimsMm = toMmProfile(dims);
  // Each depth group (1.5/2/3in) shares one family of section+reinforcing data
  // across its 3 side-lap fastening variants (VL/VLJ, VLI, PLVLI).
  const f = data.families.find((fam) => fam.depthIn === dims.depthIn);
  const profile = f && f.profiles.find((p) => p.name.includes('VLI')) || f?.profiles[0];
  const hasSectionData = !!f;

  return (
    <>
      <div className="detail-head">
        <div>
          <h1 className="mono">METAL DECK — {profileName}</h1>
          <div className="alias">
            <span className="chip chip-ks">{dims.depthIn}in × {dims.widthIn}in</span>
            {hasSectionData && <span className="chip">{f.grade}</span>}
            {hasSectionData && <span className="chip">{profile.fastening}</span>}
          </div>
        </div>
      </div>

      <div className="deck-tabs">
        {profileNames.map((n) => (
          <span
            key={n}
            className={`deck-tab${profileName === n ? ' is-active' : ''}`}
            onClick={() => setProfileName(n)}
          >
            {n}
          </span>
        ))}
      </div>

      <div className="draw-grid">
        <figure className="panel draw">
          <figcaption className="draw-cap">Imperial<span>inch</span></figcaption>
          <div dangerouslySetInnerHTML={{ __html: drawDeckProfileSVG(dims, '"', dims) }} />
        </figure>
        <figure className="panel draw">
          <figcaption className="draw-cap">Metric<span>mm</span></figcaption>
          <div dangerouslySetInnerHTML={{ __html: drawDeckProfileSVG(dims, 'mm', dimsMm) }} />
        </figure>
      </div>

      {hasSectionData && (
        <>
          <div className="deck-tabs">
            {SECTIONS.map((s) => (
              <span
                key={s.key}
                className={`deck-tab${section === s.key ? ' is-active' : ''}`}
                onClick={() => setSection(s.key)}
              >
                {s.label}
              </span>
            ))}
          </div>

          {section === 'section' && (
            <div className="panel">
              <div className="panel-head"><h2>Section Properties (GR50)</h2></div>
              <SectionPropsTable rows={f.sectionProperties} />
            </div>
          )}
          {section === 'reinforcing' && <ReinforcingTable rows={f.reinforcing.nwc} />}
        </>
      )}

      <div className="panel">
        <div className="panel-head"><h2>자료 출처</h2></div>
        <p className="note">{data.note}</p>
        <p className="note">{dims.sourceUrl}</p>
      </div>
    </>
  );
}
