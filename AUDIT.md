# AUDIT.md — Estado actual del proyecto (previo a ARCHI.OS)

Auditoría del repo `AdrianGutierrezArq` antes de convertirlo en ARCHI.OS.
Base para `ARCHITECTURE.md`, `DATABASE.md` y `ROADMAP.md`.

## 1. Stack

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 16.3.1 |
| UI | React | 19.2.8 |
| Lenguaje | TypeScript | ^5 |
| Estilos | Tailwind CSS | ^4 (`@tailwindcss/postcss`, tokens en `app/globals.css`) |
| Animación | Framer Motion | ^13.1.0 |
| Email | Resend | ^6.20.0 |
| Imágenes/build | sharp (vía `scripts/process-assets.js`) | ^0.35.3 |
| Iconos | simple-icons | ^16.28.0 |
| Lint | ESLint 9 + `eslint-config-next` | — |
| Sin ORM, sin base de datos, sin auth | — | — |

`package.json` no tiene `"type": "module"` (CommonJS por defecto); el único
script CJS (`scripts/process-assets.js`) usa `require()` con un
`eslint-disable` local.

## 2. Estructura actual de `app/`

```
app/
  layout.tsx        ← layout raíz: fuentes, LocaleProvider, Navbar, Footer,
                       ScrollProgress, envuelve TODO (público, sin distinción)
  page.tsx           ← home ("/")
  proyectos/
    page.tsx         ← archivo de proyectos ("/proyectos")
    [slug]/page.tsx  ← detalle de proyecto ("/proyectos/[slug]")
  api/
    contact/route.ts ← único endpoint; envía email vía Resend
  icon.png, apple-icon.png ← favicon/app icon (generados por
                              scripts/process-assets.js desde /logos)
```

No existe ninguna ruta privada, ni middleware, ni concepto de sesión.
**Todo** lo que hay en `app/` es público hoy.

## 3. Componentes (`components/`)

19 componentes, todos de una sola sección/pieza de UI cada uno (patrón
"un archivo = una sección"). Los que son `"use client"` (mayoría, por
Framer Motion o por consumir `useLocale()`/`useT()`):
Hero, Intro, Proceso, SobreEstudio, ProyectosGrid, ProyectosArchivo,
ProyectoDetalle, Footer, Navbar, ContactoCta, InstagramFeed, ContactoForm,
Contacto, ScrollProgress, RevealText, CountUp. Sin `"use client"` (o sin
necesitarlo): BlueprintArt, los íconos.

Todo el texto de la UI pública pasa por el sistema de i18n (`lib/i18n.tsx`)
en vez de estar hardcodeado — relevante porque cualquier pantalla nueva del
dashboard **no** debería reutilizar ese diccionario (es solo para el sitio
público ES/EN) sino tener el suyo propio si hace falta.

## 4. `lib/`

- **`content.ts`** — toda la data del sitio público: `studio`, `projects`
  (15 proyectos reales, con `featured` para la portada), `process`,
  `architectBio`, `contactNeeds`. Es contenido estático de marketing, no
  datos de negocio (no hay que migrarlo a la base de datos).
- **`i18n.tsx`** — `LocaleProvider`/`useLocale`/`useT`, diccionario
  ES/EN completo para toda la UI pública + traducciones de cada proyecto.
- **`instagram.ts`** — `getInstagramPosts()`, llama al Graph API de
  Instagram si `IG_ACCESS_TOKEN` está seteado; si no, devuelve `[]` (el
  componente cae a fotos locales curadas). Nunca lanza error.
- **`resend.ts`** — cliente de Resend, lee `RESEND_API_KEY`,
  `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL`.
- **`motion.ts`** — constante `EASE_OUT` compartida.

## 5. Variables de entorno actuales

De `.env.local.example` (ya versionado en git, sin secretos reales):

```
RESEND_API_KEY=
CONTACT_TO_EMAIL=adriangch95@gmail.com
CONTACT_FROM_EMAIL=onboarding@resend.dev
IG_ACCESS_TOKEN=
IG_USER_ID=
```

No hay ninguna variable de Supabase, Google, OpenAI, Stripe ni WhatsApp
todavía.

## 6. Deploy

- **Vercel**: proyecto `adrian-gutierrez-arq`, cuenta
  `francobracamonte24-3930s-projects`. **No hay auto-deploy por git** — el
  repo está conectado a GitHub (`francoalejandrob/adrian-gutierrez-arq`)
  pero los deploys a producción se hacen manualmente con `vercel --prod`
  desde la CLI (confirmado: un `git push` no dispara deploy).
- **GitHub**: repo privado, `master` como rama principal, historial limpio
  (cada cambio de esta sesión se commiteó y pusheó individualmente).
- **Supabase**: existe un proyecto ya creado en la cuenta,
  `ArqSystem&Website` (ref `edkzdwuvzbcrlycryffa`, región us-east-1,
  `ACTIVE_HEALTHY`, Postgres 17), sin usar todavía — es el que se va a
  enlazar para ARCHI.OS.
- **Google Analytics / Search Console**: no integrados.

## 7. Integraciones existentes y qué reutilizar tal cual

| Integración | Estado | Reutilizar para ARCHI.OS |
|---|---|---|
| Resend (`app/api/contact/route.ts`) | Funcionando | Sí — se extiende para además escribir en `leads`, no se reemplaza |
| Instagram Graph API (`lib/instagram.ts`) | Funcionando con fallback | Sí, tal cual — es del sitio público, no del CRM |
| Sistema de diseño (`app/globals.css`, paleta "Concreto Cálido") | — | Sí, para mantener coherencia visual si el dashboard comparte identidad, aunque con su propia densidad de UI (más tipo Linear/Notion, sección 38 del master prompt) |
| i18n (`lib/i18n.tsx`) | — | No se reutiliza para el dashboard (es un diccionario específico del marketing site) |

## 8. UX / performance / accesibilidad — observaciones

- El sitio ya pasa `next build` y ESLint limpio de forma consistente
  (verificado repetidamente durante esta sesión).
- Imágenes servidas vía `next/image` con `remotePatterns` ya configurado
  para el CDN de Instagram (`next.config.ts`).
- No hay tests (ni unitarios ni E2E) — coincide con la sección 45 del
  master prompt, que pide sumarlos progresivamente, no que ya existan.
- No hay CI configurado (ni GitHub Actions ni Vercel checks más allá del
  build del propio deploy).
- No hay `sitemap.xml` ni `robots.txt` explícitos — Next.js no los genera
  automáticamente a menos que se agreguen `app/sitemap.ts`/`app/robots.ts`;
  pendiente para cuando se trabaje SEO (sección 47).

## 9. Deuda técnica conocida

- Sin tests automatizados.
- Sin CI/CD (deploy manual).
- Sin `sitemap.ts`/`robots.ts`.
- El formulario de contacto no tiene rate limiting (solo un honeypot).
- `scripts/process-assets.js` depende de carpetas fuente locales
  (`/proyectos`, `/logos`, `/Instagram`, `Nueva carpeta`) que están en
  `.gitignore` — quien clone el repo de cero no puede regenerar
  `public/` sin esas carpetas (aceptable: son assets curados a mano, no
  se regeneran desde cero).

## 10. Conclusión para ARCHITECTURE.md

El proyecto está sano, sin deuda bloqueante, y listo para crecer sin
reescribirse: se puede introducir el dashboard privado como una rama nueva
de `app/` (route group) sin tocar el comportamiento público existente.
