"use client";

import { motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";

export type BlueprintVariant =
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
