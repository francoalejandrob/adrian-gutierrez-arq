import { AlertCircle, CheckCircle2, Circle } from "lucide-react";
import type { ComponentType } from "react";

// The geometric half of the old state discipline (filled/hollow square,
// red diamond) is now an icon, matching the rest of the system after
// bringing lucide-react back — one visual vocabulary (icons) instead of
// abstract marks + icons coexisting. Same tone API as before, so every
// existing call site keeps working unchanged.
export type MarkTone = "resolved" | "pending" | "attention" | "historic";

const TONE_ICON: Record<MarkTone, ComponentType<{ size?: number; strokeWidth?: number; className?: string }>> = {
  resolved: CheckCircle2,
  pending: Circle,
  attention: AlertCircle,
  historic: Circle,
};

const TONE_COLOR: Record<MarkTone, string> = {
  resolved: "text-verde",
  pending: "text-corte",
  attention: "text-acento",
  historic: "text-concreto",
};

export default function StatusMark({ tone = "pending", className = "" }: { tone?: MarkTone; className?: string }) {
  const Icon = TONE_ICON[tone];
  return <Icon size={14} strokeWidth={2.25} className={`shrink-0 ${TONE_COLOR[tone]} ${className}`} aria-hidden="true" />;
}
