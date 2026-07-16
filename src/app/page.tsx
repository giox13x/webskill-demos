import Link from "next/link";
import { Settings, Sparkles } from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { NewExampleForm } from "@/components/new-example-form";
import { ExampleCard } from "@/components/example-card";
import type { ProviderKey } from "@/lib/models";

export const dynamic = "force-dynamic";

async function loadExamples() {
  const db = supabaseAdmin();
  const { data } = await db
    .from("examples")
    .select("id, name, slug, provider, model, created_at")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export default async function HomePage() {
  const examples = await loadExamples();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Webskill Demos</h1>
            <p className="text-sm text-muted-foreground">
              Crea demos de agentes de WhatsApp para tus clientes y prospectos.
            </p>
          </div>
        </div>
        <Link href="/ajustes">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" aria-hidden="true" />
            Ajustes
          </Button>
        </Link>
      </header>

      <div className="glass-strong mb-8 rounded-lg border border-border/50 p-4">
        <NewExampleForm />
      </div>

      {examples.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center">
          <p className="text-sm text-muted-foreground">
            Todavía no tienes ejemplos. Crea el primero escribiendo el nombre del cliente arriba
            — ej. &ldquo;Clínica Dental Sulí&rdquo;.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {examples.map((ex) => (
            <ExampleCard
              key={ex.id}
              id={ex.id}
              name={ex.name}
              slug={ex.slug}
              provider={ex.provider as ProviderKey | null}
              model={ex.model}
              createdAt={ex.created_at}
            />
          ))}
        </div>
      )}
    </div>
  );
}
