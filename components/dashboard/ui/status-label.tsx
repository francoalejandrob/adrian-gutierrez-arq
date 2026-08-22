// State discipline (DISEÑO PROFESIONAL "16 Design system", §03): "Una
// sola gramática en todo el producto ... Sin semáforos de color." Named
// statuses render as plain colored/weighted text — never a pill with a
// background — and there are only three tones, not one per status value.
export type LabelTone = "resolved" | "attention" | "neutral";

const TONES: Record<LabelTone, string> = {
  resolved: "text-tinta font-medium",
  attention: "text-acento font-medium",
  neutral: "text-concreto font-normal",
};

export default function StatusLabel({ label, tone = "neutral" }: { label: string; tone?: LabelTone }) {
  return (
    <span className={`font-dp-mono text-[9.5px] uppercase tracking-[0.12em] ${TONES[tone]}`}>{label}</span>
  );
}
