export type DonutDatum = {
  label: string;
  value: number;
  displayValue?: string;
  colorClass?: string;
};

// Donut chart built from stacked SVG circle strokes (no charting library —
// the dashboard/portal has none installed, and a hand-rolled chart matches
// the editorial system's exact typography/color instead of a generic
// library default). Capped in practice at ~5-6 slices by the caller
// (accessibility guidance: pie/donut reads poorly past that — bars handle
// more categories better). The legend repeats every value as text, so the
// chart is never the only place the data exists. Entrance is a single
// fade+scale on the whole ring (one deliberate motion, not per-slice),
// respecting prefers-reduced-motion via the global rule in globals.css.
export default function DonutChart({
  data,
  size = 148,
  thickness = 20,
  centerLabel,
  centerValue,
}: {
  data: DonutDatum[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerValue?: string;
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  let cumulative = 0;

  return (
    <div className="flex items-center gap-8">
      <div className="relative shrink-0 animate-[dp-chart-in_550ms_var(--ease-out-strong)_both]" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--color-filete)" strokeWidth={thickness} />
          {total > 0 &&
            data.map((d) => {
              const segment = (d.value / total) * circumference;
              const dashoffset = -cumulative;
              cumulative += segment;
              return (
                <circle
                  key={d.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="none"
                  className={d.colorClass ?? "stroke-tinta"}
                  strokeWidth={thickness}
                  strokeDasharray={`${segment} ${circumference - segment}`}
                  strokeDashoffset={dashoffset}
                />
              );
            })}
        </svg>
        {(centerLabel || centerValue) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            {centerValue && <span className="font-dp-mono text-lg text-tinta">{centerValue}</span>}
            {centerLabel && <span className="mt-0.5 font-dp-mono text-[8.5px] uppercase tracking-[0.1em] text-concreto">{centerLabel}</span>}
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        {data.map((d) => (
          <div key={d.label} className="flex items-center gap-2.5">
            <span className={`h-2.5 w-2.5 shrink-0 ${(d.colorClass ?? "stroke-tinta").replace("stroke-", "bg-")}`} />
            <span className="min-w-0 flex-1 truncate font-dp-sans text-[12.5px] text-grafito">{d.label}</span>
            <span className="shrink-0 font-dp-mono text-[12px] text-tinta">
              {d.displayValue ?? d.value}
              {total > 0 && <span className="text-concreto"> · {Math.round((d.value / total) * 100)}%</span>}
            </span>
          </div>
        ))}
        {total === 0 && <p className="font-dp-sans text-[12.5px] text-concreto">Sin datos todavía.</p>}
      </div>
    </div>
  );
}
