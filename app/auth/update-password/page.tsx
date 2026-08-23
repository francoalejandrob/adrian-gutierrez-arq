import type { Metadata } from "next";
import { redirect } from "next/navigation";
import UpdatePasswordForm from "./update-password-form";
import { dpFontVars } from "@/lib/dp-fonts";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Nueva contraseña — ARCHI.OS",
  robots: { index: false, follow: false },
};

// No está bajo /dashboard ni /portal, así que proxy.ts no la protege —
// se verifica la sesión acá directamente. Solo se llega con una sesión
// válida si el link de recuperación de resetPasswordForEmail funcionó
// (app/auth/callback/route.ts ya intercambió el code); si no hay sesión,
// el link venció o nunca se abrió, así que se manda de vuelta al login
// correspondiente en vez de mostrar un formulario que fallaría igual.
export default async function UpdatePasswordPage(props: PageProps<"/auth/update-password">) {
  const searchParams = await props.searchParams;
  const nextParam = Array.isArray(searchParams.next) ? searchParams.next[0] : searchParams.next;
  const next = nextParam || "/dashboard";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(next.startsWith("/portal") ? "/portal/login" : "/login");
  }

  return (
    <main className={`dp-scope ${dpFontVars} flex min-h-dvh items-center justify-center bg-papel p-8 font-dp-sans text-tinta`}>
      <div className="w-full max-w-[352px] rounded-2xl border border-corte bg-superficie p-9 shadow-[6px_6px_0_0_var(--color-acento)]">
        <p className="mb-7 font-dp-mono text-[9.5px] uppercase tracking-[0.16em] text-concreto">Definir contraseña</p>
        <UpdatePasswordForm next={next} />
      </div>
    </main>
  );
}
