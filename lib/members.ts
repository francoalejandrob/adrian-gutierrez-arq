import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

// Shared "who can this be assigned to" query — organization_members
// joined to profiles, same relation the sidebar/settings pages already
// read. Used by the lead and task assignee selects.
export async function getAssignableMembers(supabase: SupabaseClient) {
  const { data } = await supabase.from("organization_members").select("profiles(id, full_name, email)").order("created_at");
  return (data ?? [])
    .map((m) => m.profiles)
    .filter((p): p is { id: string; full_name: string | null; email: string } => p !== null)
    .map((p) => ({ id: p.id, name: p.full_name || p.email }));
}
