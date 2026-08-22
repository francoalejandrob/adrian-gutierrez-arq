"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { buttonClass } from "@/components/dashboard/ui/button";
import { inputClass } from "@/components/dashboard/ui/styles";

type Message = { role: "user" | "assistant"; content: string };

export default function AiChat({ suggestions = [] }: { suggestions?: string[] }) {
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
      <div className="rounded-[10px] border border-dashed border-carbon/20 bg-hueso/50 p-4 text-sm text-carbon/60">
        <p>{notConfigured}</p>
        <p className="mt-2 text-xs text-carbon/40">
          Ver INTEGRATION_SETUP.md en el repositorio para los pasos de configuración.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {messages.length === 0 && suggestions.length > 0 && (
        <div>
          <p className="mb-3.5 text-[11px] uppercase tracking-[0.07em] text-carbon/40">Sugerencias</p>
          <div className="flex flex-col divide-y divide-carbon/[0.08] overflow-hidden rounded-[10px] border border-carbon/[0.08]">
            {suggestions.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => sendMessage(text)}
                className="flex cursor-pointer items-center justify-between bg-white px-[18px] py-3.5 text-left text-[13.5px] text-carbon transition-colors duration-150 hover:bg-hueso"
              >
                {text}
                <span className="font-mono text-xs text-naranja-oscuro">→</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-[10px] border border-carbon/[0.08] bg-white p-6">
        {(messages.length > 0 || loading) && (
          <div ref={scrollRef} className="mb-4 flex max-h-[420px] flex-col gap-3.5 overflow-y-auto">
            {messages.map((message, i) => (
              <div key={i} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] whitespace-pre-wrap rounded-lg px-4 py-2.5 text-[13.5px] ${
                    message.role === "user" ? "bg-hueso text-carbon" : "bg-carbon text-hueso"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-lg bg-carbon px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-hueso/50 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-hueso/50 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-hueso/50" />
                </div>
              </div>
            )}
          </div>
        )}

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <form onSubmit={handleSubmit} className="flex gap-2.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pregúntale a Archi AI…"
            disabled={loading}
            className={`flex-1 ${inputClass}`}
          />
          <button type="submit" disabled={loading} className={buttonClass("primary", "md")}>
            <Send size={15} strokeWidth={1.75} aria-hidden="true" />
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
