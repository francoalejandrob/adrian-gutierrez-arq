import type { Metadata } from "next";
import SheetHeader from "@/components/dashboard/sheet-header";
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
    <div className={`dp-scope ${dpFontVars} min-h-dvh bg-papel font-dp-sans text-tinta print:block`}>
      <div className="print:hidden">
        <SheetHeader dateLabel={dateLabel} unreadCount={unreadCount ?? 0} />
      </div>
      <div className="flex items-start">
        <div className="print:hidden">
          <Sidebar />
        </div>
        <main className="min-w-0 flex-1 print:p-0">{children}</main>
      </div>
    </div>
  );
}
