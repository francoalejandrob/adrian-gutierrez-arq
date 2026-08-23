-- ARCHI.OS: direccion de cliente (pedido del usuario, ver ROADMAP.md).
-- Mismo criterio que projects.location: texto libre sin estructura.

alter table public.clients add column address text;
