import { create } from 'zustand';

// Top grid: category spine | AISC column | KS column (rowspan when the KS
// side has fewer sub-types than the AISC side), per SIDEBAR.dxf layout.
export const GRID_GROUPS = [
  { label: 'H-SHAPE', aisc: ['W', 'M', 'S', 'HP'], ks: ['KSH'] },
  { label: 'TEES', aisc: ['WT', 'MT', 'ST'], ks: ['KST'] },
  { label: 'HOLLOW', aisc: ['HSS-BOX', 'HSS-ROUND', 'PIPE'], ks: ['KSB', 'KSP', 'KSPP'] },
  { label: 'ANGLES', aisc: ['L', '2L'], ks: ['KSL'] },
  { label: 'CHANNELS', aisc: ['C', 'MC'], ks: ['KSC'] },
];

// Short labels for grid cells whose typeKey is too long to fit as-is.
export const GRID_CELL_LABEL = { 'HSS-BOX': 'HSS-B', 'HSS-ROUND': 'HSS-R', KSPP: 'PIPE' };

// Below the grid: single-column groups with no AISC/KS split.
// PLATE is listed first so it sits directly under the CHANNELS row of the grid above.
export const BELOW_GROUPS = [
  { label: 'BUILT-UP H-SECTION', items: ['BH-1', 'BH-2', 'BH-3', 'BH-4'] },
  { label: 'PURLIN', items: ['PURLIN-CEE', 'PURLIN-ZEE'] },
  { label: 'PLATE', items: ['PLATE-AVAILABLE', 'PLATE', 'PLATE-CHECKED-ASTM', 'PLATE-CHECKED-KS', 'METALDECK'] },
  { label: 'REINFORCEMENT', items: ['REBAR', 'WWR'] },
  { label: 'ROD BAR', items: ['RODBAR-KS', 'RODBAR-ASTM'] },
  { label: 'FASTENERS', items: ['BOLT-ASTM', 'BOLT-KS', 'ANCHORBOLT', 'STUD'] },
  { label: 'MATERIALS', items: ['MATERIALS-ASTM', 'MATERIALS-KS'] },
];

// Short sidebar labels for BELOW_GROUPS items whose key isn't already readable.
export const NAV_ITEM_LABEL = {
  PLATE: 'Plate',
  'PLATE-AVAILABLE': 'Plate Stock Availability',
  'PLATE-CHECKED-ASTM': 'Checked Plate (ASTM A786)',
  'PLATE-CHECKED-KS': 'Checked Plate (KR 제조사 규격)',
  'BH-1': 'Built-up H-Shape',
  'BH-2': 'Unequal Built-up H-Shape',
  'BH-3': 'Rolled : H+T-Bar',
  'BH-4': 'Built-up : H+T-Bar',
  'PURLIN-CEE': 'Purlin-CEE', 'PURLIN-ZEE': 'Purlin-ZEE',
  METALDECK: 'Metal Deck', REBAR: 'Rebar', WWR: 'WWR (Welded Wire Reinforcement)',
  'RODBAR-KS': 'Rod Bar (KS SS275)',
  'RODBAR-ASTM': 'Rod Bar (ASTM A36)',
  'BOLT-ASTM': 'High-Strength Bolt (ASTM F3125)',
  'BOLT-KS': 'High-Strength Bolt (KS B 1010/2819)',
  ANCHORBOLT: 'Anchor Bolt (ASTM F1554)',
  STUD: 'Shear Stud (AWS D1.1)',
  'MATERIALS-ASTM': 'Steel Grades (ASTM)',
  'MATERIALS-KS': 'Steel Grades (KS)',
};

export const DB_TYPES = new Set([
  'W', 'M', 'S', 'HP', 'WT', 'MT', 'ST', 'HSS-BOX', 'HSS-ROUND', 'PIPE', 'L', '2L', 'C', 'MC',
  'KSH', 'KSL', 'KSP', 'KSPP', 'KST', 'KSB', 'KSC',
]);

export const TYPE_LABEL = {
  W: 'W — Wide Flange', M: 'M — Miscellaneous', S: 'S — American Standard',
  HP: 'HP — Bearing Pile', WT: 'WT — Tee (from W)', MT: 'MT — Tee (from M)',
  ST: 'ST — Tee (from S)',
  'HSS-BOX': 'HSS — Rectangular/Square Hollow Section',
  'HSS-ROUND': 'HSS — Round Hollow Section',
  PIPE: 'PIPE — Steel Pipe',
  L: 'L — Angle', '2L': '2L — Double Angle', C: 'C — Channel', MC: 'MC — Misc. Channel',
  PLATE: 'Plate (강판)',
  'BH-1': 'Built-up H-Section', 'BH-2': 'Unequal Flange Built-up H-Section',
  'BH-3': 'Rolled H-Section + T-Bar', 'BH-4': 'Built-up H-Shape + T-Bar',
  'PURLIN-CEE': 'Purlin-CEE', 'PURLIN-ZEE': 'Purlin-ZEE',
  METALDECK: 'Metal Deck', REBAR: 'Rebar',
  KSH: 'KS H Section — H형강 (KS D 3502)', KSL: 'KS L Section — 등변앵글 (KS D 3502)',
  KSP: 'KS P Section — 원형강관, 구조용 (KS D 3566)', KST: 'KS T Section — T형강 (KS D 3502)',
  KSB: 'KS B Section — 각형강관 (KS D 3568)', KSC: 'KS C Section — ㄷ형강 (KS D 3502)',
  KSPP: 'KS SPP Section — 배관용 탄소강관 (KS D 3507)',
};

// Real KS standard number per type — H/L/T/C (rolled shapes) all fall under
// the umbrella "형강" standard KS D 3502, but the two welded-tube types are
// governed by separate standards: KSB (square/rect tube) by KS D 3568, KSP
// (round tube) by KS D 3566. Verified against standard.go.kr / KSSN listings
// — do not fold these back into a single constant without re-checking.
export const KS_STANDARD = {
  KSH: 'KS D 3502:2022', KSL: 'KS D 3502:2022', KST: 'KS D 3502:2022', KSC: 'KS D 3502:2022',
  KSB: 'KS D 3568', KSP: 'KS D 3566', KSPP: 'KS D 3507',
};

// Short "KS <X> Section" name for raw type codes shown in badges/chips
// (e.g. the shape-detail "Type" chip, search result rows) — everywhere a
// bare code like "KSP" would otherwise be printed to the user.
export const TYPE_DISPLAY = {
  KSH: 'KS H Section', KSL: 'KS L Section', KSP: 'KS P Section',
  KST: 'KS T Section', KSB: 'KS B Section', KSC: 'KS C Section',
  KSPP: 'KS SPP Section', 'HSS-BOX': 'HSS Box', 'HSS-ROUND': 'HSS Round', HSS: 'HSS',
};
export const displayType = (t) => TYPE_DISPLAY[t] || t;

// BOM ("적산 바구니"): a cross-page basket of shapes the user is collecting
// for a quantity takeoff. Persisted to localStorage so it survives reloads
// (unlike the rest of this store, which is intentionally ephemeral) — the
// whole point is to keep adding to it while browsing different shape pages.
const BOM_STORAGE_KEY = 'section-db-bom-v1';
function loadBom() {
  try {
    const raw = localStorage.getItem(BOM_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveBom(bom) {
  try { localStorage.setItem(BOM_STORAGE_KEY, JSON.stringify(bom)); } catch { /* storage unavailable */ }
}
const initialBom = loadBom();
// Must continue from the highest id already in the restored BOM, not reset
// to 1 - otherwise a new addToBom() after a reload reuses an id already
// held by a restored row, and remove/update then hit whichever row (or
// both) share that id instead of the intended one.
let bomIdSeq = initialBom.reduce((max, b) => Math.max(max, b.id ?? 0), 0) + 1;

export const useStore = create((set, get) => ({
  activeKey: 'W',
  shape: null,
  theme: 'dark',
  query: '',
  // Off-canvas sidebar toggle, only relevant at the <=900px breakpoint (the
  // sidebar is always in-flow and visible above that width, see tokens.css).
  sidebarOpen: false,
  bom: initialBom,
  bomOpen: false,
  toggleBom: () => set((s) => ({ bomOpen: !s.bomOpen })),
  closeBom: () => set({ bomOpen: false }),
  // `item` carries whatever the source page already computed: name/ks/type,
  // unitWeightKgM (kg/m — length x this = weight), and optionally
  // weldLengthMPerM/weldKgPerM for built-up sections (see compose.js).
  addToBom: (item) => set((s) => {
    const bom = [...s.bom, { id: bomIdSeq++, qty: 1, lengthM: '', ...item }];
    saveBom(bom);
    return { bom };
  }),
  removeFromBom: (id) => set((s) => {
    const bom = s.bom.filter((b) => b.id !== id);
    saveBom(bom);
    return { bom };
  }),
  updateBomItem: (id, patch) => set((s) => {
    const bom = s.bom.map((b) => (b.id === id ? { ...b, ...patch } : b));
    saveBom(bom);
    return { bom };
  }),
  clearBom: () => { saveBom([]); set({ bom: [] }); },
  setActiveKey: (key) => {
    document.getElementById('main')?.scrollTo(0, 0);
    set({ activeKey: key, shape: null, sidebarOpen: false });
    history.pushState({ activeKey: key, shape: null }, '', location.href);
  },
  selectShape: (shape) => {
    document.getElementById('main')?.scrollTo(0, 0);
    set({ shape, sidebarOpen: false });
    history.pushState({ activeKey: get().activeKey, shape }, '', location.href);
  },
  setQuery: (query) => set({ query }),
  toggleTheme: () => set((s) => {
    const next = s.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    return { theme: next };
  }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  closeSidebar: () => set({ sidebarOpen: false }),
}));

// This is a single-page app with no router/URL changes — every navigation
// (type switch, shape select) previously only updated in-memory Zustand
// state, invisible to the browser's history stack. That made the browser's
// own Back button skip straight past every in-app view and leave the site
// entirely (to whatever page was open before this one), instead of
// stepping back through what the user just did here. Establish a baseline
// history entry for the initial view, and restore state on Back/Forward
// from whatever was pushed above.
if (typeof window !== 'undefined') {
  history.replaceState({ activeKey: useStore.getState().activeKey, shape: null }, '', location.href);
  window.addEventListener('popstate', (e) => {
    if (!e.state) return;
    document.getElementById('main')?.scrollTo(0, 0);
    useStore.setState({ activeKey: e.state.activeKey, shape: e.state.shape });
  });
}
