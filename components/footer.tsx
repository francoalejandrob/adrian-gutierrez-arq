import Image from "next/image";
import Link from "next/link";
import { studio } from "@/lib/content";

const SECONDARY_LINKS = [
  { href: "/#proyectos", label: "Proyectos" },
  { href: "/#filosofia", label: "Filosofía" },
  { href: "/#estudio", label: "Estudio" },
  { href: "/#proceso", label: "Proceso" },
  { href: "/#contacto", label: "Contacto" },
];

export default function Footer() {
  return (
    <footer className="bg-carbon text-hueso">
      <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <div>
            <Image
              src="/logo.png"
              alt="Adrián Gutiérrez — Arquitectura & Diseño"
              width={56}
              height={56}
              className="h-12 w-12 rounded-sm object-cover"
            />
            <p className="mt-4 max-w-xs text-sm text-hueso/60">
              Arquitectura residencial de lujo y remodelaciones en Salinas,
              Ecuador.
            </p>
          </div>

          <nav className="flex flex-col gap-3">
            {SECONDARY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-xs uppercase tracking-[0.15em] text-hueso/70 transition-colors hover:text-naranja"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-col gap-3">
            <a
              href={`mailto:${studio.email}`}
              className="text-sm text-hueso/70 transition-colors hover:text-naranja"
            >
              {studio.email}
            </a>
            <span className="text-sm text-hueso/70">{studio.location}</span>
            <span className="font-mono text-xs text-hueso/40">
              {studio.coordinates}
            </span>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-hueso/10 pt-8 text-xs text-hueso/40 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {studio.name}. Todos los derechos
            reservados.
          </span>
          <span>{studio.role}</span>
        </div>
      </div>
    </footer>
  );
}
