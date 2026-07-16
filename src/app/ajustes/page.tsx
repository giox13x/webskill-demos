import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SettingsForm } from "@/components/settings-form";

export default function AjustesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <Link href="/" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Volver a los ejemplos
      </Link>
      <h1 className="mb-1 text-xl font-semibold">Ajustes</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        API keys y modelo por defecto para todos los ejemplos.
      </p>
      <SettingsForm />
    </div>
  );
}
