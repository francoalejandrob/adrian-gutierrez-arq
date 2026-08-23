import { MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import ClientForm from "@/components/dashboard/client-form";
import Avatar from "@/components/dashboard/ui/avatar";
import { buttonClass } from "@/components/dashboard/ui/button";
import Section from "@/components/dashboard/ui/section";
import StatusBadge from "@/components/dashboard/ui/status-badge";
import StatusMark from "@/components/dashboard/ui/status-mark";
import SubmitButton from "@/components/dashboard/ui/submit-button";
import { inputClass } from "@/components/dashboard/ui/styles";
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
    <div>
      <PageHeaderWithBack client={client} />

      <div className="px-12 pt-8">
        <Section title="Recorrido del cliente">
          <div className="flex items-start">
            {journey.map((step, i) => (
              <div key={step.label} className="flex flex-1 items-start">
                <div className="flex min-w-[90px] flex-col items-center gap-2.5">
                  <StatusMark tone={step.date ? "resolved" : "pending"} />
                  <span className={`text-center font-dp-sans text-[12px] ${step.date ? "text-tinta" : "text-concreto"}`}>{step.label}</span>
                  <span className="font-dp-mono text-[10px] text-concreto">
                    {step.date ? new Date(step.date).toLocaleDateString("es-EC", { month: "short", year: "numeric" }) : "pendiente"}
                  </span>
                </div>
                {i < journey.length - 1 && <div className="mt-[4.5px] h-px flex-1 bg-filete" />}
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="mx-12 mt-8 grid grid-cols-3 gap-4">
        <StatCell label="Contrato" value={currency.format(contractedTotal)} hint={firstSignedAt ? `Firmado ${new Date(firstSignedAt).toLocaleDateString("es-EC")}` : "Sin contratos firmados"} />
        <StatCell label="Cobrado" value={currency.format(collectedTotal)} hint={`${(payments ?? []).filter((p) => p.status === "pagada").length} pago(s)`} />
        <StatCell label="Comunicación" value={String(communicationCount)} hint="Interacciones registradas" />
      </div>

      <div className="grid grid-cols-1 gap-10 px-12 py-10 lg:grid-cols-2">
        <Section title="Proyectos">
          <div className="flex flex-col">
            {(projects ?? []).map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="flex items-center justify-between gap-4 border-b border-filete py-3 last:border-0"
              >
                <span className="truncate font-dp-sans text-[13.5px] text-tinta">{project.name}</span>
                <StatusBadge
                  label={PROJECT_STATUS_LABELS[project.status as ProjectStatus]}
                  tone={PROJECT_STATUS_TONE[project.status as ProjectStatus]}
                />
              </Link>
            ))}
            {(projects ?? []).length === 0 && (
              <p className="py-2 font-dp-sans text-sm text-concreto">Sin proyectos todavía.</p>
            )}
          </div>
        </Section>

        <Section title="Actividad">
          <form action={boundAddNote} className="flex gap-2.5">
            <input name="body" placeholder="Agregar una nota…" className={`flex-1 ${inputClass}`} />
            <SubmitButton variant="secondary" pendingLabel="Agregando…">
              Agregar
            </SubmitButton>
          </form>
          <ul className="mt-5 flex flex-col gap-3.5">
            {(clientActivity ?? []).map((item) => (
              <li key={item.id} className="border-b border-filete pb-3.5 last:border-0">
                <p className="font-dp-sans text-[13px] text-grafito">{item.body}</p>
                <p className="mt-1.5 font-dp-mono text-[10.5px] text-concreto">
                  {new Date(item.created_at).toLocaleString("es-EC")}
                </p>
              </li>
            ))}
            {(clientActivity ?? []).length === 0 && (
              <li className="font-dp-sans text-sm text-concreto">Sin actividad todavía.</li>
            )}
          </ul>
        </Section>
      </div>

      <div className="border-t border-corte px-12 py-10">
        <Section title="Editar información" className="max-w-xl">
          <ClientForm action={boundUpdate} defaultValues={client} />
        </Section>
      </div>
    </div>
  );
}

function PageHeaderWithBack({
  client,
}: {
  client: { id: string; name: string; created_at: string; company: string | null; address: string | null };
}) {
  return (
    <div className="border-b border-corte px-12 pb-[30px] pt-[52px]">
      <Link
        href="/dashboard/crm?tab=clientes"
        className="mb-[18px] inline-block font-dp-mono text-[10px] uppercase tracking-[0.14em] text-concreto hover:text-tinta"
      >
        ← Clientes
      </Link>
      <div className="flex items-end justify-between gap-10">
        <div className="flex items-center gap-4">
          <Avatar name={client.name} size={44} />
          <div>
            <h1 className="font-dp-serif text-[44px] leading-none tracking-[-0.015em] text-tinta">{client.name}</h1>
            <p className="mt-3 font-dp-sans text-[13px] text-concreto">
              Cliente desde {new Date(client.created_at).toLocaleDateString("es-EC", { month: "short", year: "numeric" })}
              {client.company ? ` · ${client.company}` : ""}
            </p>
            {client.address && (
              <p className="mt-1.5 flex items-center gap-1.5 font-dp-sans text-[12.5px] text-concreto">
                <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                {client.address}
              </p>
            )}
          </div>
        </div>
        <Link href={`/dashboard/projects/new?client_id=${client.id}`} className={buttonClass("primary", "md")}>
          Nuevo proyecto
        </Link>
      </div>
    </div>
  );
}

function StatCell({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="dp-card p-8">
      <p className="font-dp-mono text-[9.5px] uppercase tracking-[0.13em] text-concreto">{label}</p>
      <p className="mt-4 font-dp-mono text-2xl text-tinta">{value}</p>
      <p className="mt-2 font-dp-sans text-[11.5px] text-concreto">{hint}</p>
    </div>
  );
}
