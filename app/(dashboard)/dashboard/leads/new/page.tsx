import LeadForm from "@/components/dashboard/lead-form";
import { getAssignableMembers } from "@/lib/members";
import { createClient } from "@/lib/supabase/server";
import { createLead } from "../actions";

export default async function NewLeadPage() {
  const supabase = await createClient();
  const members = await getAssignableMembers(supabase);

  return (
    <div className="max-w-lg px-12 py-10">
      <h1 className="font-dp-serif text-3xl text-tinta">Nuevo lead</h1>
      <div className="mt-7 rounded-2xl border border-filete p-7">
        <LeadForm action={createLead} members={members} />
      </div>
    </div>
  );
}
