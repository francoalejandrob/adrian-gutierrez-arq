import { getTrafficSummary } from "@/lib/integrations/google-analytics";
import { getSearchPerformance } from "@/lib/integrations/google-search-console";

export default async function WebsitePage() {
  const [traffic, search] = await Promise.all([
    safeCall(() => getTrafficSummary()),
    safeCall(() => getSearchPerformance()),
  ]);

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl text-carbon">Website</h1>
      <p className="mt-1 text-sm text-carbon/60">
        Tráfico y posicionamiento del sitio público, vía Google Analytics 4 y Search
        Console.
      </p>

      <div className="mt-8 border border-carbon/10 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium text-carbon">Tráfico (Google Analytics 4)</h2>
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
                <tr key={row.channel} className="border-b border-carbon/5">
                  <td className="py-2">{row.channel}</td>
                  <td className="py-2 text-right">{row.activeUsers}</td>
                  <td className="py-2 text-right">{row.sessions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <NotConfigured reason={traffic.reason} />
        )}
      </div>

      <div className="mt-8 border border-carbon/10 bg-white p-6">
        <h2 className="mb-4 text-sm font-medium text-carbon">Búsqueda (Search Console)</h2>
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
                <tr key={row.query} className="border-b border-carbon/5">
                  <td className="py-2">{row.query}</td>
                  <td className="py-2 text-right">{row.clicks}</td>
                  <td className="py-2 text-right">{row.impressions}</td>
                  <td className="py-2 text-right">{(row.ctr * 100).toFixed(1)}%</td>
                  <td className="py-2 text-right">{row.position.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <NotConfigured reason={search.reason} />
        )}
      </div>
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
    <div className="border border-dashed border-carbon/20 bg-hueso/50 p-4 text-sm text-carbon/60">
      <p>{reason}</p>
      <p className="mt-2 text-xs text-carbon/40">
        Ver INTEGRATION_SETUP.md en el repositorio para los pasos de configuración.
      </p>
    </div>
  );
}
