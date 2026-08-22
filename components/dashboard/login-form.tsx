"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/dashboard/ui/button";
import { inputClass, labelClass } from "@/components/dashboard/ui/styles";

type Status = "idle" | "loading" | "sent" | "error";

export default function LoginForm({ next = "/dashboard" }: { next?: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    const email = new FormData(event.currentTarget).get("email");
    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: String(email),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (signInError) {
      setStatus("error");
      setError(signInError.message);
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="border-l-2 border-tinta pl-4">
        <p className="font-dp-sans text-sm leading-relaxed text-grafito">
          Te enviamos un enlace de acceso. Revisa tu correo y ábrelo en este
          mismo navegador.
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

      {status === "error" && (
        <p role="alert" className="font-dp-sans text-[13px] text-acento">
          {error}
        </p>
      )}

      <Button type="submit" disabled={status === "loading"} size="lg" className="w-full justify-center">
        {status === "loading" ? "Enviando…" : "Enviar enlace de acceso"}
      </Button>

      <p className="text-center font-dp-sans text-[12px] leading-relaxed text-concreto">
        Sin contraseñas. Enviamos un enlace de un solo uso válido por 15 minutos.
      </p>
    </form>
  );
}
