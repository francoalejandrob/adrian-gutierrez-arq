"use client";

import { useRef } from "react";

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

  return (
    <form ref={formRef} action={action} className="flex items-center gap-3">
      <label htmlFor="status" className="text-xs uppercase tracking-wide text-carbon/60">
        Estado
      </label>
      <select
        id="status"
        name="status"
        defaultValue={defaultValue}
        onChange={() => formRef.current?.requestSubmit()}
        className="cursor-pointer border border-carbon/20 bg-white px-3 py-2 text-sm outline-none focus:border-carbon"
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
