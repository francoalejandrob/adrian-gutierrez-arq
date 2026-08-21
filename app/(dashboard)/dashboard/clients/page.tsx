import Link from "next/link";
import { Briefcase, Plus } from "lucide-react";
import { buttonClass } from "@/components/dashboard/ui/button";
import EmptyState from "@/components/dashboard/ui/empty-state";
import PageHeader from "@/components/dashboard/ui/page-header";
import { createClient } from "@/lib/supabase/server";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Clientes"
        action={
          <Link href="/dashboard/clients/new" className={buttonClass("primary", "md")}>
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            Nuevo cliente
          </Link>
        }
      />

      <div className="mt-6 overflow-x-auto border border-carbon/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-carbon/10 text-xs uppercase tracking-wide text-carbon/50">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Empresa</th>
              <th className="px-4 py-3">Cliente desde</th>
            </tr>
          </thead>
          <tbody>
            {(clients ?? []).map((client) => (
              <tr
                key={client.id}
                className="border-b border-carbon/5 transition-colors duration-100 last:border-0 hover:bg-hueso/60"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="font-medium text-carbon hover:text-naranja hover:underline"
                  >
                    {client.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-carbon/70">{client.email || "—"}</td>
                <td className="px-4 py-3 text-carbon/70">{client.company || "—"}</td>
                <td className="px-4 py-3 font-mono text-xs text-carbon/50">
                  {new Date(client.created_at).toLocaleDateString("es-EC")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(clients ?? []).length === 0 && (
          <EmptyState
            icon={Briefcase}
            title="Todavía no hay clientes"
            description="Convertí un lead ganado o creá un cliente directamente."
            action={
              <Link href="/dashboard/clients/new" className={buttonClass("secondary", "sm")}>
                Crear el primero
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}
