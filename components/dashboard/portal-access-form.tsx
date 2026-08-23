"use client";

import { useActionState } from "react";
import type { PortalInviteState } from "@/app/(dashboard)/dashboard/projects/[id]/actions";
import SubmitButton from "@/components/dashboard/ui/submit-button";
import { inputClass } from "@/components/dashboard/ui/styles";

// Crea o restablece la cuenta real del portal para un email (ver
// invitePortalAccess) — la contraseña generada solo existe en la
// respuesta de esta acción, así que necesita useActionState (no un
// <form action> plano) para mostrarla una vez y nunca más.
export default function PortalAccessForm({
  action,
  defaultEmail,
}: {
  action: (prevState: PortalInviteState, formData: FormData) => Promise<PortalInviteState>;
  defaultEmail: string;
}) {
  const [state, formAction] = useActionState(action, null);

  return (
    <div className="mt-4">
      {state && "password" in state && (
        <div className="mb-4 rounded-lg border border-verde/30 bg-verde/6 p-4">
          <p className="font-dp-sans text-[12.5px] text-grafito">
            Contraseña inicial para <span className="font-dp-mono text-tinta">{state.email}</span>:
          </p>
          <p className="mt-1.5 select-all font-dp-mono text-[15px] text-tinta">{state.password}</p>
          <p className="mt-2 font-dp-sans text-[11.5px] text-concreto">
            Cópiala ahora y entrégasela al cliente — no se va a volver a mostrar.
          </p>
        </div>
      )}
      {state && "error" in state && (
        <p role="alert" className="mb-3 font-dp-sans text-[13px] text-acento">
          {state.error}
        </p>
      )}
      <form action={formAction} className="flex gap-2.5">
        <input
          name="email"
          type="email"
          required
          defaultValue={defaultEmail}
          placeholder="email@cliente.com"
          className={`flex-1 ${inputClass}`}
        />
        <SubmitButton variant="secondary" pendingLabel="Creando…">
          Crear acceso
        </SubmitButton>
      </form>
    </div>
  );
}
