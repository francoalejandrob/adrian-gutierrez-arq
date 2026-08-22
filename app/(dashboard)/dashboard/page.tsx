import Link from "next/link";
import { computePipeline } from "@/lib/pipeline";
import { createClient } from "@/lib/supabase/server";

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

// Ecuador (UTC-5) — the studio's only timezone. A fixed offset is a
// reasonable simplification for a single-tenant, single-country app
// (same assumption the rest of the app makes with es-EC date formatting).
function greeting() {
  const localHour = (new Date().getUTCHours() - 5 + 24) % 24;
  if (localHour < 12) return "Buenos días";
  if (localHour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [
    { data: userRes },
    { data: overdueTasks },
    { count: newLeadsCount },
    { data: payments },
    { count: pendingApprovalsCount },
    { count: meetingsTodayCount },
    { data: activeProjects },
    { data: allLeads },
    { data: activity },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase
      .from("tasks")
      .select("id, title, due_date, projects(name)")
      .lt("due_date", today)
      .neq("status", "completed")
      .order("due_date"),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "nuevo"),
    supabase.from("payments").select("amount, status"),
    supabase.from("document_versions").select("*", { count: "exact", head: true }).eq("status", "enviado"),
    supabase
      .from("calendar_events")
      .select("*", { count: "exact", head: true })
      .gte("starts_at", todayStart.toISOString())
      .lte("starts_at", todayEnd.toISOString()),
    supabase
      .from("projects")
      .select("id, name, progress, clients(name)")
      .not("status", "in", "(completed,cancelled,on_hold)")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase.from("leads").select("status, estimated_value"),
    supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(6),
  ]);

  const { data: profile } = userRes?.user
    ? await supabase.from("profiles").select("full_name, email").eq("id", userRes.user.id).maybeSingle()
    : { data: null };
  const firstName = (profile?.full_name || profile?.email || "").split(" ")[0] || "";

  const overdueCount = overdueTasks?.length ?? 0;
  const pendingCollection = (payments ?? [])
    .filter((p) => p.status === "pendiente" || p.status === "vencida")
    .reduce((sum, p) => sum + p.amount, 0);
  const overduePaymentsCount = (payments ?? []).filter((p) => p.status === "vencida").length;

  const projectIds = (activeProjects ?? []).map((p) => p.id);
  const { data: phasesForActive } = projectIds.length
    ? await supabase.from("phases").select("project_id, name, status, position").in("project_id", projectIds).order("position")
    : { data: [] };
  const currentPhaseByProject = new Map<string, string>();
  for (const phase of phasesForActive ?? []) {
    if (!currentPhaseByProject.has(phase.project_id) || phase.status !== "completada") {
      if (phase.status !== "completada" || !currentPhaseByProject.has(phase.project_id)) {
        currentPhaseByProject.set(phase.project_id, phase.name);
      }
    }
  }

  const pipeline = computePipeline(allLeads ?? []);
  const pipelineTotal = pipeline.reduce((sum, s) => sum + s.value, 0);
  const maxStageValue = Math.max(1, ...pipeline.map((s) => s.value));

  return (
    <div>
      <div className="flex items-start justify-between gap-6 border-b border-carbon/[0.08] pb-7">
        <div>
          <span className="mb-3.5 inline-block bg-naranja-oscuro px-2.5 py-1 text-[11px] uppercase tracking-[0.09em] text-white">
            {greeting()}{firstName ? `, ${firstName}` : ""}
          </span>
          <h1 className="max-w-xl font-display text-[34px] font-medium leading-[1.1] tracking-[-0.01em] text-carbon sm:text-[38px]">
            Esto es lo importante hoy.
          </h1>
        </div>
      </div>

      <div className="mt-9 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Tareas críticas" value={overdueCount} accent={overdueCount > 0 ? "#a4432b" : "#6e6659"} tint={overdueCount > 0} />
        <Kpi label="Reuniones hoy" value={meetingsTodayCount ?? 0} accent="#6e6659" />
        <Kpi label="Leads nuevos" value={newLeadsCount ?? 0} accent="#b26a45" tint={(newLeadsCount ?? 0) > 0} />
        <Kpi label="Pendiente de cobro" value={currency.format(pendingCollection)} accent="#b26a45" dark />
      </div>

      <div className="mt-12 grid grid-cols-1 gap-14 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-medium text-carbon">Proyectos activos</h2>
            <Link href="/dashboard/projects" className="text-xs text-carbon/45 underline underline-offset-2 hover:text-naranja-oscuro">
              Ver todos
            </Link>
          </div>
          <div className="flex flex-col">
            {(activeProjects ?? []).map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="flex items-center gap-4 border-b border-carbon/[0.06] py-3.5 transition-colors duration-150 last:border-0 hover:bg-white"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-baseline justify-between">
                    <span className="text-[14.5px] font-medium text-carbon">{project.name}</span>
                    <span className="font-mono text-[13px] text-carbon/55">{project.progress}%</span>
                  </div>
                  <div className="h-1 w-full bg-carbon/[0.08]">
                    <div className="h-1 bg-naranja" style={{ width: `${project.progress}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-carbon/45">
                    {project.clients?.name}
                    {currentPhaseByProject.get(project.id) ? ` · ${currentPhaseByProject.get(project.id)}` : ""}
                  </p>
                </div>
              </Link>
            ))}
            {(activeProjects ?? []).length === 0 && (
              <p className="py-6 text-sm text-carbon/40">Sin proyectos activos.</p>
            )}
          </div>
        </div>

        <div>
          <h2 className="mb-4 font-display text-xl font-medium text-carbon">Pipeline</h2>
          <p className="mb-3.5 font-mono text-[26px] font-medium text-carbon">{currency.format(pipelineTotal)}</p>
          <div className="mb-4 flex h-3 w-full gap-0.5">
            {pipeline.map((stage) => (
              <div
                key={stage.status}
                className="h-3 bg-naranja"
                style={{
                  width: pipelineTotal > 0 ? `${(stage.value / pipelineTotal) * 100}%` : `${100 / pipeline.length}%`,
                  opacity: 0.35 + (0.65 * stage.value) / maxStageValue,
                }}
              />
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {pipeline.map((stage) => (
              <div key={stage.status} className="flex items-center justify-between text-[12.5px]">
                <span className="flex items-center gap-2 text-carbon/60">
                  <span
                    className="h-2 w-2 shrink-0 bg-naranja"
                    style={{ opacity: 0.35 + (0.65 * stage.value) / maxStageValue }}
                  />
                  {stage.label}
                </span>
                <span className="font-mono font-medium text-carbon">{currency.format(stage.value)}</span>
              </div>
            ))}
          </div>

          <h2 className="mb-3.5 mt-9 font-display text-lg font-medium text-carbon">Alertas</h2>
          <div className="flex flex-col gap-1.5">
            {overdueCount > 0 && <AlertRow label={`${overdueCount} tarea${overdueCount === 1 ? "" : "s"} atrasada${overdueCount === 1 ? "" : "s"}`} tone="danger" />}
            {overduePaymentsCount > 0 && (
              <AlertRow label={`${overduePaymentsCount} pago${overduePaymentsCount === 1 ? "" : "s"} vencido${overduePaymentsCount === 1 ? "" : "s"}`} tone="danger" />
            )}
            {(pendingApprovalsCount ?? 0) > 0 && (
              <AlertRow label={`${pendingApprovalsCount} aprobación${pendingApprovalsCount === 1 ? "" : "es"} pendiente${pendingApprovalsCount === 1 ? "" : "s"}`} tone="warning" />
            )}
            {overdueCount === 0 && overduePaymentsCount === 0 && (pendingApprovalsCount ?? 0) === 0 && (
              <p className="text-sm text-carbon/40">Sin alertas por ahora.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-14">
        <h2 className="mb-4 font-display text-lg font-medium text-carbon">Actividad reciente</h2>
        <div className="flex flex-col">
          {(activity ?? []).map((item) => (
            <div key={item.id} className="flex gap-4 border-b border-carbon/[0.06] py-3 text-[13.5px] last:border-0">
              <span className="w-14 shrink-0 font-mono text-[11.5px] text-carbon/40">
                {new Date(item.created_at).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="text-carbon/80">{item.body}</span>
            </div>
          ))}
          {(activity ?? []).length === 0 && <p className="text-sm text-carbon/40">Sin actividad todavía.</p>}
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  accent,
  dark,
  tint,
}: {
  label: string;
  value: number | string;
  accent: string;
  dark?: boolean;
  tint?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-6 transition-all duration-150 hover:-translate-y-[3px] ${
        dark ? "bg-noche shadow-[0_8px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_10px_24px_rgba(0,0,0,0.28)]" : "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)]"
      }`}
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <p
        className="font-mono text-[34px] font-medium"
        style={{ color: dark ? "#f1eee8" : tint ? accent : undefined }}
      >
        {value}
      </p>
      <p className={`mt-2 text-[12.5px] ${dark ? "text-hueso/55" : "text-carbon/55"}`}>{label}</p>
    </div>
  );
}

function AlertRow({ label, tone }: { label: string; tone: "danger" | "warning" }) {
  return (
    <div
      className={`border-l-2 px-3 py-2.5 text-[13px] ${
        tone === "danger" ? "border-[#a4432b] bg-[#fdf1ee] text-[#7a2e1c]" : "border-naranja-oscuro bg-[#faf2ec] text-naranja-oscuro"
      }`}
    >
      {label}
    </div>
  );
}
