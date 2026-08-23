"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { geocodeAddress } from "@/lib/integrations/google-geocoding";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganizationId } from "@/lib/supabase/org";
import { PROJECT_CATEGORIES, PROJECT_STATUSES } from "@/lib/supabase/types";

const numberOrNull = z
  .string()
  .optional()
  .transform((v) => (v ? Number(v) : null));

const dateOrNull = z
  .string()
  .optional()
  .transform((v) => (v ? v : null));

const projectSchema = z.object({
  client_id: z.string().uuid("Selecciona un cliente"),
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  description: z.string().trim().optional(),
  category: z.enum(PROJECT_CATEGORIES as [string, ...string[]]).optional().or(z.literal("")),
  location: z.string().trim().optional(),
  budget: numberOrNull,
  contracted_value: numberOrNull,
  start_date: dateOrNull,
  estimated_end_date: dateOrNull,
});

export async function createProject(formData: FormData) {
  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada");

  const { category, ...rest } = parsed.data;
  const coords = rest.location ? await geocodeAddress(rest.location) : null;
  const { data: project, error } = await supabase
    .from("projects")
    .insert({
      organization_id: organizationId,
      category: category || null,
      ...rest,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/projects");
  redirect(`/dashboard/projects/${project.id}`);
}

const updateProjectSchema = projectSchema.extend({
  progress: z.string().optional().transform((v) => (v ? Number(v) : 0)),
  actual_end_date: dateOrNull,
});

export async function updateProject(id: string, formData: FormData) {
  const parsed = updateProjectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const { category, ...rest } = parsed.data;
  const coords = rest.location ? await geocodeAddress(rest.location) : null;
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({
      ...rest,
      category: category || null,
      latitude: coords?.lat ?? null,
      longitude: coords?.lng ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${id}`);
  revalidatePath("/dashboard/projects");
}

const statusSchema = z.enum(PROJECT_STATUSES as [string, ...string[]]);

export async function updateProjectStatus(id: string, formData: FormData) {
  const status = statusSchema.parse(formData.get("status"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("projects")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${id}`);
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard");
}

export async function addProjectNote(id: string, formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("activity_log").insert({
    organization_id: organizationId,
    entity_type: "project",
    entity_id: id,
    body,
    created_by: user?.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${id}`);
}
