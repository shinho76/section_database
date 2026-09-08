// KSH shapes (H-beam only) carry a `hyundai.available` flag from Hyundai
// Steel's production-availability table (see 현대동국available.json /
// ksh.json build history) — true/false means the size is confirmed
// produced/not-produced by Hyundai, null means not covered by that table.
// Mirrors dongkukAvailability.js's shape but for the other mill.
export const HYUNDAI_LABEL = {
  true: '현대제철 생산가능 규격입니다.',
  false: '현대제철 생산목록에 없는 규격입니다 (타 제강사·주문생산 확인 필요).',
};

export function hyundaiAvailable(shape) {
  return shape?.hyundai?.available ?? null;
}
