import Link from "next/link";
import { notFound } from "next/navigation";
import LeadForm from "@/components/dashboard/lead-form";
import StatusSelect from "@/components/dashboard/status-select";
import Button from "@/components/dashboard/ui/button";
import Section from "@/components/dashboard/ui/section";
import SubmitButton from "@/components/dashboard/ui/submit-button";
import { inputClass } from "@/components/dashboard/ui/styles";
import { getAssignableMembers } from "@/lib/members";
import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUS_LABELS, LEAD_STATUSES } from "@/lib/supabase/types";
import { addLeadNote, convertLeadToClient, updateLead, updateLeadStatus } from "../actions";

export default async function LeadDetailPage(
  props: PageProps<"/dashboard/leads/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: lead }, { data: activity }, members] = await Promise.all([
    supabase.from("leads").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("activity_log")
      .select("*")
      .eq("entity_type", "lead")
      .eq("entity_id", id)
      .order("created_at", { ascending: false }),
    getAssignableMembers(supabase),
  ]);

  if (!lead) notFound();

  const boundUpdateStatus = updateLeadStatus.bind(null, id);
  const boundUpdate = updateLead.bind(null, id);
  const boundAddNote = addLeadNote.bind(null, id);
  const boundConvert = convertLeadToClient.bind(null, id);

  return (
    <div>
      <div className="border-b border-corte px-5 pb-5 pt-8 sm:px-12 sm:pb-[30px] sm:pt-[52px]">
        <Link
          href="/dashboard/crm?tab=leads"
          className="mb-[18px] inline-block font-dp-mono text-[10px] uppercase tracking-[0.14em] text-concreto hover:text-tinta"
        >
          ← CRM
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-6 sm:gap-10">
          <div>
            <h1 className="font-dp-serif text-[28px] leading-none tracking-[-0.015em] text-tinta sm:text-[44px]">{lead.name}</h1>
            <p className="mt-3 font-dp-sans text-[13px] text-concreto">{lead.email}</p>
          </div>
          {lead.status !== "ganado" && (
            <form action={boundConvert}>
              <Button type="submit">Convertir en cliente</Button>
            </form>
          )}
        </div>
        <div className="mt-5">
          <StatusSelect
            action={boundUpdateStatus}
            defaultValue={lead.status}
            options={LEAD_STATUSES.map((status) => ({
              value: status,
              label: LEAD_STATUS_LABELS[status],
            }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 px-5 py-8 sm:px-12 sm:py-10 lg:grid-cols-2">
        <Section title="Editar información">
          <LeadForm action={boundUpdate} defaultValues={lead} members={members} />
        </Section>

        <Section title="Actividad">
          <form action={boundAddNote} className="flex gap-2.5">
            <input name="body" placeholder="Agregar una nota…" className={`flex-1 ${inputClass}`} />
            <SubmitButton variant="secondary" pendingLabel="Agregando…">
              Agregar
            </SubmitButton>
          </form>
          <ul className="mt-5 flex flex-col gap-3.5">
            {(activity ?? []).map((item) => (
              <li key={item.id} className="border-b border-filete pb-3.5 last:border-0">
                <p className="font-dp-sans text-[13px] text-grafito">{item.body}</p>
                <p className="mt-1.5 font-dp-mono text-[10.5px] text-concreto">
                  {new Date(item.created_at).toLocaleString("es-EC")}
                </p>
              </li>
            ))}
            {(activity ?? []).length === 0 && (
              <li className="font-dp-sans text-sm text-concreto">Sin actividad todavía.</li>
            )}
          </ul>
        </Section>
      </div>
    </div>
  );
}
