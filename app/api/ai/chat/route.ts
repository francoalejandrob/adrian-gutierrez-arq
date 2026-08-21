import { NextResponse } from "next/server";
import { AI_TOOLS, runTool } from "@/lib/ai/tools";
import { createClient } from "@/lib/supabase/server";

// Real tool-calling wiring against the OpenAI Chat Completions API (plain
// fetch, no SDK dependency — same choice as the Google integrations).
// Section 53 of the master prompt: without OPENAI_API_KEY this returns an
// honest "not configured" response instead of simulating a reply. With a
// key, the request/response shape follows the documented Chat Completions
// tool-calling contract, but this has **not been exercised end-to-end**
// (no real key to test against) — disclosed in INTEGRATION_SETUP.md and
// ROADMAP.md rather than reported as done.

const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const MAX_TOOL_ROUNDS = 4;

type ChatMessage = { role: "user" | "assistant"; content: string };

type OpenAiMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[];
  tool_call_id?: string;
};

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      configured: false,
      reason:
        "Archi AI todavía no está configurado: falta OPENAI_API_KEY. Ver INTEGRATION_SETUP.md.",
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

  const messages: OpenAiMessage[] = [
    {
      role: "system",
      content:
        `Eres Archi AI, el asistente interno de ${org?.name ?? "el estudio"} dentro de ARCHI.OS. ` +
        "Respondes en español, de forma breve y concreta. Para cualquier pregunta sobre datos " +
        "reales (tareas, pagos, leads, proyectos, finanzas, marketing) usa siempre las " +
        "herramientas disponibles en vez de inventar cifras — si una herramienta no cubre lo " +
        "que te piden, dilo en vez de adivinar. Nunca reveles datos de otra organización: solo " +
        "ves lo que las herramientas devuelven, que ya está limitado a esta organización.",
    },
    ...history.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    let round = 0;
    while (round < MAX_TOOL_ROUNDS) {
      round += 1;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: MODEL, messages, tools: AI_TOOLS }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error (${response.status}): ${await response.text()}`);
      }

      const data = (await response.json()) as {
        choices: { message: OpenAiMessage }[];
      };
      const message = data.choices[0]?.message;
      if (!message) throw new Error("Respuesta vacía de OpenAI.");

      if (!message.tool_calls || message.tool_calls.length === 0) {
        return NextResponse.json({ configured: true, reply: message.content ?? "" });
      }

      messages.push(message);

      for (const toolCall of message.tool_calls) {
        let result: unknown;
        try {
          const args = toolCall.function.arguments ? JSON.parse(toolCall.function.arguments) : {};
          result = await runTool(supabase, toolCall.function.name, args);
        } catch (error) {
          result = { error: error instanceof Error ? error.message : "Error ejecutando la herramienta." };
        }
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        });
      }
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
