import { Bell, CheckCircle2, MessageSquare, UserPlus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import EmptyState from "@/components/dashboard/ui/empty-state";
import PageHeader from "@/components/dashboard/ui/page-header";
import SubmitButton from "@/components/dashboard/ui/submit-button";
import { createClient } from "@/lib/supabase/server";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

const ATTENTION_TYPES = new Set(["lead.created", "message.received"]);

const TYPE_ICON: Record<string, LucideIcon> = {
  "lead.created": UserPlus,
  "message.received": MessageSquare,
  "document.responded": CheckCircle2,
  "quote.responded": CheckCircle2,
};

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  const unreadCount = (notifications ?? []).filter((n) => !n.read_at).length;

  return (
    <div>
      <PageHeader
        eyebrow="Sistema"
        title="Notificaciones"
        action={
          unreadCount > 0 && (
            <form action={markAllNotificationsRead}>
              <SubmitButton variant="secondary" size="sm" pendingLabel="Marcando…">
                Marcar todas como leídas
              </SubmitButton>
            </form>
          )
        }
      />

      {(notifications ?? []).length > 0 ? (
        <div>
          {(notifications ?? []).map((notification) => {
            const Icon = TYPE_ICON[notification.type] ?? Bell;
            const unread = !notification.read_at;
            const attention = unread && ATTENTION_TYPES.has(notification.type);
            return (
            <div key={notification.id} className="flex items-start gap-4 border-b border-filete px-12 py-5 last:border-0">
              <span
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  attention ? "bg-acento/10 text-acento" : unread ? "bg-azul/10 text-azul" : "bg-concreto/10 text-concreto"
                }`}
              >
                <Icon size={15} strokeWidth={1.75} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={`font-dp-sans text-[14px] ${notification.read_at ? "text-grafito" : "text-tinta"}`}>
                  {notification.title}
                </p>
                {notification.body && <p className="mt-1 font-dp-sans text-[13px] text-concreto">{notification.body}</p>}
                <p className="mt-2 font-dp-mono text-[10.5px] text-concreto">
                  {new Date(notification.created_at).toLocaleString("es-EC")}
                </p>
              </div>
              {!notification.read_at && (
                <form action={markNotificationRead.bind(null, notification.id)} className="shrink-0">
                  <SubmitButton variant="tertiary" size="sm">
                    Marcar leída
                  </SubmitButton>
                </form>
              )}
            </div>
            );
          })}
        </div>
      ) : (
        <EmptyState icon={Bell} title="Sin notificaciones todavía" />
      )}
    </div>
  );
}
