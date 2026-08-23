import type { BadgeTone } from "@/components/dashboard/ui/status-badge";

// Same 5-tone map StatusBadge uses (resolved/attention/warning/info/
// neutral → verde/acento/ambar/azul/concreto) — one source of truth for
// "what color means what status" reused by every chart that breaks data
// down by status, instead of each chart picking its own colors.
export const TONE_STROKE: Record<BadgeTone, string> = {
  resolved: "stroke-verde",
  attention: "stroke-acento",
  warning: "stroke-ambar",
  info: "stroke-azul",
  neutral: "stroke-concreto",
};

export const TONE_BG: Record<BadgeTone, string> = {
  resolved: "bg-verde",
  attention: "bg-acento",
  warning: "bg-ambar",
  info: "bg-azul",
  neutral: "bg-concreto",
};

// Shared ordinal color scale for categories that carry no inherent
// resolved/attention meaning (lead source, traffic channel, …) — a single
// hue (tinta) stepped down in opacity per rank, instead of assigning an
// arbitrary rainbow color per category. Keeps every chart inside the
// deliberate palette instead of an arbitrary per-category rainbow.
//
// Pase oscuro: verificado con cálculo de contraste real (no a ojo) que
// esta escala sigue funcionando sin cambios después de que `tinta` pasó
// a ser el tono claro (ver globals.css) — al ser un fade de opacidad
// simétrico (color de primer plano difuminándose hacia el fondo), la
// relación de prominencia se preserva sin importar si tinta es oscuro
// sobre claro o claro sobre oscuro. Pasos consecutivos quedan entre
// 1.26:1 y 1.84:1 de contraste entre sí sobre `superficie` oscuro —
// comparable al espaciado original en modo claro.
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
