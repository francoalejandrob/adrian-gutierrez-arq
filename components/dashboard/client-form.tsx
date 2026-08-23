import SubmitButton from "@/components/dashboard/ui/submit-button";
import { TextField, TextareaField } from "@/components/dashboard/ui/field";
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
      <TextField label="Nombre" name="name" defaultValue={defaultValues?.name} required />
      <div className="grid grid-cols-2 gap-4">
        <TextField label="Email" name="email" type="email" defaultValue={defaultValues?.email ?? ""} />
        <TextField label="Teléfono" name="phone" defaultValue={defaultValues?.phone ?? ""} />
      </div>
      <TextField label="Empresa" name="company" defaultValue={defaultValues?.company ?? ""} />
      <TextField label="Dirección" name="address" defaultValue={defaultValues?.address ?? ""} />
      <TextareaField label="Notas" name="notes" rows={3} defaultValue={defaultValues?.notes ?? ""} />

      <SubmitButton size="lg" pendingLabel="Guardando…" className="w-fit">
        Guardar
      </SubmitButton>
    </form>
  );
}
