import Link from "next/link";
import { FileText } from "lucide-react";
import EmptyState from "@/components/dashboard/ui/empty-state";
import PageHeader from "@/components/dashboard/ui/page-header";
import StatusBadge from "@/components/dashboard/ui/status-badge";
import SubmitButton from "@/components/dashboard/ui/submit-button";
import { selectClass } from "@/components/dashboard/ui/styles";
import { createClient } from "@/lib/supabase/server";
import { QUOTE_STATUS_LABELS, QUOTE_STATUS_TONE, quoteTotal } from "@/lib/supabase/types";
import { createQuoteForProject } from "../projects/[id]/finance-actions";

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

export default async function QuotesPage() {
  const supabase = await createClient();
  const [{ data: quotes }, { data: projects }] = await Promise.all([
    supabase.from("quotes").select("*, quote_items(*), projects(name, clients(name))").order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name, clients(name)").order("name"),
  ]);

  const newQuoteForm = (projects ?? []).length > 0 && (
    <form action={createQuoteForProject} className="flex flex-wrap items-center gap-2.5">
      <select name="project_id" required defaultValue="" className={selectClass}>
        <option value="" disabled>
          Elegí un proyecto…
        </option>
        {(projects ?? []).map((project) => (
          <option key={project.id} value={project.id}>
            {project.clients?.name ? `${project.clients.name} — ${project.name}` : project.name}
          </option>
        ))}
      </select>
      <SubmitButton variant="primary" size="md" pendingLabel="Creando…">
        Nueva cotización
      </SubmitButton>
    </form>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Comercial · Todas las cotizaciones, en cualquier proyecto"
        title="Cotizaciones"
        action={newQuoteForm || undefined}
      />

      {(quotes ?? []).length > 0 ? (
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[1.6fr_1.6fr_1fr_1fr_1fr] gap-4 border-b border-filete px-5 py-3 font-dp-mono text-[9.5px] uppercase tracking-[0.13em] text-concreto sm:px-12">
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
                  className="grid grid-cols-[1.6fr_1.6fr_1fr_1fr_1fr] items-center gap-4 border-b border-filete px-5 py-4 transition-colors duration-100 hover:bg-realce sm:px-12"
                >
                  <span className="flex items-baseline gap-3 font-dp-sans text-[13.5px] text-tinta">
                    <span className="font-dp-mono text-[10px] text-concreto">{String(i + 1).padStart(2, "0")}</span>
                    {quote.projects?.clients?.name ?? "—"}
                  </span>
                  <span className="truncate font-dp-sans text-[12.5px] text-grafito">{quote.projects?.name ?? "—"}</span>
                  <span className="font-dp-mono text-[12.5px] text-tinta">{currency.format(total)}</span>
                  <span className="font-dp-mono text-[11px] text-concreto">{new Date(quote.issue_date).toLocaleDateString("es-EC")}</span>
                  <StatusBadge label={QUOTE_STATUS_LABELS[quote.status]} tone={QUOTE_STATUS_TONE[quote.status]} />
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={FileText}
          title="Todavía no hay cotizaciones"
          description={
            newQuoteForm
              ? "Elegí un proyecto para crear la primera."
              : "Creá primero un proyecto — las cotizaciones van ligadas a uno."
          }
          action={newQuoteForm || undefined}
        />
      )}
    </div>
  );
}
