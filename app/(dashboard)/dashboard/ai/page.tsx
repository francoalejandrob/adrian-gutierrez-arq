import { Sparkles } from "lucide-react";
import { getLeadsToContact, getOverdueTasks, getPendingPayments } from "@/lib/ai/tools";
import { createClient } from "@/lib/supabase/server";
import AiChat from "./chat";

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

export default async function AiPage() {
  const supabase = await createClient();
  const [overdueTasks, leadsToContact, pendingPayments, { count: pendingApprovals }, { data: rawPayments }] =
    await Promise.all([
      getOverdueTasks(supabase),
      getLeadsToContact(supabase),
      getPendingPayments(supabase),
      supabase.from("document_versions").select("*", { count: "exact", head: true }).eq("status", "enviado"),
      supabase.from("payments").select("amount, status, projects(name, clients(name))").in("status", ["pendiente", "vencida"]),
    ]);

  const suggestions = [
    overdueTasks.length > 0 && {
      label: `Revisar ${overdueTasks.length} tarea${overdueTasks.length === 1 ? "" : "s"} atrasada${overdueTasks.length === 1 ? "" : "s"}`,
      href: "/dashboard/projects",
    },
    leadsToContact.length > 0 && {
      label: `Contactar ${leadsToContact.length} lead${leadsToContact.length === 1 ? "" : "s"} sin seguimiento`,
      href: "/dashboard/crm?tab=leads",
    },
    pendingPayments.length > 0 && {
      label: `Revisar ${pendingPayments.length} pago${pendingPayments.length === 1 ? "" : "s"} pendiente${pendingPayments.length === 1 ? "" : "s"}`,
      href: "/dashboard/finance",
    },
    (pendingApprovals ?? 0) > 0 && {
      label: `Revisar ${pendingApprovals} aprobación${pendingApprovals === 1 ? "" : "es"} pendiente${pendingApprovals === 1 ? "" : "s"}`,
      href: "/dashboard/projects",
    },
  ].filter((s): s is { label: string; href: string } => Boolean(s));

  const today = new Date().toISOString().slice(0, 10);
  const mostOverdueTask = overdueTasks[0]
    ? {
        title: overdueTasks[0].title,
        project: overdueTasks[0].project,
        days: Math.floor((new Date(today).getTime() - new Date(overdueTasks[0].due_date!).getTime()) / 86400000),
      }
    : null;

  const topPendingPayment = (rawPayments ?? []).sort((a, b) => b.amount - a.amount)[0] ?? null;

  const signals = [
    mostOverdueTask && {
      label: "Tarea más atrasada",
      value: mostOverdueTask.title,
      detail: `${mostOverdueTask.project ?? "Sin proyecto"} · ${mostOverdueTask.days} día${mostOverdueTask.days === 1 ? "" : "s"} de retraso`,
    },
    topPendingPayment && {
      label: "Mayor pendiente de cobro",
      value: currency.format(topPendingPayment.amount),
      detail: `${topPendingPayment.projects?.clients?.name ?? "—"} — ${topPendingPayment.projects?.name ?? "—"}`,
    },
  ].filter((s): s is { label: string; value: string; detail: string } => Boolean(s));

  return (
    <div className="px-12 py-10">
      <p className="mb-3 font-dp-mono text-[10px] uppercase tracking-[0.16em] text-concreto">Inteligencia · Archi AI</p>
      <div className="flex items-center gap-3.5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-azul/10 text-azul">
          <Sparkles size={18} strokeWidth={1.75} aria-hidden="true" />
        </span>
        <h1 className="font-dp-serif text-[38px] leading-none tracking-[-0.015em] text-tinta">¿Cómo puedo ayudarte hoy?</h1>
      </div>

      {(suggestions.length > 0 || signals.length > 0) && (
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          {suggestions.length > 0 && (
            <div className="dp-card p-7">
              <p className="mb-4 font-dp-mono text-[9.5px] uppercase tracking-[0.13em] text-concreto">Archi responde</p>
              <div className="flex flex-col">
                {suggestions.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    className="flex items-center justify-between gap-4 border-b border-filete py-3.5 font-dp-sans text-[13px] text-tinta last:border-0 hover:text-acento"
                  >
                    {s.label}
                    <span className="font-dp-mono text-[11px] text-concreto">Ejecutar →</span>
                  </a>
                ))}
              </div>
            </div>
          )}
          {signals.length > 0 && (
            <div className="dp-card p-7">
              <p className="mb-4 font-dp-mono text-[9.5px] uppercase tracking-[0.13em] text-concreto">Señales detectadas</p>
              <div className="flex flex-col">
                {signals.map((s) => (
                  <div key={s.label} className="border-b border-filete py-3.5 last:border-0">
                    <p className="font-dp-mono text-[9.5px] uppercase tracking-[0.1em] text-concreto">{s.label}</p>
                    <p className="mt-1.5 font-dp-sans text-[13px] text-tinta">{s.value}</p>
                    <p className="mt-0.5 font-dp-sans text-[11.5px] text-concreto">{s.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-10 border-t border-filete pt-10">
        <AiChat />
      </div>
    </div>
  );
}
