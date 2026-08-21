"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganizationId } from "@/lib/supabase/org";
import { LEAD_STATUSES } from "@/lib/supabase/types";

const leadSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  email: z.string().trim().email("Email inválido"),
  phone: z.string().trim().optional(),
  location: z.string().trim().optional(),
  need: z.string().trim().optional(),
  message: z.string().trim().optional(),
  estimated_value: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : null)),
});

export async function createLead(formData: FormData) {
  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada");

  const { error } = await supabase.from("leads").insert({
    organization_id: organizationId,
    source: "manual",
    ...parsed.data,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/leads");
  redirect("/dashboard/leads");
}

export async function updateLead(id: string, formData: FormData) {
  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/leads/${id}`);
  revalidatePath("/dashboard/leads");
}

const statusSchema = z.enum(LEAD_STATUSES as [string, ...string[]]);

export async function updateLeadStatus(id: string, formData: FormData) {
  const parsedStatus = statusSchema.parse(formData.get("status"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ status: parsedStatus, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/leads/${id}`);
  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard");
}

export async function addLeadNote(id: string, formData: FormData) {
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
    entity_type: "lead",
    entity_id: id,
    body,
    created_by: user?.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/leads/${id}`);
}

export async function convertLeadToClient(id: string) {
  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada");

  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("name, email, phone")
    .eq("id", id)
    .single();
  if (leadError) throw new Error(leadError.message);

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .insert({
      organization_id: organizationId,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      converted_from_lead_id: id,
    })
    .select("id")
    .single();
  if (clientError) throw new Error(clientError.message);

  await supabase
    .from("leads")
    .update({ status: "ganado", updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/dashboard/leads");
  revalidatePath("/dashboard/clients");
  redirect(`/dashboard/clients/${client.id}`);
}
