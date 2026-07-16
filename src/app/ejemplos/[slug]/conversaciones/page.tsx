import { notFound } from "next/navigation";
import { loadExample } from "@/lib/examples";
import { supabaseAdmin } from "@/lib/supabase";
import { ConversationsPanel } from "@/components/conversations-panel";
import { CorrectionsList } from "@/components/corrections-list";
import type { ExampleCorrectionRow } from "@/lib/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EjemploConversacionesPage({ params }: PageProps) {
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
    <div className="space-y-6">
      <ConversationsPanel exampleId={example.id} />
      <CorrectionsList exampleId={example.id} initialCorrections={(corrections ?? []) as ExampleCorrectionRow[]} />
    </div>
  );
}
