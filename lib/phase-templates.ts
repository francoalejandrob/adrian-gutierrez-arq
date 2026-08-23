import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/database.types";
import type { ProjectCategory } from "./supabase/types";

// Fases por defecto según la categoría del proyecto — antes era una
// única lista fija (DEFAULT_PHASE_TEMPLATE) sin importar si el
// proyecto era residencial, comercial, institucional, etc. Editable a
// futuro sin tocar los call sites: cualquiera que llame a
// applyPhaseTemplate se beneficia automáticamente.
export const PHASE_TEMPLATES: Record<ProjectCategory | "default", string[]> = {
  Residencial: ["Conceptualización", "Diseño", "Documentación", "Permisos", "Construcción", "Entrega"],
  Comercial: ["Estudio de factibilidad", "Diseño", "Documentación técnica", "Permisos", "Construcción", "Entrega"],
  Institucional: [
    "Programa arquitectónico",
    "Anteproyecto",
    "Diseño definitivo",
    "Permisos y regulaciones",
    "Construcción",
    "Entrega",
  ],
  Hospitalidad: ["Concepto y programa", "Diseño", "Documentación", "Permisos", "Construcción", "Entrega y puesta en marcha"],
  Remodelación: ["Levantamiento y diagnóstico", "Diseño de intervención", "Documentación", "Permisos", "Obra", "Entrega"],
  default: ["Conceptualización", "Diseño", "Documentación", "Construcción", "Entrega"],
};

type SupabaseAny = SupabaseClient<Database>;

// Misma guarda que tenía runAcceptedQuoteAutomation: si el proyecto ya
// tiene fases, no hace nada — nunca sobrescribe fases existentes.
// Único punto de verdad para aplicar una plantilla, usado tanto por la
// automatización de "cotización aceptada" (UI y tool de IA) como por
// el botón manual en la pestaña Overview de un proyecto.
export async function applyPhaseTemplate(supabase: SupabaseAny, projectId: string) {
  const { count } = await supabase.from("phases").select("*", { count: "exact", head: true }).eq("project_id", projectId);
  if ((count ?? 0) > 0) return { applied: false as const };

  const { data: project } = await supabase
    .from("projects")
    .select("organization_id, category")
    .eq("id", projectId)
    .single();
  if (!project) return { applied: false as const };

  const template = PHASE_TEMPLATES[(project.category as ProjectCategory) ?? "default"] ?? PHASE_TEMPLATES.default;

  const { error } = await supabase.from("phases").insert(
    template.map((name, i) => ({
      organization_id: project.organization_id,
      project_id: projectId,
      name,
      position: i,
    })),
  );
  if (error) throw new Error(error.message);

  return { applied: true as const, phases: template };
}
