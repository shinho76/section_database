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

export function gradeLabel(inches) {
  const grades = gradesForThicknessIn(inches);
  if (grades.length === 2) return `${grades[0]} & ${grades[1]}`;
  if (grades.length === 1) return `ONLY ${grades[0]}`;
  return '';
}
