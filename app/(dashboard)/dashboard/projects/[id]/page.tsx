import Link from "next/link";
import { notFound } from "next/navigation";
import GanttChart from "@/components/dashboard/gantt-chart";
import ProjectForm from "@/components/dashboard/project-form";
import StatusSelect from "@/components/dashboard/status-select";
import DownloadButton from "@/components/dashboard/download-button";
import Section from "@/components/dashboard/ui/section";
import StatusBadge from "@/components/dashboard/ui/status-badge";
import SubmitButton from "@/components/dashboard/ui/submit-button";
import { inputClass, selectClass } from "@/components/dashboard/ui/styles";
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
  type Task,
} from "@/lib/supabase/types";
import { addProjectNote, updateProject, updateProjectStatus } from "../actions";
import {
  createPhase,
  createTask,
  deletePhase,
  deleteTask,
  invitePortalAccess,
  revokePortalAccess,
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

export default async function ProjectDetailPage(
  props: PageProps<"/dashboard/projects/[id]">,
) {
  const { id } = await props.params;
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
  ] = await Promise.all([
      supabase.from("projects").select("*, clients(id, name, email)").eq("id", id).maybeSingle(),
      supabase.from("clients").select("id, name").order("name"),
      supabase.from("phases").select("*").eq("project_id", id).order("position"),
      supabase.from("tasks").select("*").eq("project_id", id).order("created_at"),
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

  const tasksByPhase = new Map<string | null, Task[]>();
  for (const task of tasks ?? []) {
    const key = task.phase_id;
    tasksByPhase.set(key, [...(tasksByPhase.get(key) ?? []), task]);
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-carbon/50">
            {project.clients?.name}
          </p>
          <h1 className="font-display text-2xl text-carbon">{project.name}</h1>
        </div>
        <StatusSelect
          action={boundUpdateStatus}
          defaultValue={project.status}
          options={PROJECT_STATUSES.map((status) => ({
            value: status,
            label: PROJECT_STATUS_LABELS[status],
          }))}
        />
      </div>

      {/* Resumen financiero */}
      <Section title="Resumen financiero">
        <div className="grid grid-cols-5 gap-4 text-center">
          <SummaryStat label="Contratado" value={currency.format(contracted)} />
          <SummaryStat label="Cobrado" value={currency.format(collected)} />
          <SummaryStat label="Pendiente" value={currency.format(pending)} />
          <SummaryStat label="Gastos" value={currency.format(spent)} />
          <SummaryStat label="Margen" value={currency.format(margin)} />
        </div>
      </Section>

      {/* Cronograma */}
      <Section title="Cronograma">
        <GanttChart phases={phases ?? []} />
      </Section>

      {/* Cotizaciones */}
      <Section title="Cotizaciones">
        <div className="flex flex-col gap-3">
          {(quotes ?? []).map((quote) => {
            const { total } = quoteTotal(quote.quote_items, quote.discount, quote.tax_rate);
            return (
              <Link
                key={quote.id}
                href={`/dashboard/quotes/${quote.id}`}
                className="flex items-center justify-between gap-3 border-b border-carbon/5 pb-3 text-sm transition-colors duration-100 last:border-0 hover:text-naranja"
              >
                <span className="flex items-center gap-2">
                  Cotización del {new Date(quote.issue_date).toLocaleDateString("es-EC")}
                  <StatusBadge label={QUOTE_STATUS_LABELS[quote.status]} tone={QUOTE_STATUS_TONE[quote.status]} />
                </span>
                <span className="font-mono font-medium">{currency.format(total)}</span>
              </Link>
            );
          })}
          {(quotes ?? []).length === 0 && (
            <p className="text-sm text-carbon/40">Sin cotizaciones todavía.</p>
          )}
        </div>
        <form action={boundCreateQuote} className="mt-4">
          <SubmitButton variant="secondary" size="sm" pendingLabel="Creando…">
            Nueva cotización
          </SubmitButton>
        </form>
      </Section>

      {/* Contratos */}
      <Section title="Contratos">
        <div className="flex flex-col gap-3">
          {(contracts ?? []).map((contract) => (
            <div
              key={contract.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-carbon/5 pb-3 last:border-0"
            >
              <div>
                <p className="font-mono text-sm font-medium text-carbon">{currency.format(contract.value)}</p>
                <p className="text-xs text-carbon/50">
                  {contract.start_date ?? "sin fecha"} → {contract.end_date ?? "sin fecha"}
                  {contract.payment_terms ? ` — ${contract.payment_terms}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge
                  label={CONTRACT_STATUS_LABELS[contract.status]}
                  tone={CONTRACT_STATUS_TONE[contract.status]}
                />
                <StatusSelect
                  action={updateContractStatus.bind(null, id, contract.id)}
                  defaultValue={contract.status}
                  options={CONTRACT_STATUSES.map((status) => ({
                    value: status,
                    label: CONTRACT_STATUS_LABELS[status],
                  }))}
                />
              </div>
            </div>
          ))}
          {(contracts ?? []).length === 0 && (
            <p className="text-sm text-carbon/40">Sin contratos todavía.</p>
          )}
        </div>
        <form action={boundCreateContract} className="mt-4 grid grid-cols-4 gap-2">
          <input name="value" type="number" step="0.01" placeholder="Valor" required className={inputClass} />
          <input name="start_date" type="date" className={inputClass} />
          <input name="end_date" type="date" className={inputClass} />
          <input name="payment_terms" placeholder="Condiciones de pago" className={inputClass} />
          <SubmitButton variant="secondary" size="sm" pendingLabel="Agregando…" className="col-span-4 w-fit">
            Agregar contrato
          </SubmitButton>
        </form>
      </Section>

      {/* Pagos */}
      <Section title="Pagos">
        <div className="flex flex-col gap-3">
          {(payments ?? []).map((payment) => (
            <div
              key={payment.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-carbon/5 pb-3 last:border-0"
            >
              <div>
                <p className="font-mono text-sm font-medium text-carbon">{currency.format(payment.amount)}</p>
                <p className="text-xs text-carbon/50">
                  Vence {payment.due_date ?? "sin fecha"}
                  {payment.method ? ` — ${payment.method}` : ""}
                  {payment.reference ? ` — ${payment.reference}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge
                  label={PAYMENT_STATUS_LABELS[payment.status]}
                  tone={PAYMENT_STATUS_TONE[payment.status]}
                />
                <StatusSelect
                  action={updatePaymentStatus.bind(null, id, payment.id)}
                  defaultValue={payment.status}
                  options={PAYMENT_STATUSES.map((status) => ({
                    value: status,
                    label: PAYMENT_STATUS_LABELS[status],
                  }))}
                />
              </div>
            </div>
          ))}
          {(payments ?? []).length === 0 && (
            <p className="text-sm text-carbon/40">Sin pagos todavía.</p>
          )}
        </div>
        <form action={boundCreatePayment} className="mt-4 grid grid-cols-4 gap-2">
          <input name="amount" type="number" step="0.01" placeholder="Monto" required className={inputClass} />
          <input name="due_date" type="date" className={inputClass} />
          <input name="method" placeholder="Método" className={inputClass} />
          <input name="reference" placeholder="Referencia" className={inputClass} />
          <SubmitButton variant="secondary" size="sm" pendingLabel="Agregando…" className="col-span-4 w-fit">
            Agregar pago
          </SubmitButton>
        </form>
      </Section>

      {/* Gastos */}
      <Section title="Gastos">
        <div className="flex flex-col gap-3">
          {(expenses ?? []).map((expense) => (
            <div
              key={expense.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-carbon/5 pb-3 last:border-0"
            >
              <div>
                <p className="font-mono text-sm font-medium text-carbon">
                  {currency.format(expense.amount)}{" "}
                  <span className="font-sans text-xs font-normal text-carbon/40">
                    ({EXPENSE_CATEGORY_LABELS[expense.category]})
                  </span>
                </p>
                <p className="text-xs text-carbon/50">
                  {expense.date}
                  {expense.supplier ? ` — ${expense.supplier}` : ""}
                  {expense.description ? ` — ${expense.description}` : ""}
                </p>
              </div>
              <form action={deleteExpense.bind(null, id, expense.id)}>
                <SubmitButton variant="danger" size="sm" className="normal-case tracking-normal">
                  Eliminar
                </SubmitButton>
              </form>
            </div>
          ))}
          {(expenses ?? []).length === 0 && (
            <p className="text-sm text-carbon/40">Sin gastos todavía.</p>
          )}
        </div>
        <form action={boundCreateExpense} className="mt-4 grid grid-cols-4 gap-2">
          <input name="amount" type="number" step="0.01" placeholder="Monto" required className={inputClass} />
          <select name="category" className={selectClass}>
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {EXPENSE_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
          <input
            name="date"
            type="date"
            required
            defaultValue={new Date().toISOString().slice(0, 10)}
            className={inputClass}
          />
          <input name="supplier" placeholder="Proveedor" className={inputClass} />
          <input name="description" placeholder="Descripción" className={`col-span-4 ${inputClass}`} />
          <SubmitButton variant="secondary" size="sm" pendingLabel="Agregando…" className="col-span-4 w-fit">
            Agregar gasto
          </SubmitButton>
        </form>
      </Section>

      {/* Fases */}
      <Section title="Fases">
        <div className="flex flex-col gap-3">
          {(phases ?? []).map((phase) => (
            <div
              key={phase.id}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-carbon/5 pb-3 last:border-0"
            >
              <div>
                <p className="text-sm font-medium text-carbon">{phase.name}</p>
                <p className="font-mono text-xs text-carbon/50">
                  {phase.start_date ?? "sin fecha"} → {phase.end_date ?? "sin fecha"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusSelect
                  action={updatePhaseStatus.bind(null, id, phase.id)}
                  defaultValue={phase.status}
                  options={PHASE_STATUSES.map((status) => ({
                    value: status,
                    label: PHASE_STATUS_LABELS[status],
                  }))}
                />
                <form action={deletePhase.bind(null, id, phase.id)}>
                  <SubmitButton variant="danger" size="sm" className="normal-case tracking-normal">
                    Eliminar
                  </SubmitButton>
                </form>
              </div>
            </div>
          ))}
          {(phases ?? []).length === 0 && (
            <p className="text-sm text-carbon/40">Sin fases todavía.</p>
          )}
        </div>

        <form action={boundCreatePhase} className="mt-4 grid grid-cols-4 gap-2">
          <input name="name" placeholder="Nombre de la fase" required className={`col-span-2 ${inputClass}`} />
          <input name="start_date" type="date" className={inputClass} />
          <input name="end_date" type="date" className={inputClass} />
          <SubmitButton variant="secondary" size="sm" pendingLabel="Agregando…" className="col-span-4 w-fit">
            Agregar fase
          </SubmitButton>
        </form>
      </Section>

      {/* Tareas */}
      <Section title="Tareas">
        <div className="flex flex-col gap-4">
          {(phases ?? []).map((phase) => (
            <TaskGroup
              key={phase.id}
              title={phase.name}
              tasks={tasksByPhase.get(phase.id) ?? []}
              projectId={id}
            />
          ))}
          <TaskGroup title="Sin fase" tasks={tasksByPhase.get(null) ?? []} projectId={id} />
        </div>

        <form action={boundCreateTask} className="mt-4 grid grid-cols-4 gap-2">
          <input name="title" placeholder="Nueva tarea" required className={`col-span-2 ${inputClass}`} />
          <select name="phase_id" className={selectClass}>
            <option value="">Sin fase</option>
            {(phases ?? []).map((phase) => (
              <option key={phase.id} value={phase.id}>
                {phase.name}
              </option>
            ))}
          </select>
          <input name="due_date" type="date" className={inputClass} />
          <SubmitButton variant="secondary" size="sm" pendingLabel="Agregando…" className="col-span-4 w-fit">
            Agregar tarea
          </SubmitButton>
        </form>
      </Section>

      {/* Documentos */}
      <Section title="Documentos">
        <div className="flex flex-col gap-4">
          {(documents ?? []).map((doc) => (
            <div key={doc.id} className="border-b border-carbon/5 pb-3 last:border-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-carbon">
                  {doc.name}{" "}
                  <span className="text-xs font-normal text-carbon/40">
                    ({DOC_CATEGORY_LABELS[doc.category]})
                  </span>
                  {doc.visibility === "client" && (
                    <span className="ml-2 border border-naranja/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-naranja">
                      Visible para el cliente
                    </span>
                  )}
                </p>
              </div>
              <ul className="mt-1 flex flex-col gap-1">
                {doc.document_versions
                  .sort((a, b) => b.version - a.version)
                  .map((version) => (
                    <li
                      key={version.id}
                      className="flex items-center justify-between text-xs text-carbon/60"
                    >
                      <span>
                        v{version.version} —{" "}
                        {new Date(version.created_at).toLocaleDateString("es-EC")}
                        {version.comment ? ` — ${version.comment}` : ""}
                      </span>
                      <DownloadButton storagePath={version.storage_path} />
                    </li>
                  ))}
              </ul>
              <form action={boundUpload} className="mt-2 flex items-center gap-2">
                <input type="hidden" name="document_id" value={doc.id} />
                <input type="file" name="file" required className="text-xs" />
                <input
                  name="comment"
                  placeholder="Comentario (opcional)"
                  className={`flex-1 px-2 py-1 text-xs ${inputClass}`}
                />
                <SubmitButton variant="secondary" size="sm" pendingLabel="Subiendo…">
                  Nueva versión
                </SubmitButton>
              </form>
            </div>
          ))}
          {(documents ?? []).length === 0 && (
            <p className="text-sm text-carbon/40">Sin documentos todavía.</p>
          )}
        </div>

        <form action={boundUpload} className="mt-4 grid grid-cols-4 gap-2">
          <input name="name" placeholder="Nombre del documento" required className={`col-span-2 ${inputClass}`} />
          <select name="category" className={selectClass}>
            {DOC_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {DOC_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
          <input type="file" name="file" required className="text-sm" />
          <label className="col-span-4 flex items-center gap-2 text-xs text-carbon/70">
            <input type="checkbox" name="visible_to_client" value="1" />
            Visible para el cliente en su portal
          </label>
          <SubmitButton variant="secondary" size="sm" pendingLabel="Subiendo…" className="col-span-4 w-fit">
            Subir documento nuevo
          </SubmitButton>
        </form>
      </Section>

      {/* Acceso al portal del cliente */}
      <Section title="Acceso del cliente al portal">
        <div className="flex flex-col gap-2">
          {(portalAccess ?? []).map((access) => (
            <div key={access.id} className="flex items-center justify-between text-sm">
              <span className="text-carbon/80">{access.email}</span>
              <form action={revokePortalAccess.bind(null, id, access.id)}>
                <SubmitButton variant="danger" size="sm" className="normal-case tracking-normal">
                  Quitar acceso
                </SubmitButton>
              </form>
            </div>
          ))}
          {(portalAccess ?? []).length === 0 && (
            <p className="text-sm text-carbon/40">
              El cliente todavía no tiene acceso al portal.
            </p>
          )}
        </div>
        <form action={boundInvitePortal} className="mt-4 flex gap-2">
          <input
            name="email"
            type="email"
            required
            defaultValue={project.clients?.email ?? ""}
            placeholder="email@cliente.com"
            className={`flex-1 ${inputClass}`}
          />
          <SubmitButton variant="secondary" pendingLabel="Invitando…">
            Invitar
          </SubmitButton>
        </form>
      </Section>

      {/* Editar información */}
      <Section title="Editar información">
        <ProjectForm action={boundUpdate} clients={clients ?? []} defaultValues={project} />
      </Section>

      {/* Actividad */}
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

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-carbon/40">{label}</p>
      <p className="mt-1 font-mono text-lg font-medium text-carbon">{value}</p>
    </div>
  );
}

function TaskGroup({
  title,
  tasks,
  projectId,
}: {
  title: string;
  tasks: Task[];
  projectId: string;
}) {
  if (tasks.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-xs uppercase tracking-wide text-carbon/40">{title}</p>
      <div className="flex flex-col gap-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="flex flex-wrap items-center justify-between gap-2 border-b border-carbon/5 pb-2 last:border-0"
          >
            <div>
              <p className="text-sm text-carbon">{task.title}</p>
              {task.due_date && (
                <p className="font-mono text-xs text-carbon/40">
                  Vence {new Date(task.due_date).toLocaleDateString("es-EC")}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <StatusSelect
                action={updateTaskStatus.bind(null, projectId, task.id)}
                defaultValue={task.status}
                options={TASK_STATUSES.map((status) => ({
                  value: status,
                  label: TASK_STATUS_LABELS[status],
                }))}
              />
              <form action={deleteTask.bind(null, projectId, task.id)}>
                <SubmitButton variant="danger" size="sm" className="normal-case tracking-normal">
                  Eliminar
                </SubmitButton>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
