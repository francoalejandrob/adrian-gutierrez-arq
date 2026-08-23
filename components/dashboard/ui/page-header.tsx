export default function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6 border-b border-corte px-5 pb-5 pt-8 sm:gap-10 sm:px-12 sm:pb-[30px] sm:pt-[52px]">
      <div>
        {eyebrow && (
          <p className="mb-[18px] font-dp-mono text-[10px] uppercase tracking-[0.16em] text-concreto">{eyebrow}</p>
        )}
        <h1 className="font-dp-serif text-[26px] leading-none tracking-[-0.015em] text-tinta sm:text-[34px]">{title}</h1>
      </div>
      {action}
    </div>
  );
}
