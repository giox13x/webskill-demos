import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { loadExample } from "@/lib/examples";

interface Ctx {
  params: Promise<{ id: string; correctionId: string }>;
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id, correctionId } = await params;
  const example = await loadExample(id);
  if (!example) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const db = supabaseAdmin();
  const { error } = await db
    .from("example_corrections")
    .delete()
    .eq("id", correctionId)
    .eq("example_id", example.id);

  if (error) {
    console.error("[api/examples/:id/corrections/:correctionId DELETE]", error);
    return NextResponse.json({ error: "No se pudo eliminar" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
