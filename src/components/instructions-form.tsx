"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CorrectionsList } from "@/components/corrections-list";
import type { ExampleRow, ExampleCorrectionRow } from "@/lib/types";

interface Props {
  example: ExampleRow;
  corrections: ExampleCorrectionRow[];
}

export function InstructionsForm({ example, corrections }: Props) {
  const router = useRouter();
  const [instructions, setInstructions] = useState(example.instructions ?? "");
  const [rules, setRules] = useState(example.rules ?? "");
  const [restrictions, setRestrictions] = useState(example.restrictions ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/examples/${example.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructions, rules, restrictions }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "No se pudo guardar");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Instrucciones</CardTitle>
            <CardDescription>Cómo debe comportarse y qué tono debe usar el agente.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={5}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ej. Eres la recepcionista virtual. Saluda con calidez, agenda citas y resuelve dudas sobre tratamientos. Si preguntan algo médico específico, deriva con un profesional."
            />
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-sm">Reglas — qué sí debe hacer</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={5}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder={"Una regla por línea, ej.\nOfrecer la primera consulta gratuita\nPedir nombre y teléfono para agendar"}
              />
            </CardContent>
          </Card>
          <Card className="glass">
            <CardHeader>
              <CardTitle className="text-sm">Restricciones — qué nunca debe hacer</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                rows={5}
                value={restrictions}
                onChange={(e) => setRestrictions(e.target.value)}
                placeholder={"Una restricción por línea, ej.\nNunca dar diagnósticos médicos\nNunca prometer descuentos no autorizados"}
              />
            </CardContent>
          </Card>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        {saved && !error && <p className="text-sm text-success">Guardado.</p>}

        <Button type="submit" disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          Guardar
        </Button>
      </form>

      <CorrectionsList exampleId={example.id} initialCorrections={corrections} />
    </div>
  );
}
