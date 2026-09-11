import { useState } from 'react';
import { useStore } from '../store.js';
import UsageGuideModal from './UsageGuideModal.jsx';

/** Landing page: explains why this site exists before the user picks a
 * shape type from the sidebar, and links to the same usage guide the header
 * button opens. */
export default function HomeView() {
  const { setActiveKey } = useStore();
  const [showGuide, setShowGuide] = useState(false);

  return (
    <div className="home-view">
      <h1>Steel Weight</h1>
      <p className="home-lede">
        미국(AISC) 규격과 한국(KS) 규격 철골 자재를 같은 화면에서 비교·조회하고,
        조달 가능한 사이즈를 바로 확인할 수 있는 사이트입니다.
      </p>

      <section className="home-section home-highlight">
        <h2>전체 DB 통합검색 — 한 번에 빠르게 찾기</h2>
        <p>
          <b>상단 검색창 하나면 끝</b> — AISC·KS 전체 규격과 강판·배근재·환봉·패스너 등 모든 참고
          자재를 한꺼번에 검색합니다. 사이드바에서 카테고리를 몇 단계씩 눌러 들어갈 필요 없이,
          AISC 라벨("W24X76" 같은)이든 KS 규격 표기("H-400X200")든 아는 표기를 그대로 입력하면
          즉시 결과가 뜨고, 각 결과 행에 AISC 라벨과 대응하는 KS 규격이 나란히 표시됩니다.
          도면·계산서를 검토하다 낯선 규격명이 나왔을 때, 원하는 자재를 몇 초 안에 찾아내도록
          이 사이트에서 가장 먼저 만든 기능입니다.
        </p>
      </section>

      <section className="home-section">
        <h2>왜 만들었나</h2>
        <p>
          미국 건설 프로젝트에서는 철골 자재 사양이 국내 규격과 달라 많은 설계자들이 어려움을 겪습니다.
          국내 규격과 동급인 자재가 무엇인지, 사이즈는 어떻게 되는지 사전 교육 없이 수행하다 보니
          설계자가 실제로는 재고(stock)에 없는 자재로 설계해버리는 경우가 생기고, 이는 나중에 불필요한
          설계변경으로 이어집니다. 이 사이트는 <b>자재수급 여부를 먼저 확인한 뒤 설계할 수 있도록
          하는 것</b>이 첫 번째 목적입니다.
        </p>
        <p>
          또한 인치·피트 등 국내에서는 익숙하지 않은 단위는 볼 때마다 환산이 번거롭습니다. <b>UNIT
          CONVERSION</b> 기능으로 힘·응력·모멘트·하중 등 다양한 단위를 실시간으로 환산해
          확인할 수 있게 했습니다.
        </p>
        <p>
          초기 골조공사에서 자주 쓰는 철골 표준 규격들을 한 사이트에서 한 번에 확인할 수 있고,
          빌트업 부재가 필요할 때는 원하는 사이즈로 구성만 하면 단위중량은 물론 단면성능까지 자동
          계산됩니다 — 이때도 실제 수급 가능한 판재 사이즈만 선택할 수 있도록 되어 있습니다.
        </p>
        <p>
          최근에는 Revit 등 BIM 도구에 철골 중량을 입력하는 과정에서, 국내 단위와 미국 단위를
          서로 환산하다 보니 사용자마다 입력하는 단위중량이 조금씩 달라 자재 BOM에 누적 오차가
          쌓이는 문제도 있습니다. 이 사이트의 동일한 자료를 기준으로 입력하면 그런 오차를 줄일 수
          있습니다. 여기에 <b>물량 산정</b> 기능을 더해, 원하는 자재를 골라 담으면 총 물량을 쉽게
          집계할 수 있습니다. 여러 이해관계자가 같은 자료를 기준으로 설계해 혼선을 줄이는 것이
          이 사이트의 바람입니다.
        </p>
      </section>

      <section className="home-section">
        <h2>규격이 바뀌어도 바로 인식 — AISC ↔ KS 비교</h2>
        <p>
          설계 도중 KS 사이즈를 유사한 AISC 사이즈로 바꿔야 하는 상황은 흔하지만, "이 부재와
          가장 가까운 규격이 뭔지"를 매번 표로 대조하기는 번거롭습니다. 이 사이트는 목록에서
          <b>가장 근접한 상대 규격으로 바로 연결되는 링크</b>를 제공해, 필요할 때 가장 유사한
          AISC 규격이 무엇인지 쉽고 빠르게 찾을 수 있습니다. 클릭 한 번으로 단면 치수·형상(SVG)·
          단위중량뿐 아니라 A(단면적)·Ix·Sx·Zx·rx·Iy·ry·J 같은 단면성능까지 두 규격을 나란히
          비교해서 보여주므로, 치수만 비슷하고 성능은 부족한 "가짜 대체재"도 걸러낼 수 있습니다.
        </p>
      </section>

      <section className="home-section home-start">
        <h2>시작하기</h2>
        <p>왼쪽 사이드바에서 조회할 규격을 선택하거나, 아래에서 자주 쓰는 항목으로 바로 이동하세요.</p>
        <div className="home-quicklinks">
          <button type="button" className="hdr-pill-btn" onClick={() => setActiveKey('W')}>H형강 (AISC W)</button>
          <button type="button" className="hdr-pill-btn" onClick={() => setActiveKey('KSH')}>H형강 (KS H)</button>
          <button type="button" className="hdr-pill-btn" onClick={() => setActiveKey('BH-1')}>빌트업 H형강 만들기</button>
          <button type="button" className="hdr-pill-btn" onClick={() => setActiveKey('UNITCONV')}>단위 환산</button>
        </div>
        <button type="button" className="hdr-pill-btn is-active home-guide-btn" onClick={() => setShowGuide(true)}>
          사용법 자세히 보기
        </button>
      </section>

      {showGuide && <UsageGuideModal onClose={() => setShowGuide(false)} />}
    </div>
  );
}
