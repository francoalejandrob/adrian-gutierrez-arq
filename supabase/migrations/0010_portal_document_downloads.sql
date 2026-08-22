-- Portal clients could already see document/version metadata (Fase 3),
-- but there was never a storage.objects policy letting them actually
-- download the file — the "Documentos" tab of the portal restyle needs a
-- real Descargar link, not a dead one. Storage path convention (see
-- DATABASE.md §1b): {organization_id}/{project_id}/{document_id}/{version}-{filename}.
--
-- This checks BOTH project ownership and documents.visibility='client' —
-- folder structure alone only proves "this client's project", not that
-- the studio marked this specific document shareable, so the visibility
-- flag still has to be re-checked against the documents table here.

create policy "portal clients read their visible document objects" on storage.objects
  for select
  using (
    bucket_id = 'documents'
    and (storage.foldername(name))[3]::uuid in (
      select id from public.documents
      where visibility = 'client'
        and project_id in (
          select id from public.projects
          where client_id in (select public.my_portal_client_ids())
        )
    )
  );
