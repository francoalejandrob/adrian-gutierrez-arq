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
    <div className="flex items-end justify-between gap-10 border-b border-corte px-12 pb-[30px] pt-[52px]">
      <div>
        {eyebrow && (
          <p className="mb-[18px] font-dp-mono text-[10px] uppercase tracking-[0.16em] text-concreto">{eyebrow}</p>
        )}
        <h1 className="font-dp-serif text-[34px] leading-none tracking-[-0.015em] text-tinta">{title}</h1>
      </div>
      {action}
    </div>
  );
}
