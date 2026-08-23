import Link from "next/link";
import { FileSignature } from "lucide-react";
import EmptyState from "@/components/dashboard/ui/empty-state";
import PageHeader from "@/components/dashboard/ui/page-header";
import StatusBadge from "@/components/dashboard/ui/status-badge";
import SubmitButton from "@/components/dashboard/ui/submit-button";
import { inputClass, selectClass } from "@/components/dashboard/ui/styles";
import { createClient } from "@/lib/supabase/server";
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_TONE } from "@/lib/supabase/types";
import { createContractForProject } from "../projects/[id]/finance-actions";

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });

export default async function ContractsPage() {
  const supabase = await createClient();
  const [{ data: contracts }, { data: projects }] = await Promise.all([
    supabase.from("contracts").select("*, projects(id, name, clients(name))").order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name, clients(name)").order("name"),
  ]);

  const newContractForm = (projects ?? []).length > 0 && (
    <form action={createContractForProject} className="flex flex-wrap items-center gap-2.5">
      <select name="project_id" required defaultValue="" className={selectClass}>
        <option value="" disabled>
          Elegí un proyecto…
        </option>
        {(projects ?? []).map((project) => (
          <option key={project.id} value={project.id}>
            {project.clients?.name ? `${project.clients.name} — ${project.name}` : project.name}
          </option>
        ))}
      </select>
      <input name="value" type="number" step="0.01" placeholder="Valor" required className={inputClass} />
      <SubmitButton variant="primary" size="md" pendingLabel="Creando…">
        Nuevo contrato
      </SubmitButton>
    </form>
  );

  return (
    <div>
      <PageHeader
        eyebrow="Comercial · Todos los contratos, en cualquier proyecto"
        title="Contratos"
        action={newContractForm || undefined}
      />

      {(contracts ?? []).length > 0 ? (
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[1.6fr_1.6fr_1fr_1fr_1fr] gap-4 border-b border-filete px-5 py-3 font-dp-mono text-[9.5px] uppercase tracking-[0.13em] text-concreto sm:px-12">
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
                className="grid grid-cols-[1.6fr_1.6fr_1fr_1fr_1fr] items-center gap-4 border-b border-filete px-5 py-4 transition-colors duration-100 hover:bg-realce sm:px-12"
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
                <StatusBadge label={CONTRACT_STATUS_LABELS[contract.status]} tone={CONTRACT_STATUS_TONE[contract.status]} />
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={FileSignature}
          title="Todavía no hay contratos"
          description={
            newContractForm
              ? "Elegí un proyecto y un valor para crear el primero."
              : "Creá primero un proyecto — los contratos van ligados a uno."
          }
          action={newContractForm || undefined}
        />
      )}
    </div>
  );
}
