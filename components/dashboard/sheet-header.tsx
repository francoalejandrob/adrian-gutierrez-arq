"use client";

import Link from "next/link";
import { Bell, Menu, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { crumbFor } from "./nav-items";
import CommandPalette from "./command-palette";
import { useSidebar } from "./sidebar-context";

export default function SheetHeader({
  dateLabel,
  unreadCount = 0,
  showCommandPalette = true,
}: {
  dateLabel: string;
  unreadCount?: number;
  showCommandPalette?: boolean;
}) {
  const pathname = usePathname();
  const { toggle } = useSidebar();

  return (
    <div className="dp-grain relative z-40 flex h-[53px] shrink-0 items-stretch border-b border-corte">
      <div className="flex w-auto shrink-0 items-center gap-2.5 border-r border-filete px-4 md:w-[225px] md:px-5">
        <button
          type="button"
          onClick={toggle}
          aria-label="Abrir menú"
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-concreto transition-colors duration-150 hover:bg-realce hover:text-tinta md:hidden"
        >
          <Menu size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
        <span className="relative h-[15px] w-[15px] shrink-0 border-[1.5px] border-tinta">
          <span className="absolute inset-[3px] block bg-tinta" />
        </span>
        <span className="font-dp-sans text-sm font-medium tracking-[0.1em] text-tinta">ARCHI.OS</span>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-5 overflow-hidden px-[22px]">
        <div className="hidden shrink-0 items-center gap-2.5 font-dp-mono text-[10.5px] uppercase tracking-[0.13em] text-concreto sm:flex">
          <span>Estudio</span>
          <span className="text-concreto">/</span>
          <span className="text-tinta">{crumbFor(pathname)}</span>
        </div>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-4">
          {showCommandPalette && <CommandPalette />}
          <Link
            href="/dashboard/notifications"
            title="Notificaciones"
            className="relative flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-full text-concreto transition-colors duration-150 hover:bg-realce hover:text-tinta"
          >
            <Bell size={16} strokeWidth={1.75} aria-hidden="true" />
            {unreadCount > 0 && <span className="absolute right-1 top-1 h-[6px] w-[6px] rounded-full bg-acento" />}
          </Link>
          <Link
            href="/dashboard/settings"
            title="Configuración"
            className="flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-full text-concreto transition-colors duration-150 hover:bg-realce hover:text-tinta"
          >
            <Settings size={16} strokeWidth={1.75} aria-hidden="true" />
          </Link>
          <span className="hidden shrink-0 font-dp-mono text-[10.5px] uppercase tracking-[0.1em] text-concreto sm:inline">{dateLabel}</span>
        </div>
      </div>
    </div>
  );
}
