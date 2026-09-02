import { useMemo, useState } from 'react';
import { useStore } from '../store.js';

/** kg for one BOM row: unit weight (kg/m) x length (m) x quantity. Blank
 * length is treated as 0 rather than 1 — an un-filled-in row shouldn't
 * silently count toward the total. */
function rowWeightKg(row) {
  const len = parseFloat(row.lengthM);
  const w = Number.isFinite(len) ? row.unitWeightKgM * len * row.qty : 0;
  return Number.isFinite(w) ? w : 0;
}

function toCsvField(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const HEADERS = ['name', 'ks', 'type', 'qty', 'lengthM', 'unitWeightKgM', 'weldKgPerM', 'totalWeightKg', 'totalWeldKg'];
const HEADER_LABELS = ['단면', 'KS 호칭', 'Type', '수량', '길이(m)', '단위중량(kg/m)', '용접량(kg/m)', '총중량(kg)', '총용접량(kg)'];

function rowsToTsv(bom, withHeader) {
  const lines = [];
  if (withHeader) lines.push(HEADER_LABELS.join('\t'));
  for (const r of bom) {
    const totalKg = rowWeightKg(r);
    const totalWeld = r.weldKgPerM ? (parseFloat(r.lengthM) || 0) * r.weldKgPerM * r.qty : '';
    lines.push([
      r.name, r.ks ?? '', r.type, r.qty, r.lengthM, r.unitWeightKgM.toFixed(2),
      r.weldKgPerM ? r.weldKgPerM.toFixed(3) : '', totalKg.toFixed(1), totalWeld === '' ? '' : totalWeld.toFixed(2),
    ].join('\t'));
  }
  return lines.join('\n');
}

function downloadCsv(bom) {
  const lines = [HEADERS.join(',')];
  for (const r of bom) {
    const totalKg = rowWeightKg(r);
    const totalWeld = r.weldKgPerM ? (parseFloat(r.lengthM) || 0) * r.weldKgPerM * r.qty : '';
    lines.push([
      r.name, r.ks ?? '', r.type, r.qty, r.lengthM, r.unitWeightKgM.toFixed(2),
      r.weldKgPerM ? r.weldKgPerM.toFixed(3) : '', totalKg.toFixed(1), totalWeld === '' ? '' : totalWeld.toFixed(2),
    ].map(toCsvField).join(','));
  }
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `bom-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function BomModal({ onClose }) {
  const { bom, removeFromBom, updateBomItem, clearBom } = useStore();
  const [copied, setCopied] = useState(false);

  const totalKg = useMemo(() => bom.reduce((sum, r) => sum + rowWeightKg(r), 0), [bom]);
  const totalWeldKg = useMemo(() => bom.reduce((sum, r) => {
    if (!r.weldKgPerM) return sum;
    const len = parseFloat(r.lengthM) || 0;
    return sum + r.weldKgPerM * len * r.qty;
  }, 0), [bom]);

  const copyTable = async () => {
    try {
      await navigator.clipboard.writeText(rowsToTsv(bom, true));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable (permissions, non-secure context) — silently no-op */ }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 820 }}>
        <div className="modal-head">
          <h2>적산 바구니 <span className="tag">{bom.length}개</span></h2>
          <button className="modal-close" onClick={onClose} aria-label="닫기">×</button>
        </div>
        <div className="modal-body">
          {bom.length === 0 ? (
            <p className="empty">담긴 단면이 없습니다. 목록·상세 페이지의 "+" 버튼으로 담아보세요.</p>
          ) : (
            <>
              <table className="list bom-table">
                <thead>
                  <tr>
                    <th>단면</th><th className="r">수량</th><th className="r">길이(m)</th>
                    <th className="r">단위중량</th><th className="r">중량(kg)</th><th />
                  </tr>
                </thead>
                <tbody>
                  {bom.map((r) => (
                    <tr key={r.id}>
                      <td className="mono strong">
                        {r.name}
                        {r.ks && <span className="bom-ks mono"> {r.ks}</span>}
                      </td>
                      <td className="r">
                        <input
                          type="number" min={1} step={1} className="bom-input-sm"
                          value={r.qty} onChange={(e) => updateBomItem(r.id, { qty: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                        />
                      </td>
                      <td className="r">
                        <input
                          type="number" min={0} step={0.1} className="bom-input-sm" placeholder="0"
                          value={r.lengthM} onChange={(e) => updateBomItem(r.id, { lengthM: e.target.value })}
                        />
                      </td>
                      <td className="r mono">{r.unitWeightKgM.toFixed(1)} <em>kg/m</em></td>
                      <td className="r mono">{rowWeightKg(r).toFixed(1)}</td>
                      <td>
                        <button type="button" className="layer-del" title="제거" onClick={() => removeFromBom(r.id)}>×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="note" style={{ borderTop: 'none', paddingLeft: 0 }}>
                길이를 비워두면 해당 행은 중량 합계에서 0으로 계산됩니다. 용접량은 Built-up 조합 페이지에서 담은 항목에 한해 계산됩니다.
              </p>
              <div className="bom-totals">
                <span>총중량 <b className="mono">{totalKg.toFixed(1)}</b> kg</span>
                {totalWeldKg > 0 && <span>총 용착금속량 <b className="mono">{totalWeldKg.toFixed(2)}</b> kg</span>}
              </div>
            </>
          )}
        </div>
        <div className="modal-foot">
          {bom.length > 0 && (
            <>
              <button className="btn" onClick={copyTable}>{copied ? '복사됨 ✓' : '표 복사'}</button>
              <button className="btn" onClick={() => downloadCsv(bom)}>CSV 내보내기</button>
              <button className="btn" onClick={clearBom}>전체 비우기</button>
            </>
          )}
          <button className="back" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
