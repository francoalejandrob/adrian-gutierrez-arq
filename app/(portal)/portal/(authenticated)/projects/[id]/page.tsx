import { AlertCircle } from "lucide-react";
import { notFound } from "next/navigation";
import DownloadButton from "@/components/dashboard/download-button";
import Section from "@/components/dashboard/ui/section";
import StatusBadge from "@/components/dashboard/ui/status-badge";
import SubmitButton from "@/components/dashboard/ui/submit-button";
import { inputClass } from "@/components/dashboard/ui/styles";
import { createClient } from "@/lib/supabase/server";
import {
  DOC_CATEGORY_LABELS,
  DOC_VERSION_STATUS_LABELS,
  DOC_VERSION_STATUS_TONE,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONE,
  PHASE_STATUS_LABELS,
  PHASE_STATUS_TONE,
  quoteTotal,
  type PhaseStatus,
} from "@/lib/supabase/types";
import { addPortalMessage, getPortalDownloadUrl, respondToDocumentVersion, respondToQuote } from "../../../actions";

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

export default async function PortalProjectPage(props: PageProps<"/portal/projects/[id]">) {
  const { id } = await props.params;

  const supabase = await createClient();

  const [
    { data: project },
    { data: phases },
    { data: documents },
    { data: activity },
    { data: quotes },
    { data: payments },
    { data: upcomingEvents },
  ] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    supabase.from("phases").select("*").eq("project_id", id).order("position"),
    supabase.from("documents").select("*, document_versions(*)").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("activity_log").select("*").eq("entity_type", "project").eq("entity_id", id).order("created_at", { ascending: false }),
    supabase.from("quotes").select("*, quote_items(*)").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("payments").select("*").eq("project_id", id).order("due_date"),
    supabase.from("calendar_events").select("*").eq("project_id", id).gte("starts_at", new Date().toISOString()).order("starts_at").limit(1),
  ]);

  // RLS already scopes this to the client's own project; a missing row
  // means either it doesn't exist or it isn't theirs — same response either way.
  if (!project) notFound();

  const boundAddMessage = addPortalMessage.bind(null, id);
  const pendingQuote = (quotes ?? []).find((q) => q.status === "sent" || q.status === "negotiation");
  const nextEvent = upcomingEvents?.[0] ?? null;

  type DocumentRow = NonNullable<typeof documents>[number];
  type DocVersionRow = DocumentRow["document_versions"][number];

  const pendingApprovals = (documents ?? [])
    .map((doc) => {
      const latest = [...doc.document_versions].sort((a, b) => b.version - a.version)[0];
      return latest && latest.status !== "aprobado" ? { doc, version: latest } : null;
    })
    .filter((x): x is { doc: DocumentRow; version: DocVersionRow } => x !== null);

  const nextMilestone = (() => {
    const upcoming = (phases ?? [])
      .filter((p) => p.status !== "completada" && p.end_date)
      .sort((a, b) => (a.end_date ?? "").localeCompare(b.end_date ?? ""))[0];
    return upcoming ?? null;
  })();

  return (
    <div className="flex flex-col gap-12">
      <div>
        <p className="mb-2.5 font-dp-mono text-[10px] uppercase tracking-[0.14em] text-concreto">Tu proyecto</p>
        <h1 className="font-dp-serif text-[38px] leading-none tracking-[-0.015em] text-tinta">{project.name}</h1>
      </div>

      <div className="dp-card grid grid-cols-[auto_1fr] gap-10 p-8">
        <div>
          <p className="font-dp-mono text-[44px] leading-none text-tinta">
            {project.progress}
            <span className="text-2xl">%</span>
          </p>
          <p className="mt-2 font-dp-mono text-[9.5px] uppercase tracking-[0.13em] text-concreto">Completado</p>
        </div>
        {(phases ?? []).length > 0 && (
          <div className="flex flex-col justify-center gap-2 border-l border-filete pl-8">
            {(phases ?? []).map((phase) => (
              <div key={phase.id} className="flex items-center justify-between gap-4">
                <span className="font-dp-sans text-[13px] text-grafito">{phase.name}</span>
                <StatusBadge
                  label={PHASE_STATUS_LABELS[phase.status as PhaseStatus]}
                  tone={PHASE_STATUS_TONE[phase.status as PhaseStatus]}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="dp-card p-7">
          <p className="mb-2 font-dp-mono text-[9.5px] uppercase tracking-[0.13em] text-concreto">Próximo hito</p>
          {nextMilestone ? (
            <>
              <p className="font-dp-sans text-[14px] text-tinta">{nextMilestone.name}</p>
              <p className="mt-1 font-dp-mono text-[11.5px] text-concreto">
                {new Date(nextMilestone.end_date!).toLocaleDateString("es-EC", { day: "numeric", month: "long" })}
              </p>
            </>
          ) : (
            <p className="font-dp-sans text-[13px] text-concreto">Sin hitos próximos.</p>
          )}
        </div>
        <div className="dp-card p-7">
          <p className="mb-2 font-dp-mono text-[9.5px] uppercase tracking-[0.13em] text-concreto">Próxima reunión</p>
          {nextEvent ? (
            <p className="font-dp-sans text-[14px] text-tinta">
              {new Date(nextEvent.starts_at).toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" })} ·{" "}
              {new Date(nextEvent.starts_at).toLocaleTimeString("es-EC", { hour: "numeric", minute: "2-digit" })}
            </p>
          ) : (
            <p className="font-dp-sans text-[13px] text-concreto">Sin reuniones próximas.</p>
          )}
        </div>
      </div>

      {pendingApprovals.length > 0 && (
        <div className="border-t border-filete pt-10">
          <p className="mb-5 flex items-center gap-2 font-dp-mono text-[9.5px] uppercase tracking-[0.13em] text-acento">
            <AlertCircle size={13} strokeWidth={2} aria-hidden="true" />
            Pendiente de tu aprobación
          </p>
          <div className="flex flex-col gap-8">
            {pendingApprovals.map(({ doc, version }) => (
              <div key={version.id} className="overflow-hidden rounded-2xl border border-filete">
                <div className="dp-grain-strong flex aspect-[16/10] items-center justify-center">
                  <span className="font-dp-mono text-xs text-grafito">[ {doc.name} — v{version.version} ]</span>
                </div>
                <div className="p-7">
                  <p className="mb-1.5 font-dp-mono text-[9.5px] uppercase tracking-[0.12em] text-concreto">
                    {doc.name} · {DOC_CATEGORY_LABELS[doc.category]} · V{String(version.version).padStart(2, "0")}
                  </p>
                  {version.comment && (
                    <p className="mb-5 font-dp-serif text-lg italic text-grafito">&ldquo;{version.comment}&rdquo;</p>
                  )}
                  <form action={respondToDocumentVersion.bind(null, id, version.id)} className="flex gap-2.5">
                    <SubmitButton variant="primary" size="md" className="flex-1" name="status" value="aprobado" pendingLabel="Guardando…">
                      Aprobar
                    </SubmitButton>
                    <SubmitButton variant="secondary" size="md" className="flex-1" name="status" value="cambios_solicitados" pendingLabel="Guardando…">
                      Solicitar cambios
                    </SubmitButton>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Section title="Documentos">
        <div>
          {(documents ?? []).map((doc) => {
            const latest = [...doc.document_versions].sort((a, b) => b.version - a.version)[0];
            if (!latest) return null;
            return (
              <div key={doc.id} className="flex items-center justify-between gap-3.5 border-b border-filete py-4 last:border-0">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-dp-sans text-[13.5px] text-tinta">{doc.name}</p>
                  <div className="mt-1.5 flex items-center gap-2.5">
                    <span className="font-dp-mono text-[10.5px] text-concreto">v{latest.version}</span>
                    <StatusBadge label={DOC_VERSION_STATUS_LABELS[latest.status]} tone={DOC_VERSION_STATUS_TONE[latest.status]} />
                  </div>
                </div>
                <DownloadButton storagePath={latest.storage_path} getUrl={getPortalDownloadUrl} />
              </div>
            );
          })}
          {(documents ?? []).length === 0 && <p className="font-dp-sans text-sm text-concreto">Sin documentos compartidos todavía.</p>}
        </div>
      </Section>

      <Section title="Pagos">
        <div className="flex flex-col">
          {(payments ?? []).map((payment) => (
            <div key={payment.id} className="flex items-center justify-between gap-4 border-b border-filete py-4 last:border-0">
              <div>
                <p className="font-dp-sans text-[14px] text-tinta">{payment.method || "Pago"}</p>
                <div className="mt-1.5 flex items-center gap-2.5">
                  <StatusBadge
                    label={payment.status === "pagada" ? "Pagado" : PAYMENT_STATUS_LABELS[payment.status]}
                    tone={PAYMENT_STATUS_TONE[payment.status]}
                  />
                  {payment.due_date && (
                    <span className="font-dp-mono text-[10.5px] text-concreto">
                      vence {new Date(payment.due_date).toLocaleDateString("es-EC")}
                    </span>
                  )}
                </div>
              </div>
              <p className={`font-dp-mono text-lg ${payment.status === "vencida" ? "text-acento" : "text-tinta"}`}>
                {currency.format(payment.amount)}
              </p>
            </div>
          ))}
          {(payments ?? []).length === 0 && <p className="font-dp-sans text-sm text-concreto">Sin pagos registrados todavía.</p>}
        </div>

        {pendingQuote && (
          <div className="mt-8 rounded-2xl border border-filete p-7">
            <p className="mb-3.5 font-dp-mono text-[9.5px] uppercase tracking-[0.12em] text-concreto">Cotización pendiente</p>
            {(() => {
              const items = [...pendingQuote.quote_items].sort((a, b) => a.position - b.position);
              const { total } = quoteTotal(items, pendingQuote.discount, pendingQuote.tax_rate);
              return (
                <>
                  <p className="mb-4 font-dp-mono text-2xl text-tinta">{currency.format(total)}</p>
                  <form action={respondToQuote.bind(null, id, pendingQuote.id)} className="flex gap-2.5">
                    <SubmitButton variant="primary" size="md" className="flex-1" name="status" value="accepted" pendingLabel="Guardando…">
                      Aceptar
                    </SubmitButton>
                    <SubmitButton variant="secondary" size="md" className="flex-1" name="status" value="rejected" pendingLabel="Guardando…">
                      Rechazar
                    </SubmitButton>
                  </form>
                </>
              );
            })()}
          </div>
        )}
      </Section>

      <Section title="Mensajes">
        <form action={boundAddMessage} className="flex gap-2.5">
          <input name="body" placeholder="Escribe un mensaje…" className={`flex-1 ${inputClass}`} />
          <SubmitButton variant="secondary" pendingLabel="Enviando…">
            Enviar
          </SubmitButton>
        </form>
        <ul className="mt-5 flex flex-col">
          {(activity ?? []).map((item) => (
            <li key={item.id} className="border-b border-filete py-3.5 last:border-0">
              <p className="font-dp-sans text-[13px] text-grafito">{item.body}</p>
              <p className="mt-1.5 font-dp-mono text-[10.5px] text-concreto">{new Date(item.created_at).toLocaleString("es-EC")}</p>
            </li>
          ))}
          {(activity ?? []).length === 0 && <li className="py-2 font-dp-sans text-sm text-concreto">Sin mensajes todavía.</li>}
        </ul>
      </Section>
    </div>
  );
}
