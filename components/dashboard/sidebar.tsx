import Link from "next/link";
import { signOut } from "@/app/(dashboard)/dashboard/auth-actions";
import { createClient } from "@/lib/supabase/server";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/leads", label: "Leads" },
  { href: "/dashboard/clients", label: "Clientes" },
  { href: "/dashboard/projects", label: "Proyectos" },
  { href: "/dashboard/finance", label: "Finanzas" },
  { href: "/dashboard/marketing", label: "Marketing" },
  { href: "/dashboard/website", label: "Website" },
  { href: "/dashboard/ai", label: "Archi AI" },
];

export default async function Sidebar() {
  const supabase = await createClient();
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);

  return (
    <aside className="flex w-56 shrink-0 flex-col justify-between border-r border-carbon/10 bg-white px-4 py-6">
      <div>
        <div className="mb-8 px-2">
          <p className="font-display text-lg text-carbon">ARCHI.OS</p>
          <p className="text-xs text-carbon/50">Adrián Gutiérrez Arq.</p>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-3 py-2 text-sm text-carbon/80 transition-colors hover:bg-hueso hover:text-carbon"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/dashboard/notifications"
            className="flex items-center justify-between px-3 py-2 text-sm text-carbon/80 transition-colors hover:bg-hueso hover:text-carbon"
          >
            Notificaciones
            {Boolean(unreadCount) && (
              <span className="flex h-5 min-w-5 items-center justify-center bg-naranja px-1.5 text-[11px] font-medium text-carbon">
                {unreadCount}
              </span>
            )}
          </Link>
        </nav>
      </div>

      <form action={signOut}>
        <button
          type="submit"
          className="w-full cursor-pointer px-3 py-2 text-left text-sm text-carbon/60 transition-colors hover:bg-hueso hover:text-carbon"
        >
          Cerrar sesión
        </button>
      </form>
    </aside>
  );
}
