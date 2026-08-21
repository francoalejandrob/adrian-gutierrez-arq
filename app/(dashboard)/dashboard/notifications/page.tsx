import { Bell, FileCheck, MessageSquare, Target, type LucideIcon } from "lucide-react";
import EmptyState from "@/components/dashboard/ui/empty-state";
import PageHeader from "@/components/dashboard/ui/page-header";
import SubmitButton from "@/components/dashboard/ui/submit-button";
import { createClient } from "@/lib/supabase/server";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

const TYPE_ICONS: Record<string, LucideIcon> = {
  "lead.created": Target,
  "document.responded": FileCheck,
  "quote.responded": FileCheck,
  "message.received": MessageSquare,
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
    <div className="max-w-3xl">
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

      <div className="mt-6 border border-carbon/10 bg-white">
        {(notifications ?? []).map((notification) => {
          const Icon = TYPE_ICONS[notification.type] ?? Bell;
          return (
            <div
              key={notification.id}
              className={`flex items-start gap-3 border-b border-carbon/5 p-4 transition-colors duration-100 last:border-0 ${
                notification.read_at ? "" : "bg-naranja/5"
              }`}
            >
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border ${
                  notification.read_at ? "border-carbon/10 text-carbon/30" : "border-naranja/30 text-naranja"
                }`}
              >
                <Icon size={15} strokeWidth={1.75} aria-hidden="true" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-carbon">{notification.title}</p>
                {notification.body && (
                  <p className="mt-1 text-sm text-carbon/60">{notification.body}</p>
                )}
                <p className="mt-1 font-mono text-xs text-carbon/40">
                  {new Date(notification.created_at).toLocaleString("es-EC")}
                </p>
              </div>
              {!notification.read_at && (
                <form action={markNotificationRead.bind(null, notification.id)} className="shrink-0">
                  <SubmitButton variant="ghost" size="sm" className="normal-case tracking-normal">
                    Marcar leída
                  </SubmitButton>
                </form>
              )}
            </div>
          );
        })}
        {(notifications ?? []).length === 0 && (
          <EmptyState icon={Bell} title="Sin notificaciones todavía" />
        )}
      </div>
    </div>
  );
}
