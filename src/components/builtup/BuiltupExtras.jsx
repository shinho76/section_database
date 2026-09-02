import { useState } from 'react';
import { useStore } from '../../store.js';
import { minFilletWeldMm, filletWeldKgPerM, plateKgPerM } from './weldAndCutlist.js';

/** Shared "용접량 · 컷리스트 · 적산 담기" block for the BH-1/2/3/4 panels.
 *
 * `plates`: [{ name, widthMm, thicknessMm }] - every plate that makes up
 *   this built-up member (flanges, web, T-bar stem, ...), used for the cut
 *   list and to size the default fillet weld.
 * `weldLines`: total number of continuous fillet-weld lines running the
 *   full member length (e.g. a symmetric welded H = 4: both sides of both
 *   flange-web joints). 0 for a rolled H core with only a bolted/no T-bar,
 *   or when the T-bar itself isn't welded on in this configuration.
 * `bomItem`: { name, ks, type, unitWeightKgM } - passed to addToBom as-is,
 *   plus this block's own weldKgPerM.
 */
export default function BuiltupExtras({ plates, weldLines, bomItem }) {
  const addToBom = useStore((s) => s.addToBom);
  const thinnest = plates.length ? Math.min(...plates.map((p) => p.thicknessMm)) : 6;
  const [filletMm, setFilletMm] = useState(() => minFilletWeldMm(thinnest));
  const [lengthM, setLengthM] = useState('');

  const weldKgPerM = weldLines > 0 ? weldLines * filletWeldKgPerM(filletMm) : 0;
  const len = parseFloat(lengthM) || 0;

  return (
    <div className="panel">
      <div className="panel-head"><h2>용접량 · 컷리스트 (제작 참고용)</h2></div>

      <table className="props">
        <thead>
          <tr><th>부재</th><th className="r">폭</th><th className="r">두께</th><th className="r">단중</th><th className="r">중량 (길이 입력 시)</th></tr>
        </thead>
        <tbody>
          {plates.map((p) => {
            const kgPerM = plateKgPerM(p.widthMm, p.thicknessMm);
            return (
              <tr key={p.name}>
                <td className="sym mono">{p.name}</td>
                <td className="r mono">{p.widthMm.toFixed(0)} <em>mm</em></td>
                <td className="r mono">{p.thicknessMm.toFixed(1)} <em>mm</em></td>
                <td className="r mono">{kgPerM.toFixed(2)} <em>kg/m</em></td>
                <td className="r mono">{len > 0 ? (kgPerM * len).toFixed(1) : '—'} <em>kg</em></td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="field-row" style={{ alignItems: 'flex-end' }}>
        <label style={{ flex: 'none', width: 110 }}>부재 길이 (선택)
          <span className="unit-input">
            <input type="number" min={0} step={0.1} placeholder="0" value={lengthM} onChange={(e) => setLengthM(e.target.value)} />
            <span className="unit-suffix">m</span>
          </span>
        </label>
        {weldLines > 0 && (
          <label style={{ flex: 'none', width: 110 }}>필릿 사이즈
            <span className="unit-input">
              <input type="number" min={3} step={1} value={filletMm} onChange={(e) => setFilletMm(Math.max(1, parseFloat(e.target.value) || 1))} />
              <span className="unit-suffix">mm</span>
            </span>
          </label>
        )}
        {weldLines > 0 && (
          <div className="chip" style={{ marginBottom: 6 }}>
            용접선 {weldLines}줄 × {filletMm}mm 필릿 &nbsp;=&nbsp;
            <b className="mono">{weldKgPerM.toFixed(3)}</b> kg/m
            {len > 0 && <> (총 <b className="mono">{(weldKgPerM * len).toFixed(2)}</b> kg)</>}
          </div>
        )}
      </div>
      <p className="note" style={{ borderTop: 'none' }}>
        컷리스트는 판재 치수·단중 참고용이며 절단 여유·개선(그루브) 가공은 포함하지 않습니다. 필릿 사이즈는 AISC Table J2.4 최소값을 기본 제안하며,
        용접량은 단순 삼각형 필릿 단면(보강덧살 미포함) 가정의 근사치입니다 — 실제 접합부 설계·용착량 검토를 대체하지 않습니다.
      </p>

      <div className="modal-foot" style={{ justifyContent: 'flex-start', borderTop: '1px solid var(--bd-subtle)' }}>
        <button
          type="button" className="btn"
          onClick={() => addToBom({ ...bomItem, weldKgPerM: weldKgPerM || undefined, lengthM })}
        >
          🧺 적산 바구니에 담기{len > 0 ? ` (길이 ${len}m 반영)` : ''}
        </button>
      </div>
    </div>
  );
}
