import type { createClient } from "@/lib/supabase/server";

// Real data-query functions, not stubs — this is the "backend" a
// tool-calling LLM invokes (section 34-35 of the master prompt). Every
// function takes the caller's *session-respecting* Supabase client, never
// an admin client: whatever the person chatting with Archi AI is allowed
// to see in the dashboard is exactly what these can return, because RLS
// enforces it the same way it does for every other page in the app —
// there is no separate, wider door for the AI.

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

export async function getOverdueTasks(supabase: SupabaseClient) {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from("tasks")
    .select("title, due_date, status, projects(name)")
    .lt("due_date", today)
    .neq("status", "completed")
    .order("due_date");
  if (error) throw new Error(error.message);

  return (data ?? []).map((task) => ({
    title: task.title,
    due_date: task.due_date,
    status: task.status,
    project: task.projects?.name ?? null,
  }));
}

export async function getPendingPayments(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("payments")
    .select("amount, due_date, status, projects(name, clients(name))")
    .in("status", ["pendiente", "vencida"])
    .order("due_date");
  if (error) throw new Error(error.message);

  return (data ?? []).map((payment) => ({
    amount: currency.format(payment.amount),
    due_date: payment.due_date,
    status: payment.status,
    project: payment.projects?.name ?? null,
    client: payment.projects?.clients?.name ?? null,
  }));
}

export async function getLeadsToContact(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("leads")
    .select("name, email, phone, status, source, created_at")
    .in("status", ["nuevo", "contactado"])
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function getProjectSummary(supabase: SupabaseClient, projectId: string) {
  const [{ data: project }, { data: phases }, { data: tasks }, { data: contracts }, { data: payments }] =
    await Promise.all([
      supabase.from("projects").select("name, status, progress, clients(name)").eq("id", projectId).maybeSingle(),
      supabase.from("phases").select("name, status").eq("project_id", projectId).order("position"),
      supabase.from("tasks").select("status").eq("project_id", projectId),
      supabase.from("contracts").select("value").eq("project_id", projectId),
      supabase.from("payments").select("amount, status").eq("project_id", projectId),
    ]);
  if (!project) throw new Error("Proyecto no encontrado o sin acceso.");

  const pendingTasks = (tasks ?? []).filter((t) => t.status !== "completed").length;
  const contracted = (contracts ?? []).reduce((sum, c) => sum + c.value, 0);
  const collected = (payments ?? []).filter((p) => p.status === "pagada").reduce((sum, p) => sum + p.amount, 0);

  return {
    name: project.name,
    client: project.clients?.name ?? null,
    status: project.status,
    progress: project.progress,
    phases: (phases ?? []).map((p) => ({ name: p.name, status: p.status })),
    pending_tasks: pendingTasks,
    contracted: currency.format(contracted),
    collected: currency.format(collected),
  };
}

export async function getRevenue(supabase: SupabaseClient) {
  const [{ data: contracts }, { data: payments }, { data: expenses }] = await Promise.all([
    supabase.from("contracts").select("value"),
    supabase.from("payments").select("amount, status"),
    supabase.from("expenses").select("amount"),
  ]);

  const contracted = (contracts ?? []).reduce((sum, c) => sum + c.value, 0);
  const collected = (payments ?? []).filter((p) => p.status === "pagada").reduce((sum, p) => sum + p.amount, 0);
  const pending = (payments ?? [])
    .filter((p) => p.status === "pendiente" || p.status === "vencida")
    .reduce((sum, p) => sum + p.amount, 0);
  const spent = (expenses ?? []).reduce((sum, e) => sum + e.amount, 0);

  return {
    contracted: currency.format(contracted),
    collected: currency.format(collected),
    pending: currency.format(pending),
    expenses: currency.format(spent),
    margin: currency.format(collected - spent),
  };
}

export async function getMarketingPerformance(supabase: SupabaseClient) {
  const [{ data: leads }, { data: clients }, { data: projects }, { data: contracts }] = await Promise.all([
    supabase.from("leads").select("id, source, utm_source"),
    supabase.from("clients").select("id, converted_from_lead_id"),
    supabase.from("projects").select("id, client_id"),
    supabase.from("contracts").select("project_id, value"),
  ]);

  const contractedByProject = new Map<string, number>();
  for (const c of contracts ?? []) contractedByProject.set(c.project_id, (contractedByProject.get(c.project_id) ?? 0) + c.value);
  const projectsByClient = new Map<string, string[]>();
  for (const p of projects ?? []) projectsByClient.set(p.client_id, [...(projectsByClient.get(p.client_id) ?? []), p.id]);
  const clientByLeadId = new Map<string, string>();
  for (const c of clients ?? []) if (c.converted_from_lead_id) clientByLeadId.set(c.converted_from_lead_id, c.id);

  const bySource = new Map<string, { source: string; leads: number; clients: number; contracted: number }>();
  for (const lead of leads ?? []) {
    const source = lead.utm_source || lead.source;
    const stats = bySource.get(source) ?? { source, leads: 0, clients: 0, contracted: 0 };
    stats.leads += 1;
    const clientId = clientByLeadId.get(lead.id);
    if (clientId) {
      stats.clients += 1;
      for (const pid of projectsByClient.get(clientId) ?? []) {
        stats.contracted += contractedByProject.get(pid) ?? 0;
      }
    }
    bySource.set(source, stats);
  }

  return [...bySource.values()]
    .sort((a, b) => b.leads - a.leads)
    .map((row) => ({ ...row, contracted: currency.format(row.contracted) }));
}

// JSON-schema tool definitions for the OpenAI Chat Completions API
// (function-calling). Kept next to the implementations so the two never
// drift apart.
export const AI_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "getOverdueTasks",
      description: "Lista las tareas vencidas (fecha límite pasada y no completadas) de todos los proyectos.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getPendingPayments",
      description: "Lista los pagos pendientes o vencidos de todos los proyectos.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getLeadsToContact",
      description: "Lista los leads en estado 'nuevo' o 'contactado' que todavía necesitan seguimiento.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getProjectSummary",
      description: "Resumen de un proyecto: estado, fases, tareas pendientes y finanzas básicas.",
      parameters: {
        type: "object",
        properties: { projectId: { type: "string", description: "UUID del proyecto" } },
        required: ["projectId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getRevenue",
      description: "Totales financieros globales: contratado, cobrado, pendiente, gastos y margen.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "getMarketingPerformance",
      description: "Leads, clientes convertidos y valor contratado, agrupados por fuente de marketing.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
];

export async function runTool(supabase: SupabaseClient, name: string, args: Record<string, unknown>) {
  switch (name) {
    case "getOverdueTasks":
      return getOverdueTasks(supabase);
    case "getPendingPayments":
      return getPendingPayments(supabase);
    case "getLeadsToContact":
      return getLeadsToContact(supabase);
    case "getProjectSummary":
      return getProjectSummary(supabase, String(args.projectId));
    case "getRevenue":
      return getRevenue(supabase);
    case "getMarketingPerformance":
      return getMarketingPerformance(supabase);
    default:
      throw new Error(`Herramienta desconocida: ${name}`);
  }
}
