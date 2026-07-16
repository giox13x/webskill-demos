import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { ConfigForm } from "@/components/config-form";
import { ChatPanel } from "@/components/chat-panel";
import type { ExampleRow } from "@/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function loadExample(slug: string): Promise<ExampleRow | null> {
  const db = supabaseAdmin();
  const { data } = await db.from("examples").select("*").eq("slug", slug).maybeSingle();
  return (data as ExampleRow) ?? null;
}

export default async function EjemploPage({ params }: PageProps) {
  const { slug } = await params;
  const example = await loadExample(slug);
  if (!example) notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a los ejemplos
      </Link>
      <h1 className="mb-1 text-xl font-semibold">{example.name}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Configura las instrucciones del agente y pruébalo en el chat de la derecha.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
        <ConfigForm example={example} />
        <div className="lg:sticky lg:top-6 lg:self-start">
          <ChatPanel exampleId={example.id} exampleName={example.name} />
        </div>
      </div>
    </div>
  );
}
