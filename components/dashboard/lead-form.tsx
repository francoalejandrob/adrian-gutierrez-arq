import SubmitButton from "@/components/dashboard/ui/submit-button";
import { TextField, TextareaField } from "@/components/dashboard/ui/field";
import { labelClass, selectClass } from "@/components/dashboard/ui/styles";
import {
  HAS_LAND_LABELS,
  HAS_LAND_OPTIONS,
  LEAD_TIMELINE,
  LEAD_TIMELINE_LABELS,
  PROJECT_CATEGORIES,
  type Lead,
} from "@/lib/supabase/types";

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
        <div className="flex flex-col gap-1.5">
          <label htmlFor="project_type" className={labelClass}>
            Tipo de proyecto
          </label>
          <select id="project_type" name="project_type" defaultValue={defaultValues?.project_type ?? ""} className={selectClass}>
            <option value="">Sin especificar</option>
            {PROJECT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="has_land" className={labelClass}>
            ¿Tiene el terreno?
          </label>
          <select id="has_land" name="has_land" defaultValue={defaultValues?.has_land ?? ""} className={selectClass}>
            <option value="">Sin especificar</option>
            {HAS_LAND_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {HAS_LAND_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Área aproximada (m²)"
          name="approx_area"
          type="number"
          step="0.01"
          defaultValue={defaultValues?.approx_area ?? ""}
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="timeline" className={labelClass}>
            ¿Cuándo quiere empezar?
          </label>
          <select id="timeline" name="timeline" defaultValue={defaultValues?.timeline ?? ""} className={selectClass}>
            <option value="">Sin especificar</option>
            {LEAD_TIMELINE.map((option) => (
              <option key={option} value={option}>
                {LEAD_TIMELINE_LABELS[option]}
              </option>
            ))}
          </select>
        </div>
      </div>
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
