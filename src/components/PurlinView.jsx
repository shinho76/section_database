import { useEffect, useState } from 'react';
import { drawPurlinSVG } from '../lib/sectionSvg.js';

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

/** Alternating background per depth (D) series, matching the AISC/KS shape
 * lists — makes each purlin depth series visually distinct at a glance. */
function useSeriesBand(rows, keyFn) {
  let lastSeries = null, band = 0;
  return rows.map((r) => {
    const sk = keyFn(r);
    if (sk !== lastSeries) { band = 1 - band; lastSeries = sk; }
    return band;
  });
}

function CeeTable({ rows, onSelect }) {
  const bands = useSeriesBand(rows, (r) => r.d);
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
          <tr key={i} onClick={() => onSelect(r, 'cee')} className={`series-band-${bands[i]}`}>
            <td className="mono ks">CEE-{r.d}X{r.b}X{r.ga}GA</td>
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

function ZeeTable({ rows, onSelect }) {
  const bands = useSeriesBand(rows, (r) => r.d);
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
          <tr key={i} onClick={() => onSelect(r, 'zee')} className={`series-band-${bands[i]}`}>
            <td className="mono ks">ZEE-{r.d}X{r.b}X{r.ga}GA</td>
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

function EasyLapTable({ rows, onSelect }) {
  const bands = useSeriesBand(rows, (r) => r.d);
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
          <tr key={i} onClick={() => onSelect(r, 'easyLap')} className={`series-band-${bands[i]}`}>
            <td className="mono ks">ZEL-{r.d}X{r.b1}/{r.b2}X{r.ga}GA</td>
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

const KIND_LABEL = { cee: 'Cee', zee: 'Zee', easyLap: 'Easy-Lap Zee' };
const KIND_PREFIX = { cee: 'CEE', zee: 'ZEE', easyLap: 'ZEL' };

function PurlinDetail({ row, kind, onBack, source }) {
  const label = kind === 'easyLap'
    ? `${KIND_PREFIX[kind]}-${row.d}X${row.b1}/${row.b2}X${row.ga}GA`
    : `${KIND_PREFIX[kind]}-${row.d}X${row.b}X${row.ga}GA`;
  return (
    <>
      <div className="detail-head">
        <button className="back" onClick={onBack}>← {KIND_LABEL[kind]}</button>
        <div>
          <h1 className="mono">{label}</h1>
          <div className="alias">
            <span className="chip chip-ks">{KIND_LABEL[kind]} Purlin</span>
            <span className="chip">Gauge &nbsp;<b className="mono">{row.ga}GA</b></span>
          </div>
        </div>
      </div>
      <div className="draw-grid">
        <figure className="panel draw">
          <figcaption className="draw-cap">Imperial<span>inch</span></figcaption>
          <div dangerouslySetInnerHTML={{ __html: drawPurlinSVG(row, kind, '"') }} />
          <div className="weight">
            <span className="wv mono">{row.weightLbFt}</span><span className="wu">lb/ft</span>
          </div>
        </figure>
        <figure className="panel draw">
          <figcaption className="draw-cap">Metric<span>mm</span></figcaption>
          <div dangerouslySetInnerHTML={{ __html: drawPurlinSVG(row, kind, 'mm') }} />
          <div className="weight">
            <span className="wv mono">{(row.weightLbFt * 1.48816).toFixed(2)}</span><span className="wu">kg/m</span>
          </div>
        </figure>
      </div>
      <div className="panel">
        <div className="panel-head"><h2>Dimensions</h2></div>
        <table className="props">
          <thead><tr><th>Symbol</th><th className="r">Imperial</th><th className="r">Metric</th><th>Description</th></tr></thead>
          <tbody>
            <tr><td className="sym mono">D</td><td className="r mono">{row.d} <em>in</em></td><td className="r mono">{(row.d * 25.4).toFixed(0)} <em>mm</em></td><td className="desc">웹 높이</td></tr>
            {kind === 'easyLap' ? (
              <>
                <tr><td className="sym mono">B1</td><td className="r mono">{row.b1} <em>in</em></td><td className="r mono">{(row.b1 * 25.4).toFixed(0)} <em>mm</em></td><td className="desc">상부 플랜지 폭</td></tr>
                <tr><td className="sym mono">B2</td><td className="r mono">{row.b2} <em>in</em></td><td className="r mono">{(row.b2 * 25.4).toFixed(0)} <em>mm</em></td><td className="desc">하부 플랜지 폭</td></tr>
              </>
            ) : (
              <tr><td className="sym mono">B</td><td className="r mono">{row.b} <em>in</em></td><td className="r mono">{(row.b * 25.4).toFixed(0)} <em>mm</em></td><td className="desc">플랜지 폭</td></tr>
            )}
            <tr><td className="sym mono">L</td><td className="r mono">{row.l} <em>in</em></td><td className="r mono">{(row.l * 25.4).toFixed(1)} <em>mm</em></td><td className="desc">립(lip) 길이</td></tr>
            <tr><td className="sym mono">Ga.</td><td className="r mono" colSpan={2}>{row.ga}</td><td className="desc">공칭 게이지</td></tr>
            {row.areaIn2 && <tr><td className="sym mono">A</td><td className="r mono">{row.areaIn2} <em>in²</em></td><td className="r mono">{(row.areaIn2 * 645.16).toFixed(0)} <em>mm²</em></td><td className="desc">단면적</td></tr>}
            <tr><td className="sym mono">W</td><td className="r mono">{row.weightLbFt} <em>lb/ft</em></td><td className="r mono">{(row.weightLbFt * 1.48816).toFixed(2)} <em>kg/m</em></td><td className="desc">단위중량</td></tr>
          </tbody>
        </table>
        <p className="note">
          벽 두께는 원본 자료에 게이지로만 주어져 있어, 도면의 두께는 표준 게이지-두께 환산표를 사용한 개략 표시입니다.
          {source && <> {source}</>}
        </p>
      </div>
    </>
  );
}

export default function PurlinView({ variant }) {
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('zee');
  const [selected, setSelected] = useState(null); // { row, kind }

  useEffect(() => {
    setSelected(null);
    import('../data/purlin.json').then((m) => setData(m.default));
  }, [variant]);

  if (!data) return <div className="empty">불러오는 중…</div>;

  if (selected) {
    return (
      <PurlinDetail
        row={selected.row}
        kind={selected.kind}
        onBack={() => setSelected(null)}
        source={`${data.source} (${data.sourceUrl})`}
      />
    );
  }

  const onSelect = (row, kind) => setSelected({ row, kind });

  if (variant === 'PURLIN-CEE') {
    return (
      <>
        <CapabilityPanel cap={data.capabilities.cee} />
        <div className="panel">
          <div className="panel-head">
            <h2>PURLIN-CEE — Cee Purlins Section Properties</h2>
            <span className="tag">{data.cee.length} sizes</span>
          </div>
          <CeeTable rows={data.cee} onSelect={onSelect} />
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
        {tab === 'zee' ? <ZeeTable rows={data.zee} onSelect={onSelect} /> : <EasyLapTable rows={data.easyLapZee} onSelect={onSelect} />}
        <p className="note">{data.source} ({data.sourceUrl})</p>
      </div>
    </>
  );
}
