export default function ProgressBar({
  value,
  height = 1,
  trackClassName = "bg-filete",
  fillClassName = "bg-tinta",
  className = "",
  animate = false,
}: {
  value: number;
  height?: number;
  trackClassName?: string;
  fillClassName?: string;
  className?: string;
  animate?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`relative w-full ${trackClassName} ${className}`}
      style={{ height }}
    >
      <div
        className={`absolute left-0 top-0 origin-left ${fillClassName} ${animate ? "animate-[dp-draw_700ms_cubic-bezier(0.2,0.8,0.2,1)_both]" : ""}`}
        style={{ height, width: `${clamped}%` }}
      />
    </div>
  );
}
