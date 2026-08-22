export type SourceStats = {
  source: string;
  leads: number;
  clients: number;
  projects: number;
  contractedValue: number;
};

// Factored out of /dashboard/marketing so the same lead→client→project→
// contracted-value grouping can be reused by the CSV export in
// /api/reports/marketing/csv without duplicating the logic.
export function computeMarketingFunnel({
  leads,
  clients,
  projects,
  contracts,
}: {
  leads: { id: string; source: string; utm_source: string | null }[];
  clients: { id: string; converted_from_lead_id: string | null }[];
  projects: { id: string; client_id: string }[];
  contracts: { project_id: string; value: number }[];
}): SourceStats[] {
  const contractedByProject = new Map<string, number>();
  for (const contract of contracts) {
    contractedByProject.set(contract.project_id, (contractedByProject.get(contract.project_id) ?? 0) + contract.value);
  }

  const projectsByClient = new Map<string, string[]>();
  for (const project of projects) {
    projectsByClient.set(project.client_id, [...(projectsByClient.get(project.client_id) ?? []), project.id]);
  }

  const clientByLeadId = new Map<string, string>();
  for (const client of clients) {
    if (client.converted_from_lead_id) clientByLeadId.set(client.converted_from_lead_id, client.id);
  }

  const bySource = new Map<string, SourceStats>();
  for (const lead of leads) {
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

  return [...bySource.values()].sort((a, b) => b.leads - a.leads);
}
