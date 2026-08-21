import ClientForm from "@/components/dashboard/client-form";
import { createClientRecord } from "../actions";

export default function NewClientPage() {
  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl text-carbon">Nuevo cliente</h1>
      <div className="mt-6 border border-carbon/10 bg-white p-6">
        <ClientForm action={createClientRecord} />
      </div>
    </div>
  );
}
