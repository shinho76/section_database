import { useEffect, useState } from 'react';

const SECTIONS = [
  { key: 'section', label: '단면성능' },
  { key: 'crippling', label: '웹 크리플링' },
  { key: 'nwc', label: 'NWC 145pcf' },
  { key: 'lwc', label: 'LWC 110pcf' },
  { key: 'reinforcing', label: '철근/철섬유' },
];

function SectionPropsTable({ rows }) {
  return (
    <table className="list">
      <thead>
        <tr>
          <th className="r">Gage</th><th className="r">Weight (psf)</th><th className="r">t (in)</th>
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
            <td className="r mono">{r.thicknessIn}</td>
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

function CripplingTable({ rows }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="list">
        <thead>
          <tr>
            <th className="r" rowSpan={2}>Gage</th>
            <th className="r" colSpan={4}>One-Flange · End Bearing</th>
            <th className="r" colSpan={2}>One-Flange · Interior</th>
            <th className="r" colSpan={4}>Two-Flange · End Bearing</th>
            <th className="r" colSpan={2}>Two-Flange · Interior</th>
          </tr>
          <tr>
            <th className="r">1½"</th><th className="r">2"</th><th className="r">3"</th><th className="r">4"</th>
            <th className="r">3"</th><th className="r">4"</th>
            <th className="r">1½"</th><th className="r">2"</th><th className="r">3"</th><th className="r">4"</th>
            <th className="r">3"</th><th className="r">4"</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.gauge}>
              <td className="r mono strong">{r.gauge}</td>
              <td className="r mono">{r.oneFlangeEnd['1.5']}</td><td className="r mono">{r.oneFlangeEnd['2']}</td>
              <td className="r mono">{r.oneFlangeEnd['3']}</td><td className="r mono">{r.oneFlangeEnd['4']}</td>
              <td className="r mono">{r.oneFlangeInterior['3']}</td><td className="r mono">{r.oneFlangeInterior['4']}</td>
              <td className="r mono">{r.twoFlangeEnd['1.5']}</td><td className="r mono">{r.twoFlangeEnd['2']}</td>
              <td className="r mono">{r.twoFlangeEnd['3']}</td><td className="r mono">{r.twoFlangeEnd['4']}</td>
              <td className="r mono">{r.twoFlangeInterior['3']}</td><td className="r mono">{r.twoFlangeInterior['4']}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">단위: φRn, lb/ft. 지압길이(bearing length) in.</p>
    </div>
  );
}

function DeckSlabTables({ deckSlab, label }) {
  return (
    <>
      <div className="panel">
        <div className="panel-head"><h2>{label} — Maximum Unshored Spans & Deck-Slab Properties</h2></div>
        <table className="list">
          <thead>
            <tr>
              <th>Slab Total/Topping</th><th className="r">Gage</th>
              <th className="r">1-Span</th><th className="r">2-Span</th><th className="r">3-Span</th>
              <th className="r">Wc (psf)</th><th className="r">Icr (in⁴/ft)</th>
              <th className="r">φMn (kip-ft/ft)</th><th className="r">φVn (kip/ft)</th>
            </tr>
          </thead>
          <tbody>
            {deckSlab.unshoredSpans.map((r, i) => (
              <tr key={i}>
                <td className="mono">{r.slabTotalIn}″ / {r.slabToppingIn}″</td>
                <td className="r mono strong">{r.gauge}</td>
                <td className="r mono">{r.span1}</td><td className="r mono">{r.span2}</td><td className="r mono">{r.span3}</td>
                <td className="r mono">{r.wcPsf}</td><td className="r mono">{r.icr}</td>
                <td className="r mono">{r.phiMnKipFtFt}</td><td className="r mono">{r.phiVnKipFt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="panel">
        <div className="panel-head">
          <h2>{label} — Superimposed Design Load φWn / Deflection L/360 (psf)</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="list">
            <thead>
              <tr>
                <th>Slab Depth</th><th className="r">Gage</th>
                {deckSlab.superimposedLoad.spanColumns.map((c) => <th className="r" key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {deckSlab.superimposedLoad.rows.map((r, i) => (
                <tr key={i}>
                  <td className="mono">{r.slabDepthIn}″</td>
                  <td className="r mono strong">{r.gauge}</td>
                  {r.values.map((v, j) => <td className="r mono" key={j}>{v}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">각 셀 = 하중(psf)/처짐 기준 하중(psf), L/360.</p>
      </div>
    </>
  );
}

function ReinforcingTable({ rows, label }) {
  return (
    <div className="panel">
      <div className="panel-head"><h2>{label} — 온도·수축 철근</h2></div>
      <table className="list">
        <thead>
          <tr>
            <th className="r">Slab Depth</th><th className="r">Cover Depth</th>
            <th className="r">Concrete Vol. (yd³/100ft²)</th><th className="r">Min. As (in²)</th>
            <th>WWR</th><th className="r">4D Fiber (lb/yd³)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="r mono">{r.slabDepthIn}″</td>
              <td className="r mono">{r.coverDepthIn}″</td>
              <td className="r mono">{r.concreteVolumeYd3per100ft2}</td>
              <td className="r mono">{r.minAsIn2}</td>
              <td className="mono">{r.wwr}</td>
              <td className="r mono">{r.fiber4DLbYd3}</td>
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

  return (
    <>
      <div className="detail-head">
        <div>
          <h1 className="mono">METAL DECK — {f.profiles.map((p) => p.name).join(' / ')}</h1>
          <div className="alias">
            <span className="chip chip-ks">{f.depthIn}in × {f.widthIn}in</span>
            <span className="chip">{f.grade}</span>
            <span className="chip">{f.standard}</span>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>프로파일 (체결 방식 차이만 있음, 단면 동일)</h2></div>
        <table className="list">
          <thead><tr><th>Profile</th><th>Fastening</th></tr></thead>
          <tbody>
            {f.profiles.map((p) => (
              <tr key={p.name}><td className="mono strong">{p.name}</td><td className="desc">{p.fastening}</td></tr>
            ))}
          </tbody>
        </table>
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
      {section === 'crippling' && (
        <div className="panel">
          <div className="panel-head"><h2>Design Reactions — Web Crippling</h2></div>
          <CripplingTable rows={f.webCrippling.rows} />
        </div>
      )}
      {section === 'nwc' && (
        <DeckSlabTables deckSlab={f.deckSlab.nwc} label={f.deckSlab.nwc.concreteLabel} />
      )}
      {section === 'lwc' && (
        <DeckSlabTables deckSlab={f.deckSlab.lwc} label={f.deckSlab.lwc.concreteLabel} />
      )}
      {section === 'reinforcing' && (
        <>
          <ReinforcingTable rows={f.reinforcing.nwc} label="Normal Weight Concrete" />
          <ReinforcingTable rows={f.reinforcing.lwc} label="Light Weight Concrete" />
        </>
      )}

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
