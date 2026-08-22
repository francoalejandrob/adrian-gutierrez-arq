// Every Section renders as a delimited card — rounded corners, a border,
// a soft ambient shadow — per user feedback that the hairline-only sheet
// grammar read as too flat. Section is the shared wrapper used across
// nearly every dashboard/portal page, so this one change boxes most of
// the product's content blocks at once.
export default function Section({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`dp-card p-7 ${className}`}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-dp-mono text-[10px] font-medium uppercase tracking-[0.16em] text-concreto">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
