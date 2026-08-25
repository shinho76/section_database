const TYPE_FILE = {
  W: 'w', M: 'm', S: 's', HP: 'hp', WT: 'wt', MT: 'mt', ST: 'st',
  HSS: 'hss', PIPE: 'pipe', L: 'l', '2L': '2l', C: 'c', MC: 'mc',
  KSH: 'ksh', KSL: 'ksl', KSP: 'ksp', KST: 'kst', KSB: 'ksb', KSC: 'ksc',
};

const typeCache = new Map();
let searchIndex = null;
let ksSearchIndex = null;

export async function loadType(type) {
  if (typeCache.has(type)) return typeCache.get(type);
  const file = TYPE_FILE[type];
  const mod = await import(`../data/${file}.json`);
  const rows = mod.default;
  typeCache.set(type, rows);
  return rows;
}

async function loadSearchIndex() {
  if (searchIndex) return searchIndex;
  const mod = await import('../data/index.json');
  searchIndex = mod.default;
  return searchIndex;
}

async function loadKsSearchIndex() {
  if (ksSearchIndex) return ksSearchIndex;
  const mod = await import('../data/ks_index.json');
  ksSearchIndex = mod.default;
  return ksSearchIndex;
}

const norm = (s) => (s || '').toString().toUpperCase().replace(/\s/g, '');

export async function searchType(type, query) {
  const rows = await loadType(type);
  const q = norm(query);
  if (!q) return rows;
  return rows.filter(
    (s) => norm(s.name).includes(q) || norm(s.ks).includes(q),
  );
}

/** Search across every AISC + KS shape, regardless of the active sidebar
 * selection. Returns lightweight index entries {name, edi, ks, type}. */
export async function searchAll(query) {
  const q = norm(query);
  if (!q) return [];
  const [idx, ksIdx] = await Promise.all([loadSearchIndex(), loadKsSearchIndex()]);
  return [...idx, ...ksIdx].filter(
    (s) => norm(s.name).includes(q) || norm(s.edi).includes(q) || norm(s.ks).includes(q),
  );
}

/** Resolve a lightweight index entry (from searchAll) to its full shape record. */
export async function resolveShape(entry) {
  const rows = await loadType(entry.type);
  return rows.find((s) => s.name === entry.name) || null;
}

export async function loadDefs() {
  const mod = await import('../data/defs.json');
  return mod.default;
}
