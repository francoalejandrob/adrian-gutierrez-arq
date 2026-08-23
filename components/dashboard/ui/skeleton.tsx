export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-filete ${className}`} />;
}

export function StatBandSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className="mx-12 mt-8 grid gap-4"
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="dp-card p-8">
          <SkeletonBlock className="h-3 w-6" />
          <SkeletonBlock className="mt-4 h-10 w-16" />
          <SkeletonBlock className="mt-4 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function RowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="px-12">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-6 border-b border-filete py-5">
          <SkeletonBlock className="h-3 w-6" />
          <SkeletonBlock className="h-4 flex-1" />
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div>
      <div className="border-b border-corte px-12 pb-[30px] pt-[52px]">
        <SkeletonBlock className="mb-[18px] h-3 w-40" />
        <SkeletonBlock className="h-12 w-64" />
      </div>
      <StatBandSkeleton />
      <div className="pt-8">
        <RowsSkeleton rows={rows} />
      </div>
    </div>
  );
}
