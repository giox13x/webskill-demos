"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FilesPanel } from "@/components/files-panel";
import type { ExampleFileRow, ExampleRow } from "@/lib/types";

type FileListItem = Omit<ExampleFileRow, "raw_text" | "example_id">;

interface Props {
  example: ExampleRow;
  files: FileListItem[];
}

export function CompanyInfoForm({ example, files }: Props) {
  const router = useRouter();
  const [clientInfo, setClientInfo] = useState(example.client_info ?? "");
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
        body: JSON.stringify({ clientInfo }),
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
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Card className="glass">
          <CardHeader>
            <CardTitle>Información del cliente</CardTitle>
            <CardDescription>
              Negocio, horarios, servicios, precios, ubicación... todo lo que el agente debe saber para
              responder como este cliente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              rows={8}
              value={clientInfo}
              onChange={(e) => setClientInfo(e.target.value)}
              placeholder="Ej. Clínica Dental Sulí, Madrid. Horario L-V 9:00-20:00. Servicios: limpieza, ortodoncia, implantes. Primera consulta gratuita..."
            />
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

      <FilesPanel exampleId={example.id} initialFiles={files} />

      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-sm text-destructive">Zona de peligro</CardTitle>
          <CardDescription>Elimina este ejemplo y todo su historial de chat, archivos y correcciones.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={deleting}
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
            Eliminar ejemplo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
