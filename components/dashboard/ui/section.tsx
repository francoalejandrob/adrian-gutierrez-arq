// Two variants, both from DISEÑO/ARCHI.OS.dc.html: "card" (a bordered
// white panel with a Fraunces heading) for content that needs visual
// elevation, and "plain" (a small uppercase eyebrow label + divider-based
// list, no box) for everything else — the guide leans heavily on the
// plain variant (Fases, Alertas, Actividad, Documentos...) instead of
// wrapping every section in a card.

export default function Section({
  title,
  action,
  children,
  variant = "card",
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  variant?: "card" | "plain";
}) {
  if (variant === "plain") {
    return (
      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[11px] font-medium uppercase tracking-[0.09em] text-carbon/40">{title}</p>
          {action}
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="mt-8 rounded-[10px] border border-carbon/[0.08] bg-white p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-[17px] font-medium text-carbon">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}
