import type { Metadata } from "next";
import Sidebar from "@/components/dashboard/sidebar";

export const metadata: Metadata = {
  title: "ARCHI.OS",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  return (
    <div className="flex min-h-dvh bg-hueso">
      <Sidebar />
      <main className="flex-1 overflow-x-hidden px-8 py-8">{children}</main>
    </div>
  );
}
