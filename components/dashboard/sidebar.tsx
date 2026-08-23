import { LogOut } from "lucide-react";
import { signOut } from "@/app/(dashboard)/dashboard/auth-actions";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/dashboard/ui/avatar";
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
        <Avatar name={displayName} size={30} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-dp-sans text-[12px] leading-tight text-tinta">{displayName}</p>
          <p className="mt-0.5 font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-concreto">{member?.role ?? "—"}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            title="Salir"
            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-concreto transition-colors duration-150 hover:bg-realce hover:text-acento"
          >
            <LogOut size={15} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </form>
      </div>
    </aside>
  );
}
