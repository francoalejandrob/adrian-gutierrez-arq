"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganizationId } from "@/lib/supabase/org";
import { applyPhaseTemplate } from "@/lib/phase-templates";
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

// Para proyectos que nunca pasaron por una cotización aceptada (el
// único disparador automático hoy) — botón manual en la pestaña
// Overview, visible solo cuando el proyecto no tiene fases todavía.
export async function applyPhaseTemplateAction(projectId: string) {
  const supabase = await createClient();
  await applyPhaseTemplate(supabase, projectId);

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
  assigned_to: z.string().uuid().optional().or(z.literal("")),
});

export async function createTask(projectId: string, formData: FormData) {
  const parsed = taskSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada");

  const { phase_id, assigned_to, ...rest } = parsed.data;
  const { error } = await supabase.from("tasks").insert({
    organization_id: organizationId,
    project_id: projectId,
    phase_id: phase_id || null,
    assigned_to: assigned_to || null,
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
//
// Solo el administrador puede crear una cuenta del portal — nunca hay
// auto-registro (pedido explícito del usuario). Esta acción crea (o, si
// el email ya tiene una cuenta de una invitación/reset anterior,
// restablece) la cuenta real en auth.users con una contraseña generada,
// además de la fila de portal_access que ya existía. La contraseña se
// devuelve una sola vez al formulario que la llamó — nunca se guarda en
// texto plano ni se manda por correo; el admin la copia y se la entrega
// al cliente por fuera del sistema.

const emailSchema = z
  .string()
  .trim()
  .email("Email inválido")
  .transform((v) => v.toLowerCase());

export type PortalInviteState = { email: string; password: string } | { error: string } | null;

function generatePortalPassword(): string {
  // 16 caracteres de un alfabeto sin 0/O/1/l/I (ambiguos al copiar a
  // mano) — sobra entropía para una contraseña inicial que el cliente
  // puede cambiar después desde /portal/account.
  const alphabet = "23456789ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
  const bytes = randomBytes(16);
  let out = "";
  for (let i = 0; i < bytes.length; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

export async function invitePortalAccess(
  projectId: string,
  clientId: string,
  _prevState: PortalInviteState,
  formData: FormData,
): Promise<PortalInviteState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Email inválido" };
  const email = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();
  const password = generatePortalPassword();

  const { error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    if (createError.status !== 422) return { error: createError.message };

    // El email ya tiene una cuenta (invitación o self-provisioning de
    // antes de este cambio) — se le restablece la contraseña en vez de
    // fallar, así "invitar" y "restablecer acceso" son la misma acción.
    const { data: existing, error: lookupError } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (lookupError) return { error: lookupError.message };
    if (!existing) return { error: "Ya existe una cuenta con ese email pero no se pudo encontrar para restablecerla." };

    const { error: updateError } = await admin.auth.admin.updateUserById(existing.id, { password });
    if (updateError) return { error: updateError.message };
  }

  const { error: accessError } = await supabase
    .from("portal_access")
    .upsert({ client_id: clientId, email, invited_by: user?.id }, { onConflict: "client_id,email" });
  if (accessError) return { error: accessError.message };

  revalidatePath(`/dashboard/projects/${projectId}`);
  return { email, password };
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

// Approvals ----------------------------------------------------------------

const versionResponseSchema = z.enum(["aprobado", "cambios_solicitados"]);

// Lets the studio record an approval/change-request from the dashboard —
// e.g. a client approved verbally or by email instead of through the
// portal. This doesn't grant any new access: organization_members
// already had write permission on document_versions via the original
// org-scoped RLS policy (the portal's own respondToDocumentVersion just
// layers an *additional* policy for portal users on top of that).
export async function updateDocumentVersionStatus(projectId: string, versionId: string, formData: FormData) {
  const status = versionResponseSchema.parse(formData.get("status"));
  const comment = String(formData.get("comment") ?? "").trim() || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("document_versions")
    .update({
      status,
      comment,
      approved_at: status === "aprobado" ? new Date().toISOString() : null,
      approved_by: user?.id,
    })
    .eq("id", versionId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}`);
}
