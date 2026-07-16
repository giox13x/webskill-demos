"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MODEL_CATALOG, PROVIDER_LABEL, modelsForProvider, type ProviderKey } from "@/lib/models";
import type { ExampleRow } from "@/lib/types";

interface Props {
  example: ExampleRow;
}

export function ConfigForm({ example }: Props) {
  const router = useRouter();
  const [clientInfo, setClientInfo] = useState(example.client_info ?? "");
  const [instructions, setInstructions] = useState(example.instructions ?? "");
  const [rules, setRules] = useState(example.rules ?? "");
  const [restrictions, setRestrictions] = useState(example.restrictions ?? "");
  const [provider, setProvider] = useState<ProviderKey | "">(example.provider ?? "");
  const [model, setModel] = useState(example.model ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
          clientInfo,
          instructions,
          rules,
          restrictions,
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

  async function handleDelete() {
    if (!window.confirm(`¿Eliminar el ejemplo "${example.name}"? No se puede deshacer.`)) return;
    setDeleting(true);
    try {
      await fetch(`/api/examples/${example.id}`, { method: "DELETE" });
      router.push("/");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <CardTitle>Información del cliente</CardTitle>
          <CardDescription>
            Negocio, horarios, servicios, precios, ubicación... todo lo que el agente debe saber
            para responder como este cliente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={6}
            value={clientInfo}
            onChange={(e) => setClientInfo(e.target.value)}
            placeholder="Ej. Clínica Dental Sulí, Madrid. Horario L-V 9:00-20:00. Servicios: limpieza, ortodoncia, implantes. Primera consulta gratuita..."
          />
        </CardContent>
      </Card>

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

      <Card className="glass">
        <CardHeader>
          <CardTitle className="text-sm">Modelo de este ejemplo</CardTitle>
          <CardDescription>
            Déjalo en &ldquo;Por defecto&rdquo; para usar el proveedor/modelo configurado en Ajustes.
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

      <div className="flex items-center justify-between gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          Guardar
        </Button>
        <Button type="button" variant="ghost" onClick={handleDelete} disabled={deleting} className="text-destructive hover:text-destructive">
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
          Eliminar ejemplo
        </Button>
      </div>
    </form>
  );
}
