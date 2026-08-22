import Link from "next/link";
import { FileSignature } from "lucide-react";
import EmptyState from "@/components/dashboard/ui/empty-state";
import PageHeader from "@/components/dashboard/ui/page-header";
import StatusBadge from "@/components/dashboard/ui/status-badge";
import { createClient } from "@/lib/supabase/server";
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_TONE } from "@/lib/supabase/types";

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

export default async function ContractsPage() {
  const supabase = await createClient();
  const { data: contracts } = await supabase
    .from("contracts")
    .select("*, projects(id, name, clients(name))")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader title="Contratos" description="Todos los contratos, en cualquier proyecto." />

      {(contracts ?? []).length > 0 ? (
        <div className="mt-6 overflow-x-auto rounded-[10px] border border-carbon/[0.08] bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-carbon/[0.08] text-[11px] uppercase tracking-wide text-carbon/40">
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Proyecto</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Firmado</th>
                <th className="px-4 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {(contracts ?? []).map((contract) => (
                <tr key={contract.id} className="border-b border-carbon/5 transition-colors duration-100 last:border-0 hover:bg-hueso/60">
                  <td className="px-4 py-3">
                    <Link
                      href={`/dashboard/projects/${contract.project_id}?tab=finance`}
                      className="font-medium text-carbon hover:text-naranja-oscuro hover:underline"
                    >
                      {contract.projects?.clients?.name ?? "—"}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-carbon/60">{contract.projects?.name ?? "—"}</td>
                  <td className="px-4 py-3 font-mono">{currency.format(contract.value)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-carbon/50">
                    {contract.signed_at ? new Date(contract.signed_at).toLocaleDateString("es-EC") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge label={CONTRACT_STATUS_LABELS[contract.status]} tone={CONTRACT_STATUS_TONE[contract.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-6 rounded-[10px] border border-carbon/[0.08] bg-white">
          <EmptyState
            icon={FileSignature}
            title="Todavía no hay contratos"
            description="Creá uno desde la ficha de un proyecto, en la pestaña Finanzas."
          />
        </div>
      )}
    </div>
  );
}
