import { useEffect, useState } from 'react';

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
          <th className="r">Gage</th><th className="r">Weight (psf)</th><th className="r">Weight (kg/m²)</th>
          <th className="r">t (in)</th><th className="r">t (mm)</th>
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
            <td className="r mono">{(r.weightPsf * PSF_TO_KGM2).toFixed(1)}</td>
            <td className="r mono">{r.thicknessIn}</td>
            <td className="r mono">{(r.thicknessIn * 25.4).toFixed(2)}</td>
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
            <th className="r">in</th><th className="r">mm</th>
            <th className="r">in</th><th className="r">mm</th>
            <th className="r">yd³/100ft²</th><th className="r">L/m²</th>
            <th className="r">in²</th><th className="r">mm²</th>
            <th></th>
            <th className="r">lb/yd³</th><th className="r">kg/m³</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="r mono">{r.slabDepthIn}″</td><td className="r mono">{inToMm(r.slabDepthIn).toFixed(0)}</td>
              <td className="r mono">{r.coverDepthIn}″</td><td className="r mono">{inToMm(r.coverDepthIn).toFixed(0)}</td>
              <td className="r mono">{r.concreteVolumeYd3per100ft2}</td>
              <td className="r mono">{(r.concreteVolumeYd3per100ft2 * 82.3).toFixed(1)}</td>
              <td className="r mono">{r.minAsIn2}</td><td className="r mono">{(r.minAsIn2 * 645.16).toFixed(0)}</td>
              <td className="mono">{r.wwr}</td>
              <td className="r mono">{r.fiber4DLbYd3}</td><td className="r mono">{(r.fiber4DLbYd3 * 0.593276).toFixed(0)}</td>
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

  useEffect(() => {
    import('../data/metaldeck.json').then((m) => setData(m.default));
  }, []);

  if (!data) return <div className="empty">불러오는 중…</div>;

  const f = data.family;
  const profile = f.profiles.find((p) => p.name === '1.5VLI-36') || f.profiles[0];

  return (
    <>
      <div className="detail-head">
        <div>
          <h1 className="mono">METAL DECK — {profile.name}</h1>
          <div className="alias">
            <span className="chip chip-ks">{f.depthIn}in × {f.widthIn}in</span>
            <span className="chip">{f.grade}</span>
            <span className="chip">{profile.fastening}</span>
          </div>
        </div>
      </div>

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

      <div className="panel">
        <div className="panel-head"><h2>다른 프로파일 (자료 없음)</h2></div>
        <table className="list">
          <thead><tr><th>Profile</th><th className="r">Depth (in)</th><th className="r">Width (in)</th><th>Note</th></tr></thead>
          <tbody>
            {data.otherProfiles.map((p) => (
              <tr key={p.name}>
                <td className="mono strong">{p.name}</td>
                <td className="r mono">{p.depthIn}</td>
                <td className="r mono">{p.widthIn}</td>
                <td className="desc">{p.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="note">{data.note}</p>
        <p className="note">{data.source} ({data.catalogUrl})</p>
      </div>
    </>
  );
}
