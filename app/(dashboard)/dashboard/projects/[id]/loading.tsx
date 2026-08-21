import { SkeletonBlock } from "@/components/dashboard/ui/skeleton";

export default function ProjectDetailLoading() {
  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <SkeletonBlock className="h-3 w-24" />
          <SkeletonBlock className="mt-2 h-7 w-56" />
        </div>
        <SkeletonBlock className="h-9 w-32" />
      </div>

      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="mt-8 border border-carbon/10 bg-white p-6">
          <SkeletonBlock className="h-4 w-32" />
          <div className="mt-4 flex flex-col gap-3">
            <SkeletonBlock className="h-4 w-full" />
            <SkeletonBlock className="h-4 w-5/6" />
            <SkeletonBlock className="h-4 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
