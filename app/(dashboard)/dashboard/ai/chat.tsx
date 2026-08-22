"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
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

  async function sendMessage(text: string) {
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input.trim());
  }

  if (notConfigured) {
    return (
      <div className="border border-dashed border-corte p-5 font-dp-sans text-[13px] text-grafito">
        <p>{notConfigured}</p>
        <p className="mt-2.5 font-dp-mono text-[10.5px] text-concreto">
          Ver INTEGRATION_SETUP.md en el repositorio para los pasos de configuración.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border border-filete p-7">
        {(messages.length > 0 || loading) && (
          <div ref={scrollRef} className="mb-5 flex max-h-[420px] flex-col gap-3.5 overflow-y-auto">
            {messages.map((message, i) => (
              <div key={i} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] whitespace-pre-wrap px-4 py-2.5 font-dp-sans text-[13.5px] ${
                    message.role === "user" ? "bg-superficie text-tinta" : "bg-tinta text-papel"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 bg-tinta px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce bg-papel/50 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce bg-papel/50 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce bg-papel/50" />
                </div>
              </div>
            )}
          </div>
        )}

        {error && <p className="mb-3 font-dp-sans text-sm text-acento">{error}</p>}

        <form onSubmit={handleSubmit} className="flex gap-2.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregúntale a Archi AI…"
            disabled={loading}
            className={`flex-1 ${inputClass}`}
          />
          <button type="submit" disabled={loading} className={buttonClass("primary", "md")}>
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
