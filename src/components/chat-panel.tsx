"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, RotateCcw, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  exampleId: string;
  exampleName: string;
}

export function ChatPanel({ exampleId, exampleName }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/examples/${exampleId}/chat`);
        if (res.ok) {
          const json = (await res.json()) as { messages?: Msg[] };
          setMessages(json.messages ?? []);
        }
      } finally {
        setRestoring(false);
      }
    })();
  }, [exampleId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/examples/${exampleId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const json = (await res.json()) as { text?: string; error?: string };
      if (!res.ok) {
        setError(json.error ?? "No se pudo generar la respuesta");
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: json.text ?? "" }]);
    } catch {
      setError("Error de conexión, inténtalo de nuevo");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    if (!window.confirm("¿Borrar esta conversación de prueba?")) return;
    setResetting(true);
    try {
      await fetch(`/api/examples/${exampleId}/chat`, { method: "DELETE" });
      setMessages([]);
      setError(null);
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="glass flex h-[600px] flex-col overflow-hidden rounded-lg border border-border/50">
      <header className="glass-strong flex shrink-0 items-center justify-between gap-2 border-b border-border/50 px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <FlaskConical className="h-4 w-4 text-primary" aria-hidden="true" />
          Probar a {exampleName}
        </div>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          onClick={() => void handleReset()}
          disabled={resetting}
          aria-label="Borrar conversación"
          title="Borrar chat"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mx-auto flex max-w-lg flex-col gap-2">
          {restoring ? (
            <div className="py-16 text-center text-xs text-muted-foreground">Cargando…</div>
          ) : messages.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">
                Escribe un mensaje para probar al agente.
              </p>
              <p className="mt-1 text-xs text-muted-foreground/60">
                Es una simulación — no se envía nada por WhatsApp.
              </p>
            </div>
          ) : null}
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm",
                m.role === "user"
                  ? "ml-auto rounded-br-sm bg-primary/15 text-foreground"
                  : "mr-auto rounded-bl-sm border border-border/60 bg-card text-foreground",
              )}
            >
              {m.content}
            </div>
          ))}
          {loading && (
            <div className="mr-auto flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border/60 bg-card px-3.5 py-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              Escribiendo…
            </div>
          )}
          {error && (
            <p className="mx-auto rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
              {error}
            </p>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <footer className="shrink-0 border-t border-border/50 p-3">
        <div className="mx-auto flex max-w-lg items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe un mensaje…"
            rows={1}
            className="min-h-[40px] max-h-32 resize-none"
            disabled={loading || restoring}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <Button onClick={() => void send()} disabled={loading || restoring || !input.trim()} size="icon" aria-label="Enviar">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </div>
      </footer>
    </div>
  );
}
