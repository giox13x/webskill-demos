import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { loadExample } from "@/lib/examples";
import { getAppSettings, apiKeyFor } from "@/lib/settings";
import { summarizeKnowledgeText } from "@/lib/ai";
import { defaultModelFor, type ProviderKey } from "@/lib/models";

interface Ctx {
  params: Promise<{ id: string; fileId: string }>;
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id, fileId } = await params;
  const example = await loadExample(id);
  if (!example) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const db = supabaseAdmin();
  const { error } = await db.from("example_files").delete().eq("id", fileId).eq("example_id", example.id);
  if (error) {
    console.error("[api/examples/:id/files/:fileId DELETE]", error);
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

// Reintenta el procesado IA de un archivo que quedó en estado "error".
export async function POST(_req: NextRequest, { params }: Ctx) {
  const { id, fileId } = await params;
  const example = await loadExample(id);
  if (!example) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const db = supabaseAdmin();
  const { data: file } = await db
    .from("example_files")
    .select("*")
    .eq("id", fileId)
    .eq("example_id", example.id)
    .maybeSingle();

  if (!file) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });

  try {
    const settings = await getAppSettings();
    const provider: ProviderKey = example.provider ?? settings.defaultProvider;
    const model: string =
      example.model ?? (provider === settings.defaultProvider ? settings.defaultModel : defaultModelFor(provider));
    const apiKey = apiKeyFor(settings, provider);

    if (!apiKey) {
      return NextResponse.json(
        { error: `Falta configurar la API key de ${provider} en Ajustes.` },
        { status: 400 },
      );
    }

    const summary = await summarizeKnowledgeText({
      provider,
      model,
      apiKey,
      filename: file.filename,
      text: file.raw_text,
    });
    const finalSummary = summary && summary !== "SIN_CONTENIDO_UTIL" ? summary : null;

    const { data: updated, error } = await db
      .from("example_files")
      .update({ status: "processed", summary: finalSummary })
      .eq("id", file.id)
      .select("id, filename, content_type, summary, status, created_at")
      .single();

    if (error) throw error;
    return NextResponse.json({ file: updated });
  } catch (err) {
    console.error("[api/examples/:id/files/:fileId POST reprocess]", err);
    await db.from("example_files").update({ status: "error" }).eq("id", file.id);
    return NextResponse.json({ error: "No se pudo procesar el archivo" }, { status: 502 });
  }
}
