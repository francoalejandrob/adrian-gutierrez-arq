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
            <p className="mx-5 mb-[9px] mt-[22px] border-b border-filete pb-[7px] font-dp-mono text-[9.5px] font-medium uppercase tracking-[0.16em] text-[#6E6A60]">
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
                className={`flex w-full items-center gap-[11px] border-l-2 py-[7px] pl-[18px] pr-5 font-dp-sans text-[13px] transition-colors duration-150 ${
                  active
                    ? "border-tinta bg-[#EDEBE4] font-medium text-tinta"
                    : "border-transparent text-grafito hover:bg-[#EDEBE4] hover:text-tinta"
                }`}
              >
                <Icon size={16} strokeWidth={1.75} className={`shrink-0 ${active ? "text-acento" : "text-[#6E6A60]"}`} aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
