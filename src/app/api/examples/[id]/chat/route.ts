import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { getAppSettings, apiKeyFor } from "@/lib/settings";
import { buildSystemPrompt, generateReply } from "@/lib/ai";
import { defaultModelFor } from "@/lib/models";
import type { ProviderKey } from "@/lib/models";
import { isUuid } from "@/lib/utils";

interface Ctx {
  params: Promise<{ id: string }>;
}

const MAX_HISTORY_TURNS = 20;

async function loadExample(id: string) {
  const db = supabaseAdmin();
  const { data } = await db
    .from("examples")
    .select("*")
    .eq(isUuid(id) ? "id" : "slug", id)
    .maybeSingle();
  return data;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const example = await loadExample(id);
  if (!example) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("example_messages")
    .select("role, content, created_at")
    .eq("example_id", example.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[api/examples/:id/chat GET]", error);
    return NextResponse.json({ error: "No se pudo cargar el historial" }, { status: 500 });
  }
  return NextResponse.json({ messages: data ?? [] });
}

const PostSchema = z.object({
  message: z.string().min(1).max(2000),
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
  const settings = await getAppSettings();

  const provider: ProviderKey = (example.provider as ProviderKey) ?? settings.defaultProvider;
  const model: string = example.model ?? (provider === settings.defaultProvider
    ? settings.defaultModel
    : defaultModelFor(provider));
  const apiKey = apiKeyFor(settings, provider);

  if (!apiKey) {
    return NextResponse.json(
      {
        error: `Falta configurar la API key de ${provider} en Ajustes antes de poder probar este agente.`,
      },
      { status: 400 },
    );
  }

  const { data: history } = await db
    .from("example_messages")
    .select("role, content")
    .eq("example_id", example.id)
    .order("created_at", { ascending: true });

  const priorMessages = (history ?? []).slice(-MAX_HISTORY_TURNS) as {
    role: "user" | "assistant";
    content: string;
  }[];

  const systemPrompt = buildSystemPrompt({
    clientName: example.name,
    clientInfo: example.client_info ?? "",
    instructions: example.instructions ?? "",
    rules: example.rules ?? "",
    restrictions: example.restrictions ?? "",
  });

  try {
    const replyText = await generateReply({
      provider,
      model,
      apiKey,
      systemPrompt,
      messages: [...priorMessages, { role: "user", content: parsed.data.message }],
    });

    await db.from("example_messages").insert([
      { example_id: example.id, role: "user", content: parsed.data.message },
      { example_id: example.id, role: "assistant", content: replyText },
    ]);

    return NextResponse.json({ text: replyText });
  } catch (err) {
    console.error("[api/examples/:id/chat POST]", err);
    const msg = err instanceof Error ? err.message : "Error desconocido";
    return NextResponse.json(
      { error: `No se pudo generar la respuesta (${provider}/${model}): ${msg}` },
      { status: 502 },
    );
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const example = await loadExample(id);
  if (!example) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const db = supabaseAdmin();
  const { error } = await db.from("example_messages").delete().eq("example_id", example.id);
  if (error) {
    console.error("[api/examples/:id/chat DELETE]", error);
    return NextResponse.json({ error: "No se pudo borrar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
