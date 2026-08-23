"use client";

import { Sparkles, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import AiChat from "@/app/(dashboard)/dashboard/ai/chat";

// Widget global de Archi AI (Pieza 1 del pedido "asistente flotante a
// lo largo de todo el sistema"). Reusa AiChat tal cual — es un client
// component autocontenido, sin props, que ya gestiona su propio estado
// y llama a /api/ai/chat — no hace falta duplicar ni refactorizar
// nada, solo montarlo dentro de un panel flotante.
export default function FloatingAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // /dashboard/ai ya tiene el chat como contenido principal de la
  // página — mostrar también el widget ahí duplicaría la misma
  // conversación en dos lugares a la vez.
  if (pathname?.startsWith("/dashboard/ai")) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-4">
      {open && (
        <div className="dp-card flex max-h-[70dvh] w-[380px] max-w-[calc(100vw-3rem)] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-filete px-5 py-4">
            <p className="font-dp-serif text-[17px] text-tinta">Archi AI</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar Archi AI"
              className="cursor-pointer text-concreto hover:text-tinta"
            >
              <X className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
          <div className="overflow-y-auto p-5">
            <AiChat />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Cerrar Archi AI" : "Abrir Archi AI"}
        className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-tinta bg-tinta text-papel shadow-[0_1px_2px_rgba(15,15,14,0.05),0_8px_20px_rgba(15,15,14,0.18)] transition-[transform,background-color] duration-150 hover:bg-grafito active:translate-y-px"
      >
        {open ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Sparkles className="h-5 w-5" strokeWidth={1.75} />}
      </button>
    </div>
  );
}
