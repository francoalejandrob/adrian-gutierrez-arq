"use client";

import { useRef, useState, useTransition } from "react";
import { inputClass } from "@/components/dashboard/ui/styles";

// Mismo patrón de auto-submit-on-change que status-select.tsx — cambiar
// cualquiera de las dos fechas guarda solo, sin un botón "Guardar"
// aparte. Es la pieza que le faltaba a una fase ya creada: antes solo
// se podían fijar fechas al momento de crearla.
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
        onChange={(e) => {
          setStartDate(e.target.value);
          submit();
        }}
        className={`${inputClass} ${isPending ? "opacity-60" : ""}`}
      />
      <span className="font-dp-mono text-[10.5px] text-concreto">→</span>
      <input
        type="date"
        name="end_date"
        value={endDate}
        disabled={isPending}
        onChange={(e) => {
          setEndDate(e.target.value);
          submit();
        }}
        className={`${inputClass} ${isPending ? "opacity-60" : ""}`}
      />
    </form>
  );
}
