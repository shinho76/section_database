import { useStore, DB_TYPES } from './store.js';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import ShapeList from './components/ShapeList.jsx';
import ShapeDetail from './components/ShapeDetail.jsx';
import SearchResults from './components/SearchResults.jsx';
import BuiltUpBuilder from './components/builtup/BuiltUpBuilder.jsx';
import PurlinView from './components/PurlinView.jsx';
import MetalDeckView from './components/MetalDeckView.jsx';
import RebarView from './components/RebarView.jsx';

export default function App() {
  const { activeKey, shape, query } = useStore();

  let main;
  if (query.trim()) {
    // The search box always searches the full inventory, independent of
    // whichever sidebar item is currently selected.
    main = <SearchResults />;
  } else if (DB_TYPES.has(activeKey)) {
    main = shape ? <ShapeDetail shape={shape} /> : <ShapeList />;
  } else if (activeKey === 'BH') {
    main = <BuiltUpBuilder />;
  } else if (activeKey === 'PURLIN-CEE' || activeKey === 'PURLIN-ZEE') {
    main = <PurlinView variant={activeKey} />;
  } else if (activeKey === 'METALDECK') {
    main = <MetalDeckView />;
  } else if (activeKey === 'REBAR') {
    main = <RebarView />;
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
