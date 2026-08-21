-- ARCHI.OS core schema: organizations, profiles, membership/roles,
-- leads, clients, activity log. See DATABASE.md for the full design doc.

create extension if not exists pgcrypto;

-- organizations ---------------------------------------------------------

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

-- profiles (1:1 with auth.users) -----------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  created_at timestamptz not null default now()
);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- organization_members ----------------------------------------------------

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('org_admin', 'architect')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index organization_members_user_id_idx on public.organization_members (user_id);

-- helper: organizations the current user belongs to ----------------------

create function public.my_organization_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select organization_id from public.organization_members where user_id = auth.uid();
$$;

-- leads ---------------------------------------------------------------

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  location text,
  need text,
  message text,
  status text not null default 'nuevo'
    check (status in ('nuevo', 'contactado', 'propuesta', 'negociacion', 'ganado', 'perdido')),
  source text not null default 'manual' check (source in ('web', 'manual')),
  estimated_value numeric,
  assigned_to uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_org_status_idx on public.leads (organization_id, status);
create index leads_org_created_idx on public.leads (organization_id, created_at desc);

-- clients ---------------------------------------------------------------

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  converted_from_lead_id uuid references public.leads (id) on delete set null,
  notes text,
  created_at timestamptz not null default now()
);

create index clients_org_idx on public.clients (organization_id);

-- activity_log ------------------------------------------------------------

create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  entity_type text not null check (entity_type in ('lead', 'client')),
  entity_id uuid not null,
  body text not null,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index activity_log_entity_idx on public.activity_log (entity_type, entity_id);

-- Row Level Security -----------------------------------------------------

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.leads enable row level security;
alter table public.clients enable row level security;
alter table public.activity_log enable row level security;

create policy "member can read own organization" on public.organizations
  for select using (id in (select public.my_organization_ids()));

create policy "user can read own profile" on public.profiles
  for select using (id = auth.uid());

create policy "user can read own memberships" on public.organization_members
  for select using (user_id = auth.uid());

create policy "org members access leads" on public.leads
  for all
  using (organization_id in (select public.my_organization_ids()))
  with check (organization_id in (select public.my_organization_ids()));

create policy "org members access clients" on public.clients
  for all
  using (organization_id in (select public.my_organization_ids()))
  with check (organization_id in (select public.my_organization_ids()));

create policy "org members access activity_log" on public.activity_log
  for all
  using (organization_id in (select public.my_organization_ids()))
  with check (organization_id in (select public.my_organization_ids()));
