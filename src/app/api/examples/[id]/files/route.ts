import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { loadExample } from "@/lib/examples";
import { getAppSettings, apiKeyFor } from "@/lib/settings";
import { summarizeKnowledgeText } from "@/lib/ai";
import { defaultModelFor, type ProviderKey } from "@/lib/models";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const example = await loadExample(id);
  if (!example) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("example_files")
    .select("id, filename, content_type, summary, status, created_at")
    .eq("example_id", example.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[api/examples/:id/files GET]", error);
    return NextResponse.json({ error: "No se pudo cargar la lista" }, { status: 500 });
  }
  return NextResponse.json({ files: data ?? [] });
}

const PostSchema = z.object({
  filename: z.string().min(1).max(200),
  contentType: z.string().max(100).nullable().optional(),
  text: z.string().min(1).max(60000),
});

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const parsed = PostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const example = await loadExample(id);
  if (!example) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const db = supabaseAdmin();
  const { filename, contentType, text } = parsed.data;

  const { data: inserted, error: insertError } = await db
    .from("example_files")
    .insert({
      example_id: example.id,
      filename,
      content_type: contentType ?? null,
      raw_text: text,
      status: "pending",
    })
    .select("id, filename, content_type, summary, status, created_at")
    .single();

  if (insertError || !inserted) {
    console.error("[api/examples/:id/files POST insert]", insertError);
    return NextResponse.json({ error: "No se pudo guardar el archivo" }, { status: 500 });
  }

  // Procesamos en el momento: la IA extrae/resume lo útil para la base de
  // conocimiento del agente. Si falla, dejamos el archivo en estado "error"
  // pero no perdemos el texto original (se puede reintentar).
  try {
    const settings = await getAppSettings();
    const provider: ProviderKey = example.provider ?? settings.defaultProvider;
    const model: string =
      example.model ?? (provider === settings.defaultProvider ? settings.defaultModel : defaultModelFor(provider));
    const apiKey = apiKeyFor(settings, provider);

    if (!apiKey) {
      await db.from("example_files").update({ status: "error" }).eq("id", inserted.id);
      return NextResponse.json(
        {
          file: { ...inserted, status: "error" },
          warning: `Falta configurar la API key de ${provider} en Ajustes para procesar archivos.`,
        },
        { status: 201 },
      );
    }

    const summary = await summarizeKnowledgeText({ provider, model, apiKey, filename, text });
    const finalSummary = summary && summary !== "SIN_CONTENIDO_UTIL" ? summary : null;

    const { data: updated } = await db
      .from("example_files")
      .update({ status: "processed", summary: finalSummary })
      .eq("id", inserted.id)
      .select("id, filename, content_type, summary, status, created_at")
      .single();

    return NextResponse.json({ file: updated ?? inserted }, { status: 201 });
  } catch (err) {
    console.error("[api/examples/:id/files POST process]", err);
    await db.from("example_files").update({ status: "error" }).eq("id", inserted.id);
    return NextResponse.json(
      { file: { ...inserted, status: "error" }, warning: "No se pudo procesar con IA, se guardó el texto." },
      { status: 201 },
    );
  }
}
