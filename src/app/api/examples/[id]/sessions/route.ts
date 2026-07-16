import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { loadExample } from "@/lib/examples";

interface Ctx {
  params: Promise<{ id: string }>;
}

export interface SessionSummary {
  sessionId: string;
  messageCount: number;
  lastMessageAt: string;
  lastMessage: string;
}

// Lista las conversaciones de clientes (una por cada visitante del enlace
// público /probar/[slug]) agregando los mensajes por session_id. Se excluye
// la sesión "admin" — esa es el chat de prueba interno del equipo.
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const example = await loadExample(id);
  if (!example) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const db = supabaseAdmin();
  const { data, error } = await db
    .from("example_messages")
    .select("session_id, role, content, created_at")
    .eq("example_id", example.id)
    .neq("session_id", "admin")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[api/examples/:id/sessions GET]", error);
    return NextResponse.json({ error: "No se pudieron cargar las conversaciones" }, { status: 500 });
  }

  const map = new Map<string, SessionSummary>();
  for (const m of data ?? []) {
    const prev = map.get(m.session_id);
    map.set(m.session_id, {
      sessionId: m.session_id,
      messageCount: (prev?.messageCount ?? 0) + 1,
      lastMessageAt: m.created_at,
      lastMessage: m.content,
    });
  }

  const sessions = Array.from(map.values()).sort((a, b) =>
    b.lastMessageAt.localeCompare(a.lastMessageAt),
  );

  return NextResponse.json({ sessions });
}
