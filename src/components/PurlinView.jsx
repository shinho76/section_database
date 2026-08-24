import { useEffect, useState } from 'react';

function CapabilityPanel({ cap }) {
  if (!cap) return null;
  const rows = Object.entries(cap).filter(([k]) => k !== 'title');
  return (
    <div className="panel">
      <div className="panel-head"><h2>{cap.title} — 적용범위</h2></div>
      <table className="props">
        <tbody>
          {rows.map(([k, v]) => (
            <tr key={k}><td className="sym mono">{k}</td><td className="desc" colSpan={3}>{v}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CeeTable({ rows }) {
  return (
    <table className="list">
      <thead>
        <tr>
          <th>KS</th><th className="r">D (in)</th><th className="r">B (in)</th>
          <th className="r">Ga.</th><th className="r">L (in)</th>
          <th className="r">Weight (lb/ft)</th><th className="r">Area (in²)</th><th>Note</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td className="mono ks">C{r.d}×{r.b}×{r.ga}GA</td>
            <td className="r mono">{r.d}</td>
            <td className="r mono">{r.b}</td>
            <td className="r mono">{r.ga}</td>
            <td className="r mono">{r.l}</td>
            <td className="r mono">{r.weightLbFt}</td>
            <td className="r mono">{r.areaIn2}</td>
            <td className="desc">{r.note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ZeeTable({ rows }) {
  return (
    <table className="list">
      <thead>
        <tr>
          <th>KS</th><th className="r">D (in)</th><th className="r">B (in)</th>
          <th className="r">Ga.</th><th className="r">L (in)</th>
          <th className="r">Weight (lb/ft)</th><th className="r">Area (in²)</th><th>Note</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td className="mono ks">Z{r.d}×{r.b}×{r.ga}GA</td>
            <td className="r mono">{r.d}</td>
            <td className="r mono">{r.b}</td>
            <td className="r mono">{r.ga}</td>
            <td className="r mono">{r.l}</td>
            <td className="r mono">{r.weightLbFt}</td>
            <td className="r mono">{r.areaIn2}</td>
            <td className="desc">{r.note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EasyLapTable({ rows }) {
  return (
    <table className="list">
      <thead>
        <tr>
          <th>KS</th><th className="r">D (in)</th><th className="r">B1 (in)</th><th className="r">B2 (in)</th>
          <th className="r">Ga.</th><th className="r">L (in)</th><th className="r">Weight (lb/ft)</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            <td className="mono ks">ZEL{r.d}×{r.b1}/{r.b2}×{r.ga}GA</td>
            <td className="r mono">{r.d}</td>
            <td className="r mono">{r.b1}</td>
            <td className="r mono">{r.b2}</td>
            <td className="r mono">{r.ga}</td>
            <td className="r mono">{r.l}</td>
            <td className="r mono">{r.weightLbFt}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function PurlinView({ variant }) {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('zee');

  useEffect(() => {
    import('../data/purlin.json').then((m) => setData(m.default));
  }, []);

  if (!data) return <div className="empty">불러오는 중…</div>;

  if (variant === 'PURLIN-CEE') {
    return (
      <>
        <CapabilityPanel cap={data.capabilities.cee} />
        <div className="panel">
          <div className="panel-head">
            <h2>PURLIN-CEE — Cee Purlins Section Properties</h2>
            <span className="tag">{data.cee.length} sizes</span>
          </div>
          <CeeTable rows={data.cee} />
          <p className="note">{data.source} ({data.sourceUrl})</p>
        </div>
      </>
    );
  }

  // PURLIN-ZEE: Zee purlins + Easy-Lap Zee purlins (tabbed)
  return (
    <>
      <CapabilityPanel cap={data.capabilities.zee} />
      <div className="panel">
        <div className="panel-head">
          <h2>PURLIN-ZEE — Zee Purlins Section Properties</h2>
          <span className="tag">{(tab === 'zee' ? data.zee : data.easyLapZee).length} sizes</span>
        </div>
        <div className="deck-tabs">
          <span className={`deck-tab${tab === 'zee' ? ' is-active' : ''}`} onClick={() => setTab('zee')}>Zee</span>
          <span className={`deck-tab${tab === 'easyLap' ? ' is-active' : ''}`} onClick={() => setTab('easyLap')}>Easy-Lap Zee</span>
        </div>
        {tab === 'zee' ? <ZeeTable rows={data.zee} /> : <EasyLapTable rows={data.easyLapZee} />}
        <p className="note">{data.source} ({data.sourceUrl})</p>
      </div>
    </>
  );
}
