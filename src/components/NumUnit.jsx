/** SAMPLE — decimal-aligned number + unit cell (see chat: pending approval
 * before rolling out beyond HPlusTPanel's Imperial results column).
 *
 * Splits a formatted number into integer/decimal parts so the decimal point
 * lines up vertically across rows regardless of digit count, then places the
 * unit at a fixed offset after the number. `value` keeps whatever decimal
 * precision the caller already formatted (e.g. `toFixed(1)`) — this
 * component only re-lays-out that same string, it doesn't re-round it.
 */
export default function NumUnit({ value, unit }) {
  const str = String(value);
  const dot = str.indexOf('.');
  const intPart = dot === -1 ? str : str.slice(0, dot);
  const fracPart = dot === -1 ? '' : str.slice(dot); // includes the dot itself
  return (
    <span className="num-cell">
      <span className="num-int">{intPart}</span>
      <span className="num-frac">{fracPart}</span>
      <span className="num-unit">{unit}</span>
    </span>
  );
}
