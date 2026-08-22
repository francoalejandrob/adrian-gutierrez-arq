"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganizationId } from "@/lib/supabase/org";

const clientSchema = z.object({
  name: z.string().trim().min(1, "El nombre es obligatorio"),
  email: z.string().trim().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function createClientRecord(formData: FormData) {
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada");

  const { error } = await supabase.from("clients").insert({
    organization_id: organizationId,
    ...parsed.data,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/crm");
  redirect("/dashboard/crm?tab=clientes");
}

export async function updateClientRecord(id: string, formData: FormData) {
  const parsed = clientSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const supabase = await createClient();
  const { error } = await supabase.from("clients").update(parsed.data).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/clients/${id}`);
  revalidatePath("/dashboard/crm");
}

export async function addClientNote(id: string, formData: FormData) {
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
    entity_type: "client",
    entity_id: id,
    body,
    created_by: user?.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/clients/${id}`);
}
