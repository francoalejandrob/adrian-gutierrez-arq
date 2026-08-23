"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { NAV_GROUPS } from "./nav-items";

export default function SidebarNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");

  return (
    <nav>
      {NAV_GROUPS.map((group, i) => (
        <div key={i}>
          {group.label && (
            <p className="mx-5 mb-[9px] mt-[22px] border-b border-filete pb-[7px] font-dp-mono text-[9.5px] font-medium uppercase tracking-[0.16em] text-concreto">
              {group.label}
            </p>
          )}
          {group.items.map((item) => {
            const active = item.match(pathname, tab);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`mx-2 flex items-center gap-[11px] rounded-lg px-3 py-[7px] font-dp-sans text-[13px] transition-colors duration-150 ${
                  active ? "bg-realce font-medium text-tinta" : "text-grafito hover:bg-realce hover:text-tinta"
                }`}
              >
                <Icon size={16} strokeWidth={1.75} className={`shrink-0 ${active ? "text-acento" : "text-concreto"}`} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
