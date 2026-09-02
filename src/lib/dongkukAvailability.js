// KS shapes (KSH/KSC/KSL) carry a `dongkuk.available` flag scraped from
// Dongkuk Steel's published product catalog (see ksh.json/ksc.json/ksl.json
// build history) — true/false means the size is confirmed present/absent in
// that catalog's "생산가능 사이즈" tables, null means not cross-checked yet.
// Unlike nucorAvailability (which looks a name up in a separate product
// list), this reads a field already embedded on the shape record.
export const DONGKUK_LABEL = {
  true: '동국제강 카탈로그에 등재된 생산 가능 규격입니다.',
  false: '동국제강 카탈로그의 생산가능 목록에 없는 규격입니다 (타 제강사·주문생산 확인 필요).',
};

export function dongkukAvailable(shape) {
  return shape?.dongkuk?.available ?? null;
}
