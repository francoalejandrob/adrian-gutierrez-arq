import PageHeader from "@/components/dashboard/ui/page-header";
import { getTrafficSummary } from "@/lib/integrations/google-analytics";
import { createClient } from "@/lib/supabase/server";

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default async function MarketingPage() {
  const supabase = await createClient();

  const [traffic, { count: leadsCount }, { count: clientsCount }, { count: projectsCount }, { data: contracts }] =
    await Promise.all([
      safeCall(() => getTrafficSummary()),
      supabase.from("leads").select("*", { count: "exact", head: true }),
      supabase.from("clients").select("*", { count: "exact", head: true }),
      supabase.from("projects").select("*", { count: "exact", head: true }),
      supabase.from("contracts").select("value"),
    ]);

  const income = (contracts ?? []).reduce((sum, c) => sum + c.value, 0);

  const stages = [
    { label: "Visitas", value: traffic.configured ? traffic.data.totals.sessions.toLocaleString("es-EC") : null },
    { label: "Leads", value: String(leadsCount ?? 0) },
    { label: "Clientes", value: String(clientsCount ?? 0) },
    { label: "Proyectos", value: String(projectsCount ?? 0) },
    { label: "Ingresos", value: currency.format(income) },
  ];

  return (
    <div>
      <PageHeader eyebrow="Inteligencia · De la visita al ingreso, calculado con datos propios" title="Marketing intelligence" />

      <div className="mx-12 mt-8 grid grid-cols-5 gap-4">
        {stages.map((stage, i) => (
          <div key={stage.label} className="dp-card p-8">
            <p className="font-dp-mono text-[10px] text-concreto">{String(i + 1).padStart(2, "0")}</p>
            <p
              className={`mt-4 font-dp-mono text-2xl leading-none ${stage.label === "Ingresos" ? "text-verde" : "text-tinta"}`}
            >
              {stage.value ?? "—"}
            </p>
            <p className="mt-3 font-dp-mono text-[9.5px] uppercase tracking-[0.13em] text-grafito">{stage.label}</p>
          </div>
        ))}
      </div>

      {!traffic.configured && (
        <p className="px-12 pt-8 font-dp-sans text-[13px] text-concreto">
          Visitas requiere Google Analytics configurado — ver <span className="font-dp-mono text-[11.5px]">INTEGRATION_SETUP.md</span>. El
          resto del embudo es real y ya está disponible.
        </p>
      )}
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
