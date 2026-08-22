export default function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-display text-[30px] font-medium text-carbon">{title}</h1>
        {description && <p className="mt-1.5 text-[13.5px] text-carbon/55">{description}</p>}
      </div>
      {action}
    </div>
  );
}
