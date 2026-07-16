import Link from "next/link";
import { ExternalLink, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PROVIDER_LOGOS } from "@/components/provider-logos";
import { PROVIDER_LABEL, type ProviderKey } from "@/lib/models";

interface Props {
  id: string;
  name: string;
  slug: string;
  provider: ProviderKey | null;
  model: string | null;
  createdAt: string;
}

export function ExampleCard({ name, slug, provider, model }: Props) {
  const Logo = provider ? PROVIDER_LOGOS[provider] : null;

  return (
    <Card className="glass h-full transition-transform hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/ejemplos/${slug}`}>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/15 text-primary">
              <MessageSquare className="h-4 w-4" aria-hidden="true" />
            </div>
            {Logo && <Logo className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
          </div>
          <CardTitle className="mt-2 line-clamp-2">{name}</CardTitle>
        </CardHeader>
      </Link>
      <CardContent className="flex items-center justify-between gap-2">
        <Link href={`/ejemplos/${slug}`}>
          <Badge variant="secondary">
            {provider ? PROVIDER_LABEL[provider] : "Modelo por defecto"}
            {model ? ` · ${model}` : ""}
          </Badge>
        </Link>
        <Link
          href={`/probar/${slug}`}
          target="_blank"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
        >
          Probar <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}
