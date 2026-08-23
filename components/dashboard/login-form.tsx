"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/dashboard/ui/button";
import { inputClass, labelClass } from "@/components/dashboard/ui/styles";

type Status = "idle" | "loading" | "error";
type Mode = "login" | "reset";

// Email+contraseña (pedido explícito del usuario: nada de enlace por
// correo en cada login). "¿Olvidaste tu contraseña?" es el único lugar
// que sigue mandando un correo — un link de recuperación de Supabase,
// reusando app/auth/callback/route.ts (agnóstico al método de auth) y
// aterrizando en app/auth/update-password. Compartido entre dashboard
// (next="/dashboard") y portal (next="/portal") como ya era antes.
export default function LoginForm({ next = "/dashboard" }: { next?: string }) {
  const [mode, setMode] = useState<Mode>("login");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const supabase = createClient();

    if (mode === "reset") {
      const updatePasswordNext = `/auth/update-password?next=${encodeURIComponent(next)}`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(updatePasswordNext)}`,
      });
      if (resetError) {
        setStatus("error");
        setError(resetError.message);
        return;
      }
      setResetSent(true);
      setStatus("idle");
      return;
    }

    const password = String(formData.get("password"));
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setStatus("error");
      setError(signInError.message === "Invalid login credentials" ? "Email o contraseña incorrectos." : signInError.message);
      return;
    }

    // Recarga completa (no router.push) para que el servidor reciba la
    // cookie de sesión recién creada antes de renderizar /dashboard o /portal.
    window.location.href = next;
  }

  if (resetSent) {
    return (
      <div className="border-l-2 border-tinta pl-4">
        <p className="font-dp-sans text-sm leading-relaxed text-grafito">
          Te enviamos un enlace para definir tu contraseña. Revisa tu correo y ábrelo en este mismo navegador.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="email" className={labelClass}>
          Correo
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="tu@estudio.com"
          className={inputClass}
        />
      </div>

      {mode === "login" && (
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className={labelClass}>
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className={inputClass}
          />
        </div>
      )}

      {status === "error" && (
        <p role="alert" className="font-dp-sans text-[13px] text-acento">
          {error}
        </p>
      )}

      <Button type="submit" disabled={status === "loading"} size="lg" className="w-full justify-center">
        {status === "loading" ? (mode === "login" ? "Entrando…" : "Enviando…") : mode === "login" ? "Entrar" : "Enviar enlace"}
      </Button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "login" ? "reset" : "login");
          setStatus("idle");
          setError("");
        }}
        className="cursor-pointer text-center font-dp-sans text-[12px] text-concreto hover:text-tinta"
      >
        {mode === "login" ? "¿Olvidaste tu contraseña?" : "Volver a iniciar sesión"}
      </button>
    </form>
  );
}
