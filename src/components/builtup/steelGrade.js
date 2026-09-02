import materials from '../../data/materials.json';

// Rough ASTM plate-availability guidance by thickness, used only to hint
// which grade(s) are typically mill-stock for a given plate thickness.
// A36 plate is produced up to 8 in.; A572 Grade 50 plate is standard mill
// stock up to 4 in. (heavier Gr50 plate is special-order/less common).
// This is general guidance, not a procurement guarantee.
export function gradesForThicknessIn(inches) {
  const grades = [];
  if (inches <= 8) grades.push('A36');
  if (inches <= 4) grades.push('A572 GR50');
  return grades;
}

// Badge label -> materials.json row (see src/data/materials.json, 'astm').
const GRADE_ROW = { A36: 'A36', 'A572 GR50': 'A572 Gr.50' };

/** Fy for a badge grade label, e.g. "36 ksi / 250 MPa" — used as a tooltip
 * so the compact grade-availability badge can carry the number without
 * needing more on-screen width. */
export function fyLabel(grade) {
  const row = materials.astm.rows.find((r) => r.grade === GRADE_ROW[grade]);
  return row ? `Fy=${row.fyKsi}ksi/${row.fyMpa}MPa` : '';
}

export function gradeLabel(inches) {
  const grades = gradesForThicknessIn(inches);
  if (grades.length === 2) return `${grades[0]} & ${grades[1]}`;
  if (grades.length === 1) return `ONLY ${grades[0]}`;
  return '';
}

export function gradeTitle(inches) {
  return gradesForThicknessIn(inches).map((g) => `${g}: ${fyLabel(g)}`).join(' · ');
}
