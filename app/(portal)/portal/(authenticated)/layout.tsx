import type { Metadata } from "next";
import { LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { dpFontVars } from "@/lib/dp-fonts";
import { createClient } from "@/lib/supabase/server";
import { portalSignOut } from "../auth-actions";

export const metadata: Metadata = {
  title: "Portal de cliente — ARCHI.OS",
  robots: { index: false, follow: false },
};

export default async function PortalAuthenticatedLayout({ children }: LayoutProps<"/portal">) {
  const supabase = await createClient();
  const { data: org } = await supabase.from("organizations").select("name").limit(1).maybeSingle();

  return (
    <div className={`dp-scope ${dpFontVars} min-h-dvh bg-papel font-dp-sans text-tinta`}>
      <div className="dp-grain sticky top-0 z-40 flex h-[53px] items-center justify-between border-b border-corte px-6">
        <p className="font-dp-sans text-sm font-medium tracking-[0.02em] text-tinta">{org?.name ?? "Adrián Gutiérrez Arq."}</p>
        <div className="flex items-center gap-5">
          <Link
            href="/portal/account"
            className="flex items-center gap-1.5 font-dp-mono text-[10px] uppercase tracking-[0.1em] text-concreto transition-colors duration-150 hover:text-tinta"
          >
            <UserRound size={13} strokeWidth={1.75} aria-hidden="true" />
            Cuenta
          </Link>
          <form action={portalSignOut}>
            <button
              type="submit"
              className="flex cursor-pointer items-center gap-1.5 font-dp-mono text-[10px] uppercase tracking-[0.1em] text-concreto transition-colors duration-150 hover:text-acento"
            >
              <LogOut size={13} strokeWidth={1.75} aria-hidden="true" />
              Salir
            </button>
          </form>
        </div>
      </div>
      <div className="mx-auto max-w-[560px] px-6 pb-24 pt-10">{children}</div>
    </div>
  );
}
