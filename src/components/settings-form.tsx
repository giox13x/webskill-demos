"use client";

import { useEffect, useState } from "react";
import { Loader2, Save, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MODEL_CATALOG, PROVIDER_LABEL, modelsForProvider, type ProviderKey } from "@/lib/models";

interface SettingsStatus {
  openaiConfigured: boolean;
  anthropicConfigured: boolean;
  geminiConfigured: boolean;
  defaultProvider: ProviderKey;
  defaultModel: string;
}

export function SettingsForm() {
  const [status, setStatus] = useState<SettingsStatus | null>(null);
  const [openaiApiKey, setOpenaiApiKey] = useState("");
  const [anthropicApiKey, setAnthropicApiKey] = useState("");
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [defaultProvider, setDefaultProvider] = useState<ProviderKey>("openai");
  const [defaultModel, setDefaultModel] = useState("gpt-4o-mini");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/settings");
        const json = (await res.json()) as SettingsStatus;
        setStatus(json);
        setDefaultProvider(json.defaultProvider);
        setDefaultModel(json.defaultModel);
      } catch {
        setError("No se pudo cargar la configuración actual");
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openaiApiKey: openaiApiKey || undefined,
          anthropicApiKey: anthropicApiKey || undefined,
          geminiApiKey: geminiApiKey || undefined,
          defaultProvider,
          defaultModel,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "No se pudo guardar");
        return;
      }
      setOpenaiApiKey("");
      setAnthropicApiKey("");
      setGeminiApiKey("");
      setSaved(true);
      const refreshed = await fetch("/api/settings");
      setStatus((await refreshed.json()) as SettingsStatus);
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="glass">
        <CardHeader>
          <CardTitle>API keys por proveedor</CardTitle>
          <CardDescription>
            Se usan para generar las respuestas del agente en todos los ejemplos que no tengan su
            propia key. Deja un campo en blanco para no cambiar la key ya guardada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="openai-key">
              OpenAI {status?.openaiConfigured && <CheckCircle2 className="ml-1 inline h-3.5 w-3.5 text-success" aria-label="Configurada" />}
            </Label>
            <Input
              id="openai-key"
              type="password"
              placeholder={status?.openaiConfigured ? "•••••••••••••• (ya configurada)" : "sk-..."}
              value={openaiApiKey}
              onChange={(e) => setOpenaiApiKey(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="anthropic-key">
              Anthropic (Claude) {status?.anthropicConfigured && <CheckCircle2 className="ml-1 inline h-3.5 w-3.5 text-success" aria-label="Configurada" />}
            </Label>
            <Input
              id="anthropic-key"
              type="password"
              placeholder={status?.anthropicConfigured ? "•••••••••••••• (ya configurada)" : "sk-ant-..."}
              value={anthropicApiKey}
              onChange={(e) => setAnthropicApiKey(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gemini-key">
              Google (Gemini) {status?.geminiConfigured && <CheckCircle2 className="ml-1 inline h-3.5 w-3.5 text-success" aria-label="Configurada" />}
            </Label>
            <Input
              id="gemini-key"
              type="password"
              placeholder={status?.geminiConfigured ? "•••••••••••••• (ya configurada)" : "AIza..."}
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              autoComplete="off"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Modelo por defecto</CardTitle>
          <CardDescription>
            El proveedor y modelo que usará cada ejemplo nuevo, salvo que lo cambies dentro de ese
            ejemplo.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="default-provider">Proveedor</Label>
            <Select
              id="default-provider"
              value={defaultProvider}
              onChange={(e) => {
                const provider = e.target.value as ProviderKey;
                setDefaultProvider(provider);
                setDefaultModel(modelsForProvider(provider)[0]?.id ?? "");
              }}
            >
              {MODEL_CATALOG.map((p) => (
                <option key={p.provider} value={p.provider}>
                  {PROVIDER_LABEL[p.provider]}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="default-model">Modelo</Label>
            <Select
              id="default-model"
              value={defaultModel}
              onChange={(e) => setDefaultModel(e.target.value)}
            >
              {modelsForProvider(defaultProvider).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
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
        Guardar ajustes
      </Button>
    </form>
  );
}
