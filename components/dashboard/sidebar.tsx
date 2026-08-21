import { LogOut } from "lucide-react";
import { signOut } from "@/app/(dashboard)/dashboard/auth-actions";
import { createClient } from "@/lib/supabase/server";
import SidebarNav from "./sidebar-nav";

export default async function Sidebar() {
  const supabase = await createClient();
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);

  return (
    <aside className="flex w-56 shrink-0 flex-col justify-between border-r border-carbon/10 bg-white px-3 py-6">
      <div>
        <div className="mb-8 px-3">
          <p className="font-display text-lg text-carbon">ARCHI.OS</p>
          <p className="text-xs text-carbon/50">Adrián Gutiérrez Arq.</p>
        </div>
        <SidebarNav unreadCount={unreadCount ?? 0} />
      </div>

      <form action={signOut}>
        <button
          type="submit"
          className="flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm text-carbon/60 transition-colors duration-150 hover:bg-hueso hover:text-carbon"
        >
          <LogOut size={17} strokeWidth={1.75} aria-hidden="true" />
          Cerrar sesión
        </button>
      </form>
    </aside>
  );
}
