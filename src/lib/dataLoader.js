const TYPE_FILE = {
  W: 'w', M: 'm', S: 's', HP: 'hp', WT: 'wt', MT: 'mt', ST: 'st',
  HSS: 'hss', PIPE: 'pipe', L: 'l', '2L': '2l', C: 'c', MC: 'mc',
  KSH: 'ksh', KSL: 'ksl', KSP: 'ksp', KSPP: 'kspp', KST: 'kst', KSB: 'ksb', KSC: 'ksc',
};

const typeCache = new Map();
let searchIndex = null;
let ksSearchIndex = null;

export async function loadType(type) {
  if (typeCache.has(type)) return typeCache.get(type);
  let rows;
  if (type === 'HSS-BOX' || type === 'HSS-ROUND') {
    // HSS is one file (round tube has `OD`, box/square tube doesn't) split
    // into two sidebar entries so each side can be matched against its own
    // KS counterpart (KSB for box, KSP for round).
    const all = await loadType('HSS');
    rows = type === 'HSS-ROUND' ? all.filter((s) => s.us.OD) : all.filter((s) => !s.us.OD);
  } else {
    const file = TYPE_FILE[type];
    const mod = await import(`../data/${file}.json`);
    rows = mod.default;
  }
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

/** Resolve a lightweight index entry (from searchAll) to its full shape record.
 * `name` alone is not unique for KS types (multiple thickness classes can
 * share one nominal name, e.g. "H400×200" -> H-396X199X7X11 and
 * H-400X200X8X13), so match on `ks` too when the entry carries one. */
export async function resolveShape(entry) {
  const rows = await loadType(entry.type);
  if (entry.ks) {
    const byKs = rows.find((s) => s.name === entry.name && s.ks === entry.ks);
    if (byKs) return byKs;
  }
  return rows.find((s) => s.name === entry.name) || null;
}

export async function loadDefs() {
  const mod = await import('../data/defs.json');
  return mod.default;
}
