"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Link2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  slug: string;
}

export function PublicLinks({ slug }: Props) {
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState<"normal" | "corregir" | null>(null);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const normalUrl = origin ? `${origin}/probar/${slug}` : "";
  const corregirUrl = origin ? `${origin}/probar/${slug}?corregir=1` : "";

  async function copy(url: string, which: "normal" | "corregir") {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(which);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // noop — el navegador puede bloquear el portapapeles sin HTTPS
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void copy(normalUrl, "normal")}
        disabled={!origin}
        title={normalUrl}
      >
        {copied === "normal" ? (
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Link2 className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        Enlace para el cliente
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => void copy(corregirUrl, "corregir")}
        disabled={!origin}
        title={corregirUrl}
      >
        {copied === "corregir" ? (
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Wand2 className="h-3.5 w-3.5" aria-hidden="true" />
        )}
        Enlace de corrección
      </Button>
      {origin && (
        <a
          href={normalUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Abrir <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
