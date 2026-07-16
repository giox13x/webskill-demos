import { notFound } from "next/navigation";
import { loadExample } from "@/lib/examples";
import { supabaseAdmin } from "@/lib/supabase";
import { CompanyInfoForm } from "@/components/company-info-form";
import type { ExampleFileRow } from "@/lib/types";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function EjemploInfoPage({ params }: PageProps) {
  const { slug } = await params;
  const example = await loadExample(slug);
  if (!example) notFound();

  const db = supabaseAdmin();
  const { data: files } = await db
    .from("example_files")
    .select("id, filename, content_type, summary, status, created_at")
    .eq("example_id", example.id)
    .order("created_at", { ascending: false });

  return (
    <CompanyInfoForm
      example={example}
      files={(files ?? []) as Omit<ExampleFileRow, "raw_text" | "example_id">[]}
    />
  );
}
