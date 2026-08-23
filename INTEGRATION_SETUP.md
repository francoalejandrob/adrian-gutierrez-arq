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

| Integración | Qué falta |
|---|---|
| **Google Maps** (mapa de clientes/proyectos, `/dashboard/map`) | Ver detalle abajo — a diferencia de todo lo demás en esta tabla, necesita un proyecto de Google Cloud con **facturación habilitada**. |

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

**Ahora sí probado a través de `/dashboard/ai` en el navegador real**
(Playwright, sesión autenticada), no solo el contrato crudo de
`generateContent`. Esa prueba encontró el bug real detrás de "le pido
que agende algo y no aparece": el `system_instruction` nunca le decía
al modelo la fecha de hoy, así que "mañana" se resolvía a un mes/año
cualquiera y el evento se creaba igual, solo que en un mes que
`/dashboard/calendar` (filtra por mes visible) nunca muestra. Ya
corregido — se inyecta la fecha real del servidor en cada request. Un
único hallazgo pendiente, no bloqueante: si una ronda intermedia del
loop de tool-calling falla con un 503 transitorio de Gemini después de
que una herramienta de escritura ya se ejecutó, el usuario ve un error
en vez de la confirmación, y reintentar el mismo pedido puede duplicar
la acción (el turno fallido no queda registrado en el historial local
del chat) — no se corrigió en este pase, ver `ARCHITECTURE.md`.

Se amplió la cobertura de herramientas a casi todo el sistema (antes
solo 3: crear cliente, agendar evento, crear cotización) — ver
`ARCHITECTURE.md` para la tabla completa. Las que borran o cancelan
algo requieren que el usuario confirme antes de ejecutarse de verdad
(mecanismo en código, no solo instrucción de prompt) — verificado por
inspección de código y build/lint; la conversación completa "pide
confirmación → el usuario confirma → recién ahí borra" contra la API
real de Gemini quedó pendiente de una corrida en vivo porque la cuota
gratuita diaria (ver abajo) se agotó durante esta misma sesión de
pruebas.

La API key vive en `GEMINI_API_KEY` (Vercel + `.env.local`, nunca en el
chat). Se generó gratis en [aistudio.google.com/apikey](https://aistudio.google.com/apikey)
— sin proyecto de Google Cloud ni facturación.

**Optimización de latencia (probada en vivo)**: `gemini-3.6-flash`
puede gastar más tokens de "thinking" interno que de respuesta real
antes de devolver algo — en una prueba en vivo, un párrafo de 150
palabras tardó entre 12 y 70 segundos con más de 2000 tokens de
thinking (`usageMetadata.thoughtsTokenCount`) para ~195 tokens de
respuesta. Casi todo ese tiempo ocurre *antes* del primer byte, así que
streaming no lo hubiera arreglado. `route.ts` ahora manda
`generationConfig.thinkingConfig.thinkingLevel: "minimal"` en cada
request — verificado que elimina el thinking casi por completo, aunque
no pude confirmar el efecto sobre la latencia total en una corrida
exitosa (la prueba se quedó sin cupo del free tier a mitad de camino,
ver abajo). Cuando pruebes Archi AI, si las respuestas siguen tardando
más de unos segundos avísame — puede que este ajuste necesite subirse a
`"low"` en vez de `"minimal"` para no perder calidad en respuestas más
largas.

**Límite del free tier — probablemente la causa real de la lentitud
reportada**: la key actual corre sin facturación habilitada
(`generate_content_free_tier_requests`), que Google limita a **20
solicitudes por día por modelo**. Cada mensaje del chat que necesita
una herramienta ya son 2+ solicitudes a Gemini (una que pide la
herramienta, otra que redacta la respuesta), así que ese cupo se agota
rápido con uso real — al llegar al límite, la API devuelve `429` y
`route.ts` ahora lo detecta y responde con un mensaje claro en vez de
un error genérico. Si Archi AI se siente lento o falla seguido, esta es
la sospechosa principal, más que cualquier ajuste de código. La
solución real es habilitar facturación (tarjeta) en el proyecto de
Google Cloud de esta key en [Google AI Studio](https://aistudio.google.com/apikey)
o [Google Cloud Console](https://console.cloud.google.com/) — el uso
normal de un solo estudio se mantiene barato (Gemini Flash cobra
centavos por millón de tokens), pero es una decisión de facturación que
te toca a ti, no algo que pueda activar yo.

### Google Maps (mapa de clientes/proyectos, `/dashboard/map`)
`lib/integrations/google-geocoding.ts`, `components/dashboard/map-view.tsx`,
`/dashboard/map` — código escrito y listo para activarse, **no probado
de punta a punta** (sin key real todavía). Necesita **dos** keys
distintas de un mismo proyecto de Google Cloud, y ese proyecto necesita
**facturación habilitada** (Google exige tarjeta para Maps/Geocoding,
a diferencia de Gemini) — aunque el uso normal de un estudio queda
dentro de la cuota gratuita mensual de Google.

1. En [Google Cloud Console](https://console.cloud.google.com/): crear
   o reutilizar un proyecto, habilitar facturación, y habilitar dos
   APIs: **Maps JavaScript API** y **Geocoding API**.
2. Crear dos API keys (Credenciales → Crear credenciales → Clave de API):
   - Una para el navegador: restringirla por **referrer HTTP** al
     dominio de producción (y a `localhost` si querés probar local), y
     limitarla a "Maps JavaScript API" solamente.
   - Otra para el servidor (geocoding): **sin restricción de referrer**
     (las llamadas de geocodificación son servidor-a-servidor, no
     tienen referrer — restringirla por referrer las bloquearía por
     completo). Si Google Cloud lo permite en tu región, restringirla
     por IP en vez de dejarla abierta; si no, limitarla al menos a
     "Geocoding API" solamente.
3. Agregar en Vercel (nunca en el chat) y en tu `.env.local`:
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — la key restringida por referrer.
   - `GOOGLE_MAPS_SERVER_API_KEY` — la key de geocoding.

Mientras no estén configuradas, `/dashboard/map` muestra un estado
vacío explícito en vez de simular un mapa — nada se rompe, solo no hay
mapa que mostrar.

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
