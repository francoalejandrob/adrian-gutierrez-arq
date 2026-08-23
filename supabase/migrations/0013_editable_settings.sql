-- ARCHI.OS: /dashboard/settings editable (nombre del estudio, nombre y
-- foto de perfil propios). Ni organizations ni profiles tenian
-- politica de UPDATE hasta ahora -- solo SELECT. profiles tampoco
-- tenia columna de foto.

alter table public.profiles add column avatar_url text;

create policy "user can update own profile" on public.profiles
  for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "org_admin can update organization" on public.organizations
  for update
  using (
    id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role = 'org_admin'
    )
  )
  with check (
    id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role = 'org_admin'
    )
  );

-- Storage: bucket publico "avatars" -- a diferencia de "documents"
-- (privado, URLs firmadas de 60s, pensado para descargas puntuales),
-- una foto de perfil se muestra en un <img> persistente en pantalla,
-- asi que necesita una URL publica estable. Path: {user_id}/{filename}
-- -- cada usuario solo puede escribir dentro de su propia carpeta,
-- mismo patron de "primer segmento del path" que ya usa "documents".

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "users manage their own avatar" on storage.objects
  for all
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
