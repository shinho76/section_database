import { create } from 'zustand';

export const GROUPS = [
  { label: 'I-SHAPES', items: ['W', 'M', 'S', 'HP'] },
  { label: 'TEES', items: ['WT', 'MT', 'ST'] },
  { label: 'HOLLOW', items: ['HSS', 'PIPE'] },
  { label: 'ANGLES', items: ['L', '2L'] },
  { label: 'CHANNELS', items: ['C', 'MC'] },
  { label: 'BUILT-UP', items: ['BH'] },
  { label: 'PURLIN', items: ['PURLIN-CEE', 'PURLIN-ZEE'] },
  { label: 'METAL DECK', items: ['METALDECK'] },
  { label: 'REBAR', items: ['REBAR'] },
];

export const DB_TYPES = new Set([
  'W', 'M', 'S', 'HP', 'WT', 'MT', 'ST', 'HSS', 'PIPE', 'L', '2L', 'C', 'MC',
]);

export const TYPE_LABEL = {
  W: 'W — Wide Flange', M: 'M — Miscellaneous', S: 'S — American Standard',
  HP: 'HP — Bearing Pile', WT: 'WT — Tee (from W)', MT: 'MT — Tee (from M)',
  ST: 'ST — Tee (from S)', HSS: 'HSS — Hollow Section', PIPE: 'PIPE — Steel Pipe',
  L: 'L — Angle', '2L': '2L — Double Angle', C: 'C — Channel', MC: 'MC — Misc. Channel',
  BH: 'BH — Built-up H (조립단면)',
  'PURLIN-CEE': 'Purlin-CEE', 'PURLIN-ZEE': 'Purlin-ZEE',
  METALDECK: 'Metal Deck', REBAR: 'Rebar',
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
