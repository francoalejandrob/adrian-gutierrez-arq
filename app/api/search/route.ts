import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Búsqueda real de contenido para el ⌘K (components/dashboard/command-palette.tsx)
// — antes solo navegaba a rutas fijas (NAV_GROUPS/CMD_CREATE/CMD_ASK), no
// buscaba dentro de leads/clientes/proyectos/documentos. Mismo patrón de
// auth que app/api/ai/chat/route.ts: cliente de sesión (RLS es el límite
// real, nunca un cliente admin), 401 si no hay usuario.

type SearchItem = { id: string; label: string; sublabel: string | null; href: string };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) {
    return NextResponse.json({ leads: [], clients: [], projects: [], documents: [] });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const like = `%${q}%`;

  const [{ data: leadsRaw }, { data: clientsRaw }, { data: projectsRaw }, { data: documentsRaw }] = await Promise.all([
    supabase.from("leads").select("id, name, email").or(`name.ilike.${like},email.ilike.${like}`).limit(5),
    supabase.from("clients").select("id, name, company").or(`name.ilike.${like},company.ilike.${like}`).limit(5),
    supabase.from("projects").select("id, name, clients(name)").ilike("name", like).limit(5),
    supabase.from("documents").select("id, name, project_id, projects(name)").ilike("name", like).limit(5),
  ]);

  const leads: SearchItem[] = (leadsRaw ?? []).map((l) => ({
    id: l.id,
    label: l.name,
    sublabel: l.email,
    href: `/dashboard/leads/${l.id}`,
  }));

  const clients: SearchItem[] = (clientsRaw ?? []).map((c) => ({
    id: c.id,
    label: c.name,
    sublabel: c.company,
    href: `/dashboard/clients/${c.id}`,
  }));

  const projects: SearchItem[] = (projectsRaw ?? []).map((p) => ({
    id: p.id,
    label: p.name,
    sublabel: p.clients?.name ?? null,
    href: `/dashboard/projects/${p.id}`,
  }));

  const documents: SearchItem[] = (documentsRaw ?? []).map((d) => ({
    id: d.id,
    label: d.name,
    sublabel: d.projects?.name ?? null,
    href: `/dashboard/projects/${d.project_id}?tab=docs`,
  }));

  return NextResponse.json({ leads, clients, projects, documents });
}
