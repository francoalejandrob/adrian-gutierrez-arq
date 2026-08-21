import { SkeletonBlock, StatGridSkeleton } from "@/components/dashboard/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div>
      <SkeletonBlock className="h-7 w-40" />
      <SkeletonBlock className="mt-2 h-4 w-64" />
      <div className="mt-8">
        <StatGridSkeleton count={4} />
      </div>
    </div>
  );
}
