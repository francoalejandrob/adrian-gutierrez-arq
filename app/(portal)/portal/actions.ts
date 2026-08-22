"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { notifyStudio } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/server";
import { DOC_VERSION_STATUS_LABELS, QUOTE_STATUS_LABELS } from "@/lib/supabase/types";

const responseSchema = z.enum(["aprobado", "cambios_solicitados"]);

export async function respondToDocumentVersion(
  projectId: string,
  versionId: string,
  formData: FormData,
) {
  const status = responseSchema.parse(formData.get("status"));
  const comment = String(formData.get("comment") ?? "").trim() || null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // RLS ("portal clients respond to visible versions") only allows this
  // update to reach a version the client is actually allowed to see.
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

  const { data: project } = await supabase
    .from("projects")
    .select("organization_id, name")
    .eq("id", projectId)
    .single();
  if (project) {
    await notifyStudio({
      organizationId: project.organization_id,
      type: "document.responded",
      title: `${project.name}: documento ${DOC_VERSION_STATUS_LABELS[status].toLowerCase()}`,
      body: comment,
      entityType: "project",
      entityId: projectId,
    });
  }

  revalidatePath(`/portal/projects/${projectId}`);
}

const quoteResponseSchema = z.enum(["accepted", "rejected"]);

export async function respondToQuote(projectId: string, quoteId: string, formData: FormData) {
  const status = quoteResponseSchema.parse(formData.get("status"));

  const supabase = await createClient();
  // RLS ("portal clients respond to sent quotes") only allows this update
  // to reach a quote in sent/negotiation that belongs to the client's project.
  const { error } = await supabase
    .from("quotes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", quoteId);
  if (error) throw new Error(error.message);

  const { data: project } = await supabase
    .from("projects")
    .select("organization_id, name")
    .eq("id", projectId)
    .single();
  if (project) {
    await notifyStudio({
      organizationId: project.organization_id,
      type: "quote.responded",
      title: `${project.name}: cotización ${QUOTE_STATUS_LABELS[status].toLowerCase()}`,
      entityType: "project",
      entityId: projectId,
    });
  }

  revalidatePath(`/portal/projects/${projectId}`);
}

// RLS ("portal clients read their visible document objects", storage
// policy) only allows this to reach an object whose document is
// visibility='client' and belongs to the caller's own project.
export async function getPortalDownloadUrl(storagePath: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from("documents").createSignedUrl(storagePath, 60);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function addPortalMessage(projectId: string, formData: FormData) {
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: project } = await supabase
    .from("projects")
    .select("organization_id, name")
    .eq("id", projectId)
    .single();
  if (!project) throw new Error("Proyecto no encontrado");

  const { error } = await supabase.from("activity_log").insert({
    organization_id: project.organization_id,
    entity_type: "project",
    entity_id: projectId,
    body,
    created_by: user?.id,
    visible_to_client: true,
  });
  if (error) throw new Error(error.message);

  await notifyStudio({
    organizationId: project.organization_id,
    type: "message.received",
    title: `Nuevo mensaje en ${project.name}`,
    body,
    entityType: "project",
    entityId: projectId,
  });

  revalidatePath(`/portal/projects/${projectId}`);
}
