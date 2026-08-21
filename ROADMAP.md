# ROADMAP.md — ARCHI.OS

Basado en la sección 49 del master prompt del usuario (ver historial de la
conversación / `.claude/plans` para el documento completo de 62
secciones). Cada fase produce algo usable antes de pasar a la siguiente
(sección 50: nada de "sistema gigantesco e inestable").

## Fase 0 — Auditoría y documentación ✅ (este pase)

`AUDIT.md`, `ARCHITECTURE.md`, `DATABASE.md`, `ROADMAP.md`,
`INTEGRATION_SETUP.md`.

## Fase 1 — Core ✅

- [x] Documentación (Fase 0)
- [x] Route groups `(public)` / `(dashboard)`, layout raíz mínimo
- [x] Supabase enlazado (`ArqSystem&Website`), migraciones iniciales
- [x] Auth (magic link) + proxy (`middleware.ts` en Next < 16) de
      protección de `/dashboard`, restringido a un allowlist de emails
      (`adriangch95@gmail.com`, `franco.bracamonte24@gmail.com`)
- [x] `organizations` + `profiles` + `organization_members`, seed del
      estudio y auto-join de los usuarios del allowlist
- [x] CRM — Leads (CRUD + filtro por estado)
- [x] CRM — Clients (CRUD + "convertir desde lead")
- [x] Dashboard con KPIs reales (leads por estado, total clientes)
- [x] `api/contact/route.ts` también crea el lead en Supabase

**No incluido en Fase 1** (aunque están en la sección 9-11 del master
prompt): Kanban con drag-and-drop para el pipeline, roles adicionales,
`activity_log` expuesto en UI para leads/clients (la tabla existía, la UI
de actividad se sumó recién en Fase 2 y ahora también se usa ahí).

## Fase 2 — Project Management ✅

- [x] `projects`, `phases`, `tasks`, `documents` + `document_versions`
      (migración `0004_project_management.sql`), RLS igual que Fase 1
- [x] Bucket privado de Storage `documents`, descargas por URL firmada
- [x] CRUD de proyectos (con selector de cliente), fases y tareas
- [x] Subida de documentos con versionado (nueva versión sobre uno
      existente o documento nuevo)
- [x] Cronograma (Gantt) simple, propio (sin librería externa — ver
      `ARCHITECTURE.md` para el porqué), a partir de fechas de fase
- [x] Bitácora de actividad reutilizada para proyectos
- [x] Dashboard: KPI de proyectos activos y tareas vencidas (con alerta)
- [x] Botón "Nuevo proyecto" desde la ficha de cliente

**No incluido en Fase 2** (queda para cuando haya una necesidad real, no
por completitud):
- Dependencias entre tareas / ruta crítica en el Gantt.
- Roles `project_director`/`designer` — con 2 usuarios y ambos
  `org_admin`, no hay todavía ninguna diferencia de permisos que
  justifique el rol (sería UI que promete algo que no hace nada).
- Reordenar fases arrastrando (hoy: posición fija al crear).

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
