import { z } from "zod";
import { getAttentionSignals } from "@/lib/attention";
import { geocodeAddress } from "@/lib/integrations/google-geocoding";
import { applyPhaseTemplate } from "@/lib/phase-templates";
import type { createClient } from "@/lib/supabase/server";
import { getCurrentOrganizationId } from "@/lib/supabase/org";
import {
  CONTRACT_STATUSES,
  EXPENSE_CATEGORIES,
  LEAD_STATUSES,
  PAYMENT_STATUSES,
  PHASE_STATUSES,
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
  QUOTE_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "@/lib/supabase/types";

// Real data-query functions, not stubs — this is the "backend" a
// tool-calling LLM invokes (section 34-35 of the master prompt). Every
// function takes the caller's *session-respecting* Supabase client, never
// an admin client: whatever the person chatting with Archi AI is allowed
// to see in the dashboard is exactly what these can return, because RLS
// enforces it the same way it does for every other page in the app —
// there is no separate, wider door for the AI.

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

// Wrappers delgados sobre lib/attention.ts — antes cada una reimplementaba
// su propia consulta, con definiciones que terminaron divergiendo de lo
// que mostraba el resto del dashboard (ver lib/attention.ts). Mantienen
// su forma de respuesta anterior para no romper el contrato de la tool.
export async function getOverdueTasks(supabase: SupabaseClient) {
  const { overdueTasks } = await getAttentionSignals(supabase);
  return overdueTasks.map((t) => ({
    title: t.title,
    due_date: t.due_date,
    status: t.status,
    project: t.projectName,
  }));
}

export async function getPendingPayments(supabase: SupabaseClient) {
  const { pendingPayments } = await getAttentionSignals(supabase);
  return pendingPayments.map((p) => ({
    id: p.id,
    amount: currency.format(p.amount),
    due_date: p.due_date,
    status: p.status,
    project: p.projectName,
    client: p.clientName,
  }));
}

export async function getLeadsToContact(supabase: SupabaseClient) {
  const { leadsToContact } = await getAttentionSignals(supabase);
  return leadsToContact.map((l) => ({
    id: l.id,
    name: l.name,
    email: l.email,
    phone: l.phone,
    status: l.status,
    source: l.source,
    created_at: l.created_at,
  }));
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

// Herramientas de lectura auxiliares: la IA no puede adivinar UUIDs,
// así que necesita poder resolver "el proyecto de la casa Rodríguez" o
// "el cliente Pérez" a un id real antes de agendar/cotizar/crear algo
// ligado a un proyecto o cliente existente. Mismo motivo para las de
// abajo (fases, tareas, contratos, gastos, cotizaciones, eventos): cada
// entidad que una tool de escritura puede actualizar/borrar necesita un
// list* que devuelva ids reales.
export async function listProjects(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, status, clients(name)")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);

  return (data ?? []).map((project) => ({
    id: project.id,
    name: project.name,
    status: project.status,
    client: project.clients?.name ?? null,
  }));
}

export async function listClients(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, company")
    .order("name")
    .limit(50);
  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function listPhases(supabase: SupabaseClient, projectId: string) {
  const { data, error } = await supabase
    .from("phases")
    .select("id, name, status, progress")
    .eq("project_id", projectId)
    .order("position");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listTasks(supabase: SupabaseClient, projectId: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, status, priority, due_date")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listContracts(supabase: SupabaseClient, projectId: string) {
  const { data, error } = await supabase
    .from("contracts")
    .select("id, value, status, start_date")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((c) => ({ ...c, value: currency.format(c.value) }));
}

export async function listExpenses(supabase: SupabaseClient, projectId: string) {
  const { data, error } = await supabase
    .from("expenses")
    .select("id, category, amount, date, description")
    .eq("project_id", projectId)
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((e) => ({ ...e, amount: currency.format(e.amount) }));
}

export async function listQuotes(supabase: SupabaseClient, projectId: string) {
  const { data, error } = await supabase
    .from("quotes")
    .select("id, status, issue_date, quote_items(quantity, unit_price)")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((q) => ({
    id: q.id,
    status: q.status,
    issue_date: q.issue_date,
    total: currency.format((q.quote_items ?? []).reduce((sum, i) => sum + i.quantity * i.unit_price, 0)),
  }));
}

export async function listUpcomingEvents(supabase: SupabaseClient, days: number) {
  const now = new Date();
  const until = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  const { data, error } = await supabase
    .from("calendar_events")
    .select("id, title, starts_at, notes, projects(name)")
    .gte("starts_at", now.toISOString())
    .lt("starts_at", until.toISOString())
    .order("starts_at");
  if (error) throw new Error(error.message);
  return (data ?? []).map((e) => ({
    id: e.id,
    title: e.title,
    starts_at: e.starts_at,
    project: e.projects?.name ?? null,
  }));
}

// Herramientas de escritura (Fase 7, extensión de acciones). Mismo
// patrón de organización que las Server Actions equivalentes
// (app/(dashboard)/dashboard/clients/actions.ts, .../calendar/actions.ts,
// .../projects/[id]/finance-actions.ts): resuelven organizationId vía
// getCurrentOrganizationId con el cliente de Supabase de la sesión (no
// un cliente admin) y dejan que RLS sea el límite real de organización.
// Cada una valida su entrada con Zod — nunca confían en que el modelo
// mandó datos completos o del tipo correcto.

function confirmationRequired(message: string) {
  return { requiresConfirmation: true as const, message };
}

const clientToolSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  email: z.string().trim().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function createClientTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = clientToolSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada.");

  const coords = parsed.data.address ? await geocodeAddress(parsed.data.address) : null;

  const { data, error } = await supabase
    .from("clients")
    .insert({
      organization_id: organizationId,
      ...parsed.data,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
    })
    .select("id, name")
    .single();
  if (error) throw new Error(error.message);

  return { created: true, client: data };
}

const updateClientSchema = z.object({
  clientId: z.string().trim().min(1, "Falta el cliente."),
  name: z.string().trim().optional(),
  email: z.string().trim().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function updateClientTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = updateClientSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");
  const { clientId, ...fields } = parsed.data;
  if (Object.values(fields).every((v) => !v)) throw new Error("No hay ningún dato nuevo para actualizar.");

  const coords = fields.address ? await geocodeAddress(fields.address) : undefined;

  const { data, error } = await supabase
    .from("clients")
    .update({ ...fields, ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}) })
    .eq("id", clientId)
    .select("id, name")
    .single();
  if (error) throw new Error(error.message);

  return { updated: true, client: data };
}

const eventToolSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio."),
  date: z.string().trim().min(1, "La fecha es obligatoria (YYYY-MM-DD)."),
  time: z.string().trim().optional(),
  projectId: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function scheduleEventTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = eventToolSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada.");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const startsAt = new Date(`${parsed.data.date}T${parsed.data.time || "09:00"}:00`).toISOString();

  const { data, error } = await supabase
    .from("calendar_events")
    .insert({
      organization_id: organizationId,
      project_id: parsed.data.projectId || null,
      title: parsed.data.title,
      starts_at: startsAt,
      notes: parsed.data.notes || null,
      created_by: user?.id,
    })
    .select("id, title, starts_at")
    .single();
  if (error) throw new Error(error.message);

  return { created: true, event: data };
}

const deleteEventSchema = z.object({
  eventId: z.string().trim().min(1, "Falta el evento."),
  confirm: z.boolean().optional(),
});

export async function deleteEventTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = deleteEventSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const { data: event } = await supabase
    .from("calendar_events")
    .select("id, title, starts_at")
    .eq("id", parsed.data.eventId)
    .maybeSingle();
  if (!event) throw new Error("Evento no encontrado.");

  if (parsed.data.confirm !== true) {
    const when = new Date(event.starts_at).toLocaleString("es-EC", { dateStyle: "long", timeStyle: "short" });
    return confirmationRequired(`eliminar el evento "${event.title}" (${when})`);
  }

  const { error } = await supabase.from("calendar_events").delete().eq("id", event.id);
  if (error) throw new Error(error.message);

  return { deleted: true, event: { id: event.id, title: event.title, starts_at: event.starts_at } };
}

const quoteToolSchema = z.object({
  projectId: z.string().trim().min(1, "Falta el proyecto de la cotización."),
  items: z
    .array(
      z.object({
        description: z.string().trim().min(1, "Cada ítem necesita una descripción."),
        quantity: z.number().positive("La cantidad debe ser mayor a 0."),
        unit_price: z.number().nonnegative("El precio unitario no puede ser negativo."),
      }),
    )
    .min(1, "La cotización necesita al menos un ítem con precio real."),
  validUntil: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function createQuoteTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = quoteToolSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada.");

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      organization_id: organizationId,
      project_id: parsed.data.projectId,
      valid_until: parsed.data.validUntil || null,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const { error: itemsError } = await supabase.from("quote_items").insert(
    parsed.data.items.map((item, position) => ({
      quote_id: quote.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      position,
    })),
  );
  if (itemsError) throw new Error(itemsError.message);

  return { created: true, quoteId: quote.id };
}

const updateQuoteStatusSchema = z.object({
  quoteId: z.string().trim().min(1, "Falta la cotización."),
  status: z.enum(QUOTE_STATUSES as [string, ...string[]]),
});

export async function updateQuoteStatusTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = updateQuoteStatusSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const { data: quote, error } = await supabase
    .from("quotes")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.quoteId)
    .select("id, project_id, status")
    .single();
  if (error) throw new Error(error.message);

  // Misma automatización que la UI del dashboard (finance-actions.ts):
  // aceptar una cotización aplica la plantilla de fases del proyecto y,
  // si estaba en planificación, lo pasa a diseño. Antes esto solo
  // pasaba si se aceptaba desde el formulario, nunca desde el chat.
  if (parsed.data.status === "accepted") {
    await applyPhaseTemplate(supabase, quote.project_id);
    const { data: project } = await supabase.from("projects").select("status").eq("id", quote.project_id).maybeSingle();
    if (project?.status === "planning") {
      await supabase.from("projects").update({ status: "design" }).eq("id", quote.project_id);
    }
  }

  return { updated: true, quote };
}

// Leads ---------------------------------------------------------------

const createLeadSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  email: z.string().trim().email("Email inválido"),
  phone: z.string().trim().optional(),
  need: z.string().trim().optional(),
  estimated_value: z.number().nonnegative().optional(),
});

export async function createLeadTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = createLeadSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada.");

  const { data, error } = await supabase
    .from("leads")
    .insert({ organization_id: organizationId, source: "manual", ...parsed.data })
    .select("id, name")
    .single();
  if (error) throw new Error(error.message);

  return { created: true, lead: data };
}

const updateLeadStatusSchema = z.object({
  leadId: z.string().trim().min(1, "Falta el lead."),
  status: z.enum(LEAD_STATUSES as [string, ...string[]]),
});

export async function updateLeadStatusTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = updateLeadStatusSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const { data, error } = await supabase
    .from("leads")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.leadId)
    .select("id, name, status")
    .single();
  if (error) throw new Error(error.message);

  return { updated: true, lead: data };
}

const convertLeadSchema = z.object({ leadId: z.string().trim().min(1, "Falta el lead.") });

export async function convertLeadToClientTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = convertLeadSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada.");

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("name, email, phone")
    .eq("id", parsed.data.leadId)
    .single();
  if (leadError) throw new Error(leadError.message);

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      organization_id: organizationId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      converted_from_lead_id: parsed.data.leadId,
    })
    .select("id, name")
    .single();
  if (clientError) throw new Error(clientError.message);

  await supabase
    .from("leads")
    .update({ status: "ganado", updated_at: new Date().toISOString() })
    .eq("id", parsed.data.leadId);

  return { created: true, client };
}

// Proyectos -------------------------------------------------------------

const createProjectSchema = z.object({
  clientId: z.string().trim().min(1, "Falta el cliente."),
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  description: z.string().trim().optional(),
  category: z.enum(PROJECT_CATEGORIES as [string, ...string[]]).optional(),
  location: z.string().trim().optional(),
  budget: z.number().nonnegative().optional(),
  contracted_value: z.number().nonnegative().optional(),
  start_date: z.string().trim().optional(),
  estimated_end_date: z.string().trim().optional(),
});

export async function createProjectTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = createProjectSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada.");

  const { clientId, location, ...rest } = parsed.data;
  const coords = location ? await geocodeAddress(location) : null;

  const { data, error } = await supabase
    .from("projects")
    .insert({
      organization_id: organizationId,
      client_id: clientId,
      location: location || null,
      ...rest,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
    })
    .select("id, name")
    .single();
  if (error) throw new Error(error.message);

  return { created: true, project: data };
}

const updateProjectStatusSchema = z.object({
  projectId: z.string().trim().min(1, "Falta el proyecto."),
  status: z.enum(PROJECT_STATUSES as [string, ...string[]]),
  confirm: z.boolean().optional(),
});

export async function updateProjectStatusTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = updateProjectStatusSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const { data: project } = await supabase
    .from("projects")
    .select("id, name")
    .eq("id", parsed.data.projectId)
    .maybeSingle();
  if (!project) throw new Error("Proyecto no encontrado.");

  if (parsed.data.status === "cancelled" && parsed.data.confirm !== true) {
    return confirmationRequired(`cancelar el proyecto "${project.name}"`);
  }

  const { error } = await supabase
    .from("projects")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", project.id);
  if (error) throw new Error(error.message);

  return { updated: true, project: { id: project.id, name: project.name, status: parsed.data.status } };
}

// Fases -------------------------------------------------------------------

const createPhaseSchema = z.object({
  projectId: z.string().trim().min(1, "Falta el proyecto."),
  name: z.string().trim().min(1, "El nombre es obligatorio."),
  description: z.string().trim().optional(),
  start_date: z.string().trim().optional(),
  end_date: z.string().trim().optional(),
});

export async function createPhaseTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = createPhaseSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada.");

  const { projectId, ...rest } = parsed.data;
  const { count } = await supabase.from("phases").select("*", { count: "exact", head: true }).eq("project_id", projectId);

  const { data, error } = await supabase
    .from("phases")
    .insert({ organization_id: organizationId, project_id: projectId, position: count ?? 0, ...rest })
    .select("id, name")
    .single();
  if (error) throw new Error(error.message);

  return { created: true, phase: { ...data, projectId } };
}

const applyPhaseTemplateSchema = z.object({
  projectId: z.string().trim().min(1, "Falta el proyecto."),
});

export async function applyPhaseTemplateTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = applyPhaseTemplateSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const result = await applyPhaseTemplate(supabase, parsed.data.projectId);
  if (!result.applied) {
    return { applied: false, message: "El proyecto ya tiene fases — la plantilla no sobrescribe fases existentes." };
  }
  return { applied: true, projectId: parsed.data.projectId, phases: result.phases };
}

const updatePhaseStatusSchema = z.object({
  phaseId: z.string().trim().min(1, "Falta la fase."),
  status: z.enum(PHASE_STATUSES as [string, ...string[]]),
  progress: z.number().min(0).max(100).optional(),
});

export async function updatePhaseStatusTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = updatePhaseStatusSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const progress = parsed.data.status === "completada" ? 100 : parsed.data.progress;

  const { data, error } = await supabase
    .from("phases")
    .update({ status: parsed.data.status, ...(progress != null ? { progress } : {}) })
    .eq("id", parsed.data.phaseId)
    .select("id, name, project_id, status")
    .single();
  if (error) throw new Error(error.message);

  return { updated: true, phase: { ...data, projectId: data.project_id } };
}

const deletePhaseSchema = z.object({
  phaseId: z.string().trim().min(1, "Falta la fase."),
  confirm: z.boolean().optional(),
});

export async function deletePhaseTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = deletePhaseSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const { data: phase } = await supabase
    .from("phases")
    .select("id, name, project_id")
    .eq("id", parsed.data.phaseId)
    .maybeSingle();
  if (!phase) throw new Error("Fase no encontrada.");

  if (parsed.data.confirm !== true) {
    return confirmationRequired(`eliminar la fase "${phase.name}"`);
  }

  const { error } = await supabase.from("phases").delete().eq("id", phase.id);
  if (error) throw new Error(error.message);

  return { deleted: true, phase: { id: phase.id, name: phase.name, projectId: phase.project_id } };
}

// Tareas --------------------------------------------------------------

const createTaskSchema = z.object({
  projectId: z.string().trim().min(1, "Falta el proyecto."),
  title: z.string().trim().min(1, "El título es obligatorio."),
  description: z.string().trim().optional(),
  priority: z.enum(TASK_PRIORITIES as [string, ...string[]]).optional(),
  due_date: z.string().trim().optional(),
  estimated_hours: z.number().nonnegative().optional(),
});

export async function createTaskTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = createTaskSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada.");

  const { projectId, ...rest } = parsed.data;
  const { data, error } = await supabase
    .from("tasks")
    .insert({ organization_id: organizationId, project_id: projectId, ...rest })
    .select("id, title")
    .single();
  if (error) throw new Error(error.message);

  return { created: true, task: { ...data, projectId } };
}

const updateTaskStatusSchema = z.object({
  taskId: z.string().trim().min(1, "Falta la tarea."),
  status: z.enum(TASK_STATUSES as [string, ...string[]]),
});

export async function updateTaskStatusTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = updateTaskStatusSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const { data, error } = await supabase
    .from("tasks")
    .update({ status: parsed.data.status, updated_at: new Date().toISOString() })
    .eq("id", parsed.data.taskId)
    .select("id, title, project_id, status")
    .single();
  if (error) throw new Error(error.message);

  return { updated: true, task: { ...data, projectId: data.project_id } };
}

const deleteTaskSchema = z.object({
  taskId: z.string().trim().min(1, "Falta la tarea."),
  confirm: z.boolean().optional(),
});

export async function deleteTaskTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = deleteTaskSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const { data: task } = await supabase
    .from("tasks")
    .select("id, title, project_id")
    .eq("id", parsed.data.taskId)
    .maybeSingle();
  if (!task) throw new Error("Tarea no encontrada.");

  if (parsed.data.confirm !== true) {
    return confirmationRequired(`eliminar la tarea "${task.title}"`);
  }

  const { error } = await supabase.from("tasks").delete().eq("id", task.id);
  if (error) throw new Error(error.message);

  return { deleted: true, task: { id: task.id, title: task.title, projectId: task.project_id } };
}

// Contratos -----------------------------------------------------------

const createContractSchema = z.object({
  projectId: z.string().trim().min(1, "Falta el proyecto."),
  value: z.number().nonnegative("El valor no puede ser negativo."),
  start_date: z.string().trim().optional(),
  end_date: z.string().trim().optional(),
  payment_terms: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function createContractTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = createContractSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada.");

  const { projectId, ...rest } = parsed.data;
  const { data, error } = await supabase
    .from("contracts")
    .insert({ organization_id: organizationId, project_id: projectId, ...rest })
    .select("id, value")
    .single();
  if (error) throw new Error(error.message);

  return { created: true, contract: { ...data, projectId } };
}

const updateContractStatusSchema = z.object({
  contractId: z.string().trim().min(1, "Falta el contrato."),
  status: z.enum(CONTRACT_STATUSES as [string, ...string[]]),
  confirm: z.boolean().optional(),
});

export async function updateContractStatusTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = updateContractStatusSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, value, project_id")
    .eq("id", parsed.data.contractId)
    .maybeSingle();
  if (!contract) throw new Error("Contrato no encontrado.");

  if (parsed.data.status === "cancelled" && parsed.data.confirm !== true) {
    return confirmationRequired(`cancelar el contrato por ${currency.format(contract.value)}`);
  }

  const { error } = await supabase
    .from("contracts")
    .update({
      status: parsed.data.status,
      signed_at: parsed.data.status === "active" ? new Date().toISOString() : undefined,
    })
    .eq("id", contract.id);
  if (error) throw new Error(error.message);

  return { updated: true, contract: { id: contract.id, projectId: contract.project_id, status: parsed.data.status } };
}

// Pagos -----------------------------------------------------------------

const createPaymentSchema = z.object({
  projectId: z.string().trim().min(1, "Falta el proyecto."),
  amount: z.number().positive("El monto debe ser mayor a 0."),
  due_date: z.string().trim().optional(),
  method: z.string().trim().optional(),
  reference: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function createPaymentTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = createPaymentSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada.");

  const { projectId, ...rest } = parsed.data;
  const { data, error } = await supabase
    .from("payments")
    .insert({ organization_id: organizationId, project_id: projectId, ...rest })
    .select("id, amount")
    .single();
  if (error) throw new Error(error.message);

  return { created: true, payment: { ...data, projectId } };
}

const updatePaymentStatusSchema = z.object({
  paymentId: z.string().trim().min(1, "Falta el pago."),
  status: z.enum(PAYMENT_STATUSES as [string, ...string[]]),
});

export async function updatePaymentStatusTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = updatePaymentStatusSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const { data, error } = await supabase
    .from("payments")
    .update({
      status: parsed.data.status,
      paid_date: parsed.data.status === "pagada" ? new Date().toISOString().slice(0, 10) : null,
    })
    .eq("id", parsed.data.paymentId)
    .select("id, amount, project_id, status")
    .single();
  if (error) throw new Error(error.message);

  return { updated: true, payment: { ...data, projectId: data.project_id } };
}

// Gastos ------------------------------------------------------------------

const createExpenseSchema = z.object({
  projectId: z.string().trim().min(1, "Falta el proyecto."),
  category: z.enum(EXPENSE_CATEGORIES as [string, ...string[]]),
  amount: z.number().positive("El monto debe ser mayor a 0."),
  date: z.string().trim().min(1, "La fecha es obligatoria."),
  description: z.string().trim().optional(),
  supplier: z.string().trim().optional(),
});

export async function createExpenseTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = createExpenseSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada.");

  const { projectId, ...rest } = parsed.data;
  const { data, error } = await supabase
    .from("expenses")
    .insert({ organization_id: organizationId, project_id: projectId, ...rest })
    .select("id, amount, category")
    .single();
  if (error) throw new Error(error.message);

  return { created: true, expense: { ...data, projectId } };
}

const deleteExpenseSchema = z.object({
  expenseId: z.string().trim().min(1, "Falta el gasto."),
  confirm: z.boolean().optional(),
});

export async function deleteExpenseTool(supabase: SupabaseClient, args: Record<string, unknown>) {
  const parsed = deleteExpenseSchema.safeParse(args);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos.");

  const { data: expense } = await supabase
    .from("expenses")
    .select("id, amount, category, project_id")
    .eq("id", parsed.data.expenseId)
    .maybeSingle();
  if (!expense) throw new Error("Gasto no encontrado.");

  if (parsed.data.confirm !== true) {
    return confirmationRequired(`eliminar el gasto de ${currency.format(expense.amount)} (${expense.category})`);
  }

  const { error } = await supabase.from("expenses").delete().eq("id", expense.id);
  if (error) throw new Error(error.message);

  return { deleted: true, expense: { id: expense.id, projectId: expense.project_id } };
}

// JSON-schema tool definitions (function-calling). Kept next to the
// implementations so the two never drift apart. Written once in this
// neutral, lowercase-JSON-Schema shape and converted below to whatever
// casing/nesting a given provider's API expects — right now that's
// Gemini (see GEMINI_TOOLS), previously OpenAI's Chat Completions
// `tools` array used the exact same shape unconverted.
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
      description: "Lista los pagos pendientes o vencidos de todos los proyectos, con su id.",
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
  {
    type: "function" as const,
    function: {
      name: "listProjects",
      description:
        "Lista los proyectos de la organización (id, nombre, estado, cliente). Úsala para encontrar el projectId real antes de agendar, cotizar, o crear/actualizar fases, tareas, contratos, pagos o gastos.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "listClients",
      description:
        "Lista los clientes de la organización (id, nombre, empresa). Úsala para verificar si un cliente ya existe antes de crear uno nuevo, o para resolver el clientId al crear un proyecto.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "listPhases",
      description: "Lista las fases de un proyecto (id, nombre, estado, progreso). Úsala para resolver el phaseId real.",
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
      name: "listTasks",
      description: "Lista las tareas de un proyecto (id, título, estado, prioridad, fecha límite). Úsala para resolver el taskId real.",
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
      name: "listContracts",
      description: "Lista los contratos de un proyecto (id, valor, estado). Úsala para resolver el contractId real.",
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
      name: "listExpenses",
      description: "Lista los gastos de un proyecto (id, categoría, monto, fecha). Úsala para resolver el expenseId real.",
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
      name: "listQuotes",
      description: "Lista las cotizaciones de un proyecto (id, estado, total). Úsala para resolver el quoteId real.",
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
      name: "listUpcomingEvents",
      description: "Lista los próximos eventos del calendario (id, título, fecha/hora, proyecto). Úsala para resolver el eventId real antes de borrar un evento.",
      parameters: {
        type: "object",
        properties: { days: { type: "number", description: "Días hacia adelante a listar (opcional, default 14)" } },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "createClient",
      description:
        "Crea un cliente nuevo. Solo el nombre es obligatorio — nunca inventes email, teléfono, empresa o dirección: pídelos si el usuario no los dio.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nombre del cliente" },
          email: { type: "string", description: "Email (opcional)" },
          phone: { type: "string", description: "Teléfono (opcional)" },
          company: { type: "string", description: "Empresa (opcional)" },
          address: { type: "string", description: "Dirección (opcional)" },
          notes: { type: "string", description: "Notas (opcional)" },
        },
        required: ["name"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "updateClientRecord",
      description: "Actualiza datos de un cliente existente (nombre, email, teléfono, empresa, dirección o notas). Usa listClients para resolver el clientId.",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string", description: "UUID del cliente (usa listClients)" },
          name: { type: "string", description: "Nombre nuevo (opcional)" },
          email: { type: "string", description: "Email nuevo (opcional)" },
          phone: { type: "string", description: "Teléfono nuevo (opcional)" },
          company: { type: "string", description: "Empresa nueva (opcional)" },
          address: { type: "string", description: "Dirección nueva (opcional)" },
          notes: { type: "string", description: "Notas nuevas (opcional)" },
        },
        required: ["clientId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "scheduleEvent",
      description:
        "Agenda un evento en el calendario. Puede ser suelto (sin proyecto) o ligado a un proyecto existente — usa listProjects para resolver el projectId si el usuario menciona un proyecto por nombre.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título del evento" },
          date: { type: "string", description: "Fecha en formato YYYY-MM-DD" },
          time: { type: "string", description: "Hora en formato HH:MM, 24h (opcional, default 09:00)" },
          projectId: { type: "string", description: "UUID del proyecto al que pertenece (opcional)" },
          notes: { type: "string", description: "Notas (opcional)" },
        },
        required: ["title", "date"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "deleteEvent",
      description:
        "Elimina un evento del calendario. IRREVERSIBLE: la primera vez llámala sin confirm (o no la llames, preguntá primero) — recién con confirm=true, después de que el usuario confirme, se borra de verdad.",
      parameters: {
        type: "object",
        properties: {
          eventId: { type: "string", description: "UUID del evento (usa listUpcomingEvents)" },
          confirm: { type: "boolean", description: "true solo después de que el usuario confirmó explícitamente" },
        },
        required: ["eventId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "createQuote",
      description:
        "Crea una cotización para un proyecto existente, con sus ítems (descripción, cantidad, precio unitario). Requiere un projectId real (usa listProjects). Nunca inventes precios ni ítems: si el usuario no te dio montos concretos, pregúntalos antes de llamar esta herramienta.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "UUID del proyecto (usa listProjects para encontrarlo)" },
          items: {
            type: "array",
            description: "Ítems de la cotización, con valores reales dados por el usuario",
            items: {
              type: "object",
              properties: {
                description: { type: "string", description: "Descripción del ítem" },
                quantity: { type: "number", description: "Cantidad" },
                unit_price: { type: "number", description: "Precio unitario" },
              },
              required: ["description", "quantity", "unit_price"],
            },
          },
          validUntil: { type: "string", description: "Fecha de validez, formato YYYY-MM-DD (opcional)" },
          notes: { type: "string", description: "Notas (opcional)" },
        },
        required: ["projectId", "items"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "updateQuoteStatus",
      description: "Cambia el estado de una cotización (draft, sent, negotiation, accepted, rejected, expired). Usa listQuotes para resolver el quoteId.",
      parameters: {
        type: "object",
        properties: {
          quoteId: { type: "string", description: "UUID de la cotización (usa listQuotes)" },
          status: { type: "string", description: "draft | sent | negotiation | accepted | rejected | expired" },
        },
        required: ["quoteId", "status"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "createLead",
      description: "Crea un lead nuevo. Nombre y email son obligatorios — nunca inventes teléfono, necesidad o valor estimado: pídelos si el usuario no los dio.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Nombre del lead" },
          email: { type: "string", description: "Email" },
          phone: { type: "string", description: "Teléfono (opcional)" },
          need: { type: "string", description: "Necesidad/proyecto que busca (opcional)" },
          estimated_value: { type: "number", description: "Valor estimado en USD (opcional)" },
        },
        required: ["name", "email"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "updateLeadStatus",
      description: "Cambia el estado de un lead (nuevo, contactado, propuesta, negociacion, ganado, perdido). Usa getLeadsToContact o pregunta el nombre para resolver el leadId.",
      parameters: {
        type: "object",
        properties: {
          leadId: { type: "string", description: "UUID del lead" },
          status: { type: "string", description: "nuevo | contactado | propuesta | negociacion | ganado | perdido" },
        },
        required: ["leadId", "status"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "convertLeadToClient",
      description: "Convierte un lead ganado en cliente real (crea el cliente y marca el lead como ganado).",
      parameters: {
        type: "object",
        properties: { leadId: { type: "string", description: "UUID del lead" } },
        required: ["leadId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "createProject",
      description: "Crea un proyecto nuevo para un cliente existente. Requiere clientId (usa listClients) y nombre. Nunca inventes presupuesto, fechas ni ubicación.",
      parameters: {
        type: "object",
        properties: {
          clientId: { type: "string", description: "UUID del cliente (usa listClients)" },
          name: { type: "string", description: "Nombre del proyecto" },
          description: { type: "string", description: "Descripción (opcional)" },
          category: { type: "string", description: "Residencial | Comercial | Institucional | Hospitalidad | Remodelación (opcional)" },
          location: { type: "string", description: "Dirección/ubicación (opcional)" },
          budget: { type: "number", description: "Presupuesto estimado (opcional)" },
          contracted_value: { type: "number", description: "Valor contratado (opcional)" },
          start_date: { type: "string", description: "Fecha de inicio YYYY-MM-DD (opcional)" },
          estimated_end_date: { type: "string", description: "Fecha estimada de entrega YYYY-MM-DD (opcional)" },
        },
        required: ["clientId", "name"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "updateProjectStatus",
      description:
        "Cambia el estado de un proyecto. IRREVERSIBLE si el nuevo estado es 'cancelled': la primera vez llámala sin confirm — recién con confirm=true, después de que el usuario confirme, se aplica. Para cualquier otro estado, ejecuta directo.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "UUID del proyecto" },
          status: { type: "string", description: "planning | design | documentation | permits | construction | supervision | delivery | completed | on_hold | cancelled" },
          confirm: { type: "boolean", description: "true solo si status es 'cancelled' y el usuario ya confirmó" },
        },
        required: ["projectId", "status"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "createPhase",
      description: "Crea una fase nueva dentro de un proyecto existente.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "UUID del proyecto" },
          name: { type: "string", description: "Nombre de la fase" },
          description: { type: "string", description: "Descripción (opcional)" },
          start_date: { type: "string", description: "Fecha de inicio YYYY-MM-DD (opcional)" },
          end_date: { type: "string", description: "Fecha de fin YYYY-MM-DD (opcional)" },
        },
        required: ["projectId", "name"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "applyPhaseTemplate",
      description:
        "Crea automáticamente las fases estándar de un proyecto según su categoría (Residencial, Comercial, Institucional, Hospitalidad, Remodelación). No hace nada si el proyecto ya tiene fases — nunca sobrescribe.",
      parameters: {
        type: "object",
        properties: { projectId: { type: "string", description: "UUID del proyecto (usa listProjects)" } },
        required: ["projectId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "updatePhaseStatus",
      description: "Cambia el estado de una fase (pendiente, en_progreso, completada). Usa listPhases para resolver el phaseId.",
      parameters: {
        type: "object",
        properties: {
          phaseId: { type: "string", description: "UUID de la fase (usa listPhases)" },
          status: { type: "string", description: "pendiente | en_progreso | completada" },
          progress: { type: "number", description: "Progreso 0-100 (opcional, se ignora si status es completada)" },
        },
        required: ["phaseId", "status"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "deletePhase",
      description:
        "Elimina una fase de un proyecto. IRREVERSIBLE: la primera vez llámala sin confirm (o preguntá primero) — recién con confirm=true, después de que el usuario confirme, se borra de verdad.",
      parameters: {
        type: "object",
        properties: {
          phaseId: { type: "string", description: "UUID de la fase (usa listPhases)" },
          confirm: { type: "boolean", description: "true solo después de que el usuario confirmó explícitamente" },
        },
        required: ["phaseId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "createTask",
      description: "Crea una tarea nueva dentro de un proyecto existente.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "UUID del proyecto" },
          title: { type: "string", description: "Título de la tarea" },
          description: { type: "string", description: "Descripción (opcional)" },
          priority: { type: "string", description: "low | medium | high | critical (opcional)" },
          due_date: { type: "string", description: "Fecha límite YYYY-MM-DD (opcional)" },
          estimated_hours: { type: "number", description: "Horas estimadas (opcional)" },
        },
        required: ["projectId", "title"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "updateTaskStatus",
      description: "Cambia el estado de una tarea (backlog, todo, in_progress, review, completed). Usa listTasks para resolver el taskId.",
      parameters: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "UUID de la tarea (usa listTasks)" },
          status: { type: "string", description: "backlog | todo | in_progress | review | completed" },
        },
        required: ["taskId", "status"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "deleteTask",
      description:
        "Elimina una tarea. IRREVERSIBLE: la primera vez llámala sin confirm (o preguntá primero) — recién con confirm=true, después de que el usuario confirme, se borra de verdad.",
      parameters: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "UUID de la tarea (usa listTasks)" },
          confirm: { type: "boolean", description: "true solo después de que el usuario confirmó explícitamente" },
        },
        required: ["taskId"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "createContract",
      description: "Crea un contrato para un proyecto existente. Nunca inventes el valor: pídelo si el usuario no lo dio.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "UUID del proyecto" },
          value: { type: "number", description: "Valor del contrato en USD" },
          start_date: { type: "string", description: "Fecha de inicio YYYY-MM-DD (opcional)" },
          end_date: { type: "string", description: "Fecha de fin YYYY-MM-DD (opcional)" },
          payment_terms: { type: "string", description: "Términos de pago (opcional)" },
          notes: { type: "string", description: "Notas (opcional)" },
        },
        required: ["projectId", "value"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "updateContractStatus",
      description:
        "Cambia el estado de un contrato (draft, active, completed, cancelled). IRREVERSIBLE si el nuevo estado es 'cancelled': la primera vez llámala sin confirm — recién con confirm=true, después de que el usuario confirme, se aplica. Usa listContracts para resolver el contractId.",
      parameters: {
        type: "object",
        properties: {
          contractId: { type: "string", description: "UUID del contrato (usa listContracts)" },
          status: { type: "string", description: "draft | active | completed | cancelled" },
          confirm: { type: "boolean", description: "true solo si status es 'cancelled' y el usuario ya confirmó" },
        },
        required: ["contractId", "status"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "createPayment",
      description: "Registra un pago (cuota) esperado para un proyecto. Nunca inventes el monto: pídelo si el usuario no lo dio.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "UUID del proyecto" },
          amount: { type: "number", description: "Monto en USD" },
          due_date: { type: "string", description: "Fecha de vencimiento YYYY-MM-DD (opcional)" },
          method: { type: "string", description: "Método de pago (opcional)" },
          reference: { type: "string", description: "Referencia/número (opcional)" },
          notes: { type: "string", description: "Notas (opcional)" },
        },
        required: ["projectId", "amount"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "updatePaymentStatus",
      description: "Marca un pago como pendiente, pagada o vencida. Usa getPendingPayments para resolver el paymentId.",
      parameters: {
        type: "object",
        properties: {
          paymentId: { type: "string", description: "UUID del pago (usa getPendingPayments)" },
          status: { type: "string", description: "pendiente | pagada | vencida" },
        },
        required: ["paymentId", "status"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "createExpense",
      description: "Registra un gasto de un proyecto. Nunca inventes el monto, la categoría ni la fecha: pídelos si el usuario no los dio.",
      parameters: {
        type: "object",
        properties: {
          projectId: { type: "string", description: "UUID del proyecto" },
          category: { type: "string", description: "materiales | mano_obra | permisos | subcontrato | otro" },
          amount: { type: "number", description: "Monto en USD" },
          date: { type: "string", description: "Fecha YYYY-MM-DD" },
          description: { type: "string", description: "Descripción (opcional)" },
          supplier: { type: "string", description: "Proveedor (opcional)" },
        },
        required: ["projectId", "category", "amount", "date"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "deleteExpense",
      description:
        "Elimina un gasto registrado. IRREVERSIBLE: la primera vez llámala sin confirm (o preguntá primero) — recién con confirm=true, después de que el usuario confirme, se borra de verdad.",
      parameters: {
        type: "object",
        properties: {
          expenseId: { type: "string", description: "UUID del gasto (usa listExpenses)" },
          confirm: { type: "boolean", description: "true solo después de que el usuario confirmó explícitamente" },
        },
        required: ["expenseId"],
      },
    },
  },
];

// Gemini's function-calling `parameters` schema uses uppercase type
// names (OBJECT/STRING/…) instead of JSON Schema's lowercase — this
// converts AI_TOOLS once rather than maintaining a second, parallel
// list of tool definitions that could drift out of sync.
type ParamSchema = {
  type: string;
  description?: string;
  properties?: Record<string, ParamSchema>;
  required?: string[];
  items?: ParamSchema;
};

function toGeminiSchema(schema: ParamSchema): Record<string, unknown> {
  if (schema.type === "object") {
    const properties: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(schema.properties ?? {})) {
      properties[key] = toGeminiSchema(value);
    }
    return {
      type: "OBJECT",
      properties,
      ...(schema.required?.length ? { required: schema.required } : {}),
    };
  }
  if (schema.type === "array") {
    return {
      type: "ARRAY",
      items: toGeminiSchema(schema.items as ParamSchema),
      ...(schema.description ? { description: schema.description } : {}),
    };
  }
  return {
    type: schema.type.toUpperCase(),
    ...(schema.description ? { description: schema.description } : {}),
  };
}

export const GEMINI_TOOLS = [
  {
    functionDeclarations: AI_TOOLS.map((tool) => ({
      name: tool.function.name,
      description: tool.function.description,
      parameters: toGeminiSchema(tool.function.parameters as unknown as ParamSchema),
    })),
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
    case "listProjects":
      return listProjects(supabase);
    case "listClients":
      return listClients(supabase);
    case "listPhases":
      return listPhases(supabase, String(args.projectId));
    case "listTasks":
      return listTasks(supabase, String(args.projectId));
    case "listContracts":
      return listContracts(supabase, String(args.projectId));
    case "listExpenses":
      return listExpenses(supabase, String(args.projectId));
    case "listQuotes":
      return listQuotes(supabase, String(args.projectId));
    case "listUpcomingEvents":
      return listUpcomingEvents(supabase, typeof args.days === "number" ? args.days : 14);
    case "createClient":
      return createClientTool(supabase, args);
    case "updateClientRecord":
      return updateClientTool(supabase, args);
    case "scheduleEvent":
      return scheduleEventTool(supabase, args);
    case "deleteEvent":
      return deleteEventTool(supabase, args);
    case "createQuote":
      return createQuoteTool(supabase, args);
    case "updateQuoteStatus":
      return updateQuoteStatusTool(supabase, args);
    case "createLead":
      return createLeadTool(supabase, args);
    case "updateLeadStatus":
      return updateLeadStatusTool(supabase, args);
    case "convertLeadToClient":
      return convertLeadToClientTool(supabase, args);
    case "createProject":
      return createProjectTool(supabase, args);
    case "updateProjectStatus":
      return updateProjectStatusTool(supabase, args);
    case "createPhase":
      return createPhaseTool(supabase, args);
    case "applyPhaseTemplate":
      return applyPhaseTemplateTool(supabase, args);
    case "updatePhaseStatus":
      return updatePhaseStatusTool(supabase, args);
    case "deletePhase":
      return deletePhaseTool(supabase, args);
    case "createTask":
      return createTaskTool(supabase, args);
    case "updateTaskStatus":
      return updateTaskStatusTool(supabase, args);
    case "deleteTask":
      return deleteTaskTool(supabase, args);
    case "createContract":
      return createContractTool(supabase, args);
    case "updateContractStatus":
      return updateContractStatusTool(supabase, args);
    case "createPayment":
      return createPaymentTool(supabase, args);
    case "updatePaymentStatus":
      return updatePaymentStatusTool(supabase, args);
    case "createExpense":
      return createExpenseTool(supabase, args);
    case "deleteExpense":
      return deleteExpenseTool(supabase, args);
    default:
      throw new Error(`Herramienta desconocida: ${name}`);
  }
}

// Traduce el resultado de una tool de escritura exitosa a algo que la
// UI del chat pueda mostrar como confirmación clickeable (Fix 2 —
// "mostrar qué hizo Archi AI de verdad", no solo confiar en el texto
// que redactó el modelo). Devuelve null para tools de lectura, para
// respuestas de confirmación pendiente (requiresConfirmation) y para
// cualquier resultado que no reconozca.
export function describeToolResult(name: string, result: unknown): { label: string; href: string } | null {
  if (!result || typeof result !== "object") return null;
  const r = result as Record<string, unknown>;
  if (r.requiresConfirmation) return null;

  function calendarHref(startsAt: string) {
    const d = new Date(startsAt);
    return `/dashboard/calendar?year=${d.getFullYear()}&month=${d.getMonth() + 1}`;
  }

  switch (name) {
    case "createClient": {
      const c = r.client as { id: string; name: string };
      return { label: `Cliente creado: ${c.name}`, href: `/dashboard/clients/${c.id}` };
    }
    case "updateClientRecord": {
      const c = r.client as { id: string; name: string };
      return { label: `Cliente actualizado: ${c.name}`, href: `/dashboard/clients/${c.id}` };
    }
    case "scheduleEvent": {
      const e = r.event as { id: string; title: string; starts_at: string };
      const when = new Date(e.starts_at).toLocaleString("es-EC", { dateStyle: "medium", timeStyle: "short" });
      return { label: `Evento creado: ${e.title} — ${when}`, href: calendarHref(e.starts_at) };
    }
    case "deleteEvent": {
      const e = r.event as { title: string; starts_at: string };
      return { label: `Evento eliminado: ${e.title}`, href: calendarHref(e.starts_at) };
    }
    case "createQuote": {
      const quoteId = r.quoteId as string;
      return { label: "Cotización creada", href: `/dashboard/quotes/${quoteId}` };
    }
    case "updateQuoteStatus": {
      const q = r.quote as { id: string; status: string };
      return { label: `Cotización actualizada: ${q.status}`, href: `/dashboard/quotes/${q.id}` };
    }
    case "createLead": {
      const l = r.lead as { id: string; name: string };
      return { label: `Lead creado: ${l.name}`, href: `/dashboard/leads/${l.id}` };
    }
    case "updateLeadStatus": {
      const l = r.lead as { id: string; name: string; status: string };
      return { label: `Lead actualizado: ${l.name} → ${l.status}`, href: `/dashboard/leads/${l.id}` };
    }
    case "convertLeadToClient": {
      const c = r.client as { id: string; name: string };
      return { label: `Lead convertido a cliente: ${c.name}`, href: `/dashboard/clients/${c.id}` };
    }
    case "createProject": {
      const p = r.project as { id: string; name: string };
      return { label: `Proyecto creado: ${p.name}`, href: `/dashboard/projects/${p.id}` };
    }
    case "updateProjectStatus": {
      const p = r.project as { id: string; name: string; status: string };
      return { label: `Proyecto actualizado: ${p.name} → ${p.status}`, href: `/dashboard/projects/${p.id}` };
    }
    case "createPhase": {
      const p = r.phase as { id: string; name: string; projectId: string };
      return { label: `Fase creada: ${p.name}`, href: `/dashboard/projects/${p.projectId}` };
    }
    case "applyPhaseTemplate": {
      if (!r.applied) return null;
      const phases = r.phases as string[];
      return { label: `Plantilla aplicada: ${phases.length} fases creadas`, href: `/dashboard/projects/${r.projectId}` };
    }
    case "updatePhaseStatus": {
      const p = r.phase as { name: string; projectId: string; status: string };
      return { label: `Fase actualizada: ${p.name} → ${p.status}`, href: `/dashboard/projects/${p.projectId}` };
    }
    case "deletePhase": {
      const p = r.phase as { name: string; projectId: string };
      return { label: `Fase eliminada: ${p.name}`, href: `/dashboard/projects/${p.projectId}` };
    }
    case "createTask": {
      const t = r.task as { title: string; projectId: string };
      return { label: `Tarea creada: ${t.title}`, href: `/dashboard/projects/${t.projectId}?tab=tasks` };
    }
    case "updateTaskStatus": {
      const t = r.task as { title: string; projectId: string; status: string };
      return { label: `Tarea actualizada: ${t.title} → ${t.status}`, href: `/dashboard/projects/${t.projectId}?tab=tasks` };
    }
    case "deleteTask": {
      const t = r.task as { title: string; projectId: string };
      return { label: `Tarea eliminada: ${t.title}`, href: `/dashboard/projects/${t.projectId}?tab=tasks` };
    }
    case "createContract": {
      const c = r.contract as { projectId: string };
      return { label: "Contrato creado", href: `/dashboard/projects/${c.projectId}?tab=finance` };
    }
    case "updateContractStatus": {
      const c = r.contract as { projectId: string; status: string };
      return { label: `Contrato actualizado: ${c.status}`, href: `/dashboard/projects/${c.projectId}?tab=finance` };
    }
    case "createPayment": {
      const p = r.payment as { projectId: string };
      return { label: "Pago registrado", href: `/dashboard/projects/${p.projectId}?tab=finance` };
    }
    case "updatePaymentStatus": {
      const p = r.payment as { projectId: string; status: string };
      return { label: `Pago actualizado: ${p.status}`, href: `/dashboard/projects/${p.projectId}?tab=finance` };
    }
    case "createExpense": {
      const e = r.expense as { projectId: string };
      return { label: "Gasto registrado", href: `/dashboard/projects/${e.projectId}?tab=finance` };
    }
    case "deleteExpense": {
      const e = r.expense as { projectId: string };
      return { label: "Gasto eliminado", href: `/dashboard/projects/${e.projectId}?tab=finance` };
    }
    default:
      return null;
  }
}
