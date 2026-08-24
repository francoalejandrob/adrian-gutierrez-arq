-- ARCHI.OS: campos de calificación específicos de arquitectura para
-- leads y clientes (pedido del usuario — ver ROADMAP.md). Mismo
-- criterio que el resto del esquema para campos tipo-enum: text check
-- (x in (...)), sin un tipo enum de Postgres aparte.

alter table public.leads
  add column project_type text check (project_type in ('Residencial','Comercial','Institucional','Hospitalidad','Remodelación')),
  add column has_land text check (has_land in ('si','no','buscando')),
  add column approx_area numeric,
  add column timeline text check (timeline in ('inmediato','unos_meses','explorando'));

alter table public.clients
  add column city text,
  add column country text,
  add column tax_id text,
  add column secondary_contact_name text,
  add column secondary_contact_phone text,
  add column contact_preference text check (contact_preference in ('email','telefono','whatsapp'));
