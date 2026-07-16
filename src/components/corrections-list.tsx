"use client";

import { useState } from "react";
import { GraduationCap, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { ExampleCorrectionRow } from "@/lib/types";

interface Props {
  exampleId: string;
  initialCorrections: ExampleCorrectionRow[];
}

export function CorrectionsList({ exampleId, initialCorrections }: Props) {
  const [corrections, setCorrections] = useState(initialCorrections);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/examples/${exampleId}/corrections/${id}`, { method: "DELETE" });
      if (res.ok) setCorrections((prev) => prev.filter((c) => c.id !== id));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <GraduationCap className="h-4 w-4 text-primary" aria-hidden="true" />
          Correcciones aprendidas
        </CardTitle>
        <CardDescription>
          Se enseñan desde el enlace de corrección (cuando alguien del equipo marca una respuesta como
          incorrecta y escribe la respuesta correcta). El agente las tiene en cuenta a partir de ahora.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {corrections.length === 0 ? (
          <p className="text-xs text-muted-foreground">Todavía no hay correcciones enseñadas.</p>
        ) : (
          <ul className="space-y-3">
            {corrections.map((c) => (
              <li key={c.id} className="rounded-md border border-border/60 bg-card/60 p-3 text-xs">
                <p className="mb-1 text-muted-foreground">Pregunta: &ldquo;{c.original_message}&rdquo;</p>
                <p className="mb-1 text-destructive/80 line-through decoration-destructive/40">
                  {c.wrong_response}
                </p>
                <p className="mb-2 font-medium text-foreground">{c.corrected_response}</p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => void handleDelete(c.id)}
                  disabled={deletingId === c.id}
                  className="h-6 px-2 text-destructive hover:text-destructive"
                >
                  {deletingId === c.id ? (
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                  ) : (
                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                  )}
                  Olvidar
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
