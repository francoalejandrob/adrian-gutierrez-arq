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

## 7. Qué NO cambia

- Ningún archivo de `app/(public)` cambia de comportamiento ni de URL.
- `lib/content.ts`, `lib/i18n.tsx`, `lib/instagram.ts`, `lib/resend.ts`
  quedan igual.
- El deploy sigue siendo el mismo proyecto de Vercel
  (`adrian-gutierrez-arq`); solo se agregan las env vars de Supabase.
