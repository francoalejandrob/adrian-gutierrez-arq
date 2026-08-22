import { Megaphone } from "lucide-react";
import EmptyState from "@/components/dashboard/ui/empty-state";
import PageHeader from "@/components/dashboard/ui/page-header";
import { computeMarketingFunnel } from "@/lib/marketing";
import { createClient } from "@/lib/supabase/server";

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

export default async function MarketingPage() {
  const supabase = await createClient();

  const [{ data: leads }, { data: clients }, { data: projects }, { data: contracts }] =
    await Promise.all([
      supabase.from("leads").select("id, source, utm_source, created_at"),
      supabase.from("clients").select("id, converted_from_lead_id"),
      supabase.from("projects").select("id, client_id"),
      supabase.from("contracts").select("project_id, value"),
    ]);

  const rows = computeMarketingFunnel({
    leads: leads ?? [],
    clients: clients ?? [],
    projects: projects ?? [],
    contracts: contracts ?? [],
  });

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Marketing Intelligence"
        description="De la fuente al ingreso — qué canal realmente construye el estudio (calculado desde datos propios; sin GA4/Search Console todavía, ver Website)."
      />

      {rows.length > 0 ? (
        <div className="mt-8 flex flex-col divide-y divide-carbon/[0.08] overflow-hidden rounded-[10px] border border-carbon/[0.08]">
          {rows.map((row) => (
            <div key={row.source} className="grid grid-cols-2 items-center gap-3 bg-white p-6 sm:grid-cols-5">
              <span className="font-display text-base font-medium text-carbon">{row.source}</span>
              <FunnelStat label="Leads" value={String(row.leads)} />
              <FunnelStat label="Clientes" value={String(row.clients)} />
              <FunnelStat label="Proyectos" value={String(row.projects)} />
              <FunnelStat label="Ingresos" value={currency.format(row.contractedValue)} accent />
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-[10px] border border-carbon/[0.08] bg-white">
          <EmptyState
            icon={Megaphone}
            title="Sin leads todavía"
            description="En cuanto lleguen leads (web o manuales) vas a ver de dónde vienen acá."
          />
        </div>
      )}
    </div>
  );
}

function FunnelStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <p className={`font-mono text-[19px] font-medium ${accent ? "text-naranja-oscuro" : "text-carbon"}`}>{value}</p>
      <p className="mt-0.5 text-[11px] uppercase tracking-[0.05em] text-carbon/45">{label}</p>
    </div>
  );
}
