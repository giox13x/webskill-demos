"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AgentAvatar } from "@/components/agent-avatar";
import { MessageCorrection } from "@/components/message-correction";
import { cn } from "@/lib/utils";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  exampleId: string;
  exampleSlug: string;
  exampleName: string;
  agentName?: string;
  avatarKey?: string;
  corregir: boolean;
}

function getOrCreateSessionId(exampleSlug: string): string {
  const key = `wsk_session_${exampleSlug}`;
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const fresh =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(key, fresh);
    return fresh;
  } catch {
    return "anon";
  }
}

export function PublicChat({ exampleId, exampleSlug, exampleName, agentName, avatarKey, corregir }: Props) {
  const displayName = agentName?.trim() || exampleName;
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(getOrCreateSessionId(exampleSlug));
  }, [exampleSlug]);

  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      try {
        const res = await fetch(`/api/examples/${exampleId}/chat?sessionId=${encodeURIComponent(sessionId)}`);
        if (res.ok) {
          const json = (await res.json()) as { messages?: Msg[] };
          setMessages(json.messages ?? []);
        }
      } finally {
        setRestoring(false);
      }
    })();
  }, [exampleId, sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading || !sessionId) return;
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/examples/${exampleId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId }),
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

  return (
    <div className="glass flex h-[80vh] max-h-[720px] flex-col overflow-hidden rounded-xl border border-border/50 shadow-lg">
      <header className="glass-strong flex shrink-0 items-center gap-2 border-b border-border/50 px-4 py-3">
        <AgentAvatar name={displayName} avatarKey={avatarKey} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <p className="text-xs text-muted-foreground">
            {corregir ? "Modo corrección — revisa y corrige las respuestas" : "Asistente virtual"}
          </p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mx-auto flex max-w-lg flex-col gap-2">
          {restoring ? (
            <div className="py-16 text-center text-xs text-muted-foreground">Cargando…</div>
          ) : messages.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">Escribe un mensaje para empezar a chatear.</p>
            </div>
          ) : null}
          {messages.map((m, i) => (
            <div key={i} className={cn("flex flex-col gap-1", m.role === "user" ? "items-end" : "items-start")}>
              <div
                className={cn(
                  "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm",
                  m.role === "user"
                    ? "rounded-br-sm bg-primary/15 text-foreground"
                    : "rounded-bl-sm border border-border/60 bg-card text-foreground",
                )}
              >
                {m.content}
              </div>

              {corregir && m.role === "assistant" && (
                <MessageCorrection
                  exampleId={exampleId}
                  originalMessage={i > 0 ? messages[i - 1]?.content ?? "" : ""}
                  assistantMessage={m.content}
                />
              )}
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
            disabled={loading || restoring || !sessionId}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <Button onClick={() => void send()} disabled={loading || restoring || !sessionId || !input.trim()} size="icon" aria-label="Enviar">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Send className="h-4 w-4" aria-hidden="true" />}
          </Button>
        </div>
      </footer>
    </div>
  );
}
