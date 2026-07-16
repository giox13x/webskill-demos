// Catálogo de proveedores y modelos soportados. Editable — añade o renombra
// modelos aquí a medida que salgan nuevas versiones.

export type ProviderKey = "openai" | "anthropic" | "gemini";

export interface CatalogModel {
  id: string; // id del modelo tal cual lo espera el SDK del proveedor
  label: string; // nombre amigable
  recommendation: string;
}

export interface CatalogProvider {
  provider: ProviderKey;
  label: string;
  models: CatalogModel[];
}

export const MODEL_CATALOG: CatalogProvider[] = [
  {
    provider: "openai",
    label: "OpenAI",
    models: [
      {
        id: "gpt-4o",
        label: "GPT-4o",
        recommendation: "El más potente. Para conversaciones complejas y ventas consultivas.",
      },
      {
        id: "gpt-4o-mini",
        label: "GPT-4o Mini",
        recommendation: "Mejor equilibrio calidad/costo. Recomendado por defecto.",
      },
      {
        id: "gpt-4.1-mini",
        label: "GPT-4.1 Mini",
        recommendation: "Rápido y económico para respuestas cortas de alto volumen.",
      },
    ],
  },
  {
    provider: "anthropic",
    label: "Anthropic (Claude)",
    models: [
      {
        id: "claude-opus-4-5-20251101",
        label: "Claude Opus 4.5",
        recommendation: "El más potente de Anthropic. Razonamiento complejo.",
      },
      {
        id: "claude-sonnet-4-5-20250929",
        label: "Claude Sonnet 4.5",
        recommendation: "Buen equilibrio calidad/costo. Recomendado por defecto si usas Claude.",
      },
      {
        id: "claude-haiku-4-5-20251001",
        label: "Claude Haiku 4.5",
        recommendation: "Rápido y económico para alto volumen.",
      },
    ],
  },
  {
    provider: "gemini",
    label: "Google (Gemini)",
    models: [
      {
        id: "gemini-2.5-pro",
        label: "Gemini 2.5 Pro",
        recommendation: "El más potente de Gemini.",
      },
      {
        id: "gemini-2.5-flash",
        label: "Gemini 2.5 Flash",
        recommendation: "Buen equilibrio calidad/costo. Recomendado por defecto si usas Gemini.",
      },
      {
        id: "gemini-2.5-flash-lite",
        label: "Gemini 2.5 Flash-Lite",
        recommendation: "Rapidísimo y barato para alto volumen.",
      },
    ],
  },
];

export const PROVIDER_LABEL: Record<ProviderKey, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic (Claude)",
  gemini: "Google (Gemini)",
};

export function defaultModelFor(provider: ProviderKey): string {
  return MODEL_CATALOG.find((p) => p.provider === provider)?.models[1]?.id
    ?? MODEL_CATALOG.find((p) => p.provider === provider)?.models[0]?.id
    ?? "";
}

export function modelsForProvider(provider: ProviderKey): CatalogModel[] {
  return MODEL_CATALOG.find((p) => p.provider === provider)?.models ?? [];
}
