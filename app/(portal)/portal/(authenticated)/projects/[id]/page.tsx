import Link from "next/link";
import { notFound } from "next/navigation";
import DownloadButton from "@/components/dashboard/download-button";
import SubmitButton from "@/components/dashboard/ui/submit-button";
import { inputClass } from "@/components/dashboard/ui/styles";
import { createClient } from "@/lib/supabase/server";
import {
  DOC_CATEGORY_LABELS,
  DOC_VERSION_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PHASE_STATUS_LABELS,
  quoteTotal,
  type PhaseStatus,
} from "@/lib/supabase/types";
import { addPortalMessage, getPortalDownloadUrl, respondToDocumentVersion, respondToQuote } from "../../../actions";

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

const TABS = [
  { key: "proyecto", label: "Proyecto" },
  { key: "approvals", label: "Aprobaciones" },
  { key: "docs", label: "Documentos" },
  { key: "payments", label: "Pagos" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

export default async function PortalProjectPage(props: PageProps<"/portal/projects/[id]">) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const tabParam = Array.isArray(searchParams.tab) ? searchParams.tab[0] : searchParams.tab;
  const tab: TabKey = TABS.some((t) => t.key === tabParam) ? (tabParam as TabKey) : "proyecto";

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
    <div>
      <div className="mb-7 flex gap-6 overflow-x-auto border-b border-carbon/[0.1]">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/portal/projects/${id}?tab=${t.key}`}
            className={`whitespace-nowrap border-b-2 pb-3 text-[13.5px] transition-colors duration-150 ${
              tab === t.key ? "border-carbon font-medium text-carbon" : "border-transparent text-carbon/50 hover:text-carbon"
            }`}
          >
            {t.label}
            {t.key === "approvals" && pendingApprovals.length > 0 && (
              <span className="ml-1.5 font-mono text-[11px] text-naranja-oscuro">({pendingApprovals.length})</span>
            )}
          </Link>
        ))}
      </div>

      {tab === "proyecto" && (
        <div>
          <p className="mb-1.5 text-xs uppercase tracking-[0.08em] text-naranja-oscuro">Tu proyecto</p>
          <h1 className="mb-6 font-display text-[26px] font-medium text-carbon">{project.name}</h1>

          <div className="mb-6 rounded-[10px] border border-carbon/[0.08] bg-white py-8 text-center">
            <p className="font-display text-[52px] font-semibold leading-none tracking-[-0.02em] text-carbon">
              {project.progress}
              <span className="text-[28px]">%</span>
            </p>
            <p className="mt-1.5 text-[12.5px] text-carbon/50">completado</p>
          </div>

          {nextMilestone && (
            <div className="mb-6 rounded-[10px] border border-carbon/[0.08] bg-white p-5">
              <p className="mb-2 text-[11px] uppercase tracking-[0.07em] text-carbon/40">Próximo hito</p>
              <p className="text-[15px] font-medium text-carbon">{nextMilestone.name}</p>
              <p className="mt-1 font-mono text-[12.5px] text-carbon/50">
                {new Date(nextMilestone.end_date!).toLocaleDateString("es-EC", { day: "numeric", month: "long" })}
              </p>
            </div>
          )}

          {pendingApprovals.length > 0 && (
            <div className="mb-6 rounded-[10px] border border-naranja bg-white p-5">
              <p className="mb-2 text-[11px] uppercase tracking-[0.07em] text-naranja-oscuro">Pendiente de tu aprobación</p>
              <p className="mb-3.5 text-[15px] font-medium text-carbon">
                {pendingApprovals[0].doc.name} — Versión {pendingApprovals[0].version.version}
              </p>
              <Link
                href={`/portal/projects/${id}?tab=approvals`}
                className="block w-full rounded-lg bg-carbon px-4 py-2.5 text-center text-[13.5px] text-hueso transition-colors duration-150 hover:bg-naranja-oscuro"
              >
                Revisar
              </Link>
            </div>
          )}

          <div className="mb-6 rounded-[10px] border border-carbon/[0.08] bg-white p-5">
            <p className="mb-2 text-[11px] uppercase tracking-[0.07em] text-carbon/40">Próxima reunión</p>
            {nextEvent ? (
              <p className="text-[15px] text-carbon">
                {new Date(nextEvent.starts_at).toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" })} ·{" "}
                {new Date(nextEvent.starts_at).toLocaleTimeString("es-EC", { hour: "numeric", minute: "2-digit" })}
              </p>
            ) : (
              <p className="text-[13.5px] text-carbon/45">Sin reuniones próximas.</p>
            )}
          </div>

          {(phases ?? []).length > 0 && (
            <div className="mb-8">
              <p className="mb-3 text-[11px] uppercase tracking-[0.09em] text-carbon/40">Fases</p>
              <div className="flex flex-col">
                {(phases ?? []).map((phase) => (
                  <div key={phase.id} className="flex items-center justify-between border-b border-carbon/[0.06] py-2.5 last:border-0">
                    <span className="text-[13.5px] text-carbon/80">{phase.name}</span>
                    <span className="text-xs text-carbon/45">{PHASE_STATUS_LABELS[phase.status as PhaseStatus]}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-3 text-[11px] uppercase tracking-[0.09em] text-carbon/40">Mensajes</p>
            <form action={boundAddMessage} className="flex gap-2">
              <input name="body" placeholder="Escribe un mensaje…" className={`flex-1 ${inputClass}`} />
              <SubmitButton variant="secondary" pendingLabel="Enviando…">
                Enviar
              </SubmitButton>
            </form>
            <ul className="mt-4 flex flex-col">
              {(activity ?? []).map((item) => (
                <li key={item.id} className="border-b border-carbon/[0.06] py-3 text-sm last:border-0">
                  <p className="text-carbon/80">{item.body}</p>
                  <p className="mt-1 font-mono text-xs text-carbon/40">{new Date(item.created_at).toLocaleString("es-EC")}</p>
                </li>
              ))}
              {(activity ?? []).length === 0 && <li className="py-2 text-sm text-carbon/40">Sin mensajes todavía.</li>}
            </ul>
          </div>
        </div>
      )}

      {tab === "approvals" && (
        <div>
          <h1 className="mb-6 font-display text-2xl font-medium text-carbon">Aprobaciones</h1>
          <div className="flex flex-col gap-6">
            {pendingApprovals.map(({ doc, version }) => (
              <div key={version.id} className="rounded-[10px] border border-carbon/[0.08] bg-white">
                <div className="flex aspect-[16/10] items-center justify-center bg-[repeating-linear-gradient(135deg,#e4dfd4,#e4dfd4_10px,#ecebe4_10px,#ecebe4_20px)]">
                  <span className="font-mono text-xs text-carbon/45">[ {doc.name} — v{version.version} ]</span>
                </div>
                <div className="p-[22px]">
                  <p className="mb-1 text-[11px] uppercase tracking-[0.07em] text-carbon/40">
                    {doc.name} · {DOC_CATEGORY_LABELS[doc.category]} · V{String(version.version).padStart(2, "0")}
                  </p>
                  {version.comment && (
                    <p className="mb-[18px] font-display text-[13.5px] italic text-carbon/70">&ldquo;{version.comment}&rdquo;</p>
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
            {pendingApprovals.length === 0 && <p className="text-sm text-carbon/40">Sin aprobaciones pendientes.</p>}
          </div>
        </div>
      )}

      {tab === "docs" && (
        <div>
          <h1 className="mb-6 font-display text-2xl font-medium text-carbon">Documentos</h1>
          <div className="overflow-hidden rounded-[10px] border border-carbon/[0.08] bg-white">
            {(documents ?? []).map((doc) => {
              const latest = [...doc.document_versions].sort((a, b) => b.version - a.version)[0];
              if (!latest) return null;
              return (
                <div key={doc.id} className="flex items-center gap-3.5 border-b border-carbon/[0.06] px-[18px] py-4 last:border-0">
                  <div className="h-8 w-6 shrink-0 bg-arena" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] text-carbon">{doc.name}</p>
                    <p className="text-[11.5px] text-carbon/45">
                      v{latest.version} · {DOC_VERSION_STATUS_LABELS[latest.status]}
                    </p>
                  </div>
                  <DownloadButton storagePath={latest.storage_path} getUrl={getPortalDownloadUrl} />
                </div>
              );
            })}
            {(documents ?? []).length === 0 && <p className="p-[18px] text-sm text-carbon/40">Sin documentos compartidos todavía.</p>}
          </div>
        </div>
      )}

      {tab === "payments" && (
        <div>
          <h1 className="mb-6 font-display text-2xl font-medium text-carbon">Pagos</h1>
          <div className="flex flex-col gap-3.5">
            {(payments ?? []).map((payment) => (
              <div key={payment.id} className="flex items-center justify-between rounded-[10px] border border-carbon/[0.08] bg-white p-[22px]">
                <div>
                  <p className="text-[14px] text-carbon">{payment.method || "Pago"}</p>
                  <p className="mt-1 text-[11.5px] text-carbon/45">
                    {payment.status === "pagada" ? "Pagado" : PAYMENT_STATUS_LABELS[payment.status]}
                    {payment.due_date ? ` · vence ${new Date(payment.due_date).toLocaleDateString("es-EC")}` : ""}
                  </p>
                </div>
                <p
                  className={`font-mono text-[19px] font-medium ${
                    payment.status === "pagada" ? "text-[#3a7a56]" : payment.status === "vencida" ? "text-[#a4432b]" : "text-carbon"
                  }`}
                >
                  {currency.format(payment.amount)}
                </p>
              </div>
            ))}
            {(payments ?? []).length === 0 && <p className="text-sm text-carbon/40">Sin pagos registrados todavía.</p>}
          </div>

          {pendingQuote && (
            <div className="mt-8 rounded-[10px] border border-carbon/[0.08] bg-white p-[22px]">
              <p className="mb-3.5 text-[11px] uppercase tracking-[0.07em] text-carbon/40">Cotización pendiente</p>
              {(() => {
                const items = [...pendingQuote.quote_items].sort((a, b) => a.position - b.position);
                const { total } = quoteTotal(items, pendingQuote.discount, pendingQuote.tax_rate);
                return (
                  <>
                    <p className="mb-4 font-mono text-[22px] font-medium text-carbon">{currency.format(total)}</p>
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
        </div>
      )}
    </div>
  );
}
