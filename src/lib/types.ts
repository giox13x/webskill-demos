import type { ProviderKey } from "./models";

export interface AppSettings {
  openaiApiKey: string | null;
  anthropicApiKey: string | null;
  geminiApiKey: string | null;
  defaultProvider: ProviderKey;
  defaultModel: string;
}

export interface ExampleRow {
  id: string;
  name: string;
  slug: string;
  client_info: string;
  instructions: string;
  rules: string;
  restrictions: string;
  provider: ProviderKey | null;
  model: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExampleMessageRow {
  id: string;
  example_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}
