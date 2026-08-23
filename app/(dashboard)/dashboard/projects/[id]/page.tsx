import Link from "next/link";
import { notFound } from "next/navigation";
import GanttChart from "@/components/dashboard/gantt-chart";
import ProjectForm from "@/components/dashboard/project-form";
import StatusSelect from "@/components/dashboard/status-select";
import DownloadButton from "@/components/dashboard/download-button";
import PortalAccessForm from "@/components/dashboard/portal-access-form";
import Avatar from "@/components/dashboard/ui/avatar";
import Section from "@/components/dashboard/ui/section";
import StatusBadge from "@/components/dashboard/ui/status-badge";
import StatusMark from "@/components/dashboard/ui/status-mark";
import SubmitButton from "@/components/dashboard/ui/submit-button";
import { TabLink } from "@/components/dashboard/ui/tabs";
import { inputClass, selectClass } from "@/components/dashboard/ui/styles";
import { getAssignableMembers } from "@/lib/members";
import { createClient } from "@/lib/supabase/server";
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_TONE,
  CONTRACT_STATUSES,
  DOC_CATEGORIES,
  DOC_CATEGORY_LABELS,
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_TONE,
  PAYMENT_STATUSES,
  PHASE_STATUS_LABELS,
  PHASE_STATUSES,
  PROJECT_STATUS_LABELS,
  PROJECT_STATUSES,
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_TONE,
  TASK_STATUS_LABELS,
  TASK_STATUSES,
  quoteTotal,
  type Phase,
} from "@/lib/supabase/types";
import { addProjectNote, updateProject, updateProjectStatus } from "../actions";
import {
  createPhase,
  createTask,
  deletePhase,
  deleteTask,
  getSignedDownloadUrl,
  invitePortalAccess,
  revokePortalAccess,
  updateDocumentVersionStatus,
  updatePhaseStatus,
  updateTaskStatus,
  uploadDocumentVersion,
} from "./actions";
import {
  createContract,
  createExpense,
  createPayment,
  createQuote,
  deleteExpense,
  updateContractStatus,
  updatePaymentStatus,
} from "./finance-actions";

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "docs", label: "Documentos" },
  { key: "tasks", label: "Tareas" },
  { key: "gantt", label: "Cronograma" },
  { key: "approvals", label: "Aprobaciones" },
  { key: "finance", label: "Finanzas" },
  { key: "activity", label: "Actividad" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function relativeDay(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const diffDays = Math.floor((today.setHours(0, 0, 0, 0) - new Date(iso).setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays === 0) return "hoy";
  if (diffDays === 1) return "ayer";
  return date.toLocaleDateString("es-EC");
}

export default async function ProjectDetailPage(
  props: PageProps<"/dashboard/projects/[id]">,
) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const tabParam = Array.isArray(searchParams.tab) ? searchParams.tab[0] : searchParams.tab;
  const tab: TabKey = TABS.some((t) => t.key === tabParam) ? (tabParam as TabKey) : "overview";

  const supabase = await createClient();

  const [
    { data: project },
    { data: clients },
    { data: phases },
    { data: tasks },
    { data: documents },
    { data: activity },
    { data: quotes },
    { data: contracts },
    { data: payments },
    { data: expenses },
    members,
  ] = await Promise.all([
      supabase.from("projects").select("*, clients(id, name, email)").eq("id", id).maybeSingle(),
      supabase.from("clients").select("id, name").order("name"),
      supabase.from("phases").select("*").eq("project_id", id).order("position"),
      supabase.from("tasks").select("*, profiles(full_name, email)").eq("project_id", id).order("created_at"),
      supabase
        .from("documents")
        .select("*, document_versions(*)")
        .eq("project_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("activity_log")
        .select("*")
        .eq("entity_type", "project")
        .eq("entity_id", id)
        .order("created_at", { ascending: false }),
      supabase
        .from("quotes")
        .select("*, quote_items(*)")
        .eq("project_id", id)
        .order("created_at", { ascending: false }),
      supabase.from("contracts").select("*").eq("project_id", id).order("created_at", { ascending: false }),
      supabase.from("payments").select("*").eq("project_id", id).order("due_date"),
      supabase.from("expenses").select("*").eq("project_id", id).order("date", { ascending: false }),
      getAssignableMembers(supabase),
    ]);

  if (!project) notFound();

  const contracted = (contracts ?? []).reduce((sum, c) => sum + c.value, 0);
  const collected = (payments ?? [])
    .filter((p) => p.status === "pagada")
    .reduce((sum, p) => sum + p.amount, 0);
  const pending = (payments ?? [])
    .filter((p) => p.status === "pendiente" || p.status === "vencida")
    .reduce((sum, p) => sum + p.amount, 0);
  const spent = (expenses ?? []).reduce((sum, e) => sum + e.amount, 0);
  const margin = collected - spent;

  const { data: portalAccess } = await supabase
    .from("portal_access")
    .select("*")
    .eq("client_id", project.client_id)
    .order("created_at");

  const boundUpdateStatus = updateProjectStatus.bind(null, id);
  const boundUpdate = updateProject.bind(null, id);
  const boundAddNote = addProjectNote.bind(null, id);
  const boundCreatePhase = createPhase.bind(null, id);
  const boundCreateTask = createTask.bind(null, id);
  const boundUpload = uploadDocumentVersion.bind(null, id);
  const boundInvitePortal = invitePortalAccess.bind(null, id, project.client_id);
  const boundCreateQuote = createQuote.bind(null, id);
  const boundCreateContract = createContract.bind(null, id);
  const boundCreatePayment = createPayment.bind(null, id);
  const boundCreateExpense = createExpense.bind(null, id);

  type TaskRow = NonNullable<typeof tasks>[number];
  const tasksByStatus = new Map<string, TaskRow[]>();
  for (const task of tasks ?? []) {
    tasksByStatus.set(task.status, [...(tasksByStatus.get(task.status) ?? []), task]);
  }

  const today = new Date().toISOString().slice(0, 10);
  const upcomingTasks = (tasks ?? [])
    .filter((t) => t.status !== "completed" && t.due_date)
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))
    .slice(0, 3);

  const recentVersions = (documents ?? [])
    .flatMap((doc) => doc.document_versions.map((v) => ({ ...v, docName: doc.name })))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 3);

  type DocumentRow = NonNullable<typeof documents>[number];
  type DocVersionRow = DocumentRow["document_versions"][number];

  const pendingApprovals = (documents ?? [])
    .map((doc) => {
      const latest = [...doc.document_versions].sort((a, b) => b.version - a.version)[0];
      return latest && latest.status !== "aprobado" ? { doc, version: latest } : null;
    })
    .filter((x): x is { doc: DocumentRow; version: DocVersionRow } => x !== null);

  const docsByCategory = new Map<string, number>();
  for (const doc of documents ?? []) {
    docsByCategory.set(doc.category, (docsByCategory.get(doc.category) ?? 0) + 1);
  }

  return (
    <div>
      <div className="border-b border-corte px-12 pb-[30px] pt-[52px]">
        <Link
          href="/dashboard/projects"
          className="mb-[18px] inline-block font-dp-mono text-[10px] uppercase tracking-[0.14em] text-concreto hover:text-tinta"
        >
          ← Proyectos
        </Link>
        <div className="flex items-end justify-between gap-10">
          <div>
            <h1 className="font-dp-serif text-[44px] leading-none tracking-[-0.015em] text-tinta">{project.name}</h1>
            <p className="mt-3 font-dp-sans text-[13px] text-concreto">
              {project.category ?? "Proyecto"} · {project.clients?.name}
              {project.location ? ` · ${project.location}` : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="font-dp-mono text-[36px] leading-none text-tinta">{project.progress}%</p>
            <p className="mt-2 font-dp-mono text-[9.5px] uppercase tracking-[0.13em] text-concreto">Completado</p>
          </div>
        </div>
        <div className="mt-5">
          <StatusSelect
            action={boundUpdateStatus}
            defaultValue={project.status}
            options={PROJECT_STATUSES.map((status) => ({
              value: status,
              label: PROJECT_STATUS_LABELS[status],
            }))}
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto border-b border-corte px-12 pb-5">
        {TABS.map((t) => (
          <TabLink
            key={t.key}
            href={`/dashboard/projects/${id}?tab=${t.key}`}
            label={t.label}
            active={tab === t.key}
          />
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid grid-cols-1 gap-12 px-12 py-10 lg:grid-cols-[1.4fr_1fr]">
          <Section title="Fases del proyecto">
            <div className="flex flex-col">
              {(phases ?? []).map((phase, i) => (
                <PhaseRow key={phase.id} phase={phase} isCurrent={isCurrentPhase(phases ?? [], i)} />
              ))}
              {(phases ?? []).length === 0 && <p className="font-dp-sans text-sm text-concreto">Sin fases todavía.</p>}
            </div>
          </Section>

          <div className="flex flex-col gap-10">
            <Section title="Próximos hitos">
              <div className="flex flex-col gap-3">
                {upcomingTasks.map((t) => {
                  const overdue = (t.due_date ?? "") < today;
                  return (
                    <div key={t.id} className="flex justify-between font-dp-sans text-[13px]">
                      <span className="text-grafito">{t.title}</span>
                      <span className={`font-dp-mono text-[11px] ${overdue ? "text-acento" : "text-concreto"}`}>
                        {overdue ? "vencido" : new Date(t.due_date!).toLocaleDateString("es-EC", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  );
                })}
                {upcomingTasks.length === 0 && <p className="font-dp-sans text-sm text-concreto">Sin próximos hitos.</p>}
              </div>
            </Section>
            <Section title="Documentos recientes">
              <div className="flex flex-col gap-3">
                {recentVersions.map((v) => (
                  <div key={v.id} className="flex justify-between gap-3 font-dp-sans text-[13px]">
                    <span className="truncate text-grafito">{v.docName} — v{v.version}</span>
                    <span className="shrink-0 font-dp-mono text-[11px] text-concreto">{relativeDay(v.created_at)}</span>
                  </div>
                ))}
                {recentVersions.length === 0 && <p className="font-dp-sans text-sm text-concreto">Sin documentos todavía.</p>}
              </div>
            </Section>
          </div>
        </div>
      )}

      {tab === "docs" && (
        <div className="px-12 py-10">
          {docsByCategory.size > 0 && (
            <div className="mb-8 flex flex-wrap gap-x-8 gap-y-2 border-b border-filete pb-6">
              {[...docsByCategory.entries()].map(([category, count]) => (
                <span key={category} className="font-dp-mono text-[10px] uppercase tracking-[0.1em] text-concreto">
                  {DOC_CATEGORY_LABELS[category as keyof typeof DOC_CATEGORY_LABELS]} <span className="text-tinta">{count}</span>
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-col">
            {(documents ?? []).map((doc) => (
              <div key={doc.id} className="border-b border-filete py-4 last:border-0">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-dp-sans text-[13.5px] text-tinta">
                    {doc.name}{" "}
                    <span className="font-dp-mono text-[10.5px] text-concreto">({DOC_CATEGORY_LABELS[doc.category]})</span>
                    {doc.visibility === "client" && (
                      <span className="ml-2.5 font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-acento">
                        Visible para el cliente
                      </span>
                    )}
                  </p>
                </div>
                <ul className="mt-2.5 flex flex-col gap-1.5">
                  {doc.document_versions
                    .sort((a, b) => b.version - a.version)
                    .map((version, vi) => (
                      <li key={version.id} className="flex items-center gap-3 font-dp-sans text-xs text-concreto">
                        <StatusMark tone={vi === 0 ? (version.status === "aprobado" ? "resolved" : "attention") : "historic"} />
                        <span className="flex-1">
                          v{version.version} — {new Date(version.created_at).toLocaleDateString("es-EC")}
                          {version.comment ? ` — ${version.comment}` : ""}
                        </span>
                        <DownloadButton storagePath={version.storage_path} getUrl={getSignedDownloadUrl} />
                      </li>
                    ))}
                </ul>
                <form action={boundUpload} className="mt-3 flex items-center gap-2.5">
                  <input type="hidden" name="document_id" value={doc.id} />
                  <input type="file" name="file" required className="font-dp-sans text-xs text-grafito" />
                  <input name="comment" placeholder="Comentario (opcional)" className={`flex-1 px-2.5 py-1.5 text-xs ${inputClass}`} />
                  <SubmitButton variant="secondary" size="sm" pendingLabel="Subiendo…">
                    Nueva versión
                  </SubmitButton>
                </form>
              </div>
            ))}
            {(documents ?? []).length === 0 && <p className="font-dp-sans text-sm text-concreto">Sin documentos todavía.</p>}
          </div>

          <form action={boundUpload} className="mt-8 grid grid-cols-4 gap-2.5 border-t border-filete pt-8">
            <input name="name" placeholder="Nombre del documento" required className={`col-span-2 ${inputClass}`} />
            <select name="category" className={selectClass}>
              {DOC_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {DOC_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
            <input type="file" name="file" required className="font-dp-sans text-sm text-grafito" />
            <label className="col-span-4 flex items-center gap-2 font-dp-sans text-xs text-grafito">
              <input type="checkbox" name="visible_to_client" value="1" />
              Visible para el cliente en su portal
            </label>
            <SubmitButton variant="secondary" size="sm" pendingLabel="Subiendo…" className="col-span-4 w-fit">
              Subir documento nuevo
            </SubmitButton>
          </form>
        </div>
      )}

      {tab === "tasks" && (
        <div className="px-12 py-10">
          <div className="mb-6 flex justify-end">
            <form action={boundCreateTask} className="flex gap-2.5">
              <input name="title" placeholder="Nueva tarea" required className={inputClass} />
              <select name="phase_id" className={selectClass}>
                <option value="">Sin fase</option>
                {(phases ?? []).map((phase) => (
                  <option key={phase.id} value={phase.id}>
                    {phase.name}
                  </option>
                ))}
              </select>
              <select name="assigned_to" className={selectClass}>
                <option value="">Sin asignar</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              <input name="due_date" type="date" className={inputClass} />
              <SubmitButton variant="secondary" size="sm" pendingLabel="Agregando…">
                Agregar tarea
              </SubmitButton>
            </form>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {TASK_STATUSES.map((status, si) => (
              <div key={status} className={si > 0 ? "lg:border-l lg:border-filete lg:pl-6" : ""}>
                <p className="mb-3 font-dp-mono text-[9.5px] uppercase tracking-[0.12em] text-concreto">
                  {TASK_STATUS_LABELS[status]} · {(tasksByStatus.get(status) ?? []).length}
                </p>
                <div className="flex flex-col gap-2.5">
                  {(tasksByStatus.get(status) ?? []).map((task) => (
                    <div key={task.id} className="border border-filete bg-superficie p-3.5">
                      <div className="mb-2.5 flex items-start justify-between gap-2">
                        <p className="font-dp-sans text-[12.5px] text-tinta">{task.title}</p>
                        {task.profiles && <Avatar name={task.profiles.full_name || task.profiles.email} size={20} />}
                      </div>
                      <div className="flex items-center justify-between">
                        {task.due_date && (
                          <span className="font-dp-mono text-[10.5px] text-concreto">
                            {new Date(task.due_date).toLocaleDateString("es-EC", { day: "numeric", month: "short" })}
                          </span>
                        )}
                        <div className="ml-auto flex items-center gap-2">
                          <StatusSelect
                            action={updateTaskStatus.bind(null, id, task.id)}
                            defaultValue={task.status}
                            options={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABELS[s] }))}
                          />
                          <form action={deleteTask.bind(null, id, task.id)}>
                            <SubmitButton variant="danger" size="sm">
                              ×
                            </SubmitButton>
                          </form>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "gantt" && (
        <div className="px-12 py-10">
          <GanttChart phases={phases ?? []} />
        </div>
      )}

      {tab === "approvals" && (
        <div className="flex flex-col gap-8 px-12 py-10">
          {pendingApprovals.map(({ doc, version }) => (
            <div key={version.id} className="max-w-lg overflow-hidden rounded-2xl border border-filete">
              <div className="dp-grain-strong flex aspect-[16/10] items-center justify-center">
                <span className="font-dp-mono text-xs text-grafito">[ {doc.name} — v{version.version} ]</span>
              </div>
              <div className="p-7">
                <p className="mb-1.5 font-dp-mono text-[9.5px] uppercase tracking-[0.12em] text-concreto">
                  {doc.name} · Versión {version.version}
                </p>
                {version.comment && (
                  <p className="mb-5 font-dp-serif text-lg italic text-grafito">&ldquo;{version.comment}&rdquo;</p>
                )}
                <form action={updateDocumentVersionStatus.bind(null, id, version.id)} className="flex gap-2.5">
                  <SubmitButton size="md" variant="primary" className="flex-1" pendingLabel="Guardando…" name="status" value="aprobado">
                    Aprobar
                  </SubmitButton>
                  <SubmitButton size="md" variant="secondary" className="flex-1" pendingLabel="Guardando…" name="status" value="cambios_solicitados">
                    Solicitar cambios
                  </SubmitButton>
                </form>
              </div>
            </div>
          ))}
          {pendingApprovals.length === 0 && <p className="font-dp-sans text-sm text-concreto">Sin aprobaciones pendientes.</p>}
        </div>
      )}

      {tab === "finance" && (
        <div className="flex flex-col gap-10 px-12 py-10">
          <div className="grid grid-cols-5 gap-4">
            <SummaryStat label="Contratado" value={currency.format(contracted)} />
            <SummaryStat label="Cobrado" value={currency.format(collected)} tone="positive" />
            <SummaryStat label="Pendiente" value={currency.format(pending)} tone="attention" />
            <SummaryStat label="Gastos" value={currency.format(spent)} />
            <SummaryStat label="Margen" value={currency.format(margin)} tone="positive" />
          </div>

          <Section title="Cotizaciones">
            <div className="flex flex-col">
              {(quotes ?? []).map((quote) => {
                const { total } = quoteTotal(quote.quote_items, quote.discount, quote.tax_rate);
                return (
                  <Link
                    key={quote.id}
                    href={`/dashboard/quotes/${quote.id}`}
                    className="flex items-center justify-between gap-3 border-b border-filete py-3.5 font-dp-sans text-[13px] text-tinta last:border-0"
                  >
                    <span className="flex items-center gap-3">
                      Cotización del {new Date(quote.issue_date).toLocaleDateString("es-EC")}
                      <StatusBadge label={QUOTE_STATUS_LABELS[quote.status]} tone={QUOTE_STATUS_TONE[quote.status]} />
                    </span>
                    <span className="font-dp-mono">{currency.format(total)}</span>
                  </Link>
                );
              })}
              {(quotes ?? []).length === 0 && <p className="font-dp-sans text-sm text-concreto">Sin cotizaciones todavía.</p>}
            </div>
            <form action={boundCreateQuote} className="mt-4">
              <SubmitButton variant="secondary" size="sm" pendingLabel="Creando…">
                Nueva cotización
              </SubmitButton>
            </form>
          </Section>

          <Section title="Contratos">
            <div className="flex flex-col">
              {(contracts ?? []).map((contract) => (
                <div key={contract.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-filete py-3.5 last:border-0">
                  <div>
                    <p className="font-dp-mono text-[13px] text-tinta">{currency.format(contract.value)}</p>
                    <p className="mt-1 font-dp-sans text-xs text-concreto">
                      {contract.start_date ?? "sin fecha"} → {contract.end_date ?? "sin fecha"}
                      {contract.payment_terms ? ` — ${contract.payment_terms}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <StatusBadge label={CONTRACT_STATUS_LABELS[contract.status]} tone={CONTRACT_STATUS_TONE[contract.status]} />
                    <StatusSelect
                      action={updateContractStatus.bind(null, id, contract.id)}
                      defaultValue={contract.status}
                      options={CONTRACT_STATUSES.map((status) => ({ value: status, label: CONTRACT_STATUS_LABELS[status] }))}
                    />
                  </div>
                </div>
              ))}
              {(contracts ?? []).length === 0 && <p className="font-dp-sans text-sm text-concreto">Sin contratos todavía.</p>}
            </div>
            <form action={boundCreateContract} className="mt-4 grid grid-cols-4 gap-2.5">
              <input name="value" type="number" step="0.01" placeholder="Valor" required className={inputClass} />
              <input name="start_date" type="date" className={inputClass} />
              <input name="end_date" type="date" className={inputClass} />
              <input name="payment_terms" placeholder="Condiciones de pago" className={inputClass} />
              <SubmitButton variant="secondary" size="sm" pendingLabel="Agregando…" className="col-span-4 w-fit">
                Agregar contrato
              </SubmitButton>
            </form>
          </Section>

          <Section title="Pagos">
            <div className="flex flex-col">
              {(payments ?? []).map((payment) => (
                <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-filete py-3.5 last:border-0">
                  <div>
                    <p className="font-dp-mono text-[13px] text-tinta">{currency.format(payment.amount)}</p>
                    <p className="mt-1 font-dp-sans text-xs text-concreto">
                      Vence {payment.due_date ?? "sin fecha"}
                      {payment.method ? ` — ${payment.method}` : ""}
                      {payment.reference ? ` — ${payment.reference}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <StatusBadge label={PAYMENT_STATUS_LABELS[payment.status]} tone={PAYMENT_STATUS_TONE[payment.status]} />
                    <StatusSelect
                      action={updatePaymentStatus.bind(null, id, payment.id)}
                      defaultValue={payment.status}
                      options={PAYMENT_STATUSES.map((status) => ({ value: status, label: PAYMENT_STATUS_LABELS[status] }))}
                    />
                  </div>
                </div>
              ))}
              {(payments ?? []).length === 0 && <p className="font-dp-sans text-sm text-concreto">Sin pagos todavía.</p>}
            </div>
            <form action={boundCreatePayment} className="mt-4 grid grid-cols-4 gap-2.5">
              <input name="amount" type="number" step="0.01" placeholder="Monto" required className={inputClass} />
              <input name="due_date" type="date" className={inputClass} />
              <input name="method" placeholder="Método" className={inputClass} />
              <input name="reference" placeholder="Referencia" className={inputClass} />
              <SubmitButton variant="secondary" size="sm" pendingLabel="Agregando…" className="col-span-4 w-fit">
                Agregar pago
              </SubmitButton>
            </form>
          </Section>

          <Section title="Gastos">
            <div className="flex flex-col">
              {(expenses ?? []).map((expense) => (
                <div key={expense.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-filete py-3.5 last:border-0">
                  <div>
                    <p className="font-dp-mono text-[13px] text-tinta">
                      {currency.format(expense.amount)}{" "}
                      <span className="font-dp-sans text-xs text-concreto">({EXPENSE_CATEGORY_LABELS[expense.category]})</span>
                    </p>
                    <p className="mt-1 font-dp-sans text-xs text-concreto">
                      {expense.date}
                      {expense.supplier ? ` — ${expense.supplier}` : ""}
                      {expense.description ? ` — ${expense.description}` : ""}
                    </p>
                  </div>
                  <form action={deleteExpense.bind(null, id, expense.id)}>
                    <SubmitButton variant="danger" size="sm">
                      Eliminar
                    </SubmitButton>
                  </form>
                </div>
              ))}
              {(expenses ?? []).length === 0 && <p className="font-dp-sans text-sm text-concreto">Sin gastos todavía.</p>}
            </div>
            <form action={boundCreateExpense} className="mt-4 grid grid-cols-4 gap-2.5">
              <input name="amount" type="number" step="0.01" placeholder="Monto" required className={inputClass} />
              <select name="category" className={selectClass}>
                {EXPENSE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {EXPENSE_CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
              <input name="date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
              <input name="supplier" placeholder="Proveedor" className={inputClass} />
              <input name="description" placeholder="Descripción" className={`col-span-4 ${inputClass}`} />
              <SubmitButton variant="secondary" size="sm" pendingLabel="Agregando…" className="col-span-4 w-fit">
                Agregar gasto
              </SubmitButton>
            </form>
          </Section>

          <Section title="Fases">
            <div className="flex flex-col">
              {(phases ?? []).map((phase) => (
                <div key={phase.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-filete py-3.5 last:border-0">
                  <div>
                    <p className="font-dp-sans text-[13px] text-tinta">{phase.name}</p>
                    <p className="mt-1 font-dp-mono text-[10.5px] text-concreto">
                      {phase.start_date ?? "sin fecha"} → {phase.end_date ?? "sin fecha"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <StatusSelect
                      action={updatePhaseStatus.bind(null, id, phase.id)}
                      defaultValue={phase.status}
                      options={PHASE_STATUSES.map((status) => ({ value: status, label: PHASE_STATUS_LABELS[status] }))}
                    />
                    <form action={deletePhase.bind(null, id, phase.id)}>
                      <SubmitButton variant="danger" size="sm">
                        Eliminar
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              ))}
              {(phases ?? []).length === 0 && <p className="font-dp-sans text-sm text-concreto">Sin fases todavía.</p>}
            </div>
            <form action={boundCreatePhase} className="mt-4 grid grid-cols-4 gap-2.5">
              <input name="name" placeholder="Nombre de la fase" required className={`col-span-2 ${inputClass}`} />
              <input name="start_date" type="date" className={inputClass} />
              <input name="end_date" type="date" className={inputClass} />
              <SubmitButton variant="secondary" size="sm" pendingLabel="Agregando…" className="col-span-4 w-fit">
                Agregar fase
              </SubmitButton>
            </form>
          </Section>

          <Section title="Acceso del cliente al portal">
            <div className="flex flex-col gap-2.5">
              {(portalAccess ?? []).map((access) => (
                <div key={access.id} className="flex items-center justify-between font-dp-sans text-[13px]">
                  <span className="text-grafito">{access.email}</span>
                  <form action={revokePortalAccess.bind(null, id, access.id)}>
                    <SubmitButton variant="danger" size="sm">
                      Quitar acceso
                    </SubmitButton>
                  </form>
                </div>
              ))}
              {(portalAccess ?? []).length === 0 && <p className="font-dp-sans text-sm text-concreto">El cliente todavía no tiene acceso al portal.</p>}
            </div>
            <p className="mt-4 font-dp-sans text-[12px] text-concreto">
              Crea la cuenta del cliente acá — nunca se auto-registra nadie. Vas a ver la contraseña inicial una sola
              vez para copiarla y entregársela por fuera del sistema.
            </p>
            <PortalAccessForm action={boundInvitePortal} defaultEmail={project.clients?.email ?? ""} />
          </Section>

          <Section title="Editar información" className="max-w-xl">
            <ProjectForm action={boundUpdate} clients={clients ?? []} defaultValues={project} />
          </Section>
        </div>
      )}

      {tab === "activity" && (
        <div className="px-12 py-10">
          <form action={boundAddNote} className="flex gap-2.5">
            <input name="body" placeholder="Agregar una nota…" className={`flex-1 ${inputClass}`} />
            <SubmitButton variant="secondary" pendingLabel="Agregando…">
              Agregar
            </SubmitButton>
          </form>
          <ul className="mt-6 flex flex-col">
            {(activity ?? []).map((item) => (
              <li key={item.id} className="border-b border-filete py-3.5 last:border-0">
                <p className="font-dp-sans text-[13px] text-grafito">{item.body}</p>
                <p className="mt-1.5 font-dp-mono text-[10.5px] text-concreto">{new Date(item.created_at).toLocaleString("es-EC")}</p>
              </li>
            ))}
            {(activity ?? []).length === 0 && <li className="font-dp-sans text-sm text-concreto">Sin actividad todavía.</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

function isCurrentPhase(phases: Phase[], index: number) {
  const firstIncomplete = phases.findIndex((p) => p.status !== "completada");
  return firstIncomplete === index;
}

function PhaseRow({ phase, isCurrent }: { phase: Phase; isCurrent: boolean }) {
  const done = phase.status === "completada";
  const textColor = isCurrent ? "text-tinta" : done ? "text-grafito" : "text-concreto";

  return (
    <div className="flex items-center gap-3.5 border-b border-filete py-3 last:border-0">
      <StatusMark tone={done ? "resolved" : isCurrent ? "attention" : "pending"} />
      <span className={`flex-1 font-dp-sans text-[13px] ${textColor}`}>{phase.name}</span>
      <span className="font-dp-mono text-[10.5px] text-concreto">
        {phase.start_date ? new Date(phase.start_date).toLocaleDateString("es-EC", { month: "short", year: "numeric" }) : "—"}
      </span>
    </div>
  );
}

function SummaryStat({ label, value, tone }: { label: string; value: string; tone?: "positive" | "attention" }) {
  const toneClass = tone === "positive" ? "text-verde" : tone === "attention" ? "text-acento" : "text-tinta";
  return (
    <div className="dp-card p-6 text-center">
      <p className="font-dp-mono text-[9.5px] uppercase tracking-[0.12em] text-concreto">{label}</p>
      <p className={`mt-2.5 font-dp-mono text-lg ${toneClass}`}>{value}</p>
    </div>
  );
}
