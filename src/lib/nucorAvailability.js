// Nucor-Yamato Steel Company W-shape production availability, "Product List
// — March 2026" (https://nucoryamato.com/StaticData/product.pdf) plus a
// separately-supplied long-lead/impact-estimated annotation list. Scoped to
// type 'W' only — this is the only series both source lists cover; other
// AISC types have no availability data and always return null (no color).
//
// Three tiers, from the user-supplied HTML/CSS color reference table:
//   longlead  Silver    #C0C0C0  — "*"  in the annotation list
//   impact    LightGray #D3D3D3  — "**" in the annotation list
//   unlisted  Gainsboro #DCDCDC  — not present in the Product List at all
// A name in the annotation list is still produced (with a caveat), so it
// takes priority over the plain "not in the product list" gray.

const LONG_LEAD_IMPACT_RAW = `
W44X408*
W44X368*
W44X335*
W44X290*
W44X262*
W44X230*
W40X655*
W40X593*
W40X503**
W40X431*
W40X397**
W40X372*
W40X362*
W40X324*
W40X297**
W40X277*
W40X249*
W40X215*
W40X199*
W40X392**
W40X331*
W40X327*
W40X294*
W40X278*
W40X264*
W40X235*
W40X211*
W40X183*
W40X167*
W40X149*
W36X925*
W36X853*
W36X802*
W36X723*
W36X652**
W36X529**
W36X487*
W36X441*
W36X395**
W36X361**
W36X330*
W36X302**
W36X282*
W36X262*
W36X247*
W36X231*
W36X387*
W36X350*
W36X318*
W36X286*
W33X387*
W33X354*
W33X318*
W33X291*
W33X263**
W33X241**
W33X221**
W33X201**
W30X391*
W30X357*
W30X326*
W30X292*
W30X261*
W30X235*
W30X211*
W30X191*
W30X173*
W27X539*
W27X368*
W27X336*
W27X307*
W27X281*
W27X258*
W24X370*
W24X335*
W24X306*
W18X311*
W18X283*
W14X873*
W14X808*
W14X730*
W14X665*
W14X605*
W14X550**
W14X500**
W14X455*
W14X426*
W14X398**
W14X370**
W14X342**
W12X336*
W12X305*
`;

const PRODUCT_LIST_RAW = `
W44 (x 16) x 230, 262, 290, 335, 368, 408
W40 (x 16) x 199, 215, 249, 277, 297, 324, 362, 372, 397, 431, 503, 593, 655
W40 (x 11-3/4) x 149, 167, 183, 211, 235, 264, 278, 294, 327, 392
W36 (x 16-1/2) x 231, 247, 262, 282, 302, 330, 361, 395, 441, 487, 529, 652
W36 (x 12) x 135, 150, 160, 170, 182, 194, 210, 232, 256, 286, 318, 350, 387
W33 (x 15-3/4) x 201, 221, 241, 263, 291, 318, 354, 387
W33 (x 11-1/2) x 118, 130, 141, 152, 169
W30 (x 15) x 173, 191, 211, 235, 261, 292, 326, 357, 391, 433
W30 (x 10-1/2) x 90, 99, 108, 116, 124, 132, 148
W27 (x 14) x 146, 161, 178, 194, 217, 235, 258, 281, 307, 336, 368, 539
W27 (x 10) x 84, 94, 102, 114, 129
W24 (x 12-3/4) x 104, 117, 131, 146, 162, 176, 192, 207, 229, 250, 279, 306, 335, 370
W24 (x 9) x 68, 76, 84, 94, 103
W24 (x 9) x 56, 61 (Canada – CSA Sections)
W24 (x 7) x 55, 62
W21 (x 12-1/4) x 101, 111, 122, 132, 147, 166, 182, 201, 223, 248, 275
W21 (x 8-1/4) x 48, 55, 62, 68, 73, 83, 93
W21 (x 6-1/2) x 44, 50, 57
W18 (x 11) x 76, 86, 97, 106, 119, 130, 143, 158, 175, 192, 211, 234, 258, 283, 311
W18 (x 7-1/2) x 50, 55, 60, 65, 71
W18 (x 7-1/2) x 41, 45 (Canada - CSA Sections)
W18 (x 6) x 35, 40, 46
W16 (x 10-1/4) x 67, 77, 89, 100
W16 (x 7) x 36, 40, 45, 50, 57
W16 (x 5-1/2) x 26, 31
W14 (x 16) x 145, 159, 176, 193, 211, 233, 257, 283, 311, 342, 370, 398, 426, 455, 500, 550, 605, 665, 730, 808, 873
W14 (x 14-1/2) x 90, 99, 109, 120, 132
W14 (x 10) x 61, 68, 74, 82
W14 (x 8) x 43, 48, 53
W14 (x 6-3/4) x 30, 34, 38
W14 (x 5) x 22, 26
W12 (x 12) x 65, 72, 79, 87, 96, 106, 120, 136, 152, 170, 190, 210, 230, 252, 279, 305, 336
W12 (x 10) x 53, 58
W12 (x 8) x 40, 45, 50
W12 (x 6-1/2) x 26, 30, 35
W12 (x 4) x 16, 19, 22
W10 (x 10) x 49, 54, 60, 68, 77, 88, 100, 112
W10 (x 8) x 33, 39, 45
W10 (x 5-3/4) x 22, 26, 30
W8 (x 8) x 31, 35, 40, 48, 58, 67
W8 (x 6-1/2) x 24, 28
W8 (x 5-1/4) x 18, 21
W6 (x 6) x 15, 20, 25
`;

function parseAsterisks(raw) {
  const longLead = new Set();
  const impact = new Set();
  for (const line of raw.trim().split('\n')) {
    const t = line.trim();
    if (!t) continue;
    const m = t.match(/^([A-Z0-9.]+)(\*{1,2})$/);
    if (!m) continue;
    const [, name, stars] = m;
    (stars.length === 2 ? impact : longLead).add(name);
  }
  return { longLead, impact };
}

function parseProductList(raw) {
  const available = new Set();
  for (const line of raw.trim().split('\n')) {
    const t = line.trim();
    if (!t) continue;
    const m = t.match(/^W\s*(\d+)\s*\([^)]*\)\s*x\s*(.+)$/i);
    if (!m) continue;
    const [, depth, rest] = m;
    const weightsPart = rest.replace(/\([^)]*\)/g, '');
    for (const w of weightsPart.split(',')) {
      const num = w.trim();
      if (num) available.add(`W${depth}X${num}`);
    }
  }
  return available;
}

const { longLead: LONG_LEAD, impact: IMPACT } = parseAsterisks(LONG_LEAD_IMPACT_RAW);
const AVAILABLE = parseProductList(PRODUCT_LIST_RAW);

export const AVAIL_COLOR = {
  longlead: '#C0C0C0',
  impact: '#D3D3D3',
  unlisted: '#DCDCDC',
};

export const AVAIL_LABEL = {
  longlead: 'Long lead (Nucor-Yamato Product List)',
  impact: 'Impact estimated (Nucor-Yamato Product List)',
  unlisted: 'Not in Nucor-Yamato Product List (March 2026)',
};

/** Availability tier for `name` under `type`, or null if no data applies
 * (every type other than 'W', or a W-shape with no caveat). */
export function nucorAvailability(type, name) {
  if (type !== 'W') return null;
  if (LONG_LEAD.has(name)) return 'longlead';
  if (IMPACT.has(name)) return 'impact';
  if (!AVAILABLE.has(name)) return 'unlisted';
  return null;
}
