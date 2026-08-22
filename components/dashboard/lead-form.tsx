import SubmitButton from "@/components/dashboard/ui/submit-button";
import { TextField, TextareaField } from "@/components/dashboard/ui/field";
import { labelClass, selectClass } from "@/components/dashboard/ui/styles";
import type { Lead } from "@/lib/supabase/types";

export default function LeadForm({
  action,
  defaultValues,
  members = [],
}: {
  action: (formData: FormData) => void;
  defaultValues?: Partial<Lead>;
  members?: { id: string; name: string }[];
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      <TextField label="Nombre" name="name" defaultValue={defaultValues?.name} required />
      <TextField
        label="Email"
        name="email"
        type="email"
        defaultValue={defaultValues?.email}
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Teléfono" name="phone" defaultValue={defaultValues?.phone ?? ""} />
        <TextField
          label="Ciudad y país"
          name="location"
          defaultValue={defaultValues?.location ?? ""}
        />
      </div>
      <TextField label="¿Qué necesita?" name="need" defaultValue={defaultValues?.need ?? ""} />
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Valor estimado"
          name="estimated_value"
          type="number"
          step="0.01"
          defaultValue={defaultValues?.estimated_value ?? ""}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="assigned_to" className={labelClass}>
            Asignado a
          </label>
          <select id="assigned_to" name="assigned_to" defaultValue={defaultValues?.assigned_to ?? ""} className={selectClass}>
            <option value="">Sin asignar</option>
            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <TextareaField
        label="Mensaje"
        name="message"
        rows={4}
        defaultValue={defaultValues?.message ?? ""}
      />

      <SubmitButton size="lg" pendingLabel="Guardando…" className="w-fit">
        Guardar
      </SubmitButton>
    </form>
  );
}
