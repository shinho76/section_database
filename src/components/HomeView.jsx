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
        조달 가능한 사이즈로 바로 설계할 수 있도록 만든 참고용 사이트입니다.
      </p>

      <section className="home-section">
        <h2>왜 만들었나</h2>
        <p>
          미국 건설 프로젝트에서는 철골 자재 사양이 국내 규격과 달라 많은 설계자들이 어려움을 겪습니다.
          국내 규격과 동급인 자재가 무엇인지, 사이즈는 어떻게 되는지, 표기법은 어떤지 알기 어렵다 보니
          설계자가 실제로는 재고(stock)에 없는 자재로 설계해버리는 경우가 생기고, 이는 나중에 불필요한
          설계변경으로 이어집니다. 이 사이트는 <b>자재수급 여부를 먼저 확인하고, 수급 가능한 자재로
          사전 설계</b>하도록 도와 이런 설계변경을 줄이는 것이 첫 번째 목적입니다.
        </p>
        <p>
          또한 인치·피트 등 국내에서는 익숙하지 않은 단위는 볼 때마다 환산이 번거롭습니다. <b>UNIT
          CONVERSION</b> 기능으로 힘·응력·모멘트·하중 등 다양한 단위를 실시간으로 환산해 바로바로
          확인할 수 있게 했습니다.
        </p>
        <p>
          초기 골조공사에서 자주 쓰는 철골 표준 규격들을 한 사이트에서 한 번에 확인할 수 있고,
          빌트업 부재가 필요할 때는 원하는 사이즈로 구성만 하면 단위중량은 물론 단면성능까지 자동
          계산됩니다 — 이때도 실제 수급 가능한 판재 사이즈만 선택할 수 있도록 되어 있습니다.
        </p>
        <p>
          최근에는 Revit 등 BIM 도구에 철골 중량을 입력하는 과정에서, 국내 단위와 미국 단위를
          서로 환산하다 보니 사용자마다 입력하는 단중이 조금씩 달라 자재 BOM에 누적 오차가
          쌓이는 문제도 있습니다. 이 사이트의 동일한 자료를 기준으로 입력하면 그런 오차를 줄일 수
          있습니다. 여기에 <b>물량 산정</b> 기능을 더해, 원하는 자재를 골라 담으면 총 물량을 쉽게
          집계할 수 있습니다. 여러 이해관계자가 같은 자료를 기준으로 설계해 혼선을 줄이는 것이
          이 사이트의 바람입니다.
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
