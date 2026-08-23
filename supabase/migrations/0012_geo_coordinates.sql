-- ARCHI.OS: coordenadas para el mapa de clientes/proyectos (Fase 7).
-- Se geocodifican server-side a partir de clients.address y
-- projects.location; null cuando no hay direccion o la geocodificacion
-- todavia no corrio o fallo (nunca se inventan coordenadas).

alter table public.clients add column latitude numeric;
alter table public.clients add column longitude numeric;

alter table public.projects add column latitude numeric;
alter table public.projects add column longitude numeric;
