import type { Metadata } from "next";
import "@/app/dp-view-transition.css";
import FloatingAssistant from "@/components/dashboard/floating-assistant";
import MobileSidebarShell from "@/components/dashboard/mobile-sidebar-shell";
import SheetHeader from "@/components/dashboard/sheet-header";
import { SidebarProvider } from "@/components/dashboard/sidebar-context";
import Sidebar from "@/components/dashboard/sidebar";
import { dpFontVars } from "@/lib/dp-fonts";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "ARCHI.OS",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const dateLabel = new Date().toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, ".");

  const supabase = await createClient();
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .is("read_at", null);

  return (
    <SidebarProvider>
      <div className={`dp-scope ${dpFontVars} flex h-dvh flex-col overflow-hidden bg-papel font-dp-sans text-tinta print:block print:h-auto`}>
        <div className="shrink-0 print:hidden">
          <SheetHeader dateLabel={dateLabel} unreadCount={unreadCount ?? 0} />
        </div>
        {/* Shell de altura fija: sidebar y main tienen cada uno su propio
            overflow-y-auto, así que scrollear uno nunca mueve al otro —
            antes dependía de que `sticky` se comportara bien sobre un
            documento que scrolleaba entero, y en la práctica no siempre
            lo hacía. En mobile, MobileSidebarShell saca al sidebar del
            flujo (fixed, fuera de pantalla) hasta que se abre el drawer. */}
        <div className="flex min-h-0 flex-1 items-stretch print:block print:h-auto">
          <MobileSidebarShell>
            <Sidebar />
          </MobileSidebarShell>
          <main className="h-full min-w-0 flex-1 overflow-y-auto print:h-auto print:overflow-visible print:p-0">
            {children}
          </main>
        </div>
        <div className="print:hidden">
          <FloatingAssistant />
        </div>
      </div>
    </SidebarProvider>
  );
}
