// No more card-in-a-box: an eyebrow label (mono, uppercase, tracking)
// followed by content, separated from neighboring sections by a 1px
// filete/corte rule applied by the parent layout — matches the sheet
// grammar of DISEÑO PROFESIONAL (no shadows, no rounded panels).
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
    <section className={className}>
      <div className="mb-5 flex items-center justify-between gap-4">
        <h2 className="font-dp-mono text-[10px] font-medium uppercase tracking-[0.16em] text-concreto">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
