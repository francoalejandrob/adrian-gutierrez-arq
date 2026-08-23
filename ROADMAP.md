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

## Fase 5 — Website Intelligence ✅

- [x] `leads` gana `utm_source`/`utm_medium`/`utm_campaign`/`utm_term`/
      `utm_content`/`landing_page` (migración `0007_marketing.sql`)
- [x] Captura de atribución de primer contacto en el sitio público
      (`lib/utm.ts` + `<UtmCapture />` montado en `(public)/layout.tsx`):
      guarda los UTM de la URL en `localStorage` la primera vez que
      aparecen, no se sobrescriben en visitas posteriores sin UTM
- [x] `api/contact/route.ts` guarda esos campos en el lead;
      `contacto-form.tsx` los manda desde lo guardado en `localStorage`
- [x] `/dashboard/marketing`: leads/clientes/proyectos/contratado
      agrupados por fuente (`utm_source` o `source` como fallback),
      calculado 100% desde datos propios (leads → `clients.
      converted_from_lead_id` → `projects` → `contracts.value`)
- [x] `lib/integrations/google-analytics.ts` +
      `google-search-console.ts`: wiring real contra las REST API de GA4
      Data API y Search Console (JWT de cuenta de servicio, sin depender
      de `googleapis`), gateado por variables de entorno — si faltan,
      devuelven `{ configured: false, reason }` en vez de inventar datos
- [x] `/dashboard/website`: muestra las tablas si está configurado: si
      no, un estado vacío honesto con link a `INTEGRATION_SETUP.md`

**No incluido en Fase 5**:
- Core Web Vitals — normalmente vive dentro de la misma GA4 property
  (custom report) o de PageSpeed Insights API; se agrega si hace falta
  cuando GA4 ya esté configurado y en uso.
- El wiring de GA4/Search Console **no está probado de punta a punta**
  (no hay credenciales reales todavía) — el request/response sigue la
  documentación pública de ambas API pero puede necesitar un ajuste la
  primera vez que corra contra datos reales. Ver `INTEGRATION_SETUP.md`.
- Cache de las respuestas de Google — tráfico bajo hoy, no justifica la
  complejidad; se agrega si el uso real lo pide.

## Fase 6 — Automatizaciones ✅

- [x] `notifications` (migración `0008_notifications.sql`), RLS de solo
      lectura/marcar-leída desde la sesión — los inserts siempre van por
      `lib/notifications.ts` (cliente admin), ver `DATABASE.md` §1e
- [x] Eventos reales conectados: nuevo lead desde la web, cliente
      responde/aprueba un documento, cliente acepta/rechaza una
      cotización, cliente escribe un mensaje en el portal — cada uno ya
      generaba una mutación real (Fases 2-4); Fase 6 le agregó el aviso,
      no inventó el evento
- [x] Centro de notificaciones: `/dashboard/notifications` (marcar una o
      todas como leídas) + contador de no leídas en el sidebar
- [x] Email real a `CONTACT_TO_EMAIL` (Resend, ya configurado) cuando el
      cliente responde/acepta/escribe en el portal — best-effort, nunca
      rompe la acción del cliente si el envío falla
- [x] `quote.accepted` → 5 fases plantilla: se adelantó en Fase 4 (era la
      pieza de automatización real más obviamente útil de ahí, y quotes
      ya existían) en vez de reimplementarla aquí como un "workflow"
      genérico separado
- [x] Agenda interna (`calendar_events`, migración `0009_calendar.sql`):
      agregada más tarde, al replicar la guía visual del usuario (que
      incluía "Agenda" en el nav) — eventos internos con fecha/proyecto
      opcional, RLS org-scoped + adicional de portal de solo lectura.
      Es la agenda *del estudio*, no una sincronización con Google
      Calendar — esa integración externa (`lib/integrations/
      google-calendar.ts`, abajo) sigue sin implementar.

**No incluido en Fase 6**:
- Motor de workflows configurable (if this → that por UI) — con un único
  automatismo real (`quote.accepted`) y 4 tipos de notificación fijos,
  un motor genérico sería la abstracción prematura que la sección 55 del
  master prompt pide evitar. Se reconsidera si aparece un tercer patrón
  de automatización con forma distinta.
- Estado de lectura por notificación *por usuario* — ver "simplificación
  deliberada" en `DATABASE.md` §1e.
- `lib/integrations/google-calendar.ts`: solo interfaz de
  detección de configuración — el flujo OAuth por usuario (necesario
  porque Calendar no admite cuenta de servicio como GA4/Search Console)
  no está implementado todavía. Documentado en `INTEGRATION_SETUP.md`.
- `lib/integrations/whatsapp.ts`: wiring real contra la Graph API
  (`sendWhatsAppMessage`), gateado por credenciales — escrito pero **no
  probado de punta a punta** y nada en la UI lo llama todavía (no hay un
  caso de uso concreto que lo dispare esta fase).

## Fase 7 — IA (Archi AI) ✅

- [x] `lib/ai/tools.ts`: `getOverdueTasks`, `getPendingPayments`,
      `getLeadsToContact`, `getProjectSummary`, `getRevenue`,
      `getMarketingPerformance` — consultas reales con el cliente de
      sesión del usuario que pregunta (nunca el cliente admin), así que
      quedan sujetas exactamente a la misma RLS que el resto del
      dashboard; no hay una puerta más ancha para la IA
- [x] `app/api/ai/chat/route.ts`: wiring real de tool-calling contra la
      Generative Language API de Google (Gemini, fetch directo, sin SDK
      — mismo criterio que las demás integraciones de Google), con hasta
      4 rondas de llamadas a herramientas antes de responder. Empezó
      escrito contra la Chat Completions API de OpenAI; se re-escribió
      para usar Gemini a pedido explícito del usuario ("conectar la API
      de Google") — ver `ARCHITECTURE.md` no tiene sección propia para
      esto porque es un swap de proveedor sobre wiring ya documentado
      acá, no un cambio de arquitectura.
- [x] `/dashboard/ai`: interfaz de chat

Contrato de la API probado de punta a punta contra Gemini real (no solo
documentado) — corrigió el modelo default (`gemini-2.5-flash` ya no
existe para keys nuevas → `gemini-3.6-flash`) y el `role` del turno de
`functionResponse` (`"function"` es rechazado por la API; es `"user"`).
`GEMINI_API_KEY` ya está configurada en Vercel. Ver `INTEGRATION_SETUP.md`.

**No incluido en Fase 7** (el pendiente de acciones de escritura se
cerró después — ver "Asistente flotante + acciones de escritura + mapa"
abajo):
- Una corrida real a través de `/dashboard/ai` en el navegador con
  sesión autenticada — lo probado fue el contrato crudo de
  `generateContent` vía requests directos, no la ruta de la app completa.
- Streaming de la respuesta — con la interfaz esperando una sola
  respuesta corta por pregunta, el costo de implementar y probar SSE sin
  poder verificarlo end-to-end no se justificaba en esta fase.

## Asistente flotante + acciones de escritura + mapa (extensión de Fase 7) ✅

Pedido explícito del usuario: acceso a Archi AI desde cualquier pantalla
(no solo `/dashboard/ai`), y que la IA pueda *actuar* — cerrando el
pendiente que Fase 7 había dejado abierto a propósito ("merece su propio
diseño explícito"). Se sumó también dirección en clientes y un mapa de
clientes/proyectos (Google Maps), pedidos en el mismo mensaje.

- [x] **Widget flotante global** — `components/dashboard/floating-assistant.tsx`,
      montado en `app/(dashboard)/dashboard/layout.tsx`. Reusa `AiChat`
      (`app/(dashboard)/dashboard/ai/chat.tsx`) tal cual, sin refactor —
      ya era un client component autocontenido sin props. Se oculta en
      `/dashboard/ai` para no duplicar la conversación.
- [x] **Herramientas de escritura** en `lib/ai/tools.ts`: `createClient`,
      `scheduleEvent`, `createQuote` (con ítems reales, nunca inventados),
      más `listProjects`/`listClients` de lectura para que la IA resuelva
      nombres a ids reales antes de actuar. Decisión de diseño confirmada
      con el usuario: **ejecuta apenas tiene todo el dato real necesario y
      reporta qué hizo** (no pide confirmación aparte) — la garantía de
      seguridad es la regla anti-invención ya vigente en todo el proyecto:
      si falta un precio, fecha o a qué proyecto pertenece algo, pregunta
      en vez de adivinar. Mismo patrón de organización/RLS que las Server
      Actions equivalentes (`getCurrentOrganizationId`, sin cliente admin).
- [x] **Dirección en clientes** — columna `clients.address` (migración
      `0011`), campo en `client-form.tsx`, ficha de cliente.
- [x] **Mapa** (`/dashboard/map`) — columnas `latitude`/`longitude` en
      `clients` y `projects` (migración `0012`), geocodificadas server-side
      vía `lib/integrations/google-geocoding.ts` (nunca bloquea el guardado
      si falla; nunca inventa coordenadas). `components/dashboard/map-view.tsx`
      carga la Maps JavaScript API con `next/script` (primer uso en el
      proyecto) y pinta un pin por cliente/proyecto geocodificado, con
      `InfoWindow` y link a su ficha. Degrada a un estado vacío claro sin
      `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` configurada.

**No incluido en esta extensión**:
- Confirmación previa a las acciones de escritura de la IA — el usuario
  eligió explícitamente ejecutar-y-reportar en vez de proponer-y-esperar.
- Verificación en navegador (widget flotante, mapa) — mismo límite de
  siempre en esta sesión: se verificó con build tipado + lint, no con una
  sesión real en el navegador.
- Streaming de respuesta del chat — sigue fuera de alcance por el mismo
  motivo que en Fase 7.

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

## Rediseño visual (`DISEÑO/ARCHI.OS.dc.html`) ✅

No es una fase del master prompt — es un pase transversal pedido después
de cerrar la Fase 7: reemplazar el estilo genérico de un pulido anterior
por la guía visual específica que el usuario diseñó con Claude (carpeta
`DISEÑO/`). Cubrió dashboard admin + portal de cliente + login, y de
paso agregó tres pantallas que la guía incluía en el nav pero que no
existían como feature real:

- **Agenda** — ver Fase 6 arriba.
- **Reportes** (`/dashboard/reports`) — 4 reportes (comercial/
  financiero/proyectos/marketing) con exportación real: CSV vía
  `app/api/reports/[type]/csv/route.ts`, PDF vía vista imprimible
  (`/dashboard/reports/[type]/print`, mismo truco de impresión de Fase
  4). Nunca un botón decorativo que no hace nada.
- **Configuración** (`/dashboard/settings`) — solo lectura: nombre del
  estudio y equipo reales (`organization_members` + `profiles`). Sin
  edición todavía, sin los campos de color/dominio del mockup porque no
  existen en el modelo de datos.

También reestructuró la navegación: Leads/Clientes se unificaron en un
solo módulo `/dashboard/crm` (tabs Leads/Clientes/Pipeline, con vista
Kanban nueva para leads), y el workspace de un proyecto pasó de una
página larga a 7 tabs. Ver `ARCHITECTURE.md` §6d para el detalle técnico
completo, incluida la policy de storage que faltaba para que el portal
pudiera descargar documentos (no solo ver sus metadatos).

**Deliberadamente no incluido**: un modo oscuro real (el toggle Light/
Dark del mockup es una demo del propio editor de diseño, no un sistema
de temas pedido); el chrome de "⌘K Buscar" y los pills Admin/Portal/
Login del mockup (son chrome del editor de diseño de Claude para
previsualizar los 3 modos, no parte del producto).

## Segundo rediseño visual (`DISEÑO PROFESIONAL/ARCHI.OS v2.dc.html`) ✅

Pase transversal pedido después del anterior: el usuario le pidió a
Claude Design "un diseño mejor", entregado como
`diseño profesional.zip`. Es una dirección de arte completamente nueva
(tipografía Instrument Serif/Archivo/JetBrains Mono, paleta
papel/tinta con un único acento, radio 0px, cero iconos, disciplina de
estado texto+marca en vez de badges de color) que reemplaza el pase
anterior por completo en dashboard y portal — el sitio público no se
tocó. Ver `ARCHITECTURE.md` §6e para el detalle técnico completo
(tokens, componentes nuevos, mapeo de estado por dominio).

Agregó una pantalla nueva:

- **Design system** (`/dashboard/design-system`) — lámina de referencia
  estática con la tipografía, paleta, disciplina de estado, retícula,
  componentes y breakpoints reales del sistema. Contenido 100%
  documental, sin datos.

Y confirmó, con dos preguntas explícitas al usuario, dos decisiones que
en el pase anterior habían quedado implícitas: la paleta de comandos
(`⌘K`) se construyó real y funcional (no como chrome decorativo), y la
lámina de Design System se construyó como página real del panel.

**Deliberadamente no incluido** (mismo criterio que el pase anterior):
el segmented control "Estudio / Cliente / Acceso" del mockup (chrome
del editor de diseño — cada superficie ya vive en su propia ruta
autenticada real); "17 Modo tinta" (dark mode, sigue siendo demo, no
una feature pedida); datos que el mockup inventa y que no hay forma de
calcular real (p. ej. "Impacto en cronograma" en Aprobaciones, "Revisor"
como concepto distinto del cliente) — se omiten en vez de inventarse.

## Adopción de un dashboard SaaS de referencia ✅

Tercer pase visual: el usuario mandó una captura de un dashboard SaaS de
tickets/soporte y pidió "algo así en términos de diseño", con "más
colores que se vean elegantes". Esa referencia usa iconos en todo,
pastillas de color por estado y avatares — contradice de frente dos
decisiones del pase anterior (cero íconos, estado como texto/marca). Se
le preguntó al usuario qué tan literal quería el parecido antes de
tocar el sistema; eligió adoptar el look SaaS completo. Ver
`ARCHITECTURE.md` §6g para el detalle técnico completo.

- **Iconos, pastillas de color (5 tonos) y avatares** de vuelta en todo
  el dashboard/portal — `lucide-react` reinstalado, `StatusBadge`
  reemplaza `StatusLabel`, nuevo componente `Avatar`.
- **Selector de asignado real** en leads y tareas — el schema ya tenía
  `assigned_to` (FK a `profiles`) desde hacía tiempo pero ningún
  formulario lo usaba; se conectó en vez de dejar la columna de avatar
  siempre vacía.
- **Sparklines reales** en las tarjetas de KPI del dashboard que tienen
  un log de fechas detrás (leads/pagos/clientes/contratos) — nunca en
  las que son solo una foto del momento.

**Deliberadamente no incluido**: checkboxes de selección múltiple ni
menú de acciones en tres puntos en las tablas (la referencia los usa
para acciones en lote que no existen como feature en esta app);
reemplazar Instrument Serif por el sans-serif genérico de la referencia
(no fue parte del pedido y es la seña de identidad más elogiada del
sistema en las vueltas anteriores de feedback).
