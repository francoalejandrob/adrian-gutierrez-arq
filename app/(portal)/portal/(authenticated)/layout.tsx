import type { Metadata } from "next";
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
    <div className="min-h-dvh bg-hueso">
      <div className="mx-auto max-w-[520px] px-6 pb-24 pt-10">
        <div className="mb-10 flex items-center justify-between">
          <p className="font-display text-base font-semibold text-carbon">{org?.name ?? "Adrián Gutiérrez Arq."}</p>
          <form action={portalSignOut}>
            <button type="submit" className="cursor-pointer text-xs text-carbon/40 transition-colors duration-150 hover:text-carbon">
              Salir
            </button>
          </form>
        </div>
        {children}
      </div>
    </div>
  );
}
