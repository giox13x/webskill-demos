import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { ProviderKey } from "./models";
import type { ExampleCorrectionRow, ExampleFileRow } from "./types";

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

// Resume/extrae lo esencial de un texto largo subido como archivo/dato, para
// usarlo como base de conocimiento del agente sin inflar el prompt.
export async function summarizeKnowledgeText({
  provider,
  model,
  apiKey,
  filename,
  text,
}: {
  provider: ProviderKey;
  model: string;
  apiKey: string;
  filename: string;
  text: string;
}): Promise<string> {
  const resolved = resolveModel(provider, model, apiKey);
  const { text: summary } = await generateText({
    model: resolved,
    system:
      "Extraes y organizas la información útil de documentos de negocio (precios, servicios, horarios, " +
      "políticas, FAQs, datos de contacto...) para que un agente de atención al cliente la use como " +
      "base de conocimiento. Responde solo con la información extraída, organizada en frases o listas " +
      "claras, en español, sin comentarios ni introducciones. Si el texto no aporta nada útil, responde " +
      "exactamente: SIN_CONTENIDO_UTIL.",
    messages: [
      {
        role: "user",
        content: `Archivo: ${filename}\n\nContenido:\n${text.slice(0, 12000)}`,
      },
    ],
    maxRetries: 1,
  });
  return summary.trim();
}

function buildKnowledgeBlock(files: ExampleFileRow[]): string | null {
  const usable = files.filter((f) => f.status === "processed" && f.summary?.trim());
  if (usable.length === 0) return null;
  const items = usable.map((f) => `— ${f.filename}:\n${f.summary!.trim()}`).join("\n\n");
  return `BASE DE CONOCIMIENTO (extraída de archivos/datos subidos por el equipo):\n${items}`;
}

function buildCorrectionsBlock(corrections: ExampleCorrectionRow[]): string | null {
  if (corrections.length === 0) return null;
  const items = corrections
    .slice(-15)
    .map(
      (c) =>
        `Pregunta: "${c.original_message}"\nRespuesta incorrecta a evitar: "${c.wrong_response}"\nRespuesta correcta: "${c.corrected_response}"`,
    )
    .join("\n\n");
  return (
    "CORRECCIONES APRENDIDAS — el equipo ya corrigió estos errores, no los repitas. " +
    `Si te preguntan algo parecido, responde en la línea de la respuesta correcta:\n\n${items}`
  );
}

// Construye el system prompt a partir de la configuración del ejemplo:
// instrucciones, reglas (qué sí), restricciones (qué no), info del cliente,
// base de conocimiento (archivos) y correcciones aprendidas.
export function buildSystemPrompt(opts: {
  clientName: string;
  clientInfo: string;
  instructions: string;
  rules: string;
  restrictions: string;
  agentName?: string;
  files?: ExampleFileRow[];
  corrections?: ExampleCorrectionRow[];
}): string {
  const agentName = opts.agentName?.trim() || "el asistente";
  const businessName = opts.clientName || "este negocio";

  const parts: string[] = [];

  parts.push(
    `Eres ${agentName}, el agente de WhatsApp de "${businessName}". ` +
      `Respondes de forma natural, breve y útil, como lo haría una persona real por WhatsApp — en español, sin sonar robótico.`,
  );

  if (opts.clientInfo.trim()) {
    parts.push(`INFORMACIÓN DEL NEGOCIO / CLIENTE:\n${opts.clientInfo.trim()}`);
  }

  const knowledgeBlock = opts.files ? buildKnowledgeBlock(opts.files) : null;
  if (knowledgeBlock) parts.push(knowledgeBlock);

  if (opts.instructions.trim()) {
    parts.push(`INSTRUCCIONES DEL AGENTE:\n${opts.instructions.trim()}`);
  }

  if (opts.rules.trim()) {
    parts.push(`REGLAS — QUÉ SÍ DEBE HACER:\n${opts.rules.trim()}`);
  }

  if (opts.restrictions.trim()) {
    parts.push(`RESTRICCIONES — QUÉ NUNCA DEBE HACER:\n${opts.restrictions.trim()}`);
  }

  const correctionsBlock = opts.corrections ? buildCorrectionsBlock(opts.corrections) : null;
  if (correctionsBlock) parts.push(correctionsBlock);

  parts.push(
    "Esto es una demo de prueba: nunca reveles que eres una IA de OpenAI/Anthropic/Google, " +
      "mantente siempre en el personaje del negocio descrito arriba.",
  );

  const raw = parts.join("\n\n");

  // Sustituye variables tipo {{agent_name}} / {{business_name}} que el
  // equipo use dentro de las instrucciones, reglas o restricciones pegadas
  // (igual que en el SaaS principal).
  return raw.replaceAll("{{agent_name}}", agentName).replaceAll("{{business_name}}", businessName);
}
