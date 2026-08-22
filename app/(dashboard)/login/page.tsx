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

  const { data: org } = await supabase.from("organizations").select("name").limit(1).maybeSingle();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-hueso px-6">
      <div className="w-full max-w-[380px]">
        <p className="text-center font-display text-[22px] font-semibold text-carbon">ARCHI.OS</p>
        <p className="mb-10 text-center text-[13px] text-carbon/50">
          {org?.name ?? "Adrián Gutiérrez Arquitectura"}
        </p>
        <div className="rounded-[10px] border border-carbon/[0.08] bg-white p-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
