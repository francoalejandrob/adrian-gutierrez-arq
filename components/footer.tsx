"use client";

import Image from "next/image";
import Link from "next/link";
import InstagramIcon from "@/components/icons/instagram-icon";
import { studio } from "@/lib/content";
import { useT } from "@/lib/i18n";

const SECONDARY_LINKS = [
  { href: "/#proyectos", key: "proyectos" },
  { href: "/#estudio", key: "estudio" },
  { href: "/#proceso", key: "proceso" },
  { href: "/#contacto", key: "contacto" },
] as const;

export default function Footer() {
  const t = useT();

  return (
    <footer className="bg-carbon text-hueso">
      <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
          <div>
            <Image
              src="/logo-icon.png"
              alt={`Adrián Gutiérrez — ${t.sobreEstudio.role}`}
              width={49}
              height={48}
              className="h-12 w-auto"
            />
            <p className="mt-4 max-w-xs text-sm text-hueso/60">
              {t.footer.tagline}
            </p>
          </div>

          <nav className="flex flex-col gap-3">
            {SECONDARY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-mono text-xs uppercase tracking-[0.15em] text-hueso/70 transition-colors hover:text-naranja"
              >
                {t.nav[link.key]}
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
            <a
              href={`https://instagram.com/${studio.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de Adrián Gutiérrez Arquitectura & Diseño"
              className="press mt-2 flex w-fit items-center gap-2 text-sm text-hueso/70 transition-colors hover:text-naranja"
            >
              <InstagramIcon className="h-4 w-4" />@{studio.instagram}
            </a>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-hueso/10 pt-8 text-xs text-hueso/40 sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {new Date().getFullYear()} {studio.name}. {t.footer.rights}
          </span>
          <span>{t.sobreEstudio.role}</span>
        </div>
      </div>
    </footer>
  );
}
