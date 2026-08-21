"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Send, Sparkles } from "lucide-react";
import { buttonClass } from "@/components/dashboard/ui/button";
import { inputClass } from "@/components/dashboard/ui/styles";

type Message = { role: "user" | "assistant"; content: string };

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [notConfigured, setNotConfigured] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

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
      <div
        ref={scrollRef}
        className="flex max-h-[480px] min-h-[240px] flex-col gap-3 overflow-y-auto border border-carbon/10 bg-white p-4"
      >
        {messages.length === 0 && (
          <p className="text-sm text-carbon/40">
            Preguntá, por ejemplo: &ldquo;¿qué tareas están vencidas?&rdquo; o &ldquo;¿cuánto
            llevamos cobrado este mes?&rdquo;
          </p>
        )}
        {messages.map((message, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${message.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {message.role === "assistant" && (
              <div className="mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-carbon/15 text-carbon/50">
                <Sparkles size={12} strokeWidth={1.75} aria-hidden="true" />
              </div>
            )}
            <div
              className={`max-w-[75%] whitespace-pre-wrap px-3 py-2 text-sm ${
                message.role === "user" ? "bg-carbon text-white" : "bg-hueso text-carbon"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-end gap-2">
            <div className="mb-0.5 flex h-6 w-6 shrink-0 items-center justify-center border border-carbon/15 text-carbon/50">
              <Sparkles size={12} strokeWidth={1.75} aria-hidden="true" />
            </div>
            <div className="flex items-center gap-1 bg-hueso px-3 py-2.5">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-carbon/30 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-carbon/30 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-carbon/30" />
            </div>
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu pregunta…"
          disabled={loading}
          className={`flex-1 ${inputClass}`}
        />
        <button type="submit" disabled={loading} className={buttonClass("secondary", "md")}>
          <Send size={15} strokeWidth={1.75} aria-hidden="true" />
          Enviar
        </button>
      </form>
    </div>
  );
}
