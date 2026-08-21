-- ARCHI.OS Fase 5: Website Intelligence (parte propia, sin credenciales
-- externas). Ver DATABASE.md / ARCHITECTURE.md para el diseño.

alter table public.leads
  add column utm_source text,
  add column utm_medium text,
  add column utm_campaign text,
  add column utm_term text,
  add column utm_content text,
  add column landing_page text;
