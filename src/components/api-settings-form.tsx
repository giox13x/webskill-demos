"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MODEL_CATALOG, PROVIDER_LABEL, modelsForProvider, type ProviderKey } from "@/lib/models";
import type { ExampleRow } from "@/lib/types";

interface Props {
  example: ExampleRow;
}

export function ApiSettingsForm({ example }: Props) {
  const router = useRouter();
  const [provider, setProvider] = useState<ProviderKey | "">(example.provider ?? "");
  const [model, setModel] = useState(example.model ?? "");
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
        body: JSON.stringify({
          provider: provider || null,
          model: provider ? model || null : null,
        }),
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <CardTitle>API y modelo de este ejemplo</CardTitle>
          <CardDescription>
            Déjalo en &ldquo;Por defecto&rdquo; para usar el proveedor, modelo y API key configurados en
            los Ajustes globales. Elige uno concreto solo si este ejemplo debe usar un proveedor distinto.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="provider">Proveedor</Label>
            <Select
              id="provider"
              value={provider}
              onChange={(e) => {
                const next = e.target.value as ProviderKey | "";
                setProvider(next);
                setModel(next ? modelsForProvider(next)[0]?.id ?? "" : "");
              }}
            >
              <option value="">Por defecto (Ajustes)</option>
              {MODEL_CATALOG.map((p) => (
                <option key={p.provider} value={p.provider}>
                  {PROVIDER_LABEL[p.provider]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="model">Modelo</Label>
            <Select
              id="model"
              value={model}
              disabled={!provider}
              onChange={(e) => setModel(e.target.value)}
            >
              {provider ? (
                modelsForProvider(provider).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))
              ) : (
                <option value="">—</option>
              )}
            </Select>
          </div>
        </CardContent>
      </Card>

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
  );
}
