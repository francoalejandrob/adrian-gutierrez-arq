"use client";

import Link from "next/link";
import { Bell, Settings } from "lucide-react";
import { usePathname } from "next/navigation";
import { crumbFor } from "./nav-items";
import CommandPalette from "./command-palette";

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

  return (
    <div className="dp-grain sticky top-0 z-40 flex h-[53px] items-stretch border-b border-corte">
      <div className="flex w-[225px] shrink-0 items-center gap-2.5 border-r border-filete px-5">
        <span className="relative h-[15px] w-[15px] shrink-0 border-[1.5px] border-tinta">
          <span className="absolute inset-[3px] block bg-tinta" />
        </span>
        <span className="font-dp-sans text-sm font-medium tracking-[0.1em] text-tinta">ARCHI.OS</span>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-between gap-5 overflow-hidden px-[22px]">
        <div className="flex shrink-0 items-center gap-2.5 font-dp-mono text-[10.5px] uppercase tracking-[0.13em] text-concreto">
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
          <span className="shrink-0 font-dp-mono text-[10.5px] uppercase tracking-[0.1em] text-concreto">{dateLabel}</span>
        </div>
      </div>
    </div>
  );
}
