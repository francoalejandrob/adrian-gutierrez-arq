import Link from "next/link";
import { FileText } from "lucide-react";
import EmptyState from "@/components/dashboard/ui/empty-state";
import PageHeader from "@/components/dashboard/ui/page-header";
import StatusBadge from "@/components/dashboard/ui/status-badge";
import { createClient } from "@/lib/supabase/server";
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_TONE, quoteTotal } from "@/lib/supabase/types";

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

export default async function QuotesPage() {
  const supabase = await createClient();
  const { data: quotes } = await supabase
    .from("quotes")
    .select("*, quote_items(*), projects(name, clients(name))")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Cotizaciones" description="Todas las cotizaciones, en cualquier proyecto." />

      {(quotes ?? []).length > 0 ? (
        <div className="mt-6 overflow-x-auto rounded-[10px] border border-carbon/[0.08] bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-carbon/[0.08] text-[11px] uppercase tracking-wide text-carbon/40">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Proyecto</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Emitida</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {(quotes ?? []).map((quote) => {
                const { total } = quoteTotal(quote.quote_items, quote.discount, quote.tax_rate);
                return (
                  <tr key={quote.id} className="border-b border-carbon/5 transition-colors duration-100 last:border-0 hover:bg-hueso/60">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/quotes/${quote.id}`} className="font-medium text-carbon hover:text-naranja-oscuro hover:underline">
                        {quote.projects?.clients?.name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-carbon/60">{quote.projects?.name ?? "—"}</td>
                    <td className="px-4 py-3 font-mono">{currency.format(total)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-carbon/50">{new Date(quote.issue_date).toLocaleDateString("es-EC")}</td>
                    <td className="px-4 py-3">
                      <StatusBadge label={QUOTE_STATUS_LABELS[quote.status]} tone={QUOTE_STATUS_TONE[quote.status]} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-[10px] border border-carbon/[0.08] bg-white">
          <EmptyState
            icon={FileText}
            title="Todavía no hay cotizaciones"
            description="Creá una desde la ficha de un proyecto, en la pestaña Finanzas."
          />
        </div>
      )}
    </div>
  );
}
