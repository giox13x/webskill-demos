"use client";

import { useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Clock, FileText, Loader2, Paperclip, RotateCw, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ExampleFileRow, FileStatus } from "@/lib/types";

type FileListItem = Omit<ExampleFileRow, "raw_text" | "example_id">;

interface Props {
  exampleId: string;
  initialFiles: FileListItem[];
}

const TEXT_EXTENSIONS = [".txt", ".md", ".markdown", ".csv", ".json", ".tsv", ".log"];

function statusBadge(status: FileStatus) {
  switch (status) {
    case "processed":
      return (
        <span className="inline-flex items-center gap-1 text-xs text-success">
          <CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Procesado
        </span>
      );
    case "error":
      return (
        <span className="inline-flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" aria-hidden="true" /> Error
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" aria-hidden="true" /> Procesando…
        </span>
      );
  }
}

export function FilesPanel({ exampleId, initialFiles }: Props) {
  const [files, setFiles] = useState<FileListItem[]>(initialFiles);
  const [pasteName, setPasteName] = useState("");
  const [pasteText, setPasteText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function uploadPayload(filename: string, contentType: string | null, text: string) {
    setUploading(true);
    setError(null);
    try {
      const res = await fetch(`/api/examples/${exampleId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename, contentType, text }),
      });
      const json = (await res.json()) as { file?: FileListItem; warning?: string; error?: string };
      if (!res.ok) {
        setError(json.error ?? "No se pudo subir el archivo");
        return;
      }
      if (json.file) setFiles((prev) => [json.file as FileListItem, ...prev]);
      if (json.warning) setError(json.warning);
    } catch {
      setError("Error de conexión");
    } finally {
      setUploading(false);
    }
  }

  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const isTextLike =
      file.type.startsWith("text/") ||
      TEXT_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext));
    if (!isTextLike) {
      setError(
        "Por ahora solo se procesan archivos de texto (.txt, .md, .csv, .json). Para PDFs o Word, copia y pega el texto abajo.",
      );
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const text = await file.text();
    await uploadPayload(file.name, file.type || null, text);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handlePasteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!pasteText.trim()) return;
    await uploadPayload(pasteName.trim() || "Texto pegado", "text/plain", pasteText.trim());
    setPasteName("");
    setPasteText("");
  }

  async function handleDelete(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/examples/${exampleId}/files/${id}`, { method: "DELETE" });
      if (res.ok) setFiles((prev) => prev.filter((f) => f.id !== id));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReprocess(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/examples/${exampleId}/files/${id}`, { method: "POST" });
      const json = (await res.json()) as { file?: FileListItem; error?: string };
      if (res.ok && json.file) {
        setFiles((prev) => prev.map((f) => (f.id === id ? (json.file as FileListItem) : f)));
      } else {
        setError(json.error ?? "No se pudo reprocesar");
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Paperclip className="h-4 w-4 text-primary" aria-hidden="true" />
          Datos y archivos
        </CardTitle>
        <CardDescription>
          Sube listas de precios, catálogos, FAQs o cualquier dato del negocio. La IA lo procesa y lo usa
          como base de conocimiento del agente. Admite texto pegado o archivos .txt/.md/.csv/.json.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={uploading}>
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            Subir archivo
          </Button>
          <input ref={inputRef} type="file" className="hidden" onChange={(e) => void handleFileInput(e)} />
        </div>

        <form onSubmit={handlePasteSubmit} className="space-y-2 rounded-md border border-dashed border-border/60 p-3">
          <Input
            value={pasteName}
            onChange={(e) => setPasteName(e.target.value)}
            placeholder="Nombre (ej. Lista de precios 2026)"
          />
          <Textarea
            rows={3}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="O pega aquí el texto directamente (precios, servicios, FAQs...)"
          />
          <Button type="submit" size="sm" disabled={uploading || !pasteText.trim()}>
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Upload className="h-3.5 w-3.5" aria-hidden="true" />}
            Añadir
          </Button>
        </form>

        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
            {error}
          </p>
        )}

        {files.length === 0 ? (
          <p className="text-xs text-muted-foreground">Todavía no hay archivos ni datos añadidos.</p>
        ) : (
          <ul className="space-y-2">
            {files.map((f) => (
              <li
                key={f.id}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-md border border-border/60 bg-card/60 px-3 py-2 text-sm",
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <span className="truncate">{f.filename}</span>
                  {statusBadge(f.status)}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {f.status === "error" && (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      title="Reintentar"
                      onClick={() => void handleReprocess(f.id)}
                      disabled={busyId === f.id}
                    >
                      {busyId === f.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
                      )}
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    title="Eliminar"
                    onClick={() => void handleDelete(f.id)}
                    disabled={busyId === f.id}
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
