import SubmitButton from "@/components/dashboard/ui/submit-button";
import { TextField, TextareaField } from "@/components/dashboard/ui/field";
import { labelClass, selectClass } from "@/components/dashboard/ui/styles";
import { CONTACT_PREFERENCE, CONTACT_PREFERENCE_LABELS, type Client } from "@/lib/supabase/types";

export default function ClientForm({
  action,
  defaultValues,
}: {
  action: (formData: FormData) => void;
  defaultValues?: Partial<Client>;
}) {
  return (
    <form action={action} className="flex flex-col gap-4">
      <TextField label="Nombre" name="name" defaultValue={defaultValues?.name} required />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Email" name="email" type="email" defaultValue={defaultValues?.email ?? ""} />
        <TextField label="Teléfono" name="phone" defaultValue={defaultValues?.phone ?? ""} />
      </div>
      <TextField label="Empresa" name="company" defaultValue={defaultValues?.company ?? ""} />
      <TextField label="Dirección" name="address" defaultValue={defaultValues?.address ?? ""} />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Ciudad" name="city" defaultValue={defaultValues?.city ?? ""} />
        <TextField label="País" name="country" defaultValue={defaultValues?.country ?? ""} />
      </div>
      <TextField label="Cédula / RUC" name="tax_id" defaultValue={defaultValues?.tax_id ?? ""} />
      <div className="grid grid-cols-2 gap-4">
        <TextField
          label="Contacto secundario"
          name="secondary_contact_name"
          defaultValue={defaultValues?.secondary_contact_name ?? ""}
        />
        <TextField
          label="Teléfono del contacto"
          name="secondary_contact_phone"
          defaultValue={defaultValues?.secondary_contact_phone ?? ""}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="contact_preference" className={labelClass}>
          Preferencia de contacto
        </label>
        <select
          id="contact_preference"
          name="contact_preference"
          defaultValue={defaultValues?.contact_preference ?? ""}
          className={selectClass}
        >
          <option value="">Sin especificar</option>
          {CONTACT_PREFERENCE.map((option) => (
            <option key={option} value={option}>
              {CONTACT_PREFERENCE_LABELS[option]}
            </option>
          ))}
        </select>
      </div>
      <TextareaField label="Notas" name="notes" rows={3} defaultValue={defaultValues?.notes ?? ""} />

      <SubmitButton size="lg" pendingLabel="Guardando…" className="w-fit">
        Guardar
      </SubmitButton>
    </form>
  );
}
