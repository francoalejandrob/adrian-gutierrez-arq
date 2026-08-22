"use client";

import { usePathname } from "next/navigation";
import { crumbFor } from "./nav-items";
import CommandPalette from "./command-palette";

export default function SheetHeader({ dateLabel, showCommandPalette = true }: { dateLabel: string; showCommandPalette?: boolean }) {
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
        <div className="flex min-w-0 flex-1 items-center justify-end gap-3.5">
          {showCommandPalette && <CommandPalette />}
          <span className="shrink-0 font-dp-mono text-[10.5px] uppercase tracking-[0.1em] text-concreto">{dateLabel}</span>
        </div>
      </div>
    </div>
  );
}
