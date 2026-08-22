import ClientForm from "@/components/dashboard/client-form";
import { createClientRecord } from "../actions";

export default function NewClientPage() {
  return (
    <div className="max-w-lg px-12 py-10">
      <h1 className="font-dp-serif text-3xl text-tinta">Nuevo cliente</h1>
      <div className="mt-7 rounded-2xl border border-filete p-7">
        <ClientForm action={createClientRecord} />
      </div>
    </div>
  );
}
