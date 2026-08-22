import type { Metadata } from "next";
import SheetHeader from "@/components/dashboard/sheet-header";
import Sidebar from "@/components/dashboard/sidebar";
import { dpFontVars } from "@/lib/dp-fonts";

export const metadata: Metadata = {
  title: "ARCHI.OS",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const dateLabel = new Date().toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" }).replace(/\//g, ".");

  return (
    <div className={`dp-scope ${dpFontVars} min-h-dvh bg-papel font-dp-sans text-tinta print:block`}>
      <div className="print:hidden">
        <SheetHeader dateLabel={dateLabel} />
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
