"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, MessagesSquare, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SessionSummary {
  sessionId: string;
  messageCount: number;
  lastMessageAt: string;
  lastMessage: string;
}

interface Msg {
  role: "user" | "assistant";
  content: string;
  created_at?: string;
}

interface Props {
  exampleId: string;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function shortSessionLabel(sessionId: string): string {
  return `Cliente ${sessionId.slice(0, 8)}`;
}

export function ConversationsPanel({ exampleId }: Props) {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Msg[]>>({});
  const [loadingSession, setLoadingSession] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadSessions() {
    try {
      const res = await fetch(`/api/examples/${exampleId}/sessions`);
      const json = (await res.json()) as { sessions?: SessionSummary[]; error?: string };
      if (!res.ok) {
        setError(json.error ?? "No se pudieron cargar las conversaciones");
        return;
      }
      setSessions(json.sessions ?? []);
    } catch {
      setError("Error de conexión");
    }
  }

  useEffect(() => {
    void loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exampleId]);

  async function toggleExpand(sessionId: string) {
    if (expanded === sessionId) {
      setExpanded(null);
      return;
    }
    setExpanded(sessionId);
    if (!messages[sessionId]) {
      setLoadingSession(sessionId);
      try {
        const res = await fetch(
          `/api/examples/${exampleId}/chat?sessionId=${encodeURIComponent(sessionId)}`,
        );
        const json = (await res.json()) as { messages?: Msg[] };
        setMessages((prev) => ({ ...prev, [sessionId]: json.messages ?? [] }));
      } finally {
        setLoadingSession(null);
      }
    }
  }

  async function handleDelete(sessionId: string) {
    if (!window.confirm("¿Borrar esta conversación? No se puede deshacer.")) return;
    setDeletingId(sessionId);
    try {
      await fetch(
        `/api/examples/${exampleId}/chat?sessionId=${encodeURIComponent(sessionId)}`,
        { method: "DELETE" },
      );
      setSessions((prev) => (prev ?? []).filter((s) => s.sessionId !== sessionId));
      setMessages((prev) => {
        const next = { ...prev };
        delete next[sessionId];
        return next;
      });
      if (expanded === sessionId) setExpanded(null);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-primary" aria-hidden="true" />
          Conversaciones de clientes
        </CardTitle>
        <CardDescription>
          Cada visitante que abre el enlace público del ejemplo tiene su propia conversación, separada
          de tu chat de prueba interno.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="mb-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
            {error}
          </p>
        )}
        {sessions === null ? (
          <p className="text-xs text-muted-foreground">Cargando…</p>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            Todavía no hay conversaciones de clientes. Aparecerán aquí en cuanto alguien pruebe el
            enlace público.
          </p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s) => {
              const isOpen = expanded === s.sessionId;
              return (
                <li
                  key={s.sessionId}
                  className="overflow-hidden rounded-md border border-border/60 bg-card/60"
                >
                  <button
                    type="button"
                    onClick={() => void toggleExpand(s.sessionId)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-accent/50"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <MessagesSquare className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="font-medium">{shortSessionLabel(s.sessionId)}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {s.messageCount} mensajes · {formatDate(s.lastMessageAt)}
                        </p>
                      </div>
                    </div>
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="border-t border-border/60 p-3">
                      {loadingSession === s.sessionId ? (
                        <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          Cargando conversación…
                        </div>
                      ) : (
                        <div className="max-h-80 space-y-2 overflow-y-auto">
                          {(messages[s.sessionId] ?? []).map((m, i) => (
                            <div
                              key={i}
                              className={cn(
                                "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-1.5 text-xs",
                                m.role === "user"
                                  ? "ml-auto rounded-br-sm bg-primary/15 text-foreground"
                                  : "mr-auto rounded-bl-sm border border-border/60 bg-background text-foreground",
                              )}
                            >
                              {m.content}
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="mt-3 flex justify-end">
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => void handleDelete(s.sessionId)}
                          disabled={deletingId === s.sessionId}
                          className="h-7 px-2 text-destructive hover:text-destructive"
                        >
                          {deletingId === s.sessionId ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          Borrar conversación
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
