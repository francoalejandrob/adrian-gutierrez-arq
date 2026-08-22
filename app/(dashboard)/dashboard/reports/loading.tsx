import { SkeletonBlock } from "@/components/dashboard/ui/skeleton";

export default function ReportsLoading() {
  return (
    <div>
      <SkeletonBlock className="h-7 w-32" />
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-32 rounded-[10px]" />
        ))}
      </div>
    </div>
  );
}
