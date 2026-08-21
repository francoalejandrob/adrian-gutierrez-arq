import { SkeletonBlock } from "@/components/dashboard/ui/skeleton";

export default function NotificationsLoading() {
  return (
    <div className="max-w-3xl">
      <SkeletonBlock className="h-7 w-48" />
      <div className="mt-6 border border-carbon/10 bg-white">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 border-b border-carbon/5 p-4 last:border-0">
            <SkeletonBlock className="h-8 w-8 shrink-0" />
            <div className="flex-1">
              <SkeletonBlock className="h-3.5 w-2/3" />
              <SkeletonBlock className="mt-2 h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
