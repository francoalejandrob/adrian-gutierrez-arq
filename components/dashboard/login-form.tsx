"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
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
      <div className="flex items-start gap-3">
        <CheckCircle2 size={20} strokeWidth={1.75} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden="true" />
        <p className="text-sm text-carbon/70">
          Te enviamos un enlace de acceso. Revisa tu correo y ábrelo en este
          mismo navegador.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className={inputClass}
        />
      </div>

      {status === "error" && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" disabled={status === "loading"} className="w-full">
        {status !== "loading" && <Send size={15} strokeWidth={1.75} aria-hidden="true" />}
        {status === "loading" ? "Enviando…" : "Enviar enlace de acceso"}
      </Button>
    </form>
  );
}
