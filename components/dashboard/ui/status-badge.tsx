import { AlertTriangle, CheckCircle2, Circle, Clock } from "lucide-react";
import type { ComponentType } from "react";

// Replaces the text-only StatusLabel from the previous (icon-free) pass
// — the user asked to adopt a SaaS-style pill-badge look with more
// color, shown a reference dashboard. 5 tones instead of 2 so status
// reads with real nuance (resolved/attention/warning/info/neutral)
// instead of a flat resolved-or-not split.
export type BadgeTone = "resolved" | "attention" | "warning" | "info" | "neutral";

// Pase oscuro: la opacidad del relleno bajó de /10 a /6 — verificado con
// cálculo de contraste real que a /10 el texto "attention" (acento)
// caía justo debajo de 4.5:1 contra su propio relleno sobre `superficie`
// oscuro (4.36:1); a /6 los 5 tonos quedan entre 4.54:1 y 9.53:1.
const TONE_STYLE: Record<BadgeTone, string> = {
  resolved: "border-verde/20 bg-verde/6 text-verde",
  attention: "border-acento/20 bg-acento/6 text-acento",
  warning: "border-ambar/20 bg-ambar/6 text-ambar",
  info: "border-azul/20 bg-azul/6 text-azul",
  neutral: "border-concreto/20 bg-concreto/6 text-grafito",
};

const TONE_ICON: Record<BadgeTone, ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  resolved: CheckCircle2,
  attention: AlertTriangle,
  warning: Clock,
  info: Circle,
  neutral: Circle,
};

export default function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: BadgeTone }) {
  const Icon = TONE_ICON[tone];
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 font-dp-sans text-[11.5px] font-medium ${TONE_STYLE[tone]}`}
    >
      <Icon size={12} strokeWidth={2.25} aria-hidden="true" />
      {label}
    </span>
  );
}
