import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { isUuid } from "@/lib/utils";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("examples")
    .select("*")
    .eq(isUuid(id) ? "id" : "slug", id)
    .maybeSingle();

  if (error) {
    console.error("[api/examples/:id GET]", error);
    return NextResponse.json({ error: "Error al cargar el ejemplo" }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json({ example: data });
}

const PatchSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  clientInfo: z.string().max(40000).optional(),
  instructions: z.string().max(40000).optional(),
  rules: z.string().max(40000).optional(),
  restrictions: z.string().max(40000).optional(),
  provider: z.enum(["openai", "anthropic", "gemini"]).nullable().optional(),
  model: z.string().max(200).nullable().optional(),
  agentName: z.string().max(60).optional(),
  agentAvatarKey: z.string().max(50).optional(),
  businessName: z.string().max(120).optional(),
});

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const parsed = PatchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }
  const b = parsed.data;
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (b.name !== undefined) update.name = b.name;
  if (b.clientInfo !== undefined) update.client_info = b.clientInfo;
  if (b.instructions !== undefined) update.instructions = b.instructions;
  if (b.rules !== undefined) update.rules = b.rules;
  if (b.restrictions !== undefined) update.restrictions = b.restrictions;
  if (b.provider !== undefined) update.provider = b.provider;
  if (b.model !== undefined) update.model = b.model;
  if (b.agentName !== undefined) update.agent_name = b.agentName;
  if (b.agentAvatarKey !== undefined) update.agent_avatar_key = b.agentAvatarKey;
  if (b.businessName !== undefined) update.business_name = b.businessName;

  const db = supabaseAdmin();
  const { error } = await db.from("examples").update(update).eq("id", id);
  if (error) {
    console.error("[api/examples/:id PATCH]", error);
    return NextResponse.json({ error: "No se pudo guardar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const db = supabaseAdmin();
  const { error } = await db.from("examples").delete().eq("id", id);
  if (error) {
    console.error("[api/examples/:id DELETE]", error);
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
