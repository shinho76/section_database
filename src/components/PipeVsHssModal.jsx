const ROWS = [
  {
    label: '주 용도',
    pipe: '배관 + 구조 겸용 — 원래 배관재로 개발되어, 구조 기둥재로도 관행적으로 사용',
    hss: '구조 전용 — 처음부터 구조용으로만 개발됨 (배관 용도로 쓰지 않음)',
  },
  { label: '재료 규격', pipe: 'ASTM A53 (통상 Grade B)', hss: 'ASTM A500 Grade C' },
  { label: '항복강도 Fy', pipe: '35 ksi', hss: '46 ksi (더 높음)' },
  {
    label: '호칭 방식',
    pipe: '공칭관경(NPS) + 등급 — 예: Pipe4STD/XS/XXS. 호칭경과 실제 외경이 다름 ("4\" 파이프"의 실제 외경은 4.5in)',
    hss: '실측 외경×두께 직접 표기 — 예: HSS4.000X0.250. 표기값이 곧 실제 외경',
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
          <p className="note">
            한국에도 이 두 용도가 규격으로 나뉘어 있습니다 — 배관 겸용인 Pipe(A53)에 대응하는 것은 <b>KS D 3507</b>(배관용 탄소강관, SPP,
            2025-08-29 최신 개정 확인·현재 유효), 구조 전용인 HSS-Round에 대응하는 것은 이 앱의 KS-P가 쓰는 <b>KS D 3566</b>(일반구조용
            탄소강관)입니다. 다만 이 앱은 KS D 3507 배관용 강관 데이터는 아직 제공하지 않습니다.
          </p>
        </div>
        <div className="modal-foot">
          <button className="back" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
