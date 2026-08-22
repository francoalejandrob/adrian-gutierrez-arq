export type StatusTone = "neutral" | "info" | "warning" | "success" | "danger";

// Solid pill badges, matching DISEÑO/ARCHI.OS.dc.html's STATUS_COLORS as
// closely as contrast allows. The mockup pairs naranja (#b26a45) with
// white text for its "warning" tone, but that only reaches ~4.16:1 —
// under the 4.5:1 AA minimum at this badge's font size. Rather than swap
// out the designed color, "warning" keeps true naranja and switches to
// dark (noche) text instead — same background as designed, ~5:1 contrast.
const TONES: Record<StatusTone, string> = {
  neutral: "bg-piedra text-white",
  info: "bg-naranja-oscuro text-white",
  warning: "bg-naranja text-noche",
  success: "bg-[#3a7a56] text-white",
  danger: "bg-[#a4432b] text-white",
};

export default function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: StatusTone }) {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[11px] font-medium ${TONES[tone]}`}
    >
      {label}
    </span>
  );
}
