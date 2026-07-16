import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase";
import { slugify } from "@/lib/utils";

export async function GET() {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("examples")
    .select("id, name, slug, provider, model, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[api/examples GET]", error);
    return NextResponse.json({ error: "No se pudieron cargar los ejemplos" }, { status: 500 });
  }
  return NextResponse.json({ examples: data ?? [] });
}

const PostSchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio").max(120),
});

async function uniqueSlug(db: ReturnType<typeof supabaseAdmin>, base: string): Promise<string> {
  let candidate = base;
  let n = 2;
  // Intenta el slug base, y si ya existe le añade -2, -3, ...
  while (true) {
    const { data } = await db.from("examples").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${n}`;
    n += 1;
  }
}

export async function POST(req: NextRequest) {
  const parsed = PostSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Datos inválidos" },
      { status: 400 },
    );
  }
  const db = supabaseAdmin();
  const slug = await uniqueSlug(db, slugify(parsed.data.name));

  const { data, error } = await db
    .from("examples")
    .insert({ name: parsed.data.name, slug })
    .select("id, slug")
    .single();

  if (error) {
    console.error("[api/examples POST]", error);
    return NextResponse.json({ error: "No se pudo crear el ejemplo" }, { status: 500 });
  }
  return NextResponse.json({ id: data.id, slug: data.slug });
}
