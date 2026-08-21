-- ARCHI.OS Fase 3: Client Portal. See DATABASE.md / ARCHITECTURE.md and
-- the Fase 3 plan for the design.

-- Visibility flags so the portal never shows internal-only content ------

alter table public.documents
  add column visibility text not null default 'internal'
  check (visibility in ('internal', 'client'));

alter table public.activity_log
  add column visible_to_client boolean not null default false;

-- Approval metadata on document_versions ----------------------------------

alter table public.document_versions
  add column approved_at timestamptz,
  add column approved_by uuid references public.profiles (id) on delete set null;

-- portal_access -------------------------------------------------------

create table public.portal_access (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  email text not null,
  invited_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (client_id, email)
);

create index portal_access_email_idx on public.portal_access (lower(email));

alter table public.portal_access enable row level security;

-- Only org members manage portal_access (invite/revoke) — clients never
-- see or edit this table themselves.
create policy "org members manage portal_access" on public.portal_access
  for all
  using (
    client_id in (
      select id from public.clients
      where organization_id in (select public.my_organization_ids())
    )
  )
  with check (
    client_id in (
      select id from public.clients
      where organization_id in (select public.my_organization_ids())
    )
  );

-- Helper: clients the current session's email has portal access to ------

create function public.my_portal_client_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select pa.client_id
  from public.portal_access pa
  join public.profiles p on lower(p.email) = lower(pa.email)
  where p.id = auth.uid();
$$;

-- Additional (additive) RLS policies for portal clients -------------------

create policy "portal clients read their project" on public.projects
  for select
  using (client_id in (select public.my_portal_client_ids()));

create policy "portal clients read their phases" on public.phases
  for select
  using (
    project_id in (
      select id from public.projects
      where client_id in (select public.my_portal_client_ids())
    )
  );

create policy "portal clients read client-visible documents" on public.documents
  for select
  using (
    visibility = 'client'
    and project_id in (
      select id from public.projects
      where client_id in (select public.my_portal_client_ids())
    )
  );

create policy "portal clients read versions of visible documents" on public.document_versions
  for select
  using (
    document_id in (
      select id from public.documents
      where visibility = 'client'
        and project_id in (
          select id from public.projects
          where client_id in (select public.my_portal_client_ids())
        )
    )
  );

-- Portal clients may only respond (approve / request changes) to a
-- version they can already see — the app layer restricts which columns
-- the update touches (status, comment, approved_at, approved_by).
create policy "portal clients respond to visible versions" on public.document_versions
  for update
  using (
    document_id in (
      select id from public.documents
      where visibility = 'client'
        and project_id in (
          select id from public.projects
          where client_id in (select public.my_portal_client_ids())
        )
    )
  )
  with check (
    document_id in (
      select id from public.documents
      where visibility = 'client'
        and project_id in (
          select id from public.projects
          where client_id in (select public.my_portal_client_ids())
        )
    )
  );

create policy "portal clients read client-visible activity" on public.activity_log
  for select
  using (
    visible_to_client = true
    and entity_type = 'project'
    and entity_id in (
      select id from public.projects
      where client_id in (select public.my_portal_client_ids())
    )
  );

create policy "portal clients post client-visible activity" on public.activity_log
  for insert
  with check (
    visible_to_client = true
    and entity_type = 'project'
    and entity_id in (
      select id from public.projects
      where client_id in (select public.my_portal_client_ids())
    )
  );
