-- The previous version of handle_new_user() auto-joined ANY authenticated
-- user as org_admin of the studio's organization (fine for "only me", not
-- fine once a second real email is added — anyone who requested a magic
-- link would have gotten full access). Restrict auto-join to an explicit
-- allowlist. Anyone else who signs up still gets a `profiles` row (harmless
-- — just their own identity), but no `organization_members` row, so RLS
-- shows them an empty dashboard instead of the studio's real data.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  default_org_id uuid;
  allowed_emails text[] := array['adriangch95@gmail.com', 'franco.bracamonte24@gmail.com'];
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');

  if lower(new.email) = any (allowed_emails) then
    select id into default_org_id from public.organizations order by created_at limit 1;

    if default_org_id is not null then
      insert into public.organization_members (organization_id, user_id, role)
      values (default_org_id, new.id, 'org_admin')
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;
