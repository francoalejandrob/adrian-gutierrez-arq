import { notFound } from "next/navigation";
import { computeMarketingFunnel } from "@/lib/marketing";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/supabase/types";

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

const REPORT_TITLES: Record<string, string> = {
  comercial: "Reporte comercial",
  financiero: "Reporte financiero",
  proyectos: "Reporte de proyectos",
  marketing: "Reporte de marketing",
};

export default async function ReportPrintPage(props: PageProps<"/dashboard/reports/[type]/print">) {
  const { type } = await props.params;
  if (!(type in REPORT_TITLES)) notFound();

  const supabase = await createClient();

  return (
    <div className="mx-auto max-w-3xl bg-white p-10 text-carbon">
      <div className="border-b border-carbon/20 pb-5">
        <p className="font-display text-xl">Adrián Gutiérrez Arquitectura</p>
        <p className="mt-1 text-sm text-carbon/60">
          {REPORT_TITLES[type]} · {new Date().toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {type === "comercial" && <ComercialTable supabase={supabase} />}
      {type === "financiero" && <FinancieroTable supabase={supabase} />}
      {type === "proyectos" && <ProyectosTable supabase={supabase} />}
      {type === "marketing" && <MarketingTable supabase={supabase} />}
    </div>
  );
}

type Supa = Awaited<ReturnType<typeof createClient>>;

async function ComercialTable({ supabase }: { supabase: Supa }) {
  const { data: leads } = await supabase
    .from("leads")
    .select("name, email, source, status, estimated_value, created_at")
    .order("created_at", { ascending: false });

  return (
    <table className="mt-6 w-full text-sm">
      <thead>
        <tr className="border-b border-carbon/20 text-left text-xs uppercase tracking-wide text-carbon/50">
          <th className="py-2">Lead</th>
          <th className="py-2">Fuente</th>
          <th className="py-2">Estado</th>
          <th className="py-2 text-right">Valor estimado</th>
        </tr>
      </thead>
      <tbody>
        {(leads ?? []).map((l) => (
          <tr key={l.email + l.created_at} className="border-b border-carbon/10">
            <td className="py-2">{l.name}</td>
            <td className="py-2">{l.source}</td>
            <td className="py-2">{l.status}</td>
            <td className="py-2 text-right font-mono">{l.estimated_value ? currency.format(l.estimated_value) : "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

async function FinancieroTable({ supabase }: { supabase: Supa }) {
  const { data: payments } = await supabase
    .from("payments")
    .select("amount, status, due_date, projects(name, clients(name))")
    .order("due_date", { ascending: false });

  return (
    <table className="mt-6 w-full text-sm">
      <thead>
        <tr className="border-b border-carbon/20 text-left text-xs uppercase tracking-wide text-carbon/50">
          <th className="py-2">Cliente</th>
          <th className="py-2">Proyecto</th>
          <th className="py-2">Vence</th>
          <th className="py-2">Estado</th>
          <th className="py-2 text-right">Monto</th>
        </tr>
      </thead>
      <tbody>
        {(payments ?? []).map((p, i) => (
          <tr key={i} className="border-b border-carbon/10">
            <td className="py-2">{p.projects?.clients?.name ?? "—"}</td>
            <td className="py-2">{p.projects?.name ?? "—"}</td>
            <td className="py-2">{p.due_date ?? "—"}</td>
            <td className="py-2">{p.status}</td>
            <td className="py-2 text-right font-mono">{currency.format(p.amount)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

async function ProyectosTable({ supabase }: { supabase: Supa }) {
  const { data: projects } = await supabase
    .from("projects")
    .select("name, status, progress, clients(name), estimated_end_date")
    .order("created_at", { ascending: false });

  return (
    <table className="mt-6 w-full text-sm">
      <thead>
        <tr className="border-b border-carbon/20 text-left text-xs uppercase tracking-wide text-carbon/50">
          <th className="py-2">Proyecto</th>
          <th className="py-2">Cliente</th>
          <th className="py-2">Estado</th>
          <th className="py-2 text-right">Progreso</th>
          <th className="py-2 text-right">Entrega</th>
        </tr>
      </thead>
      <tbody>
        {(projects ?? []).map((p) => (
          <tr key={p.name} className="border-b border-carbon/10">
            <td className="py-2">{p.name}</td>
            <td className="py-2">{p.clients?.name ?? "—"}</td>
            <td className="py-2">{PROJECT_STATUS_LABELS[p.status as ProjectStatus]}</td>
            <td className="py-2 text-right font-mono">{p.progress}%</td>
            <td className="py-2 text-right font-mono">{p.estimated_end_date ?? "—"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

async function MarketingTable({ supabase }: { supabase: Supa }) {
  const [{ data: leads }, { data: clients }, { data: projects }, { data: contracts }] = await Promise.all([
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
    <table className="mt-6 w-full text-sm">
      <thead>
        <tr className="border-b border-carbon/20 text-left text-xs uppercase tracking-wide text-carbon/50">
          <th className="py-2">Fuente</th>
          <th className="py-2 text-right">Leads</th>
          <th className="py-2 text-right">Clientes</th>
          <th className="py-2 text-right">Proyectos</th>
          <th className="py-2 text-right">Ingresos</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.source} className="border-b border-carbon/10">
            <td className="py-2">{r.source}</td>
            <td className="py-2 text-right font-mono">{r.leads}</td>
            <td className="py-2 text-right font-mono">{r.clients}</td>
            <td className="py-2 text-right font-mono">{r.projects}</td>
            <td className="py-2 text-right font-mono">{currency.format(r.contractedValue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
