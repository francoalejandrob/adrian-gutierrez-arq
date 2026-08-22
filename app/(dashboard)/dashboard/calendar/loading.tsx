import { SkeletonBlock } from "@/components/dashboard/ui/skeleton";

export default function CalendarLoading() {
  return (
    <div>
      <SkeletonBlock className="h-7 w-32" />
      <SkeletonBlock className="mt-6 h-24 w-full" />
      <SkeletonBlock className="mt-7 h-[500px] w-full rounded-[10px]" />
    </div>
  );
}
