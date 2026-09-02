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

// Non-shape reference data (WWR, rebar, bolts, purlin, ...) each live in
// their own oddly-shaped JSON file and their pages don't have a per-row
// "shape" detail view the way sidebar-grid types do - searching one just
// navigates to that page (see SearchBox.jsx's goto()), it doesn't select a
// row. This index only needs a display `name` and the sidebar `type` key to
// jump to, built lazily once and cached like the shape indexes above.
let extraIndex = null;

async function buildExtraIndex() {
  const entries = [];
  const add = (name, type) => entries.push({ name, ks: '', edi: '', type });

  const [wwr, rebar, bolt, anchorbolt, stud, rodbar, purlin, metaldeck] = await Promise.all([
    import('../data/wwr.json'), import('../data/rebar.json'), import('../data/bolt.json'),
    import('../data/anchorbolt.json'), import('../data/stud.json'), import('../data/rodbar.json'),
    import('../data/purlin.json'), import('../data/metaldeck.json'),
  ].map((p) => p.then((m) => m.default).catch(() => null)));

  if (wwr) {
    for (const r of wwr.plainImperial || []) add(r.size, 'WWR');
    for (const r of wwr.deformedImperial || []) add(r.size, 'WWR');
  }
  if (rebar) for (const r of rebar.bars || []) add(r.size, 'REBAR');
  if (bolt) {
    for (const r of bolt.astm?.rows || []) add(r.label, 'BOLT-ASTM');
    for (const r of bolt.ks?.rows || []) add(r.label, 'BOLT-KS');
  }
  if (anchorbolt) for (const r of anchorbolt.sizes || []) add(r.label, 'ANCHORBOLT');
  if (stud) for (const r of stud.rows || []) add(r.label, 'STUD');
  if (rodbar) {
    for (const r of rodbar.astm?.rows || []) add(r.label, 'RODBAR-ASTM');
    for (const r of rodbar.ks?.rows || []) add(r.label ?? `D${r.diaMm}`, 'RODBAR-KS');
  }
  if (purlin) {
    for (const r of purlin.cee || []) add(`CEE-${r.d}X${r.b}X${r.ga}GA`, 'PURLIN-CEE');
    for (const r of purlin.zee || []) add(`ZEE-${r.d}X${r.b}X${r.ga}GA`, 'PURLIN-ZEE');
    for (const r of purlin.easyLapZee || []) add(`ZEL-${r.d}X${r.b1}/${r.b2}X${r.ga}GA`, 'PURLIN-ZEE');
  }
  if (metaldeck) for (const fam of metaldeck.families || []) for (const p of fam.profiles || []) add(p.name, 'METALDECK');

  return entries;
}

async function loadExtraIndex() {
  if (!extraIndex) extraIndex = buildExtraIndex();
  return extraIndex;
}

export async function searchType(type, query) {
  const rows = await loadType(type);
  const q = norm(query);
  if (!q) return rows;
  return rows.filter(
    (s) => norm(s.name).includes(q) || norm(s.ks).includes(q),
  );
}

/** Search across every AISC + KS shape *and* every other reference table in
 * the app (WWR, rebar, bolts, purlin, metal deck, ...), regardless of the
 * active sidebar selection. Returns lightweight index entries
 * {name, edi, ks, type}; entries whose `type` isn't a DB_TYPES shape type
 * don't resolve to a "shape" - SearchBox just navigates to that page. */
export async function searchAll(query) {
  const q = norm(query);
  if (!q) return [];
  const [idx, ksIdx, extraIdx] = await Promise.all([loadSearchIndex(), loadKsSearchIndex(), loadExtraIndex()]);
  return [...idx, ...ksIdx, ...extraIdx].filter(
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
