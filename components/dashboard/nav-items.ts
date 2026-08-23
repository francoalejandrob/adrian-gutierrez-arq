import {
  BarChart3,
  Bell,
  Calendar,
  FileSignature,
  FileText,
  FolderKanban,
  Globe,
  LayoutDashboard,
  MapPin,
  Megaphone,
  Palette,
  Settings,
  Sparkles,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  num: string;
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string, tab: string | null) => boolean;
};
export type NavGroup = { label: string; items: NavItem[] };

// Single source of truth for the dashboard's nav — the sidebar renders it
// grouped, the command palette's "Ir a" group flattens it. `num` is kept
// for row/table indices elsewhere but the sidebar itself now renders
// `icon` instead of the "01/02/03" index (icons are back after adopting
// the reference dashboard's look — see ARCHITECTURE.md §6g).
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "",
    items: [{ num: "01", href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, match: (p) => p === "/dashboard" }],
  },
  {
    label: "Comercial",
    items: [
      {
        num: "02",
        href: "/dashboard/crm?tab=leads",
        label: "Leads",
        icon: Users,
        match: (p, tab) => p === "/dashboard/crm" && (tab === "leads" || !tab),
      },
      {
        num: "03",
        href: "/dashboard/crm?tab=clientes",
        label: "Clientes",
        icon: Users,
        match: (p, tab) => p === "/dashboard/crm" && tab === "clientes",
      },
      {
        num: "04",
        href: "/dashboard/crm?tab=pipeline",
        label: "Pipeline",
        icon: TrendingUp,
        match: (p, tab) => p === "/dashboard/crm" && tab === "pipeline",
      },
      { num: "05", href: "/dashboard/quotes", label: "Cotizaciones", icon: FileText, match: (p) => p.startsWith("/dashboard/quotes") },
      { num: "06", href: "/dashboard/contracts", label: "Contratos", icon: FileSignature, match: (p) => p.startsWith("/dashboard/contracts") },
    ],
  },
  {
    label: "Producción",
    items: [
      { num: "07", href: "/dashboard/projects", label: "Proyectos", icon: FolderKanban, match: (p) => p.startsWith("/dashboard/projects") },
      { num: "08", href: "/dashboard/calendar", label: "Agenda", icon: Calendar, match: (p) => p.startsWith("/dashboard/calendar") },
    ],
  },
  {
    label: "Inteligencia",
    items: [
      { num: "09", href: "/dashboard/finance", label: "Finanzas", icon: Wallet, match: (p) => p.startsWith("/dashboard/finance") },
      { num: "10", href: "/dashboard/website", label: "Website", icon: Globe, match: (p) => p.startsWith("/dashboard/website") },
      { num: "11", href: "/dashboard/marketing", label: "Marketing", icon: Megaphone, match: (p) => p.startsWith("/dashboard/marketing") },
      { num: "12", href: "/dashboard/ai", label: "Archi AI", icon: Sparkles, match: (p) => p.startsWith("/dashboard/ai") },
      { num: "13", href: "/dashboard/reports", label: "Reportes", icon: BarChart3, match: (p) => p.startsWith("/dashboard/reports") },
      { num: "17", href: "/dashboard/map", label: "Mapa", icon: MapPin, match: (p) => p.startsWith("/dashboard/map") },
    ],
  },
  {
    label: "Sistema",
    items: [
      { num: "14", href: "/dashboard/notifications", label: "Notificaciones", icon: Bell, match: (p) => p.startsWith("/dashboard/notifications") },
      { num: "15", href: "/dashboard/settings", label: "Configuración", icon: Settings, match: (p) => p.startsWith("/dashboard/settings") },
      { num: "16", href: "/dashboard/design-system", label: "Design system", icon: Palette, match: (p) => p.startsWith("/dashboard/design-system") },
    ],
  },
];

export const CRUMBS: { test: (pathname: string) => boolean; label: string }[] = [
  { test: (p) => p === "/dashboard", label: "Dashboard" },
  { test: (p) => p === "/dashboard/crm", label: "Comercial / CRM" },
  { test: (p) => p.startsWith("/dashboard/leads"), label: "Comercial / Lead" },
  { test: (p) => p.startsWith("/dashboard/clients"), label: "Comercial / Cliente" },
  { test: (p) => p.startsWith("/dashboard/quotes"), label: "Comercial / Cotizaciones" },
  { test: (p) => p.startsWith("/dashboard/contracts"), label: "Comercial / Contratos" },
  { test: (p) => p.startsWith("/dashboard/projects"), label: "Producción / Proyectos" },
  { test: (p) => p.startsWith("/dashboard/calendar"), label: "Producción / Agenda" },
  { test: (p) => p.startsWith("/dashboard/finance"), label: "Inteligencia / Finanzas" },
  { test: (p) => p.startsWith("/dashboard/website"), label: "Inteligencia / Website" },
  { test: (p) => p.startsWith("/dashboard/marketing"), label: "Inteligencia / Marketing" },
  { test: (p) => p.startsWith("/dashboard/ai"), label: "Inteligencia / Archi AI" },
  { test: (p) => p.startsWith("/dashboard/reports"), label: "Inteligencia / Reportes" },
  { test: (p) => p.startsWith("/dashboard/map"), label: "Inteligencia / Mapa" },
  { test: (p) => p.startsWith("/dashboard/notifications"), label: "Sistema / Notificaciones" },
  { test: (p) => p.startsWith("/dashboard/settings"), label: "Sistema / Configuración" },
  { test: (p) => p.startsWith("/dashboard/design-system"), label: "Sistema / Design system" },
];

export function crumbFor(pathname: string) {
  return CRUMBS.find((c) => c.test(pathname))?.label ?? "Dashboard";
}

// Static, real shortcuts for the command palette's "Crear" and
// "Preguntar a Archi" groups — every entry navigates somewhere real,
// nothing simulated.
export const CMD_CREATE = [
  { label: "Nuevo lead", href: "/dashboard/leads/new" },
  { label: "Nuevo cliente", href: "/dashboard/clients/new" },
  { label: "Nuevo proyecto", href: "/dashboard/projects/new" },
];

export const CMD_ASK = [
  { label: "¿En qué debo enfocarme hoy?", href: "/dashboard/ai" },
  { label: "¿Qué proyectos están atrasados?", href: "/dashboard/ai" },
  { label: "¿Qué pagos están pendientes?", href: "/dashboard/ai" },
];
