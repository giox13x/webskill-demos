"use client";

import { useState } from "react";
import { Check, Loader2, Pencil, ThumbsUp, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Props {
  exampleId: string;
  originalMessage: string;
  assistantMessage: string;
}

type Status = "idle" | "correct" | "corrected";

// Igual que en Webskill: marcar "Correcto" o guardar una corrección nunca
// deja el mensaje bloqueado — siempre se puede volver a tocar por si el
// equipo se equivocó al marcarlo.
export function MessageCorrection({ exampleId, originalMessage, assistantMessage }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [editing, setEditing] = useState(false);
  const [correctionText, setCorrectionText] = useState(assistantMessage);
  const [savedText, setSavedText] = useState("");
  const [correctionId, setCorrectionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function markCorrect() {
    setStatus("correct");
    setEditing(false);
  }

  function openEdit() {
    setCorrectionText(savedText || assistantMessage);
    setEditing(true);
  }

  async function submit() {
    const corrected = correctionText.trim();
    if (!corrected) return;
    setSaving(true);
    try {
      // Si ya había una corrección guardada para este mensaje, la
      // sustituimos en vez de acumular duplicados.
      if (correctionId) {
        await fetch(`/api/examples/${exampleId}/corrections/${correctionId}`, { method: "DELETE" });
      }
      const res = await fetch(`/api/examples/${exampleId}/corrections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalMessage,
          wrongResponse: assistantMessage,
          correctedResponse: corrected,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { correction?: { id: string } };
      if (res.ok && json.correction) {
        setCorrectionId(json.correction.id);
        setSavedText(corrected);
        setStatus("corrected");
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <div className="mt-1 w-full max-w-[85%] space-y-2 rounded-md border border-border/60 bg-card/80 p-2">
        <Textarea
          rows={3}
          value={correctionText}
          onChange={(e) => setCorrectionText(e.target.value)}
          placeholder="Escribe la respuesta correcta que debería haber dado..."
        />
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => void submit()}
            disabled={saving || !correctionText.trim()}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Guardar corrección
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
            Cancelar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-1 flex max-w-[85%] flex-wrap items-center gap-1.5">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={cn(
          "h-6 px-2 text-xs",
          status === "correct" ? "text-success" : "text-muted-foreground hover:text-success",
        )}
        onClick={markCorrect}
      >
        <ThumbsUp className="h-3 w-3" aria-hidden="true" /> Correcto
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className={cn(
          "h-6 px-2 text-xs",
          status === "corrected" ? "text-primary" : "text-muted-foreground hover:text-primary",
        )}
        onClick={openEdit}
      >
        {status === "corrected" ? (
          <Pencil className="h-3 w-3" aria-hidden="true" />
        ) : (
          <Wand2 className="h-3 w-3" aria-hidden="true" />
        )}
        {status === "corrected" ? "Editar corrección" : "Corregir"}
      </Button>
      {status === "corrected" && (
        <span className="inline-flex items-center gap-1 text-xs text-success">
          <Check className="h-3 w-3" aria-hidden="true" /> Guardada
        </span>
      )}
    </div>
  );
}
