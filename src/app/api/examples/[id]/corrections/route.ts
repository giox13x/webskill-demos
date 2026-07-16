import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { loadExample } from "@/lib/examples";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const example = await loadExample(id);
  if (!example) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("example_corrections")
    .select("*")
    .eq("example_id", example.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[api/examples/:id/corrections GET]", error);
    return NextResponse.json({ error: "No se pudo cargar" }, { status: 500 });
  }
  return NextResponse.json({ corrections: data ?? [] });
}

const PostSchema = z.object({
  originalMessage: z.string().min(1).max(2000),
  wrongResponse: z.string().min(1).max(4000),
  correctedResponse: z.string().min(1).max(4000),
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
  const { data, error } = await db
    .from("example_corrections")
    .insert({
      example_id: example.id,
      original_message: parsed.data.originalMessage,
      wrong_response: parsed.data.wrongResponse,
      corrected_response: parsed.data.correctedResponse,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[api/examples/:id/corrections POST]", error);
    return NextResponse.json({ error: "No se pudo guardar la corrección" }, { status: 500 });
  }
  return NextResponse.json({ correction: data }, { status: 201 });
}
