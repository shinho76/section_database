import { useStore, DB_TYPES } from './store.js';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import ShapeList from './components/ShapeList.jsx';
import ShapeDetail from './components/ShapeDetail.jsx';
import SearchResults from './components/SearchResults.jsx';
import CustomHPanel from './components/builtup/CustomHPanel.jsx';
import UnequalHPanel from './components/builtup/UnequalHPanel.jsx';
import HPlusTPanel from './components/builtup/HPlusTPanel.jsx';
import PurlinView from './components/PurlinView.jsx';
import MetalDeckView from './components/MetalDeckView.jsx';
import RebarView from './components/RebarView.jsx';
import WWRView from './components/WWRView.jsx';
import PlatePanel from './components/PlatePanel.jsx';
import AvailablePlateView from './components/AvailablePlateView.jsx';
import CheckedPlateView from './components/CheckedPlateView.jsx';
import RodBarView from './components/RodBarView.jsx';
import BoltView from './components/BoltView.jsx';
import AnchorBoltView from './components/AnchorBoltView.jsx';
import StudView from './components/StudView.jsx';
import UnitConversionView from './components/UnitConversionView.jsx';

export default function App() {
  const { activeKey, shape, query } = useStore();

  let main;
  if (query.trim()) {
    // The search box always searches the full inventory, independent of
    // whichever sidebar item is currently selected.
    main = <SearchResults />;
  } else if (DB_TYPES.has(activeKey)) {
    main = shape ? <ShapeDetail shape={shape} /> : <ShapeList />;
  } else if (activeKey === 'BH-1') {
    main = <CustomHPanel />;
  } else if (activeKey === 'BH-2') {
    main = <UnequalHPanel />;
  } else if (activeKey === 'BH-3') {
    main = <HPlusTPanel baseKind="db" />;
  } else if (activeKey === 'BH-4') {
    main = <HPlusTPanel baseKind="custom" />;
  } else if (activeKey === 'PURLIN-CEE' || activeKey === 'PURLIN-ZEE') {
    main = <PurlinView variant={activeKey} />;
  } else if (activeKey === 'METALDECK') {
    main = <MetalDeckView />;
  } else if (activeKey === 'REBAR') {
    main = <RebarView />;
  } else if (activeKey === 'WWR') {
    main = <WWRView />;
  } else if (activeKey === 'PLATE') {
    main = <PlatePanel />;
  } else if (activeKey === 'PLATE-AVAILABLE') {
    main = <AvailablePlateView />;
  } else if (activeKey === 'PLATE-CHECKED-ASTM') {
    main = <CheckedPlateView standard="astm" />;
  } else if (activeKey === 'PLATE-CHECKED-KS') {
    main = <CheckedPlateView standard="ks" />;
  } else if (activeKey === 'RODBAR-KS') {
    main = <RodBarView standard="ks" />;
  } else if (activeKey === 'RODBAR-ASTM') {
    main = <RodBarView standard="astm" />;
  } else if (activeKey === 'BOLT-ASTM') {
    main = <BoltView standard="astm" />;
  } else if (activeKey === 'BOLT-KS') {
    main = <BoltView standard="ks" />;
  } else if (activeKey === 'ANCHORBOLT') {
    main = <AnchorBoltView />;
  } else if (activeKey === 'STUD') {
    main = <StudView />;
  } else if (activeKey === 'UNITCONV') {
    main = <UnitConversionView />;
  }

  return (
    <>
      <Header />
      <div className="shell">
        <Sidebar />
        <main id="main">{main}</main>
      </div>
    </>
  );
}
