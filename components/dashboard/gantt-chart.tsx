import type { Phase } from "@/lib/supabase/types";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

export default function GanttChart({ phases }: { phases: Phase[] }) {
  const dated = phases.filter((p) => p.start_date && p.end_date);

  if (dated.length === 0) {
    return (
      <p className="text-sm text-carbon/50">
        Agrega fechas de inicio y fin a las fases para ver el cronograma.
      </p>
    );
  }

  const starts = dated.map((p) => new Date(p.start_date!).getTime());
  const ends = dated.map((p) => new Date(p.end_date!).getTime());
  const rangeStart = new Date(Math.min(...starts));
  const rangeEnd = new Date(Math.max(...ends));
  rangeStart.setDate(1);
  const totalDays = Math.max(
    1,
    Math.ceil((rangeEnd.getTime() - rangeStart.getTime()) / MS_PER_DAY),
  );

  const months: { label: string; leftPct: number }[] = [];
  const cursor = new Date(rangeStart);
  while (cursor <= rangeEnd) {
    const leftPct = ((cursor.getTime() - rangeStart.getTime()) / MS_PER_DAY / totalDays) * 100;
    months.push({
      label: cursor.toLocaleDateString("es-EC", { month: "short", year: "2-digit" }),
      leftPct,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return (
    <div className="overflow-x-auto">
      <div className="relative min-w-[600px]">
        <div className="relative h-6 border-b border-carbon/10">
          {months.map((m) => (
            <span
              key={m.label + m.leftPct}
              style={{ left: `${m.leftPct}%` }}
              className="absolute top-0 -translate-x-0 text-[10px] uppercase tracking-wide text-carbon/40"
            >
              {m.label}
            </span>
          ))}
        </div>

        <div className="mt-3 flex flex-col gap-2">
          {dated.map((phase) => {
            const start = new Date(phase.start_date!).getTime();
            const end = new Date(phase.end_date!).getTime();
            const leftPct = ((start - rangeStart.getTime()) / MS_PER_DAY / totalDays) * 100;
            const widthPct = Math.max(
              1.5,
              ((end - start) / MS_PER_DAY / totalDays) * 100,
            );

            return (
              <div key={phase.id} className="flex items-center gap-3">
                <span className="w-36 shrink-0 truncate text-xs text-carbon/70" title={phase.name}>
                  {phase.name}
                </span>
                <div className="relative h-5 flex-1 bg-hueso">
                  <div
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    className="absolute inset-y-0 bg-carbon/80"
                  >
                    <div
                      style={{ width: `${phase.progress}%` }}
                      className="h-full bg-naranja"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
