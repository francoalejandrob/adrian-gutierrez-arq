"use client";

import { FormEvent, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notConfigured, setNotConfigured] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = await response.json();

      if (data.configured === false) {
        setNotConfigured(data.reason);
      } else if (!response.ok) {
        setError(data.error ?? "Error inesperado.");
      } else {
        setMessages([...nextMessages, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setError("No se pudo conectar con Archi AI.");
    } finally {
      setLoading(false);
    }
  }

  if (notConfigured) {
    return (
      <div className="border border-dashed border-carbon/20 bg-hueso/50 p-4 text-sm text-carbon/60">
        <p>{notConfigured}</p>
        <p className="mt-2 text-xs text-carbon/40">
          Ver INTEGRATION_SETUP.md en el repositorio para los pasos de configuración.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex min-h-[240px] flex-col gap-3 border border-carbon/10 bg-white p-4">
        {messages.length === 0 && (
          <p className="text-sm text-carbon/40">
            Preguntá, por ejemplo: &ldquo;¿qué tareas están vencidas?&rdquo; o &ldquo;¿cuánto
            llevamos cobrado este mes?&rdquo;
          </p>
        )}
        {messages.map((message, i) => (
          <div
            key={i}
            className={`max-w-[80%] px-3 py-2 text-sm ${
              message.role === "user"
                ? "self-end bg-carbon text-white"
                : "self-start bg-hueso text-carbon"
            }`}
          >
            {message.content}
          </div>
        ))}
        {loading && <p className="text-xs text-carbon/40">Archi AI está pensando…</p>}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta…"
          className="flex-1 border border-carbon/20 bg-white px-3 py-2 text-sm outline-none focus:border-carbon"
        />
        <button
          type="submit"
          disabled={loading}
          className="cursor-pointer border border-carbon px-4 py-2 text-sm text-carbon transition-colors hover:bg-carbon hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
