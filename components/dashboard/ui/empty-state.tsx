import type { LucideIcon } from "lucide-react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <div className="flex h-11 w-11 items-center justify-center border border-carbon/15 text-carbon/40">
        <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-medium text-carbon/70">{title}</p>
        {description && <p className="mt-1 text-sm text-carbon/40">{description}</p>}
      </div>
      {action}
    </div>
  );
}
