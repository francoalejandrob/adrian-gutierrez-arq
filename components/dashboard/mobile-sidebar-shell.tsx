"use client";

import type { ReactNode } from "react";
import { useSidebar } from "./sidebar-context";

// Envuelve al Sidebar (Server Component) para darle comportamiento de
// drawer off-canvas en mobile sin convertirlo en client component: el
// estado abierto/cerrado vive acá, el contenido real sigue siendo el
// mismo `<Sidebar />` renderizado en el servidor.
export default function MobileSidebarShell({ children }: { children: ReactNode }) {
  const { open, close } = useSidebar();

  return (
    <>
      {open && (
        <div onClick={close} aria-hidden="true" className="fixed inset-0 z-40 bg-papel/60 md:hidden" />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 transition-transform duration-200 md:static md:z-auto md:translate-x-0 print:hidden ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {children}
      </div>
    </>
  );
}
