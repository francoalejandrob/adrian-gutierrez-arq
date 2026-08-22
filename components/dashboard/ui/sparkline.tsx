// Small inline trend line for a KPI card — a single SVG polyline, drawn
// in with the same stroke-dashoffset technique the donut/bar charts use.
// Only ever fed real day-bucketed data (see lib/sparkline.ts) — never a
// fabricated shape for a metric with no history behind it.
export default function Sparkline({
  data,
  width = 88,
  height = 30,
  positive = true,
}: {
  data: number[];
  width?: number;
  height?: number;
  positive?: boolean;
}) {
  const max = Math.max(1, ...data);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = width / Math.max(1, data.length - 1);

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <polyline
        points={points.join(" ")}
        fill="none"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={positive ? "stroke-verde" : "stroke-acento"}
        pathLength={100}
        style={{
          strokeDasharray: 100,
          strokeDashoffset: 100,
          animation: "dp-draw-line 700ms var(--ease-out-strong) both",
        }}
      />
    </svg>
  );
}
