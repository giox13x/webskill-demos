import { supabaseAdmin } from "./supabase";
import type { AppSettings } from "./types";
import type { ProviderKey } from "./models";

export async function getAppSettings(): Promise<AppSettings> {
  const db = supabaseAdmin();
  const { data, error } = await db
    .from("app_settings")
    .select("openai_api_key, anthropic_api_key, gemini_api_key, default_provider, default_model")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw error;

  return {
    openaiApiKey: data?.openai_api_key ?? null,
    anthropicApiKey: data?.anthropic_api_key ?? null,
    geminiApiKey: data?.gemini_api_key ?? null,
    defaultProvider: (data?.default_provider as ProviderKey) ?? "openai",
    defaultModel: data?.default_model ?? "gpt-4o-mini",
  };
}

export function apiKeyFor(settings: AppSettings, provider: ProviderKey): string | null {
  switch (provider) {
    case "openai":
      return settings.openaiApiKey;
    case "anthropic":
      return settings.anthropicApiKey;
    case "gemini":
      return settings.geminiApiKey;
    default:
      return null;
  }
}
