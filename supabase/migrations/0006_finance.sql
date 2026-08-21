-- ARCHI.OS Fase 4: Finanzas. See DATABASE.md / ARCHITECTURE.md and the
-- Fase 4 plan for the design.

-- quotes + quote_items -----------------------------------------------------

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  status text not null default 'draft' check (
    status in ('draft', 'sent', 'negotiation', 'accepted', 'rejected', 'expired')
  ),
  issue_date date not null default current_date,
  valid_until date,
  discount numeric not null default 0,
  tax_rate numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quotes_project_idx on public.quotes (project_id);

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  description text not null,
  quantity numeric not null default 1,
  unit_price numeric not null default 0,
  position integer not null default 0
);

create index quote_items_quote_idx on public.quote_items (quote_id);

-- contracts ---------------------------------------------------------------

create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  quote_id uuid references public.quotes (id) on delete set null,
  value numeric not null,
  start_date date,
  end_date date,
  payment_terms text,
  status text not null default 'draft' check (status in ('draft', 'active', 'completed', 'cancelled')),
  signed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create index contracts_project_idx on public.contracts (project_id);

-- payments ---------------------------------------------------------------

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  amount numeric not null,
  currency text not null default 'USD',
  status text not null default 'pendiente' check (status in ('pendiente', 'pagada', 'vencida')),
  due_date date,
  paid_date date,
  method text,
  reference text,
  notes text,
  created_at timestamptz not null default now()
);

create index payments_project_idx on public.payments (project_id);
create index payments_org_status_idx on public.payments (organization_id, status);

-- expenses ---------------------------------------------------------------

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  category text not null default 'otro' check (
    category in ('materiales', 'mano_obra', 'permisos', 'subcontrato', 'otro')
  ),
  amount numeric not null,
  date date not null default current_date,
  description text,
  supplier text,
  created_at timestamptz not null default now()
);

create index expenses_project_idx on public.expenses (project_id);

-- RLS ---------------------------------------------------------------------

alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.contracts enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;

create policy "org members access quotes" on public.quotes
  for all
  using (organization_id in (select public.my_organization_ids()))
  with check (organization_id in (select public.my_organization_ids()));

create policy "org members access quote_items" on public.quote_items
  for all
  using (
    quote_id in (
      select id from public.quotes
      where organization_id in (select public.my_organization_ids())
    )
  )
  with check (
    quote_id in (
      select id from public.quotes
      where organization_id in (select public.my_organization_ids())
    )
  );

create policy "org members access contracts" on public.contracts
  for all
  using (organization_id in (select public.my_organization_ids()))
  with check (organization_id in (select public.my_organization_ids()));

create policy "org members access payments" on public.payments
  for all
  using (organization_id in (select public.my_organization_ids()))
  with check (organization_id in (select public.my_organization_ids()));

create policy "org members access expenses" on public.expenses
  for all
  using (organization_id in (select public.my_organization_ids()))
  with check (organization_id in (select public.my_organization_ids()));

-- Portal (additive, read-only + limited accept/reject) ---------------------

create policy "portal clients read their quotes" on public.quotes
  for select
  using (
    status in ('sent', 'negotiation', 'accepted', 'rejected', 'expired')
    and project_id in (
      select id from public.projects
      where client_id in (select public.my_portal_client_ids())
    )
  );

create policy "portal clients respond to sent quotes" on public.quotes
  for update
  using (
    status in ('sent', 'negotiation')
    and project_id in (
      select id from public.projects
      where client_id in (select public.my_portal_client_ids())
    )
  )
  with check (
    project_id in (
      select id from public.projects
      where client_id in (select public.my_portal_client_ids())
    )
  );

create policy "portal clients read items of their quotes" on public.quote_items
  for select
  using (
    quote_id in (
      select id from public.quotes
      where project_id in (
        select id from public.projects
        where client_id in (select public.my_portal_client_ids())
      )
    )
  );

create policy "portal clients read their payments" on public.payments
  for select
  using (
    project_id in (
      select id from public.projects
      where client_id in (select public.my_portal_client_ids())
    )
  );
