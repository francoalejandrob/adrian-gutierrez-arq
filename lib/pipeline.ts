import { LEAD_STATUSES, LEAD_STATUS_LABELS, type Lead, type LeadStatus } from "@/lib/supabase/types";

export type PipelineStage = {
  status: LeadStatus;
  label: string;
  count: number;
  value: number;
};

// Shared by the dashboard home "Pipeline" panel and the CRM Pipeline tab
// — same computation (leads grouped by status, valued by estimated_value),
// factored out once instead of duplicated in both pages.
export function computePipeline(leads: Pick<Lead, "status" | "estimated_value">[]): PipelineStage[] {
  return LEAD_STATUSES.map((status) => {
    const inStage = leads.filter((l) => l.status === status);
    return {
      status,
      label: LEAD_STATUS_LABELS[status],
      count: inStage.length,
      value: inStage.reduce((sum, l) => sum + (l.estimated_value ?? 0), 0),
    };
  });
}
