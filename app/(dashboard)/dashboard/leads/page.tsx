import Link from "next/link";
import { Plus, Target } from "lucide-react";
import { buttonClass } from "@/components/dashboard/ui/button";
import EmptyState from "@/components/dashboard/ui/empty-state";
import PageHeader from "@/components/dashboard/ui/page-header";
import StatusBadge from "@/components/dashboard/ui/status-badge";
import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUS_LABELS, LEAD_STATUS_TONE, LEAD_STATUSES, type LeadStatus } from "@/lib/supabase/types";

export default async function LeadsPage(
  props: PageProps<"/dashboard/leads">,
) {
  const searchParams = await props.searchParams;
  const statusFilter = Array.isArray(searchParams.status)
    ? searchParams.status[0]
    : searchParams.status;

  const supabase = await createClient();
  let query = supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (statusFilter && (LEAD_STATUSES as string[]).includes(statusFilter)) {
    query = query.eq("status", statusFilter);
  }

  const { data: leads } = await query;

  return (
    <div>
      <PageHeader
        title="Leads"
        action={
          <Link href="/dashboard/leads/new" className={buttonClass("primary", "md")}>
            <Plus size={16} strokeWidth={2} aria-hidden="true" />
            Nuevo lead
          </Link>
        }
      />

      <div className="mt-6 flex flex-wrap gap-2">
        <FilterPill href="/dashboard/leads" label="Todos" active={!statusFilter} />
        {LEAD_STATUSES.map((status) => (
          <FilterPill
            key={status}
            href={`/dashboard/leads?status=${status}`}
            label={LEAD_STATUS_LABELS[status]}
            active={statusFilter === status}
          />
        ))}
      </div>

      <div className="mt-6 overflow-x-auto border border-carbon/10 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-carbon/10 text-xs uppercase tracking-wide text-carbon/50">
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Contacto</th>
              <th className="px-4 py-3">Ubicación</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Creado</th>
            </tr>
          </thead>
          <tbody>
            {(leads ?? []).map((lead) => (
              <tr
                key={lead.id}
                className="border-b border-carbon/5 transition-colors duration-100 last:border-0 hover:bg-hueso/60"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/leads/${lead.id}`}
                    className="font-medium text-carbon hover:text-naranja hover:underline"
                  >
                    {lead.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-carbon/70">{lead.email}</td>
                <td className="px-4 py-3 text-carbon/70">{lead.location || "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge
                    label={LEAD_STATUS_LABELS[lead.status as LeadStatus]}
                    tone={LEAD_STATUS_TONE[lead.status as LeadStatus]}
                  />
                </td>
                <td className="px-4 py-3 font-mono text-xs text-carbon/50">
                  {new Date(lead.created_at).toLocaleDateString("es-EC")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(leads ?? []).length === 0 && (
          <EmptyState
            icon={Target}
            title="Todavía no hay leads"
            description="Los leads que lleguen desde el sitio web o que cargues manualmente aparecerán aquí."
            action={
              <Link href="/dashboard/leads/new" className={buttonClass("secondary", "sm")}>
                Crear el primero
              </Link>
            }
          />
        )}
      </div>
    </div>
  );
}

function FilterPill({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-3 py-1.5 text-xs uppercase tracking-wide transition-colors duration-150 ${
        active
          ? "bg-carbon text-white"
          : "border border-carbon/20 text-carbon/60 hover:border-carbon hover:text-carbon"
      }`}
    >
      {label}
    </Link>
  );
}
