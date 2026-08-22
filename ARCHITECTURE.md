# ARCHITECTURE.md — ARCHI.OS

Arquitectura objetivo para convertir `AdrianGutierrezArq` en ARCHI.OS,
manteniendo el sitio público intacto. Ver `AUDIT.md` para el estado previo
y `DATABASE.md` para el modelo de datos.

## 1. Principio: un repo, dos aplicaciones lógicas

Un solo proyecto Next.js, un solo deploy en Vercel, pero dos "aplicaciones"
separadas por *route groups* (no afectan la URL):

```
app/
  layout.tsx              ← raíz mínima: <html>, fuentes, nada de UI
  (public)/
    layout.tsx             ← el layout de hoy: LocaleProvider, Navbar,
                              Footer, ScrollProgress
    page.tsx                → "/"
    proyectos/
      page.tsx               → "/proyectos"
      [slug]/page.tsx         → "/proyectos/[slug]"
  (dashboard)/
    layout.tsx              ← protegido por middleware; sidebar + topbar
    page.tsx                 → "/" ¡OJO! colisiona con (public)/page.tsx

  api/
    contact/route.ts        ← existente, se extiende (ver §4)
    auth/callback/route.ts  ← nuevo, callback del magic link de Supabase
```

**Corrección de diseño respecto al borrador inicial**: dos route groups no
pueden definir la misma ruta (`(public)/page.tsx` y `(dashboard)/page.tsx`
ambos mapean a `/`). El dashboard va bajo su propio segmento de URL:

```
(dashboard)/
  dashboard/
    layout.tsx       → protegido, sidebar
    page.tsx          → "/dashboard"
    leads/
      page.tsx         → "/dashboard/leads"
      [id]/page.tsx    → "/dashboard/leads/[id]"
    clients/
      page.tsx         → "/dashboard/clients"
      [id]/page.tsx    → "/dashboard/clients/[id]"
  login/
    page.tsx          → "/login"
```

Así el sitio público conserva exactamente sus URLs actuales (`/`,
`/proyectos`, `/proyectos/[slug]`) y todo lo privado vive bajo `/dashboard`
+ `/login`, fácil de excluir de indexación (`robots.txt` con
`Disallow: /dashboard` y `Disallow: /login`, sección 47).

## 2. Por qué separar el layout raíz

Hoy `app/layout.tsx` monta `LocaleProvider` + `Navbar` + `Footer` +
`ScrollProgress` para cualquier ruta. Si el dashboard quedara envuelto por
ese layout: cargaría el navbar/footer del marketing site (sin sentido en
un panel privado) y el `LocaleProvider` de i18n del sitio público (que no
tiene ninguna entrada para textos del CRM).

Con route groups, cada uno define su propio `layout.tsx` anidado dentro de
`app/layout.tsx`. El root queda mínimo (fuentes vía `next/font`, `<html>`,
`<body>` con las clases de fuente) y cada rama monta lo suyo:

- `(public)/layout.tsx` → exactamente lo que hoy tiene `app/layout.tsx`.
- `(dashboard)/layout.tsx` → un layout distinto: sidebar de navegación
  (sección 37, solo con los links que ya existen — Dashboard, Leads,
  Clients), sin `LocaleProvider` (el dashboard es solo español por ahora;
  si se pide bilingüe después, se agrega su propio provider).

## 3. Supabase

- **Proyecto reutilizado**: `ArqSystem&Website`
  (ref `edkzdwuvzbcrlycryffa`), ya existente y activo en la cuenta.
- **Paquetes**: `@supabase/supabase-js` + `@supabase/ssr` (el paquete
  oficial para App Router — reemplazó a `@supabase/auth-helpers-nextjs`,
  que está deprecado).
- **Tres formas de cliente**, según dónde se usa:
  - `lib/supabase/server.ts` — cliente para Server Components y Route
    Handlers, usando cookies de la request (`createServerClient` de
    `@supabase/ssr`). Es el que respeta la sesión del usuario logueado y
    por lo tanto respeta RLS como ese usuario.
  - `lib/supabase/client.ts` — cliente de browser (`createBrowserClient`),
    para los pocos casos donde haga falta desde un Client Component
    (formularios interactivos del dashboard).
  - `lib/supabase/admin.ts` — cliente con `SUPABASE_SERVICE_ROLE_KEY`,
    **solo** para el route handler de `api/contact` (necesita insertar un
    lead sin que el visitante público tenga sesión ni permisos). Nunca se
    importa desde un Client Component ni se expone al browser.
- **Proxy** (`proxy.ts` en la raíz — se llamaba `middleware.ts` hasta
  Next.js 15; el nombre y la función exportada cambiaron a `proxy` en
  Next.js 16): en cada request a
  `/dashboard/*`, refresca la sesión de Supabase (patrón estándar de
  `@supabase/ssr`) y redirige a `/login` si no hay usuario. Las rutas
  `(public)` y `api/contact` no pasan por esta verificación.

## 4. `api/contact/route.ts` — el punto de conexión web → CRM

Hoy: valida el body, envía un email con Resend, devuelve `{ ok: true }`.

Se agrega, **antes** de enviar el email (o en paralelo, sin bloquear si
falla): un insert en la tabla `leads` usando el cliente admin de Supabase,
con `source: "web"` y los mismos campos que ya captura el formulario
(`name`, `email`, `phone`, `location`, `need`, `message`). Si el insert
falla (Supabase caído, RLS mal configurado, etc.) se loguea el error pero
**igual se envía el email** — el lead nunca se pierde silenciosamente
mientras exista al menos un canal funcionando.

No hace falta un webhook con secreto compartido (como se había planteado
cuando el CRM iba a ser un repo aparte): al vivir en el mismo proceso,
es una llamada directa al cliente de Supabase.

## 5. Multi-tenant (preparado, no explotado todavía)

Todas las tablas de negocio llevan `organization_id` y las RLS policies
filtran por él (detalle en `DATABASE.md`). Hoy existe una sola fila en
`organizations` (el estudio de Adrián) y un solo usuario. La UI no muestra
selector de organización todavía —no hace falta con una sola— pero el
modelo ya soporta agregar una segunda sin migrar datos.

## 6. Estructura de carpetas nuevas

```
lib/
  supabase/
    server.ts
    client.ts
    admin.ts
    types.ts        ← tipos generados/derivados del esquema (Lead, Client, ...)
proxy.ts              ← (era middleware.ts antes de Next.js 16)
supabase/
  migrations/        ← SQL versionado, aplicado con `supabase db push`
app/(dashboard)/
  layout.tsx
  login/page.tsx
  dashboard/
    layout.tsx
    page.tsx
    leads/page.tsx, leads/[id]/page.tsx
    clients/page.tsx, clients/[id]/page.tsx
components/dashboard/   ← componentes propios del panel (sidebar, tablas,
                           formularios de lead/cliente), separados de
                           components/ del sitio público
```

## 6a. Fase 3 — Client Portal como tercer route group

```
app/(portal)/
  portal/
    login/page.tsx            → "/portal/login" (sin layout compartido)
    (authenticated)/           ← route group anidado: mismas URLs, layout propio
      layout.tsx                header + cerrar sesión
      page.tsx                  → "/portal"
      projects/[id]/page.tsx    → "/portal/projects/[id]"
```

El anidamiento `portal/(authenticated)/` existe porque `/portal/login` **no**
debe llevar el header de "sesión iniciada" — un `layout.tsx` en
`portal/` envolvería también al login (los layouts siguen la jerarquía de
carpetas, no se puede "saltar" una subcarpeta salvo con otro route group
adentro). `proxy.ts` protege `/portal/:path*` igual que `/dashboard/:path*`,
pero redirige a `/portal/login` en vez de `/login` cuando detecta esa
ruta.

Los clientes de portal **no** son `organization_members` — su acceso vive
en `portal_access` (email ↔ cliente) y RLS los reconoce con
`my_portal_client_ids()`, una policy *adicional* (no en reemplazo) sobre
`projects`/`phases`/`documents`/`document_versions`/`activity_log`. Ver
`DATABASE.md` §1c.

## 6b. Fase 2 — Storage y Gantt

Se agregó `lib/supabase/server.ts`'s mismo cliente para hablar con
**Supabase Storage** (bucket privado `documents`, ver `DATABASE.md`
§1b) — no hizo falta un cliente nuevo, `supabase.storage.from(...)` usa
la misma sesión/RLS-equivalente que el resto.

El cronograma (Gantt) de `/dashboard/projects/[id]`
(`components/dashboard/gantt-chart.tsx`) es una implementación propia con
divs posicionados por porcentaje según fecha, no una librería de
terceros — decisión explicada en el plan de Fase 2 (sin dependencia nueva
que mantener, estilo 100% acorde al resto del panel; el costo es que no
hay drag-to-resize todavía).

## 6c. Fase 4 — Vista imprimible sin librería de PDF

`/dashboard/quotes/[id]/print` necesita verse sin el sidebar/topbar del
dashboard, pero vive bajo `(dashboard)/dashboard/quotes/[id]/print/`, así
que hereda `dashboard/layout.tsx` igual que cualquier otra ruta (los
layouts no se pueden "saltar" con un route group anidado como se hizo con
`/portal/login` en Fase 3 — ahí el problema era otro layout intermedio,
no el mismo). La solución fue CSS, no reestructurar rutas:
`dashboard/layout.tsx` envuelve el sidebar en `print:hidden` y el `main`
en `print:p-0`; el navegador genera el PDF (Ctrl+P) mostrando solo el
contenido de la página. Mismo criterio que el Gantt propio de Fase 2: sin
dependencia nueva que mantener.

## 6d. Rediseño visual sobre `DISEÑO/ARCHI.OS.dc.html`

El usuario diseñó una guía visual completa con Claude (mockup HTML
interactivo en `DISEÑO/`) y pidió replicarla en el dashboard real,
reemplazando el "pulido" genérico de un turno anterior. Cambios
estructurales que introdujo, más allá de estilos:

- **Token nuevo `--color-noche` (`#141210`)** en `app/globals.css`: el
  gris-carbón cálido del sidebar. Distinto de `--color-carbon`
  (`#000000`, ya usado como color de *texto* en todo el sitio) para no
  pisar ese significado.
- **Patrón de tabs vía `?tab=`**: en vez de un componente de tabs con
  estado de cliente, cada pestaña (CRM, workspace de proyecto, Website,
  portal de cliente) es un `Link` a la misma ruta con un query param
  distinto, leído server-side (`searchParams.tab`) para decidir qué
  renderizar. Mismo patrón que los filtros de estado que ya existían en
  `/dashboard/leads` y `/dashboard/projects` — sin sumar una librería de
  tabs ni JS de cliente nuevo, y el estado de la pestaña sobrevive un
  refresh o un link compartido.
- **CRM unificado**: `/dashboard/leads` y `/dashboard/clients` (los
  índices) pasan a `redirect()` hacia `/dashboard/crm?tab=leads` /
  `?tab=clientes` — la guía los pide como un solo módulo con tabs
  (Leads/Clientes/Pipeline) en vez de dos páginas separadas en el nav.
  Las rutas de detalle/creación (`leads/[id]`, `leads/new`,
  `clients/[id]`, `clients/new`) no cambiaron de URL.
- **Workspace de proyecto en tabs**: `/dashboard/projects/[id]` pasó de
  una sola página larga a 7 tabs (Overview/Tareas/Cronograma/
  Documentos/Aprobaciones/Finanzas/Actividad) vía el mismo patrón
  `?tab=`. El fetch de datos no cambió (sigue trayendo todo en un
  `Promise.all`); solo cambió qué sección se renderiza.
- **Descarga de documentos habilitada en el portal**: la guía muestra un
  link "Descargar" en la pestaña Documentos del portal, que no existía
  antes (Fase 3 solo exponía metadatos, nunca el archivo). Se agregó la
  policy de `storage.objects` que faltaba — ver `DATABASE.md` §1f.
  `components/dashboard/download-button.tsx` pasó de importar la Server
  Action del dashboard directo a recibir `getUrl` como prop, para poder
  reusarse con la Server Action del portal (`getPortalDownloadUrl`) sin
  duplicar el componente.
- **Aprobaciones desde el dashboard**: la guía muestra botones Aprobar/
  Solicitar cambios también en el panel del estudio, no solo en el
  portal. Se agregó `updateDocumentVersionStatus` (Server Action de
  dashboard) que reutiliza el permiso RLS org-scoped que
  `organization_members` ya tenía sobre `document_versions` desde Fase
  2 — no es una policy nueva, es una superficie de UI nueva sobre un
  permiso existente.
- **Agenda, Reportes y Configuración son pantallas nuevas** (la guía las
  incluye en el nav aunque no existían como feature). Agenda tiene tabla
  propia (`calendar_events`, ver `DATABASE.md` §1f). Reportes exporta
  CSV real (`app/api/reports/[type]/csv/route.ts`) y PDF vía vista
  imprimible (mismo truco de §6c). Configuración es de solo lectura
  (nombre del estudio + equipo reales; sin los campos de color/dominio
  del mockup, que no existen en el modelo de datos).

## 6e. Segundo rediseño visual sobre `DISEÑO PROFESIONAL/ARCHI.OS v2.dc.html`

El usuario le pidió a Claude Design una guía visual distinta ("un diseño
mejor"), entregada como `diseño profesional.zip` y extraída a
`DISEÑO PROFESIONAL/`. Es una dirección de arte completamente nueva —no
una iteración de §6d— y su propio `github.md` la declara "independiente
de la marca del sitio público". Reemplaza el sistema de §6d por completo
en el dashboard y el portal (el sitio público sigue sin tocarse).

- **Segundo par de tokens en `app/globals.css`**: junto a los tokens del
  sitio público (`--color-hueso/carbon/naranja/…`) y sin tocarlos, se
  agregó una paleta "papel/tinta"
  (`--color-papel/superficie/filete/corte/concreto/grafito/tinta/acento`)
  y tres fuentes propias del dashboard/portal
  (`--font-dp-serif` = Instrument Serif, `--font-dp-sans` = Archivo,
  `--font-dp-mono` = JetBrains Mono, cargadas en `lib/dp-fonts.ts` vía
  `next/font/google`). El `--color-noche` de §6d (sidebar oscuro) se
  eliminó — este pase no tiene sidebar oscuro.
- **Radio 0 en todo el dashboard/portal**: identidad explícita del
  mockup ("la esquina viva es parte del sistema"), documentada también
  en la propia lámina de referencia del producto
  (`/dashboard/design-system`). Reemplaza los `rounded-[10px]`/`rounded-lg`
  de §6d.
- **Sin iconos**: se retiró `lucide-react` del dashboard/portal (y del
  `package.json`) — todo es tipográfico: índices numerados (01, 02…),
  flechas de texto (`←`/`→`) y una marca geométrica (`StatusMark`).
- **Disciplina de estado reemplaza los badges de color**: `StatusBadge`
  (pastilla de 5 tonos) se eliminó; en su lugar, `StatusLabel` (texto
  con color/peso, 3 tonos: `resolved`/`attention`/`neutral`) para
  estados nombrados en tablas/listas, y `StatusMark` (cuadrado
  relleno/hueco/rombo rojo/cuadrado gris) para líneas de tiempo,
  versiones de documento y prioridades. El mapeo estado→tono por
  dominio (lead, proyecto, fase, cotización, contrato, pago) vive en
  `lib/supabase/types.ts` junto a cada enum.
- **Navegación reestructurada**: `SheetHeader` (barra superior fija con
  breadcrumb + `CommandPalette` + fecha) reemplaza el header simple de
  §6d; el sidebar pasa de oscuro a un índice numerado agrupado
  (`components/dashboard/nav-items.ts` centraliza `NAV_GROUPS`,
  `CRUMBS` y los atajos de la paleta de comandos). Leads/Clientes/
  Pipeline son 3 entradas de nav separadas que siguen apuntando al mismo
  `/dashboard/crm?tab=` de §6d — solo cambió el nav, no la arquitectura
  de rutas.
- **`CommandPalette` real** (`⌘K`/`Ctrl+K`): modal client-side que
  filtra por texto una lista estática de destinos reales (rutas del
  nav, accesos rápidos de creación, atajos a Archi AI) y navega con
  `useRouter().push()` — sin búsqueda simulada.
- **Nueva pantalla `/dashboard/design-system`**: lámina de referencia
  estática (tipografía, paleta con hex reales, disciplina de estado,
  retícula, componentes, breakpoints) — contenido 100% documental, sin
  fetch de datos.
- **Portal del cliente vuelve a ser una sola página larga sin tabs**: se
  retiró la navegación `?tab=` que había introducido §6d en
  `/portal/projects/[id]` — el mockup v2 muestra hero + progreso/fases
  inline + próximo hito + aprobación destacada + documentos + pagos +
  mensajes en un solo scroll.
- **Website gana un tercer tab "Fuentes"**: la tabla "de la fuente al
  ingreso" (antes en `/dashboard/marketing`) se movió a
  `/dashboard/website?tab=fuentes`; Marketing pasó a ser un embudo
  agregado de 5 etapas (Visitas–gated a GA4/Leads/Clientes/Proyectos/
  Ingresos–reales) en vez de la tabla por canal.
- **Archi AI gana "Señales detectadas"**: además de las sugerencias con
  botón "Ejecutar" (que navegan a la pantalla real, ya existían en §6d
  como texto), se agregaron dos señales calculadas con datos propios
  (tarea más atrasada, mayor pendiente de cobro) — no hay insights de
  IA inventados sin un LLM real detrás.

## 7. Qué NO cambia

- Ningún archivo de `app/(public)` cambia de comportamiento ni de URL.
- `lib/content.ts`, `lib/i18n.tsx`, `lib/instagram.ts`, `lib/resend.ts`
  quedan igual.
- El deploy sigue siendo el mismo proyecto de Vercel
  (`adrian-gutierrez-arq`); solo se agregan las env vars de Supabase.
