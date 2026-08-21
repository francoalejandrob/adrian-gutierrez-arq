import Link from "next/link";
import { AlertTriangle, Briefcase, FolderKanban, Target, type LucideIcon } from "lucide-react";
import PageHeader from "@/components/dashboard/ui/page-header";
import Section from "@/components/dashboard/ui/section";
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
  const overdueCount = overdueTasks?.length ?? 0;

  return (
    <div>
      <PageHeader title="Dashboard" description="Resumen de tu estudio." />

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Kpi icon={Target} label="Leads abiertos" value={openLeads} />
        <Kpi icon={Briefcase} label="Clientes" value={clientCount ?? 0} />
        <Kpi icon={FolderKanban} label="Proyectos activos" value={activeProjects ?? 0} />
        <Kpi icon={AlertTriangle} label="Tareas vencidas" value={overdueCount} alert={overdueCount > 0} />
      </div>

      {overdueCount > 0 && (
        <div className="mt-10 border border-red-200 bg-red-50 p-6">
          <h2 className="flex items-center gap-2 text-sm font-medium text-red-800">
            <AlertTriangle size={16} strokeWidth={1.75} aria-hidden="true" />
            Tareas vencidas
          </h2>
          <div className="mt-4 flex flex-col gap-2">
            {overdueTasks!.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between border-b border-red-100 pb-2 text-sm last:border-0 last:pb-0"
              >
                <span className="text-red-900">
                  {task.title}
                  <span className="ml-2 text-xs text-red-700/70">
                    {(task.projects as unknown as { name: string } | null)?.name}
                  </span>
                </span>
                <span className="font-mono text-xs text-red-700">
                  {new Date(task.due_date!).toLocaleDateString("es-EC")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Section title="Leads por estado">
        <div className="flex flex-col gap-2">
          {byStatus.map((s) => (
            <div key={s.status} className="flex items-center justify-between text-sm">
              <span className="text-carbon/70">{LEAD_STATUS_LABELS[s.status]}</span>
              <span className="font-mono font-medium text-carbon">{s.count}</span>
            </div>
          ))}
        </div>
        <Link
          href="/dashboard/leads"
          className="mt-4 inline-block text-xs uppercase tracking-wide text-carbon/60 underline underline-offset-4 transition-colors hover:text-carbon"
        >
          Ver todos los leads
        </Link>
      </Section>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  alert,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  alert?: boolean;
}) {
  return (
    <div className={`border p-5 ${alert ? "border-red-200 bg-red-50" : "border-carbon/10 bg-white"}`}>
      <Icon
        size={18}
        strokeWidth={1.75}
        className={alert ? "text-red-500" : "text-carbon/30"}
        aria-hidden="true"
      />
      <p className={`mt-3 font-mono text-2xl font-semibold ${alert ? "text-red-700" : "text-carbon"}`}>
        {value}
      </p>
      <p className={`mt-1 text-xs uppercase tracking-wide ${alert ? "text-red-600/70" : "text-carbon/50"}`}>
        {label}
      </p>
    </div>
  );
}
