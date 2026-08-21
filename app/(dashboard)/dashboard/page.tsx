import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/supabase/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: leads }, { count: clientCount }] = await Promise.all([
    supabase.from("leads").select("status"),
    supabase.from("clients").select("*", { count: "exact", head: true }),
  ]);

  const byStatus = (Object.keys(LEAD_STATUS_LABELS) as LeadStatus[]).map((status) => ({
    status,
    count: leads?.filter((l) => l.status === status).length ?? 0,
  }));

  const openLeads =
    leads?.filter((l) => l.status !== "ganado" && l.status !== "perdido").length ?? 0;

  return (
    <div>
      <h1 className="font-display text-2xl text-carbon">Dashboard</h1>
      <p className="mt-1 text-sm text-carbon/60">
        Resumen de tu estudio.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi label="Leads abiertos" value={openLeads} />
        <Kpi label="Clientes" value={clientCount ?? 0} />
        {byStatus
          .filter((s) => s.status === "propuesta" || s.status === "negociacion")
          .map((s) => (
            <Kpi key={s.status} label={LEAD_STATUS_LABELS[s.status]} value={s.count} />
          ))}
      </div>

      <div className="mt-10 border border-carbon/10 bg-white p-6">
        <h2 className="text-sm font-medium text-carbon">Leads por estado</h2>
        <div className="mt-4 flex flex-col gap-2">
          {byStatus.map((s) => (
            <div key={s.status} className="flex items-center justify-between text-sm">
              <span className="text-carbon/70">{LEAD_STATUS_LABELS[s.status]}</span>
              <span className="font-medium text-carbon">{s.count}</span>
            </div>
          ))}
        </div>
        <Link
          href="/dashboard/leads"
          className="mt-4 inline-block text-xs uppercase tracking-wide text-carbon/60 underline underline-offset-4 hover:text-carbon"
        >
          Ver todos los leads
        </Link>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-carbon/10 bg-white p-5">
      <p className="text-2xl font-semibold text-carbon">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-carbon/50">{label}</p>
    </div>
  );
}
