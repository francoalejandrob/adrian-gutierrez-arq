import type { Metadata } from "next";
import { portalSignOut } from "../auth-actions";

export const metadata: Metadata = {
  title: "Portal de cliente — ARCHI.OS",
  robots: { index: false, follow: false },
};

export default function PortalAuthenticatedLayout({ children }: LayoutProps<"/portal">) {
  return (
    <div className="min-h-dvh bg-hueso">
      <header className="flex items-center justify-between border-b border-carbon/10 bg-white px-6 py-4">
        <p className="font-display text-lg text-carbon">Adrián Gutiérrez — Portal</p>
        <form action={portalSignOut}>
          <button
            type="submit"
            className="cursor-pointer text-xs uppercase tracking-wide text-carbon/50 hover:text-carbon"
          >
            Cerrar sesión
          </button>
        </form>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
    </div>
  );
}
