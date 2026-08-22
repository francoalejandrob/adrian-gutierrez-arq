import { SkeletonBlock } from "@/components/dashboard/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div>
      <SkeletonBlock className="h-7 w-40" />
      <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-2">
        <SkeletonBlock className="h-32 rounded-[10px]" />
        <SkeletonBlock className="h-32 rounded-[10px]" />
      </div>
    </div>
  );
}
