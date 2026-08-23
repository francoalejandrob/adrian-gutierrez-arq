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
| **Gemini API** (Fase 7 — Archi AI) | Key real generada en Google AI Studio y probada de punta a punta contra la API real (auth, modelo, ciclo completo de function-calling) antes de configurarla — ver detalle abajo. |

## Necesitan que tú hagas algo primero

(vacío por ahora — todo lo que faltaba está resuelto)

## Detalle: Gemini API (Fase 7 — Archi AI)
`lib/ai/tools.ts`, `app/api/ai/chat/route.ts`, `/dashboard/ai` — el
wiring de tool-calling llama directo a `generateContent` de la
Generative Language API de Google (fetch directo, sin SDK, mismo
criterio que las demás integraciones de Google — GA4/Search Console).

**Probado de punta a punta contra la API real** (no solo documentado)
con una key real de Google AI Studio, lo que corrigió dos cosas que la
documentación pública no dejaba claras:
- El modelo default tuvo que cambiar de `gemini-2.5-flash` (ya no
  disponible para keys nuevas) a `gemini-3.6-flash`.
- El turno que devuelve el resultado de una herramienta
  (`functionResponse`) tiene que tener `role: "user"` — la API rechaza
  `role: "function"` explícitamente (`Role 'function' is not
  supported`), a pesar de que así lo mostraba la guía de function-calling
  consultada.

No verificado todavía: una corrida real a través de `/dashboard/ai` en
el navegador (con sesión autenticada) — solo el contrato crudo de
`generateContent` vía requests directos. Si algo falla ahí, revisar
primero `app/api/ai/chat/route.ts`.

La API key vive en `GEMINI_API_KEY` (Vercel + `.env.local`, nunca en el
chat). Se generó gratis en [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
— sin proyecto de Google Cloud ni facturación.

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
El código ya está escrito y listo para activarse
(`lib/integrations/whatsapp.ts`) — **no probado de punta a punta** (sin
número de prueba todavía) y nada en la UI lo dispara todavía (no hay
todavía un evento concreto que lo necesite).

1. Cuenta de WhatsApp Business verificada + app en Meta for Developers
   con el producto WhatsApp agregado (proceso similar al que ya hicimos
   para el token de Instagram).
2. Agregar en Vercel: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`.

Importante: fuera de la ventana de 24h de una conversación iniciada por
el cliente, Meta exige usar un mensaje de plantilla pre-aprobado en vez
de texto libre — `sendWhatsAppMessage()` solo implementa el caso de texto
libre por ahora.

### Google Calendar (Fase 6)
A diferencia de GA4/Search Console, Calendar necesita que **cada
usuario** autorice el acceso a su propio calendario (OAuth de 3 patas),
no una cuenta de servicio — es una app cliente OAuth (consent screen +
ruta de callback + guardar el refresh token por usuario), no solo una
credencial. Por eso `lib/integrations/google-calendar.ts` de esta fase es
solo la interfaz de detección de configuración; el flujo de autorización
en sí **no está implementado todavía** — se construye cuando haya un caso
de uso concreto (p. ej. sincronizar el cronograma de un proyecto) que
justifique el trabajo de esa integración completa.

1. En Google Cloud Console: crear credenciales OAuth 2.0 de tipo "Web
   application" con la URL de callback que se decida en ese momento.
2. Agregar en Vercel: `GOOGLE_CALENDAR_CLIENT_ID`,
   `GOOGLE_CALENDAR_CLIENT_SECRET`.

## Convención para pasarme credenciales

Igual que con `IG_ACCESS_TOKEN`: nunca las pegues en el chat. Las agregas
directo en **Vercel → Settings → Environment Variables** (y en tu
`.env.local` si querés probarlo en local primero), y me avisas que ya
están — yo las leo del entorno, nunca las veo en texto plano en la
conversación.
