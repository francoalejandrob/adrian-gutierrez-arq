"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentOrganizationId } from "@/lib/supabase/org";
import { applyPhaseTemplate } from "@/lib/phase-templates";
import { EXPENSE_CATEGORIES, PAYMENT_STATUSES, QUOTE_STATUSES } from "@/lib/supabase/types";

const dateOrNull = z
  .string()
  .optional()
  .transform((v) => (v ? v : null));
const numberOrZero = z
  .string()
  .optional()
  .transform((v) => (v ? Number(v) : 0));

// Quotes ------------------------------------------------------------------

async function insertQuote(projectId: string, formData: FormData) {
  const validUntil = dateOrNull.parse(formData.get("valid_until") ?? undefined);
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada");

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({ organization_id: organizationId, project_id: projectId, valid_until: validUntil, notes })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  return quote.id;
}

export async function createQuote(projectId: string, formData: FormData) {
  const quoteId = await insertQuote(projectId, formData);
  revalidatePath(`/dashboard/projects/${projectId}`);
  redirect(`/dashboard/quotes/${quoteId}`);
}

// Para crear una cotización desde /dashboard/quotes (sin estar ya
// parado en la ficha de un proyecto) — el proyecto viene del propio
// formulario (un <select>) en vez de estar pre-atado con .bind().
export async function createQuoteForProject(formData: FormData) {
  const projectId = String(formData.get("project_id") ?? "").trim();
  if (!projectId) throw new Error("Selecciona un proyecto");

  const quoteId = await insertQuote(projectId, formData);
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/quotes");
  redirect(`/dashboard/quotes/${quoteId}`);
}

const quoteItemSchema = z.object({
  description: z.string().trim().min(1, "Describe el ítem"),
  quantity: z.string().transform((v) => Number(v) || 1),
  unit_price: z.string().transform((v) => Number(v) || 0),
});

export async function addQuoteItem(quoteId: string, formData: FormData) {
  const parsed = quoteItemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const supabase = await createClient();
  const { count } = await supabase
    .from("quote_items")
    .select("*", { count: "exact", head: true })
    .eq("quote_id", quoteId);

  const { error } = await supabase
    .from("quote_items")
    .insert({ quote_id: quoteId, position: count ?? 0, ...parsed.data });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/quotes/${quoteId}`);
}

export async function deleteQuoteItem(quoteId: string, itemId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("quote_items").delete().eq("id", itemId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/quotes/${quoteId}`);
}

const quoteMetaSchema = z.object({
  discount: numberOrZero,
  tax_rate: numberOrZero,
  valid_until: dateOrNull,
  notes: z.string().trim().optional(),
});

export async function updateQuoteMeta(quoteId: string, formData: FormData) {
  const parsed = quoteMetaSchema.parse(Object.fromEntries(formData));
  const supabase = await createClient();
  const { error } = await supabase
    .from("quotes")
    .update({ ...parsed, updated_at: new Date().toISOString() })
    .eq("id", quoteId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/quotes/${quoteId}`);
}

const quoteStatusSchema = z.enum(QUOTE_STATUSES as [string, ...string[]]);

export async function updateQuoteStatus(projectId: string, quoteId: string, formData: FormData) {
  const status = quoteStatusSchema.parse(formData.get("status"));

  const supabase = await createClient();
  const { error } = await supabase
    .from("quotes")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", quoteId);
  if (error) throw new Error(error.message);

  if (status === "accepted") {
    await runAcceptedQuoteAutomation(supabase, projectId);
  }

  revalidatePath(`/dashboard/quotes/${quoteId}`);
  revalidatePath(`/dashboard/projects/${projectId}`);
}

// Exportada para que lib/ai/tools.ts (updateQuoteStatusTool) dispare
// exactamente la misma automatización cuando la cotización se acepta
// desde el chat de Archi AI en vez de desde esta UI — antes solo pasaba
// acá, así que aceptar una cotización por chat no creaba las fases.
export async function runAcceptedQuoteAutomation(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
) {
  const { data: project } = await supabase.from("projects").select("status").eq("id", projectId).maybeSingle();
  if (!project) return;

  await applyPhaseTemplate(supabase, projectId);

  if (project.status === "planning") {
    await supabase.from("projects").update({ status: "design" }).eq("id", projectId);
  }
}

// Contracts ---------------------------------------------------------------

const contractSchema = z.object({
  value: z.string().transform((v) => Number(v) || 0),
  start_date: dateOrNull,
  end_date: dateOrNull,
  payment_terms: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function createContract(projectId: string, formData: FormData) {
  const parsed = contractSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada");

  const { error } = await supabase
    .from("contracts")
    .insert({ organization_id: organizationId, project_id: projectId, ...parsed.data });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}`);
}

export async function updateContractStatus(projectId: string, contractId: string, formData: FormData) {
  const status = z
    .enum(["draft", "active", "completed", "cancelled"])
    .parse(formData.get("status"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("contracts")
    .update({ status, signed_at: status === "active" ? new Date().toISOString() : undefined })
    .eq("id", contractId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}`);
}

// Payments ---------------------------------------------------------------

const paymentSchema = z.object({
  amount: z.string().transform((v) => Number(v) || 0),
  due_date: dateOrNull,
  method: z.string().trim().optional(),
  reference: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export async function createPayment(projectId: string, formData: FormData) {
  const parsed = paymentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada");

  const { error } = await supabase
    .from("payments")
    .insert({ organization_id: organizationId, project_id: projectId, ...parsed.data });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/finance");
}

const paymentStatusSchema = z.enum(PAYMENT_STATUSES as [string, ...string[]]);

export async function updatePaymentStatus(projectId: string, paymentId: string, formData: FormData) {
  const status = paymentStatusSchema.parse(formData.get("status"));
  const supabase = await createClient();
  const { error } = await supabase
    .from("payments")
    .update({ status, paid_date: status === "pagada" ? new Date().toISOString().slice(0, 10) : null })
    .eq("id", paymentId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/finance");
}

// Expenses ---------------------------------------------------------------

const expenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES as [string, ...string[]]),
  amount: z.string().transform((v) => Number(v) || 0),
  date: z.string().min(1),
  description: z.string().trim().optional(),
  supplier: z.string().trim().optional(),
});

export async function createExpense(projectId: string, formData: FormData) {
  const parsed = expenseSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const supabase = await createClient();
  const organizationId = await getCurrentOrganizationId(supabase);
  if (!organizationId) throw new Error("Sin organización asociada");

  const { error } = await supabase
    .from("expenses")
    .insert({ organization_id: organizationId, project_id: projectId, ...parsed.data });
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/finance");
}

export async function deleteExpense(projectId: string, expenseId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
  if (error) throw new Error(error.message);

  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard/finance");
}
