import Link from "next/link";
import { computePipeline } from "@/lib/pipeline";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/dashboard/ui/page-header";
import Section from "@/components/dashboard/ui/section";
import ProgressBar from "@/components/dashboard/ui/progress-bar";

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
    { data: todayEvents },
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
      .select("id, title, starts_at")
      .gte("starts_at", todayStart.toISOString())
      .lte("starts_at", todayEnd.toISOString())
      .order("starts_at"),
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

  const instruments = [
    { label: "Tareas críticas", value: String(overdueCount), attention: overdueCount > 0 },
    { label: "Reuniones hoy", value: String((todayEvents ?? []).length), attention: false },
    { label: "Leads nuevos", value: String(newLeadsCount ?? 0), attention: false },
    { label: "Por cobrar", value: currency.format(pendingCollection), attention: pendingCollection > 0 },
  ];

  const attentionRows = [
    overdueCount > 0 ? `${overdueCount} tarea${overdueCount === 1 ? "" : "s"} atrasada${overdueCount === 1 ? "" : "s"}` : null,
    overduePaymentsCount > 0
      ? `${overduePaymentsCount} pago${overduePaymentsCount === 1 ? "" : "s"} vencido${overduePaymentsCount === 1 ? "" : "s"}`
      : null,
    (pendingApprovalsCount ?? 0) > 0
      ? `${pendingApprovalsCount} aprobación${pendingApprovalsCount === 1 ? "" : "es"} pendiente${pendingApprovalsCount === 1 ? "" : "s"}`
      : null,
  ].filter((row): row is string => row !== null);

  return (
    <div>
      <PageHeader eyebrow={`${greeting()}${firstName ? `, ${firstName}` : ""}`} title="Esto es lo importante hoy." />

      <div className="grid grid-cols-2 gap-4 px-12 pt-8 lg:grid-cols-4">
        {instruments.map((item, i) => (
          <div key={item.label} className={`dp-card relative p-7 ${item.attention ? "border-acento/30" : ""}`}>
            {item.attention && <span className="absolute left-0 top-0 h-full w-[3px] bg-acento" />}
            <p className="font-dp-mono text-[10px] text-concreto">{String(i + 1).padStart(2, "0")}</p>
            <p className={`mt-4 font-dp-mono text-[30px] leading-none ${item.attention ? "text-acento" : "text-tinta"}`}>
              {item.value}
            </p>
            <p className="mt-3 font-dp-mono text-[9.5px] uppercase tracking-[0.13em] text-grafito">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-12 px-12 py-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <Section
          title="Proyectos activos"
          action={
            <Link href="/dashboard/projects" className="font-dp-mono text-[9.5px] uppercase tracking-[0.12em] text-concreto hover:text-tinta">
              Ver todos →
            </Link>
          }
        >
          <div className="flex flex-col">
            {(activeProjects ?? []).map((project, i) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="flex items-baseline gap-5 border-b border-filete py-4 last:border-0"
              >
                <span className="font-dp-mono text-[10px] text-concreto">{String(i + 1).padStart(2, "0")}</span>
                <div className="min-w-0 flex-1">
                  <div className="mb-2.5 flex items-baseline justify-between gap-4">
                    <span className="truncate font-dp-serif text-lg text-tinta">{project.name}</span>
                    <span className="shrink-0 font-dp-mono text-[12px] text-concreto">{project.progress}%</span>
                  </div>
                  <ProgressBar value={project.progress} animate />
                  <p className="mt-2.5 font-dp-sans text-xs text-concreto">
                    {project.clients?.name}
                    {currentPhaseByProject.get(project.id) ? ` · ${currentPhaseByProject.get(project.id)}` : ""}
                  </p>
                </div>
              </Link>
            ))}
            {(activeProjects ?? []).length === 0 && (
              <p className="py-6 font-dp-sans text-sm text-concreto">Sin proyectos activos.</p>
            )}
          </div>
        </Section>

        <div className="flex flex-col gap-10">
          <Section title="Hoy">
            <div className="flex flex-col">
              {(todayEvents ?? []).map((event) => (
                <div key={event.id} className="flex items-baseline gap-4 border-b border-filete py-2.5 last:border-0">
                  <span className="w-12 shrink-0 font-dp-mono text-[11px] text-concreto">
                    {new Date(event.starts_at).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="truncate font-dp-sans text-[13px] text-tinta">{event.title}</span>
                </div>
              ))}
              {(todayEvents ?? []).length === 0 && <p className="font-dp-sans text-[13px] text-concreto">Sin reuniones hoy.</p>}
            </div>
          </Section>

          <Section title="Pipeline">
            <p className="mb-4 font-dp-mono text-2xl text-tinta">{currency.format(pipelineTotal)}</p>
            <div className="mb-4 flex h-[3px] w-full gap-px bg-filete">
              {pipeline.map((stage) => (
                <div
                  key={stage.status}
                  className={stage.status === "ganado" ? "h-[3px] bg-verde" : "h-[3px] bg-tinta"}
                  style={{
                    width: pipelineTotal > 0 ? `${(stage.value / pipelineTotal) * 100}%` : `${100 / pipeline.length}%`,
                    opacity: stage.status === "ganado" ? 1 : 0.35 + (0.65 * stage.value) / maxStageValue,
                  }}
                />
              ))}
            </div>
            <div className="flex flex-col gap-2">
              {pipeline.map((stage) => (
                <div key={stage.status} className="flex items-center justify-between font-dp-sans text-[12.5px]">
                  <span className="text-grafito">{stage.label}</span>
                  <span className={`font-dp-mono ${stage.status === "ganado" ? "text-verde" : "text-tinta"}`}>
                    {currency.format(stage.value)}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Atención">
            <div className="flex flex-col gap-2.5">
              {attentionRows.map((row) => (
                <p key={row} className="border-l-2 border-acento pl-3 font-dp-sans text-[13px] text-tinta">
                  {row}
                </p>
              ))}
              {attentionRows.length === 0 && <p className="font-dp-sans text-[13px] text-concreto">Sin pendientes por ahora.</p>}
            </div>
          </Section>
        </div>
      </div>

      <div className="border-t border-corte px-12 py-10">
        <Section title="Actividad reciente">
          <div className="flex flex-col">
            {(activity ?? []).map((item) => (
              <div key={item.id} className="flex gap-5 border-b border-filete py-3 font-dp-sans text-[13px] last:border-0">
                <span className="w-14 shrink-0 font-dp-mono text-[11px] text-concreto">
                  {new Date(item.created_at).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="text-grafito">{item.body}</span>
              </div>
            ))}
            {(activity ?? []).length === 0 && <p className="font-dp-sans text-sm text-concreto">Sin actividad todavía.</p>}
          </div>
        </Section>
      </div>
    </div>
  );
}
