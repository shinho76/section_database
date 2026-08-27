import { create } from 'zustand';

// Top grid: category spine | AISC column | KS column (rowspan when the KS
// side has fewer sub-types than the AISC side), per SIDEBAR.dxf layout.
export const GRID_GROUPS = [
  { label: 'H-SHAPE', aisc: ['W', 'M', 'S', 'HP'], ks: ['KSH'] },
  { label: 'TEES', aisc: ['WT', 'MT', 'ST'], ks: ['KST'] },
  { label: 'HOLLOW', aisc: ['HSS', 'PIPE'], ks: ['KSB', 'KSP'] },
  { label: 'ANGLES', aisc: ['L', '2L'], ks: ['KSL'] },
  { label: 'CHANNELS', aisc: ['C', 'MC'], ks: ['KSC'] },
];

// Below the grid: single-column groups with no AISC/KS split.
// PLATE is listed first so it sits directly under the CHANNELS row of the grid above.
export const BELOW_GROUPS = [
  { label: 'PLATE', items: ['PLATE-AVAILABLE', 'PLATE', 'PLATE-CHECKED-ASTM', 'PLATE-CHECKED-KS'] },
  { label: 'BUILT-UP H-SECTION', items: ['BH-1', 'BH-2', 'BH-3', 'BH-4'] },
  { label: 'PURLIN', items: ['PURLIN-CEE', 'PURLIN-ZEE'] },
  { label: 'METAL DECK', items: ['METALDECK'] },
  { label: 'REINFORCEMENT', items: ['REBAR', 'WWR'] },
];

// Short sidebar labels for BELOW_GROUPS items whose key isn't already readable.
export const NAV_ITEM_LABEL = {
  PLATE: 'Plate',
  'PLATE-AVAILABLE': 'Plate Stock Availability',
  'PLATE-CHECKED-ASTM': 'Checked Plate (ASTM A786)',
  'PLATE-CHECKED-KS': 'Checked Plate (KS D 3568)',
  'BH-1': 'Built-up H-Shape',
  'BH-2': 'Unequal Built-up H-Shape',
  'BH-3': 'Rolled : H+T-Bar',
  'BH-4': 'Built-up : H+T-Bar',
  'PURLIN-CEE': 'Purlin-CEE', 'PURLIN-ZEE': 'Purlin-ZEE',
  METALDECK: 'Metal Deck', REBAR: 'Rebar', WWR: 'WWR (Welded Wire Reinforcement)',
};

export const DB_TYPES = new Set([
  'W', 'M', 'S', 'HP', 'WT', 'MT', 'ST', 'HSS', 'PIPE', 'L', '2L', 'C', 'MC',
  'KSH', 'KSL', 'KSP', 'KST', 'KSB', 'KSC',
]);

export const TYPE_LABEL = {
  W: 'W — Wide Flange', M: 'M — Miscellaneous', S: 'S — American Standard',
  HP: 'HP — Bearing Pile', WT: 'WT — Tee (from W)', MT: 'MT — Tee (from M)',
  ST: 'ST — Tee (from S)', HSS: 'HSS — Hollow Section', PIPE: 'PIPE — Steel Pipe',
  L: 'L — Angle', '2L': '2L — Double Angle', C: 'C — Channel', MC: 'MC — Misc. Channel',
  PLATE: 'Plate (강판)',
  'BH-1': 'Built-up H-Section', 'BH-2': 'Unequal Flange Built-up H-Section',
  'BH-3': 'Rolled H-Section + T-Bar', 'BH-4': 'Built-up H-Shape + T-Bar',
  'PURLIN-CEE': 'Purlin-CEE', 'PURLIN-ZEE': 'Purlin-ZEE',
  METALDECK: 'Metal Deck', REBAR: 'Rebar',
  KSH: 'KS H Section — H형강 (KS D 3502)', KSL: 'KS L Section — 등변앵글 (KS D 3502)',
  KSP: 'KS P Section — 원형강관 (KS D 3502)', KST: 'KS T Section — T형강 (KS D 3502)',
  KSB: 'KS B Section — 각형강관 (KS D 3502)', KSC: 'KS C Section — ㄷ형강 (KS D 3502)',
};

// Short "KS <X> Section" name for raw type codes shown in badges/chips
// (e.g. the shape-detail "Type" chip, search result rows) — everywhere a
// bare code like "KSP" would otherwise be printed to the user.
export const TYPE_DISPLAY = {
  KSH: 'KS H Section', KSL: 'KS L Section', KSP: 'KS P Section',
  KST: 'KS T Section', KSB: 'KS B Section', KSC: 'KS C Section',
};
export const displayType = (t) => TYPE_DISPLAY[t] || t;

export const useStore = create((set) => ({
  activeKey: 'W',
  shape: null,
  theme: 'dark',
  query: '',
  setActiveKey: (key) => set({ activeKey: key, shape: null }),
  selectShape: (shape) => set({ shape }),
  setQuery: (query) => set({ query }),
  toggleTheme: () => set((s) => {
    const next = s.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    return { theme: next };
  }),
}));
