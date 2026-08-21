import type { Client } from "@/lib/supabase/types";

export default function ClientForm({
  action,
  defaultValues,
}: {
  action: (formData: FormData) => void;
  defaultValues?: Partial<Client>;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Nombre" name="name" defaultValue={defaultValues?.name} required />
      <div className="grid grid-cols-2 gap-4">
        <Field label="Email" name="email" type="email" defaultValue={defaultValues?.email ?? ""} />
        <Field label="Teléfono" name="phone" defaultValue={defaultValues?.phone ?? ""} />
      </div>
      <Field label="Empresa" name="company" defaultValue={defaultValues?.company ?? ""} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="notes" className="text-xs uppercase tracking-wide text-carbon/60">
          Notas
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={defaultValues?.notes ?? ""}
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
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | null;
  required?: boolean;
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
        required={required}
        defaultValue={defaultValue ?? ""}
        className="border border-carbon/20 bg-white px-3 py-2 text-sm outline-none focus:border-carbon"
      />
    </div>
  );
}
