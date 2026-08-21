-- ARCHI.OS Fase 2: Project Management. See DATABASE.md / ARCHITECTURE.md
-- (§ Fase 2 will be filled in) and the Fase 2 plan for the design.

-- projects ---------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete restrict,
  name text not null,
  description text,
  category text check (
    category in ('Residencial', 'Comercial', 'Institucional', 'Hospitalidad', 'Remodelación')
  ),
  location text,
  budget numeric,
  contracted_value numeric,
  start_date date,
  estimated_end_date date,
  actual_end_date date,
  status text not null default 'planning' check (
    status in (
      'planning', 'design', 'documentation', 'permits', 'construction',
      'supervision', 'delivery', 'completed', 'on_hold', 'cancelled'
    )
  ),
  progress smallint not null default 0 check (progress between 0 and 100),
  project_manager uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_org_status_idx on public.projects (organization_id, status);
create index projects_client_idx on public.projects (client_id);

-- phases ---------------------------------------------------------------

create table public.phases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  description text,
  position integer not null default 0,
  start_date date,
  end_date date,
  status text not null default 'pendiente' check (status in ('pendiente', 'en_progreso', 'completada')),
  progress smallint not null default 0 check (progress between 0 and 100),
  responsible uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index phases_project_idx on public.phases (project_id, position);

-- tasks ---------------------------------------------------------------

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  phase_id uuid references public.phases (id) on delete set null,
  title text not null,
  description text,
  assigned_to uuid references public.profiles (id) on delete set null,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  status text not null default 'todo' check (
    status in ('backlog', 'todo', 'in_progress', 'review', 'completed')
  ),
  due_date date,
  estimated_hours numeric,
  actual_hours numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_project_idx on public.tasks (project_id);
create index tasks_phase_idx on public.tasks (phase_id);
create index tasks_org_due_idx on public.tasks (organization_id, due_date);

-- documents + versions -----------------------------------------------------

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  category text not null default 'otro' check (
    category in ('contrato', 'plano', 'render', 'presupuesto', 'reporte', 'aprobacion', 'entrega_final', 'otro')
  ),
  created_at timestamptz not null default now()
);

create index documents_project_idx on public.documents (project_id);

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  version integer not null,
  storage_path text not null,
  file_size bigint,
  mime_type text,
  status text not null default 'enviado' check (
    status in ('borrador', 'enviado', 'aprobado', 'cambios_solicitados')
  ),
  comment text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (document_id, version)
);

create index document_versions_document_idx on public.document_versions (document_id);

-- activity_log: allow 'project' entities too ------------------------------

alter table public.activity_log drop constraint activity_log_entity_type_check;
alter table public.activity_log add constraint activity_log_entity_type_check
  check (entity_type in ('lead', 'client', 'project'));

-- RLS ---------------------------------------------------------------------

alter table public.projects enable row level security;
alter table public.phases enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;

create policy "org members access projects" on public.projects
  for all
  using (organization_id in (select public.my_organization_ids()))
  with check (organization_id in (select public.my_organization_ids()));

create policy "org members access phases" on public.phases
  for all
  using (organization_id in (select public.my_organization_ids()))
  with check (organization_id in (select public.my_organization_ids()));

create policy "org members access tasks" on public.tasks
  for all
  using (organization_id in (select public.my_organization_ids()))
  with check (organization_id in (select public.my_organization_ids()));

create policy "org members access documents" on public.documents
  for all
  using (organization_id in (select public.my_organization_ids()))
  with check (organization_id in (select public.my_organization_ids()));

create policy "org members access document_versions" on public.document_versions
  for all
  using (
    document_id in (
      select id from public.documents
      where organization_id in (select public.my_organization_ids())
    )
  )
  with check (
    document_id in (
      select id from public.documents
      where organization_id in (select public.my_organization_ids())
    )
  );

-- Storage: private "documents" bucket --------------------------------------
-- Path convention: {organization_id}/{project_id}/{document_id}/{version}-{filename}

insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "org members access their documents bucket objects" on storage.objects
  for all
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[1]::uuid in (select public.my_organization_ids())
  )
  with check (
    bucket_id = 'documents'
    and (storage.foldername(name))[1]::uuid in (select public.my_organization_ids())
  );
