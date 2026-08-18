"use client";

import { motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

export type BlueprintVariant =
  | "hero"
  | "casa-malecon"
  | "villa-punta-carnero"
  | "residencia-chipipe"
  | "casa-libertador"
  | "luz"
  | "materiales"
  | "naturaleza"
  | "sostenibilidad"
  | "estudio";

type LineSpec = {
  d: string;
  dashed?: boolean;
};

const VARIANTS: Record<BlueprintVariant, { viewBox: string; lines: LineSpec[]; circles?: { cx: number; cy: number; r: number }[] }> = {
  hero: {
    viewBox: "0 0 640 360",
    lines: [
      { d: "M40 320 L600 320" },
      { d: "M120 320 L120 180 L260 120 L400 180 L400 320" },
      { d: "M400 180 L520 180 L520 320" },
      { d: "M120 180 L400 180" },
      { d: "M160 320 L160 240 L200 240 L200 320" },
      { d: "M300 320 L300 240 L340 240 L340 320" },
      { d: "M440 320 L440 260 L480 260 L480 320" },
      { d: "M40 320 L40 40", dashed: true },
      { d: "M40 40 L60 40" },
      { d: "M40 320 L600 320 M600 300 L600 320", dashed: true },
    ],
    circles: [{ cx: 540, cy: 90, r: 28 }],
  },
  "casa-malecon": {
    viewBox: "0 0 320 220",
    lines: [
      { d: "M30 170 L290 170" },
      { d: "M50 170 L50 120 L270 120 L270 170" },
      { d: "M50 120 L20 130 L20 175", dashed: true },
      { d: "M270 120 L300 130 L300 175", dashed: true },
      { d: "M80 170 L80 130" },
      { d: "M110 170 L110 130" },
      { d: "M140 170 L140 130" },
      { d: "M170 170 L170 130" },
      { d: "M200 170 L200 130" },
      { d: "M230 170 L230 130" },
    ],
  },
  "villa-punta-carnero": {
    viewBox: "0 0 320 220",
    lines: [
      { d: "M20 190 L300 190" },
      { d: "M40 190 L40 150 L110 150 L110 190" },
      { d: "M110 150 L110 110 L190 110 L190 150" },
      { d: "M190 110 L190 70 L270 70 L270 110 L270 190" },
      { d: "M20 190 L40 165", dashed: true },
    ],
  },
  "residencia-chipipe": {
    viewBox: "0 0 320 220",
    lines: [
      { d: "M40 60 L40 180 L200 180 L200 60 Z", dashed: true },
      { d: "M70 190 L70 90 L250 90 L250 190 Z" },
      { d: "M70 90 L120 60 L200 60 L250 90", dashed: true },
      { d: "M110 190 L110 140 L160 140 L160 190" },
      { d: "M190 130 L230 130 M190 150 L230 150" },
    ],
  },
  "casa-libertador": {
    viewBox: "0 0 320 220",
    lines: [
      { d: "M50 30 L270 30 L270 190 L50 190 Z" },
      { d: "M100 70 L220 70 L220 150 L100 150 Z" },
      { d: "M50 30 L20 20", dashed: true },
      { d: "M270 30 L300 20", dashed: true },
      { d: "M50 190 L20 200", dashed: true },
      { d: "M270 190 L300 200", dashed: true },
    ],
  },
  luz: {
    viewBox: "0 0 160 160",
    lines: [
      { d: "M30 130 L130 130" },
      { d: "M50 130 L50 60 L110 60 L110 130" },
      { d: "M80 60 L80 130" },
      { d: "M50 95 L110 95" },
      { d: "M20 40 L45 65" },
      { d: "M80 20 L80 50" },
      { d: "M140 40 L115 65" },
    ],
  },
  materiales: {
    viewBox: "0 0 160 160",
    lines: [
      { d: "M30 40 L130 40" },
      { d: "M30 70 L130 70" },
      { d: "M30 100 L130 100" },
      { d: "M30 130 L130 130" },
      { d: "M45 55 L60 40 M65 55 L80 40 M85 55 L100 40 M105 55 L120 40" },
    ],
  },
  naturaleza: {
    viewBox: "0 0 160 160",
    lines: [
      { d: "M20 120 Q45 100 70 120 T120 120 T160 120" },
      { d: "M80 120 L80 60" },
      { d: "M80 70 L60 50" },
      { d: "M80 85 L104 65" },
      { d: "M80 100 L58 84" },
    ],
  },
  sostenibilidad: {
    viewBox: "0 0 160 160",
    lines: [
      { d: "M40 50 L40 130 L120 130 L120 50 Z" },
      { d: "M10 90 L40 90" },
      { d: "M10 90 L20 84 M10 90 L20 96" },
      { d: "M120 70 L150 70" },
      { d: "M150 70 L140 64 M150 70 L140 76" },
    ],
    circles: [{ cx: 80, cy: 30, r: 10 }],
  },
  estudio: {
    viewBox: "0 0 160 160",
    lines: [
      { d: "M30 130 L130 30" },
      { d: "M100 30 L130 30 L130 60" },
      { d: "M30 130 L30 100 L60 130" },
      { d: "M45 115 Q70 90 95 65" },
    ],
  },
};

export default function BlueprintArt({
  variant,
  className,
  strokeClassName = "text-naranja",
}: {
  variant: BlueprintVariant;
  className?: string;
  strokeClassName?: string;
}) {
  const spec = VARIANTS[variant];

  return (
    <svg
      viewBox={spec.viewBox}
      className={className}
      fill="none"
      aria-hidden="true"
    >
      {spec.circles?.map((c, i) => (
        <motion.circle
          key={`c-${i}`}
          cx={c.cx}
          cy={c.cy}
          r={c.r}
          className={strokeClassName}
          stroke="currentColor"
          strokeWidth={1.5}
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.9, delay: 0.08 * i, ease: EASE_OUT }}
        />
      ))}
      {spec.lines.map((line, i) => (
        <motion.path
          key={i}
          d={line.d}
          className={strokeClassName}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={line.dashed ? "4 5" : undefined}
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.9, delay: 0.05 * i, ease: EASE_OUT }}
        />
      ))}
    </svg>
  );
}
