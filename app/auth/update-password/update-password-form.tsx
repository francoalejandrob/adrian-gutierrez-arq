"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/dashboard/ui/button";
import { inputClass, labelClass } from "@/components/dashboard/ui/styles";

type Status = "idle" | "loading" | "error";

export default function UpdatePasswordForm({ next }: { next: string }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError("");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password"));
    const confirm = String(formData.get("confirm"));

    if (password.length < 8) {
      setStatus("error");
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setStatus("error");
      setError("Las contraseñas no coinciden.");
      return;
    }

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setStatus("error");
      setError(updateError.message);
      return;
    }

    window.location.href = next;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="password" className={labelClass}>
          Contraseña nueva
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="••••••••"
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="confirm" className={labelClass}>
          Confirmar contraseña
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="••••••••"
          className={inputClass}
        />
      </div>

      {status === "error" && (
        <p role="alert" className="font-dp-sans text-[13px] text-acento">
          {error}
        </p>
      )}

      <Button type="submit" disabled={status === "loading"} size="lg" className="w-full justify-center">
        {status === "loading" ? "Guardando…" : "Guardar contraseña"}
      </Button>
    </form>
  );
}
