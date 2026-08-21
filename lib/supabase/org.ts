import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/** The organization the current session's user belongs to (single-tenant for now — see DATABASE.md §3). */
export async function getCurrentOrganizationId(
  supabase: SupabaseClient<Database>,
): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return data?.organization_id ?? null;
}
