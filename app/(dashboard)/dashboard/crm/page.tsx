import Link from "next/link";
import { Briefcase, Plus, Target } from "lucide-react";
import { buttonClass } from "@/components/dashboard/ui/button";
import EmptyState from "@/components/dashboard/ui/empty-state";
import PageHeader from "@/components/dashboard/ui/page-header";
import StatusBadge from "@/components/dashboard/ui/status-badge";
import { initials } from "@/lib/format";
import { computePipeline } from "@/lib/pipeline";
import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUS_LABELS, LEAD_STATUS_TONE, LEAD_STATUSES, type Lead, type LeadStatus } from "@/lib/supabase/types";

const currency = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export default async function CrmPage(props: PageProps<"/dashboard/crm">) {
  const searchParams = await props.searchParams;
  const tab = (Array.isArray(searchParams.tab) ? searchParams.tab[0] : searchParams.tab) || "leads";
  const view = (Array.isArray(searchParams.view) ? searchParams.view[0] : searchParams.view) || "table";
  const statusFilter = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status;

  const supabase = await createClient();

  return (
    <div>
      <PageHeader
        title="CRM"
        action={
          tab === "leads" ? (
            <Link href="/dashboard/leads/new" className={buttonClass("primary", "md")}>
              <Plus size={16} strokeWidth={2} aria-hidden="true" />
              Nuevo lead
            </Link>
          ) : tab === "clientes" ? (
            <Link href="/dashboard/clients/new" className={buttonClass("primary", "md")}>
              <Plus size={16} strokeWidth={2} aria-hidden="true" />
              Nuevo cliente
            </Link>
          ) : undefined
        }
      />

      <div className="mt-5 flex gap-6 border-b border-carbon/[0.1]">
        <CrmTab href="/dashboard/crm?tab=leads" label="Leads" active={tab === "leads"} />
        <CrmTab href="/dashboard/crm?tab=clientes" label="Clientes" active={tab === "clientes"} />
        <CrmTab href="/dashboard/crm?tab=pipeline" label="Pipeline" active={tab === "pipeline"} />
      </div>

      {tab === "leads" && <LeadsTab supabase={supabase} statusFilter={statusFilter} view={view} />}
      {tab === "clientes" && <ClientesTab supabase={supabase} />}
      {tab === "pipeline" && <PipelineTab supabase={supabase} />}
    </div>
  );
}

function CrmTab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`border-b-2 pb-3 text-[13.5px] transition-colors duration-150 ${
        active ? "border-carbon font-medium text-carbon" : "border-transparent text-carbon/50 hover:text-carbon"
      }`}
    >
      {label}
    </Link>
  );
}

type Supa = Awaited<ReturnType<typeof createClient>>;

async function LeadsTab({ supabase, statusFilter, view }: { supabase: Supa; statusFilter?: string; view: string }) {
  let query = supabase.from("leads").select("*").order("created_at", { ascending: false });
  if (statusFilter && (LEAD_STATUSES as string[]).includes(statusFilter)) {
    query = query.eq("status", statusFilter);
  }
  const { data: leads } = await query;

  const viewParam = (v: string) => `/dashboard/crm?tab=leads&view=${v}${statusFilter ? `&status=${statusFilter}` : ""}`;

  return (
    <div className="mt-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <FilterPill href="/dashboard/crm?tab=leads" label="Todos" active={!statusFilter} />
          {LEAD_STATUSES.map((status) => (
            <FilterPill
              key={status}
              href={`/dashboard/crm?tab=leads&status=${status}`}
              label={LEAD_STATUS_LABELS[status]}
              active={statusFilter === status}
            />
          ))}
        </div>
        <div className="flex gap-1.5">
          <Link href={viewParam("table")} className={buttonClass(view === "table" ? "primary" : "secondary", "sm")}>
            Tabla
          </Link>
          <Link href={viewParam("kanban")} className={buttonClass(view === "kanban" ? "primary" : "secondary", "sm")}>
            Kanban
          </Link>
        </div>
      </div>

      {view === "kanban" ? (
        <LeadsKanban leads={leads ?? []} />
      ) : (
        <div className="overflow-x-auto rounded-[10px] border border-carbon/[0.08] bg-white">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-carbon/[0.08] text-[11px] uppercase tracking-wide text-carbon/40">
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Necesidad</th>
                <th className="px-4 py-3">Valor</th>
                <th className="px-4 py-3">Fuente</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Creado</th>
              </tr>
            </thead>
            <tbody>
              {(leads ?? []).map((lead) => (
                <tr key={lead.id} className="border-b border-carbon/5 transition-colors duration-100 last:border-0 hover:bg-hueso/60">
                  <td className="px-4 py-3">
                    <Link href={`/dashboard/leads/${lead.id}`} className="font-medium text-carbon hover:text-naranja-oscuro hover:underline">
                      {lead.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-carbon/60">{lead.need || "—"}</td>
                  <td className="px-4 py-3 font-mono">{lead.estimated_value ? currency.format(lead.estimated_value) : "—"}</td>
                  <td className="px-4 py-3 text-carbon/55">{lead.source}</td>
                  <td className="px-4 py-3">
                    <StatusBadge label={LEAD_STATUS_LABELS[lead.status as LeadStatus]} tone={LEAD_STATUS_TONE[lead.status as LeadStatus]} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-carbon/50">{new Date(lead.created_at).toLocaleDateString("es-EC")}</td>
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
      )}
    </div>
  );
}

function LeadsKanban({ leads }: { leads: Lead[] }) {
  return (
    <div className="flex gap-3.5 overflow-x-auto pb-2">
      {LEAD_STATUSES.map((status) => {
        const inColumn = leads.filter((l) => l.status === status);
        return (
          <div key={status} className="w-[220px] shrink-0">
            <div className="mb-2.5 flex items-center justify-between border-b-2 border-piedra/40 pb-2 text-[11.5px] uppercase tracking-wide text-carbon/45">
              <span>{LEAD_STATUS_LABELS[status]}</span>
              <span className="font-mono">{inColumn.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {inColumn.map((lead) => (
                <Link
                  key={lead.id}
                  href={`/dashboard/leads/${lead.id}`}
                  className="block rounded-[10px] border border-carbon/[0.08] bg-white p-3 text-[12.5px] transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_16px_rgba(0,0,0,0.1)]"
                >
                  <p className="mb-1.5 font-medium text-carbon">{lead.name}</p>
                  <p className="mb-2 text-carbon/50">{lead.need || "—"}</p>
                  {lead.estimated_value != null && (
                    <p className="font-mono font-medium text-naranja-oscuro">{currency.format(lead.estimated_value)}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

async function ClientesTab({ supabase }: { supabase: Supa }) {
  const [{ data: clients }, { data: projects }] = await Promise.all([
    supabase.from("clients").select("*").order("created_at", { ascending: false }),
    supabase.from("projects").select("id, client_id, category"),
  ]);

  const projectsByClient = new Map<string, { count: number; category: string | null }>();
  for (const p of projects ?? []) {
    const existing = projectsByClient.get(p.client_id);
    projectsByClient.set(p.client_id, { count: (existing?.count ?? 0) + 1, category: existing?.category ?? p.category });
  }

  return (
    <div className="mt-6">
      {(clients ?? []).length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(clients ?? []).map((client) => {
            const info = projectsByClient.get(client.id);
            return (
              <Link
                key={client.id}
                href={`/dashboard/clients/${client.id}`}
                className="rounded-[10px] border border-carbon/[0.08] bg-white p-5 transition-all duration-150 hover:-translate-y-[3px] hover:shadow-[0_10px_22px_rgba(0,0,0,0.1)]"
              >
                <div className="mb-3.5 flex items-start justify-between">
                  <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-arena font-display text-sm text-carbon">
                    {initials(client.name)}
                  </div>
                  <span className="font-mono text-xs text-carbon/50">{info?.count ?? 0} proy.</span>
                </div>
                <p className="mb-1 text-[14.5px] font-medium text-carbon">{client.name}</p>
                <p className="text-[12.5px] text-carbon/50">{info?.category ?? client.company ?? "—"}</p>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[10px] border border-carbon/[0.08] bg-white">
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
        </div>
      )}
    </div>
  );
}

async function PipelineTab({ supabase }: { supabase: Supa }) {
  const { data: leads } = await supabase.from("leads").select("status, estimated_value");
  const pipeline = computePipeline(leads ?? []);

  return (
    <div className="mt-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {pipeline.map((stage) => (
          <div
            key={stage.status}
            className={`rounded-[10px] border p-6 text-center ${
              stage.status === "ganado" ? "border-naranja" : "border-carbon/[0.08]"
            }`}
          >
            <p className={`font-mono text-2xl font-medium ${stage.status === "ganado" ? "text-naranja-oscuro" : "text-carbon"}`}>
              {currency.format(stage.value)}
            </p>
            <p className="mt-1.5 text-xs text-carbon/50">{stage.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function FilterPill({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-xs transition-colors duration-150 ${
        active ? "bg-carbon text-white" : "border border-carbon/20 text-carbon/60 hover:border-carbon hover:text-carbon"
      }`}
    >
      {label}
    </Link>
  );
}
