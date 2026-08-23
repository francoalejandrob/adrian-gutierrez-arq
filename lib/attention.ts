import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";

// Única fuente de verdad para "qué necesita atención hoy" — antes esto
// se calculaba por separado y de forma inconsistente en al menos 5
// lugares (dashboard home, la página de Archi AI, lib/ai/tools.ts, la
// pestaña Aprobaciones de cada proyecto, la página de Finanzas), con
// dos definiciones DISTINTAS de "aprobaciones pendientes" que no
// coincidían entre sí. Cada item trae su propio `href` real para poder
// actuar directo, no solo un número.
//
// Mismo criterio que el resto de lib/ai/tools.ts: recibe el cliente de
// Supabase de la sesión (nunca admin) — lo que ve esta función es
// exactamente lo que RLS deja ver al usuario que la llamó.

type SupabaseAny = SupabaseClient<Database>;

export type AttentionSignals = {
  overdueTasks: {
    id: string;
    title: string;
    status: string;
    due_date: string | null;
    project_id: string | null;
    projectName: string | null;
    href: string;
  }[];
  pendingPayments: {
    id: string;
    amount: number;
    due_date: string | null;
    status: string;
    project_id: string | null;
    projectName: string | null;
    clientName: string | null;
    href: string;
  }[];
  leadsToContact: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: string;
    source: string;
    created_at: string;
    href: string;
  }[];
  pendingApprovals: {
    documentId: string;
    versionId: string;
    documentName: string;
    status: string;
    project_id: string | null;
    projectName: string | null;
    href: string;
  }[];
  todayMeetings: {
    id: string;
    title: string;
    starts_at: string;
    project_id: string | null;
    projectName: string | null;
    href: string;
  }[];
};

export async function getAttentionSignals(supabase: SupabaseAny): Promise<AttentionSignals> {
  const today = new Date().toISOString().slice(0, 10);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const [{ data: tasksRaw }, { data: paymentsRaw }, { data: leadsRaw }, { data: documentsRaw }, { data: eventsRaw }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select("id, title, status, due_date, project_id, projects(name)")
        .lt("due_date", today)
        .neq("status", "completed")
        .order("due_date"),
      supabase
        .from("payments")
        .select("id, amount, due_date, status, project_id, projects(name, clients(name))")
        .in("status", ["pendiente", "vencida"])
        .order("due_date"),
      supabase
        .from("leads")
        .select("id, name, email, phone, status, source, created_at")
        .in("status", ["nuevo", "contactado"])
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("documents").select("id, name, project_id, projects(name), document_versions(id, version, status)"),
      supabase
        .from("calendar_events")
        .select("id, title, starts_at, project_id, projects(name)")
        .gte("starts_at", todayStart.toISOString())
        .lte("starts_at", todayEnd.toISOString())
        .order("starts_at"),
    ]);

  const overdueTasks = (tasksRaw ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    status: t.status,
    due_date: t.due_date,
    project_id: t.project_id,
    projectName: t.projects?.name ?? null,
    href: `/dashboard/projects/${t.project_id}?tab=tasks`,
  }));

  const pendingPayments = (paymentsRaw ?? []).map((p) => ({
    id: p.id,
    amount: p.amount,
    due_date: p.due_date,
    status: p.status,
    project_id: p.project_id,
    projectName: p.projects?.name ?? null,
    clientName: p.projects?.clients?.name ?? null,
    href: `/dashboard/projects/${p.project_id}?tab=finance`,
  }));

  const leadsToContact = (leadsRaw ?? []).map((l) => ({
    id: l.id,
    name: l.name,
    email: l.email,
    phone: l.phone,
    status: l.status,
    source: l.source,
    created_at: l.created_at,
    href: `/dashboard/leads/${l.id}`,
  }));

  // Misma lógica que ya usaba la pestaña Aprobaciones de un proyecto
  // (última versión por documento, cualquier estado distinto de
  // "aprobado") — antes el home/Archi AI solo contaban filas crudas
  // con status='enviado', sin deduplicar y sin ver 'borrador' ni
  // 'cambios_solicitados'.
  const pendingApprovals = (documentsRaw ?? [])
    .map((doc) => {
      const latest = [...doc.document_versions].sort((a, b) => b.version - a.version)[0];
      if (!latest || latest.status === "aprobado") return null;
      return {
        documentId: doc.id,
        versionId: latest.id,
        documentName: doc.name,
        status: latest.status,
        project_id: doc.project_id,
        projectName: doc.projects?.name ?? null,
        href: `/dashboard/projects/${doc.project_id}?tab=approvals`,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const todayMeetings = (eventsRaw ?? []).map((e) => {
    const d = new Date(e.starts_at);
    return {
      id: e.id,
      title: e.title,
      starts_at: e.starts_at,
      project_id: e.project_id,
      projectName: e.projects?.name ?? null,
      href: `/dashboard/calendar?year=${d.getFullYear()}&month=${d.getMonth() + 1}`,
    };
  });

  return { overdueTasks, pendingPayments, leadsToContact, pendingApprovals, todayMeetings };
}
