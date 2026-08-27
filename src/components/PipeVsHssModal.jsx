const ROWS = [
  { label: '재료 규격', pipe: 'ASTM A53 (통상 Grade B)', hss: 'ASTM A500 Grade C' },
  { label: '항복강도 Fy', pipe: '35 ksi', hss: '46 ksi (더 높음)' },
  {
    label: '호칭 방식',
    pipe: '공칭관경(NPS) + 등급 — 예: Pipe4STD/XS/XXS. 호칭경과 실제 외경이 다름 ("4\" 파이프"의 실제 외경은 4.5in)',
    hss: '실측 외경×두께 직접 표기 — 예: HSS4.000X0.250. 표기값이 곧 실제 외경',
  },
  {
    label: '용도 관행',
    pipe: '배관과 겸용으로 개발된 오래된 규격. 기둥재로도 관행적으로 사용',
    hss: '처음부터 구조용으로 개발. 최근 신축 공사에서 더 널리 사용',
  },
];

/** Reference popup opened from the PIPE sidebar cell: explains how AISC
 * Pipe differs from AISC HSS-Round, since both are round hollow sections
 * but follow different material specs and naming conventions. */
export default function PipeVsHssModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640 }}>
        <div className="modal-head">
          <h2>Pipe vs HSS (Round) — 무엇이 다른가</h2>
          <button className="modal-close" onClick={onClose} aria-label="닫기">×</button>
        </div>
        <div className="modal-body">
          <table className="list">
            <thead>
              <tr><th>구분</th><th>PIPE</th><th>HSS (Round)</th></tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r.label}>
                  <td className="mono strong">{r.label}</td>
                  <td>{r.pipe}</td>
                  <td>{r.hss}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="note">
            같은 4인치급이라도 Pipe는 관경 체계(호칭경 ≠ 실제 치수)를, HSS-Round는 실측 치수 체계를 쓰며 강도 등급도 다릅니다 —
            둘 다 원형 강관이지만 서로 다른 재료 규격을 따르는 별개 부재입니다.
          </p>
        </div>
        <div className="modal-foot">
          <button className="back" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
