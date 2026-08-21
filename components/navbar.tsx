"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { EASE_OUT } from "@/lib/motion";
import { useLocale, useT } from "@/lib/i18n";

const NAV_LINKS = [
  { href: "/#proyectos", key: "proyectos" },
  { href: "/#estudio", key: "estudio" },
  { href: "/#proceso", key: "proceso" },
  { href: "/#contacto", key: "contacto" },
] as const;

export default function Navbar() {
  const t = useT();
  const { locale, toggle } = useLocale();
  const pathname = usePathname();
  const hasDarkHero = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const isSolid = !hasDarkHero || scrolled || menuOpen;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ease-out-strong ${
        isSolid ? "bg-carbon" : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 max-w-[1600px] items-center justify-between px-6 md:px-10">
        <Link
          href="/"
          className="press flex items-center gap-3"
          onClick={() => setMenuOpen(false)}
        >
          <Image
            src="/logo-icon.png"
            alt={`Adrián Gutiérrez — ${t.sobreEstudio.role}`}
            width={41}
            height={40}
            className="h-10 w-auto"
            priority
          />
          <span className="hidden font-display text-lg tracking-normal text-hueso sm:inline">
            Adrián Gutiérrez
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <nav className="flex items-center gap-8">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="nav-link font-mono text-xs uppercase tracking-[0.15em] text-hueso/80 transition-colors duration-200 hover:text-naranja"
              >
                {t.nav[link.key]}
              </Link>
            ))}
          </nav>
          <LocaleToggle locale={locale} onToggle={toggle} />
        </div>

        <div className="flex items-center gap-4 md:hidden">
          <LocaleToggle locale={locale} onToggle={toggle} />
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="press flex h-10 w-10 cursor-pointer flex-col items-center justify-center gap-1.5"
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            <span
              className={`h-px w-6 bg-hueso transition-transform duration-300 ease-out-strong ${
                menuOpen ? "translate-y-[3.5px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-px w-6 bg-hueso transition-transform duration-300 ease-out-strong ${
                menuOpen ? "-translate-y-[3.5px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE_OUT }}
            className="fixed inset-0 top-20 z-40 flex flex-col justify-center gap-8 bg-carbon px-8 md:hidden"
          >
            {NAV_LINKS.map((link, i) => (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 * i, ease: EASE_OUT }}
              >
                <Link
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="press inline-block font-display text-4xl text-hueso transition-colors duration-200 hover:text-naranja"
                >
                  {t.nav[link.key]}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function LocaleToggle({
  locale,
  onToggle,
}: {
  locale: "es" | "en";
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Cambiar idioma / Switch language"
      className="press flex cursor-pointer items-center gap-1 border border-hueso/25 px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-hueso/80 transition-colors duration-200 hover:border-naranja hover:text-naranja"
    >
      <span className={locale === "es" ? "text-naranja" : ""}>ES</span>
      <span className="text-hueso/30">/</span>
      <span className={locale === "en" ? "text-naranja" : ""}>EN</span>
    </button>
  );
}
