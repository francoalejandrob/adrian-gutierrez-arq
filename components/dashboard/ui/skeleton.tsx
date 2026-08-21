export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-carbon/10 ${className}`} />;
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-carbon/10 bg-white p-5">
          <SkeletonBlock className="h-7 w-16" />
          <SkeletonBlock className="mt-3 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="overflow-x-auto border border-carbon/10 bg-white">
      <div className="border-b border-carbon/10 px-4 py-3">
        <SkeletonBlock className="h-3 w-40" />
      </div>
      <div className="divide-y divide-carbon/5">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-6 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonBlock key={c} className="h-3 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PageSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div>
      <SkeletonBlock className="h-7 w-40" />
      <SkeletonBlock className="mt-2 h-4 w-64" />
      <div className="mt-8">
        <TableSkeleton rows={rows} cols={cols} />
      </div>
    </div>
  );
}
