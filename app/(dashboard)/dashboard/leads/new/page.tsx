import LeadForm from "@/components/dashboard/lead-form";
import { createLead } from "../actions";

export default function NewLeadPage() {
  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl text-carbon">Nuevo lead</h1>
      <div className="mt-6 border border-carbon/10 bg-white p-6">
        <LeadForm action={createLead} />
      </div>
    </div>
  );
}
