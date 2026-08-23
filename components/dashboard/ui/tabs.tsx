import type { LucideIcon } from "lucide-react";
import Link from "next/link";

// Chip compartido para toda navegación tipo tabs del dashboard — mismo
// lenguaje visual que los ítems del sidebar (rounded-lg, relleno
// `realce` en el estado activo, sin borde) en vez de la píldora con
// borde de la vuelta anterior. `icon` es opcional: las tabs principales
// que ya tienen un ícono establecido en `nav-items.ts` lo reusan (nunca
// se inventa uno nuevo); las filas de filtro secundarias (estado,
// Tabla/Kanban) quedan sin ícono. `size="sm"` cubre esas filas más
// compactas con el mismo lenguaje visual.
export function TabLink({
  href,
  label,
  active,
  icon: Icon,
  size = "default",
  className = "",
}: {
  href: string;
  label: string;
  active: boolean;
  icon?: LucideIcon;
  size?: "default" | "sm";
  className?: string;
}) {
  const sizeClass = size === "sm" ? "px-3 py-1.5 text-[10px]" : "px-3.5 py-2 text-[10.5px]";
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg font-dp-mono font-medium uppercase tracking-[0.12em] transition-colors duration-150 ${sizeClass} ${
        active ? "bg-realce text-tinta" : "text-concreto hover:bg-realce hover:text-tinta"
      } ${className}`}
    >
      {Icon && (
        <Icon size={size === "sm" ? 12 : 13} strokeWidth={1.75} className={active ? "text-acento" : "text-concreto"} aria-hidden="true" />
      )}
      {label}
    </Link>
  );
}
