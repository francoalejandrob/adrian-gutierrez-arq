"use client";

import { useRef, useState, useTransition } from "react";
import { inputClass } from "@/components/dashboard/ui/styles";

// Guarda al salir del campo (blur), no en cada onChange — un <input
// type="date"> dispara onChange en interacciones intermedias (navegar
// de mes dentro del selector nativo, ajustar un segmento con las
// flechitas) antes de que el usuario termine de elegir la fecha que
// quiere. Guardar en esos onChange intermedios deshabilitaba el campo
// a mitad de la interacción — al tocar la flechita para cambiar de
// mes, el guardado se disparaba con el mismo día de antes y el campo
// se bloqueaba, sin dejar terminar de elegir el día real. onChange
// solo actualiza el estado local (el input sigue respondiendo mientras
// se interactúa); recién blur dispara el guardado real.
export default function PhaseDateInputs({
  action,
  defaultStartDate,
  defaultEndDate,
}: {
  action: (formData: FormData) => void;
  defaultStartDate: string | null;
  defaultEndDate: string | null;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [startDate, setStartDate] = useState(defaultStartDate ?? "");
  const [endDate, setEndDate] = useState(defaultEndDate ?? "");

  function submit() {
    startTransition(() => formRef.current?.requestSubmit());
  }

  return (
    <form ref={formRef} action={action} className="flex items-center gap-2">
      <input
        type="date"
        name="start_date"
        value={startDate}
        disabled={isPending}
        onChange={(e) => setStartDate(e.target.value)}
        onBlur={submit}
        className={`${inputClass} ${isPending ? "opacity-60" : ""}`}
      />
      <span className="font-dp-mono text-[10.5px] text-concreto">→</span>
      <input
        type="date"
        name="end_date"
        value={endDate}
        disabled={isPending}
        onChange={(e) => setEndDate(e.target.value)}
        onBlur={submit}
        className={`${inputClass} ${isPending ? "opacity-60" : ""}`}
      />
    </form>
  );
}
