import { Bell } from "lucide-react";
import EmptyState from "@/components/dashboard/ui/empty-state";
import PageHeader from "@/components/dashboard/ui/page-header";
import SubmitButton from "@/components/dashboard/ui/submit-button";
import { createClient } from "@/lib/supabase/server";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

const TYPE_DOT: Record<string, string> = {
  "lead.created": "bg-naranja-oscuro",
  "document.responded": "bg-[#3a7a56]",
  "quote.responded": "bg-[#3a7a56]",
  "message.received": "bg-naranja-oscuro",
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
    <div className="max-w-2xl">
      <PageHeader
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
        <div className="mt-8 flex flex-col">
          {(notifications ?? []).map((notification) => (
            <div key={notification.id} className="flex items-start gap-3.5 border-b border-carbon/[0.07] py-4 last:border-0">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TYPE_DOT[notification.type] ?? "bg-piedra"}`} />
              <div className="min-w-0 flex-1">
                <p className={`text-[14px] ${notification.read_at ? "text-carbon/70" : "font-medium text-carbon"}`}>
                  {notification.title}
                </p>
                {notification.body && <p className="mt-1 text-[13px] text-carbon/55">{notification.body}</p>}
                <p className="mt-1.5 font-mono text-[11.5px] text-carbon/40">
                  {new Date(notification.created_at).toLocaleString("es-EC")}
                </p>
              </div>
              {!notification.read_at && (
                <form action={markNotificationRead.bind(null, notification.id)} className="shrink-0">
                  <SubmitButton variant="ghost" size="sm">
                    Marcar leída
                  </SubmitButton>
                </form>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-[10px] border border-carbon/[0.08] bg-white">
          <EmptyState icon={Bell} title="Sin notificaciones todavía" />
        </div>
      )}
    </div>
  );
}
