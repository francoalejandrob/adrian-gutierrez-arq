import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import PageHeader from "@/components/dashboard/ui/page-header";
import Section from "@/components/dashboard/ui/section";
import StatusBadge from "@/components/dashboard/ui/status-badge";
import { createClient } from "@/lib/supabase/server";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_TONE, type PaymentStatus } from "@/lib/supabase/types";

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

export default async function FinancePage() {
  const supabase = await createClient();

  const [{ data: contracts }, { data: payments }, { data: expenses }] = await Promise.all([
    supabase.from("contracts").select("value"),
    supabase
      .from("payments")
      .select("*, projects(name, clients(name))")
      .order("due_date"),
    supabase.from("expenses").select("amount"),
  ]);

  const contracted = (contracts ?? []).reduce((sum, c) => sum + c.value, 0);
  const collected = (payments ?? [])
    .filter((p) => p.status === "pagada")
    .reduce((sum, p) => sum + p.amount, 0);
  const pending = (payments ?? [])
    .filter((p) => p.status === "pendiente" || p.status === "vencida")
    .reduce((sum, p) => sum + p.amount, 0);
  const spent = (expenses ?? []).reduce((sum, e) => sum + e.amount, 0);
  const margin = collected - spent;

  const today = new Date().toISOString().slice(0, 10);
  const outstanding = (payments ?? [])
    .filter((p) => p.status === "pendiente" || p.status === "vencida")
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));

  return (
    <div className="max-w-4xl">
      <PageHeader title="Finanzas" description="Resumen de todos los proyectos." />

      <div className="mt-6 grid grid-cols-5 gap-4 border border-carbon/10 bg-white p-6 text-center">
        <SummaryStat label="Contratado" value={currency.format(contracted)} />
        <SummaryStat label="Cobrado" value={currency.format(collected)} />
        <SummaryStat label="Pendiente" value={currency.format(pending)} />
        <SummaryStat label="Gastos" value={currency.format(spent)} />
        <SummaryStat label="Margen" value={currency.format(margin)} tone={margin >= 0 ? "positive" : "negative"} />
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
                      href={`/dashboard/projects/${payment.project_id}`}
                      className="transition-colors hover:text-naranja"
                    >
                      {payment.projects?.clients?.name} — {payment.projects?.name}
                    </Link>
                  </td>
                  <td className={`py-2.5 font-mono text-xs ${overdue ? "text-red-600" : "text-carbon/60"}`}>
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
            <CheckCircle2 size={22} strokeWidth={1.5} className="text-emerald-500" aria-hidden="true" />
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
    <div>
      <p className="text-xs uppercase tracking-wide text-carbon/40">{label}</p>
      <p
        className={`mt-1 font-mono text-lg font-medium ${
          tone === "negative" ? "text-red-600" : tone === "positive" ? "text-emerald-600" : "text-carbon"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
