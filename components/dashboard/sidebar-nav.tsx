"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  FolderKanban,
  Globe,
  LayoutDashboard,
  Megaphone,
  Sparkles,
  Target,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const NAV_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/leads", label: "Leads", icon: Target },
  { href: "/dashboard/clients", label: "Clientes", icon: Users },
  { href: "/dashboard/projects", label: "Proyectos", icon: FolderKanban },
  { href: "/dashboard/finance", label: "Finanzas", icon: Wallet },
  { href: "/dashboard/marketing", label: "Marketing", icon: Megaphone },
  { href: "/dashboard/website", label: "Website", icon: Globe },
  { href: "/dashboard/ai", label: "Archi AI", icon: Sparkles },
];

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}

export default function SidebarNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_LINKS.map((link) => {
        const active = isActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 border-l-2 px-3 py-2 text-sm transition-colors duration-150 ${
              active
                ? "border-naranja bg-hueso text-carbon font-medium"
                : "border-transparent text-carbon/70 hover:bg-hueso hover:text-carbon"
            }`}
          >
            <link.icon size={17} strokeWidth={1.75} aria-hidden="true" />
            {link.label}
          </Link>
        );
      })}

      {(() => {
        const active = isActive(pathname, "/dashboard/notifications");
        return (
          <Link
            href="/dashboard/notifications"
            aria-current={active ? "page" : undefined}
            className={`flex items-center justify-between gap-2.5 border-l-2 px-3 py-2 text-sm transition-colors duration-150 ${
              active
                ? "border-naranja bg-hueso text-carbon font-medium"
                : "border-transparent text-carbon/70 hover:bg-hueso hover:text-carbon"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <Bell size={17} strokeWidth={1.75} aria-hidden="true" />
              Notificaciones
            </span>
            {unreadCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center bg-naranja px-1.5 font-mono text-[11px] font-medium text-carbon">
                {unreadCount}
              </span>
            )}
          </Link>
        );
      })()}
    </nav>
  );
}
