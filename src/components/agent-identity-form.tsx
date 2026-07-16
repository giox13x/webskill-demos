"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AvatarPicker } from "@/components/avatar-picker";
import { DEFAULT_AVATAR_KEY } from "@/lib/avatars";
import type { ExampleRow } from "@/lib/types";

interface Props {
  example: ExampleRow;
}

export function AgentIdentityForm({ example }: Props) {
  const router = useRouter();
  const [agentName, setAgentName] = useState(example.agent_name || "Carlos");
  const [businessName, setBusinessName] = useState(example.business_name || "");
  const [avatarKey, setAvatarKey] = useState(example.agent_avatar_key || DEFAULT_AVATAR_KEY);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

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
          agentName: agentName.trim() || "Carlos",
          agentAvatarKey: avatarKey,
          businessName: businessName.trim(),
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

  async function handleResetChats() {
    if (
      !window.confirm(
        "¿Reiniciar todas las conversaciones de este ejemplo? Se borrará tu chat de prueba y también las conversaciones de todos los clientes que hayan probado el enlace público. No se puede deshacer.",
      )
    )
      return;
    setResetting(true);
    try {
      await fetch(`/api/examples/${example.id}/chat?all=1`, { method: "DELETE" });
      router.refresh();
    } finally {
      setResetting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <CardTitle>Identidad del agente</CardTitle>
          <CardDescription>
            El nombre y el avatar con los que el bot se presenta, como &ldquo;Carlos&rdquo; en el SaaS
            principal. Usa <code>{"{{agent_name}}"}</code> y <code>{"{{business_name}}"}</code> dentro de
            las instrucciones, reglas o restricciones para que se sustituyan automáticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="agent-name">Nombre del agente</Label>
              <Input
                id="agent-name"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                placeholder="Ej. Carlos"
                maxLength={60}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="business-name">Nombre de la empresa</Label>
              <Input
                id="business-name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={`Ej. ${example.name} — si lo dejas vacío se usa este nombre`}
                maxLength={120}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Avatar</Label>
            <AvatarPicker name={agentName} value={avatarKey} onChange={setAvatarKey} />
          </div>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {saved && !error && <p className="text-sm text-success">Guardado.</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="h-4 w-4" aria-hidden="true" />
          )}
          Guardar
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => void handleResetChats()}
          disabled={resetting}
          className="text-muted-foreground hover:text-destructive"
        >
          {resetting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          )}
          Reiniciar todas las conversaciones
        </Button>
      </div>
    </form>
  );
}
