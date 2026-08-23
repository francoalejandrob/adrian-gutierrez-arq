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

## 6f. Dos ajustes post-lanzamiento sobre §6e (profundidad, color, tarjetas)

Con §6e ya en producción, el usuario dio feedback directo dos veces: "se
ve muy plano" (faltaba color, botones sin profundidad) y luego, viendo
capturas reales del dashboard, "quiero que todos los recursos... se vean
delimitados por un recuadro con puntas redondeadas". Ambos ajustes viven
sobre el mismo sistema de tokens de §6e (no lo reemplazan) y están
documentados como fuente de verdad en `/dashboard/design-system`, no acá
en prosa:

- **Segundo color (`--color-verde`)**: el mockup original solo definía
  un acento (rojo, para "atención"). "Resuelto" pasó de tinta lisa a
  verde en `StatusLabel`/`StatusMark`, y verde se aplica donde es
  semánticamente correcto (etapa "ganado" del pipeline, cifras
  cobradas/margen) — no como decoración suelta.
- **`Button` con sombra sólida apilada** (`components/dashboard/ui/button.tsx`):
  offset hard-shadow tintada (acento en primario, tinta en secundario)
  con física de presión (el botón viaja hacia su sombra en `:active`) —
  reemplaza el estado sin sombra de §6e.
  Esto por sí solo no bastó — el feedback siguiente pidió tarjetas
  visibles, no solo botones con relieve.
- **Radio 0px revertido a tarjetas redondeadas**: `.dp-card` (definida en
  `app/globals.css`, dentro de `@layer components` — importante:
  *dentro* del layer, no como CSS suelto, porque CSS fuera de los layers
  de Tailwind gana por encima de cualquier utilidad aunque venga antes en
  el HTML, lo que habría vuelto un no-op cualquier override puntual tipo
  `border-acento/30`) — borde + esquina de 16px + sombra suave. El
  componente compartido `Section` ahora renderiza como `.dp-card`, así
  que este cambio se propaga solo a la mayoría de los bloques de
  contenido del dashboard/portal; las franjas de KPIs/resumen que no
  usaban `Section` (home, finanzas, marketing, website, ficha de
  cliente, workspace de proyecto) se migraron a mano a la misma clase.
  Los botones (`rounded-lg`) y los paneles ya delimitados (login, ⌘K,
  tarjetas de aprobación) también se redondearon para que todo el
  sistema comparta una sola esquina.

## 6g. Quinto pase: adoptar el look de un dashboard SaaS de referencia

El usuario mandó una captura de un dashboard SaaS de tickets/soporte
("Kravio") y pidió "algo así en términos de diseño", con "más colores
que se vean elegantes". Esa referencia usa iconos en todo (nav, header,
badges), pastillas de color por estado y avatares — lo opuesto a las
dos decisiones más citadas de §6e (cero íconos, estado como texto/marca
en vez de pastilla). Antes de tocar el sistema otra vez se le preguntó
al usuario qué tan literal quería el parecido (3 opciones); eligió
adoptar el look SaaS completo. Igual que §6e/§6f, es un pase completo
ejecutado en 8 etapas con checkpoint (build+lint+commit+deploy) cada
una — no un commit gigante.

Qué se mantiene a propósito (no es una adopción ciega de la referencia):
tipografía Instrument Serif en títulos/nombres (la seña de identidad más
elogiada en las 3 vueltas de feedback previas — la referencia usa
sans-serif genérico en todo, pero cambiar eso no fue parte del pedido);
la paleta base papel/superficie/filete/corte/concreto/grafito/tinta; las
tarjetas `.dp-card` de §6f; los gráficos SVG a mano de la vuelta
anterior (se les suma color, no se reemplazan por una librería); la
disciplina de nunca inventar datos.

Qué cambió:

- **Iconos de vuelta**: se reinstaló `lucide-react` (se había
  desinstalado en §6e) — nav lateral (reemplaza el índice numérico
  "01/02/03" de §6e), header (buscador tipo `⌘K`, campana con punto de
  no-leídos real, engranaje), botones, tabla de acciones, estados
  vacíos. El índice numérico se mantiene donde sigue teniendo sentido
  como referencia de fila/tabla (listas, franjas de KPI).
- **`StatusBadge` (nuevo, `components/dashboard/ui/status-badge.tsx`)**
  reemplaza `StatusLabel` (eliminado — cero importadores tras migrar
  todas las páginas) en cada uso de estado nombrado: pastilla
  `rounded-full` con ícono + texto, 5 tonos en vez de 3
  (`resolved`/`attention`/`warning`/`info`/`neutral`). Dos tokens de
  color nuevos en `app/globals.css`: `--color-ambar` (`#B07A34`,
  advertencia/en curso) y `--color-azul` (`#47607A`, informativo) —
  misma familia desaturada que acento/verde, no un azul/ámbar genérico
  de SaaS. Cada `*_TONE` en `lib/supabase/types.ts` (lead/proyecto/fase/
  tarea/cotización/contrato/pago/versión de documento) se remapeó a los
  5 tonos con más granularidad que el bucket de 3 anterior — una sola
  fuente de verdad que reusan tanto los badges como los gráficos
  (`lib/chart-colors.ts` → `TONE_STROKE`/`TONE_BG`).
- **`StatusMark`** pasa de marca geométrica abstracta (cuadrado/rombo) a
  ícono (`CheckCircle2`/`Circle`/`AlertCircle`) — mismo `tone` prop, para
  no tener dos vocabularios visuales (marca abstracta + ícono)
  conviviendo ahora que hay íconos en el resto del sistema.
- **`Avatar` (nuevo, `components/dashboard/ui/avatar.tsx`)**: chip
  circular de iniciales con color determinístico por nombre (hash simple
  → paleta fija), no una foto genérica. Se usa donde ya hay una persona
  real en los datos: contacto de lead/cliente, miembros del equipo, chip
  de usuario del sidebar/header del portal.
  **Hallazgo durante la exploración**: `leads.assigned_to` y
  `tasks.assigned_to` ya existían en el schema (FK a `profiles`) pero
  ningún formulario ni Server Action los usaba — se agregó un selector
  de asignado real en `lead-form.tsx` y en el form de tarea nueva del
  workspace de proyecto (`lib/members.ts` centraliza la query
  `organization_members` → `profiles`), y se persiste en
  `leads/actions.ts` / `projects/[id]/actions.ts`, para que la columna
  de avatar muestre datos reales en vez de estar siempre vacía.
- **`Sparkline` (nuevo, `components/dashboard/ui/sparkline.tsx` +
  `lib/sparkline.ts`)**: mini-gráfico de línea con variación % real
  (7 días vs. los 7 anteriores), solo en tarjetas del dashboard con un
  log de fechas real detrás (`leads.created_at`, `payments.paid_date`,
  `clients.created_at`, `contracts.created_at`). Deliberadamente **sin**
  sparkline en tarjetas que son una foto del momento sin serie histórica
  (tareas críticas, reuniones hoy, por cobrar) — mismo criterio anti-
  dato-inventado del proyecto, en vez de fabricar una tendencia falsa.
- **`Button`**: la sombra offset "apilada" de §6f se reemplazó por una
  sombra suave y sutil, más cercana al botón plano de la referencia —
  esta decisión puntual de §6f queda superada por la captura concreta
  que trajo el usuario ahora.
- **Gráficos con la paleta completa de 5 tonos**: el donut "Proyectos
  por estado" del dashboard pasó de 3 buckets colapsados (§6f) a pintar
  cada estado real con su propio tono (mismo `PROJECT_STATUS_TONE`),
  más colorido y consistente con el sistema de badges.

**Deliberadamente no incluido** (mismo criterio de las vueltas
anteriores): checkboxes de selección múltiple ni menú de acciones en
tres puntos en las tablas — la referencia los usa para acciones en lote
que no existen como feature en esta app; agregarlos habría sido UI
decorativa sin función real.

## 6h. Asistente flotante + acciones de escritura + mapa de clientes/proyectos

Pedido del usuario en un solo mensaje, después de confirmar que Archi AI
(§7 del ROADMAP, ver `ROADMAP.md`) ya funcionaba: acceso a la IA desde
cualquier pantalla, que la IA pueda agendar/crear clientes/cotizar (no
solo consultar), dirección en la ficha de cliente, y un mapa con pines de
clientes y proyectos (Google Maps, elegido explícitamente sobre otros
proveedores).

**Widget flotante** — `components/dashboard/floating-assistant.tsx`
("use client"), montado como hermano de `<main>` en
`app/(dashboard)/dashboard/layout.tsx`, envuelto en `print:hidden` igual
que `Sidebar`/`SheetHeader`. Reusa `AiChat`
(`app/(dashboard)/dashboard/ai/chat.tsx`) importado directamente entre
segmentos de rutas (Next.js lo permite sin problema) — `AiChat` ya era un
client component sin props que gestiona su propio estado y llama a
`/api/ai/chat`, así que no hizo falta ningún refactor para reutilizarlo
dentro de un panel emergente. Usa `usePathname()` para no renderizarse en
`/dashboard/ai` (evita el chat duplicado en su propia página).

**Herramientas de escritura** — `lib/ai/tools.ts` suma
`listProjects`/`listClients` (lectura, para que la IA resuelva un nombre
mencionado en el chat a un `id` real — nunca inventa UUIDs) y
`createClient`/`scheduleEvent`/`createQuote` (escritura). Mismo patrón de
organización que toda Server Action del proyecto:
`getCurrentOrganizationId(supabase)` con el cliente de sesión del usuario
que pregunta, nunca un cliente admin — RLS sigue siendo el único límite
real. `createQuote` exige un array de ítems con `description`/`quantity`/
`unit_price` reales; el `systemInstruction` en `app/api/ai/chat/route.ts`
instruye explícitamente a la IA a nunca inventar precios/fechas/ids y a
preguntar si falta algo. Decisión de producto confirmada con el usuario
(no asumida): la IA **ejecuta apenas tiene todo el dato real necesario y
reporta qué hizo**, sin pedir confirmación previa — la garantía de que
esto sea seguro es la regla anti-invención, no una capa extra de UI.
`toGeminiSchema` (mismo converter de §Fase 7) se extendió con un caso
`"array"` para el schema de `items` de `createQuote`.

**Dirección en clientes** — columna `clients.address` (migración
`supabase/migrations/0011_client_address.sql`), mismo tipo/criterio que
`projects.location` (texto libre, sin estructura). Se agregó a
`client-form.tsx`, `clients/actions.ts` y la ficha de cliente.

**Mapa** — `app/(dashboard)/dashboard/map/page.tsx` (Server Component) +
`components/dashboard/map-view.tsx` (client). Columnas `latitude`/
`longitude` en `clients` y `projects` (migración
`0012_geo_coordinates.sql`), pobladas server-side por
`lib/integrations/google-geocoding.ts` (fetch directo a la Geocoding API,
mismo criterio sin-SDK que el resto de `lib/integrations/`) cada vez que
se guarda un cliente con `address` o un proyecto con `location` — nunca
bloquea el guardado si la geocodificación falla o la key no está
configurada, y nunca inventa coordenadas: simplemente quedan `null` y el
pin no aparece. `map-view.tsx` es el primer uso de `next/script` en el
proyecto (no había precedente) para cargar la Maps JavaScript API bajo
demanda; usa `google.maps.Marker` clásico con icono de círculo coloreado
por tipo (cliente/proyecto) en vez de `AdvancedMarkerElement`, para no
depender de un `mapId` adicional. La página degrada a un estado vacío
(mismo patrón `NotConfigured`/dashed-border que
`app/(dashboard)/dashboard/website/page.tsx`) cuando falta
`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` o cuando todavía no hay ningún
cliente/proyecto geocodificado.

**Dos keys de Google Maps, no una** — `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
(navegador, pensada para restringirse por referrer HTTP al dominio de
producción) y `GOOGLE_MAPS_SERVER_API_KEY` (servidor, para geocoding,
sin restricción de referrer porque las llamadas son servidor-a-servidor
y esa restricción las bloquearía). Ambas requieren un proyecto de Google
Cloud con facturación habilitada — a diferencia de la key de Gemini de
Fase 7 — ver `INTEGRATION_SETUP.md`.

## 6i. Sexto pase: dark theme + tarjetas individuales redondeadas

El usuario mandó una captura de un dashboard SaaS de tickets con tema
oscuro (fondo casi negro, tarjetas gris oscuro separadas con esquinas
muy redondeadas por elemento, acentos verde/rojo/azul) y pidió el mismo
color más un "efecto de cuadrado con puntas redondeadas alrededor de
cada elemento", usando la skill `ui-ux-pro-max` para pulir la interfaz.
Confirmado con el usuario (AskUserQuestion): se mantiene Instrument
Serif para títulos, no se pasa a sans-serif como la referencia —sigue
siendo la seña de identidad preservada en cada pase anterior.

**Los 11 tokens semánticos del dashboard/portal (`app/globals.css`) se
recalibraron a valores oscuros** — mismo nombre/rol, valor nuevo,
contraste verificado con la fórmula WCAG real (no a ojo) antes de
fijarlos: texto principal 17.7:1, texto secundario 5.4–5.9:1, los 4
acentos 5.3–8.6:1 contra el nuevo fondo. Swap semántico clave: `tinta`
(máximo contraste) pasa de negro-tinta a casi-blanco; `papel` (fondo de
página) pasa de casi-blanco a casi-negro — como en el código existente
`bg-tinta` siempre viene emparejado con `text-papel` (botón primario,
avatar, overlay del command palette), el swap de valores solo, sin
tocar JSX, da el resultado correcto. Se agregó un token nuevo,
`--color-realce` (fondo de hover/activo), que además reemplazó un hex
`#EDEBE4` que estaba hardcodeado suelto en 11 archivos distintos (y un
`#6E6A60` por el token `concreto` ya existente).

Como `chart-colors.ts`, `status-badge.tsx`, `avatar.tsx`,
`sparkline.tsx` y `status-mark.tsx` son 100% "token-driven" (sin hex
hardcodeado), cambiaron de color solos con el swap de tokens. Se
verificó con cálculo de contraste (no se asumió) que la escala de
opacidad `TINTA_STROKE_SCALE`/`TINTA_BG_SCALE` de `chart-colors.ts`
sigue funcionando sin cambios tras el swap — es un fade simétrico de
color-de-primer-plano-hacia-el-fondo, la relación de prominencia se
preserva sin importar si `tinta` es oscuro-sobre-claro o
claro-sobre-oscuro. También se recalibró la opacidad de relleno de
`StatusBadge` de `/10` a `/6`: a `/10` el tono "attention" (`acento`)
quedaba justo debajo del mínimo de contraste texto-normal (4.36:1
contra 4.5:1 requerido); a `/6` los 5 tonos quedan entre 4.54:1 y
9.53:1.

Lo que **no** era token-driven se recalibró a mano: sombra de
`.dp-card` (pasó de una sombra rgba oscura —invisible sobre fondo ya
oscuro— a un highlight superior sutil + sombra de profundidad real),
sombras de `button.tsx`, `.dp-grain`/`.dp-grain-strong` (textura de
sidebar/header y panel de login), y se agregó `.dp-scope ::selection`
para que la selección de texto del dashboard no herede el naranja del
sitio público (se filtraba sin querer). Se corrigió además un bug real
que el swap habría introducido: el overlay del command palette usaba
`bg-tinta/[0.28]` como scrim oscurecedor — al volverse `tinta` claro,
ese overlay habría empezado a aclarar en vez de oscurecer; ahora usa
`bg-papel/70`.

**Efecto "cuadrado con puntas redondeadas por elemento"** — no era solo
color: 6 lugares del código agrupaban varias estadísticas dentro de
**una** `.dp-card` compartida, separadas por líneas internas
(`border-r`/`border-l border-filete` + una prop `last`/`first`) en vez
de ser tarjetas individuales con gap real: dashboard home ("Resumen
general"), ficha de cliente (`StatCell`), finanzas (`SummaryStat`),
marketing (funnel), workspace de proyecto tab finanzas (`SummaryStat`),
website (2 celdas). Se convirtieron los 6 al mismo patrón que ya usaba
la banda de KPIs del dashboard home (grid con `gap-4`, cada celda su
propia `.dp-card`). Excluido a propósito: el grid de
`dashboard/calendar/page.tsx` (7 columnas de días reales, no una banda
de estadísticas — convertirlo habría roto la continuidad visual del
calendario). `StatBandSkeleton` (`components/dashboard/ui/skeleton.tsx`)
se actualizó para que el loading state coincida con el patrón nuevo.

Los ítems del sidebar pasaron de rectángulo a todo lo ancho + barra de
acento izquierda, a píldoras redondeadas (`rounded-lg`, margen propio)
usando `realce` como fondo activo/hover — mismo lenguaje visual
aplicado a la navegación.

**Se mantienen las mismas familias de color** (rojo-terracota/
verde-salvia/ámbar/azul-pizarra) en vez de saltar a colores genéricos
tipo indigo/emerald que sugería la búsqueda inicial de la skill
`ui-ux-pro-max` — es la identidad cromática de 5 pases anteriores,
recalibrada para fondo oscuro, no reemplazada.

## 7. Qué NO cambia

- Ningún archivo de `app/(public)` cambia de comportamiento ni de URL.
- `lib/content.ts`, `lib/i18n.tsx`, `lib/instagram.ts`, `lib/resend.ts`
  quedan igual.
- El deploy sigue siendo el mismo proyecto de Vercel
  (`adrian-gutierrez-arq`); solo se agregan las env vars de Supabase.
