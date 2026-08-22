// State discipline (DISEÑO PROFESIONAL "16 Design system", §03): still
// text, never a pill with a background, and still three tones — but the
// "resolved" tone reads as verde (not tinta) so the grammar carries real
// color instead of only weight, per user feedback that the all-monochrome
// version read as too flat.
export type LabelTone = "resolved" | "attention" | "neutral";

const TONES: Record<LabelTone, string> = {
  resolved: "text-verde font-medium",
  attention: "text-acento font-medium",
  neutral: "text-concreto font-normal",
};

export default function StatusLabel({ label, tone = "neutral" }: { label: string; tone?: LabelTone }) {
  return (
    <span className={`font-dp-mono text-[9.5px] uppercase tracking-[0.12em] ${TONES[tone]}`}>{label}</span>
  );
}
