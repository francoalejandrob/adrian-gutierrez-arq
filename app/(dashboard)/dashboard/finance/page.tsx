import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PAYMENT_STATUS_LABELS } from "@/lib/supabase/types";

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
      <h1 className="font-display text-2xl text-carbon">Finanzas</h1>
      <p className="mt-1 text-sm text-carbon/60">Resumen de todos los proyectos.</p>

      <div className="mt-6 grid grid-cols-5 gap-4 border border-carbon/10 bg-white p-6 text-center">
        <SummaryStat label="Contratado" value={currency.format(contracted)} />
        <SummaryStat label="Cobrado" value={currency.format(collected)} />
        <SummaryStat label="Pendiente" value={currency.format(pending)} />
        <SummaryStat label="Gastos" value={currency.format(spent)} />
        <SummaryStat label="Margen" value={currency.format(margin)} />
      </div>

      <div className="mt-8 border border-carbon/10 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium text-carbon">Pagos pendientes y vencidos</h2>
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
                <tr key={payment.id} className="border-b border-carbon/5">
                  <td className="py-2">
                    <Link
                      href={`/dashboard/projects/${payment.project_id}`}
                      className="hover:text-naranja"
                    >
                      {payment.projects?.clients?.name} — {payment.projects?.name}
                    </Link>
                  </td>
                  <td className="py-2 text-carbon/60">{payment.due_date ?? "sin fecha"}</td>
                  <td className="py-2 text-right">{currency.format(payment.amount)}</td>
                  <td className={`py-2 ${overdue ? "text-red-600" : "text-carbon/60"}`}>
                    {PAYMENT_STATUS_LABELS[payment.status]}
                  </td>
                </tr>
              );
            })}
            {outstanding.length === 0 && (
              <tr>
                <td colSpan={4} className="py-3 text-sm text-carbon/40">
                  Sin pagos pendientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-carbon/40">{label}</p>
      <p className="mt-1 font-display text-lg text-carbon">{value}</p>
    </div>
  );
}
