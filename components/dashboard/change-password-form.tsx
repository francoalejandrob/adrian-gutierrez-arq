"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/dashboard/ui/button";
import { inputClass, labelClass } from "@/components/dashboard/ui/styles";

type Status = "idle" | "loading" | "success" | "error";

// Compartido entre /dashboard/settings y el portal de cliente — el
// usuario ya tiene una sesión válida en ambos casos, así que
// updateUser({password}) con el cliente de sesión (no admin) alcanza;
// no hace falta re-pedir la contraseña actual (Supabase no lo exige
// para un usuario ya autenticado).
export default function ChangePasswordForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("loading");
    setError("");

    const formData = new FormData(form);
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

    setStatus("success");
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
      {status === "success" && <p className="font-dp-sans text-[13px] text-verde">Contraseña actualizada.</p>}

      <Button type="submit" disabled={status === "loading"} size="md" className="w-fit">
        {status === "loading" ? "Guardando…" : "Cambiar contraseña"}
      </Button>
    </form>
  );
}
