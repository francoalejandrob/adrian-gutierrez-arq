"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const orgNameSchema = z.string().trim().min(1, "El nombre es obligatorio");

// Gateado por la política RLS "org_admin can update organization"
// (migración 0013) — un usuario sin ese rol recibe el rechazo de
// Postgres como error, no hace falta re-chequear el rol acá.
export async function updateOrganization(formData: FormData) {
  const name = orgNameSchema.parse(formData.get("name"));

  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("id").limit(1).maybeSingle();
  if (!org) throw new Error("No se encontró la organización.");

  const { error } = await supabase.from("organizations").update({ name }).eq("id", org.id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/settings");
}

const profileNameSchema = z.string().trim().min(1, "El nombre es obligatorio");

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("No autenticado.");

  const fullName = profileNameSchema.parse(formData.get("full_name"));
  const avatarFile = formData.get("avatar");

  let avatarUrl: string | undefined;
  if (avatarFile instanceof File && avatarFile.size > 0) {
    const path = `${user.id}/${Date.now()}-${avatarFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { contentType: avatarFile.type });
    if (uploadError) throw new Error(uploadError.message);

    avatarUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, ...(avatarUrl ? { avatar_url: avatarUrl } : {}) })
    .eq("id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard", "layout");
}
