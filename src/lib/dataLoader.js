const TYPE_FILE = {
  W: 'w', M: 'm', S: 's', HP: 'hp', WT: 'wt', MT: 'mt', ST: 'st',
  HSS: 'hss', PIPE: 'pipe', L: 'l', '2L': '2l', C: 'c', MC: 'mc',
};

const typeCache = new Map();
let searchIndex = null;

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

const norm = (s) => (s || '').toString().toUpperCase().replace(/\s/g, '');

export async function findByQuery(query) {
  const q = norm(query);
  if (!q) return null;
  const idx = await loadSearchIndex();
  const hit = idx.find(
    (s) => norm(s.name) === q || norm(s.edi) === q || norm(s.ks) === q,
  );
  if (!hit) return null;
  const rows = await loadType(hit.type);
  return rows.find((s) => s.name === hit.name) || null;
}

export async function searchType(type, query) {
  const rows = await loadType(type);
  const q = norm(query);
  if (!q) return rows;
  return rows.filter(
    (s) => norm(s.name).includes(q) || norm(s.ks).includes(q),
  );
}

export async function loadDefs() {
  const mod = await import('../data/defs.json');
  return mod.default;
}
