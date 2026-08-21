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
| `accounting` | Fase 4 (Finanzas) |
| `client` | Fase 3 (Client Portal) — probablemente ni siquiera vive en `organization_members`, sino en una tabla de acceso de portal separada, por aislarlo de los roles internos |

## 4. Tablas futuras (inventario, sin columnas definitivas)

Para que el esquema de arriba no choque con lo que viene. Se diseñan en
detalle cuando se implemente cada fase (`ROADMAP.md`):

- **Fase 2 — task_dependencies**: no se implementó junto con el resto de
  Fase 2 (el Gantt de este pase es de fechas, no de ruta crítica) — se
  agrega si/cuando se pide un Gantt con dependencias reales.
- **Fase 2 — `approvals`**: el master prompt (sección 19) pide un flujo
  de aprobación cliente↔documento; no se construyó en este pase porque
  depende del Client Portal (Fase 3) para que el cliente tenga dónde
  aprobar — se diseña junto con esa fase.
- **Fase 3 — Client Portal**: `portal_access` (o reutilizar
  `organization_members` con rol `client` + `client_id` — se decide al
  diseñar la fase), `portal_messages`.
- **Fase 4 — Comercial/Finanzas**: `quotes`, `quote_items`, `contracts`,
  `payments`, `expenses`.
- **Fase 5 — Website Intelligence**: no son tablas de negocio — son datos
  de GA4/Search Console consultados vía API, cacheados si hace falta.
  `leads` sí gana entonces las columnas `utm_source`, `utm_medium`,
  `utm_campaign`, `landing_page`.
- **Fase 6 — Automatizaciones**: `notifications`, y probablemente una
  tabla de definición de workflows si no se resuelve en código.
- **Fase 7 — IA**: sin tablas propias necesariamente; depende de tools que
  leen las tablas existentes respetando RLS (sección 34 — nunca acceso
  directo sin pasar por los mismos permisos que un usuario).

## 5. Índices previstos (además de las FKs)

- `leads (organization_id, status)` — para el listado/pipeline filtrado.
- `leads (organization_id, created_at desc)` — orden por defecto.
- `clients (organization_id)`.
- `activity_log (entity_type, entity_id)`.
- `projects (organization_id, status)`, `projects (client_id)`.
- `phases (project_id, position)`.
- `tasks (project_id)`, `tasks (phase_id)`, `tasks (organization_id, due_date)` —
  esta última es la que usa el KPI de tareas vencidas del dashboard.
- `documents (project_id)`, `document_versions (document_id)`.
