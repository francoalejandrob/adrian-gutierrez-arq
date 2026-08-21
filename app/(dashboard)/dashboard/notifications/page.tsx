import { createClient } from "@/lib/supabase/server";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

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
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-carbon">Notificaciones</h1>
        {unreadCount > 0 && (
          <form action={markAllNotificationsRead}>
            <button
              type="submit"
              className="cursor-pointer border border-carbon px-4 py-2 text-xs uppercase tracking-wide text-carbon transition-colors hover:bg-carbon hover:text-white"
            >
              Marcar todas como leídas
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 border border-carbon/10 bg-white">
        {(notifications ?? []).map((notification) => (
          <div
            key={notification.id}
            className={`flex items-start justify-between gap-4 border-b border-carbon/5 p-4 last:border-0 ${
              notification.read_at ? "" : "bg-naranja/5"
            }`}
          >
            <div>
              <p className="text-sm font-medium text-carbon">{notification.title}</p>
              {notification.body && (
                <p className="mt-1 text-sm text-carbon/60">{notification.body}</p>
              )}
              <p className="mt-1 text-xs text-carbon/40">
                {new Date(notification.created_at).toLocaleString("es-EC")}
              </p>
            </div>
            {!notification.read_at && (
              <form action={markNotificationRead.bind(null, notification.id)}>
                <button
                  type="submit"
                  className="cursor-pointer whitespace-nowrap text-xs text-carbon/40 hover:text-naranja"
                >
                  Marcar leída
                </button>
              </form>
            )}
          </div>
        ))}
        {(notifications ?? []).length === 0 && (
          <p className="p-4 text-sm text-carbon/40">Sin notificaciones todavía.</p>
        )}
      </div>
    </div>
  );
}
