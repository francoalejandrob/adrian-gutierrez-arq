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
Bitácora simple, reutilizable por leads y clients (y por lo que venga
después — projects, etc. — sin cambiar su forma).
| columna | tipo | notas |
|---|---|---|
| id | uuid, PK | |
| organization_id | uuid, FK | |
| entity_type | text | `lead` \| `client` |
| entity_id | uuid | (sin FK tipada — apunta a distintas tablas según `entity_type`) |
| body | text | |
| created_by | uuid, FK → profiles | |
| created_at | timestamptz | |

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
| `project_director`, `designer` | Fase 2 (Project Management) |
| `accounting` | Fase 4 (Finanzas) |
| `client` | Fase 3 (Client Portal) — probablemente ni siquiera vive en `organization_members`, sino en una tabla de acceso de portal separada, por aislarlo de los roles internos |

## 4. Tablas futuras (inventario, sin columnas definitivas)

Para que el esquema de arriba no choque con lo que viene. Se diseñan en
detalle cuando se implemente cada fase (`ROADMAP.md`):

- **Fase 2 — Project Management**: `projects`, `phases`, `tasks`,
  `task_dependencies`.
- **Fase 2/3 — Documentos**: `documents` (Storage + metadata),
  `document_versions`, `approvals`.
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
