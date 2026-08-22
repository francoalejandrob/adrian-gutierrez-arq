// No icon library in the dashboard/portal system — a hollow mark stands
// in for an icon, matching the mockup's pure typography/mark language.
import StatusMark from "./status-mark";

export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="dp-card mx-12 my-8 flex flex-col items-center gap-4 py-16 text-center">
      <StatusMark tone="pending" className="h-3 w-3" />
      <div>
        <p className="font-dp-sans text-[13.5px] text-grafito">{title}</p>
        {description && <p className="mt-1.5 font-dp-sans text-[12.5px] text-concreto">{description}</p>}
      </div>
      {action}
    </div>
  );
}
