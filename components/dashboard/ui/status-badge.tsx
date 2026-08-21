export type StatusTone = "neutral" | "info" | "warning" | "success" | "danger";

// One restrained palette reused for every status badge in the dashboard
// (leads, projects, phases, tasks, quotes, contracts, payments). Neutral
// stays on-brand (piedra, already in the palette); the four semantic
// tones reuse the same red-50/red-200/red-700 shape the "tareas vencidas"
// alert on the dashboard home page already used, just extended to amber
// and emerald instead of inventing a new set of colors.
const TONES: Record<StatusTone, string> = {
  neutral: "bg-piedra/10 text-piedra border-piedra/25",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  danger: "bg-red-50 text-red-700 border-red-200",
};

export default function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: StatusTone }) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 text-xs font-medium ${TONES[tone]}`}
    >
      {label}
    </span>
  );
}
