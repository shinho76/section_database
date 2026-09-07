import { useMemo, useState } from 'react';
import { useStore } from '../store.js';
import materials from '../data/materials.json';

// Every grade from both material tables, for the BOM row grade dropdown -
// takeoffs need to subtotal by grade, and freehand grade text can't be
// grouped reliably.
const GRADE_OPTIONS = [...materials.astm.rows.map((r) => r.grade), ...materials.ks.rows.map((r) => r.grade)];

/** kg for one BOM row. `perEach` rows (e.g. a plate sized by W×L, added as
 * a discrete piece rather than a linear member) use unit weight x quantity
 * directly - length doesn't apply. Otherwise: unit weight (kg/m) x length
 * (m) x quantity, with a blank/invalid length treated as 0 so an
 * un-filled-in row doesn't silently count toward the total. */
function rowWeightKg(row) {
  if (row.perEach) {
    const w = row.unitWeightKgM * row.qty;
    return Number.isFinite(w) ? w : 0;
  }
  const len = parseFloat(row.lengthM);
  const w = Number.isFinite(len) ? row.unitWeightKgM * len * row.qty : 0;
  return Number.isFinite(w) ? w : 0;
}

function toCsvField(v) {
  const s = String(v ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const HEADERS = ['name', 'ks', 'type', 'mark', 'grade', 'qty', 'lengthM', 'unitWeightKgM', 'weldKgPerM', 'totalWeightKg', 'totalWeldKg', 'remark'];
const HEADER_LABELS = ['단면', 'KS 호칭', 'Type', '부재마크', '강종', '수량', '길이(m)', '단위중량(kg/m)', '용접량(kg/m)', '총중량(kg)', '총용접량(kg)', '비고'];

function bomRowFields(r) {
  const totalKg = rowWeightKg(r);
  const totalWeld = r.weldKgPerM && !r.perEach ? (parseFloat(r.lengthM) || 0) * r.weldKgPerM * r.qty : '';
  return [
    r.name, r.ks ?? '', r.type, r.mark ?? '', r.grade ?? '', r.qty, r.perEach ? 'EA' : r.lengthM,
    r.unitWeightKgM.toFixed(2), r.weldKgPerM ? r.weldKgPerM.toFixed(3) : '',
    totalKg.toFixed(1), totalWeld === '' ? '' : totalWeld.toFixed(2), r.remark ?? '',
  ];
}

function rowsToTsv(bom, withHeader) {
  const lines = [];
  if (withHeader) lines.push(HEADER_LABELS.join('\t'));
  for (const r of bom) lines.push(bomRowFields(r).join('\t'));
  return lines.join('\n');
}

function downloadCsv(bom) {
  const lines = [
    `# SteelWeight BOM export — ${new Date().toISOString().slice(0, 10)}`,
    HEADERS.join(','),
    ...bom.map((r) => bomRowFields(r).map(toCsvField).join(',')),
  ];
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
    if (!r.weldKgPerM || r.perEach) return sum;
    const len = parseFloat(r.lengthM) || 0;
    return sum + r.weldKgPerM * len * r.qty;
  }, 0), [bom]);
  // Grouped by grade so a takeoff can be handed to purchasing per steel
  // grade - "SM355 총 몇 톤" is how it's actually ordered, not one lump sum.
  const byGrade = useMemo(() => {
    const m = new Map();
    for (const r of bom) {
      const key = r.grade || '(강종 미지정)';
      m.set(key, (m.get(key) || 0) + rowWeightKg(r));
    }
    return [...m.entries()];
  }, [bom]);

  const copyTable = async () => {
    try {
      await navigator.clipboard.writeText(rowsToTsv(bom, true));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* clipboard unavailable (permissions, non-secure context) — silently no-op */ }
  };

  // Destructive/irreversible - a stray click shouldn't silently wipe the
  // basket, so this is the one action in the footer that asks first.
  const onClearAll = () => {
    if (window.confirm(`적산 바구니의 항목 ${bom.length}개를 전부 비울까요? 되돌릴 수 없습니다.`)) {
      clearBom();
    }
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
                    <th>단면</th><th>부재마크</th><th>강종</th><th className="r">수량</th><th className="r">길이(m)</th>
                    <th className="r">단위중량</th><th className="r">중량(kg)</th><th />
                  </tr>
                </thead>
                <tbody>
                  {bom.map((r) => {
                    const lengthMissing = !r.perEach && !(parseFloat(r.lengthM) > 0);
                    return (
                    <tr key={r.id} className={lengthMissing ? 'bom-row-warn' : undefined}>
                      <td className="mono strong">
                        {r.name}
                        {r.ks && <span className="bom-ks mono"> {r.ks}</span>}
                      </td>
                      <td>
                        <input
                          type="text" className="bom-input-sm bom-input-mark" placeholder="마크"
                          value={r.mark ?? ''} onChange={(e) => updateBomItem(r.id, { mark: e.target.value })}
                        />
                      </td>
                      <td>
                        <select
                          className="bom-input-sm bom-input-grade"
                          value={r.grade ?? ''} onChange={(e) => updateBomItem(r.id, { grade: e.target.value })}
                        >
                          <option value="">—</option>
                          {GRADE_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </td>
                      <td className="r">
                        <input
                          type="number" min={1} step={1} className="bom-input-sm"
                          value={r.qty} onChange={(e) => updateBomItem(r.id, { qty: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                        />
                      </td>
                      <td className="r">
                        {r.perEach ? <span className="mono" title="개수 기준 항목 - 길이 미적용">EA</span> : (
                          <input
                            type="number" min={0} step={0.1} className={`bom-input-sm${lengthMissing ? ' is-warn' : ''}`} placeholder="길이 입력"
                            value={r.lengthM} onChange={(e) => updateBomItem(r.id, { lengthM: e.target.value })}
                          />
                        )}
                      </td>
                      <td className="r mono">{r.unitWeightKgM.toFixed(1)} <em>{r.perEach ? 'kg/EA' : 'kg/m'}</em></td>
                      <td className="r mono">{rowWeightKg(r).toFixed(1)}</td>
                      <td>
                        <button type="button" className="layer-del" title="제거" aria-label="제거" onClick={() => removeFromBom(r.id)}>×</button>
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
              <p className="note" style={{ borderTop: 'none', paddingLeft: 0 }}>
                길이를 비워두면 해당 행은 중량 합계에서 0으로 계산됩니다(EA 표시 항목은 개수 기준이라 길이가 적용되지 않습니다).
                용접량은 Built-up 조합 페이지에서 담은 항목에 한해 계산됩니다. 이 총중량은 순이론중량이며 절단 로스·할증·도장/도금
                부착중량은 포함하지 않습니다 — 발주 물량 산정 시 별도 반영하십시오.
              </p>
              {byGrade.length > 1 && (
                <div className="bom-totals" style={{ flexWrap: 'wrap' }}>
                  {byGrade.map(([grade, kg]) => (
                    <span key={grade}>{grade} <b className="mono">{kg.toFixed(1)}</b> kg</span>
                  ))}
                </div>
              )}
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
              <button className="btn btn-danger" onClick={onClearAll}>전체 비우기</button>
            </>
          )}
          <button className="back" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
