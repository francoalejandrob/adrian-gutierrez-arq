export default function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8 border border-carbon/10 bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-carbon">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
