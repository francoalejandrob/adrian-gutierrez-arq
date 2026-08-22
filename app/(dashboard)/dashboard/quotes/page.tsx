import Link from "next/link";
import EmptyState from "@/components/dashboard/ui/empty-state";
import PageHeader from "@/components/dashboard/ui/page-header";
import StatusLabel from "@/components/dashboard/ui/status-label";
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
      <PageHeader eyebrow="Comercial · Todas las cotizaciones, en cualquier proyecto" title="Cotizaciones" />

      {(quotes ?? []).length > 0 ? (
        <div>
          <div className="grid grid-cols-[1.6fr_1.6fr_1fr_1fr_1fr] gap-4 border-b border-filete px-12 py-3 font-dp-mono text-[9.5px] uppercase tracking-[0.13em] text-concreto">
            <span>Cliente</span>
            <span>Proyecto</span>
            <span>Total</span>
            <span>Emitida</span>
            <span>Estado</span>
          </div>
          {(quotes ?? []).map((quote, i) => {
            const { total } = quoteTotal(quote.quote_items, quote.discount, quote.tax_rate);
            return (
              <Link
                key={quote.id}
                href={`/dashboard/quotes/${quote.id}`}
                className="grid grid-cols-[1.6fr_1.6fr_1fr_1fr_1fr] items-center gap-4 border-b border-filete px-12 py-4 transition-colors duration-100 hover:bg-[#EDEBE4]"
              >
                <span className="flex items-baseline gap-3 font-dp-sans text-[13.5px] text-tinta">
                  <span className="font-dp-mono text-[10px] text-concreto">{String(i + 1).padStart(2, "0")}</span>
                  {quote.projects?.clients?.name ?? "—"}
                </span>
                <span className="truncate font-dp-sans text-[12.5px] text-grafito">{quote.projects?.name ?? "—"}</span>
                <span className="font-dp-mono text-[12.5px] text-tinta">{currency.format(total)}</span>
                <span className="font-dp-mono text-[11px] text-concreto">{new Date(quote.issue_date).toLocaleDateString("es-EC")}</span>
                <StatusLabel label={QUOTE_STATUS_LABELS[quote.status]} tone={QUOTE_STATUS_TONE[quote.status]} />
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Todavía no hay cotizaciones"
          description="Creá una desde la ficha de un proyecto, en la pestaña Finanzas."
        />
      )}
    </div>
  );
}
