import { Inbox, type LucideIcon } from "lucide-react";

export default function EmptyState({
  title,
  description,
  action,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="dp-card mx-12 my-8 flex flex-col items-center gap-4 py-16 text-center">
      <Icon size={26} strokeWidth={1.5} className="text-corte" aria-hidden="true" />
      <div>
        <p className="font-dp-sans text-[13.5px] text-grafito">{title}</p>
        {description && <p className="mt-1.5 font-dp-sans text-[12.5px] text-concreto">{description}</p>}
      </div>
      {action}
    </div>
  );
}
