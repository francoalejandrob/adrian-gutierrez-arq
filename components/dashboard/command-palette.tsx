"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { CMD_ASK, CMD_CREATE, NAV_GROUPS, type NavItem } from "./nav-items";

type Entry = { label: string; href: string; icon?: NavItem["icon"] };

const GO_ENTRIES: Entry[] = NAV_GROUPS.flatMap((g) => g.items.map((item) => ({ label: item.label, href: item.href, icon: item.icon })));

// Real, functional ⌘K/Ctrl+K palette — every result is a real navigation
// target (dashboard routes, quick-create links, or a shortcut into Archi
// AI), filtered by substring match. No simulated search index, no fake
// results.
export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function openPalette() {
    setQuery("");
    setOpen(true);
  }

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => {
          if (!o) setQuery("");
          return !o;
        });
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, []);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filter = (entries: Entry[]) => (q ? entries.filter((e) => e.label.toLowerCase().includes(q)) : entries);
    return [
      { name: "Ir a", items: filter(GO_ENTRIES) },
      { name: "Crear", items: filter(CMD_CREATE) },
      { name: "Preguntar a Archi", items: filter(CMD_ASK) },
    ].filter((g) => g.items.length > 0);
  }, [query]);

  function go(href: string) {
    setOpen(false);
    router.push(href);
  }

  return (
    <>
      <button
        type="button"
        onClick={openPalette}
        title="Buscar o navegar"
        className="flex h-[34px] max-w-[280px] flex-1 cursor-pointer items-center gap-2 rounded-full border border-filete bg-superficie px-3.5 text-left transition-colors duration-150 hover:border-tinta"
      >
        <Search size={14} strokeWidth={2} className="shrink-0 text-concreto" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate font-dp-sans text-[12.5px] text-concreto">Buscar cualquier cosa</span>
        <span className="shrink-0 rounded-md border border-filete px-1.5 py-0.5 font-dp-mono text-[9.5px] text-concreto">⌘K</span>
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[90] flex items-start justify-center bg-papel/70 pt-[13vh]"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="dp-scope w-[592px] max-w-[92vw] overflow-hidden rounded-2xl border border-tinta bg-superficie shadow-[0_30px_70px_rgba(0,0,0,0.55)]"
          >
            <div className="flex items-center gap-3 border-b border-filete px-5 py-[17px]">
              <Search size={16} strokeWidth={2} className="shrink-0 text-acento" aria-hidden="true" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar, crear, navegar o preguntar…"
                className="flex-1 border-none bg-transparent font-dp-sans text-[14.5px] text-tinta outline-none placeholder:text-concreto"
              />
              <span className="border border-filete px-1.5 py-0.5 font-dp-mono text-[9.5px] text-concreto">ESC</span>
            </div>

            <div className="max-h-[50vh] overflow-y-auto">
              {groups.map((group) => (
                <div key={group.name}>
                  <p className="px-5 pb-1 pt-3.5 font-dp-mono text-[9.5px] uppercase tracking-[0.16em] text-concreto">
                    {group.name}
                  </p>
                  {group.items.map((item) => (
                    <button
                      key={group.name + item.label}
                      type="button"
                      onClick={() => go(item.href)}
                      className="flex w-full cursor-pointer items-center gap-3.5 px-5 py-2.5 text-left transition-colors duration-100 hover:bg-realce"
                    >
                      {item.icon && <item.icon size={15} strokeWidth={1.75} className="shrink-0 text-concreto" aria-hidden="true" />}
                      <span className="flex-1 font-dp-sans text-[13.5px] text-tinta">{item.label}</span>
                    </button>
                  ))}
                </div>
              ))}
              {groups.length === 0 && (
                <p className="px-5 py-6 font-dp-sans text-[13px] text-concreto">Sin resultados para &ldquo;{query}&rdquo;.</p>
              )}
            </div>

            <div className="flex gap-[18px] border-t border-filete px-5 py-3 font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-concreto">
              <span>↑↓ navegar</span>
              <span>↵ ejecutar</span>
              <span>⌘K cerrar</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
