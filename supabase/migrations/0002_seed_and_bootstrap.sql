-- Seed the studio's organization and auto-join the first user that signs
-- up as org_admin of it. Single-tenant bootstrap for now — revisit this
-- trigger when Fase 8 (multi-org SaaS onboarding) needs explicit
-- organization assignment instead of auto-join.

insert into public.organizations (name) values ('Adrián Gutiérrez Arquitectura');

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  default_org_id uuid;
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');

  select id into default_org_id from public.organizations order by created_at limit 1;

  if default_org_id is not null then
    insert into public.organization_members (organization_id, user_id, role)
    values (default_org_id, new.id, 'org_admin')
    on conflict do nothing;
  end if;

  return new;
end;
$$;
