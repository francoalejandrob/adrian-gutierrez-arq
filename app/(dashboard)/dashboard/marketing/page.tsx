import { Megaphone } from "lucide-react";
import EmptyState from "@/components/dashboard/ui/empty-state";
import PageHeader from "@/components/dashboard/ui/page-header";
import Section from "@/components/dashboard/ui/section";
import { createClient } from "@/lib/supabase/server";

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

type SourceStats = {
  source: string;
  leads: number;
  clients: number;
  projects: number;
  contractedValue: number;
};

export default async function MarketingPage() {
  const supabase = await createClient();

  const [{ data: leads }, { data: clients }, { data: projects }, { data: contracts }] =
    await Promise.all([
      supabase.from("leads").select("id, source, utm_source, created_at"),
      supabase.from("clients").select("id, converted_from_lead_id"),
      supabase.from("projects").select("id, client_id"),
      supabase.from("contracts").select("project_id, value"),
    ]);

  const contractedByProject = new Map<string, number>();
  for (const contract of contracts ?? []) {
    contractedByProject.set(
      contract.project_id,
      (contractedByProject.get(contract.project_id) ?? 0) + contract.value,
    );
  }

  const projectsByClient = new Map<string, string[]>();
  for (const project of projects ?? []) {
    projectsByClient.set(project.client_id, [
      ...(projectsByClient.get(project.client_id) ?? []),
      project.id,
    ]);
  }

  const clientByLeadId = new Map<string, string>();
  for (const client of clients ?? []) {
    if (client.converted_from_lead_id) {
      clientByLeadId.set(client.converted_from_lead_id, client.id);
    }
  }

  const bySource = new Map<string, SourceStats>();
  for (const lead of leads ?? []) {
    const source = lead.utm_source || lead.source;
    const stats = bySource.get(source) ?? { source, leads: 0, clients: 0, projects: 0, contractedValue: 0 };
    stats.leads += 1;

    const clientId = clientByLeadId.get(lead.id);
    if (clientId) {
      stats.clients += 1;
      const projectIds = projectsByClient.get(clientId) ?? [];
      stats.projects += projectIds.length;
      for (const projectId of projectIds) {
        stats.contractedValue += contractedByProject.get(projectId) ?? 0;
      }
    }

    bySource.set(source, stats);
  }

  const rows = [...bySource.values()].sort((a, b) => b.leads - a.leads);
  const totalLeads = rows.reduce((sum, r) => sum + r.leads, 0);
  const totalContracted = rows.reduce((sum, r) => sum + r.contractedValue, 0);
  const maxLeads = Math.max(1, ...rows.map((r) => r.leads));

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Marketing"
        description="Atribución de leads por fuente, calculada desde datos propios (sin GA4/Search Console todavía — ver /dashboard/website)."
      />

      <Section title="Fuentes de leads">
        {rows.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-carbon/10 text-left text-xs uppercase tracking-wide text-carbon/40">
                <th className="pb-2">Fuente</th>
                <th className="pb-2 text-right">Leads</th>
                <th className="pb-2 text-right">Clientes</th>
                <th className="pb-2 text-right">Proyectos</th>
                <th className="pb-2 text-right">Contratado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.source}
                  className="border-b border-carbon/5 transition-colors duration-100 last:border-0 hover:bg-hueso/60"
                >
                  <td className="py-2.5">
                    <p className="font-medium text-carbon">{row.source}</p>
                    <div className="mt-1 h-1 w-24 overflow-hidden bg-carbon/10">
                      <div
                        className="h-full bg-naranja"
                        style={{ width: `${(row.leads / maxLeads) * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-2.5 text-right font-mono">{row.leads}</td>
                  <td className="py-2.5 text-right font-mono">{row.clients}</td>
                  <td className="py-2.5 text-right font-mono">{row.projects}</td>
                  <td className="py-2.5 text-right font-mono">{currency.format(row.contractedValue)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-carbon/10 font-medium text-carbon">
                <td className="pt-2.5">Total</td>
                <td className="pt-2.5 text-right font-mono">{totalLeads}</td>
                <td className="pt-2.5 text-right"></td>
                <td className="pt-2.5 text-right"></td>
                <td className="pt-2.5 text-right font-mono">{currency.format(totalContracted)}</td>
              </tr>
            </tfoot>
          </table>
        ) : (
          <EmptyState
            icon={Megaphone}
            title="Sin leads todavía"
            description="En cuanto lleguen leads (web o manuales) vas a ver de dónde vienen acá."
          />
        )}
      </Section>
    </div>
  );
}
