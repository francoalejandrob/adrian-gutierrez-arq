import { z } from "zod";
import { geocodeAddress } from "@/lib/integrations/google-geocoding";
import type { createClient } from "@/lib/supabase/server";
import { getCurrentOrganizationId } from "@/lib/supabase/org";

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

// Herramientas de lectura auxiliares: la IA no puede adivinar UUIDs,
// así que necesita poder resolver "el proyecto de la casa Rodríguez" o
// "el cliente Pérez" a un id real antes de agendar/cotizar/crear algo
// ligado a un proyecto o cliente existente.
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

// Herramientas de escritura (Fase 7, extensión de acciones). Mismo
// patrón de organización que las Server Actions equivalentes
// (app/(dashboard)/dashboard/clients/actions.ts, .../calendar/actions.ts,
// .../projects/[id]/finance-actions.ts): resuelven organizationId vía
// getCurrentOrganizationId con el cliente de Supabase de la sesión (no
// un cliente admin) y dejan que RLS sea el límite real de organización.
// Cada una valida su entrada con Zod — nunca confían en que el modelo
// mandó datos completos o del tipo correcto.

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
  {
    type: "function" as const,
    function: {
      name: "listProjects",
      description:
        "Lista los proyectos de la organización (id, nombre, estado, cliente). Úsala para encontrar el projectId real antes de agendar un evento ligado a un proyecto o crear una cotización.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "listClients",
      description:
        "Lista los clientes de la organización (id, nombre, empresa). Úsala para verificar si un cliente ya existe antes de crear uno nuevo.",
      parameters: { type: "object", properties: {}, required: [] },
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
    case "createClient":
      return createClientTool(supabase, args);
    case "scheduleEvent":
      return scheduleEventTool(supabase, args);
    case "createQuote":
      return createQuoteTool(supabase, args);
    default:
      throw new Error(`Herramienta desconocida: ${name}`);
  }
}
