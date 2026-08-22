"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type Mark = "square" | "square-outline" | "circle-outline" | "circle-fill" | "diamond-outline" | "diamond-fill" | "triangle" | "bars";

function NavMark({ shape }: { shape: Mark }) {
  switch (shape) {
    case "square":
      return <span className="h-[7px] w-[7px] shrink-0 bg-current" />;
    case "square-outline":
      return <span className="h-[7px] w-[7px] shrink-0 border-[1.4px] border-current" />;
    case "circle-outline":
      return <span className="h-[7px] w-[7px] shrink-0 rounded-full border-[1.4px] border-current" />;
    case "circle-fill":
      return <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-current" />;
    case "diamond-outline":
      return <span className="h-[7px] w-[7px] shrink-0 rotate-45 border-[1.4px] border-current" />;
    case "diamond-fill":
      return <span className="h-[7px] w-[7px] shrink-0 rotate-45 bg-current" />;
    case "triangle":
      return (
        <span className="h-0 w-0 shrink-0 border-x-4 border-b-[7px] border-x-transparent border-b-current" />
      );
    case "bars":
      return (
        <span className="flex h-2 w-[9px] shrink-0 items-end gap-[1px]">
          <span className="h-1 w-[2px] bg-current" />
          <span className="h-2 w-[2px] bg-current" />
          <span className="h-1.5 w-[2px] bg-current" />
        </span>
      );
  }
}

type NavItem = {
  href: string;
  label: string;
  mark: Mark;
  match?: (pathname: string, tab: string | null) => boolean;
  showUnreadBadge?: boolean;
};
type NavGroup = { label?: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    items: [{ href: "/dashboard", label: "Dashboard", mark: "square", match: (p) => p === "/dashboard" }],
  },
  {
    label: "CRM",
    items: [
      {
        href: "/dashboard/crm?tab=leads",
        label: "Leads",
        mark: "circle-outline",
        match: (p, tab) => p === "/dashboard/crm" && (tab === "leads" || !tab),
      },
      {
        href: "/dashboard/crm?tab=clientes",
        label: "Clientes",
        mark: "circle-outline",
        match: (p, tab) => p === "/dashboard/crm" && tab === "clientes",
      },
      {
        href: "/dashboard/crm?tab=pipeline",
        label: "Pipeline",
        mark: "circle-outline",
        match: (p, tab) => p === "/dashboard/crm" && tab === "pipeline",
      },
    ],
  },
  {
    label: "Proyectos",
    items: [{ href: "/dashboard/projects", label: "Todos los proyectos", mark: "square-outline", match: (p) => p.startsWith("/dashboard/projects") }],
  },
  {
    label: "Comercial",
    items: [
      { href: "/dashboard/quotes", label: "Cotizaciones", mark: "diamond-outline", match: (p) => p.startsWith("/dashboard/quotes") },
      { href: "/dashboard/contracts", label: "Contratos", mark: "diamond-outline", match: (p) => p.startsWith("/dashboard/contracts") },
      { href: "/dashboard/finance", label: "Finanzas", mark: "circle-fill", match: (p) => p.startsWith("/dashboard/finance") },
    ],
  },
  {
    label: "Website",
    items: [
      { href: "/dashboard/website", label: "Analytics & SEO", mark: "triangle", match: (p) => p.startsWith("/dashboard/website") },
      { href: "/dashboard/marketing", label: "Marketing", mark: "triangle", match: (p) => p.startsWith("/dashboard/marketing") },
    ],
  },
  {
    items: [
      { href: "/dashboard/calendar", label: "Agenda", mark: "square-outline", match: (p) => p.startsWith("/dashboard/calendar") },
      {
        href: "/dashboard/notifications",
        label: "Notificaciones",
        mark: "circle-fill",
        match: (p) => p.startsWith("/dashboard/notifications"),
        showUnreadBadge: true,
      },
      { href: "/dashboard/ai", label: "Archi AI", mark: "diamond-fill", match: (p) => p.startsWith("/dashboard/ai") },
      { href: "/dashboard/reports", label: "Reportes", mark: "bars", match: (p) => p.startsWith("/dashboard/reports") },
      { href: "/dashboard/settings", label: "Configuración", mark: "circle-outline", match: (p) => p.startsWith("/dashboard/settings") },
    ],
  },
];

export default function SidebarNav({ unreadCount }: { unreadCount: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  return (
    <nav className="flex flex-col">
      {NAV_GROUPS.map((group, i) => (
        <div key={i} className={i === 0 ? "" : "mt-5"}>
          {group.label && (
            <p className="mb-1.5 px-3 text-[10.5px] font-medium uppercase tracking-[0.1em] text-hueso/30">
              {group.label}
            </p>
          )}
          <div className="flex flex-col gap-[1px]">
            {group.items.map((item) => {
              const active = item.match?.(pathname, tab) ?? false;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-lg border-l-2 px-3 py-2 text-[13.5px] transition-colors duration-150 ${
                    active
                      ? "border-naranja bg-naranja/[0.16] font-medium text-hueso"
                      : "border-transparent text-hueso/60 hover:bg-hueso/[0.06] hover:text-hueso"
                  }`}
                >
                  <NavMark shape={item.mark} />
                  <span className="flex-1">{item.label}</span>
                  {item.showUnreadBadge && unreadCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center bg-naranja px-1.5 font-mono text-[10.5px] font-semibold text-noche">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
