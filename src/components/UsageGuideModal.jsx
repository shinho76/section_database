// Reference/help content only — no calculation logic. Grouped to mirror the
// sidebar's own GRID_GROUPS/BELOW_GROUPS structure so a user can map "what I
// see in the sidebar" to "what it does" one-to-one.
const SECTIONS = [
  {
    title: '전체 DB 통합검색',
    body: '헤더 중앙의 검색창은 AISC·KS 규격 전체와 강판·배근재·환봉·패스너 등 모든 참고 자재를 한꺼번에 대상으로 검색합니다. '
      + '사이드바를 몇 단계씩 눌러 들어갈 필요 없이, AISC 라벨("W24X76")·EDI 표준명·KS 규격 표기("H-400X200") 중 아는 표기를 '
      + '그대로 입력하면 즉시 결과가 뜹니다. 결과 표는 Label / KS designation / Type을 한 행에 함께 보여주므로, 검색 한 번으로 '
      + '"이 자재의 KS 대응 규격이 뭔지"까지 바로 확인됩니다. 행을 클릭하면 검색어를 지우고 바로 해당 상세 페이지로 이동합니다. '
      + '결과가 300개를 넘으면 상위 300개만 표시되니 검색어를 좀 더 구체적으로 좁혀서 원하는 항목을 빠르게 좁혀가면 됩니다.',
  },
  {
    title: 'H형강 / T형강 / 각형강관·원형강관 / 앵글 / 채널 (AISC ↔ KS)',
    body: '사이드바 상단 격자는 AISC(미국)와 KS(한국) 규격을 같은 줄에 나란히 배치해, 같은 부재 계열이라면 어느 쪽에서 클릭하든 '
      + '같은 화면 위치에서 바로 찾을 수 있도록 했습니다. 항목을 클릭하면 해당 규격의 전체 목록이 뜨고, 목록에서 사이즈를 클릭하면 '
      + '치수·단면성능(단면적, 관성모멘트, 단면계수, 회전반경, 비틀림상수 등)과 단위중량을 함께 보여주는 상세 페이지로 이동합니다. '
      + '상세 페이지의 "+ 물량에 담기" 버튼으로 해당 부재를 바로 물량 산정(BOM) 목록에 추가할 수 있어, 목록을 보다가 계산기나 '
      + '엑셀로 옮겨 적을 필요가 없습니다.\n\n'
      + '목록의 각 행에는 "가장 치수가 근접한 반대쪽 규격(AISC→KS 또는 KS→AISC)"으로 바로 이동하는 링크가 붙어 있습니다. '
      + '클릭하면 두 부재의 단면 형상(SVG)과 치수, 단위중량은 물론 A·Ix·Sx·Zx·rx·Iy·ry·J 같은 단면성능까지 한 화면에 나란히 '
      + '비교해 보여줍니다. 치수만 비슷하고 실제 성능(단면계수 등)은 부족한 "겉만 비슷한" 대체재를 걸러낼 수 있고, 프로젝트 도중 '
      + '규격 표기가 AISC↔KS로 바뀌더라도 무엇이 실질적으로 등가인지 몇 초 안에 파악할 수 있습니다.\n\n'
      + 'W형강 목록에는 Nucor-Yamato 재고 가능 등급(★/제조사 표기) 필터가, KS H/L/C형강 목록에는 "자재수급확인 품목 제외" '
      + '체크박스가 있어 실제 조달 가능한 사이즈만 걸러서 볼 수 있습니다 — 설계 단계에서 재고에 없는 사이즈를 잡아 나중에 '
      + '설계변경이 나는 상황을 미리 막기 위한 기능입니다. PIPE 항목 옆의 ℹ️ 아이콘을 누르면 Pipe와 HSS(Round)가 겉보기엔 '
      + '비슷해도 재료 규격·강도·호칭 방식이 서로 다르다는 점을 표로 바로 확인할 수 있습니다.',
  },
  {
    title: '빌트업 H형강 (Built-up H-Section)',
    body: '플랜지/웨브 판 두께·폭을 직접 입력해 원하는 사이즈의 빌트업 H형강을 구성하면, 단위중량과 단면성능(Ix, Sx, rx 등)을 '
      + '따로 계산기를 두드릴 필요 없이 입력과 동시에 자동으로 보여줍니다. "Unequal Built-up H-Shape"는 상하 플랜지 크기가 다른 '
      + '빌트업을, "Rolled : H+T-Bar" / "Built-up : H+T-Bar"는 기성 H형강(또는 빌트업)에 T형강을 보강재로 덧댄 조합 단면을 '
      + '계산합니다. 입력에 쓰이는 판 두께·폭은 임의 숫자가 아니라 실제 조달 가능한 규격 목록에서만 고르도록 되어 있어, 계산은 '
      + '맞는데 실제로는 구할 수 없는 판재로 설계해버리는 실수를 막아줍니다. 계산된 부재도 상세 화면과 동일하게 물량에 바로 담을 수 있습니다.',
  },
  {
    title: '퍼린 (Purlin CEE / ZEE)',
    body: 'CEE/ZEE 형강 경량 퍼린의 규격별 치수와 단위중량을 조회합니다. 지붕·벽체 골조 초기 물량 산정에 바로 활용할 수 있도록, '
      + '규격을 찾는 즉시 단위중량이 함께 표시됩니다.',
  },
  {
    title: '강판 (Plate)',
    body: '"Plate Weight"는 두께×폭×길이를 입력하면 단위중량·총중량을 즉시 계산합니다. "Plate Stock Availability"는 실제 재고 '
      + '가능한 두께/규격만 모아 보여주어 구하기 어려운 두께를 먼저 걸러낼 수 있고, "Checked Plate"(ASTM A786 / 국내 제조사 규격)는 '
      + '조달처가 확인된 판재 목록이라 별도 확인 없이 바로 채택해도 되는 안전한 목록입니다. "Metal Deck"은 데크 플레이트의 '
      + '규격별 단위중량을 조회합니다.',
  },
  {
    title: '배근재 (Rebar / WWR)',
    body: 'Rebar는 철근 호칭별(D10, D13...) 단위중량과 단면적을, WWR(용접철망)은 규격별 중량 데이터를 제공해 철근·배근 물량도 '
      + '철골과 같은 화면·같은 방식으로 조회·집계할 수 있습니다.',
  },
  {
    title: '환봉 (Rod Bar)',
    body: 'KS(SS275) / ASTM(A36) 규격 환봉의 지름별 단위중량을 조회합니다. 국내·해외 프로젝트 어느 쪽 규격으로 발주하든 같은 화면에서 확인할 수 있습니다.',
  },
  {
    title: '패스너 (Bolt / Anchor Bolt / Stud)',
    body: '고장력볼트(ASTM F3125 / KS B 1010·2819)의 규격·등급별 중량, 앵커볼트(ASTM F1554)의 규격별 중량을 조회합니다. '
      + 'Shear Stud는 AWS D1.1 기준 규격을 조회하되, 스터드 길이는 카탈로그 항목이 아니라 현장·설계마다 다르므로 행마다 길이(mm)를 '
      + '직접 입력하면 그 자리에서 샹크(축) 부분 중량을 계산합니다(헤드 중량은 미포함 — 화면에 안내 문구로 표시됩니다).',
  },
  {
    title: '강재 등급 (Materials)',
    body: 'ASTM / KS 강재 등급별 항복강도(Fy)·인장강도(Fu) 등 재료 물성을 정리한 참고표입니다. 규격서를 따로 뒤지지 않아도 '
      + '설계에 필요한 재료값을 한 화면에서 바로 대조해 볼 수 있습니다.',
  },
  {
    title: 'UNIT CONVERSION (단위 환산)',
    body: '헤더의 "UNIT CONVERSION" 버튼을 누르면 힘·응력·모멘트·등분포하중 등 미국(kip, ksi, psf, ft-kip...)과 한국(kN, MPa, '
      + 'kN/m, kN-m...) 단위를 실시간으로 서로 환산해주는 계산기가 열립니다. 카테고리 하나에 값을 한 칸이라도 입력하면 같은 줄의 '
      + '나머지 단위 값이 모두 즉시 갱신되므로, 별도 변환 공식을 찾거나 계산기를 여러 번 두드릴 필요 없이 인치·피트 단위를 '
      + '국내 단위 감각으로 바로 읽을 수 있습니다.',
  },
  {
    title: '물량 산정 (BOM)',
    body: '헤더의 "물량 산정" 버튼은 각 상세/계산 페이지의 "+ 물량에 담기"로 모아온 부재들의 목록(길이·등급·수량 입력 가능)을 '
      + '보여주고, 총 중량을 자동 합산합니다. 표 복사/CSV 내보내기로 엑셀 등 다른 문서에 바로 붙여넣을 수 있어, 규격 검색부터 '
      + '물량 집계까지 이 사이트 안에서 한 번에 끝낼 수 있습니다. 실수로 전체를 비우지 않도록 확인 절차가 붙어 있습니다.',
  },
  {
    title: '계산기 / 피드백',
    body: '"계산기" 버튼은 Windows 기본 계산기를 엽니다(브라우저 권한 팝업이 뜰 수 있습니다). "피드백" 버튼은 오류 제보·개선 '
      + '요청을 새 창의 구글 폼으로 바로 보낼 수 있게 합니다.',
  },
];

export default function UsageGuideModal({ onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 820 }}>
        <div className="modal-head">
          <h2>사용법 — 사이드바 항목별 안내</h2>
          <button className="modal-close" onClick={onClose} aria-label="닫기">×</button>
        </div>
        <div className="modal-body usage-guide-body">
          <p className="usage-guide-source">
            데이터 출처: AISC 규격은 <b>AISC Steel Construction Manual Database V16.0</b>, KS 형강(H·L·T·C)은
            <b> KS D 3502 : 2022</b> 기준입니다. 각형·원형강관 등 그 외 KS 항목은 상세 페이지에 표기된
            개별 표준(KS D 3568, KS D 3566, KS D 3507 등)을 따릅니다.
          </p>
          {SECTIONS.map((s) => (
            <section key={s.title} className="usage-guide-section">
              <h3>{s.title}</h3>
              {s.body.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
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
