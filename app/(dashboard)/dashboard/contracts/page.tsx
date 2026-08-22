import Link from "next/link";
import EmptyState from "@/components/dashboard/ui/empty-state";
import PageHeader from "@/components/dashboard/ui/page-header";
import StatusLabel from "@/components/dashboard/ui/status-label";
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
      <PageHeader eyebrow="Comercial · Todos los contratos, en cualquier proyecto" title="Contratos" />

      {(contracts ?? []).length > 0 ? (
        <div>
          <div className="grid grid-cols-[1.6fr_1.6fr_1fr_1fr_1fr] gap-4 border-b border-filete px-12 py-3 font-dp-mono text-[9.5px] uppercase tracking-[0.13em] text-concreto">
            <span>Cliente</span>
            <span>Proyecto</span>
            <span>Valor</span>
            <span>Firmado</span>
            <span>Estado</span>
          </div>
          {(contracts ?? []).map((contract, i) => (
            <Link
              key={contract.id}
              href={`/dashboard/projects/${contract.project_id}?tab=finance`}
              className="grid grid-cols-[1.6fr_1.6fr_1fr_1fr_1fr] items-center gap-4 border-b border-filete px-12 py-4 transition-colors duration-100 hover:bg-[#EDEBE4]"
            >
              <span className="flex items-baseline gap-3 font-dp-sans text-[13.5px] text-tinta">
                <span className="font-dp-mono text-[10px] text-concreto">{String(i + 1).padStart(2, "0")}</span>
                {contract.projects?.clients?.name ?? "—"}
              </span>
              <span className="truncate font-dp-sans text-[12.5px] text-grafito">{contract.projects?.name ?? "—"}</span>
              <span className="font-dp-mono text-[12.5px] text-tinta">{currency.format(contract.value)}</span>
              <span className="font-dp-mono text-[11px] text-concreto">
                {contract.signed_at ? new Date(contract.signed_at).toLocaleDateString("es-EC") : "—"}
              </span>
              <StatusLabel label={CONTRACT_STATUS_LABELS[contract.status]} tone={CONTRACT_STATUS_TONE[contract.status]} />
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Todavía no hay contratos"
          description="Creá uno desde la ficha de un proyecto, en la pestaña Finanzas."
        />
      )}
    </div>
  );
}
