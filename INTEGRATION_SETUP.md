# INTEGRATION_SETUP.md

Qué necesito de ti para cada integración. Nunca voy a inventar
credenciales ni simular que una integración funciona sin sus
credenciales reales (regla del master prompt, sección 53).

## Listas para usar ahora

| Integración | Estado |
|---|---|
| **Supabase** (`ArqSystem&Website`) | Proyecto ya existe y está activo en tu cuenta; lo enlazo yo con la CLI (ya autenticada en esta máquina). Solo necesito que confirmes que está bien usar ese proyecto y no uno nuevo. |
| **Resend** | Ya configurado desde el sitio público (`RESEND_API_KEY` en Vercel). Se reutiliza tal cual, sin cambios. |
| **Vercel** | Ya autenticado en esta máquina (`vercel whoami` → `francoalejandrob`), mismo proyecto `adrian-gutierrez-arq`. |
| **GitHub** | Ya autenticado (`gh`, cuenta `francoalejandrob`), mismo repo. |

## Necesitan que tú hagas algo primero

### OpenAI (Fase 7 — Archi AI)
1. Crear cuenta en [platform.openai.com](https://platform.openai.com) si
   no tienes.
2. Generar una API key.
3. Pásamela para ponerla como `OPENAI_API_KEY` (en Vercel, no en el chat
   — igual que hicimos con el token de Instagram).

No se necesita todavía — es para la Fase 7, lejos en el roadmap.

### Google Analytics 4 + Search Console (Fase 5)
El código ya está escrito y listo para activarse
(`lib/integrations/google-analytics.ts`,
`lib/integrations/google-search-console.ts`, `/dashboard/website`) — solo
falta la configuración. **No probado de punta a punta** (no tengo una
propiedad real contra la cual probar); el formato de request/response
sigue la documentación pública de la GA4 Data API v1beta y de la Search
Console API v3, pero puede necesitar un ajuste menor la primera vez que
corra contra datos reales.

1. Tener el sitio verificado en Search Console (si no lo está).
2. Crear una propiedad de GA4 para el sitio si no existe.
3. En Google Cloud Console: crear un proyecto, habilitar
   "Google Analytics Data API" y "Search Console API", crear una cuenta
   de servicio, y darle acceso de lectura a la propiedad de GA4 y a la
   propiedad de Search Console.
4. Agregar en Vercel (nunca en el chat):
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` — el `client_email` de la cuenta de servicio.
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` — la `private_key` (con los
     saltos de línea como `\n` literales, es como Vercel guarda PEMs
     multilínea en una sola variable).
   - `GOOGLE_ANALYTICS_PROPERTY_ID` — el ID numérico de la propiedad GA4.
   - `GOOGLE_SEARCH_CONSOLE_SITE_URL` — la URL de la propiedad tal como
     aparece en Search Console (p. ej. `https://adrian-gutierrez-arq.vercel.app/` o `sc-domain:...`).

### Stripe (Fase 8 — SaaS billing)
Solo si el objetivo pasa a ser vender ARCHI.OS a otros estudios (ver
`ROADMAP.md`, Fase 8). Si/cuando llegue ese momento: cuenta de Stripe,
productos/precios creados, y las keys (`STRIPE_SECRET_KEY`,
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`).

### WhatsApp Business Cloud API (Fase 6)
Requiere una cuenta de WhatsApp Business verificada y una app en Meta for
Developers con el producto WhatsApp agregado (proceso similar al que ya
hicimos para el token de Instagram). Se documenta con más detalle cuando
se llegue a esa fase.

### Google Calendar (Fase 6)
OAuth de Google (client ID/secret) para que ARCHI.OS pueda leer/escribir
en tu calendario. Se configura cuando se implemente la Fase 6.

## Convención para pasarme credenciales

Igual que con `IG_ACCESS_TOKEN`: nunca las pegues en el chat. Las agregas
directo en **Vercel → Settings → Environment Variables** (y en tu
`.env.local` si querés probarlo en local primero), y me avisas que ya
están — yo las leo del entorno, nunca las veo en texto plano en la
conversación.
