import SubmitButton from "@/components/dashboard/ui/submit-button";
import { TextField, TextareaField } from "@/components/dashboard/ui/field";
import { labelClass, selectClass } from "@/components/dashboard/ui/styles";
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
        <label htmlFor="client_id" className={labelClass}>
          Cliente
        </label>
        <select
          id="client_id"
          name="client_id"
          required
          defaultValue={defaultValues?.client_id ?? ""}
          className={selectClass}
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

      <TextField label="Nombre del proyecto" name="name" defaultValue={defaultValues?.name} required />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="category" className={labelClass}>
            Categoría
          </label>
          <select
            id="category"
            name="category"
            defaultValue={defaultValues?.category ?? ""}
            className={selectClass}
          >
            <option value="">Sin especificar</option>
            {PROJECT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <TextField label="Ubicación" name="location" defaultValue={defaultValues?.location ?? ""} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Presupuesto"
          name="budget"
          type="number"
          step="0.01"
          defaultValue={defaultValues?.budget ?? ""}
        />
        <TextField
          label="Valor contratado"
          name="contracted_value"
          type="number"
          step="0.01"
          defaultValue={defaultValues?.contracted_value ?? ""}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Fecha de inicio"
          name="start_date"
          type="date"
          defaultValue={defaultValues?.start_date ?? ""}
        />
        <TextField
          label="Entrega estimada"
          name="estimated_end_date"
          type="date"
          defaultValue={defaultValues?.estimated_end_date ?? ""}
        />
      </div>

      {defaultValues?.id && (
        <div className="grid grid-cols-2 gap-4">
          <TextField
            label="Entrega real"
            name="actual_end_date"
            type="date"
            defaultValue={defaultValues?.actual_end_date ?? ""}
          />
          <TextField
            label="Progreso (%)"
            name="progress"
            type="number"
            min="0"
            max="100"
            defaultValue={defaultValues?.progress ?? 0}
          />
        </div>
      )}

      <TextareaField
        label="Descripción"
        name="description"
        rows={3}
        defaultValue={defaultValues?.description ?? ""}
      />

      <SubmitButton size="lg" pendingLabel="Guardando…" className="w-fit">
        Guardar
      </SubmitButton>
    </form>
  );
}
