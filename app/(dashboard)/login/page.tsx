import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/dashboard/login-form";
import LoginVideoBackground from "@/components/dashboard/login-video-background";
import { dpFontVars } from "@/lib/dp-fonts";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ingresar — ARCHI.OS",
  robots: { index: false, follow: false },
};

const currency = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  const [{ count: projectCount }, { count: clientCount }, { data: contracts }] = await Promise.all([
    supabase.from("projects").select("*", { count: "exact", head: true }),
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase.from("contracts").select("value"),
  ]);
  const contracted = (contracts ?? []).reduce((sum, c) => sum + c.value, 0);

  return (
    <main className={`dp-scope ${dpFontVars} dp-grain-strong relative min-h-dvh overflow-hidden font-dp-sans text-tinta`}>
      <LoginVideoBackground />

      <div className="relative z-10 grid min-h-dvh grid-cols-1 md:grid-cols-2">
        <div className="hidden flex-col justify-between p-16 md:flex">
          <p className="font-dp-mono text-[10px] uppercase tracking-[0.18em] text-grafito">ARCHI.OS &nbsp;·&nbsp; v2.0</p>
          <div>
            <h1 className="mb-6 max-w-[18ch] font-dp-serif text-[52px] leading-none tracking-[-0.025em] text-tinta">
              El estudio como sistema.
            </h1>
            <p className="max-w-[40ch] font-dp-serif text-xl italic leading-relaxed text-grafito">
              Comercial, producción, documentación y finanzas en una sola lámina de trabajo.
            </p>
          </div>
          <div className="flex gap-11">
            <Stat value={String(projectCount ?? 0).padStart(2, "0")} label="Proyectos" />
            <Stat value={`$${currency.format(contracted)}`} label="Contratado" tone="positive" />
            <Stat value={String(clientCount ?? 0)} label="Clientes" />
          </div>
        </div>

        <div className="flex items-center justify-center p-16">
          <div className="w-full max-w-[352px] rounded-2xl border border-corte bg-superficie p-9 shadow-[6px_6px_0_0_var(--color-acento)]">
            <p className="mb-7 font-dp-mono text-[9.5px] uppercase tracking-[0.16em] text-concreto">Acceso al estudio</p>
            <LoginForm />
          </div>
        </div>
      </div>
    </main>
  );
}

function Stat({ value, label, tone }: { value: string; label: string; tone?: "positive" }) {
  return (
    <div>
      <p className={`font-dp-mono text-2xl ${tone === "positive" ? "text-verde" : "text-tinta"}`}>{value}</p>
      <p className="mt-2.5 font-dp-mono text-[9.5px] uppercase tracking-[0.14em] text-grafito">{label}</p>
    </div>
  );
}
