-- ARCHI.OS: Agenda. Ver DATABASE.md / ROADMAP.md — construida al
-- replicar la guia visual del usuario (nav "Agenda" + KPI "Reuniones
-- hoy" del dashboard + "Proxima reunion" del portal de cliente).

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index calendar_events_org_starts_idx on public.calendar_events (organization_id, starts_at);
create index calendar_events_project_idx on public.calendar_events (project_id);

alter table public.calendar_events enable row level security;

create policy "org members access calendar_events" on public.calendar_events
  for all
  using (organization_id in (select public.my_organization_ids()))
  with check (organization_id in (select public.my_organization_ids()));

-- Portal (additive, read-only) — un cliente ve las reuniones de su(s)
-- propio(s) proyecto(s), nunca eventos sin proyecto ni de otros clientes.
create policy "portal clients read their project events" on public.calendar_events
  for select
  using (
    project_id in (
      select id from public.projects
      where client_id in (select public.my_portal_client_ids())
    )
  );
