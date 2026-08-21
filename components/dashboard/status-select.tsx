"use client";

import { useRef, useState, useTransition } from "react";
import { selectClass } from "@/components/dashboard/ui/styles";

export default function StatusSelect({
  action,
  defaultValue,
  options,
}: {
  action: (formData: FormData) => void;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue);

  return (
    <form ref={formRef} action={action} className="flex items-center gap-3">
      <label htmlFor="status" className="text-xs uppercase tracking-wide text-carbon/60">
        Estado
      </label>
      <select
        id="status"
        name="status"
        value={value}
        disabled={isPending}
        onChange={(e) => {
          setValue(e.target.value);
          startTransition(() => formRef.current?.requestSubmit());
        }}
        className={`${selectClass} ${isPending ? "opacity-60" : ""}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </form>
  );
}
