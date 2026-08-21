import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/components/dashboard/login-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Ingresar — ARCHI.OS",
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-hueso px-6">
      <div className="w-full max-w-sm border border-carbon/10 bg-white p-8">
        <h1 className="font-display text-2xl text-carbon">ARCHI.OS</h1>
        <p className="mt-1 mb-6 text-sm text-carbon/60">
          Acceso al panel de Adrián Gutiérrez Arquitectura.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
