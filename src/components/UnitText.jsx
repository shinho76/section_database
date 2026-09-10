// Unicode superscript glyphs (in⁴, ×10⁶ mm⁴, ...) are drawn small within
// their own glyph box by design, so simply matching the surrounding unit
// text's font-size to the value it labels still leaves the exponent itself
// hard to read. This wraps any run of superscript characters in a `<sup>`
// sized up relative to the rest of the unit text (see .unit-exp in
// tokens.css) while leaving everything else untouched.
const SUP_RE = /[⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻]+/g;

export default function UnitText({ children }) {
  const text = String(children ?? '');
  if (!text) return null;
  const nodes = [];
  let lastIndex = 0;
  let m;
  SUP_RE.lastIndex = 0;
  while ((m = SUP_RE.exec(text))) {
    if (m.index > lastIndex) nodes.push(text.slice(lastIndex, m.index));
    nodes.push(<sup key={m.index} className="unit-exp">{m[0]}</sup>);
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}
