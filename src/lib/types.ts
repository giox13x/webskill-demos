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
  agent_name: string;
  agent_avatar_key: string;
  created_at: string;
  updated_at: string;
}

export interface ExampleMessageRow {
  id: string;
  example_id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export type FileStatus = "pending" | "processed" | "error";

export interface ExampleFileRow {
  id: string;
  example_id: string;
  filename: string;
  content_type: string | null;
  raw_text: string;
  summary: string | null;
  status: FileStatus;
  created_at: string;
}

export interface ExampleCorrectionRow {
  id: string;
  example_id: string;
  original_message: string;
  wrong_response: string;
  corrected_response: string;
  created_at: string;
}
