"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check } from "lucide-react";

// Debe vivir dentro del <form> que usa (useFormStatus lee el form
// padre). Antes un guardado exitoso no daba ninguna confirmación
// visual — si el usuario guardaba el mismo valor que ya tenía, o no
// se fijaba en el cambio, parecía que "no guardaba" aunque sí lo
// hacía. Detecta la transición pending=true→false (sin pasar por un
// error boundary, o sea que terminó bien) y muestra "Guardado" unos
// segundos.
export default function SavedIndicator() {
  const { pending } = useFormStatus();
  const wasPending = useRef(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (wasPending.current && !pending) {
      setJustSaved(true);
      const timer = setTimeout(() => setJustSaved(false), 2500);
      wasPending.current = pending;
      return () => clearTimeout(timer);
    }
    wasPending.current = pending;
  }, [pending]);

  if (!justSaved) return null;

  return (
    <span className="flex items-center gap-1.5 font-dp-mono text-[11px] text-verde">
      <Check size={13} strokeWidth={2} aria-hidden="true" />
      Guardado
    </span>
  );
}
