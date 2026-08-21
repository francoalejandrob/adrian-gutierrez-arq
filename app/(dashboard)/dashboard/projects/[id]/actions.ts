"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganizationId } from "@/lib/supabase/org";
import {
  DOC_CATEGORIES,
  PHASE_STATUSES,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from "@/lib/supabase/types";

const dateOrNull = z
  .string()
  .optional()
  .transform((v) => (v ? v : null));
const numberOrNull = z
  .string()
  .optional()
  .transform((v) => (v ? Number(v) : null));

// Phases -----------------------------------------------------------------

const phaseSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  description: z.string().trim().optional(),
  start_date: dateOrNull,
  end_date: dateOrNull,
});

export async function createPhase(projectId: string, formData: FormData) {
  const parsed = phaseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada");

  const { count } = await supabase
    .from("phases")
    .select("*", { count: "exact", head: true })
    .eq("project_id", projectId);

  const { error } = await supabase.from("phases").insert({
    organization_id: organizationId,
    project_id: projectId,
    position: count ?? 0,
    ...parsed.data,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}`);
}

const phaseStatusSchema = z.enum(PHASE_STATUSES as [string, ...string[]]);

export async function updatePhaseStatus(projectId: string, phaseId: string, formData: FormData) {
  const status = phaseStatusSchema.parse(formData.get("status"));
  const progress = status === "completada" ? 100 : Number(formData.get("progress") ?? 0);

  const supabase = await createClient();
  const { error } = await supabase.from("phases").update({ status, progress }).eq("id", phaseId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function deletePhase(projectId: string, phaseId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("phases").delete().eq("id", phaseId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}`);
}

// Tasks ---------------------------------------------------------------

const taskSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio"),
  description: z.string().trim().optional(),
  phase_id: z.string().uuid().optional().or(z.literal("")),
  priority: z.enum(TASK_PRIORITIES as [string, ...string[]]).optional(),
  due_date: dateOrNull,
  estimated_hours: numberOrNull,
});

export async function createTask(projectId: string, formData: FormData) {
  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada");

  const { phase_id, ...rest } = parsed.data;
  const { error } = await supabase.from("tasks").insert({
    organization_id: organizationId,
    project_id: projectId,
    phase_id: phase_id || null,
    ...rest,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}`);
}

const taskStatusSchema = z.enum(TASK_STATUSES as [string, ...string[]]);

export async function updateTaskStatus(projectId: string, taskId: string, formData: FormData) {
  const status = taskStatusSchema.parse(formData.get("status"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", taskId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard");
}

export async function deleteTask(projectId: string, taskId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}`);
}

// Documents ---------------------------------------------------------------

const docCategorySchema = z.enum(DOC_CATEGORIES as [string, ...string[]]);

export async function uploadDocumentVersion(projectId: string, formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona un archivo");
  }

  const existingDocumentId = String(formData.get("document_id") ?? "");
  const comment = String(formData.get("comment") ?? "").trim() || null;

  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada");

  let documentId = existingDocumentId;
  let nextVersion = 1;

  if (documentId) {
    const { data: lastVersion } = await supabase
      .from("document_versions")
      .select("version")
      .eq("document_id", documentId)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    nextVersion = (lastVersion?.version ?? 0) + 1;
  } else {
    const name = String(formData.get("name") ?? "").trim();
    if (!name) throw new Error("El nombre del documento es obligatorio");
    const category = docCategorySchema.parse(formData.get("category") || "otro");
    const visibility = formData.get("visible_to_client") ? "client" : "internal";

    const { data: newDoc, error: docError } = await supabase
      .from("documents")
      .insert({ organization_id: organizationId, project_id: projectId, name, category, visibility })
      .select("id")
      .single();
    if (docError) throw new Error(docError.message);
    documentId = newDoc.id;
  }

  const path = `${organizationId}/${projectId}/${documentId}/${nextVersion}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("documents")
    .upload(path, file, { contentType: file.type });
  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error: versionError } = await supabase.from("document_versions").insert({
    document_id: documentId,
    version: nextVersion,
    storage_path: path,
    file_size: file.size,
    mime_type: file.type,
    comment,
    uploaded_by: user?.id,
  });
  if (versionError) throw new Error(versionError.message);

  revalidatePath(`/dashboard/projects/${projectId}`);
}

// Portal access ---------------------------------------------------------

const emailSchema = z.string().trim().email("Email inválido");

export async function invitePortalAccess(projectId: string, clientId: string, formData: FormData) {
  const email = emailSchema.parse(formData.get("email"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("portal_access")
    .insert({ client_id: clientId, email, invited_by: user?.id });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function revokePortalAccess(projectId: string, accessId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("portal_access").delete().eq("id", accessId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function getSignedDownloadUrl(storagePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(storagePath, 60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
