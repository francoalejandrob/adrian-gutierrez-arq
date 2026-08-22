import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/dashboard/ui/page-header";
import Section from "@/components/dashboard/ui/section";
import StatusBadge from "@/components/dashboard/ui/status-badge";
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
    <div className="max-w-4xl">
      <PageHeader title="Finanzas" description="Resumen de todos los proyectos." />

      <div className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-carbon/[0.08] bg-carbon/[0.08] sm:grid-cols-3 lg:grid-cols-6">
        <SummaryStat label="Contratado" value={currency.format(contracted)} />
        <SummaryStat label="Cobrado" value={currency.format(collected)} />
        <SummaryStat label="Pendiente" value={currency.format(pending)} tone="negative" />
        <SummaryStat label="Gastos" value={currency.format(spent)} />
        <SummaryStat label="Utilidad" value={currency.format(profit)} tone="positive" />
        <SummaryStat label="Margen" value={`${marginPct.toFixed(1)}%`} />
      </div>

      <div className="mt-11 grid grid-cols-1 gap-12 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <p className="mb-4 text-[11px] uppercase tracking-[0.09em] text-carbon/40">Flujo de caja · últimos 6 meses</p>
          <div className="flex h-[140px] items-end gap-3.5 border-b border-carbon/[0.1] pb-0.5">
            {cashflow.map((m) => (
              <div key={m.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                <div className="w-full bg-naranja" style={{ height: `${(m.total / maxCashflow) * 100}%` }} />
                <span className="font-mono text-[10.5px] text-carbon/45">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-4 text-[11px] uppercase tracking-[0.09em] text-carbon/40">Rentabilidad por proyecto</p>
          <div className="flex flex-col gap-3">
            {profitability.map((p) => (
              <div key={p.name}>
                <div className="mb-1 flex justify-between text-[12.5px]">
                  <span className="text-carbon/80">{p.name}</span>
                  <span className="font-mono">{p.pct.toFixed(0)}%</span>
                </div>
                <div className="h-[5px] bg-carbon/[0.07]">
                  <div className="h-[5px] bg-naranja-oscuro" style={{ width: `${Math.max(0, Math.min(100, p.pct))}%` }} />
                </div>
              </div>
            ))}
            {profitability.length === 0 && <p className="text-sm text-carbon/40">Sin datos todavía.</p>}
          </div>
        </div>
      </div>

      <Section title="Pagos pendientes y vencidos">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-carbon/10 text-left text-xs uppercase tracking-wide text-carbon/40">
              <th className="pb-2">Proyecto</th>
              <th className="pb-2">Vence</th>
              <th className="pb-2 text-right">Monto</th>
              <th className="pb-2">Estado</th>
            </tr>
          </thead>
          <tbody>
            {outstanding.map((payment) => {
              const overdue = payment.status === "vencida" || (payment.due_date ?? "") < today;
              return (
                <tr
                  key={payment.id}
                  className="border-b border-carbon/5 transition-colors duration-100 last:border-0 hover:bg-hueso/60"
                >
                  <td className="py-2.5">
                    <Link
                      href={`/dashboard/projects/${payment.project_id}?tab=finance`}
                      className="transition-colors hover:text-naranja-oscuro"
                    >
                      {payment.projects?.clients?.name} — {payment.projects?.name}
                    </Link>
                  </td>
                  <td className={`py-2.5 font-mono text-xs ${overdue ? "text-[#a4432b]" : "text-carbon/60"}`}>
                    {payment.due_date ?? "sin fecha"}
                  </td>
                  <td className="py-2.5 text-right font-mono">{currency.format(payment.amount)}</td>
                  <td className="py-2.5">
                    <StatusBadge
                      label={PAYMENT_STATUS_LABELS[payment.status as PaymentStatus]}
                      tone={overdue ? "danger" : PAYMENT_STATUS_TONE[payment.status as PaymentStatus]}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {outstanding.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <CheckCircle2 size={22} strokeWidth={1.5} className="text-[#3a7a56]" aria-hidden="true" />
            <p className="text-sm text-carbon/50">Sin pagos pendientes ni vencidos.</p>
          </div>
        )}
      </Section>
    </div>
  );
}

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "positive" | "negative";
}) {
  return (
    <div className="bg-white p-5">
      <p className="mb-2 text-[11px] uppercase tracking-[0.06em] text-carbon/40">{label}</p>
      <p
        className={`font-mono text-[19px] font-medium ${
          tone === "negative" ? "text-[#a4432b]" : tone === "positive" ? "text-[#3a7a56]" : "text-carbon"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
