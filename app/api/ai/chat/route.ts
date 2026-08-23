import { NextResponse } from "next/server";
import { describeToolResult, GEMINI_TOOLS, runTool } from "@/lib/ai/tools";
import { createClient } from "@/lib/supabase/server";

// Real tool-calling wiring against the Gemini API (Generative Language
// API `generateContent`, plain fetch — same choice as the other Google
// integrations in lib/integrations/, no SDK dependency). Section 53 of
// the master prompt: without GEMINI_API_KEY this returns an honest "not
// configured" response instead of simulating a reply.
//
// Verified end-to-end against the real API AND through this actual
// route/UI in a real browser session (Playwright, extensión de
// herramientas + fix de fecha):
// - `gemini-2.5-flash` is gone for new API keys; the model must be
//   `gemini-3.6-flash` (or newer) as of whenever a key was last tested.
// - The turn carrying a `functionResponse` part must have role `"user"`,
//   not `"function"` — the API rejects `"function"` outright
//   (`Role 'function' is not supported`).
// - Root cause of "Archi AI agenda cosas pero no aparecen en la
//   agenda": the system prompt never told the model today's date, so
//   relative dates ("mañana") resolved to the wrong month/year and the
//   event landed somewhere /dashboard/calendar (month-scoped) never
//   shows. Fixed by injecting the real server date below — confirmed
//   live: "mañana" from 2026-08-23 correctly created an event on
//   2026-08-24.
// - Free tier is 20 requests/day/model; a real multi-tool conversation
//   burns through that fast. Confirmed the 429 path degrades cleanly
//   (a clear message, never a hallucinated "ya lo hice") — see
//   INTEGRATION_SETUP.md.

const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";
const MAX_TOOL_ROUNDS = 4;

type ChatMessage = { role: "user" | "assistant"; content: string };

type GeminiPart =
  | { text: string }
  | { functionCall: { name: string; args?: Record<string, unknown> } }
  | { functionResponse: { name: string; response: unknown } };

type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

function hasFunctionCall(part: GeminiPart): part is { functionCall: { name: string; args?: Record<string, unknown> } } {
  return "functionCall" in part;
}

function hasText(part: GeminiPart): part is { text: string } {
  return "text" in part;
}

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      configured: false,
      reason: "Archi AI todavía no está configurado: falta GEMINI_API_KEY. Ver INTEGRATION_SETUP.md.",
    });
  }

  let body: { messages?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const history = (body.messages ?? []).filter(
    (m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
  );
  if (history.length === 0) {
    return NextResponse.json({ error: "Falta el mensaje." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { data: org } = await supabase.from("organizations").select("name").limit(1).maybeSingle();

  const now = new Date();
  const todayLabel = now.toLocaleDateString("es-EC", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "America/Guayaquil",
  });
  const todayISO = now.toLocaleDateString("en-CA", { timeZone: "America/Guayaquil" }); // YYYY-MM-DD

  const systemInstruction =
    `Eres Archi AI, el asistente interno de ${org?.name ?? "el estudio"} dentro de ARCHI.OS. ` +
    `Hoy es ${todayLabel} (${todayISO} en formato YYYY-MM-DD). Calcula cualquier fecha ` +
    "relativa que use el usuario (\"mañana\", \"el viernes que viene\", \"en dos semanas\", " +
    "\"la próxima reunión\") a partir de esta fecha real — nunca inventes ni asumas otro año " +
    "u otro mes.\n\n" +
    "Respondes en español, de forma breve y concreta. Para cualquier pregunta sobre datos " +
    "reales (tareas, pagos, leads, proyectos, finanzas, marketing) usa siempre las " +
    "herramientas disponibles en vez de inventar cifras — si una herramienta no cubre lo " +
    "que te piden, dilo en vez de adivinar. Nunca reveles datos de otra organización: solo " +
    "ves lo que las herramientas devuelven, que ya está limitado a esta organización.\n\n" +
    "Además de consultar, puedes actuar sobre casi todo el sistema: leads, clientes, " +
    "proyectos, fases, tareas, calendario, contratos, pagos, gastos y cotizaciones — usa " +
    "listProjects/listClients/listPhases/listTasks/listContracts/listExpenses/listQuotes/ " +
    "listUpcomingEvents cuando el usuario mencione algo por nombre, para resolverlo al id " +
    "real antes de llamar otra herramienta — nunca inventes un id. Regla estricta: nunca " +
    "inventes precios, cantidades, fechas ni ningún dato que no te haya dado el usuario — si " +
    "falta algo necesario para completar una acción, pregúntalo antes de ejecutar la " +
    "herramienta. Cuando sí tengas todo lo necesario, ejecuta la acción de inmediato (sin " +
    "pedir confirmación aparte) y después responde con una frase breve confirmando qué " +
    "hiciste.\n\n" +
    "Excepción a lo anterior — confirmación obligatoria antes de borrar o cancelar: " +
    "deleteTask, deletePhase, deleteExpense, deleteEvent, updateProjectStatus con " +
    "status=\"cancelled\", y updateContractStatus con status=\"cancelled\" son irreversibles. " +
    "Para estas: la primera vez, llama la herramienta SIN el parámetro confirm (o " +
    "directamente no la llames todavía) y en tu respuesta de texto describí exactamente qué " +
    "se borraría/cancelaría, preguntando si el usuario confirma. Solo volvé a llamar la misma " +
    "herramienta con confirm=true después de que el usuario haya respondido que sí en un " +
    "mensaje posterior. Nunca pases confirm=true en el primer pedido del usuario.\n\n" +
    "No tienes acceso a crear cuentas del portal de cliente (invitePortalAccess) ni a subir " +
    "documentos — esas acciones son solo desde el dashboard, dilo si te las piden.";

  const contents: GeminiContent[] = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  // Acciones reales confirmadas durante el loop (Fix 2 — la UI del chat
  // las muestra como chips clickeables en vez de que el usuario tenga
  // que confiar en que el texto que redactó el modelo es cierto).
  const actions: { label: string; href: string }[] = [];

  try {
    let round = 0;
    while (round < MAX_TOOL_ROUNDS) {
      round += 1;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "x-goog-api-key": process.env.GEMINI_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents,
          system_instruction: { parts: [{ text: systemInstruction }] },
          tools: GEMINI_TOOLS,
          // "minimal" recorta el presupuesto de "pensamiento" interno del
          // modelo antes de responder — verificado en vivo contra la API
          // real que, sin esto, gemini-3.6-flash puede gastar >2000 tokens
          // de thinking en una respuesta de un párrafo (12-70s de espera
          // *antes* del primer byte). Con "minimal" cae a thinking≈0. Es
          // el ajuste de mayor impacto en latencia percibida — más que
          // streaming, porque casi todo el tiempo se va en esta fase
          // previa a que exista texto para transmitir.
          generationConfig: { thinkingConfig: { thinkingLevel: "minimal" } },
        }),
      });

      if (response.status === 429) {
        return NextResponse.json({
          configured: true,
          reply:
            "Archi AI alcanzó el límite diario de consultas gratuitas de Gemini por hoy. " +
            "Vuelve a intentar más tarde, o habilita facturación en el proyecto de Google Cloud " +
            "de la key para levantar ese límite (ver INTEGRATION_SETUP.md).",
        });
      }

      if (!response.ok) {
        throw new Error(`Gemini API error (${response.status}): ${await response.text()}`);
      }

      const data = (await response.json()) as {
        candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
        promptFeedback?: { blockReason?: string };
      };

      if (data.promptFeedback?.blockReason) {
        return NextResponse.json({
          configured: true,
          reply: "No puedo responder eso — el mensaje fue bloqueado por los filtros de seguridad de Gemini.",
        });
      }

      const parts = data.candidates?.[0]?.content?.parts ?? [];
      const functionCalls = parts.filter(hasFunctionCall);

      if (functionCalls.length === 0) {
        const text = parts.filter(hasText).map((p) => p.text).join("");
        return NextResponse.json({
          configured: true,
          reply: text || "No pude generar una respuesta. Intenta reformular la pregunta.",
          actions,
        });
      }

      contents.push({ role: "model", parts });

      // Cuando Gemini pide varias herramientas en la misma ronda, se
      // ejecutan en paralelo (son consultas/escrituras independientes,
      // no encadenadas) en vez de una por una — reduce la latencia total
      // de la ronda al máximo de las herramientas, no a la suma.
      const responseParts: GeminiPart[] = await Promise.all(
        functionCalls.map(async (call) => {
          let result: unknown;
          try {
            result = await runTool(supabase, call.functionCall.name, call.functionCall.args ?? {});
            const description = describeToolResult(call.functionCall.name, result);
            if (description) actions.push(description);
          } catch (error) {
            result = { error: error instanceof Error ? error.message : "Error ejecutando la herramienta." };
          }
          return { functionResponse: { name: call.functionCall.name, response: { result } } };
        }),
      );
      contents.push({ role: "user", parts: responseParts });
    }

    return NextResponse.json({
      configured: true,
      reply: "No pude completar la respuesta en el número de pasos permitidos. Intenta reformular la pregunta.",
      actions,
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error inesperado consultando a Archi AI." },
      { status: 502 },
    );
  }
}
