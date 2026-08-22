import Link from "next/link";
import PageHeader from "@/components/dashboard/ui/page-header";
import Section from "@/components/dashboard/ui/section";
import StatusMark from "@/components/dashboard/ui/status-mark";
import { computeMarketingFunnel } from "@/lib/marketing";
import { getTrafficSummary } from "@/lib/integrations/google-analytics";
import { getSearchPerformance } from "@/lib/integrations/google-search-console";
import { createClient } from "@/lib/supabase/server";

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

export default async function WebsitePage(props: PageProps<"/dashboard/website">) {
  const searchParams = await props.searchParams;
  const tabParam = Array.isArray(searchParams.tab) ? searchParams.tab[0] : searchParams.tab;
  const tab = tabParam === "seo" ? "seo" : tabParam === "fuentes" ? "fuentes" : "analytics";

  const supabase = await createClient();

  const [traffic, search, { data: leads }, { data: clients }, { data: projects }, { data: contracts }] = await Promise.all([
    safeCall(() => getTrafficSummary()),
    safeCall(() => getSearchPerformance()),
    supabase.from("leads").select("id, source, utm_source, created_at"),
    supabase.from("clients").select("id, converted_from_lead_id"),
    supabase.from("projects").select("id, client_id"),
    supabase.from("contracts").select("project_id, value"),
  ]);

  const funnelRows = computeMarketingFunnel({
    leads: leads ?? [],
    clients: clients ?? [],
    projects: projects ?? [],
    contracts: contracts ?? [],
  });

  return (
    <div>
      <PageHeader eyebrow="Inteligencia · Tráfico y posicionamiento del sitio público" title="Observatorio digital" />

      <div className="flex gap-8 border-b border-corte px-12">
        <WebsiteTab href="/dashboard/website?tab=analytics" label="Tráfico" active={tab === "analytics"} />
        <WebsiteTab href="/dashboard/website?tab=seo" label="Posicionamiento" active={tab === "seo"} />
        <WebsiteTab href="/dashboard/website?tab=fuentes" label="Fuentes" active={tab === "fuentes"} />
      </div>

      {tab === "analytics" && (
        <div className="px-12 py-10">
          {traffic.configured ? (
            <>
              <div className="dp-card mb-10 grid grid-cols-2">
                <div className="border-r border-filete p-7">
                  <p className="font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-concreto">Usuarios activos</p>
                  <p className="mt-2.5 font-dp-mono text-2xl text-tinta">{traffic.data.totals.activeUsers.toLocaleString("es-EC")}</p>
                </div>
                <div className="p-7">
                  <p className="font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-concreto">Sesiones</p>
                  <p className="mt-2.5 font-dp-mono text-2xl text-tinta">{traffic.data.totals.sessions.toLocaleString("es-EC")}</p>
                </div>
              </div>
              <Section title="Tráfico por canal">
                <div className="flex flex-col">
                  {traffic.data.byChannel.map((row) => (
                    <div key={row.channel} className="flex items-center justify-between border-b border-filete py-3 last:border-0">
                      <span className="font-dp-sans text-[13px] text-tinta">{row.channel}</span>
                      <span className="font-dp-mono text-[12.5px] text-tinta">{row.activeUsers}</span>
                      <span className="font-dp-mono text-[11px] text-concreto">{row.sessions} sesiones</span>
                    </div>
                  ))}
                </div>
              </Section>
            </>
          ) : (
            <NotConfigured reason={traffic.reason} />
          )}
        </div>
      )}

      {tab === "seo" && (
        <div className="px-12 py-10">
          {search.configured ? (
            <div>
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 border-b border-corte pb-3 font-dp-mono text-[9.5px] uppercase tracking-[0.12em] text-concreto">
                <span>Consulta</span>
                <span className="text-right">Clics</span>
                <span className="text-right">Impresiones</span>
                <span className="text-right">CTR</span>
                <span className="text-right">Posición</span>
              </div>
              {search.data.topQueries.map((row) => (
                <div key={row.query} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center gap-4 border-b border-filete py-3">
                  <span className="truncate font-dp-sans text-[13px] text-tinta">&ldquo;{row.query}&rdquo;</span>
                  <span className="text-right font-dp-mono text-[12.5px] text-tinta">{row.clicks}</span>
                  <span className="text-right font-dp-mono text-[12.5px] text-tinta">{row.impressions}</span>
                  <span className="text-right font-dp-mono text-[12.5px] text-tinta">{(row.ctr * 100).toFixed(1)}%</span>
                  <span className="text-right font-dp-mono text-[12.5px] text-tinta">{row.position.toFixed(1)}</span>
                </div>
              ))}
            </div>
          ) : (
            <NotConfigured reason={search.reason} />
          )}
        </div>
      )}

      {tab === "fuentes" && (
        <div className="px-12 py-10">
          {funnelRows.length > 0 ? (
            <div className="flex flex-col">
              {funnelRows.map((row) => (
                <div key={row.source} className="grid grid-cols-5 items-center gap-4 border-b border-filete py-5">
                  <span className="font-dp-serif text-lg text-tinta">{row.source}</span>
                  <FunnelStat label="Leads" value={String(row.leads)} />
                  <FunnelStat label="Clientes" value={String(row.clients)} />
                  <FunnelStat label="Proyectos" value={String(row.projects)} />
                  <FunnelStat label="Ingresos" value={currency.format(row.contractedValue)} positive />
                </div>
              ))}
            </div>
          ) : (
            <p className="font-dp-sans text-sm text-concreto">Sin leads todavía.</p>
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
      className={`border-b-2 py-3.5 font-dp-mono text-[10.5px] uppercase tracking-[0.12em] transition-colors duration-150 ${
        active ? "border-tinta text-tinta" : "border-transparent text-concreto hover:text-tinta"
      }`}
    >
      {label}
    </Link>
  );
}

function FunnelStat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <p className={`font-dp-mono text-[15px] ${positive ? "text-verde" : "text-tinta"}`}>{value}</p>
      <p className="mt-1 font-dp-mono text-[9px] uppercase tracking-[0.08em] text-concreto">{label}</p>
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
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-corte px-4 py-14 text-center">
      <StatusMark tone="pending" className="h-3 w-3" />
      <div>
        <p className="font-dp-sans text-[13px] text-grafito">{reason}</p>
        <p className="mt-2.5 font-dp-mono text-[10.5px] text-concreto">
          Ver INTEGRATION_SETUP.md en el repositorio para los pasos de configuración.
        </p>
      </div>
    </div>
  );
}

