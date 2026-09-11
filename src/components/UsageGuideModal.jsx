// Reference/help content only — no calculation logic. Grouped to mirror the
// sidebar's own GRID_GROUPS/BELOW_GROUPS structure so a user can map "what I
// see in the sidebar" to "what it does" one-to-one.
const SECTIONS = [
  {
    title: 'H형강 / T형강 / 각형강관·원형강관 / 앵글 / 채널 (AISC ↔ KS)',
    body: '사이드바 상단 격자는 AISC(미국)와 KS(한국) 규격을 같은 줄에 나란히 배치했습니다. '
      + '항목을 클릭하면 해당 규격의 전체 목록이 뜨고, 목록에서 사이즈를 클릭하면 치수·단면성능(단면적, 관성모멘트, '
      + '단면계수, 회전반경 등)과 단위중량을 함께 보여주는 상세 페이지로 이동합니다. 상세 페이지의 "+ 물량에 담기" 버튼으로 '
      + '해당 부재를 바로 물량 산정(BOM) 목록에 추가할 수 있습니다. W형강 목록에는 Nucor-Yamato 재고 가능 등급(★/제조사 표기) '
      + '필터가, KS H/L/C형강 목록에는 "자재수급확인 품목 제외" 체크박스가 있어 실제 조달 가능한 사이즈만 걸러서 볼 수 있습니다 — '
      + '설계 단계에서 재고에 없는 사이즈를 잡아 나중에 설계변경이 나는 상황을 막기 위한 기능입니다.',
  },
  {
    title: '빌트업 H형강 (Built-up H-Section)',
    body: '플랜지/웨브 판 두께·폭을 직접 입력해 원하는 사이즈의 빌트업 H형강을 구성하면, 단위중량과 단면성능(Ix, Sx, rx 등)을 '
      + '자동으로 계산해줍니다. "Unequal"은 상하 플랜지 크기가 다른 빌트업, "H+T-Bar"는 기성 H형강(또는 빌트업)에 T형강을 '
      + '보강재로 덧댄 조합 단면을 계산합니다. 입력에 쓰이는 판 두께는 조달 가능한 규격 목록에서만 선택할 수 있도록 되어 있습니다.',
  },
  {
    title: '퍼린 (Purlin CEE / ZEE)',
    body: 'CEE/ZEE 형강 경량 퍼린의 규격별 치수와 단위중량을 조회합니다. 지붕·벽체 골조 초기 물량 산정에 사용하세요.',
  },
  {
    title: '강판 (Plate)',
    body: '"Plate Weight"는 두께×폭×길이를 입력하면 단위중량·총중량을 계산합니다. "Plate Stock Availability"는 실제 재고 '
      + '가능한 두께/규격만 모아 보여주고, "Checked Plate"(ASTM A786 / 국내 제조사 규격)는 조달처가 확인된 판재 목록입니다. '
      + '"Metal Deck"은 데크 플레이트의 규격별 단위중량을 조회합니다.',
  },
  {
    title: '배근재 (Rebar / WWR)',
    body: 'Rebar는 철근 호칭별(예: D10, D13...) 단위중량과 단면적을, WWR(용접철망)은 규격별 중량 데이터를 제공합니다.',
  },
  {
    title: '환봉 (Rod Bar)',
    body: 'KS(SS275) / ASTM(A36) 규격 환봉의 지름별 단위중량을 조회합니다.',
  },
  {
    title: '패스너 (Bolt / Anchor Bolt / Stud)',
    body: '고장력볼트(ASTM F3125 / KS B 1010·2819)의 규격·등급별 중량, 앵커볼트(ASTM F1554)의 규격별 중량을 조회합니다. '
      + 'Shear Stud는 AWS D1.1 기준 규격을 조회하되, 스터드 길이는 카탈로그 항목이 아니라 현장마다 다르므로 행마다 길이(mm)를 '
      + '직접 입력하면 샹크(축) 부분 중량만 계산합니다(헤드 중량은 미포함 — 화면에 안내 문구로 표시됩니다).',
  },
  {
    title: '강재 등급 (Materials)',
    body: 'ASTM / KS 강재 등급별 항복강도(Fy)·인장강도(Fu) 등 재료 물성을 정리한 참고표입니다.',
  },
  {
    title: 'UNIT CONVERSION (단위 환산)',
    body: '헤더의 "UNIT CONVERSION" 버튼을 누르면 힘·응력·모멘트·등분포하중 등 미국(kip, ksi, psf...)·한국(kN, MPa, kN/m...) '
      + '단위를 실시간으로 서로 환산해주는 계산기가 열립니다. 값을 어느 칸에 입력해도 같은 줄의 다른 단위 값이 즉시 갱신됩니다.',
  },
  {
    title: '물량 산정 (BOM)',
    body: '헤더의 "물량 산정" 버튼은 각 상세 페이지의 "+ 물량에 담기"로 모아온 부재들의 목록(길이·등급·수량 입력 가능)을 보여주고, '
      + '총 중량을 자동 합산합니다. 표 복사/CSV 내보내기로 다른 문서에 바로 붙여넣을 수 있고, 실수로 전체를 비우지 않도록 확인 절차가 있습니다.',
  },
  {
    title: '검색 / 계산기 / 피드백',
    body: '헤더의 검색창은 전체 데이터베이스를 규격명으로 즉시 검색합니다. "계산기" 버튼은 Windows 기본 계산기를 엽니다(브라우저 권한 팝업이 뜰 수 있습니다). '
      + '"피드백" 버튼은 오류 제보·개선 요청을 새 창의 구글 폼으로 보낼 수 있게 합니다.',
  },
];

export default function UsageGuideModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 760 }}>
        <div className="modal-head">
          <h2>사용법 — 사이드바 항목별 안내</h2>
          <button className="modal-close" onClick={onClose} aria-label="닫기">×</button>
        </div>
        <div className="modal-body usage-guide-body">
          {SECTIONS.map((s) => (
            <section key={s.title} className="usage-guide-section">
              <h3>{s.title}</h3>
              <p>{s.body}</p>
            </section>
          ))}
        </div>
        <div className="modal-foot">
          <button className="back" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}
