import { notFound } from "next/navigation";
import { loadExample } from "@/lib/examples";
import { supabaseAdmin } from "@/lib/supabase";
import { InstructionsForm } from "@/components/instructions-form";
import type { ExampleCorrectionRow } from "@/lib/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EjemploInstruccionesPage({ params }: PageProps) {
  const { slug } = await params;
  const example = await loadExample(slug);
  if (!example) notFound();

  const db = supabaseAdmin();
  const { data: corrections } = await db
    .from("example_corrections")
    .select("*")
    .eq("example_id", example.id)
    .order("created_at", { ascending: false });

  return (
    <InstructionsForm example={example} corrections={(corrections ?? []) as ExampleCorrectionRow[]} />
  );
}
