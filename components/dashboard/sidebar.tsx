import { signOut } from "@/app/(dashboard)/dashboard/auth-actions";
import { initials } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import SidebarNav from "./sidebar-nav";
import RecentProjects from "./recent-projects";

export default async function Sidebar() {
  const supabase = await createClient();

  const { data: userRes } = await supabase.auth.getUser();
  let member: { role: string; profiles: { full_name: string | null; email: string } | null } | null = null;
  if (userRes.user) {
    const { data } = await supabase
      .from("organization_members")
      .select("role, profiles(full_name, email)")
      .eq("user_id", userRes.user.id)
      .limit(1)
      .maybeSingle();
    member = data;
  }
  const displayName = member?.profiles?.full_name || member?.profiles?.email || "Usuario";

  return (
    <aside className="dp-grain sticky top-[53px] h-[calc(100vh-53px)] w-[225px] shrink-0 overflow-y-auto border-r border-filete py-[22px] pb-6">
      <SidebarNav />
      <RecentProjects />

      <div className="mx-5 mt-6 flex items-center gap-2.5 border-t border-filete pt-4">
        <span className="flex h-[27px] w-[27px] shrink-0 items-center justify-center bg-tinta font-dp-mono text-[11px] text-papel">
          {initials(displayName)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-dp-sans text-[12px] leading-tight text-tinta">{displayName}</p>
          <p className="mt-0.5 font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-[#6E6A60]">{member?.role ?? "—"}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="cursor-pointer font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-[#6E6A60] transition-colors duration-150 hover:text-acento"
          >
            Salir
          </button>
        </form>
      </div>
    </aside>
  );
}
