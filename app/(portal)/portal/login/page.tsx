import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/dashboard/login-form";
import LoginVideoBackground from "@/components/dashboard/login-video-background";
import { dpFontVars } from "@/lib/dp-fonts";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Portal de cliente — ARCHI.OS",
  robots: { index: false, follow: false },
};

export default async function PortalLoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/portal");
  }

  const { data: org } = await supabase.from("organizations").select("name").limit(1).maybeSingle();

  return (
    <main className={`dp-scope ${dpFontVars} dp-grain-strong relative min-h-dvh overflow-hidden font-dp-sans text-tinta`}>
      <LoginVideoBackground />

      <div className="relative z-10 grid min-h-dvh grid-cols-1 md:grid-cols-2">
        <div className="hidden flex-col justify-between p-16 md:flex">
          <p className="font-dp-mono text-[10px] uppercase tracking-[0.18em] text-grafito">ARCHI.OS &nbsp;·&nbsp; Portal de cliente</p>
          <div>
            <h1 className="mb-6 max-w-[16ch] font-dp-serif text-[52px] leading-none tracking-[-0.025em] text-tinta">
              Tu proyecto, siempre a la vista.
            </h1>
            <p className="max-w-[40ch] font-dp-serif text-xl italic leading-relaxed text-grafito">
              Avance, documentos, aprobaciones y pagos — en un solo lugar.
            </p>
          </div>
          <p className="font-dp-mono text-[10px] uppercase tracking-[0.14em] text-concreto">
            {org?.name ?? "Adrián Gutiérrez Arquitectura"}
          </p>
        </div>

        <div className="flex items-center justify-center p-16">
          <LoginForm next="/portal" title="Acceso de cliente" />
        </div>
      </div>
    </main>
  );
}
