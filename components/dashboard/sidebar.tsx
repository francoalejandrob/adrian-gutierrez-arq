import Link from "next/link";
import { LogOut } from "lucide-react";
import { signOut } from "@/app/(dashboard)/dashboard/auth-actions";
import { initials } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import SidebarNav from "./sidebar-nav";

export default async function Sidebar() {
  const supabase = await createClient();

  const [{ count: unreadCount }, { data: org }, { data: userRes }] = await Promise.all([
    supabase.from("notifications").select("*", { count: "exact", head: true }).is("read_at", null),
    supabase.from("organizations").select("name").limit(1).maybeSingle(),
    supabase.auth.getUser(),
  ]);

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
    <aside className="flex w-64 shrink-0 flex-col justify-between bg-noche px-3.5 py-6">
      <div>
        <div className="mb-5 flex items-center gap-2.5 border-b border-hueso/10 px-2.5 pb-[22px]">
          <span className="h-5 w-5 shrink-0 rounded-md bg-naranja" />
          <div>
            <p className="font-display text-lg font-semibold leading-none text-hueso">ARCHI.OS</p>
            <p className="mt-1 text-[11.5px] text-hueso/45">{org?.name ?? "Estudio de arquitectura"}</p>
          </div>
        </div>

        <SidebarNav unreadCount={unreadCount ?? 0} />
      </div>

      <div>
        <Link
          href="/portal"
          className="block px-3 py-2 text-xs text-hueso/45 underline decoration-hueso/25 underline-offset-2 transition-colors duration-150 hover:text-naranja"
        >
          Ver portal del cliente →
        </Link>
        <div className="mt-1.5 flex items-center gap-2.5 border-t border-hueso/10 px-3 pt-2.5">
          <div className="flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-full bg-naranja font-display text-[13px] font-semibold text-noche">
            {initials(displayName)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-medium text-hueso">{displayName}</p>
            <p className="text-[11px] text-hueso/40">{member?.role ?? "—"}</p>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              aria-label="Cerrar sesión"
              className="cursor-pointer p-1 text-hueso/40 transition-colors duration-150 hover:text-hueso"
            >
              <LogOut size={16} strokeWidth={1.75} aria-hidden="true" />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
