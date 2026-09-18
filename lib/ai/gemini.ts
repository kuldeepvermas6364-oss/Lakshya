import { GoogleGenAI } from "@google/genai";\nimport { randomInt } from "node:crypto";

const apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
export const gemini = apiKey ? new GoogleGenAI({ apiKey }) : null;

// Fast everyday-study model. Override in Vercel with GEMINI_MODEL when needed.
export const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";\nexport const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL?.trim() || "gemini-3.1-flash-image";
const REQUEST_TIMEOUT_MS = 15000;
const SEARCH_TIMEOUT_MS = 4500;\n\n// Keep the two Gemini lanes on roughly a 50/50 split without changing any Vercel env names.\n// The image lane can return text as well as images, so it is safe for normal study answers.\nfunction getImageLaneClient() {\n  const key = process.env.GEMINI_IMAGE_API_KEY;\n  if (!key) return null;\n  return new GoogleGenAI({ apiKey: key });\n}\n\nexport function useImageAILane() {\n  return randomInt(0, 2) === 1 && Boolean(process.env.GEMINI_IMAGE_API_KEY);\n}\n\nexport function getStudyAIConfig(systemInstruction?: string) {\n  return {\n    ...(systemInstruction ? { systemInstruction } : {}),\n    responseModalities: ["TEXT"],\n  };\n}

export function getGeminiClient() {
  if (!gemini) throw new Error("GEMINI_API_KEY or AI_API_KEY is not configured");
  return gemini;
}

export function getGeminiConfig(systemInstruction?: string, useGoogleSearch = false) {
  return {
    ...(systemInstruction ? { systemInstruction } : {}),
    ...(useGoogleSearch ? { tools: [{ googleSearch: {} }] } : {}),
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Request timed out after ${ms / 1000}s`)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

export type WebSource = { title: string; url: string; content?: string };

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

function shouldSearchWeb(message: string) {
  const text = message.toLowerCase();
  return /\b(latest|today|current|recent|news|update|updates|search|web|internet|check|verify|source|sources|price|prices|202[4-9]|203\d)\b|अभी|आज|लेटेस्ट|ताज़ा|वेब|सर्च|चेक|जानकारी/.test(text);
}

async function searchWithParallel(query: string): Promise<WebSource[]> {
  const key = process.env.PARALLEL_API_KEY;
  if (!key) return [];

  const response = await withTimeout(
    fetch("https://api.parallel.ai/v1/search", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": key },
      body: JSON.stringify({
        objective: `Find reliable, current information needed to answer this student question: ${query}`,
        search_queries: [query],
        mode: "turbo",
      }),
    }).then(async (res) => {
      if (!res.ok) throw new Error(`Parallel Search ${res.status}`);
      return res.json();
    }),
    SEARCH_TIMEOUT_MS,
  );

  return (Array.isArray(response?.results) ? response.results : [])
    .slice(0, 5)
    .map((item: any) => ({
      title: typeof item?.title === "string" ? item.title : item?.url || "Web source",
      url: typeof item?.url === "string" ? item.url : "",
      content: Array.isArray(item?.excerpts) ? item.excerpts.slice(0, 2).join(" ") : "",
    }))
    .filter((item: WebSource) => item.url);
}

async function searchWithTavily(query: string): Promise<WebSource[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];

  const response = await withTimeout(
    fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        search_depth: "fast",
        max_results: 5,
        chunks_per_source: 2,
        include_answer: false,
        include_raw_content: false,
        include_images: false,
      }),
    }).then(async (res) => {
      if (!res.ok) throw new Error(`Tavily Search ${res.status}`);
      return res.json();
    }),
    SEARCH_TIMEOUT_MS,
  );

  return (Array.isArray(response?.results) ? response.results : [])
    .map((item: any) => ({
      title: typeof item?.title === "string" ? item.title : item?.url || "Web source",
      url: typeof item?.url === "string" ? item.url : "",
      content: typeof item?.content === "string" ? item.content : "",
    }))
    .filter((item: WebSource) => item.url);
}

export async function searchWeb(query: string): Promise<WebSource[]> {
  if (!shouldSearchWeb(query)) return [];

  const [parallel, tavily] = await Promise.allSettled([
    searchWithParallel(query),
    searchWithTavily(query),
  ]);

  const combined = [
    ...(parallel.status === "fulfilled" ? parallel.value : []),
    ...(tavily.status === "fulfilled" ? tavily.value : []),
  ];

  const unique = new Map<string, WebSource>();
  for (const source of combined) {
    if (!source.url || unique.has(source.url)) continue;
    unique.set(source.url, source);
  }
  return [...unique.values()].slice(0, 8);
}

export function buildWebContext(sources: WebSource[]) {
  if (!sources.length) return "";
  return sources
    .map((source, index) => `SOURCE ${index + 1}\nTitle: ${source.title}\nURL: ${source.url}\nExcerpt: ${source.content || ""}`)
    .join("\n\n");
}

export async function generateGeminiContent(prompt: string, systemInstruction?: string) {
  const client = getGeminiClient();
  const response = await withTimeout(
    client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: getGeminiConfig(systemInstruction, false),
    }),
    REQUEST_TIMEOUT_MS,
  );
  return `${response.text || ""}`.trim();
}

/** Stream Gemini output immediately. Live web search is performed separately and only when needed. */
export async function streamGeminiContent(prompt: string, systemInstruction?: string) {
  const client = getGeminiClient();
  return client.models.generateContentStream({
    model: GEMINI_MODEL,
    contents: prompt,
    config: getGeminiConfig(systemInstruction, false),
  });
}
