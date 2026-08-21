-- ARCHI.OS Fase 6: Automatizaciones (parte propia, sin credenciales
-- externas). Ver DATABASE.md / ARCHITECTURE.md y lib/notifications.ts.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  -- null = visible a todos los miembros de la organización (hoy siempre
  -- null: con 2 usuarios org_admin no hay todavía una razón real para
  -- notificar a uno y no al otro — mismo criterio que los roles diferidos
  -- en DATABASE.md §3).
  user_id uuid references public.profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  entity_type text,
  entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_org_created_idx on public.notifications (organization_id, created_at desc);

alter table public.notifications enable row level security;

-- Solo lectura/actualización de read_at desde la sesión del usuario. Los
-- inserts siempre vienen del cliente admin (lib/notifications.ts) — el
-- disparador más común es una acción de un usuario de portal, que no es
-- organization_member y por lo tanto no tiene (ni necesita) permiso de
-- escritura directa aquí.
create policy "org members read notifications" on public.notifications
  for select
  using (
    organization_id in (select public.my_organization_ids())
    and (user_id = auth.uid() or user_id is null)
  );

create policy "org members mark notifications read" on public.notifications
  for update
  using (
    organization_id in (select public.my_organization_ids())
    and (user_id = auth.uid() or user_id is null)
  )
  with check (organization_id in (select public.my_organization_ids()));
