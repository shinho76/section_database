import { create } from 'zustand';

export const GROUPS = [
  { label: 'H-SHAPES', items: ['W', 'M', 'S', 'HP'] },
  { label: 'TEES', items: ['WT', 'MT', 'ST'] },
  { label: 'HOLLOW', items: ['HSS', 'PIPE'] },
  { label: 'ANGLES', items: ['L', '2L'] },
  { label: 'CHANNELS', items: ['C', 'MC'] },
  { label: 'BUILT-UP', items: ['BH'] },
  { label: 'PURLIN', items: ['PURLIN-CEE', 'PURLIN-ZEE'] },
  { label: 'METAL DECK', items: ['METALDECK'] },
  { label: 'REBAR', items: ['REBAR'] },
  { label: 'KS D 3502', items: ['KSH', 'KST', 'KSC', 'KSL', 'KSB', 'KSP'] },
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
