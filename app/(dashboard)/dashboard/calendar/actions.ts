"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganizationId } from "@/lib/supabase/org";

const eventSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio"),
  date: z.string().min(1, "La fecha es obligatoria"),
  time: z.string().optional(),
  project_id: z
    .string()
    .optional()
    .transform((v) => (v ? v : null)),
  notes: z.string().trim().optional(),
});

export async function createEvent(formData: FormData) {
  const parsed = eventSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const startsAt = new Date(`${parsed.data.date}T${parsed.data.time || "09:00"}:00`).toISOString();

  const { error } = await supabase.from("calendar_events").insert({
    organization_id: organizationId,
    project_id: parsed.data.project_id,
    title: parsed.data.title,
    starts_at: startsAt,
    notes: parsed.data.notes || null,
    created_by: user?.id,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
}

export async function deleteEvent(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("calendar_events").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/calendar");
  revalidatePath("/dashboard");
}
