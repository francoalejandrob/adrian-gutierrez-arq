import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/lib/supabase/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: leads }, { count: clientCount }, { count: activeProjects }, { data: overdueTasks }] =
    await Promise.all([
      supabase.from("leads").select("status"),
      supabase.from("clients").select("*", { count: "exact", head: true }),
      supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .not("status", "in", "(completed,cancelled,on_hold)"),
      supabase
        .from("tasks")
        .select("id, title, due_date, projects(name)")
        .lt("due_date", today)
        .neq("status", "completed")
        .order("due_date"),
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
        <Kpi label="Proyectos activos" value={activeProjects ?? 0} />
        <Kpi label="Tareas vencidas" value={overdueTasks?.length ?? 0} alert={(overdueTasks?.length ?? 0) > 0} />
      </div>

      {(overdueTasks?.length ?? 0) > 0 && (
        <div className="mt-10 border border-red-200 bg-red-50 p-6">
          <h2 className="text-sm font-medium text-red-800">Tareas vencidas</h2>
          <div className="mt-4 flex flex-col gap-2">
            {overdueTasks!.map((task) => (
              <div key={task.id} className="flex items-center justify-between text-sm">
                <span className="text-red-900">
                  {task.title}
                  <span className="ml-2 text-xs text-red-700/70">
                    {(task.projects as unknown as { name: string } | null)?.name}
                  </span>
                </span>
                <span className="text-xs text-red-700">
                  {new Date(task.due_date!).toLocaleDateString("es-EC")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

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

function Kpi({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className={`border p-5 ${alert ? "border-red-200 bg-red-50" : "border-carbon/10 bg-white"}`}>
      <p className={`text-2xl font-semibold ${alert ? "text-red-700" : "text-carbon"}`}>{value}</p>
      <p className={`mt-1 text-xs uppercase tracking-wide ${alert ? "text-red-600/70" : "text-carbon/50"}`}>
        {label}
      </p>
    </div>
  );
}
