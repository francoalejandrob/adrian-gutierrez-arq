import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUS_LABELS, LEAD_STATUSES, type LeadStatus } from "@/lib/supabase/types";

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
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-carbon">Leads</h1>
        <Link
          href="/dashboard/leads/new"
          className="cursor-pointer bg-carbon px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Nuevo lead
        </Link>
      </div>

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
              <tr key={lead.id} className="border-b border-carbon/5 last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/dashboard/leads/${lead.id}`}
                    className="font-medium text-carbon hover:underline"
                  >
                    {lead.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-carbon/70">{lead.email}</td>
                <td className="px-4 py-3 text-carbon/70">{lead.location || "—"}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={lead.status as LeadStatus} />
                </td>
                <td className="px-4 py-3 text-carbon/50">
                  {new Date(lead.created_at).toLocaleDateString("es-EC")}
                </td>
              </tr>
            ))}
            {(leads ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-carbon/50">
                  Todavía no hay leads.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
      className={`px-3 py-1.5 text-xs uppercase tracking-wide transition-colors ${
        active
          ? "bg-carbon text-white"
          : "border border-carbon/20 text-carbon/60 hover:border-carbon hover:text-carbon"
      }`}
    >
      {label}
    </Link>
  );
}

function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className="inline-block border border-carbon/15 px-2 py-0.5 text-xs text-carbon/70">
      {LEAD_STATUS_LABELS[status]}
    </span>
  );
}
