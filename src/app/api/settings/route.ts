import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { getAppSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await getAppSettings();
    // No devolvemos las keys completas al cliente, solo si están configuradas.
    return NextResponse.json({
      openaiConfigured: Boolean(settings.openaiApiKey),
      anthropicConfigured: Boolean(settings.anthropicApiKey),
      geminiConfigured: Boolean(settings.geminiApiKey),
      defaultProvider: settings.defaultProvider,
      defaultModel: settings.defaultModel,
    });
  } catch (err) {
    console.error("[api/settings GET]", err);
    return NextResponse.json({ error: "No se pudo cargar la configuración" }, { status: 500 });
  }
}

const PutSchema = z.object({
  openaiApiKey: z.string().optional(),
  anthropicApiKey: z.string().optional(),
  geminiApiKey: z.string().optional(),
  defaultProvider: z.enum(["openai", "anthropic", "gemini"]),
  defaultModel: z.string().min(1),
});

export async function PUT(req: NextRequest) {
  const parsed = PutSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const body = parsed.data;
  const db = supabaseAdmin();

  const update: Record<string, unknown> = {
    default_provider: body.defaultProvider,
    default_model: body.defaultModel,
    updated_at: new Date().toISOString(),
  };
  // Solo sobrescribe una key si viene con contenido — así el formulario puede
  // dejar el campo vacío para "no cambiar" (nunca se manda la key real de vuelta).
  if (body.openaiApiKey) update.openai_api_key = body.openaiApiKey;
  if (body.anthropicApiKey) update.anthropic_api_key = body.anthropicApiKey;
  if (body.geminiApiKey) update.gemini_api_key = body.geminiApiKey;

  const { error } = await db.from("app_settings").update(update).eq("id", 1);
  if (error) {
    console.error("[api/settings PUT]", error);
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
