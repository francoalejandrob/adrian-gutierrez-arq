import Link from "next/link";
import { Briefcase, Target, TrendingUp, Users } from "lucide-react";
import Avatar from "@/components/dashboard/ui/avatar";
import { buttonClass } from "@/components/dashboard/ui/button";
import EmptyState from "@/components/dashboard/ui/empty-state";
import PageHeader from "@/components/dashboard/ui/page-header";
import StatusBadge from "@/components/dashboard/ui/status-badge";
import { TabLink } from "@/components/dashboard/ui/tabs";
import { computePipeline } from "@/lib/pipeline";
import { createClient } from "@/lib/supabase/server";
import { LEAD_STATUS_LABELS, LEAD_STATUS_TONE, LEAD_STATUSES, type LeadStatus } from "@/lib/supabase/types";

type LeadWithAssignee = {
  id: string;
  name: string;
  need: string | null;
  estimated_value: number | null;
  source: string;
  status: string;
  created_at: string;
  profiles: { full_name: string | null; email: string } | null;
};

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
        eyebrow="Comercial"
        title="CRM"
        action={
          tab === "leads" ? (
            <Link href="/dashboard/leads/new" className={buttonClass("primary", "md")}>
              Nuevo lead
            </Link>
          ) : tab === "clientes" ? (
            <Link href="/dashboard/clients/new" className={buttonClass("primary", "md")}>
              Nuevo cliente
            </Link>
          ) : undefined
        }
      />

      <div className="flex gap-2 border-b border-corte px-12 pb-5">
        <TabLink href="/dashboard/crm?tab=leads" label="Leads" icon={Users} active={tab === "leads"} />
        <TabLink href="/dashboard/crm?tab=clientes" label="Clientes" icon={Users} active={tab === "clientes"} />
        <TabLink href="/dashboard/crm?tab=pipeline" label="Pipeline" icon={TrendingUp} active={tab === "pipeline"} />
      </div>

      {tab === "leads" && <LeadsTab supabase={supabase} statusFilter={statusFilter} view={view} />}
      {tab === "clientes" && <ClientesTab supabase={supabase} />}
      {tab === "pipeline" && <PipelineTab supabase={supabase} />}
    </div>
  );
}

type Supa = Awaited<ReturnType<typeof createClient>>;

async function LeadsTab({ supabase, statusFilter, view }: { supabase: Supa; statusFilter?: string; view: string }) {
  let query = supabase
    .from("leads")
    .select("id, name, need, estimated_value, source, status, created_at, profiles(full_name, email)")
    .order("created_at", { ascending: false });
  if (statusFilter && (LEAD_STATUSES as string[]).includes(statusFilter)) {
    query = query.eq("status", statusFilter);
  }
  const { data: leads } = await query;

  const viewParam = (v: string) => `/dashboard/crm?tab=leads&view=${v}${statusFilter ? `&status=${statusFilter}` : ""}`;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-filete px-12 py-4">
        <div className="flex flex-wrap gap-2">
          <TabLink href="/dashboard/crm?tab=leads" label="Todos" active={!statusFilter} size="sm" />
          {LEAD_STATUSES.map((status) => (
            <TabLink
              key={status}
              href={`/dashboard/crm?tab=leads&status=${status}`}
              label={LEAD_STATUS_LABELS[status]}
              active={statusFilter === status}
              size="sm"
            />
          ))}
        </div>
        <div className="flex gap-2">
          <TabLink href={viewParam("table")} label="Tabla" active={view === "table"} size="sm" />
          <TabLink href={viewParam("kanban")} label="Kanban" active={view === "kanban"} size="sm" />
        </div>
      </div>

      {view === "kanban" ? (
        <div className="px-12 py-8">
          <LeadsKanban leads={leads ?? []} />
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-[2.1fr_1.4fr_1fr_1.1fr_1fr_36px_0.9fr] gap-4 border-b border-filete px-12 py-3 font-dp-mono text-[9.5px] uppercase tracking-[0.13em] text-concreto">
            <span>Lead</span>
            <span>Necesidad</span>
            <span>Valor</span>
            <span>Fuente</span>
            <span>Estado</span>
            <span></span>
            <span>Creado</span>
          </div>
          {(leads ?? []).map((lead, i) => (
            <Link
              key={lead.id}
              href={`/dashboard/leads/${lead.id}`}
              className="grid grid-cols-[2.1fr_1.4fr_1fr_1.1fr_1fr_36px_0.9fr] items-center gap-4 border-b border-filete px-12 py-4 transition-colors duration-100 hover:bg-realce"
            >
              <span className="flex items-baseline gap-3 font-dp-sans text-[13.5px] text-tinta">
                <span className="font-dp-mono text-[10px] text-concreto">{String(i + 1).padStart(2, "0")}</span>
                {lead.name}
              </span>
              <span className="truncate font-dp-sans text-[12.5px] text-grafito">{lead.need || "—"}</span>
              <span className="font-dp-mono text-[12.5px] text-tinta">{lead.estimated_value ? currency.format(lead.estimated_value) : "—"}</span>
              <span className="font-dp-sans text-[12.5px] text-grafito">{lead.source}</span>
              <StatusBadge label={LEAD_STATUS_LABELS[lead.status as LeadStatus]} tone={LEAD_STATUS_TONE[lead.status as LeadStatus]} />
              {lead.profiles ? (
                <Avatar name={lead.profiles.full_name || lead.profiles.email} size={24} />
              ) : (
                <span className="h-6 w-6 rounded-full border border-dashed border-corte" title="Sin asignar" />
              )}
              <span className="font-dp-mono text-[11px] text-concreto">{new Date(lead.created_at).toLocaleDateString("es-EC")}</span>
            </Link>
          ))}
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

function LeadsKanban({ leads }: { leads: LeadWithAssignee[] }) {
  return (
    <div className="flex gap-5 overflow-x-auto pb-2">
      {LEAD_STATUSES.map((status) => {
        const inColumn = leads.filter((l) => l.status === status);
        return (
          <div key={status} className="w-[220px] shrink-0">
            <div className="mb-3 flex items-center justify-between border-b border-corte pb-2.5 font-dp-mono text-[10px] uppercase tracking-[0.12em] text-concreto">
              <span>{LEAD_STATUS_LABELS[status]}</span>
              <span>{inColumn.length}</span>
            </div>
            <div className="flex flex-col gap-2.5">
              {inColumn.map((lead) => (
                <Link key={lead.id} href={`/dashboard/leads/${lead.id}`} className="block border border-filete bg-superficie p-3.5 transition-colors duration-150 hover:border-tinta">
                  <div className="mb-1.5 flex items-start justify-between gap-2">
                    <p className="font-dp-sans text-[12.5px] text-tinta">{lead.name}</p>
                    {lead.profiles && <Avatar name={lead.profiles.full_name || lead.profiles.email} size={20} />}
                  </div>
                  <p className="mb-2.5 font-dp-sans text-[11.5px] text-concreto">{lead.need || "—"}</p>
                  {lead.estimated_value != null && (
                    <p className="font-dp-mono text-[12px] text-tinta">{currency.format(lead.estimated_value)}</p>
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
    <div>
      {(clients ?? []).length > 0 ? (
        (clients ?? []).map((client, i) => {
          const info = projectsByClient.get(client.id);
          return (
            <Link
              key={client.id}
              href={`/dashboard/clients/${client.id}`}
              className="flex items-center gap-6 border-b border-filete px-12 py-5 transition-colors duration-100 hover:bg-realce"
            >
              <span className="font-dp-mono text-[10px] text-concreto">{String(i + 1).padStart(2, "0")}</span>
              <Avatar name={client.name} size={30} />
              <span className="min-w-[220px] font-dp-serif text-xl text-tinta">{client.name}</span>
              <span className="flex-1 font-dp-sans text-[12.5px] text-concreto">{info?.category ?? client.company ?? "—"}</span>
              <span className="font-dp-mono text-[11px] text-concreto">{info?.count ?? 0} proyecto{info?.count === 1 ? "" : "s"}</span>
            </Link>
          );
        })
      ) : (
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
  );
}

async function PipelineTab({ supabase }: { supabase: Supa }) {
  const { data: leads } = await supabase.from("leads").select("status, estimated_value");
  const pipeline = computePipeline(leads ?? []);
  const maxValue = Math.max(1, ...pipeline.map((s) => s.value));

  return (
    <div className="px-12 py-8">
      <div className="flex flex-col">
        {pipeline.map((stage) => (
          <div key={stage.status} className="grid grid-cols-[140px_1fr_140px_60px] items-center gap-5 border-b border-filete py-4 last:border-0">
            <span className={`font-dp-mono text-[10.5px] uppercase tracking-[0.1em] ${stage.status === "ganado" ? "text-verde font-medium" : "text-grafito"}`}>
              {stage.label}
            </span>
            <div className="h-[3px] bg-filete">
              <div
                className={stage.status === "ganado" ? "h-[3px] bg-verde" : "h-[3px] bg-tinta"}
                style={{ width: `${(stage.value / maxValue) * 100}%` }}
              />
            </div>
            <span className={`text-right font-dp-mono text-[13px] ${stage.status === "ganado" ? "text-verde" : "text-tinta"}`}>
              {currency.format(stage.value)}
            </span>
            <span className="text-right font-dp-mono text-[11px] text-concreto">{stage.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

