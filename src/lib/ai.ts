import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { ProviderKey } from "./models";

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateReplyArgs {
  provider: ProviderKey;
  model: string;
  apiKey: string;
  systemPrompt: string;
  messages: ChatMsg[];
}

function resolveModel(provider: ProviderKey, model: string, apiKey: string) {
  switch (provider) {
    case "openai": {
      const openai = createOpenAI({ apiKey });
      return openai(model);
    }
    case "anthropic": {
      const anthropic = createAnthropic({ apiKey });
      return anthropic(model);
    }
    case "gemini": {
      const google = createGoogleGenerativeAI({ apiKey });
      return google(model);
    }
    default:
      throw new Error(`Proveedor desconocido: ${provider}`);
  }
}

export async function generateReply({
  provider,
  model,
  apiKey,
  systemPrompt,
  messages,
}: GenerateReplyArgs): Promise<string> {
  const resolved = resolveModel(provider, model, apiKey);
  const { text } = await generateText({
    model: resolved,
    system: systemPrompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    maxRetries: 1,
  });
  return text.trim();
}

// Construye el system prompt a partir de la configuración del ejemplo:
// instrucciones, reglas (qué sí), restricciones (qué no) e info del cliente.
export function buildSystemPrompt(opts: {
  clientName: string;
  clientInfo: string;
  instructions: string;
  rules: string;
  restrictions: string;
}): string {
  const parts: string[] = [];

  parts.push(
    `Eres el agente de WhatsApp de "${opts.clientName || "este negocio"}". ` +
      `Respondes de forma natural, breve y útil, como lo haría una persona real por WhatsApp — en español, sin sonar robótico.`,
  );

  if (opts.clientInfo.trim()) {
    parts.push(`INFORMACIÓN DEL NEGOCIO / CLIENTE:\n${opts.clientInfo.trim()}`);
  }

  if (opts.instructions.trim()) {
    parts.push(`INSTRUCCIONES DEL AGENTE:\n${opts.instructions.trim()}`);
  }

  if (opts.rules.trim()) {
    parts.push(`REGLAS — QUÉ SÍ DEBE HACER:\n${opts.rules.trim()}`);
  }

  if (opts.restrictions.trim()) {
    parts.push(`RESTRICCIONES — QUÉ NUNCA DEBE HACER:\n${opts.restrictions.trim()}`);
  }

  parts.push(
    "Esto es una demo de prueba: nunca reveles que eres una IA de OpenAI/Anthropic/Google, " +
      "mantente siempre en el personaje del negocio descrito arriba.",
  );

  return parts.join("\n\n");
}
