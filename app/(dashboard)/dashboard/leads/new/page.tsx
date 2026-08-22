import LeadForm from "@/components/dashboard/lead-form";
import { createLead } from "../actions";

export default function NewLeadPage() {
  return (
    <div className="max-w-lg px-12 py-10">
      <h1 className="font-dp-serif text-3xl text-tinta">Nuevo lead</h1>
      <div className="mt-7 rounded-2xl border border-filete p-7">
        <LeadForm action={createLead} />
      </div>
    </div>
  );
}
