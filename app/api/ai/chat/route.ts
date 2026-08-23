import { NextResponse } from "next/server";
import { GEMINI_TOOLS, runTool } from "@/lib/ai/tools";
import { createClient } from "@/lib/supabase/server";

// Real tool-calling wiring against the Gemini API (Generative Language
// API `generateContent`, plain fetch — same choice as the other Google
// integrations in lib/integrations/, no SDK dependency). Section 53 of
// the master prompt: without GEMINI_API_KEY this returns an honest "not
// configured" response instead of simulating a reply.
//
// Verified end-to-end against the real API (not just documented — a
// live key surfaced two things the docs didn't make obvious):
// - `gemini-2.5-flash` is gone for new API keys; the model must be
//   `gemini-3.6-flash` (or newer) as of whenever a key was last tested.
// - The turn carrying a `functionResponse` part must have role `"user"`,
//   not `"function"` — the API rejects `"function"` outright
//   (`Role 'function' is not supported`).
// Not yet exercised through this actual route/UI in a real browser
// session (only the raw generateContent contract, via direct requests
// with a temporary tool schema) — if something's still off, this is the
// first place to check.

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

  const systemInstruction =
    `Eres Archi AI, el asistente interno de ${org?.name ?? "el estudio"} dentro de ARCHI.OS. ` +
    "Respondes en español, de forma breve y concreta. Para cualquier pregunta sobre datos " +
    "reales (tareas, pagos, leads, proyectos, finanzas, marketing) usa siempre las " +
    "herramientas disponibles en vez de inventar cifras — si una herramienta no cubre lo " +
    "que te piden, dilo en vez de adivinar. Nunca reveles datos de otra organización: solo " +
    "ves lo que las herramientas devuelven, que ya está limitado a esta organización.";

  const contents: GeminiContent[] = history.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

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
        }),
      });

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
        });
      }

      contents.push({ role: "model", parts });

      const responseParts: GeminiPart[] = [];
      for (const call of functionCalls) {
        let result: unknown;
        try {
          result = await runTool(supabase, call.functionCall.name, call.functionCall.args ?? {});
        } catch (error) {
          result = { error: error instanceof Error ? error.message : "Error ejecutando la herramienta." };
        }
        responseParts.push({ functionResponse: { name: call.functionCall.name, response: { result } } });
      }
      contents.push({ role: "user", parts: responseParts });
    }

    return NextResponse.json({
      configured: true,
      reply: "No pude completar la respuesta en el número de pasos permitidos. Intenta reformular la pregunta.",
    });
  } catch (error) {
    console.error("AI chat error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error inesperado consultando a Archi AI." },
      { status: 502 },
    );
  }
}
