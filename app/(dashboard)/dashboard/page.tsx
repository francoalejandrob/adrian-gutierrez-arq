import Link from "next/link";
import { AlertTriangle, Calendar, CircleDollarSign, FileSignature, FolderKanban, UserPlus, Users, Wallet } from "lucide-react";
import { getAttentionSignals } from "@/lib/attention";
import { computePipeline } from "@/lib/pipeline";
import { createClient } from "@/lib/supabase/server";
import { getTrafficSummary } from "@/lib/integrations/google-analytics";
import { bucketTopN, TINTA_BG_SCALE, TINTA_STROKE_SCALE, TONE_BG, TONE_STROKE } from "@/lib/chart-colors";
import { bucketByDay, percentChange } from "@/lib/sparkline";
import PageHeader from "@/components/dashboard/ui/page-header";
import Section from "@/components/dashboard/ui/section";
import ProgressBar from "@/components/dashboard/ui/progress-bar";
import BarChart from "@/components/dashboard/ui/bar-chart";
import DonutChart from "@/components/dashboard/ui/donut-chart";
import Sparkline from "@/components/dashboard/ui/sparkline";
import {
  PROJECT_STATUS_LABELS,
  PROJECT_STATUS_TONE,
  PROJECT_STATUSES,
  TASK_STATUS_LABELS,
  TASK_STATUS_TONE,
  TASK_STATUSES,
} from "@/lib/supabase/types";

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const currencyCompact = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });

// Ecuador (UTC-5) — the studio's only timezone. A fixed offset is a
// reasonable simplification for a single-tenant, single-country app
// (same assumption the rest of the app makes with es-EC date formatting).
function greeting() {
  const localHour = (new Date().getUTCHours() - 5 + 24) % 24;
  if (localHour < 12) return "Buenos días";
  if (localHour < 19) return "Buenas tardes";
  return "Buenas noches";
}

async function safeTraffic() {
  try {
    return await getTrafficSummary();
  } catch (error) {
    return { configured: false as const, reason: error instanceof Error ? error.message : "Error inesperado." };
  }
}

// Real 7-day-vs-previous-7-day trend from a timestamped log — only ever
// called on tables that actually have a meaningful date to bucket by.
function trend(rows: { date: string }[]) {
  const buckets = bucketByDay(rows, (r) => r.date, () => 1, 14);
  const current = buckets.slice(7).reduce((a, b) => a + b, 0);
  const previous = buckets.slice(0, 7).reduce((a, b) => a + b, 0);
  return { buckets: buckets.slice(7), change: percentChange(current, previous) };
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { data: userRes },
    attention,
    { count: newLeadsCount },
    { data: payments },
    { data: activeProjects },
    { count: activeProjectsCount },
    { data: allLeads },
    { data: allProjects },
    { data: allTasks },
    { data: contracts },
    { data: allClients },
    { data: activity },
    traffic,
  ] = await Promise.all([
    supabase.auth.getUser(),
    getAttentionSignals(supabase),
    supabase.from("leads").select("*", { count: "exact", head: true }).eq("status", "nuevo"),
    supabase.from("payments").select("amount, status, paid_date"),
    supabase
      .from("projects")
      .select("id, name, progress, clients(name)")
      .not("status", "in", "(completed,cancelled,on_hold)")
      .order("created_at", { ascending: false })
      .limit(4),
    supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .not("status", "in", "(completed,cancelled,on_hold)"),
    supabase.from("leads").select("status, estimated_value, source, utm_source, created_at"),
    supabase.from("projects").select("status"),
    supabase.from("tasks").select("status"),
    supabase.from("contracts").select("value, created_at"),
    supabase.from("clients").select("created_at"),
    supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(6),
    safeTraffic(),
  ]);

  const { data: profile } = userRes?.user
    ? await supabase.from("profiles").select("full_name, email").eq("id", userRes.user.id).maybeSingle()
    : { data: null };
  const firstName = (profile?.full_name || profile?.email || "").split(" ")[0] || "";

  const overdueCount = attention.overdueTasks.length;
  const pendingCollection = (payments ?? [])
    .filter((p) => p.status === "pendiente" || p.status === "vencida")
    .reduce((sum, p) => sum + p.amount, 0);
  const paidPayments = (payments ?? []).filter((p) => p.status === "pagada" && p.paid_date);
  const collected = paidPayments.reduce((sum, p) => sum + p.amount, 0);
  const contracted = (contracts ?? []).reduce((sum, c) => sum + c.value, 0);

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

  // Sparklines — solo para métricas con un log real de fechas detrás
  // (leads/pagos/contratos/clientes). Tareas críticas, reuniones hoy y
  // por cobrar son una foto del momento, no una serie — se dejan sin
  // sparkline en vez de inventar una tendencia.
  const leadsTrend = trend((allLeads ?? []).map((l) => ({ date: l.created_at })));
  const collectedTrend = trend(paidPayments.map((p) => ({ date: p.paid_date! })));
  const clientsTrend = trend((allClients ?? []).map((c) => ({ date: c.created_at })));
  const contractsTrend = trend((contracts ?? []).map((c) => ({ date: c.created_at })));

  const instruments = [
    { label: "Tareas críticas", value: String(overdueCount), attention: overdueCount > 0, icon: AlertTriangle, trend: undefined },
    { label: "Reuniones hoy", value: String(attention.todayMeetings.length), attention: false, icon: Calendar, trend: undefined },
    { label: "Leads nuevos", value: String(newLeadsCount ?? 0), attention: false, icon: UserPlus, trend: leadsTrend },
    { label: "Por cobrar", value: currency.format(pendingCollection), attention: pendingCollection > 0, icon: Wallet, trend: undefined },
  ];

  const summary = [
    { label: "Contratado", value: currencyCompact.format(contracted), icon: FileSignature, trend: contractsTrend },
    { label: "Cobrado", value: currencyCompact.format(collected), tone: "positive" as const, icon: CircleDollarSign, trend: collectedTrend },
    { label: "Clientes", value: String((allClients ?? []).length), icon: Users, trend: clientsTrend },
    { label: "Proyectos activos", value: String(activeProjectsCount ?? 0), icon: FolderKanban },
  ];

  // Bandeja unificada de atención — cada fila es un item real y
  // clickeable (antes era solo texto plano con conteos). Se capa a 3
  // por categoría para que el panel no crezca sin límite; el "+N más"
  // manda a la sección correspondiente.
  const attentionGroups = [
    {
      key: "tasks",
      items: attention.overdueTasks.map((t) => ({ id: t.id, label: t.title, detail: t.projectName ?? "Sin proyecto", href: t.href })),
      moreHref: "/dashboard/projects",
      moreLabel: "tarea(s) atrasada(s) más",
    },
    {
      key: "payments",
      items: attention.pendingPayments.map((p) => ({
        id: p.id,
        label: currency.format(p.amount),
        detail: `${p.clientName ?? "Sin cliente"}${p.status === "vencida" ? " · vencido" : " · pendiente"}`,
        href: p.href,
      })),
      moreHref: "/dashboard/finance",
      moreLabel: "pago(s) más",
    },
    {
      key: "leads",
      items: attention.leadsToContact.map((l) => ({ id: l.id, label: l.name, detail: "Sin seguimiento", href: l.href })),
      moreHref: "/dashboard/crm?tab=leads",
      moreLabel: "lead(s) más",
    },
    {
      key: "approvals",
      items: attention.pendingApprovals.map((a) => ({
        id: a.documentId,
        label: a.documentName,
        detail: a.projectName ?? "Sin proyecto",
        href: a.href,
      })),
      moreHref: "/dashboard/projects",
      moreLabel: "aprobación(es) más",
    },
  ].map((group) => ({ ...group, shown: group.items.slice(0, 3), extra: Math.max(0, group.items.length - 3) }));
  const attentionItemCount = attentionGroups.reduce((sum, g) => sum + g.items.length, 0);

  // Leads por fuente — misma agrupación que el embudo de marketing
  // (utm_source si existe, si no el source manual), capada a 5 rebanadas.
  const leadsBySource = new Map<string, number>();
  for (const lead of allLeads ?? []) {
    const source = lead.utm_source || lead.source;
    leadsBySource.set(source, (leadsBySource.get(source) ?? 0) + 1);
  }
  const leadSourceData = bucketTopN(
    [...leadsBySource.entries()].map(([label, value]) => ({ label, value })),
    5,
  ).map((row, i) => ({ ...row, colorClass: TINTA_STROKE_SCALE[i] }));

  // Proyectos por estado — cada estado real con su propio tono (mismo
  // mapeo de PROJECT_STATUS_TONE que usan las pastillas en el resto del
  // producto), no un bucket de 3 — más matiz, una sola fuente de verdad.
  const projectStatusCounts = new Map<string, number>();
  for (const project of allProjects ?? []) {
    projectStatusCounts.set(project.status, (projectStatusCounts.get(project.status) ?? 0) + 1);
  }
  const projectStatusData = PROJECT_STATUSES.map((status) => ({
    label: PROJECT_STATUS_LABELS[status],
    value: projectStatusCounts.get(status) ?? 0,
    colorClass: TONE_STROKE[PROJECT_STATUS_TONE[status]],
  })).filter((row) => row.value > 0);

  // Tareas por estado — todas las tareas de todos los proyectos, mismo
  // mapeo de tono que TASK_STATUS_TONE usa en el workspace de proyecto.
  const taskCounts = new Map<string, number>();
  for (const task of allTasks ?? []) {
    taskCounts.set(task.status, (taskCounts.get(task.status) ?? 0) + 1);
  }
  const taskStatusData = TASK_STATUSES.map((status) => ({
    label: TASK_STATUS_LABELS[status],
    value: taskCounts.get(status) ?? 0,
    colorClass: TONE_BG[TASK_STATUS_TONE[status]],
  }));

  const trafficChannelData = traffic.configured
    ? bucketTopN(
        traffic.data.byChannel.map((row) => ({ label: row.channel, value: row.sessions })),
        6,
      ).map((row, i) => ({ ...row, colorClass: TINTA_BG_SCALE[i] }))
    : [];

  return (
    <div>
      <PageHeader eyebrow={`${greeting()}${firstName ? `, ${firstName}` : ""}`} title="Esto es lo importante hoy." />

      <div className="grid grid-cols-2 gap-4 px-5 pt-8 sm:px-12 lg:grid-cols-4">
        {instruments.map((item, i) => (
          <div key={item.label} className={`dp-card relative p-7 ${item.attention ? "border-acento/30" : ""}`}>
            {item.attention && <span className="absolute left-0 top-0 h-full w-[3px] bg-acento" />}
            <div className="flex items-start justify-between">
              <p className="font-dp-mono text-[10px] text-concreto">{String(i + 1).padStart(2, "0")}</p>
              <item.icon size={16} strokeWidth={1.75} className={item.attention ? "text-acento" : "text-corte"} aria-hidden="true" />
            </div>
            <p className={`mt-4 font-dp-mono text-[30px] leading-none ${item.attention ? "text-acento" : "text-tinta"}`}>
              {item.value}
            </p>
            <div className="mt-3 flex items-center justify-between gap-2">
              <p className="font-dp-mono text-[9.5px] uppercase tracking-[0.13em] text-grafito">{item.label}</p>
              {item.trend && (
                <span className={`shrink-0 font-dp-mono text-[10px] ${item.trend.change >= 0 ? "text-verde" : "text-acento"}`}>
                  {item.trend.change >= 0 ? "+" : ""}
                  {item.trend.change}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mx-5 mt-6 grid grid-cols-2 gap-4 sm:mx-12 lg:grid-cols-4">
        {summary.map((item) => (
          <div key={item.label} className="dp-card p-6">
            <div className="flex items-start justify-between gap-2">
              <p className="font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-concreto">{item.label}</p>
              <item.icon size={15} strokeWidth={1.75} className="shrink-0 text-corte" aria-hidden="true" />
            </div>
            <p className={`mt-2.5 font-dp-mono text-xl ${item.tone === "positive" ? "text-verde" : "text-tinta"}`}>{item.value}</p>
            {item.trend && (
              <div className="mt-3 flex items-center justify-between gap-2">
                <Sparkline data={item.trend.buckets} positive={item.trend.change >= 0} width={64} height={22} />
                <span className={`shrink-0 font-dp-mono text-[10.5px] ${item.trend.change >= 0 ? "text-verde" : "text-acento"}`}>
                  {item.trend.change >= 0 ? "+" : ""}
                  {item.trend.change}%
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-12 px-5 py-8 sm:px-12 sm:py-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
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
              {attention.todayMeetings.map((event) => (
                <Link
                  key={event.id}
                  href={event.href}
                  className="flex items-baseline gap-4 border-b border-filete py-2.5 last:border-0 hover:text-acento"
                >
                  <span className="w-12 shrink-0 font-dp-mono text-[11px] text-concreto">
                    {new Date(event.starts_at).toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className="truncate font-dp-sans text-[13px] text-tinta">{event.title}</span>
                </Link>
              ))}
              {attention.todayMeetings.length === 0 && <p className="font-dp-sans text-[13px] text-concreto">Sin reuniones hoy.</p>}
            </div>
          </Section>

          <Section title="Atención">
            <div className="flex flex-col gap-4">
              {attentionGroups.map(
                (group) =>
                  group.items.length > 0 && (
                    <div key={group.key} className="flex flex-col">
                      {group.shown.map((item) => (
                        <Link
                          key={item.id}
                          href={item.href}
                          className="flex items-center justify-between gap-4 border-l-2 border-acento py-1.5 pl-3 font-dp-sans text-[13px] text-tinta hover:text-acento"
                        >
                          <span className="truncate">{item.label}</span>
                          <span className="shrink-0 font-dp-mono text-[10.5px] text-concreto">{item.detail}</span>
                        </Link>
                      ))}
                      {group.extra > 0 && (
                        <Link
                          href={group.moreHref}
                          className="pl-3 pt-1 font-dp-mono text-[10.5px] uppercase tracking-[0.1em] text-concreto hover:text-tinta"
                        >
                          +{group.extra} {group.moreLabel} →
                        </Link>
                      )}
                    </div>
                  ),
              )}
              {attentionItemCount === 0 && <p className="font-dp-sans text-[13px] text-concreto">Sin pendientes por ahora.</p>}
            </div>
          </Section>
        </div>
      </div>

      <div className="border-t border-corte px-5 py-8 sm:px-12 sm:py-10">
        <p className="mb-6 font-dp-mono text-[10px] uppercase tracking-[0.16em] text-concreto">Analíticas</p>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <Section title="Pipeline por etapa">
            <p className="mb-5 font-dp-mono text-2xl text-tinta">{currency.format(pipelineTotal)}</p>
            <BarChart
              data={pipeline.map((stage) => ({
                label: stage.label,
                value: stage.value,
                displayValue: currency.format(stage.value),
                colorClass: stage.status === "ganado" ? "bg-verde" : "bg-tinta",
              }))}
            />
          </Section>

          <Section title="Leads por fuente">
            <DonutChart data={leadSourceData} centerValue={String(allLeads?.length ?? 0)} centerLabel="Leads" />
          </Section>

          <Section title="Proyectos por estado">
            <DonutChart data={projectStatusData} centerValue={String((allProjects ?? []).length)} centerLabel="Total" />
          </Section>

          <Section title="Tareas por estado">
            <BarChart data={taskStatusData} />
          </Section>

          {traffic.configured && trafficChannelData.length > 0 && (
            <Section title="Tráfico del sitio por canal" className="lg:col-span-2">
              <div className="mb-5 flex gap-10">
                <div>
                  <p className="font-dp-mono text-2xl text-tinta">{traffic.data.totals.sessions.toLocaleString("es-EC")}</p>
                  <p className="mt-1.5 font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-concreto">Sesiones · 28 días</p>
                </div>
                <div>
                  <p className="font-dp-mono text-2xl text-tinta">{traffic.data.totals.activeUsers.toLocaleString("es-EC")}</p>
                  <p className="mt-1.5 font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-concreto">Usuarios activos</p>
                </div>
              </div>
              <BarChart data={trafficChannelData} />
            </Section>
          )}

          {!traffic.configured && (
            <Section title="Tráfico del sitio" className="lg:col-span-2">
              <p className="font-dp-sans text-[13px] text-concreto">
                Conectá Google Analytics para ver tráfico por canal acá.{" "}
                <Link href="/dashboard/website" className="text-tinta underline underline-offset-2 hover:text-acento">
                  Ver Observatorio digital →
                </Link>
              </p>
            </Section>
          )}
        </div>
      </div>

      <div className="border-t border-corte px-5 py-8 sm:px-12 sm:py-10">
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
