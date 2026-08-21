# ROADMAP.md — ARCHI.OS

Basado en la sección 49 del master prompt del usuario (ver historial de la
conversación / `.claude/plans` para el documento completo de 62
secciones). Cada fase produce algo usable antes de pasar a la siguiente
(sección 50: nada de "sistema gigantesco e inestable").

## Fase 0 — Auditoría y documentación ✅ (este pase)

`AUDIT.md`, `ARCHITECTURE.md`, `DATABASE.md`, `ROADMAP.md`,
`INTEGRATION_SETUP.md`.

## Fase 1 — Core 🔵 en progreso (este pase)

- [x] Documentación (Fase 0)
- [ ] Route groups `(public)` / `(dashboard)`, layout raíz mínimo
- [ ] Supabase enlazado (`ArqSystem&Website`), migraciones iniciales
- [ ] Auth (magic link) + middleware de protección de `/dashboard`
- [ ] `organizations` + `profiles` + `organization_members`, seed del
      estudio y del usuario admin
- [ ] CRM — Leads (CRUD + filtro por estado)
- [ ] CRM — Clients (CRUD + "convertir desde lead")
- [ ] Dashboard con KPIs reales (leads por estado, total clientes)
- [ ] `api/contact/route.ts` también crea el lead en Supabase

**No incluido en este pase** (aunque están en la sección 9-11 del master
prompt): Kanban con drag-and-drop para el pipeline, roles adicionales,
`activity_log` expuesto en UI (la tabla se crea, pero el timeline visual
puede esperar a la siguiente iteración del CRM).

## Fase 2 — Project Management ⬜

Projects, phases (configurables), tasks, Gantt, documentos + versionado,
sección "Documentos" del proyecto. Roles `project_director`/`designer`
se activan acá.

## Fase 3 — Client Portal ⬜

`/portal`, acceso de cliente restringido a sus propios proyectos,
aprobaciones de documentos/diseños, vista de pagos (de solo lectura, la
Fase 4 es la que crea los pagos).

## Fase 4 — Finanzas ⬜

Cotizaciones (con PDF), contratos, pagos, gastos, reportes financieros
(contratado / cobrado / pendiente / gastos / margen). Rol `accounting`.
Sin firma digital compleja en esta fase (el master prompt lo pide
explícitamente para después). Sin pasarela de pago real todavía — es
registro y seguimiento, no cobro automatizado.

## Fase 5 — Website Intelligence ⬜

GA4, Search Console, UTM tracking persistente desde la primera visita,
Core Web Vitals, `leads` gana las columnas de campaña/UTM.

## Fase 6 — Automatizaciones ⬜

Workflows por evento (`quote.accepted` → crea proyecto + fases +
carpetas...; `website.lead_created` → asigna + notifica), notificaciones
in-app/email, integración con Google Calendar, arquitectura preparada
para WhatsApp Business Cloud API.

## Fase 7 — IA (Archi AI) ⬜

Capa de IA vía tools/functions que respetan `organization_id`, rol y RLS
del usuario que pregunta — nunca acceso directo a la base de datos.
Casos de uso: resúmenes de proyecto, pagos vencidos, leads a contactar,
borradores de email, creación de tareas por lenguaje natural.

## Fase 8 — SaaS ⬜

Facturación de la plataforma en sí (Stripe), planes, límites,
onboarding de nuevas organizaciones, rol `super_admin`. Solo tiene
sentido si el objetivo pasa a ser vender ARCHI.OS a otros estudios, no
solo usarlo para el de Adrián.

## Transversal (aplica a todas las fases, no es una fase en sí)

- Seguridad: RLS en toda tabla nueva, validación con Zod en toda
  mutación, nunca autorización solo en frontend.
- Auditoría (`audit logs` de acciones sensibles) — se introduce cuando
  haya acciones lo bastante sensibles para justificarlo (pagos,
  aprobaciones) — no antes.
- Tests: unitarios para cálculos/permisos/validaciones a medida que
  existan; E2E cuando haya flujos críticos estables (login, CRM,
  aprobación de pago).
- Documentación: `AUDIT.md`/`ARCHITECTURE.md`/`DATABASE.md` se actualizan
  cuando cambie la arquitectura, no quedan como snapshot de un solo día.
