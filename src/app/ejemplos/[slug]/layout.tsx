import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { loadExample } from "@/lib/examples";
import { ExampleNav } from "@/components/example-nav";
import { PublicLinks } from "@/components/public-links";

export const dynamic = "force-dynamic";

interface LayoutProps {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
}

export default async function EjemploLayout({ params, children }: LayoutProps) {
  const { slug } = await params;
  const example = await loadExample(slug);
  if (!example) notFound();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a los ejemplos
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="mb-1 text-xl font-semibold">{example.name}</h1>
          <p className="text-sm text-muted-foreground">
            Chatea con el agente y configura cómo debe responder.
          </p>
        </div>
        <PublicLinks slug={example.slug} />
      </div>

      <ExampleNav slug={example.slug} />

      {children}
    </div>
  );
}
