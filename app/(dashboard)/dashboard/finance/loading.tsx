import { SkeletonBlock, TableSkeleton } from "@/components/dashboard/ui/skeleton";

export default function FinanceLoading() {
  return (
    <div className="max-w-4xl">
      <SkeletonBlock className="h-7 w-32" />
      <SkeletonBlock className="mt-2 h-4 w-56" />
      <div className="mt-6 grid grid-cols-5 gap-4 border border-carbon/10 bg-white p-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <SkeletonBlock className="h-3 w-16" />
            <SkeletonBlock className="h-5 w-20" />
          </div>
        ))}
      </div>
      <div className="mt-8">
        <TableSkeleton rows={5} cols={4} />
      </div>
    </div>
  );
}
