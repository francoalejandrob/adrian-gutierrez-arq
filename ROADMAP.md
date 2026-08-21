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

## Fase 3 — Client Portal ✅

- [x] `portal_access` (allowlist por email↔cliente, separado de
      `organization_members`), helper `my_portal_client_ids()`
- [x] `documents.visibility` (`internal`/`client`) y
      `activity_log.visible_to_client`, para que el portal nunca muestre
      lo que el estudio no marcó como compartible
- [x] `/portal/login` (magic link, sin allowlist fija — cualquier email en
      `portal_access` entra), `proxy.ts` extendido a `/portal/:path*`
- [x] `/portal` (lista o redirect directo si hay un solo proyecto),
      `/portal/projects/[id]` (progreso, fases de solo lectura,
      documentos visibles con Aprobar/Solicitar cambios, mensajes)
- [x] `document_versions.approved_at`/`approved_by`
- [x] Desde `/dashboard/projects/[id]`: invitar/quitar acceso de portal, y
      checkbox "visible para el cliente" al subir un documento

**No incluido en Fase 3**: vista de pagos en el portal (no hay pagos
todavía — Fase 4 los crea, ahí se agrega esa vista), `tasks` no se expone
al portal (son datos internos), notificaciones de "nuevo mensaje/documento"
al estudio o al cliente (Fase 6).

## Fase 4 — Finanzas ✅

- [x] `quotes` + `quote_items`, `contracts`, `payments`, `expenses`
      (migración `0006_finance.sql`), RLS igual que las fases anteriores
- [x] `/dashboard/projects/[id]`: secciones Cotizaciones, Contratos,
      Pagos, Gastos (mismo patrón de Server Action + `StatusSelect`) y
      cuadro "Resumen financiero" (contratado/cobrado/pendiente/gastos/
      margen)
- [x] `/dashboard/quotes/[id]`: edición de ítems, descuento/impuesto/
      notas, cambio de estado
- [x] `/dashboard/quotes/[id]/print`: vista imprimible (sin sidebar, vía
      `print:hidden`/`print:block` — Ctrl+P del navegador en vez de sumar
      una librería de PDF, mismo criterio que el Gantt propio de Fase 2)
- [x] `/dashboard/finance` (nav "Finanzas"): totales globales + tabla de
      pagos pendientes/vencidos entre todos los proyectos
- [x] Portal (`/portal/projects/[id]`): sección "Cotización" (si hay una
      `sent`/`negotiation` — detalle + Aceptar/Rechazar) y "Pagos" de
      solo lectura
- [x] Automatización real: al marcar una cotización `accepted` desde el
      dashboard, si el proyecto no tiene fases todavía se crean 5 fases
      plantilla (Conceptualización/Diseño/Documentación/Construcción/
      Entrega) y el proyecto pasa de `planning` a `design`

**No incluido en Fase 4** (igual que Fase 2-3, deliberado):
- PDF real (librería de generación) — la vista imprimible del navegador
  cubre el mismo caso de uso a este tamaño de estudio.
- Firma digital de contratos — el master prompt lo pide explícitamente
  para después; `contracts.signed_at` existe pero se marca manualmente al
  pasar el contrato a `active`.
- Pasarela de pago real (Stripe u otra) — es registro y seguimiento de
  pagos, no cobro automatizado.
- Rol `accounting` — con 2 usuarios y ambos `org_admin`, todavía no hay
  una diferencia de permisos real que lo justifique (mismo criterio que
  el rol `designer` descartado en Fase 2).
- Marcado automático de pagos como `vencida` cuando pasa `due_date` — el
  estado es manual por ahora; `/dashboard/finance` sí resalta en rojo los
  pagos con `due_date` pasada aunque su estado siga en `pendiente`.

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
