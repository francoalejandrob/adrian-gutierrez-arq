import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: clients } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-carbon">Clientes</h1>
        <Link
          href="/dashboard/clients/new"
          className="cursor-pointer bg-carbon px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Nuevo cliente
        </Link>
      </div>

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
              <tr key={client.id} className="border-b border-carbon/5 last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/clients/${client.id}`}
                    className="font-medium text-carbon hover:underline"
                  >
                    {client.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-carbon/70">{client.email || "—"}</td>
                <td className="px-4 py-3 text-carbon/70">{client.company || "—"}</td>
                <td className="px-4 py-3 text-carbon/50">
                  {new Date(client.created_at).toLocaleDateString("es-EC")}
                </td>
              </tr>
            ))}
            {(clients ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-carbon/50">
                  Todavía no hay clientes.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
