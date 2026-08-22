// The geometric half of the state discipline: filled square = resolved,
// hollow square = pending, red diamond = needs attention, gray filled
// square = historical/superseded. Used for phase timelines, document
// version markers, and notification dots — StatusLabel (text) is used
// for named statuses in tables/lists instead.
export type MarkTone = "resolved" | "pending" | "attention" | "historic";

export default function StatusMark({ tone = "pending", className = "" }: { tone?: MarkTone; className?: string }) {
  if (tone === "attention") {
    return <span className={`inline-block h-[9px] w-[9px] rotate-45 bg-acento ${className}`} />;
  }
  if (tone === "resolved") {
    return <span className={`inline-block h-[9px] w-[9px] bg-tinta ${className}`} />;
  }
  if (tone === "historic") {
    return <span className={`inline-block h-[9px] w-[9px] bg-corte ${className}`} />;
  }
  return <span className={`inline-block h-[9px] w-[9px] border border-[#B5B1A6] bg-superficie ${className}`} />;
}
