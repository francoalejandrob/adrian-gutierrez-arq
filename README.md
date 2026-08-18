# Adrián Gutiérrez — Arquitectura & Diseño

Sitio web de una página para el estudio de arquitectura de Adrián Gutiérrez
(Salinas, Ecuador). Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 +
Framer Motion.

## Contenido de demostración

Este proyecto está en desarrollo. Los siguientes datos son **de ejemplo** y
deben reemplazarse con información real antes de publicar el sitio:

- Los 4 proyectos destacados (`lib/content.ts`) son ficticios.
- La bio y la cita del arquitecto (`lib/content.ts`) fueron redactadas como
  placeholder editorial.
- Los años de experiencia (5) y proyectos entregados (20) son genéricos.
- No hay fotografía real todavía: en vez de fotos se usan ilustraciones de
  línea tipo plano arquitectónico (`components/blueprint-art.tsx`) como
  lenguaje visual del sitio. Pueden mantenerse como estilo o reemplazarse por
  fotografía real de proyectos en `components/proyectos-grid.tsx`,
  `components/hero.tsx`, `components/filosofia.tsx` y
  `components/sobre-estudio.tsx`.
- No se incluyeron redes sociales en el footer porque no se proporcionaron
  cuentas reales; agrégalas en `components/footer.tsx` cuando existan.

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

1. Sube el repositorio a GitHub.
2. Importa el proyecto en [Vercel](https://vercel.com/new).
3. Agrega las variables de entorno (`RESEND_API_KEY`, `CONTACT_TO_EMAIL`,
   `CONTACT_FROM_EMAIL`) en la configuración del proyecto en Vercel.
4. Despliega.
