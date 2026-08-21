import { PlugZap } from "lucide-react";
import PageHeader from "@/components/dashboard/ui/page-header";
import Section from "@/components/dashboard/ui/section";
import { getTrafficSummary } from "@/lib/integrations/google-analytics";
import { getSearchPerformance } from "@/lib/integrations/google-search-console";

export default async function WebsitePage() {
  const [traffic, search] = await Promise.all([
    safeCall(() => getTrafficSummary()),
    safeCall(() => getSearchPerformance()),
  ]);

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Website"
        description="Tráfico y posicionamiento del sitio público, vía Google Analytics 4 y Search Console."
      />

      <Section title="Tráfico (Google Analytics 4)">
        {traffic.configured ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-carbon/10 text-left text-xs uppercase tracking-wide text-carbon/40">
                <th className="pb-2">Canal</th>
                <th className="pb-2 text-right">Usuarios activos</th>
                <th className="pb-2 text-right">Sesiones</th>
              </tr>
            </thead>
            <tbody>
              {traffic.data.byChannel.map((row) => (
                <tr
                  key={row.channel}
                  className="border-b border-carbon/5 transition-colors duration-100 last:border-0 hover:bg-hueso/60"
                >
                  <td className="py-2.5">{row.channel}</td>
                  <td className="py-2.5 text-right font-mono">{row.activeUsers}</td>
                  <td className="py-2.5 text-right font-mono">{row.sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <NotConfigured reason={traffic.reason} />
        )}
      </Section>

      <Section title="Búsqueda (Search Console)">
        {search.configured ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-carbon/10 text-left text-xs uppercase tracking-wide text-carbon/40">
                <th className="pb-2">Consulta</th>
                <th className="pb-2 text-right">Clics</th>
                <th className="pb-2 text-right">Impresiones</th>
                <th className="pb-2 text-right">CTR</th>
                <th className="pb-2 text-right">Posición</th>
              </tr>
            </thead>
            <tbody>
              {search.data.topQueries.map((row) => (
                <tr
                  key={row.query}
                  className="border-b border-carbon/5 transition-colors duration-100 last:border-0 hover:bg-hueso/60"
                >
                  <td className="py-2.5">{row.query}</td>
                  <td className="py-2.5 text-right font-mono">{row.clicks}</td>
                  <td className="py-2.5 text-right font-mono">{row.impressions}</td>
                  <td className="py-2.5 text-right font-mono">{(row.ctr * 100).toFixed(1)}%</td>
                  <td className="py-2.5 text-right font-mono">{row.position.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <NotConfigured reason={search.reason} />
        )}
      </Section>
    </div>
  );
}

async function safeCall<T extends { configured: boolean }>(
  fn: () => Promise<T>,
): Promise<T | { configured: false; reason: string }> {
  try {
    return await fn();
  } catch (error) {
    return {
      configured: false,
      reason: error instanceof Error ? error.message : "Error inesperado al consultar la API de Google.",
    };
  }
}

function NotConfigured({ reason }: { reason: string }) {
  return (
    <div className="flex flex-col items-center gap-3 border border-dashed border-carbon/20 bg-hueso/50 px-4 py-10 text-center">
      <PlugZap size={20} strokeWidth={1.5} className="text-carbon/30" aria-hidden="true" />
      <div>
        <p className="text-sm text-carbon/60">{reason}</p>
        <p className="mt-2 text-xs text-carbon/40">
          Ver INTEGRATION_SETUP.md en el repositorio para los pasos de configuración.
        </p>
      </div>
    </div>
  );
}
