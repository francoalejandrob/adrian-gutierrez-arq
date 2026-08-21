import type { Database } from "./database.types";
import type { StatusTone } from "@/components/dashboard/ui/status-badge";

export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type LeadInsert = Database["public"]["Tables"]["leads"]["Insert"];
export type LeadStatus = Lead["status"];

export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];

export type ActivityLog = Database["public"]["Tables"]["activity_log"]["Row"];

export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectInsert = Database["public"]["Tables"]["projects"]["Insert"];
export type ProjectStatus = Project["status"];
export type ProjectCategory = NonNullable<Project["category"]>;

export type Phase = Database["public"]["Tables"]["phases"]["Row"];
export type PhaseInsert = Database["public"]["Tables"]["phases"]["Insert"];
export type PhaseStatus = Phase["status"];

export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskStatus = Task["status"];
export type TaskPriority = Task["priority"];

export type Doc = Database["public"]["Tables"]["documents"]["Row"];
export type DocCategory = Doc["category"];
export type DocVisibility = Doc["visibility"];
export type DocVersion = Database["public"]["Tables"]["document_versions"]["Row"];
export type DocVersionStatus = DocVersion["status"];

export type PortalAccess = Database["public"]["Tables"]["portal_access"]["Row"];

export type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export type Quote = Database["public"]["Tables"]["quotes"]["Row"];
export type QuoteStatus = Quote["status"];
export type QuoteItem = Database["public"]["Tables"]["quote_items"]["Row"];

export type Contract = Database["public"]["Tables"]["contracts"]["Row"];
export type ContractStatus = Contract["status"];

export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type PaymentStatus = Payment["status"];

export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type ExpenseCategory = Expense["category"];

export const QUOTE_STATUSES: QuoteStatus[] = [
  "draft",
  "sent",
  "negotiation",
  "accepted",
  "rejected",
  "expired",
];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: "Borrador",
  sent: "Enviada",
  negotiation: "En negociación",
  accepted: "Aceptada",
  rejected: "Rechazada",
  expired: "Expirada",
};

export const QUOTE_STATUS_TONE: Record<QuoteStatus, StatusTone> = {
  draft: "neutral",
  sent: "info",
  negotiation: "warning",
  accepted: "success",
  rejected: "danger",
  expired: "neutral",
};

export const CONTRACT_STATUSES: ContractStatus[] = ["draft", "active", "completed", "cancelled"];

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  draft: "Borrador",
  active: "Activo",
  completed: "Completado",
  cancelled: "Cancelado",
};

export const CONTRACT_STATUS_TONE: Record<ContractStatus, StatusTone> = {
  draft: "neutral",
  active: "info",
  completed: "success",
  cancelled: "danger",
};

export const PAYMENT_STATUSES: PaymentStatus[] = ["pendiente", "pagada", "vencida"];

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pendiente: "Pendiente",
  pagada: "Pagada",
  vencida: "Vencida",
};

export const PAYMENT_STATUS_TONE: Record<PaymentStatus, StatusTone> = {
  pendiente: "warning",
  pagada: "success",
  vencida: "danger",
};

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "materiales",
  "mano_obra",
  "permisos",
  "subcontrato",
  "otro",
];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  materiales: "Materiales",
  mano_obra: "Mano de obra",
  permisos: "Permisos",
  subcontrato: "Subcontrato",
  otro: "Otro",
};

export function quoteTotal(items: Pick<QuoteItem, "quantity" | "unit_price">[], discount: number, taxRate: number) {
  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const afterDiscount = subtotal - discount;
  const tax = afterDiscount * (taxRate / 100);
  return { subtotal, tax, total: afterDiscount + tax };
}

export const PROJECT_STATUSES: ProjectStatus[] = [
  "planning",
  "design",
  "documentation",
  "permits",
  "construction",
  "supervision",
  "delivery",
  "completed",
  "on_hold",
  "cancelled",
];

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  planning: "Planificación",
  design: "Diseño",
  documentation: "Documentación",
  permits: "Permisos",
  construction: "Construcción",
  supervision: "Supervisión",
  delivery: "Entrega",
  completed: "Completado",
  on_hold: "En pausa",
  cancelled: "Cancelado",
};

export const PROJECT_STATUS_TONE: Record<ProjectStatus, StatusTone> = {
  planning: "neutral",
  design: "info",
  documentation: "info",
  permits: "warning",
  construction: "warning",
  supervision: "warning",
  delivery: "info",
  completed: "success",
  on_hold: "warning",
  cancelled: "danger",
};

export const PROJECT_CATEGORIES: ProjectCategory[] = [
  "Residencial",
  "Comercial",
  "Institucional",
  "Hospitalidad",
  "Remodelación",
];

export const PHASE_STATUSES: PhaseStatus[] = ["pendiente", "en_progreso", "completada"];

export const PHASE_STATUS_LABELS: Record<PhaseStatus, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completada: "Completada",
};

export const PHASE_STATUS_TONE: Record<PhaseStatus, StatusTone> = {
  pendiente: "neutral",
  en_progreso: "info",
  completada: "success",
};

export const TASK_STATUSES: TaskStatus[] = ["backlog", "todo", "in_progress", "review", "completed"];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "Por hacer",
  in_progress: "En progreso",
  review: "En revisión",
  completed: "Completada",
};

export const TASK_STATUS_TONE: Record<TaskStatus, StatusTone> = {
  backlog: "neutral",
  todo: "neutral",
  in_progress: "info",
  review: "warning",
  completed: "success",
};

export const TASK_PRIORITIES: TaskPriority[] = ["low", "medium", "high", "critical"];

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
};

export const DOC_CATEGORIES: DocCategory[] = [
  "contrato",
  "plano",
  "render",
  "presupuesto",
  "reporte",
  "aprobacion",
  "entrega_final",
  "otro",
];

export const DOC_CATEGORY_LABELS: Record<DocCategory, string> = {
  contrato: "Contrato",
  plano: "Plano",
  render: "Render",
  presupuesto: "Presupuesto",
  reporte: "Reporte",
  aprobacion: "Aprobación",
  entrega_final: "Entrega final",
  otro: "Otro",
};

export const DOC_VERSION_STATUS_LABELS: Record<DocVersionStatus, string> = {
  borrador: "Borrador",
  enviado: "Enviado",
  aprobado: "Aprobado",
  cambios_solicitados: "Cambios solicitados",
};

export const DOC_VERSION_STATUS_TONE: Record<DocVersionStatus, StatusTone> = {
  borrador: "neutral",
  enviado: "info",
  aprobado: "success",
  cambios_solicitados: "warning",
};

export const LEAD_STATUSES: LeadStatus[] = [
  "nuevo",
  "contactado",
  "propuesta",
  "negociacion",
  "ganado",
  "perdido",
];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  propuesta: "Propuesta",
  negociacion: "Negociación",
  ganado: "Ganado",
  perdido: "Perdido",
};

export const LEAD_STATUS_TONE: Record<LeadStatus, StatusTone> = {
  nuevo: "info",
  contactado: "neutral",
  propuesta: "warning",
  negociacion: "warning",
  ganado: "success",
  perdido: "danger",
};
