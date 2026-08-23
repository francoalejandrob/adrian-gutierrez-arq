import Link from "next/link";

// Píldora redondeada compartida para toda navegación tipo tabs del
// dashboard (antes cada página hand-rolleaba su propio botón de
// subrayado, 3 veces con el mismo string de clases copiado). `size="sm"`
// cubre filas secundarias más compactas (filtros de estado, toggles de
// vista) con el mismo lenguaje visual que las tabs principales.
export function TabLink({
  href,
  label,
  active,
  size = "default",
  className = "",
}: {
  href: string;
  label: string;
  active: boolean;
  size?: "default" | "sm";
  className?: string;
}) {
  const sizeClass = size === "sm" ? "px-3 py-1.5 text-[10px]" : "px-4 py-2 text-[10.5px]";
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border font-dp-mono uppercase tracking-[0.12em] transition-colors duration-150 ${sizeClass} ${
        active
          ? "border-tinta bg-realce font-medium text-tinta"
          : "border-filete text-concreto hover:border-corte hover:text-tinta"
      } ${className}`}
    >
      {label}
    </Link>
  );
}
