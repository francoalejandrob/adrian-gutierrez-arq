import Link from "next/link";
import PageHeader from "@/components/dashboard/ui/page-header";
import Section from "@/components/dashboard/ui/section";
import StatusLabel from "@/components/dashboard/ui/status-label";
import { createClient } from "@/lib/supabase/server";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONE, type PaymentStatus } from "@/lib/supabase/types";

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const MONTH_LABELS = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export default async function FinancePage() {
  const supabase = await createClient();

  const [{ data: contracts }, { data: payments }, { data: expenses }, { data: projects }] = await Promise.all([
    supabase.from("contracts").select("value, project_id"),
    supabase.from("payments").select("*, projects(name, clients(name))").order("due_date"),
    supabase.from("expenses").select("amount, project_id"),
    supabase.from("projects").select("id, name"),
  ]);

  const contracted = (contracts ?? []).reduce((sum, c) => sum + c.value, 0);
  const collected = (payments ?? []).filter((p) => p.status === "pagada").reduce((sum, p) => sum + p.amount, 0);
  const pending = (payments ?? [])
    .filter((p) => p.status === "pendiente" || p.status === "vencida")
    .reduce((sum, p) => sum + p.amount, 0);
  const spent = (expenses ?? []).reduce((sum, e) => sum + e.amount, 0);
  const profit = collected - spent;
  const marginPct = collected > 0 ? (profit / collected) * 100 : 0;

  const today = new Date().toISOString().slice(0, 10);
  const outstanding = (payments ?? [])
    .filter((p) => p.status === "pendiente" || p.status === "vencida")
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));

  // Cashflow: collected payments over the last 6 months (including 0-payment months).
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: MONTH_LABELS[d.getMonth()] };
  });
  const cashflow = months.map(({ year, month, label }) => {
    const total = (payments ?? [])
      .filter((p) => {
        if (p.status !== "pagada" || !p.paid_date) return false;
        const d = new Date(p.paid_date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, p) => sum + p.amount, 0);
    return { label, total };
  });
  const maxCashflow = Math.max(1, ...cashflow.map((m) => m.total));

  // Profitability by project: margin % on contracted value.
  const contractedByProject = new Map<string, number>();
  for (const c of contracts ?? []) contractedByProject.set(c.project_id, (contractedByProject.get(c.project_id) ?? 0) + c.value);
  const collectedByProject = new Map<string, number>();
  for (const p of payments ?? []) {
    if (p.status === "pagada") collectedByProject.set(p.project_id, (collectedByProject.get(p.project_id) ?? 0) + p.amount);
  }
  const spentByProject = new Map<string, number>();
  for (const e of expenses ?? []) spentByProject.set(e.project_id, (spentByProject.get(e.project_id) ?? 0) + e.amount);

  const profitability = (projects ?? [])
    .map((project) => {
      const projectContracted = contractedByProject.get(project.id) ?? 0;
      const projectCollected = collectedByProject.get(project.id) ?? 0;
      const projectSpent = spentByProject.get(project.id) ?? 0;
      const pct = projectContracted > 0 ? ((projectCollected - projectSpent) / projectContracted) * 100 : null;
      return { name: project.name, pct };
    })
    .filter((p): p is { name: string; pct: number } => p.pct !== null)
    .sort((a, b) => b.pct - a.pct);

  return (
    <div>
      <PageHeader eyebrow="Inteligencia · Resumen de todos los proyectos" title="Finanzas" />

      <div className="dp-card mx-12 mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <SummaryStat label="Contratado" value={currency.format(contracted)} />
        <SummaryStat label="Cobrado" value={currency.format(collected)} tone="positive" />
        <SummaryStat label="Pendiente" value={currency.format(pending)} tone="attention" />
        <SummaryStat label="Gastos" value={currency.format(spent)} />
        <SummaryStat label="Utilidad" value={currency.format(profit)} tone="positive" />
        <SummaryStat label="Margen" value={`${marginPct.toFixed(1)}%`} tone="positive" last />
      </div>

      <div className="grid grid-cols-1 gap-12 px-12 py-10 lg:grid-cols-[1.3fr_1fr]">
        <Section title="Flujo de caja · últimos 6 meses">
          <div className="flex h-[140px] items-end gap-3.5 border-b border-filete pb-0.5">
            {cashflow.map((m) => (
              <div key={m.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <div className="w-full bg-verde" style={{ height: `${(m.total / maxCashflow) * 100}%` }} />
                <span className="font-dp-mono text-[10.5px] text-concreto">{m.label}</span>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Rentabilidad por proyecto">
          <div className="flex flex-col gap-3.5">
            {profitability.map((p) => (
              <div key={p.name}>
                <div className="mb-1.5 flex justify-between font-dp-sans text-[12.5px]">
                  <span className="text-grafito">{p.name}</span>
                  <span className={`font-dp-mono ${p.pct >= 0 ? "text-verde" : "text-acento"}`}>{p.pct.toFixed(0)}%</span>
                </div>
                <div className="h-[3px] bg-filete">
                  <div
                    className={p.pct >= 0 ? "h-[3px] bg-verde" : "h-[3px] bg-acento"}
                    style={{ width: `${Math.max(0, Math.min(100, Math.abs(p.pct)))}%` }}
                  />
                </div>
              </div>
            ))}
            {profitability.length === 0 && <p className="font-dp-sans text-sm text-concreto">Sin datos todavía.</p>}
          </div>
        </Section>
      </div>

      <div className="border-t border-corte px-12 py-10">
        <Section title="Pagos pendientes y vencidos">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 border-b border-corte pb-3 font-dp-mono text-[9.5px] uppercase tracking-[0.12em] text-concreto">
            <span>Proyecto</span>
            <span>Vence</span>
            <span className="text-right">Monto</span>
            <span>Estado</span>
          </div>
          {outstanding.map((payment) => {
            const overdue = payment.status === "vencida" || (payment.due_date ?? "") < today;
            return (
              <Link
                key={payment.id}
                href={`/dashboard/projects/${payment.project_id}?tab=finance`}
                className="grid grid-cols-[2fr_1fr_1fr_1fr] items-center gap-4 border-b border-filete py-3.5"
              >
                <span className="truncate font-dp-sans text-[13px] text-tinta">
                  {payment.projects?.clients?.name} — {payment.projects?.name}
                </span>
                <span className={`font-dp-mono text-[11px] ${overdue ? "text-acento" : "text-concreto"}`}>
                  {payment.due_date ?? "sin fecha"}
                </span>
                <span className="text-right font-dp-mono text-[12.5px] text-tinta">{currency.format(payment.amount)}</span>
                <StatusLabel
                  label={PAYMENT_STATUS_LABELS[payment.status as PaymentStatus]}
                  tone={overdue ? "attention" : PAYMENT_STATUS_TONE[payment.status as PaymentStatus]}
                />
              </Link>
            );
          })}
          {outstanding.length === 0 && (
            <p className="py-10 text-center font-dp-sans text-sm text-concreto">Sin pagos pendientes ni vencidos.</p>
          )}
        </Section>
      </div>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
  last,
}: {
  label: string;
  value: string;
  tone?: "attention" | "positive";
  last?: boolean;
}) {
  const toneClass = tone === "attention" ? "text-acento" : tone === "positive" ? "text-verde" : "text-tinta";
  return (
    <div className={`p-6 ${last ? "" : "border-r border-filete"}`}>
      <p className="font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-concreto">{label}</p>
      <p className={`mt-2.5 font-dp-mono text-lg ${toneClass}`}>{value}</p>
    </div>
  );
}
