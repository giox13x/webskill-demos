import { supabaseAdmin } from "./supabase";
import { isUuid } from "./utils";
import type { ExampleRow } from "./types";

// Carga un ejemplo por id (uuid) o por slug — usado tanto por páginas como
// por rutas de API que reciben el mismo parámetro dinámico [id]/[slug].
export async function loadExample(idOrSlug: string): Promise<ExampleRow | null> {
  const db = supabaseAdmin();
  const { data } = await db
    .from("examples")
    .select("*")
    .eq(isUuid(idOrSlug) ? "id" : "slug", idOrSlug)
    .maybeSingle();
  return (data as ExampleRow) ?? null;
}
