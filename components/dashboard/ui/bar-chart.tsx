export type BarDatum = {
  label: string;
  value: number;
  displayValue?: string;
  colorClass?: string;
};

// Horizontal bar chart, pure CSS — the fill bar is drawn at its final
// width immediately (so it's correct even with prefers-reduced-motion
// or JS disabled) and revealed via a one-shot transform:scaleX animation
// (the same `dp-draw` keyframe ProgressBar uses), never by animating the
// `width` property itself. Every bar carries its own numeric label, so
// the chart is its own accessible data table — nothing is color-only.
export default function BarChart({ data, animate = true }: { data: BarDatum[]; animate?: boolean }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex flex-col gap-4">
      {data.map((d, i) => (
        <div key={d.label}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3 font-dp-sans text-[12.5px]">
            <span className="truncate text-grafito">{d.label}</span>
            <span className="shrink-0 font-dp-mono text-tinta">{d.displayValue ?? d.value}</span>
          </div>
          <div className="h-[6px] w-full bg-filete">
            <div
              className={`h-[6px] origin-left ${d.colorClass ?? "bg-tinta"} ${animate ? "animate-[dp-draw_650ms_var(--ease-out-strong)_both]" : ""}`}
              style={{ width: `${(d.value / max) * 100}%`, animationDelay: animate ? `${i * 60}ms` : undefined }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
