import Link from "next/link";
import { PlugZap } from "lucide-react";
import PageHeader from "@/components/dashboard/ui/page-header";
import { getTrafficSummary } from "@/lib/integrations/google-analytics";
import { getSearchPerformance } from "@/lib/integrations/google-search-console";

export default async function WebsitePage(props: PageProps<"/dashboard/website">) {
  const searchParams = await props.searchParams;
  const tabParam = Array.isArray(searchParams.tab) ? searchParams.tab[0] : searchParams.tab;
  const tab = tabParam === "seo" ? "seo" : "analytics";

  const [traffic, search] = await Promise.all([
    safeCall(() => getTrafficSummary()),
    safeCall(() => getSearchPerformance()),
  ]);

  return (
    <div className="max-w-4xl">
      <PageHeader title="Website" description="Tráfico y posicionamiento del sitio público." />

      <div className="mt-5 flex gap-6 border-b border-carbon/[0.1]">
        <WebsiteTab href="/dashboard/website?tab=analytics" label="Analytics" active={tab === "analytics"} />
        <WebsiteTab href="/dashboard/website?tab=seo" label="SEO" active={tab === "seo"} />
      </div>

      {tab === "analytics" && (
        <div className="mt-7">
          {traffic.configured ? (
            <>
              <div className="mb-9 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-carbon/[0.08] bg-carbon/[0.08] sm:grid-cols-2">
                <div className="bg-white p-5">
                  <p className="mb-2 text-[11px] uppercase tracking-[0.06em] text-carbon/40">Usuarios activos</p>
                  <p className="font-mono text-[22px] font-medium text-carbon">{traffic.data.totals.activeUsers.toLocaleString("es-EC")}</p>
                </div>
                <div className="bg-white p-5">
                  <p className="mb-2 text-[11px] uppercase tracking-[0.06em] text-carbon/40">Sesiones</p>
                  <p className="font-mono text-[22px] font-medium text-carbon">{traffic.data.totals.sessions.toLocaleString("es-EC")}</p>
                </div>
              </div>
              <p className="mb-4 text-[11px] uppercase tracking-[0.09em] text-carbon/40">Tráfico por canal</p>
              <table className="w-full text-sm">
                <tbody>
                  {traffic.data.byChannel.map((row) => (
                    <tr key={row.channel} className="border-b border-carbon/[0.06] last:border-0">
                      <td className="py-2.5">{row.channel}</td>
                      <td className="py-2.5 text-right font-mono">{row.activeUsers}</td>
                      <td className="py-2.5 text-right font-mono text-carbon/50">{row.sessions} sesiones</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <NotConfigured reason={traffic.reason} />
          )}
        </div>
      )}

      {tab === "seo" && (
        <div className="mt-7">
          {search.configured ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-carbon/[0.08] text-left text-[11px] uppercase tracking-wide text-carbon/40">
                  <th className="pb-2">Consulta</th>
                  <th className="pb-2 text-right">Clics</th>
                  <th className="pb-2 text-right">Impresiones</th>
                  <th className="pb-2 text-right">CTR</th>
                  <th className="pb-2 text-right">Posición</th>
                </tr>
              </thead>
              <tbody>
                {search.data.topQueries.map((row) => (
                  <tr key={row.query} className="border-b border-carbon/[0.06] last:border-0">
                    <td className="py-2.5">&ldquo;{row.query}&rdquo;</td>
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
        </div>
      )}
    </div>
  );
}

function WebsiteTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`border-b-2 pb-3 text-[13.5px] transition-colors duration-150 ${
        active ? "border-carbon font-medium text-carbon" : "border-transparent text-carbon/50 hover:text-carbon"
      }`}
    >
      {label}
    </Link>
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
    <div className="flex flex-col items-center gap-3 rounded-[10px] border border-dashed border-carbon/20 bg-hueso/50 px-4 py-10 text-center">
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
