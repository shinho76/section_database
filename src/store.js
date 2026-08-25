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
export const BELOW_GROUPS = [
  { label: 'BUILT-UP', items: ['BH'] },
  { label: 'PURLIN', items: ['PURLIN-CEE', 'PURLIN-ZEE'] },
  { label: 'METAL DECK', items: ['METALDECK'] },
  { label: 'REBAR', items: ['REBAR'] },
];

export const DB_TYPES = new Set([
  'W', 'M', 'S', 'HP', 'WT', 'MT', 'ST', 'HSS', 'PIPE', 'L', '2L', 'C', 'MC',
  'KSH', 'KSL', 'KSP', 'KST', 'KSB', 'KSC',
]);

export const TYPE_LABEL = {
  W: 'W — Wide Flange', M: 'M — Miscellaneous', S: 'S — American Standard',
  HP: 'HP — Bearing Pile', WT: 'WT — Tee (from W)', MT: 'MT — Tee (from M)',
  ST: 'ST — Tee (from S)', HSS: 'HSS — Hollow Section', PIPE: 'PIPE — Steel Pipe',
  L: 'L — Angle', '2L': '2L — Double Angle', C: 'C — Channel', MC: 'MC — Misc. Channel',
  BH: 'BH — Built-up H (조립단면)',
  'PURLIN-CEE': 'Purlin-CEE', 'PURLIN-ZEE': 'Purlin-ZEE',
  METALDECK: 'Metal Deck', REBAR: 'Rebar',
  KSH: 'H — H형강 (KS D 3502)', KSL: 'L — 등변앵글 (KS D 3502)',
  KSP: 'P — 원형강관 (KS D 3502)', KST: 'T — T형강 (KS D 3502)',
  KSB: 'B — 각형강관 (KS D 3502)', KSC: 'C — ㄷ형강 (KS D 3502)',
};

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
