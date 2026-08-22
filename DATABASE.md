# DATABASE.md — Modelo de datos de ARCHI.OS

Postgres vía Supabase (proyecto `ArqSystem&Website`). Todo con RLS
activado. Esquema `public`. Migraciones en `supabase/migrations/`,
numeradas y auditables (sección 57 del master prompt: nada se cambia a
mano en producción).

## 1. Tablas de este pase (implementadas ahora)

### `organizations`
| columna | tipo | notas |
|---|---|---|
| id | uuid, PK | default `gen_random_uuid()` |
| name | text | "Adrián Gutiérrez Arquitectura" (seed) |
| created_at | timestamptz | default `now()` |

### `profiles`
1:1 con `auth.users` (Supabase gestiona `auth.users`; esta tabla guarda lo
que le pertenece a la app).
| columna | tipo | notas |
|---|---|---|
| id | uuid, PK | mismo id que `auth.users.id` (FK) |
| full_name | text | |
| email | text | copiado de `auth.users` al crear, para no hacer join siempre |
| created_at | timestamptz | |

### `organization_members`
| columna | tipo | notas |
|---|---|---|
| id | uuid, PK | |
| organization_id | uuid, FK → organizations | |
| user_id | uuid, FK → profiles | |
| role | text | `org_admin` \| `architect` (ver §3 — el resto de roles del master prompt se agregan cuando existan los módulos que los usan) |
| created_at | timestamptz | |
| — | | `UNIQUE (organization_id, user_id)` |

### `leads`
Campos de la sección 9 del master prompt, adaptados a lo que tiene sentido
capturar ya (los de tracking de marketing —`utm_*`, `campaign`,
`landing_page`— se agregan en la fase de Website Intelligence, cuando haya
algo real que los llene; columnas vacías para siempre son ruido, no
preparación).

| columna | tipo | notas |
|---|---|---|
| id | uuid, PK | |
| organization_id | uuid, FK | |
| name | text | (se guarda completo; sin split first/last — el formulario público captura un solo campo "Nombre") |
| email | text | |
| phone | text | nullable |
| location | text | "ciudad, país" — mismo campo que ya existe en el formulario del sitio |
| need | text | valor de `contactNeeds` (`lib/content.ts`) o libre si viene de fuera del form |
| message | text | |
| status | text | `nuevo` \| `contactado` \| `propuesta` \| `negociacion` \| `ganado` \| `perdido` (sección 10, sin `meeting`/`site_visit` todavía — se agregan si el flujo real los necesita) |
| source | text | `web` \| `manual` |
| estimated_value | numeric | nullable |
| assigned_to | uuid, FK → profiles | nullable (hoy siempre el único usuario) |
| created_at | timestamptz | |
| updated_at | timestamptz | |

### `clients`
| columna | tipo | notas |
|---|---|---|
| id | uuid, PK | |
| organization_id | uuid, FK | |
| name | text | |
| email | text | |
| phone | text | nullable |
| company | text | nullable |
| converted_from_lead_id | uuid, FK → leads | nullable |
| notes | text | nullable |
| created_at | timestamptz | |

### `activity_log`
Bitácora simple, reutilizable por leads, clients y (desde Fase 2)
projects.
| columna | tipo | notas |
|---|---|---|
| id | uuid, PK | |
| organization_id | uuid, FK | |
| entity_type | text | `lead` \| `client` \| `project` |
| entity_id | uuid | (sin FK tipada — apunta a distintas tablas según `entity_type`) |
| body | text | |
| created_by | uuid, FK → profiles | |
| created_at | timestamptz | |

## 1b. Tablas de Fase 2 — Project Management

Migración `0004_project_management.sql`. Mismo patrón de RLS que arriba.

### `projects`
| columna | tipo | notas |
|---|---|---|
| id | uuid, PK | |
| organization_id | uuid, FK | |
| client_id | uuid, FK → clients | `on delete restrict` — no se puede borrar un cliente con proyectos |
| name, description | text | |
| category | text | mismo enum del sitio público (Residencial/Comercial/Institucional/Hospitalidad/Remodelación), nullable |
| location | text | |
| budget, contracted_value | numeric | nullable |
| start_date, estimated_end_date, actual_end_date | date | nullable |
| status | text | `planning`\|`design`\|`documentation`\|`permits`\|`construction`\|`supervision`\|`delivery`\|`completed`\|`on_hold`\|`cancelled` |
| progress | smallint | 0-100, manual en este pase (no calculado desde las tareas) |
| project_manager | uuid, FK → profiles | nullable |
| created_at, updated_at | timestamptz | |

### `phases`
| columna | tipo | notas |
|---|---|---|
| id, organization_id, project_id | uuid | |
| name, description | text | |
| position | integer | orden de despliegue, fijado al crear |
| start_date, end_date | date | nullable — sin ambas, la fase no aparece en el Gantt |
| status | text | `pendiente`\|`en_progreso`\|`completada` |
| progress | smallint | 0-100 |
| responsible | uuid, FK → profiles | nullable |
| created_at | timestamptz | |

### `tasks`
| columna | tipo | notas |
|---|---|---|
| id, organization_id, project_id | uuid | |
| phase_id | uuid, FK → phases | nullable (`on delete set null` — borrar una fase no borra sus tareas) |
| title, description | text | |
| assigned_to | uuid, FK → profiles | nullable |
| priority | text | `low`\|`medium`\|`high`\|`critical` |
| status | text | `backlog`\|`todo`\|`in_progress`\|`review`\|`completed` |
| due_date | date | usado por el KPI de "tareas vencidas" del dashboard |
| estimated_hours, actual_hours | numeric | nullable, sin UI de captura de horas todavía |
| created_at, updated_at | timestamptz | |

### `documents` + `document_versions`
`documents` es la "familia" (nombre + categoría); cada archivo real es una
fila en `document_versions`.

`documents`: id, organization_id, project_id, name, category
(`contrato`\|`plano`\|`render`\|`presupuesto`\|`reporte`\|`aprobacion`\|
`entrega_final`\|`otro`), created_at.

`document_versions`: id, document_id (FK), version (int, único por
documento), storage_path, file_size, mime_type, status
(`borrador`\|`enviado`\|`aprobado`\|`cambios_solicitados`), comment,
uploaded_by (FK → profiles), created_at.

### Storage — bucket `documents`
Privado (`public: false`). Convención de ruta:
`{organization_id}/{project_id}/{document_id}/{version}-{filename}`.
La policy de `storage.objects` valida que el primer segmento de la ruta
(`storage.foldername(name)[1]`) sea una organización del usuario — mismo
principio que las RLS de tablas, aplicado a Storage. Nunca se sirve el
bucket como público; toda descarga pasa por
`supabase.storage.from('documents').createSignedUrl(path, 60)` (URL
válida 60 segundos), generada bajo demanda en el momento de la descarga,
no guardada ni reutilizada.

## 1c. Tablas de Fase 3 — Client Portal

Migración `0005_client_portal.sql`.

### `portal_access`
Quién (por email) puede ver qué cliente en `/portal`. Deliberadamente
separada de `organization_members` — un acceso de portal nunca debe poder
convertirse por accidente en acceso interno.
| columna | tipo | notas |
|---|---|---|
| id, client_id (FK → clients) | uuid | |
| email | text | el email con el que el cliente hace login |
| invited_by | uuid, FK → profiles | quién lo invitó |
| created_at | timestamptz | |
| — | | `UNIQUE (client_id, email)` |

Solo miembros de la organización pueden leer/escribir `portal_access` —
el cliente nunca la ve ni la edita.

### Columnas nuevas en tablas existentes
- `documents.visibility`: `internal` (default) \| `client`. Solo lo
  `client` es visible en el portal.
- `activity_log.visible_to_client`: boolean, default `false`. Las notas
  internas nunca llegan al portal; los mensajes que el cliente escribe se
  insertan siempre con `true`.
- `document_versions.approved_at` / `approved_by` (FK → profiles):
  quién y cuándo respondió (aprobó o pidió cambios) — puede ser un
  usuario interno o un usuario de portal, por eso apunta a `profiles` en
  vez de a `organization_members`.

### Helper `my_portal_client_ids()`
Mismo patrón que `my_organization_ids()`: los `client_id` de
`portal_access` cuyo email coincide (case-insensitive) con el email del
usuario autenticado (`profiles.email` de `auth.uid()`).

### Alcance de lo que un usuario de portal puede ver/hacer
SELECT en `projects`/`phases` de su(s) cliente(s); SELECT en `documents`
solo `visibility='client'`; SELECT/UPDATE en `document_versions` solo de
esos documentos (el UPDATE está pensado para que la Server Action toque
únicamente `status`/`comment`/`approved_at`/`approved_by` — no hay RLS de
columna, es una restricción de la capa de aplicación); SELECT/INSERT en
`activity_log` solo `visible_to_client=true` de su proyecto. **Nunca**
`clients`, `leads`, `tasks`, ni las tablas de otra organización u otro
cliente — verificado con una sesión real de prueba (ver el pase de Fase
3), no solo revisando el SQL.

## 1d. Tablas de Fase 4 — Finanzas

Migración `0006_finance.sql`. Todo ligado a `project_id` (se cotiza y
contrata sobre un proyecto ya creado — crear un proyecto en ARCHI.OS es
una acción liviana, así que no hace falta un camino paralelo de "quote
sin proyecto" como sugiere el master prompt para estudios más grandes).

### `quotes`
| columna | tipo | notas |
|---|---|---|
| id, organization_id, project_id | uuid | |
| status | text | `draft` \| `sent` \| `negotiation` \| `accepted` \| `rejected` \| `expired` |
| issue_date | date | default `current_date` |
| valid_until | date | nullable |
| discount, tax_rate | numeric | default `0`; `subtotal`/`total` se calculan en el cliente desde `quote_items` (`quoteTotal()` en `lib/supabase/types.ts`), no se guardan duplicados |
| notes | text | nullable |
| created_at, updated_at | timestamptz | |

### `quote_items`
| columna | tipo | notas |
|---|---|---|
| id, quote_id (FK → quotes, cascade) | uuid | |
| description | text | |
| quantity, unit_price | numeric | default `1` / `0` |
| position | integer | orden de despliegue |

### `contracts`
| columna | tipo | notas |
|---|---|---|
| id, organization_id, project_id | uuid | |
| quote_id | uuid, FK → quotes, nullable, `on delete set null` | referencia informativa, no obliga a tener cotización previa |
| value | numeric | |
| start_date, end_date | date | nullable |
| payment_terms | text | nullable |
| status | text | `draft` \| `active` \| `completed` \| `cancelled` |
| signed_at | timestamptz | nullable — se marca manualmente al pasar a `active`; sin firma digital (diferido, sección 21 del master prompt) |
| notes | text | nullable |

### `payments`
| columna | tipo | notas |
|---|---|---|
| id, organization_id, project_id | uuid | |
| amount | numeric | |
| currency | text | default `USD` |
| status | text | `pendiente` \| `pagada` \| `vencida` — manual, no se recalcula solo por pasar `due_date` (ver `ROADMAP.md` Fase 4, "no incluido") |
| due_date, paid_date | date | nullable |
| method, reference, notes | text | nullable |

### `expenses`
| columna | tipo | notas |
|---|---|---|
| id, organization_id, project_id | uuid | |
| category | text | `materiales` \| `mano_obra` \| `permisos` \| `subcontrato` \| `otro` |
| amount | numeric | |
| date | date | default `current_date` |
| description, supplier | text | nullable |

### Alcance de portal en estas tablas
Adicional (no reemplaza) a la RLS org-scoped:
- `quotes`: SELECT solo si `status` ya no es `draft` (o sea
  `sent`/`negotiation`/`accepted`/`rejected`/`expired`); UPDATE solo si
  `status` está en `sent`/`negotiation` (para que el cliente pueda
  aceptar/rechazar — `respondToQuote()` en `app/(portal)/portal/actions.ts`).
- `quote_items`: SELECT vía el `quote_id` visible.
- `payments`: SELECT únicamente — los pagos los crea y edita solo el
  estudio, el portal es de solo lectura.
- `contracts` y `expenses`: **sin** policy de portal — el cliente nunca
  ve el valor del contrato ni los gastos internos del estudio.

## 1e. Tablas de Fase 6 — Automatizaciones

Migración `0008_notifications.sql`.

### `notifications`
| columna | tipo | notas |
|---|---|---|
| id, organization_id | uuid | |
| user_id | uuid, FK → profiles, nullable | `null` = visible a todos los miembros de la organización. Hoy **siempre** `null` — con 2 usuarios `org_admin` no hay todavía una razón real para dirigir una notificación a uno y no al otro (mismo criterio de "no roles sin necesidad real" que el resto del esquema) |
| type | text | libre, p. ej. `lead.created`, `document.responded`, `quote.responded`, `message.received` |
| title, body | text | `body` nullable |
| entity_type, entity_id | text / uuid | nullable, para enlazar a la entidad relacionada (hoy siempre `project` o `lead`) |
| read_at | timestamptz | nullable = no leída |
| created_at | timestamptz | |

**Simplificación deliberada**: no hay estado de lectura por usuario. Con
`user_id` casi siempre `null` (broadcast), marcar una notificación como
leída la marca leída para *todos* los miembros de la organización — no
hay una tabla intermedia `notification_reads`. Aceptable con 2 usuarios;
se revisita si se agrega un tercer usuario y la falta de estado
individual empieza a molestar en la práctica.

### Inserts: siempre vía cliente admin
Ningún usuario —ni de dashboard ni de portal— tiene permiso de insertar
directamente en `notifications` (no hay policy de insert). El insert
siempre pasa por `lib/notifications.ts` (`notifyStudio()`), que usa el
cliente service-role. Es la única forma práctica de que una acción de un
usuario de **portal** (que no es `organization_member`) pueda dejarle un
aviso al estudio sin necesitar una policy nueva y más permisiva sobre una
tabla que el resto de la organización sí puede leer.

### Eventos que disparan una notificación (Fase 6)
- Nuevo lead desde el sitio web (`app/api/contact/route.ts`, sin email
  duplicado — el estudio ya recibe el correo de siempre).
- Cliente responde/aprueba un documento en el portal
  (`respondToDocumentVersion` en `app/(portal)/portal/actions.ts`).
- Cliente acepta/rechaza una cotización en el portal (`respondToQuote`).
- Cliente escribe un mensaje en el portal (`addPortalMessage`).

Las tres acciones de portal además envían un email al estudio vía Resend
(reutilizando `lib/resend.ts`, mismo patrón que `api/contact`) —
best-effort: si Resend falla, la acción del cliente en el portal igual
se guarda, solo se pierde el aviso por correo.

## 1f. Agenda (construida al replicar la guía visual del usuario)

Migración `0009_calendar.sql`.

### `calendar_events`
| columna | tipo | notas |
|---|---|---|
| id, organization_id | uuid | |
| project_id | uuid, FK → projects, nullable, `on delete set null` | evento interno (sin proyecto) si es `null` |
| title | text | |
| starts_at | timestamptz | |
| ends_at | timestamptz | nullable |
| notes | text | nullable |
| created_by | uuid, FK → profiles, nullable | |
| created_at | timestamptz | |

RLS: policy org-scoped estándar + policy adicional de portal (SELECT
únicamente, eventos cuyo `project_id` pertenece a un proyecto del
cliente — un evento sin proyecto nunca es visible en el portal).
Verificado con test E2E (anon sin acceso, org member ve todo, portal
solo ve eventos de su propio proyecto, portal no puede insertar).

Alimenta el KPI "Reuniones hoy" del dashboard y la tarjeta "Próxima
reunión" del portal de cliente.

### Storage: descarga de documentos desde el portal
Migración `0010_portal_document_downloads.sql`. Hasta esta migración,
`storage.objects` solo tenía policy para `organization_members` — un
cliente de portal podía ver los metadatos de `document_versions` (Fase
3) pero nunca pudo descargar el archivo real. Se agregó una policy de
`select` adicional sobre `storage.objects` que valida **dos cosas** a la
vez contra la ruta del archivo (`{organization_id}/{project_id}/{document_id}/...`,
`storage.foldername(name)[3]` = `document_id`):
1. el `project_id` de la ruta pertenece a un proyecto del cliente
   (`my_portal_client_ids()`), y
2. el `documents.visibility` de ese `document_id` es `'client'`.

La verificación por `documents.visibility` es necesaria porque la
estructura de carpetas por sí sola solo prueba "este proyecto es del
cliente", no que el estudio haya marcado ese documento específico como
compartible — sin ese segundo chequeo, un cliente podría generar una URL
firmada para un documento interno con solo adivinar/enumerar su ruta.
Verificado con test E2E (incluye una descarga real end-to-end del
archivo, no solo que la policy no tire error).

## 2. RLS (todas las tablas de arriba)

Policy única por tabla: el usuario debe estar autenticado y pertenecer
(vía `organization_members`) a la `organization_id` de la fila, para
`select`/`insert`/`update`/`delete`. Ejemplo (misma forma para todas):

```sql
create policy "org members access" on leads
  for all
  using (
    organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid()
    )
  )
  with check (
    organization_id in (
      select organization_id from organization_members
      where user_id = auth.uid()
    )
  );
```

El insert que hace `api/contact/route.ts` usa el cliente **service role**
(bypassa RLS a propósito — es el único camino para que un visitante sin
sesión cree un lead).

## 3. Roles (sección 7 del master prompt) — estado

Activos ahora: `org_admin`, `architect` (en la práctica, hoy Adrián es
`org_admin` y es el único usuario).

Documentados para cuando exista el módulo correspondiente, **no**
creados todavía en `organization_members.role` (agregar un valor de rol
sin nada que lo use es UI/permiso falso):

| rol | se activa en |
|---|---|
| `super_admin` | Fase 8 (SaaS multi-organización real) |
| `project_director`, `designer` | Diferido — ver `ROADMAP.md` Fase 2: con 2 usuarios y ambos `org_admin`, agregar el rol sin ningún permiso que lo distinga sería UI falsa. Se activa cuando haya un tercer usuario con acceso más limitado que justifique la distinción |
| `accounting` | Diferido, igual criterio que `project_director`/`designer` — Fase 4 construyó las tablas/UI de Finanzas pero con 2 usuarios `org_admin` no hay todavía una distinción de permisos real que lo justifique |
| `client` | Ya resuelto sin este rol — ver §1c: `portal_access` aisla el acceso de cliente sin tocar `organization_members` |

## 4. Tablas futuras (inventario, sin columnas definitivas)

Para que el esquema de arriba no choque con lo que viene. Se diseñan en
detalle cuando se implemente cada fase (`ROADMAP.md`):

- **Fase 2 — task_dependencies**: no se implementó junto con el resto de
  Fase 2 (el Gantt de este pase es de fechas, no de ruta crítica) — se
  agrega si/cuando se pide un Gantt con dependencias reales.
- **Fase 3 — `approvals` como tabla propia**: no hizo falta — se resolvió
  reutilizando `document_versions.status`/`comment`/`approved_at`/
  `approved_by` (§1c) en vez de una tabla nueva.
- **Fase 3 — `portal_messages` como tabla propia**: tampoco hizo falta —
  se resolvió reutilizando `activity_log` con `visible_to_client=true`.
- **Fase 4 — Comercial/Finanzas**: implementado — ver §1d.
- **Fase 5 — Website Intelligence**: implementado — migración
  `0007_marketing.sql` agrega a `leads` las columnas `utm_source`,
  `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`,
  `landing_page` (todas `text`, nullable). GA4/Search Console no son
  tablas de negocio — se consultan vía API en cada carga de
  `/dashboard/website`, sin cachear todavía (tráfico bajo, no hace falta
  aún).
- **Fase 6 — Automatizaciones**: implementado — ver §1e. No hizo falta
  una tabla de definición de workflows: los eventos que disparan una
  notificación se resolvieron en código, dentro de la misma Server Action
  que ya hacía la mutación (ver `lib/notifications.ts`).
- **Fase 7 — IA**: implementado, sin tablas propias — confirmado que no
  hacían falta. `lib/ai/tools.ts` son funciones que reciben el cliente de
  sesión del usuario que pregunta y consultan `tasks`, `payments`,
  `leads`, `projects`, `contracts`, `expenses`, `clients` con ese mismo
  cliente — RLS se aplica igual que en cualquier página del dashboard
  (sección 34 del master prompt: nunca acceso directo sin pasar por los
  mismos permisos que un usuario). No se guarda historial de
  conversación en base de datos todavía (vive solo en el estado del
  chat del navegador) — se agrega si hace falta seguimiento entre
  sesiones.

## 5. Índices previstos (además de las FKs)

- `leads (organization_id, status)` — para el listado/pipeline filtrado.
- `leads (organization_id, created_at desc)` — orden por defecto.
- `clients (organization_id)`.
- `activity_log (entity_type, entity_id)`.
- `quotes (project_id)`, `quote_items (quote_id)`.
- `contracts (project_id)`.
- `payments (project_id)`, `payments (organization_id, status)` — para
  `/dashboard/finance`.
- `expenses (project_id)`.
- `projects (organization_id, status)`, `projects (client_id)`.
- `phases (project_id, position)`.
- `tasks (project_id)`, `tasks (phase_id)`, `tasks (organization_id, due_date)` —
  esta última es la que usa el KPI de tareas vencidas del dashboard.
- `documents (project_id)`, `document_versions (document_id)`.
