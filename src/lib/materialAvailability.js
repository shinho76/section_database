// The "자재수급확인" (material-supply-check) badge/filter used to be driven
// purely by dongkuk.available across KSH/KSC/KSL. Now that KSH also carries
// hyundai.available (Hyundai's own production-availability table, more
// specific than the Dongkuk PDF's color-highlighted "생산가능 사이즈"), the
// badge should flag Hyundai-non-production for KSH specifically - KSC/KSL
// have no Hyundai data, so they keep falling back to dongkuk.available.
import { dongkukAvailable, DONGKUK_LABEL } from './dongkukAvailability.js';
import { hyundaiAvailable, HYUNDAI_LABEL } from './hyundaiAvailability.js';

const usesHyundai = (shape) => shape?.hyundai != null;

export function supplyCheckAvailable(shape) {
  return usesHyundai(shape) ? hyundaiAvailable(shape) : dongkukAvailable(shape);
}

export function supplyCheckLabel(shape) {
  const table = usesHyundai(shape) ? HYUNDAI_LABEL : DONGKUK_LABEL;
  return table[supplyCheckAvailable(shape)];
}

export function supplyCheckProducerName(shape) {
  return usesHyundai(shape) ? '현대제철' : '동국제강';
}
