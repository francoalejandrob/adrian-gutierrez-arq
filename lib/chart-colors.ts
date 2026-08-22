// Shared ordinal color scale for categories that carry no inherent
// resolved/attention meaning (lead source, traffic channel, …) — a single
// hue (tinta) stepped down in opacity per rank, instead of assigning an
// arbitrary rainbow color per category. Keeps every chart inside the "two
// meaningful colors (acento/verde), everything else neutral" grammar.
export const TINTA_STROKE_SCALE = [
  "stroke-tinta",
  "stroke-tinta/72",
  "stroke-tinta/52",
  "stroke-tinta/36",
  "stroke-tinta/22",
  "stroke-corte",
];

export const TINTA_BG_SCALE = ["bg-tinta", "bg-tinta/72", "bg-tinta/52", "bg-tinta/36", "bg-tinta/22", "bg-corte"];

// Collapses a long tail into a single "Otros" bucket — pie/donut charts
// read poorly past ~5-6 slices, and bar charts get cramped too.
export function bucketTopN(rows: { label: string; value: number }[], n: number, otherLabel = "Otros") {
  const sorted = [...rows].sort((a, b) => b.value - a.value);
  if (sorted.length <= n) return sorted;
  const top = sorted.slice(0, n - 1);
  const restValue = sorted.slice(n - 1).reduce((sum, r) => sum + r.value, 0);
  return restValue > 0 ? [...top, { label: otherLabel, value: restValue }] : top;
}
