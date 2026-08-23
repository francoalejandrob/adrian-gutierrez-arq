"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "loading" | "error";
type Mode = "login" | "reset";

// Tarjeta de vidrio con labels flotantes con ícono — diseño adaptado de
// una referencia que trajo el usuario, pero solo la parte visual: se
// dejó afuera el botón "Sign in with Google" (no hay OAuth de Google
// configurado acá, sería decorativo) y el link "¿No tenés cuenta?"
// (este sistema no tiene auto-registro — es justo lo que se reforzó en
// el pase anterior de auth). La lógica real (email+contraseña,
// recuperación) es la misma de siempre, con los tokens de color del
// sistema en vez de los genéricos de la referencia (azul/blanco).
//
// "¿Olvidaste tu contraseña?" es el único lugar que sigue mandando un
// correo — un link de recuperación de Supabase, reusando
// app/auth/callback/route.ts (agnóstico al método de auth) y aterrizando
// en app/auth/update-password. Compartido entre dashboard
// (next="/dashboard") y portal (next="/portal") como ya era antes.
export default function LoginForm({ next = "/dashboard", title }: { next?: string; title?: string }) {
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

  return (
    <div className="w-full max-w-sm rounded-2xl border border-tinta/15 bg-superficie/60 p-8 shadow-2xl backdrop-blur-xl">
      {title && <p className="mb-7 text-center font-dp-mono text-[9.5px] uppercase tracking-[0.16em] text-concreto">{title}</p>}

      {resetSent ? (
        <div className="border-l-2 border-tinta pl-4">
          <p className="font-dp-sans text-sm leading-relaxed text-grafito">
            Te enviamos un enlace para definir tu contraseña. Revisa tu correo y ábrelo en este mismo navegador.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="relative z-0">
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder=" "
              className="peer block w-full appearance-none border-0 border-b-2 border-filete bg-transparent px-0 py-2.5 font-dp-sans text-sm text-tinta focus:border-acento focus:outline-none focus:ring-0"
            />
            <label
              htmlFor="email"
              className="absolute top-3 origin-[0] -translate-y-6 scale-75 transform font-dp-sans text-sm text-concreto duration-200 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-acento"
            >
              <Mail className="-mt-1 mr-1.5 inline-block" size={14} strokeWidth={1.75} aria-hidden="true" />
              Correo
            </label>
          </div>

          {mode === "login" && (
            <div className="relative z-0">
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder=" "
                className="peer block w-full appearance-none border-0 border-b-2 border-filete bg-transparent px-0 py-2.5 font-dp-sans text-sm text-tinta focus:border-acento focus:outline-none focus:ring-0"
              />
              <label
                htmlFor="password"
                className="absolute top-3 origin-[0] -translate-y-6 scale-75 transform font-dp-sans text-sm text-concreto duration-200 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-acento"
              >
                <Lock className="-mt-1 mr-1.5 inline-block" size={14} strokeWidth={1.75} aria-hidden="true" />
                Contraseña
              </label>
            </div>
          )}

          {status === "error" && (
            <p role="alert" className="-mt-4 font-dp-sans text-[13px] text-acento">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-tinta bg-tinta py-3 font-dp-mono text-[11px] font-medium uppercase tracking-[0.12em] text-papel transition-colors duration-150 hover:bg-grafito disabled:pointer-events-none disabled:opacity-50"
          >
            {status === "loading" ? (mode === "login" ? "Entrando…" : "Enviando…") : mode === "login" ? "Entrar" : "Enviar enlace"}
            {status !== "loading" && (
              <ArrowRight size={14} strokeWidth={1.75} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "reset" : "login");
              setStatus("idle");
              setError("");
            }}
            className="-mt-4 cursor-pointer text-center font-dp-sans text-[12px] text-concreto hover:text-tinta"
          >
            {mode === "login" ? "¿Olvidaste tu contraseña?" : "Volver a iniciar sesión"}
          </button>
        </form>
      )}
    </div>
  );
}
