import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { notFound } from "next/navigation";
import ClientForm from "@/components/dashboard/client-form";
import { buttonClass } from "@/components/dashboard/ui/button";
import Section from "@/components/dashboard/ui/section";
import StatusBadge from "@/components/dashboard/ui/status-badge";
import SubmitButton from "@/components/dashboard/ui/submit-button";
import { inputClass } from "@/components/dashboard/ui/styles";
import { initials } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { PROJECT_STATUS_LABELS, PROJECT_STATUS_TONE, type ProjectStatus } from "@/lib/supabase/types";
import { addClientNote, updateClientRecord } from "../actions";

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

export default async function ClientDetailPage(
  props: PageProps<"/dashboard/clients/[id]">,
) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: client }, { data: clientActivity }, { data: projects }] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("activity_log")
      .select("*")
      .eq("entity_type", "client")
      .eq("entity_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("id, name, status, created_at")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
  ]);

  if (!client) notFound();

  const projectIds = (projects ?? []).map((p) => p.id);

  const [{ data: lead }, { data: quotes }, { data: contracts }, { data: payments }, { count: leadActivityCount }] =
    await Promise.all([
      client.converted_from_lead_id
        ? supabase.from("leads").select("created_at").eq("id", client.converted_from_lead_id).maybeSingle()
        : Promise.resolve({ data: null }),
      projectIds.length
        ? supabase.from("quotes").select("created_at").in("project_id", projectIds).order("created_at").limit(1)
        : Promise.resolve({ data: [] }),
      projectIds.length ? supabase.from("contracts").select("value, signed_at").in("project_id", projectIds) : Promise.resolve({ data: [] }),
      projectIds.length ? supabase.from("payments").select("amount, status").in("project_id", projectIds) : Promise.resolve({ data: [] }),
      client.converted_from_lead_id
        ? supabase
            .from("activity_log")
            .select("*", { count: "exact", head: true })
            .eq("entity_type", "lead")
            .eq("entity_id", client.converted_from_lead_id)
        : Promise.resolve({ count: 0 }),
    ]);

  const boundUpdate = updateClientRecord.bind(null, id);
  const boundAddNote = addClientNote.bind(null, id);

  const contractedTotal = (contracts ?? []).reduce((sum, c) => sum + c.value, 0);
  const collectedTotal = (payments ?? []).filter((p) => p.status === "pagada").reduce((sum, p) => sum + p.amount, 0);
  const signedDates = (contracts ?? []).map((c) => c.signed_at).filter(Boolean) as string[];
  const firstSignedAt = signedDates.sort()[0] ?? null;
  const communicationCount = (clientActivity?.length ?? 0) + (leadActivityCount ?? 0);
  const oldestProject = (projects ?? []).slice().sort((a, b) => a.created_at.localeCompare(b.created_at))[0] ?? null;

  const journey = [
    { label: "Lead", date: lead?.created_at ?? null },
    { label: "Cliente", date: client.created_at },
    { label: "Cotización", date: quotes?.[0]?.created_at ?? null },
    { label: "Contrato", date: firstSignedAt },
    { label: "Proyecto", date: oldestProject?.created_at ?? null },
  ];

  return (
    <div className="max-w-3xl">
      <Link
        href="/dashboard/crm?tab=clientes"
        className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] text-carbon/45 transition-colors duration-150 hover:text-carbon"
      >
        <ArrowLeft size={13} strokeWidth={2} aria-hidden="true" />
        Clientes
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-arena font-display text-xl text-carbon">
            {initials(client.name)}
          </div>
          <div>
            <h1 className="font-display text-[26px] font-medium text-carbon">{client.name}</h1>
            <p className="mt-0.5 text-[13px] text-carbon/50">
              Cliente desde {new Date(client.created_at).toLocaleDateString("es-EC", { month: "short", year: "numeric" })}
              {client.company ? ` · ${client.company}` : ""}
            </p>
          </div>
        </div>
        <Link href={`/dashboard/projects/new?client_id=${client.id}`} className={buttonClass("primary", "md")}>
          <Plus size={16} strokeWidth={2} aria-hidden="true" />
          Nuevo proyecto
        </Link>
      </div>

      <Section title="Journey del cliente" variant="plain">
        <div className="flex items-center overflow-x-auto pb-2">
          {journey.map((step, i) => (
            <div key={step.label} className="flex flex-1 items-center">
              <div className="flex min-w-[90px] flex-col items-center gap-2">
                <span
                  className={`h-3.5 w-3.5 rounded-full ${
                    step.date ? "bg-naranja ring-2 ring-naranja/30 ring-offset-2 ring-offset-hueso" : "bg-carbon/15"
                  }`}
                />
                <span className={`text-center text-xs ${step.date ? "text-carbon/70" : "text-carbon/35"}`}>{step.label}</span>
                <span className="font-mono text-[11px] text-carbon/35">
                  {step.date ? new Date(step.date).toLocaleDateString("es-EC", { month: "short", year: "numeric" }) : "pendiente"}
                </span>
              </div>
              {i < journey.length - 1 && <div className="mb-6 h-px flex-1 bg-carbon/15" />}
            </div>
          ))}
        </div>
      </Section>

      <div className="mt-11 grid grid-cols-1 gap-5 sm:grid-cols-3">
        <StatCard label="Contrato" value={currency.format(contractedTotal)} hint={firstSignedAt ? `Firmado ${new Date(firstSignedAt).toLocaleDateString("es-EC")}` : "Sin contratos firmados"} />
        <StatCard label="Cobrado" value={currency.format(collectedTotal)} hint={`${(payments ?? []).filter((p) => p.status === "pagada").length} pago(s)`} valueClassName="text-[#3a7a56]" />
        <StatCard label="Comunicación" value={String(communicationCount)} hint="Interacciones registradas" />
      </div>

      <Section title="Proyectos">
        <div className="flex flex-col gap-2">
          {(projects ?? []).map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/projects/${project.id}`}
              className="flex items-center justify-between border-b border-carbon/5 py-2.5 text-sm transition-colors duration-100 last:border-0 hover:text-naranja-oscuro"
            >
              <span className="text-carbon">{project.name}</span>
              <StatusBadge
                label={PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
                tone={PROJECT_STATUS_TONE[project.status as ProjectStatus]}
              />
            </Link>
          ))}
          {(projects ?? []).length === 0 && (
            <p className="text-sm text-carbon/40">Sin proyectos todavía.</p>
          )}
        </div>
      </Section>

      <Section title="Editar información">
        <ClientForm action={boundUpdate} defaultValues={client} />
      </Section>

      <Section title="Actividad">
        <form action={boundAddNote} className="flex gap-2">
          <input name="body" placeholder="Agregar una nota…" className={`flex-1 ${inputClass}`} />
          <SubmitButton variant="secondary" pendingLabel="Agregando…">
            Agregar
          </SubmitButton>
        </form>
        <ul className="mt-4 flex flex-col gap-3">
          {(clientActivity ?? []).map((item) => (
            <li key={item.id} className="border-b border-carbon/5 pb-3 text-sm last:border-0">
              <p className="text-carbon/80">{item.body}</p>
              <p className="mt-1 text-xs text-carbon/40">
                {new Date(item.created_at).toLocaleString("es-EC")}
              </p>
            </li>
          ))}
          {(clientActivity ?? []).length === 0 && (
            <li className="text-sm text-carbon/40">Sin actividad todavía.</li>
          )}
        </ul>
      </Section>
    </div>
  );
}

function StatCard({ label, value, hint, valueClassName = "" }: { label: string; value: string; hint: string; valueClassName?: string }) {
  return (
    <div className="rounded-[10px] border border-carbon/[0.08] bg-white p-[22px]">
      <p className="mb-3 text-[11px] uppercase tracking-[0.07em] text-carbon/40">{label}</p>
      <p className={`font-mono text-[22px] font-medium text-carbon ${valueClassName}`}>{value}</p>
      <p className="mt-1.5 text-xs text-carbon/50">{hint}</p>
    </div>
  );
}
