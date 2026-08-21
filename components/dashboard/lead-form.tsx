import type { Lead } from "@/lib/supabase/types";

export default function LeadForm({
  action,
  defaultValues,
}: {
  action: (formData: FormData) => void;
  defaultValues?: Partial<Lead>;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Nombre" name="name" defaultValue={defaultValues?.name} required />
      <Field
        label="Email"
        name="email"
        type="email"
        defaultValue={defaultValues?.email}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Teléfono" name="phone" defaultValue={defaultValues?.phone ?? ""} />
        <Field
          label="Ciudad y país"
          name="location"
          defaultValue={defaultValues?.location ?? ""}
        />
      </div>
      <Field label="¿Qué necesita?" name="need" defaultValue={defaultValues?.need ?? ""} />
      <Field
        label="Valor estimado"
        name="estimated_value"
        type="number"
        step="0.01"
        defaultValue={defaultValues?.estimated_value ?? ""}
      />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-xs uppercase tracking-wide text-carbon/60">
          Mensaje
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          defaultValue={defaultValues?.message ?? ""}
          className="border border-carbon/20 bg-white px-3 py-2 text-sm outline-none focus:border-carbon"
        />
      </div>

      <button
        type="submit"
        className="w-fit cursor-pointer bg-carbon px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        Guardar
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  step?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={name} className="text-xs uppercase tracking-wide text-carbon/60">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="border border-carbon/20 bg-white px-3 py-2 text-sm outline-none focus:border-carbon"
      />
    </div>
  );
}
