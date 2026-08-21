import { ArrowRightCircle } from "lucide-react";
import { notFound } from "next/navigation";
import LeadForm from "@/components/dashboard/lead-form";
import StatusSelect from "@/components/dashboard/status-select";
import Button from "@/components/dashboard/ui/button";
import Section from "@/components/dashboard/ui/section";
import SubmitButton from "@/components/dashboard/ui/submit-button";
import { inputClass } from "@/components/dashboard/ui/styles";
import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUS_LABELS, LEAD_STATUSES } from "@/lib/supabase/types";
import { addLeadNote, convertLeadToClient, updateLead, updateLeadStatus } from "../actions";

export default async function LeadDetailPage(
  props: PageProps<"/dashboard/leads/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: lead }, { data: activity }] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("activity_log")
      .select("*")
      .eq("entity_type", "lead")
      .eq("entity_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!lead) notFound();

  const boundUpdateStatus = updateLeadStatus.bind(null, id);
  const boundUpdate = updateLead.bind(null, id);
  const boundAddNote = addLeadNote.bind(null, id);
  const boundConvert = convertLeadToClient.bind(null, id);

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-carbon">{lead.name}</h1>
          <p className="text-sm text-carbon/60">{lead.email}</p>
        </div>
        {lead.status !== "ganado" && (
          <form action={boundConvert}>
            <Button type="submit">
              <ArrowRightCircle size={16} strokeWidth={2} aria-hidden="true" />
              Convertir en cliente
            </Button>
          </form>
        )}
      </div>

      <div className="mt-6">
        <StatusSelect
          action={boundUpdateStatus}
          defaultValue={lead.status}
          options={LEAD_STATUSES.map((status) => ({
            value: status,
            label: LEAD_STATUS_LABELS[status],
          }))}
        />
      </div>

      <Section title="Editar información">
        <LeadForm action={boundUpdate} defaultValues={lead} />
      </Section>

      <Section title="Actividad">
        <form action={boundAddNote} className="flex gap-2">
          <input name="body" placeholder="Agregar una nota…" className={`flex-1 ${inputClass}`} />
          <SubmitButton variant="secondary" pendingLabel="Agregando…">
            Agregar
          </SubmitButton>
        </form>
        <ul className="mt-4 flex flex-col gap-3">
          {(activity ?? []).map((item) => (
            <li key={item.id} className="border-b border-carbon/5 pb-3 text-sm last:border-0">
              <p className="text-carbon/80">{item.body}</p>
              <p className="mt-1 text-xs text-carbon/40">
                {new Date(item.created_at).toLocaleString("es-EC")}
              </p>
            </li>
          ))}
          {(activity ?? []).length === 0 && (
            <li className="text-sm text-carbon/40">Sin actividad todavía.</li>
          )}
        </ul>
      </Section>
    </div>
  );
}
