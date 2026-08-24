# Adrián Gutiérrez — Arquitectura & Diseño

Sitio web de una página para el estudio de arquitectura de Adrián Gutiérrez
(Salinas, Ecuador). Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 +
Framer Motion.

**En vivo:** https://adrian-gutierrez-arq.vercel.app
(el formulario de contacto no enviará emails hasta que se configure
`RESEND_API_KEY` en las variables de entorno del proyecto en Vercel — ver
más abajo).

## ARCHI.OS

El panel interno del estudio (CRM, proyectos, finanzas, Archi AI) vivió
en este mismo repo hasta que se separó en su propio producto: ahora es
https://github.com/francoalejandrob/archi-os, desplegado en
https://archi-os.vercel.app, con su propio `package.json` y su propio
deploy de Vercel — mismo proyecto de Supabase que este repo.

Lo único que queda acá de esa integración es el formulario de contacto
(`/api/contact`), que sigue creando el lead directo en la base de datos
de ARCHI.OS vía `lib/supabase/admin.ts` — ver más abajo.

## Contenido de demostración

Este proyecto está en desarrollo. Los 7 proyectos reales (`lib/content.ts`,
fotos en `public/proyectos/`) ya reemplazan el contenido ficticio original,
pero lo siguiente sigue siendo **provisional** y debe revisarse antes de
publicar el sitio:

- La ubicación de cada proyecto se infirió a partir de las imágenes (el
  estudio opera desde Salinas, Ecuador) y debe confirmarse caso por caso en
  `lib/content.ts`.
- La descripción y el tagline de cada proyecto se redactaron a partir del
  contenido visual de los renders; conviene revisarlos con datos reales del
  cliente/obra.
- La bio y la cita del arquitecto (`lib/content.ts`) fueron redactadas como
  placeholder editorial.
- Los años de experiencia (5) y proyectos entregados (20) son genéricos.
- No se incluyeron redes sociales en el footer porque no se proporcionaron
  cuentas reales; agrégalas en `components/footer.tsx` cuando existan.

Las fotos y el logo originales (alta resolución) viven en `/proyectos` y
`/logos` en la raíz del repo — estas carpetas están en `.gitignore` (no se
suben a git). Las versiones optimizadas para el sitio se generan a
`public/proyectos/` y `public/logo-icon.png` con:

```bash
npm run process-assets
```

Vuelve a correr ese comando si agregas o cambias fotos en `/proyectos` o
`/logos`.

## Configurar el envío de emails (Resend)

El formulario de contacto (`/api/contact`) envía un correo usando
[Resend](https://resend.com) cada vez que alguien lo completa.

1. Crea una cuenta en [resend.com](https://resend.com) y genera una API key.
2. Copia `.env.local.example` a `.env.local`:

   ```bash
   cp .env.local.example .env.local
   ```

3. Completa las variables:

   ```
   RESEND_API_KEY=tu_api_key_de_resend
   CONTACT_TO_EMAIL=adriangch95@gmail.com
   CONTACT_FROM_EMAIL=onboarding@resend.dev
   ```

   - `CONTACT_TO_EMAIL` es la bandeja donde llegan las solicitudes del
     formulario.
   - `CONTACT_FROM_EMAIL` puede quedarse como `onboarding@resend.dev`
     (dominio de pruebas de Resend, sin verificación) mientras se configura
     un dominio propio. Con el dominio de pruebas, Resend solo entrega
     correos a la dirección con la que te registraste en tu cuenta — para
     recibir en `adriangch95@gmail.com` sin restricciones, verifica un
     dominio propio en Resend y usa una dirección de ese dominio como
     `CONTACT_FROM_EMAIL` (por ejemplo `contacto@adriangutierrezarq.com`).

4. Reinicia el servidor de desarrollo después de crear `.env.local`.

El formulario incluye un campo honeypot oculto (`company`) como protección
anti-spam básica: si un bot lo rellena, la solicitud se descarta en
silencio.

## Feed de Instagram

La sección "@agutierrez.arq" de la home (`components/instagram-feed.tsx`)
puede mostrar las publicaciones reales del perfil de Instagram. Mientras no
esté configurado, muestra 8 fotos reales de proyectos como respaldo (en vez
de las fotos de stock que traía antes).

Instagram ya no ofrece esto sin autenticación: hace falta un token de la
API de Instagram (Meta). Pasos para activarlo:

1. **Cuenta profesional**: en la app de Instagram, entra a la cuenta
   `@agutierrez.arq` → Configuración → Tipo de cuenta y herramientas →
   cambia a cuenta **profesional** (Business o Creador), si no lo es ya.
2. **App de Meta for Developers**: entra a
   [developers.facebook.com/apps](https://developers.facebook.com/apps),
   crea una app nueva y agrégale el producto **Instagram** ("API setup with
   Instagram login").
3. Sigue el asistente de esa sección para conectar la cuenta
   `@agutierrez.arq` como usuario de la app y generar un **token de
   acceso**. Copia también el **ID de usuario de Instagram** que te muestra
   ahí.
4. Ese token es de corta duración; cámbialo por uno de larga duración
   (60 días) con:

   ```bash
   curl -i -X GET "https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=TU_CLIENT_SECRET&access_token=TU_TOKEN_CORTO"
   ```

5. Completa en `.env.local` (local) y en las variables de entorno del
   proyecto en Vercel (producción):

   ```
   IG_ACCESS_TOKEN=el_token_de_larga_duracion
   IG_USER_ID=el_id_de_usuario_de_instagram
   ```

6. Reinicia el servidor / vuelve a desplegar.

**Importante**: el token de larga duración vence a los 60 días y hay que
renovarlo antes de esa fecha con `grant_type=ig_refresh_token` (ver
[docs de Meta](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login#step-6--refresh-tokens)),
o el feed simplemente vuelve a mostrar el respaldo de fotos de proyectos
hasta que se actualice.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura

```
app/
├─ (public)/                → sitio público (mismas URLs de siempre: /, /proyectos, ...)
└─ api/contact/route.ts     → envía el email (Resend) y crea el lead en ARCHI.OS
components/                 → una sección/pieza de UI por archivo (sitio público)
lib/content.ts              → todo el contenido de texto del sitio público
lib/resend.ts               → cliente de Resend
lib/notifications.ts        → notifica al estudio cuando entra un lead del formulario
lib/supabase/admin.ts       → cliente de Supabase con service role (crear el lead)
lib/supabase/database.types.ts → tipos generados del esquema de ARCHI.OS
```

## Despliegue en Vercel

El código ya está en GitHub: https://github.com/francoalejandrob/adrian-gutierrez-arq

1. Sube el repositorio a GitHub.
2. Importa el proyecto en [Vercel](https://vercel.com/new).
3. Agrega las variables de entorno (`RESEND_API_KEY`, `CONTACT_TO_EMAIL`,
   `CONTACT_FROM_EMAIL`, `NEXT_PUBLIC_SUPABASE_URL`,
   `SUPABASE_SERVICE_ROLE_KEY` y, si ya tienes el feed de Instagram
   configurado, `IG_ACCESS_TOKEN` e `IG_USER_ID`) en la configuración del
   proyecto en Vercel.
4. Despliega.
