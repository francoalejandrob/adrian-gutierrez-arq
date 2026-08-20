# Adrián Gutiérrez — Arquitectura & Diseño

Sitio web de una página para el estudio de arquitectura de Adrián Gutiérrez
(Salinas, Ecuador). Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 +
Framer Motion.

**En vivo:** https://adrian-gutierrez-arq.vercel.app
(el formulario de contacto no enviará emails hasta que se configure
`RESEND_API_KEY` en las variables de entorno del proyecto en Vercel — ver
más abajo).

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

## Desarrollo local

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Estructura

```
app/
├─ page.tsx                 → compone todas las secciones de la home
├─ proyectos/page.tsx       → listado de proyectos (ruta preparada)
└─ api/contact/route.ts     → endpoint que envía el email vía Resend
components/                 → una sección/pieza de UI por archivo
lib/content.ts              → todo el contenido de texto del sitio
lib/resend.ts               → cliente de Resend
```

## Despliegue en Vercel

El código ya está en GitHub: https://github.com/francoalejandrob/adrian-gutierrez-arq

1. Sube el repositorio a GitHub.
2. Importa el proyecto en [Vercel](https://vercel.com/new).
3. Agrega las variables de entorno (`RESEND_API_KEY`, `CONTACT_TO_EMAIL`,
   `CONTACT_FROM_EMAIL`) en la configuración del proyecto en Vercel.
4. Despliega.
