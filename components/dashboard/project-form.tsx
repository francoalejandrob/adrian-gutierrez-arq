import { PROJECT_CATEGORIES } from "@/lib/supabase/types";
import type { Project } from "@/lib/supabase/types";

export default function ProjectForm({
  action,
  clients,
  defaultValues,
}: {
  action: (formData: FormData) => void;
  clients: { id: string; name: string }[];
  defaultValues?: Partial<Project>;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="client_id" className="text-xs uppercase tracking-wide text-carbon/60">
          Cliente
        </label>
        <select
          id="client_id"
          name="client_id"
          required
          defaultValue={defaultValues?.client_id ?? ""}
          className="cursor-pointer border border-carbon/20 bg-white px-3 py-2 text-sm outline-none focus:border-carbon"
        >
          <option value="" disabled>
            Selecciona un cliente
          </option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      <Field label="Nombre del proyecto" name="name" defaultValue={defaultValues?.name} required />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className="text-xs uppercase tracking-wide text-carbon/60">
            Categoría
          </label>
          <select
            id="category"
            name="category"
            defaultValue={defaultValues?.category ?? ""}
            className="cursor-pointer border border-carbon/20 bg-white px-3 py-2 text-sm outline-none focus:border-carbon"
          >
            <option value="">Sin especificar</option>
            {PROJECT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <Field label="Ubicación" name="location" defaultValue={defaultValues?.location ?? ""} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Presupuesto"
          name="budget"
          type="number"
          step="0.01"
          defaultValue={defaultValues?.budget ?? ""}
        />
        <Field
          label="Valor contratado"
          name="contracted_value"
          type="number"
          step="0.01"
          defaultValue={defaultValues?.contracted_value ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Fecha de inicio"
          name="start_date"
          type="date"
          defaultValue={defaultValues?.start_date ?? ""}
        />
        <Field
          label="Entrega estimada"
          name="estimated_end_date"
          type="date"
          defaultValue={defaultValues?.estimated_end_date ?? ""}
        />
      </div>

      {defaultValues?.id && (
        <div className="grid grid-cols-2 gap-4">
          <Field
            label="Entrega real"
            name="actual_end_date"
            type="date"
            defaultValue={defaultValues?.actual_end_date ?? ""}
          />
          <Field
            label="Progreso (%)"
            name="progress"
            type="number"
            min="0"
            max="100"
            defaultValue={defaultValues?.progress ?? 0}
          />
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="description" className="text-xs uppercase tracking-wide text-carbon/60">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ""}
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
  min,
  max,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  step?: string;
  min?: string;
  max?: string;
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
        min={min}
        max={max}
        required={required}
        defaultValue={defaultValue ?? ""}
        className="border border-carbon/20 bg-white px-3 py-2 text-sm outline-none focus:border-carbon"
      />
    </div>
  );
}
