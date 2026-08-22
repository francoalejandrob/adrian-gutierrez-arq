import { getLeadsToContact, getOverdueTasks, getPendingPayments } from "@/lib/ai/tools";
import { createClient } from "@/lib/supabase/server";
import AiChat from "./chat";

export default async function AiPage() {
  const supabase = await createClient();
  const [overdueTasks, leadsToContact, pendingPayments, { count: pendingApprovals }] = await Promise.all([
    getOverdueTasks(supabase),
    getLeadsToContact(supabase),
    getPendingPayments(supabase),
    supabase.from("document_versions").select("*", { count: "exact", head: true }).eq("status", "enviado"),
  ]);

  const suggestions = [
    overdueTasks.length > 0 && `Revisar ${overdueTasks.length} tarea${overdueTasks.length === 1 ? "" : "s"} atrasada${overdueTasks.length === 1 ? "" : "s"}`,
    leadsToContact.length > 0 && `Contactar ${leadsToContact.length} lead${leadsToContact.length === 1 ? "" : "s"} sin seguimiento`,
    pendingPayments.length > 0 && `Revisar ${pendingPayments.length} pago${pendingPayments.length === 1 ? "" : "s"} pendiente${pendingPayments.length === 1 ? "" : "s"}`,
    (pendingApprovals ?? 0) > 0 && `Revisar ${pendingApprovals} aprobación${pendingApprovals === 1 ? "" : "es"} pendiente${pendingApprovals === 1 ? "" : "s"}`,
  ].filter((s): s is string => Boolean(s));

  return (
    <div className="max-w-2xl">
      <p className="mb-2.5 text-[11px] uppercase tracking-[0.09em] text-naranja-oscuro">Archi AI</p>
      <h1 className="font-display text-[28px] font-medium text-carbon">¿Cómo puedo ayudarte hoy?</h1>

      <div className="mt-8">
        <AiChat suggestions={suggestions} />
      </div>
    </div>
  );
}
