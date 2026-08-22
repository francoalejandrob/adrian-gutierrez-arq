import EmptyState from "@/components/dashboard/ui/empty-state";
import PageHeader from "@/components/dashboard/ui/page-header";
import StatusMark from "@/components/dashboard/ui/status-mark";
import SubmitButton from "@/components/dashboard/ui/submit-button";
import { createClient } from "@/lib/supabase/server";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

const ATTENTION_TYPES = new Set(["lead.created", "message.received"]);

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
          {(notifications ?? []).map((notification) => (
            <div key={notification.id} className="flex items-start gap-4 border-b border-filete px-12 py-5 last:border-0">
              <span className="mt-1.5 shrink-0">
                <StatusMark tone={notification.read_at ? "historic" : ATTENTION_TYPES.has(notification.type) ? "attention" : "pending"} />
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
          ))}
        </div>
      ) : (
        <EmptyState title="Sin notificaciones todavía" />
      )}
    </div>
  );
}
