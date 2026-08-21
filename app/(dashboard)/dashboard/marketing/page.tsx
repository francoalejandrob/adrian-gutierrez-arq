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

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl text-carbon">Marketing</h1>
      <p className="mt-1 text-sm text-carbon/60">
        Atribución de leads por fuente, calculada desde datos propios (sin GA4/Search
        Console todavía — ver <code>/dashboard/website</code>).
      </p>

      <div className="mt-8 border border-carbon/10 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium text-carbon">Fuentes de leads</h2>
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
              <tr key={row.source} className="border-b border-carbon/5">
                <td className="py-2 font-medium text-carbon">{row.source}</td>
                <td className="py-2 text-right">{row.leads}</td>
                <td className="py-2 text-right">{row.clients}</td>
                <td className="py-2 text-right">{row.projects}</td>
                <td className="py-2 text-right">{currency.format(row.contractedValue)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-3 text-sm text-carbon/40">
                  Sin leads todavía.
                </td>
              </tr>
            )}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-carbon/10 font-medium text-carbon">
                <td className="pt-2">Total</td>
                <td className="pt-2 text-right">{totalLeads}</td>
                <td className="pt-2 text-right"></td>
                <td className="pt-2 text-right"></td>
                <td className="pt-2 text-right">{currency.format(totalContracted)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
