import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
export const gemini = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Fast everyday-study model. Override in Vercel with GEMINI_MODEL when needed.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
const REQUEST_TIMEOUT_MS = 15000;

export function getGeminiClient() {
  if (!gemini) throw new Error("GEMINI_API_KEY or AI_API_KEY is not configured");
  return gemini;
}

export function getGeminiConfig(systemInstruction?: string, useWebSearch = true) {
  return {
    ...(systemInstruction ? { systemInstruction } : {}),
    ...(useWebSearch ? { tools: [{ googleSearch: {} }] } : {}),
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Gemini request timed out after ${ms / 1000}s`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export type WebSource = { title: string; url: string };

export function extractWebSources(response: any): WebSource[] {
  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!Array.isArray(chunks)) return [];

  const seen = new Set<string>();
  const sources: WebSource[] = [];
  for (const chunk of chunks) {
    const url = chunk?.web?.uri;
    const title = chunk?.web?.title;
    if (!url || typeof url !== "string" || seen.has(url)) continue;
    seen.add(url);
    sources.push({ title: typeof title === "string" && title ? title : url, url });
  }
  return sources.slice(0, 8);
}

export function formatWebSources(sources: WebSource[]) {
  if (!sources.length) return "";
  return `\n\n## Sources\n${sources.map((source, index) => `${index + 1}. ${source.title} — ${source.url}`).join("\n")}`;
}

export async function generateGeminiContent(prompt: string, systemInstruction?: string) {
  const client = getGeminiClient();
  const response = await withTimeout(
    client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: getGeminiConfig(systemInstruction, true),
    }),
    REQUEST_TIMEOUT_MS,
  );
  return `${response.text || ""}${formatWebSources(extractWebSources(response))}`.trim();
}

/** Stream Gemini output immediately while Google Search grounding runs when useful. */
export async function streamGeminiContent(prompt: string, systemInstruction?: string) {
  const client = getGeminiClient();
  return client.models.generateContentStream({
    model: GEMINI_MODEL,
    contents: prompt,
    config: getGeminiConfig(systemInstruction, true),
  });
}
