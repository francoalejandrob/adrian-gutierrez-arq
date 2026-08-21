import type { Database } from "./database.types";

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
export type DocVersion = Database["public"]["Tables"]["document_versions"]["Row"];
export type DocVersionStatus = DocVersion["status"];

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

export const TASK_STATUSES: TaskStatus[] = ["backlog", "todo", "in_progress", "review", "completed"];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "Por hacer",
  in_progress: "En progreso",
  review: "En revisión",
  completed: "Completada",
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
